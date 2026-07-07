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
  const [showSelectModal, setShowSelectModal] = useState(!initialProjectId);
  const [projectSearch, setProjectSearch] = useState('');

  // Background upload state + persisted history (computer sessions + Google Drive syncs).
  const { activeSession } = useUpload();
  const [records, setRecords] = useState([]);
  const focusSessionId = new URLSearchParams(location.search).get('session');

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

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  // Refresh once an active session finishes (its backend record now exists).
  useEffect(() => { if (!activeSession) fetchRecords(); }, [activeSession, fetchRecords]);
  // When arrived from the floating widget (?session=id), scroll the session into view.
  useEffect(() => {
    if (!focusSessionId) return;
    const el = document.getElementById(`session-${focusSessionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusSessionId, activeSession]);

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
    return events.find((e) => e?.eventId === selectedProjectId || e?.id === selectedProjectId) || null;
  }, [events, selectedProjectId]);

  const filteredEvents = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return events;
    return events.filter((ev) => {
      const haystack = `${ev?.eventName || ev?.name || ''} ${ev?.eventId || ev?.id || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [events, projectSearch]);

  const eventNameFor = useCallback((id) => {
    const ev = events.find((e) => String(e?.eventId ?? e?.id) === String(id));
    return ev?.eventName || ev?.name || id || 'Project';
  }, [events]);

  const openSelectModal = () => setShowSelectModal(true);

  const pickProject = (projectId) => {
    setSelectedProjectId(projectId);
    setShowSelectModal(false);
    setProjectSearch('');
    navigate(location.pathname, { replace: true, state: { selectedProjectId: projectId } });
  };

  const modalCard = (ev) => {
    const id = ev?.eventId ?? ev?.id;
    const label = ev?.eventName || ev?.name || 'Untitled project';
    const active = String(id) === String(selectedProjectId);
    return (
      <button
        key={id}
        type="button"
        onClick={() => pickProject(id)}
        className={`w-full text-left rounded-xl border p-4 transition-colors ${
          active
            ? isDark
              ? 'border-[#2a4d32]/40 bg-[#2a4d32]/15'
              : 'border-[#2a4d32]/30 bg-[#2a4d32]/10'
            : isDark
              ? 'border-white/10 hover:border-white/20 bg-white/5'
              : 'border-black/10 hover:border-black/20 bg-white'
        }`}
      >
        <div className="font-semibold truncate">{label}</div>
        <div className={`text-xs mt-1 ${isDark ? 'text-white/55' : 'text-slate-500'}`}>{id}</div>
      </button>
    );
  };

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
                <button
                  type="button"
                  onClick={openSelectModal}
                  className={`px-4 py-2 rounded-xl border font-semibold transition-colors ${
                    isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-black/10 bg-white hover:bg-slate-50'
                  }`}
                >
                  {selectedEvent ? `Project: ${selectedEvent.eventName || 'Selected'}` : 'Select project'}
                </button>
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
                  {/* Live active session rendered as the same progress tile as the floating widget. */}
                  {activeSession && (
                    <div
                      id={`session-${activeSession.id}`}
                      className={`px-5 py-4 ${focusSessionId === activeSession.id ? (isDark ? 'bg-emerald-500/10' : 'bg-emerald-50') : ''}`}
                    >
                      <UploadWidget inline />
                    </div>
                  )}

                  {/* Persisted records (newest first) */}
                  {records.length === 0 && !activeSession && (
                    <div className={`px-5 py-8 text-center text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      No uploads yet. Uploads and Google Drive syncs will appear here.
                    </div>
                  )}
                  {records
                    // Hide the backend row that mirrors the currently-live session (shown as the card above).
                    .filter((r) => !(activeSession && r.uploadRecordId === activeSession.recordId))
                    .map((r) => {
                    const isDrive = String(r.source || '').toUpperCase().includes('DRIVE') || !!r.driveLink;
                    return (
                      <div key={r.uploadRecordId} className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-slate-600'}`}>
                                {isDrive ? 'Google Drive' : 'Computer'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusStyle(r.status, isDark)}`}>
                                {r.status || 'done'}
                              </span>
                              <span className="font-medium truncate">{eventNameFor(r.eventId)}</span>
                            </div>
                            <div className={`text-xs mt-1 ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
                              {r.creatorName || 'Unknown'} · {r.progress || 0}/{r.totalCount || 0} uploaded
                              {r.failedCount ? ` · ${r.failedCount} failed` : ''} · {relTime(r.createdAt)}
                            </div>
                          </div>
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

        {showSelectModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50">
            <div className={`w-full max-w-2xl rounded-2xl border p-5 md:p-6 ${isDark ? 'border-white/10 bg-[#1F2A23] text-white' : 'border-black/10 bg-white text-slate-900'}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-lg font-semibold">Select a project</div>
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'} mt-1`}>
                    Choose where your uploads and Drive imports will go.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSelectModal(false)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-black/10 bg-white hover:bg-slate-50'
                  }`}
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className={`mb-4`}>
                <input
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search projects by name or ID..."
                  className={`w-full rounded-xl px-4 py-3 outline-none border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#2a4d32]/40'
                      : 'bg-white border-black/10 text-slate-900 placeholder:text-slate-400 focus:border-[#2a4d32]/40'
                  }`}
                />
              </div>

              <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {filteredEvents.length === 0 && (
                  <div className={`rounded-xl border p-6 text-center ${isDark ? 'border-white/10 bg-white/5 text-white/60' : 'border-black/10 bg-white text-slate-600'}`}>
                    No projects found.
                  </div>
                )}

                {filteredEvents.map((ev) => modalCard(ev))}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSelectModal(false)}
                  className={`px-4 py-2 rounded-xl font-semibold border transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-black/10 bg-white hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUploads;

