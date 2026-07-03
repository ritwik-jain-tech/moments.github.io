// Global background-upload provider. Owns the upload worker pool so uploads keep running while the
// user navigates the admin app. Exposes live stats + controls (pause / resume / stop) consumed by
// the floating UploadWidget, and a session history surfaced in the Uploads tab.
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

const SESSIONS_KEY = 'moment_upload_sessions'; // local history mirror (per browser)
const MAX_LOCAL_SESSIONS = 30;

const UploadContext = createContext(null);

export const useUpload = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used within an UploadProvider');
  return ctx;
};

const emptyStats = { total: 0, completed: 0, failed: 0, uploading: 0, pending: 0, timeRemaining: null };

export const UploadProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null); // { id, eventId, eventName, uploaderName, startedAt, total }
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState(emptyStats);
  const [sessions, setSessions] = useState([]);       // history (local mirror)
  const [focusSessionId, setFocusSessionId] = useState(null);

  // Mutable state the pool reads/writes without stale closures.
  const filesRef = useRef([]);                 // active session's fileObjs
  const statusRef = useRef({});                // { fileId: { status, progress, error } }
  const sessionRef = useRef(null);             // mirror of activeSession
  const pausedRef = useRef(false);
  const canceledRef = useRef(false);
  const runningRef = useRef(false);
  const startTimeRef = useRef(null);

  // ---- history persistence -------------------------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) setSessions(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persistSessions = useCallback((next) => {
    setSessions(next);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(next.slice(0, MAX_LOCAL_SESSIONS)));
    } catch { /* ignore */ }
  }, []);

  const upsertSession = useCallback((session) => {
    setSessions((prev) => {
      const rest = prev.filter((s) => s.id !== session.id);
      const next = [session, ...rest].slice(0, MAX_LOCAL_SESSIONS);
      try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ---- stats ---------------------------------------------------------------------------------
  const recomputeStats = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {
      setStats(emptyStats);
      return;
    }
    const status = statusRef.current;
    let completed = 0, failed = 0, uploading = 0, pending = 0;
    for (const f of filesRef.current) {
      const s = status[f.id]?.status;
      if (s === 'completed') completed++;
      else if (s === 'error') failed++;
      else if (s === 'uploading') uploading++;
      else pending++; // pending / enqueued / undefined
    }
    // Rate-based ETA from work completed this run.
    let timeRemaining = null;
    const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
    const remaining = session.total - completed - failed;
    if (completed > 0 && elapsed > 1 && remaining > 0) {
      timeRemaining = Math.ceil(remaining / (completed / elapsed));
    } else if (remaining <= 0) {
      timeRemaining = 0;
    }
    setStats({ total: session.total, completed, failed, uploading, pending, timeRemaining });
  }, []);

  // Live ticker while a session is active (keeps ETA fresh even between transitions).
  useEffect(() => {
    if (!activeSession) return undefined;
    const id = setInterval(recomputeStats, 1000);
    return () => clearInterval(id);
  }, [activeSession, recomputeStats]);

  const patchStatus = useCallback((ids, patch) => {
    const status = statusRef.current;
    ids.forEach((id) => { status[id] = { ...(status[id] || {}), ...patch }; });
    recomputeStats();
  }, [recomputeStats]);

  // ---- one batch (upload + moment create) with transient-retry backoff -----------------------
  const processBatch = useCallback(async (batch, ctx) => {
    const ids = batch.map((f) => f.id);
    // Progress ticks only mutate the ref (no re-render); the 1s ticker + status transitions drive UI.
    const onProgress = (progress) => {
      const status = statusRef.current;
      ids.forEach((id) => { status[id] = { ...(status[id] || {}), progress }; });
    };
    patchStatus(ids, { status: 'uploading', progress: 0, error: undefined });

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (canceledRef.current) return { outcome: 'canceled' };
      try {
        if (batch.length === 1) await uploadSingleFileAndCreateMoment(batch[0], ctx, onProgress);
        else await bulkUploadMomentsWithDetails(batch, ctx, onProgress);
        patchStatus(ids, { status: 'completed', progress: 100, error: undefined });
        return { outcome: 'success', count: batch.length };
      } catch (error) {
        if (isTooLargeError(error)) {
          if (batch.length > 1) {
            patchStatus(ids, { status: 'pending', progress: 0 });
            return { outcome: 'tooLarge' };
          }
          const sizeMB = (batch[0].file.size / (1024 * 1024)).toFixed(1);
          patchStatus(ids, { status: 'error', progress: 0, error: `File too large for the server (${sizeMB} MB).` });
          return { outcome: 'error' };
        }
        if (isRetryableError(error) && attempt < MAX_TRANSIENT_RETRIES && !canceledRef.current) {
          attempt += 1;
          patchStatus(ids, { status: 'uploading', progress: 0, error: `Retrying (${attempt}/${MAX_TRANSIENT_RETRIES})…` });
          await sleep(backoffDelay(attempt));
          continue;
        }
        patchStatus(ids, { status: 'error', progress: 0, error: error.message || 'Upload failed' });
        return { outcome: 'error' };
      }
    }
  }, [patchStatus]);

  // ---- finalize + record ---------------------------------------------------------------------
  const finalizeSession = useCallback((finalStatus) => {
    const session = sessionRef.current;
    if (!session) return;
    const status = statusRef.current;
    let completed = 0, failed = 0;
    filesRef.current.forEach((f) => {
      const s = status[f.id]?.status;
      if (s === 'completed') completed++;
      else if (s === 'error') failed++;
    });
    const resolved = finalStatus || (completed === 0 ? 'failed' : 'completed');
    const record = {
      id: session.id,
      eventId: session.eventId,
      eventName: session.eventName,
      uploaderName: session.uploaderName,
      source: 'computer',
      startedAt: session.startedAt,
      finishedAt: Date.now(),
      total: session.total,
      completed,
      failed,
      status: resolved,
    };
    upsertSession(record);

    // Persist a durable record on the backend (merged with Drive syncs in the Uploads tab).
    try {
      const userInfo = getUserInfo();
      if (userInfo.userId) {
        axios.post(
          `${API_BASE_URL}/api/files/upload-records/computer-session?userId=${encodeURIComponent(userInfo.userId)}`,
          { eventId: session.eventId, uploadedCount: completed, failedCount: failed, creatorName: userInfo.userName },
          { headers: { 'Content-Type': 'application/json' } }
        ).catch((e) => console.warn('Failed to record upload session:', e?.message));
      }
    } catch (e) { console.warn('record session error', e); }

    // Clear active session.
    sessionRef.current = null;
    filesRef.current = [];
    statusRef.current = {};
    runningRef.current = false;
    pausedRef.current = false;
    canceledRef.current = false;
    startTimeRef.current = null;
    setActiveSession(null);
    setIsPaused(false);
    setStats(emptyStats);
  }, [upsertSession]);

  // ---- worker pool (drains pending files; cooperative pause/stop) -----------------------------
  const ensureRunning = useCallback(async () => {
    if (runningRef.current || pausedRef.current || canceledRef.current) return;
    const session = sessionRef.current;
    if (!session) return;

    const pending = filesRef.current.filter((f) => {
      const s = statusRef.current[f.id]?.status;
      return !s || s === 'pending';
    });
    if (pending.length === 0) {
      finalizeSession('completed');
      return;
    }

    runningRef.current = true;
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    const ctx = { eventId: session.eventId };
    const queue = buildSizeAwareBatches(pending);

    const worker = async () => {
      while (queue.length > 0) {
        if (pausedRef.current || canceledRef.current) return; // finish in-flight, stop pulling
        const batch = queue.shift();
        if (!batch) break;
        const res = await processBatch(batch, ctx);
        if (res.outcome === 'tooLarge') {
          const mid = Math.ceil(batch.length / 2);
          queue.unshift(batch.slice(mid));
          queue.unshift(batch.slice(0, mid));
        }
      }
    };

    const workerCount = Math.min(UPLOAD_CONCURRENCY, Math.max(1, queue.length));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    runningRef.current = false;

    if (canceledRef.current) {
      // mark leftover pending/enqueued as canceled, then finalize as stopped
      const status = statusRef.current;
      filesRef.current.forEach((f) => {
        const s = status[f.id]?.status;
        if (!s || s === 'pending' || s === 'uploading') status[f.id] = { ...(status[f.id] || {}), status: 'canceled' };
      });
      finalizeSession('stopped');
      return;
    }
    if (pausedRef.current) {
      recomputeStats();
      return; // suspended; resume() will call ensureRunning again
    }
    // Pick up any files appended while running; otherwise finalize.
    const stillPending = filesRef.current.some((f) => {
      const s = statusRef.current[f.id]?.status;
      return !s || s === 'pending';
    });
    if (stillPending) ensureRunning();
    else finalizeSession();
  }, [processBatch, finalizeSession, recomputeStats]);

  // ---- public API ----------------------------------------------------------------------------
  const startUpload = useCallback(({ eventId, eventName, files }) => {
    if (!files || files.length === 0) return { ok: false };
    const userInfo = getUserInfo();

    // Only one active session at a time. A different event must wait until the current one
    // finishes/stops, so we never corrupt the running session's file/status refs.
    if (sessionRef.current && sessionRef.current.eventId !== String(eventId)) {
      return { ok: false, reason: 'busy' };
    }

    if (sessionRef.current && sessionRef.current.eventId === String(eventId)) {
      // Append to the current session for the same event.
      const existingIds = new Set(filesRef.current.map((f) => f.id));
      const added = files.filter((f) => !existingIds.has(f.id));
      filesRef.current = [...filesRef.current, ...added];
      added.forEach((f) => { statusRef.current[f.id] = { status: 'pending', progress: 0 }; });
      const nextSession = { ...sessionRef.current, total: filesRef.current.length };
      sessionRef.current = nextSession;
      setActiveSession(nextSession);
    } else {
      // Start a fresh session (a different event replaces the current one's active view).
      const id = `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const status = {};
      files.forEach((f) => { status[f.id] = { status: 'pending', progress: 0 }; });
      statusRef.current = status;
      filesRef.current = [...files];
      pausedRef.current = false;
      canceledRef.current = false;
      startTimeRef.current = null;
      const session = {
        id,
        eventId: String(eventId),
        eventName: eventName || 'Selected project',
        uploaderName: userInfo.userName || 'You',
        startedAt: Date.now(),
        total: files.length,
      };
      sessionRef.current = session;
      setActiveSession(session);
      setIsPaused(false);
    }
    recomputeStats();
    ensureRunning();
    return { ok: true };
  }, [ensureRunning, recomputeStats]);

  const pause = useCallback(() => {
    if (!sessionRef.current) return;
    pausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (!sessionRef.current) return;
    pausedRef.current = false;
    setIsPaused(false);
    ensureRunning();
  }, [ensureRunning]);

  const stop = useCallback(() => {
    if (!sessionRef.current) return;
    canceledRef.current = true;
    pausedRef.current = false;
    setIsPaused(false);
    // If no pool is running (e.g. paused), finalize immediately.
    if (!runningRef.current) {
      const status = statusRef.current;
      filesRef.current.forEach((f) => {
        const s = status[f.id]?.status;
        if (!s || s === 'pending' || s === 'uploading') status[f.id] = { ...(status[f.id] || {}), status: 'canceled' };
      });
      finalizeSession('stopped');
    }
  }, [finalizeSession]);

  const value = useMemo(() => ({
    activeSession,
    isPaused,
    stats,
    sessions,
    focusSessionId,
    setFocusSessionId,
    startUpload,
    pause,
    resume,
    stop,
  }), [activeSession, isPaused, stats, sessions, focusSessionId, startUpload, pause, resume, stop]);

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export default UploadProvider;
