import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, FACE_TAGGING_BASE_URL } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';

const routeForKey = (key) => {
  if (key === 'home') return '/admin/homepage';
  if (key === 'projects') return '/admin/events';
  if (key === 'uploads') return '/admin/uploads';
  if (key === 'storage') return '/admin/storage';
  if (key === 'notifications') return '/admin/notifications';
  if (key === 'team') return '/admin/team';
  if (key === 'settings') return '/admin/settings';
  return '/admin/events';
};

const BYTES_PER_GB = 1024 ** 3;
const STORAGE_LIMIT_GB = 50; // matches AdminStorage

const initialsOf = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

const last10 = (phone) => (phone ? String(phone).replace(/\D/g, '').slice(-10) : '');

const readStoredProfile = () => {
  const raw = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const AdminSettings = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');
  const isDark = theme === 'dark';

  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
  const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || '';
  // The phone number the member used to log in.
  const loginPhone = localStorage.getItem('phoneNumber') || sessionStorage.getItem('phoneNumber') || '';

  const [profile, setProfile] = useState(() => readStoredProfile());
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data sync (storage / face tagging) against the face-tagging service.
  const [syncEventId, setSyncEventId] = useState('');
  const [syncing, setSyncing] = useState({ storage: false, tagging: false });
  const [syncMsg, setSyncMsg] = useState(null);

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const authHeaders = useCallback(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    if (!userId) {
      navigate('/admin/login');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Refresh the profile from the backend using the login phone number when available.
      const phone = last10(loginPhone || profile?.phoneNumber);
      const tasks = [];
      if (phone && phone.length === 10) {
        tasks.push(
          axios
            .get(`${API_BASE_URL}/api/userProfile/phone`, {
              params: { phoneNumber: phone },
              headers: authHeaders(),
            })
            .then((res) => {
              const fresh = res.data?.data ?? res.data;
              if (!cancelled && fresh && typeof fresh === 'object') {
                setProfile(fresh);
                localStorage.setItem('userProfile', JSON.stringify(fresh));
              }
            })
            .catch(() => {})
        );
      }
      tasks.push(
        axios
          .get(`${API_BASE_URL}/api/moments/storage/overview`, {
            params: { userId },
            headers: authHeaders(),
          })
          .then((res) => {
            if (!cancelled) setStorage(res.data?.data ?? res.data ?? null);
          })
          .catch(() => {
            if (!cancelled) setStorage(null);
          })
      );
      await Promise.allSettled(tasks);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleLogout = () => {
    [
      'userId', 'phoneNumber', 'name', 'userProfile', 'isAdminLoggedIn',
      'enteredPhoneNumber', 'enteredPhoneNumberLast10', 'adminToken', 'emailId',
    ].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    navigate('/admin/login');
  };

  // -------- derived
  const name = profile?.name || 'Studio Member';
  const phone = loginPhone || profile?.phoneNumber || '';
  const email = profile?.emailId || profile?.email || '';
  const role = profile?.role || 'Photographer';

  const usedBytes =
    (Number(storage?.totalOptimisedSizeBytes) || 0) + (Number(storage?.totalThumbnailSizeBytes) || 0) ||
    Number(storage?.totalOriginalSizeBytes) || 0;
  const usedGb = usedBytes / BYTES_PER_GB;
  const usedPct = Math.min(100, Math.round((usedGb / STORAGE_LIMIT_GB) * 100));
  const eventCount = Array.isArray(storage?.events)
    ? storage.events.length
    : Array.isArray(profile?.eventIds)
      ? profile.eventIds.length
      : 0;

  // Options for the sync event picker: prefer the storage overview (has names), fall back to profile.eventIds.
  const eventOptions = useMemo(() => {
    const fromStorage = Array.isArray(storage?.events)
      ? storage.events
          .map((e) => ({ id: String(e?.eventId ?? e?.id ?? '').trim(), name: e?.eventName || e?.name || '' }))
          .filter((e) => e.id)
      : [];
    if (fromStorage.length) return fromStorage;
    const ids = Array.isArray(profile?.eventIds) ? profile.eventIds : [];
    return ids.map((id) => ({ id: String(id).trim(), name: '' })).filter((e) => e.id);
  }, [storage, profile]);

  useEffect(() => {
    if (!syncEventId && eventOptions.length === 1) setSyncEventId(eventOptions[0].id);
  }, [eventOptions, syncEventId]);

  const runSync = useCallback(
    async (kind) => {
      const ev = (syncEventId || '').trim();
      if (!ev) {
        setSyncMsg({ type: 'error', text: 'Select or enter an event ID first.' });
        return;
      }
      const path =
        kind === 'storage'
          ? `sync/storage/event/${encodeURIComponent(ev)}?scope=all&force=true`
          : `sync/face-tagging/event/${encodeURIComponent(ev)}?scope=approved&force=true`;
      setSyncing((s) => ({ ...s, [kind]: true }));
      setSyncMsg(null);
      try {
        const res = await axios.post(
          `${FACE_TAGGING_BASE_URL}/api/v1/face-embeddings/${path}`,
          null,
          { headers: authHeaders() }
        );
        const data = res.data || {};
        setSyncMsg({
          type: 'success',
          text: data.message || `${kind === 'storage' ? 'Storage' : 'Face tagging'} sync started for ${ev}.`,
        });
      } catch (e) {
        setSyncMsg({
          type: 'error',
          text: e?.response?.data?.detail || e?.message || 'Sync failed to start.',
        });
      } finally {
        setSyncing((s) => ({ ...s, [kind]: false }));
      }
    },
    [syncEventId, authHeaders]
  );

  // -------- styling
  const cardBorder = isDark ? 'border-white/10' : 'border-black/10';
  const cardBg = isDark ? 'bg-[#1A241E]' : 'bg-white';
  const subtle = isDark ? 'text-white/55' : 'text-slate-500';

  const field = (label, value, highlight = false) => (
    <div className={`rounded-xl border ${cardBorder} px-4 py-3 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
      <div className={`text-xs uppercase tracking-wide ${subtle}`}>{label}</div>
      <div className={`mt-1 text-sm font-medium break-words ${highlight ? 'text-brand' : ''}`}>
        {value || <span className={subtle}>—</span>}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#141C17] text-white' : 'bg-white text-slate-900'} font-sans ${isDark ? 'admin-theme-dark' : 'admin-theme-light'}`}>
      <div className="flex min-h-screen">
        <AdminSidebar
          isDark={isDark}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogout={handleLogout}
          activeKey="settings"
          onNavigate={(key) => navigate(routeForKey(key))}
        />

        <main className="flex-1 p-6 md:p-10 space-y-6 overflow-x-hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Account Settings</h1>
            <p className={`mt-1 text-sm ${subtle}`}>Your profile and subscription for this studio account.</p>
          </div>

          {/* Account / profile */}
          <section className={`rounded-2xl border ${cardBorder} ${cardBg} p-5 md:p-6`}>
            <div className="flex items-center gap-4">
              {profile?.selfie || profile?.avatarUrl ? (
                <img src={profile.selfie || profile.avatarUrl} alt={name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold ${isDark ? 'bg-[#2a4d32]/30 text-[#8fd2a5]' : 'bg-[#2a4d32]/10 text-[#2a4d32]'}`}>
                  {initialsOf(name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">{name}</div>
                <div className={`text-sm ${subtle}`}>Logged in as {phone ? `+${last10(phone)}` : 'this account'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              {field('Mobile number (login)', phone ? `+${last10(phone)}` : '', true)}
              {field('Email', email)}
              {field('Name', name)}
              {field('Role', typeof role === 'string' ? role : String(role))}
              {field('User ID', userId)}
              {field('Events joined', String(eventCount))}
            </div>
            {loading && <div className={`mt-3 text-xs ${subtle}`}>Refreshing profile…</div>}
          </section>

          {/* Subscription */}
          <section className={`rounded-2xl border ${cardBorder} ${cardBg} p-5 md:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Subscription</h2>
                <p className={`text-sm ${subtle}`}>Your current plan and usage.</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#2a4d32]/15 text-[#2a4d32] border border-[#2a4d32]/20">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              <div className={`rounded-xl border ${cardBorder} px-4 py-4 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                <div className={`text-xs uppercase tracking-wide ${subtle}`}>Plan</div>
                <div className="mt-1 text-xl font-semibold">Studio Pro</div>
                <div className={`text-xs mt-1 ${subtle}`}>Billed annually</div>
              </div>
              <div className={`rounded-xl border ${cardBorder} px-4 py-4 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                <div className={`text-xs uppercase tracking-wide ${subtle}`}>Storage</div>
                <div className="mt-1 text-xl font-semibold">{STORAGE_LIMIT_GB} GB</div>
                <div className={`text-xs mt-1 ${subtle}`}>Active-tier quota</div>
              </div>
              <div className={`rounded-xl border ${cardBorder} px-4 py-4 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                <div className={`text-xs uppercase tracking-wide ${subtle}`}>Projects</div>
                <div className="mt-1 text-xl font-semibold">{eventCount}</div>
                <div className={`text-xs mt-1 ${subtle}`}>Events on this account</div>
              </div>
            </div>

            <div className="mt-5">
              <div className={`flex items-center justify-between text-sm mb-1.5`}>
                <span className={subtle}>Storage used</span>
                <span className="font-medium">{usedGb < 0.01 ? '<0.01' : usedGb.toFixed(2)} GB / {STORAGE_LIMIT_GB} GB</span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                <div className="h-full bg-brand" style={{ width: `${usedPct}%` }} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="mailto:moments.live.weddings@gmail.com?subject=Manage%20my%20Moments%20Studio%20subscription"
                className="h-10 px-4 inline-flex items-center rounded-xl bg-brand hover:bg-brand-2 transition-colors text-sm font-semibold border border-[#2a4d32]/20 text-on-brand"
              >
                Manage subscription
              </a>
              <button
                onClick={() => navigate('/admin/storage')}
                className={`h-10 px-4 inline-flex items-center rounded-xl border text-sm font-semibold ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-black/10 text-slate-800 hover:bg-slate-50'}`}
              >
                View storage details
              </button>
            </div>
          </section>

          {/* Data sync */}
          <section className={`rounded-2xl border ${cardBorder} ${cardBg} p-5 md:p-6`}>
            <div>
              <h2 className="text-lg font-semibold">Data sync</h2>
              <p className={`text-sm ${subtle}`}>
                Reprocess an event's media. Both jobs run in the background — you can leave this page after starting.
              </p>
            </div>

            <div className="mt-5 max-w-md">
              <label className={`block text-xs uppercase tracking-wide mb-1.5 ${subtle}`}>Event ID</label>
              <input
                list="sync-event-options"
                value={syncEventId}
                onChange={(e) => setSyncEventId(e.target.value)}
                placeholder="Select or paste an event ID"
                className={`w-full h-10 px-3 rounded-xl border text-sm ${isDark ? 'bg-white/[0.03] border-white/15 text-white placeholder-white/40' : 'bg-white border-black/10 text-slate-900 placeholder-slate-400'}`}
              />
              <datalist id="sync-event-options">
                {eventOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name ? `${e.name} (${e.id})` : e.id}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => runSync('storage')}
                disabled={syncing.storage || syncing.tagging}
                className="h-10 px-4 inline-flex items-center rounded-xl bg-brand hover:bg-brand-2 transition-colors text-sm font-semibold border border-[#2a4d32]/20 text-on-brand disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {syncing.storage ? 'Starting…' : 'Sync storage'}
              </button>
              <button
                onClick={() => runSync('tagging')}
                disabled={syncing.storage || syncing.tagging}
                className={`h-10 px-4 inline-flex items-center rounded-xl border text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-black/10 text-slate-800 hover:bg-slate-50'}`}
              >
                {syncing.tagging ? 'Starting…' : 'Sync face tagging'}
              </button>
            </div>

            {syncMsg && (
              <div
                className={`mt-4 text-sm rounded-xl px-3 py-2 border ${
                  syncMsg.type === 'success'
                    ? 'text-[#2a4d32] bg-[#2a4d32]/10 border-[#2a4d32]/20'
                    : 'text-red-600 bg-red-500/10 border-red-500/20'
                }`}
              >
                {syncMsg.text}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
