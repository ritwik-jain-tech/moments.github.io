// Global background-upload provider. Owns one worker pool PER active computer upload session, so
// the user can run several uploads in parallel (e.g. different projects) while navigating the admin
// app. Google Drive imports run server-side; the provider polls their records and surfaces them
// through the same unified `activeUploads` list so the floating widget / Uploads tab show one
// consistent experience (live progress + pause / resume / stop) for both sources.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import {
  buildSizeAwareBatches,
  bulkUploadMomentsWithDetails,
  uploadSingleFileAndCreateMoment,
  isTooLargeError,
  isRetryableError,
  backoffDelay,
  sleep,
  getUserInfo,
  UPLOAD_CONCURRENCY,
  MAX_TRANSIENT_RETRIES,
} from '../lib/uploadEngine';

const UploadContext = createContext(null);

export const useUpload = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used within an UploadProvider');
  return ctx;
};

const emptyStats = {
  total: 0, completed: 0, failed: 0, uploading: 0, pending: 0, duplicates: 0, timeRemaining: null,
  totalBytes: 0, uploadedBytes: 0, speedBps: 0,
};
const sumFileBytes = (files) => files.reduce((s, f) => s + (f.file?.size || 0), 0);
const SESSION_ENDPOINT = (userId) =>
  `${API_BASE_URL}/api/files/upload-records/computer-session?userId=${encodeURIComponent(userId)}`;

