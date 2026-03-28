import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import MomentUploader from '../components/MomentUploader';
import {
  fetchEventsForUserWithFallback,
  mergeEventsWithProfileDetails,
  syncProfileEventDetails,
} from '../utils/fetchUserEvents';

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
              ? 'border-emerald-500/40 bg-emerald-600/15'
              : 'border-emerald-600/30 bg-emerald-50'
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
    <div className={`min-h-screen ${isDark ? 'bg-[#0B1220] text-white' : 'bg-white text-slate-900'} font-sans`}>
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
                  uploaderTitle={selectedEvent?.eventName ? `Upload to ${selectedEvent.eventName}` : 'Upload Media'}
                  triggerText="Upload Media"
                  triggerClassName={`${isDark ? 'bg-[#2a4d32] hover:bg-[#1e3b27]' : 'bg-[#2a4d32] hover:bg-[#1e3b27]'}`}
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

            {error && (
              <div className={`mt-4 rounded-xl border px-4 py-3 ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {error}
              </div>
            )}
          </div>
        </main>

        {showSelectModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50">
            <div className={`w-full max-w-2xl rounded-2xl border p-5 md:p-6 ${isDark ? 'border-white/10 bg-[#0B1220] text-white' : 'border-black/10 bg-white text-slate-900'}`}>
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
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/40'
                      : 'bg-white border-black/10 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600/40'
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

