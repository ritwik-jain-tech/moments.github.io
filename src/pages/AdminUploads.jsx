import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
import MomentUploader from '../components/MomentUploader';
import UploadWidget from '../components/UploadWidget';
import { API_BASE_URL } from '../config/api';
import { useUpload } from '../context/UploadContext';
import {
  fetchEventsForUserWithFallback,
  mergeEventsWithProfileDetails,
  syncProfileEventDetails,
} from '../utils/fetchUserEvents';

const relTime = (ms) => {
  if (!ms) return '';
  return new Date(Number(ms)).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusStyle = (status, isDark) => {
  const s = (status || '').toLowerCase();
  if (s === 'uploading' || s === 'in_progress' || s === 'started') return 'bg-emerald-500/15 text-emerald-500';
  if (s === 'paused' || s === 'pause_requested') return 'bg-amber-500/15 text-amber-500';
  if (s === 'stopped' || s === 'failed' || s === 'error') return 'bg-red-500/15 text-red-500';
  return isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-slate-600'; // completed / done
};

const AdminUploads = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');

  const isDark = theme === 'dark';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const initialProjectId = location.state?.selectedProjectId || '';
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);

  // Background upload state + persisted history (computer sessions + Google Drive syncs).
  const { activeUploads, activeRecordIds } = useUpload();
  const [records, setRecords] = useState([]);
  const [busyRecordId, setBusyRecordId] = useState(null); // record with an in-flight resume/cancel
  const [resumeToken, setResumeToken] = useState(0);       // bumped to re-open the uploader on resume

  const fetchRecords = useCallback(async () => {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) return;
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/files/upload-records?userId=${encodeURIComponent(userId)}`
      );
      setRecords(Array.isArray(data?.data) ? data.data : []);
    } catch {
      /* history is best-effort */
    }
  }, []);

  const currentUserId = () => localStorage.getItem('userId') || sessionStorage.getItem('userId');

  // Cancel any not-yet-finished record (Drive import or computer session).
  const handleCancelRecord = useCallback(async (record) => {
    const userId = currentUserId();
    if (!userId || !record?.uploadRecordId) return;
    if (!window.confirm('Cancel this upload? It will be marked as stopped.')) return;
    setBusyRecordId(record.uploadRecordId);
    try {
      await axios.post(
        `${API_BASE_URL}/api/files/upload-records/${encodeURIComponent(record.uploadRecordId)}/cancel?userId=${encodeURIComponent(userId)}`
      );
      await fetchRecords();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to cancel upload.');
    } finally {
      setBusyRecordId(null);
    }
  }, [fetchRecords]);

  // Resume a paused/failed record. Drive imports resume server-side (retrigger, idempotent).
  // Computer sessions can't resume automatically (the browser no longer holds the files), so we
  // re-open the uploader on that project — already-uploaded files are skipped on re-select.
  const handleResumeRecord = useCallback(async (record) => {
    const userId = currentUserId();
    if (!userId || !record?.uploadRecordId) return;
    const isDrive = String(record.source || '').toUpperCase().includes('DRIVE') || !!record.driveLink;
    if (isDrive) {
      setBusyRecordId(record.uploadRecordId);
      try {
        await axios.post(
          `${API_BASE_URL}/api/files/upload-records/${encodeURIComponent(record.uploadRecordId)}/retrigger?userId=${encodeURIComponent(userId)}`
        );
        await fetchRecords();
      } catch (e) {
        alert(e?.response?.data?.message || 'Failed to resume import.');
      } finally {
        setBusyRecordId(null);
      }
      return;
    }
    // Computer session: select the project and open the uploader to re-select the remaining files.
    setSelectedProjectId(String(record.eventId));
    navigate(location.pathname, { replace: true, state: { selectedProjectId: record.eventId } });
    setResumeToken((t) => t + 1);
  }, [fetchRecords, navigate, location.pathname]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  // Refresh whenever the set of live uploads changes (a finished one now has a settled record).
  useEffect(() => { fetchRecords(); }, [activeUploads.length, fetchRecords]);

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('name');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('enteredPhoneNumber');
    localStorage.removeItem('enteredPhoneNumberLast10');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('emailId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('phoneNumber');
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('userProfile');
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('enteredPhoneNumber');
    sessionStorage.removeItem('enteredPhoneNumberLast10');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('emailId');
    navigate('/admin/login');
  };

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (!userId) {
          setError('Please log in again.');
          setEvents([]);
          return;
        }
        const profileStr = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
        let parsedProfile = null;
        if (profileStr) {
          try {
            parsedProfile = JSON.parse(profileStr);
          } catch {
            parsedProfile = null;
          }
        }
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const fromApi = await fetchEventsForUserWithFallback(userId, { token });
        const merged = mergeEventsWithProfileDetails(fromApi, parsedProfile?.eventDetails);
        setEvents(merged);
        syncProfileEventDetails(merged);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to load projects.';
        setError(msg);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const selectedEvent = useMemo(() => {
    if (!selectedProjectId) return null;
    return events.find((e) => String(e?.eventId ?? e?.id) === String(selectedProjectId)) || null;
  }, [events, selectedProjectId]);

  const eventNameFor = useCallback((id) => {
    const ev = events.find((e) => String(e?.eventId ?? e?.id) === String(id));
    return ev?.eventName || ev?.name || id || 'Project';
  }, [events]);

  const pickProject = (projectId) => {
    setSelectedProjectId(projectId);
    navigate(location.pathname, { replace: true, state: { selectedProjectId: projectId } });
  };

  // Single project: auto-select it (no dropdown needed). Multiple: the user picks from the dropdown.
  useEffect(() => {
    if (!selectedProjectId && events.length === 1) {
      const only = events[0];
      setSelectedProjectId(String(only?.eventId ?? only?.id ?? ''));
    }
  }, [events, selectedProjectId]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#141C17] text-white' : 'bg-white text-slate-900'} font-sans ${isDark ? 'admin-theme-dark' : 'admin-theme-light'}`}>
      <div className="flex min-h-screen">
        <AdminSidebar
          isDark={isDark}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogout={handleLogout}
          activeKey="uploads"
          onNavigate={(key) => {
            if (key === 'home') navigate('/admin/homepage');
            else if (key === 'projects') navigate('/admin/events');
            else if (key === 'uploads') navigate('/admin/uploads');
            else if (key === 'storage') navigate('/admin/storage');
            else if (key === 'notifications') navigate('/admin/notifications');
            else if (key === 'team') navigate('/admin/team');
            else if (key === 'settings') navigate('/admin/settings');
          }}
        />

        <main className="flex-1 p-6 md:p-10">
          <div className={`max-w-6xl mx-auto ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-2xl md:text-3xl font-semibold">Uploads</div>
                <div className={`mt-1 text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                  Upload photos or link a public Google Drive folder.
                </div>
              </div>

              <div className="flex items-center gap-2">
                {events.length > 1 ? (
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => pickProject(e.target.value)}
                    className={`px-4 py-2 rounded-xl border font-semibold transition-colors outline-none ${
                      isDark
                        ? 'border-white/10 bg-[#1F2A23] text-white hover:bg-white/10'
                        : 'border-black/10 bg-white text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <option value="" disabled>Select project…</option>
                    {events.map((ev) => {
                      const id = String(ev?.eventId ?? ev?.id ?? '');
                      return <option key={id} value={id}>{ev?.eventName || ev?.name || id}</option>;
                    })}
                  </select>
                ) : events.length === 1 ? (
                  <div className={`px-4 py-2 rounded-xl border font-semibold ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-white text-slate-900'
                  }`}>
                    {selectedEvent?.eventName || selectedEvent?.name || 'Project'}
                  </div>
                ) : null}
              </div>
            </div>

            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
                Loading projects…
              </div>
            )}

            {!loading && selectedProjectId && (
              <div
                className={`rounded-2xl border p-5 md:p-6 shadow-sm ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'
                }`}
              >
                <MomentUploader
                  eventId={selectedProjectId}
                  eventName={selectedEvent?.eventName || selectedEvent?.name || ''}
                  uploaderTitle={selectedEvent?.eventName ? `Upload to ${selectedEvent.eventName}` : 'Upload Media'}
                  autoOpenToken={resumeToken}
                  triggerText="Upload Media"
                  triggerClassName={`${isDark ? 'bg-brand hover:bg-brand-2' : 'bg-brand hover:bg-brand-2'}`}
                  onUploadComplete={() => {
                    // For now we don't refetch feed here; uploads happen async and are visible in the event feed.
                  }}
                />
              </div>
            )}

            {!loading && !selectedProjectId && (
              <div className={`rounded-2xl border p-10 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                Choose a project to start uploading.
              </div>
            )}

            {/* Upload history: live session (computer) + persisted records (computer + Google Drive) */}
            {!loading && (
              <div className={`mt-6 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
                  <div className="font-semibold">Upload history</div>
                  <button
                    type="button"
                    onClick={fetchRecords}
                    className={`text-xs px-3 py-1.5 rounded-lg border ${isDark ? 'border-white/10 hover:bg-white/10' : 'border-black/10 hover:bg-slate-50'}`}
                  >
                    Refresh
                  </button>
                </div>

                <div className="divide-y divide-black/5">
                  {/* Live uploads (computer + Drive) as the same progress tiles as the floating widget. */}
                  {activeUploads.length > 0 && (
                    <div className="px-5 py-4">
                      <UploadWidget inline />
                    </div>
                  )}

                  {/* Persisted records (newest first) */}
                  {records.length === 0 && activeUploads.length === 0 && (
                    <div className={`px-5 py-8 text-center text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      No uploads yet. Uploads and Google Drive syncs will appear here.
                    </div>
                  )}
                  {records
                    // Hide records already shown as live tiles above.
                    .filter((r) => !activeRecordIds.has(r.uploadRecordId))
                    .map((r) => {
                    const isDrive = String(r.source || '').toUpperCase().includes('DRIVE') || !!r.driveLink;
                    const st = String(r.status || 'done').toLowerCase();
                    const isDone = st === 'done' || st === 'completed';
                    const isStopped = st === 'stopped';
                    const total = r.totalCount || 0;
                    const done = r.progress || 0;
                    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : (isDone ? 100 : 0);
                    const barColor = isDone ? 'bg-emerald-500'
                      : st === 'paused' ? 'bg-amber-400'
                      : (st === 'failed' || st === 'error' || isStopped) ? 'bg-red-500'
                      : 'bg-emerald-500';
                    const canResume = st === 'paused' || st === 'failed' || st === 'error';
                    const canCancel = !isDone && !isStopped;
                    const busy = busyRecordId === r.uploadRecordId;
                    return (
                      <div key={r.uploadRecordId} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-slate-600'}`}>
                                {isDrive ? 'Google Drive' : 'Computer'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusStyle(r.status, isDark)}`}>
                                {r.status || 'done'}
                              </span>
                              <span className="font-medium truncate">{eventNameFor(r.eventId)}</span>
                            </div>
                            {/* Widget-style progress bar */}
                            <div className={`h-2 rounded-full overflow-hidden mt-2 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                              <div className={`h-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <div className={`text-xs mt-1.5 ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
                              {r.creatorName || 'Unknown'} · {done}/{total} uploaded ({pct}%)
                              {r.failedCount ? ` · ${r.failedCount} failed` : ''} · {relTime(r.createdAt)}
                            </div>
                          </div>

                          {/* Per-row actions — hidden once completed. */}
                          {(canResume || canCancel) && (
                            <div className="flex items-center gap-2 shrink-0">
                              {canResume && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleResumeRecord(r)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                                >
                                  {busy ? 'Resuming…' : 'Resume'}
                                </button>
                              )}
                              {canCancel && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleCancelRecord(r)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/40 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className={`mt-4 rounded-xl border px-4 py-3 ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {error}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminUploads;