export const UploadProvider = ({ children }) => {
  // Render-facing meta for each computer session: { id, source, eventId, eventName, uploaderName,
  // startedAt, total, recordId, isPaused, stats }.
  const [sessions, setSessions] = useState([]);
  // Drive imports discovered by polling the backend (server-driven, no client pool).
  const [driveSessions, setDriveSessions] = useState([]);

  // Per-computer-session runtime, keyed by session id (mutated without stale-closure worries).
  // rt[id] = { source, eventId, files, status, paused, canceled, running, startTime, recordId, lastSync }
  const rt = useRef({});
  const driveBoostRef = useRef(0); // poll Drive aggressively until this timestamp (after a start/action)

  const updateSession = useCallback((id, patch) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  // ---- backend session record (survives refresh) --------------------------------------------
  const countStatuses = useCallback((id) => {
    const r = rt.current[id];
    let completed = 0, failed = 0;
    if (r) {
      r.files.forEach((f) => {
        const s = r.status[f.id]?.status;
        if (s === 'completed') completed++;
        else if (s === 'error') failed++;
      });
    }
    return { completed, failed };
  }, []);

  const postSession = useCallback((id, status, { beacon = false } = {}) => {
    const r = rt.current[id];
    if (!r) return;
    const userInfo = getUserInfo();
    if (!userInfo.userId) return;
    const { completed, failed } = countStatuses(id);
    const url = SESSION_ENDPOINT(userInfo.userId);
    const payload = {
      uploadRecordId: r.recordId || undefined,
      eventId: r.eventId,
      totalCount: r.files.length,
      uploadedCount: completed,
      failedCount: failed,
      creatorName: userInfo.userName,
      status,
    };
    r.lastSync = Date.now();
    if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      } catch { /* best-effort */ }
      return;
    }
    axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } })
      .then(({ data }) => {
        const rid = data?.data?.uploadRecordId;
        if (rid && rt.current[id] && !rt.current[id].recordId) {
          rt.current[id].recordId = rid;
          updateSession(id, { recordId: rid });
        }
      })
      .catch((e) => console.warn('Upload session sync failed:', e?.message));
  }, [countStatuses, updateSession]);

  // Create the durable history record BEFORE any bytes are uploaded, and resolve once it exists so
  // the caller can await it. This guarantees the session has a single authoritative recordId that
  // every later progress sync / finalize updates in place (no duplicate rows, no stuck IN_PROGRESS).
  const createRecord = useCallback(async (id) => {
    const r = rt.current[id];
    if (!r) return null;
    if (r.recordId) return r.recordId;
    const userInfo = getUserInfo();
    if (!userInfo.userId) return null;
    try {
      const { data } = await axios.post(SESSION_ENDPOINT(userInfo.userId), {
        eventId: r.eventId,
        totalCount: r.files.length,
        uploadedCount: 0,
        failedCount: 0,
        creatorName: userInfo.userName,
        status: 'IN_PROGRESS',
      }, { headers: { 'Content-Type': 'application/json' } });
      const rid = data?.data?.uploadRecordId;
      if (rid && rt.current[id]) {
        rt.current[id].recordId = rid;
        rt.current[id].lastSync = Date.now();
        updateSession(id, { recordId: rid });
      }
      return rid || null;
    } catch (e) {
      console.warn('Upload session create failed:', e?.message);
      return null;
    }
  }, [updateSession]);

  // Heartbeat the record's progress at most every 5s so a refresh/crash leaves a fresh status that
  // the Uploads history (and floating widget) can re-show.
  const PROGRESS_SYNC_INTERVAL_MS = 5000;
  const maybeSyncProgress = useCallback((id) => {
    const r = rt.current[id];
    if (!r || !r.recordId || r.paused || r.canceled) return;
    if (Date.now() - r.lastSync < PROGRESS_SYNC_INTERVAL_MS) return;
    postSession(id, 'IN_PROGRESS');
  }, [postSession]);

  // ---- stats ---------------------------------------------------------------------------------
  const recompute = useCallback((id) => {
    const r = rt.current[id];
    if (!r) return;
    let completed = 0, failed = 0, uploading = 0, pending = 0;
    let totalBytes = 0, uploadedBytes = 0;
    r.files.forEach((f) => {
      const size = f.file?.size || 0;
      totalBytes += size;
      const s = r.status[f.id]?.status;
      if (s === 'completed') { completed++; uploadedBytes += size; }
      else if (s === 'error') failed++;
      else if (s === 'uploading') {
        uploading++;
        uploadedBytes += size * ((r.status[f.id]?.progress || 0) / 100);
      } else pending++;
    });
    const total = r.files.length;

    // Smoothed upload speed (bytes/sec) from the change in uploaded bytes between ticks. Paused
    // sessions report 0 and reset the baseline so the next resume doesn't spike.
    const now = Date.now();
    let speedBps = 0;
    if (r.paused) {
      r.lastBytes = uploadedBytes;
      r.lastBytesAt = now;
      r.lastSpeed = 0;
    } else if (r.lastBytesAt) {
      const dt = (now - r.lastBytesAt) / 1000;
      if (dt >= 0.5) {
        const inst = Math.max(0, (uploadedBytes - (r.lastBytes || 0)) / dt);
        speedBps = r.lastSpeed ? r.lastSpeed * 0.6 + inst * 0.4 : inst;
        r.lastBytes = uploadedBytes;
        r.lastBytesAt = now;
        r.lastSpeed = speedBps;
      } else {
        speedBps = r.lastSpeed || 0;
      }
    } else {
      r.lastBytes = uploadedBytes;
      r.lastBytesAt = now;
    }

    // Prefer a bytes-based ETA (remaining bytes / live speed); fall back to count-based pacing.
    let timeRemaining = null;
    const elapsed = r.startTime ? (now - r.startTime) / 1000 : 0;
    const remaining = total - completed - failed;
    const remainingBytes = Math.max(0, totalBytes - uploadedBytes);
    if (remaining <= 0) {
      timeRemaining = 0;
    } else if (speedBps > 1024) {
      timeRemaining = Math.ceil(remainingBytes / speedBps);
    } else if (completed > 0 && elapsed > 1) {
      timeRemaining = Math.ceil(remaining / (completed / elapsed));
    }
    updateSession(id, {
      total,
      stats: { total, completed, failed, uploading, pending, duplicates: r.duplicates || 0, timeRemaining, totalBytes, uploadedBytes, speedBps },
    });
    maybeSyncProgress(id);
  }, [updateSession, maybeSyncProgress]);

  // One ticker recomputes every active computer session (keeps ETA + backend heartbeat fresh).
  useEffect(() => {
    if (sessions.length === 0) return undefined;
    const iv = setInterval(() => {
      Object.keys(rt.current).forEach((id) => recompute(id));
    }, 1000);
    return () => clearInterval(iv);
  }, [sessions.length, recompute]);

  const patchStatus = useCallback((id, ids, patch) => {
    const r = rt.current[id];
    if (!r) return;
    ids.forEach((fid) => { r.status[fid] = { ...(r.status[fid] || {}), ...patch }; });
    recompute(id);
  }, [recompute]);

  // ---- one batch (upload + moment create) with transient-retry backoff -----------------------
  const processBatch = useCallback(async (id, batch, ctx) => {
    const r = rt.current[id];
    if (!r) return { outcome: 'canceled' };
    const ids = batch.map((f) => f.id);
    const onProgress = (progress) => {
      ids.forEach((fid) => { r.status[fid] = { ...(r.status[fid] || {}), progress }; });
    };
    patchStatus(id, ids, { status: 'uploading', progress: 0, error: undefined });

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (r.canceled) return { outcome: 'canceled' };
      try {
        const res = batch.length === 1
          ? await uploadSingleFileAndCreateMoment(batch[0], ctx, onProgress)
          : await bulkUploadMomentsWithDetails(batch, ctx, onProgress);
        const dup = res?.duplicates || 0;
        if (dup) r.duplicates = (r.duplicates || 0) + dup;
        patchStatus(id, ids, { status: 'completed', progress: 100, error: undefined });
        return { outcome: 'success', count: batch.length, duplicates: dup };
      } catch (error) {
        if (isTooLargeError(error)) {
          if (batch.length > 1) {
            patchStatus(id, ids, { status: 'pending', progress: 0 });
            return { outcome: 'tooLarge' };
          }
          const sizeMB = (batch[0].file.size / (1024 * 1024)).toFixed(1);
          patchStatus(id, ids, { status: 'error', progress: 0, error: `File too large for the server (${sizeMB} MB).` });
          return { outcome: 'error' };
        }
        if (isRetryableError(error) && attempt < MAX_TRANSIENT_RETRIES && !r.canceled) {
          attempt += 1;
          patchStatus(id, ids, { status: 'uploading', progress: 0, error: `Retrying (${attempt}/${MAX_TRANSIENT_RETRIES})…` });
          await sleep(backoffDelay(attempt));
          continue;
        }
        patchStatus(id, ids, { status: 'error', progress: 0, error: error.message || 'Upload failed' });
        return { outcome: 'error' };
      }
    }
  }, [patchStatus]);

  // ---- finalize + record ---------------------------------------------------------------------
  const finalize = useCallback((id, finalStatus) => {
    const r = rt.current[id];
    if (!r) return;
    let completed = 0;
    r.files.forEach((f) => { if (r.status[f.id]?.status === 'completed') completed++; });
    const resolved = finalStatus || (completed === 0 ? 'failed' : 'completed');
    const backendStatus = resolved === 'stopped' ? 'STOPPED' : resolved === 'failed' ? 'FAILED' : 'DONE';
    postSession(id, backendStatus);
    delete rt.current[id];
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, [postSession]);

  // ---- worker pool (drains pending files; cooperative pause/stop) -----------------------------
  const ensureRunning = useCallback(async (id) => {
    const r = rt.current[id];
    if (!r || r.running || r.paused || r.canceled) return;

    const pending = r.files.filter((f) => {
      const s = r.status[f.id]?.status;
      return !s || s === 'pending';
    });
    if (pending.length === 0) {
      finalize(id, 'completed');
      return;
    }

    r.running = true;
    if (!r.startTime) r.startTime = Date.now();
    const ctx = { eventId: r.eventId };
    const queue = buildSizeAwareBatches(pending);

    const worker = async () => {
      while (queue.length > 0) {
        if (r.paused || r.canceled) return;
        const batch = queue.shift();
        if (!batch) break;
        const res = await processBatch(id, batch, ctx);
        if (res.outcome === 'tooLarge') {
          const mid = Math.ceil(batch.length / 2);
          queue.unshift(batch.slice(mid));
          queue.unshift(batch.slice(0, mid));
        }
      }
    };

    const workerCount = Math.min(UPLOAD_CONCURRENCY, Math.max(1, queue.length));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    r.running = false;

    if (r.canceled) {
      r.files.forEach((f) => {
        const s = r.status[f.id]?.status;
        if (!s || s === 'pending' || s === 'uploading') r.status[f.id] = { ...(r.status[f.id] || {}), status: 'canceled' };
      });
      finalize(id, 'stopped');
      return;
    }
    if (r.paused) {
      recompute(id);
      return;
    }
    const stillPending = r.files.some((f) => {
      const s = r.status[f.id]?.status;
      return !s || s === 'pending';
    });
    if (stillPending) ensureRunning(id);
    else finalize(id);
  }, [processBatch, finalize, recompute]);

  // ---- computer session controls -------------------------------------------------------------
  const pauseComputer = useCallback((id) => {
    const r = rt.current[id];
    if (!r) return;
    r.paused = true;
    updateSession(id, { isPaused: true });
    postSession(id, 'PAUSED');
  }, [updateSession, postSession]);

  const resumeComputer = useCallback((id) => {
    const r = rt.current[id];
    if (!r) return;
    r.paused = false;
    updateSession(id, { isPaused: false });
    postSession(id, 'IN_PROGRESS');
    ensureRunning(id);
  }, [updateSession, postSession, ensureRunning]);

  const stopComputer = useCallback((id) => {
    const r = rt.current[id];
    if (!r) return;
    r.canceled = true;
    r.paused = false;
    updateSession(id, { isPaused: false });
    if (!r.running) {
      r.files.forEach((f) => {
        const s = r.status[f.id]?.status;
        if (!s || s === 'pending' || s === 'uploading') r.status[f.id] = { ...(r.status[f.id] || {}), status: 'canceled' };
      });
      finalize(id, 'stopped');
    }
  }, [updateSession, finalize]);

  // ---- public: start a computer upload (parallel sessions allowed) ---------------------------
  const startUpload = useCallback(({ eventId, eventName, files }) => {
    if (!files || files.length === 0) return { ok: false };
    const userInfo = getUserInfo();
    const eid = String(eventId);

    // Same-project upload folds into its existing session; a different project starts in parallel.
    const existingId = Object.keys(rt.current).find(
      (sid) => rt.current[sid].source === 'computer' && rt.current[sid].eventId === eid && !rt.current[sid].canceled
    );
    if (existingId) {
      const r = rt.current[existingId];
      const existing = new Set(r.files.map((f) => f.id));
      const added = files.filter((f) => !existing.has(f.id));
      r.files = [...r.files, ...added];
      added.forEach((f) => { r.status[f.id] = { status: 'pending', progress: 0 }; });
      updateSession(existingId, { total: r.files.length });
      recompute(existingId);
      ensureRunning(existingId);
      return { ok: true };
    }

    const id = `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const status = {};
    files.forEach((f) => { status[f.id] = { status: 'pending', progress: 0 }; });
    rt.current[id] = {
      source: 'computer', eventId: eid, files: [...files], status,
      paused: false, canceled: false, running: false, startTime: null, recordId: null, lastSync: 0,
      duplicates: 0,
    };
    setSessions((prev) => [...prev, {
      id, source: 'computer', eventId: eid,
      eventName: eventName || 'Selected project',
      uploaderName: userInfo.userName || 'You',
      startedAt: Date.now(), total: files.length, recordId: null, isPaused: false,
      stats: { ...emptyStats, total: files.length, pending: files.length, totalBytes: sumFileBytes(files) },
    }]);
    recompute(id);
    // Create the history record first, THEN start uploading, so a mid-flight refresh always finds a
    // persisted session to re-show. A failed create (offline / no userId) still proceeds to upload
    // rather than blocking the user.
    (async () => {
      await createRecord(id);
      if (rt.current[id]) ensureRunning(id);
    })();
    return { ok: true };
  }, [updateSession, recompute, ensureRunning, createRecord]);

  // On unload, pause each running computer session's backend record so it survives a refresh.
  useEffect(() => {
    const handler = () => {
      Object.keys(rt.current).forEach((id) => {
        const r = rt.current[id];
        if (r.source === 'computer' && r.recordId && !r.canceled && !r.paused) {
          postSession(id, 'PAUSED', { beacon: true });
        }
      });
    };
    window.addEventListener('pagehide', handler);
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('pagehide', handler);
      window.removeEventListener('beforeunload', handler);
    };
  }, [postSession]);

  // ---- Google Drive imports (server-driven, polled into the same widget) ----------------------
  const pollDrive = useCallback(async () => {
    const userInfo = getUserInfo();
    if (!userInfo.userId) return;
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/files/upload-records?userId=${encodeURIComponent(userInfo.userId)}`
      );
      const list = Array.isArray(data?.data) ? data.data : [];
      const active = list
        .filter((r) => {
          const isDrive = String(r.source || '').toUpperCase().includes('DRIVE') || !!r.driveLink;
          const st = String(r.status || '').toUpperCase();
          return isDrive && (st === 'STARTED' || st === 'IN_PROGRESS' || st === 'PAUSED');
        })
        .map((r) => {
          const total = r.totalCount || 0;
          const done = r.progress || 0;
          const failed = r.failedCount || 0;
          return {
            id: r.uploadRecordId,
            recordId: r.uploadRecordId,
            kind: 'drive',
            eventName: 'Google Drive import',
            isPaused: String(r.status || '').toUpperCase() === 'PAUSED',
            done, total, failed,
            pending: Math.max(0, total - done - failed),
            enqueued: 0,
            timeRemaining: null,
          };
        });
      setDriveSessions(active);
    } catch { /* history is best-effort */ }
  }, []);

  const notifyDriveStarted = useCallback(() => {
    driveBoostRef.current = Date.now() + 60000; // poll quickly for a minute after kickoff
    pollDrive();
  }, [pollDrive]);

  const driveAction = useCallback(async (recordId, action) => {
    const userInfo = getUserInfo();
    if (!userInfo.userId || !recordId) return;
    try {
      await axios.post(
        `${API_BASE_URL}/api/files/upload-records/${encodeURIComponent(recordId)}/${action}?userId=${encodeURIComponent(userInfo.userId)}`
      );
    } catch (e) {
      console.warn(`Drive ${action} failed:`, e?.response?.data?.message || e?.message);
    }
    driveBoostRef.current = Date.now() + 30000;
    pollDrive();
  }, [pollDrive]);

  // Poll while a Drive import is active or just kicked off; back off to idle otherwise.
  useEffect(() => {
    pollDrive(); // discover in-flight imports on mount
    const iv = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (driveSessions.length > 0 || Date.now() < driveBoostRef.current) pollDrive();
    }, 6000);
    return () => clearInterval(iv);
  }, [pollDrive, driveSessions.length]);

  // ---- unified view + dispatch ----------------------------------------------------------------
  const activeUploads = useMemo(() => {
    const computer = sessions
      .filter((s) => s.source === 'computer')
      .map((s) => ({
        id: s.id, kind: 'computer', eventName: s.eventName, isPaused: s.isPaused,
        done: s.stats.completed, total: s.stats.total, failed: s.stats.failed,
        pending: s.stats.pending, enqueued: s.stats.uploading, duplicates: s.stats.duplicates || 0,
        timeRemaining: s.stats.timeRemaining,
        totalBytes: s.stats.totalBytes, uploadedBytes: s.stats.uploadedBytes, speedBps: s.stats.speedBps,
      }));
    return [...computer, ...driveSessions];
  }, [sessions, driveSessions]);

  // Record ids currently shown as live tiles — the Uploads tab hides these from the history list.
  const activeRecordIds = useMemo(() => new Set([
    ...sessions.map((s) => s.recordId).filter(Boolean),
    ...driveSessions.map((d) => d.recordId),
  ]), [sessions, driveSessions]);

  const pauseUpload = useCallback((u) => {
    if (u.kind === 'drive') driveAction(u.recordId, 'pause');
    else pauseComputer(u.id);
  }, [driveAction, pauseComputer]);

  const resumeUpload = useCallback((u) => {
    if (u.kind === 'drive') driveAction(u.recordId, 'retrigger');
    else resumeComputer(u.id);
  }, [driveAction, resumeComputer]);

  const stopUpload = useCallback((u) => {
    if (u.kind === 'drive') driveAction(u.recordId, 'cancel');
    else stopComputer(u.id);
  }, [driveAction, stopComputer]);

  const value = useMemo(() => ({
    activeUploads,
    activeRecordIds,
    startUpload,
    notifyDriveStarted,
    pauseUpload,
    resumeUpload,
    stopUpload,
  }), [activeUploads, activeRecordIds, startUpload, notifyDriveStarted, pauseUpload, resumeUpload, stopUpload]);

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export default UploadProvider;
