import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import {
  fetchEventsForUserWithFallback,
  mergeEventsWithProfileDetails,
  syncProfileEventDetails,
} from '../utils/fetchUserEvents';
import { StorageRowsSkeleton } from '../components/ui/Skeleton';

const BYTES_PER_GB = 1024 ** 3;

function bytesToGb(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round((n / BYTES_PER_GB) * 100) / 100;
}

function formatGb(gb) {
  if (gb <= 0) return '0';
  if (gb < 0.01) return '<0.01';
  return gb.toFixed(2);
}

function getProjectStatus(ev) {
  const raw =
    ev?.status ??
    ev?.eventStatus ??
    ev?.projectStatus ??
    ev?.deliveryStatus ??
    ev?.state;
  if (!raw) return 'Active';
  const s = String(raw).toLowerCase();
  if (s.includes('deliver')) return 'Delivered';
  if (s.includes('archive')) return 'Archived';
  if (s.includes('active')) return 'Active';
  return 'Active';
}

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

/** SVG ring: percent 0–100 of quota used */
function StorageRing({ percent, sublabel, isDark }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative w-[140px] h-[140px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            strokeWidth="10"
            className={isDark ? 'stroke-white/12' : 'stroke-slate-200'}
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={isDark ? 'stroke-[#2a4d32]' : 'stroke-[#2a4d32]'}
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none px-2">
          <span className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {pct}% Used
          </span>
        </div>
      </div>
      <p className={`text-sm font-medium mt-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{sublabel}</p>
    </div>
  );
}

function UsageBar({ label, gb, pct, colorClass, trackClass, isDark }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className={isDark ? 'text-white/85' : 'text-slate-800'}>{label}</span>
        <span className={isDark ? 'text-white/55' : 'text-slate-500'}>
          {gb} GB ({pct}%)
        </span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${trackClass}`}>
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MonthTrendChart({ isDark }) {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const values = [6.2, 7.1, 8.4, 9.2, 10.8, 12.9];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const h = 120;
  const w = 280;
  const pad = 8;
  const barW = (w - pad * 2) / months.length - 4;
  return (
    <div className="w-full">
      <div className={`flex items-end justify-between gap-1 px-1 ${isDark ? 'text-white/45' : 'text-slate-400'} text-xs`} style={{ height: h }}>
        {months.map((m, i) => {
          const v = values[i];
          const barH = ((v - min) / (max - min || 1)) * (h - 28) + 12;
          return (
            <div key={m} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0">
              <div
                className={`w-full max-w-[36px] rounded-t-md ${isDark ? 'bg-[#2a4d32]/50' : 'bg-[#2a4d32]/70'}`}
                style={{ height: `${barH}px` }}
                title={`${v} GB`}
              />
              <span className="truncate w-full text-center">{m}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const AdminStorage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');
  const [profileEvents, setProfileEvents] = useState([]);
  /** eventId -> summary | { forbidden } | { error } | { empty } */
  const [storageByEventId, setStorageByEventId] = useState({});
  /** Ordered list from storage overview — drives the table so all API events appear (not only profile.eventDetails). */
  const [overviewEventRows, setOverviewEventRows] = useState([]);
  /** Server totals from GET /api/moments/storage/overview (aligned with event aggregates) */
  const [overviewTotals, setOverviewTotals] = useState(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState('');
  const isDark = theme === 'dark';

  const appBg = isDark ? 'bg-[#141C17]' : 'bg-[#F4F4F5]';
  const appText = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark ? 'bg-[#1A241E] border-white/10' : 'bg-white border-black/[0.08]';
  const cardShadow = isDark ? '' : 'shadow-sm shadow-black/5';
  const muted = isDark ? 'text-white/55' : 'text-slate-500';
  const submuted = isDark ? 'text-white/45' : 'text-slate-600';
  const tableHead = isDark ? 'bg-white/[0.06] text-white/80' : 'bg-slate-100/80 text-slate-700';
  const tableRow = isDark ? 'border-white/[0.06] hover:bg-white/[0.03]' : 'border-black/[0.06] hover:bg-slate-50/80';
  const ctaBand = isDark ? 'bg-[#1A241E] border-white/10' : 'bg-[#F0F4F1] border-[#2a4d32]/10';

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let cached = [];
      try {
        const raw = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile');
        if (raw) {
          const profile = JSON.parse(raw);
          cached = Array.isArray(profile?.eventDetails) ? profile.eventDetails : [];
        }
      } catch {
        cached = [];
      }
      if (!cancelled) setProfileEvents(cached);

      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!userId) return;
      try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const fromApi = await fetchEventsForUserWithFallback(userId, { token });
        if (cancelled) return;
        const merged = mergeEventsWithProfileDetails(fromApi, cached);
        setProfileEvents(merged);
        syncProfileEventDetails(merged);
      } catch {
        /* keep cached list */
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadStorage = useCallback(async () => {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    // Only userId is required — whitelisted-phone logins have no JWT. Attach the
    // Bearer header when we have one; the backend authorizes by userId otherwise.
    if (!userId) {
      setStorageError('Sign in again to load storage usage.');
      setStorageLoading(false);
      setStorageByEventId({});
      setOverviewEventRows([]);
      setOverviewTotals(null);
      return;
    }

    setStorageLoading(true);
    setStorageError('');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const { data: body } = await axios.get(`${API_BASE_URL}/api/moments/storage/overview`, {
        params: { userId },
        headers,
      });
      const overview = body?.data ?? body;
      const next = {};
      const evList = Array.isArray(overview?.events) ? overview.events : [];
      const meta = [];
      for (const row of evList) {
        const id = row?.eventId != null ? String(row.eventId).trim() : '';
        if (!id) continue;
        const nameRaw = row?.eventName != null ? String(row.eventName).trim() : '';
        meta.push({ eventId: id, eventName: nameRaw || null });
        next[id] = {
          totalOriginalSizeBytes: Number(row.totalOriginalSizeBytes) || 0,
          totalOptimisedSizeBytes: Number(row.totalOptimisedSizeBytes) || 0,
          totalThumbnailSizeBytes: Number(row.totalThumbnailSizeBytes) || 0,
          momentCount: Number(row.momentCount) || 0,
        };
      }
      setStorageByEventId(next);
      setOverviewEventRows(meta);
      setOverviewTotals({
        original: Number(overview.totalOriginalSizeBytes) || 0,
        optimised: Number(overview.totalOptimisedSizeBytes) || 0,
        thumbnail: Number(overview.totalThumbnailSizeBytes) || 0,
      });
      setStorageError('');
    } catch (e) {
      setStorageByEventId({});
      setOverviewEventRows([]);
      setOverviewTotals(null);
      setStorageError(e?.response?.data?.message || e?.message || 'Failed to load storage overview.');
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  const profileByEventId = useMemo(() => {
    const m = new Map();
    for (const ev of profileEvents) {
      const id = String(ev?.eventId ?? ev?.id ?? '').trim();
      if (id) m.set(id, ev);
    }
    return m;
  }, [profileEvents]);

  const activeProjects = useMemo(() => {
    const fromOverview =
      overviewEventRows.length > 0
        ? overviewEventRows
        : profileEvents.map((ev, i) => ({
            eventId: String(ev?.eventId || ev?.id || `ev-${i}`),
            eventName: ev?.eventName || ev?.name || null,
          }));

    const rows = [];
    for (let i = 0; i < fromOverview.length; i++) {
      const item = fromOverview[i];
      const id = String(item.eventId ?? item.id ?? `ev-${i}`).trim();
      if (!id) continue;
      const prof = profileByEventId.get(id);
      if (prof && getProjectStatus(prof) === 'Archived') continue;

      const name =
        (item.eventName && String(item.eventName).trim()) ||
        prof?.eventName ||
        prof?.name ||
        `Project ${id}`;

      const st = storageByEventId[id];
      let totalBytes = 0;
      let access = 'ok';
      if (storageLoading) {
        access = 'loading';
      } else if (st?.forbidden) {
        access = 'forbidden';
      } else if (st?.error) {
        access = 'error';
      } else if (st && !st.empty) {
        totalBytes =
          (st.totalOriginalSizeBytes || 0) +
          (st.totalOptimisedSizeBytes || 0) +
          (st.totalThumbnailSizeBytes || 0);
      }
      const gb = bytesToGb(totalBytes);
      rows.push({
        id,
        name,
        gb,
        access,
        totalBytes,
        momentCount: st?.momentCount,
      });
    }

    const sumBytes = rows.filter((r) => r.access === 'ok').reduce((s, r) => s + r.totalBytes, 0);
    return rows.map((r) => ({
      ...r,
      pctOfTotal: sumBytes > 0 && r.access === 'ok' ? Math.round((r.totalBytes / sumBytes) * 100) : 0,
    }));
  }, [overviewEventRows, profileEvents, profileByEventId, storageByEventId, storageLoading]);

  const aggregateBytes = useMemo(() => {
    if (overviewTotals) {
      const { original, optimised, thumbnail } = overviewTotals;
      return { original, optimised, thumbnail, total: original + optimised + thumbnail };
    }
    let original = 0;
    let optimised = 0;
    let thumbnail = 0;
    Object.values(storageByEventId).forEach((st) => {
      if (!st || st.forbidden || st.error || st.empty) return;
      original += st.totalOriginalSizeBytes || 0;
      optimised += st.totalOptimisedSizeBytes || 0;
      thumbnail += st.totalThumbnailSizeBytes || 0;
    });
    const total = original + optimised + thumbnail;
    return { original, optimised, thumbnail, total };
  }, [overviewTotals, storageByEventId]);

  const limitGb = 50;
  const totalGb = bytesToGb(aggregateBytes.total);
  const usedPct = aggregateBytes.total > 0 ? Math.min(100, Math.round((totalGb / limitGb) * 100)) : 0;

  const breakdownTotal = aggregateBytes.total || 1;
  const pctOriginal = Math.round((aggregateBytes.original / breakdownTotal) * 100);
  const pctOptimised = Math.round((aggregateBytes.optimised / breakdownTotal) * 100);
  const pctThumbnail = Math.max(0, 100 - pctOriginal - pctOptimised);

  const archivedProjects = useMemo(() => {
    return profileEvents
      .filter((ev) => getProjectStatus(ev) === 'Archived')
      .map((ev, i) => {
        const id = String(ev?.eventId || ev?.id || `arch-${i}`);
        const name = ev?.eventName || ev?.name || 'Archived project';
        const rawDate = ev?.updatedAt || ev?.archivedAt || ev?.createdAt;
        let archivedLabel = '—';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!Number.isNaN(d.getTime())) {
            archivedLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }
        }
        const st = storageByEventId[id];
        let totalBytes = 0;
        let access = 'ok';
        if (storageLoading) {
          access = 'loading';
        } else if (st?.forbidden) {
          access = 'forbidden';
        } else if (st?.error) {
          access = 'error';
        } else if (st && !st.empty) {
          totalBytes =
            (st.totalOriginalSizeBytes || 0) +
            (st.totalOptimisedSizeBytes || 0) +
            (st.totalThumbnailSizeBytes || 0);
        }
        const gb = formatGb(bytesToGb(totalBytes));
        return { id, name, archived: archivedLabel, gb, access };
      });
  }, [profileEvents, storageByEventId, storageLoading]);

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

  return (
    <div className={`min-h-screen ${appBg} ${appText} font-sans antialiased ${isDark ? 'admin-theme-dark' : 'admin-theme-light'}`}>
      <div className="flex min-h-screen">
        <AdminSidebar
          isDark={isDark}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogout={handleLogout}
          activeKey="storage"
          onNavigate={(key) => navigate(routeForKey(key))}
        />

        <main className="flex-1 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-10 max-w-[1400px] mx-auto">
            <header className="mb-8">
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Storage &amp; Archive
              </h1>
              <p className={`mt-1.5 text-sm sm:text-base ${muted}`}>Monitor and manage storage usage</p>
              {storageError ? (
                <p className={`mt-3 text-sm rounded-xl px-4 py-3 border ${isDark ? 'bg-amber-500/10 border-amber-500/25 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  {storageError}
                </p>
              ) : null}
            </header>

            {/* Top summary cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
              <section className={`rounded-2xl border ${cardBg} ${cardShadow} p-6 flex flex-col`}>
                <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Active Storage</h2>
                <StorageRing
                  percent={storageLoading ? 0 : usedPct}
                  sublabel={
                    storageLoading
                      ? 'Loading…'
                      : `${formatGb(totalGb)} GB / ${limitGb} GB (all tiers)`
                  }
                  isDark={isDark}
                />
                <button
                  type="button"
                  className="mt-4 w-full py-2.5 rounded-xl bg-brand hover:bg-brand-2 text-on-brand text-sm font-medium border border-[#2a4d32]/30 transition-colors"
                >
                  Upgrade Storage
                </button>
              </section>

              <section className={`rounded-2xl border ${cardBg} ${cardShadow} p-6`}>
                <h2 className={`text-sm font-semibold mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Usage Breakdown</h2>
                <p className={`text-xs mb-4 ${submuted}`}>By asset tier (original uploads, feed-optimised, thumbnails)</p>
                <div className="space-y-5">
                  <UsageBar
                    label="Original uploads"
                    gb={storageLoading ? '—' : formatGb(bytesToGb(aggregateBytes.original))}
                    pct={storageLoading ? 0 : pctOriginal}
                    colorClass="bg-blue-500"
                    trackClass={isDark ? 'bg-white/10' : 'bg-slate-200'}
                    isDark={isDark}
                  />
                  <UsageBar
                    label="Optimised (feed)"
                    gb={storageLoading ? '—' : formatGb(bytesToGb(aggregateBytes.optimised))}
                    pct={storageLoading ? 0 : pctOptimised}
                    colorClass="bg-violet-500"
                    trackClass={isDark ? 'bg-white/10' : 'bg-slate-200'}
                    isDark={isDark}
                  />
                  <UsageBar
                    label="Thumbnails"
                    gb={storageLoading ? '—' : formatGb(bytesToGb(aggregateBytes.thumbnail))}
                    pct={storageLoading ? 0 : pctThumbnail}
                    colorClass="bg-brand"
                    trackClass={isDark ? 'bg-white/10' : 'bg-slate-200'}
                    isDark={isDark}
                  />
                </div>
              </section>

              <section className={`rounded-2xl border ${cardBg} ${cardShadow} p-6`}>
                <h2 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>6-Month Trend</h2>
                <p className={`text-xs mb-3 ${submuted}`}>Illustrative — historical reporting coming later</p>
                <div className={`min-h-[160px] flex items-end ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  <MonthTrendChart isDark={isDark} />
                </div>
              </section>
            </div>

            {/* Storage by project */}
            <section className={`rounded-2xl border ${cardBg} ${cardShadow} overflow-hidden mb-8`}>
              <div className="px-6 py-5 border-b border-inherit">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Storage by Project</h2>
                <p className={`text-sm mt-1 ${submuted}`}>
                  Totals include original + optimised + thumbnail bytes where your account is event admin
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[640px]">
                  <thead>
                    <tr className={tableHead}>
                      <th className="px-6 py-3 font-semibold rounded-none">Project Name</th>
                      <th className="px-6 py-3 font-semibold">Storage Used</th>
                      <th className="px-6 py-3 font-semibold">% of Total</th>
                      <th className="px-6 py-3 font-semibold">Moments</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageLoading && activeProjects.length === 0 ? (
                      <StorageRowsSkeleton count={4} />
                    ) : null}
                    {activeProjects.length === 0 && !storageLoading ? (
                      <tr className={tableRow}>
                        <td colSpan={5} className={`px-6 py-10 text-center ${submuted}`}>
                          No events with storage data yet, or none marked active. Sign in again or open Projects if this looks wrong.
                        </td>
                      </tr>
                    ) : null}
                    {activeProjects.map((row) => (
                      <tr key={row.id} className={`border-t ${tableRow}`}>
                        <td className={`px-6 py-4 font-medium ${isDark ? 'text-white/95' : 'text-slate-900'}`}>{row.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-[140px]">
                            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                              <div
                                className="h-full rounded-full bg-brand"
                                style={{
                                  width: `${row.access === 'ok' ? Math.min(100, row.pctOfTotal) : 0}%`,
                                }}
                              />
                            </div>
                            <span className={`${submuted} whitespace-nowrap`}>
                              {row.access === 'loading'
                                ? '…'
                                : row.access === 'forbidden'
                                  ? 'Admin only'
                                  : row.access === 'error'
                                    ? '—'
                                    : `${formatGb(row.gb)} GB`}
                            </span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${submuted}`}>
                          {row.access === 'loading' ? '…' : row.access === 'ok' ? `${row.pctOfTotal}%` : '—'}
                        </td>
                        <td className={`px-6 py-4 ${submuted}`}>
                          {row.access === 'loading'
                            ? '…'
                            : row.access === 'ok' && row.momentCount != null
                              ? row.momentCount
                              : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/events/${row.id}`)}
                            className={`font-medium ${
                              isDark ? 'text-[#8fd2a5] hover:text-[#8fd2a5]' : 'text-[#2a4d32] hover:text-[#2a4d32]'
                            }`}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Archived projects */}
            <section className={`rounded-2xl border ${cardBg} ${cardShadow} mb-8`}>
              <div className="px-6 py-5 border-b border-inherit flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Archived Projects</h2>
                    <svg className={`w-5 h-5 ${muted}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <p className={`text-sm mt-1 ${isDark ? 'text-sky-300/70' : 'text-sky-700/80'}`}>
                    Archived storage doesn&apos;t count toward your active limit
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-inherit">
                {archivedProjects.length === 0 ? (
                  <li className={`px-6 py-10 text-center ${submuted}`}>No archived projects in your profile.</li>
                ) : null}
                {archivedProjects.map((item) => (
                  <li
                    key={item.id}
                    className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between ${isDark ? 'divide-white/[0.06]' : ''}`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className={`w-5 h-5 shrink-0 mt-0.5 ${muted}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</div>
                        <div className={`text-sm mt-0.5 ${submuted}`}>
                          Archived {item.archived} ·{' '}
                          {item.access === 'loading'
                            ? '…'
                            : item.access === 'forbidden'
                              ? 'Admin only'
                              : item.access === 'error'
                                ? '—'
                                : `${item.gb} GB`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pl-8 sm:pl-0">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand hover:bg-brand-2 text-on-brand text-sm font-medium border border-[#2a4d32]/30"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Restore
                      </button>
                      <button
                        type="button"
                        className={`p-2 rounded-lg border ${isDark ? 'border-white/15 hover:bg-white/10' : 'border-black/10 hover:bg-slate-50'}`}
                        aria-label="Download"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10"
                        aria-label="Delete"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Need more storage */}
            <section className={`rounded-2xl border ${ctaBand} ${cardShadow} p-6 sm:p-8`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Need More Storage?</h2>
                  <p className={`text-sm mt-1 ${submuted}`}>Extend your storage capacity with our flexible plans</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-2 text-on-brand text-sm font-semibold border border-[#2a4d32]/30 w-full sm:w-auto"
                >
                  View Plans
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: '1-Year Extension', price: '₹2,999', tag: null },
                  { title: '3-Year Extension', price: '₹7,999', tag: 'Save 20%' },
                  { title: 'Permanent Archive', price: '₹14,999', tag: null },
                ].map((plan) => (
                  <div
                    key={plan.title}
                    className={`rounded-xl border p-5 ${isDark ? 'bg-[#1F2A23]/80 border-white/10' : 'bg-white border-black/[0.08] shadow-sm'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.title}</span>
                      {plan.tag && (
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[#2a4d32]/20 border border-[#2a4d32]/30 ${
                            isDark ? 'text-[#8fd2a5]' : 'text-[#2a4d32]'
                          }`}
                        >
                          {plan.tag}
                        </span>
                      )}
                    </div>
                    <div className={`text-2xl font-bold mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.price}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminStorage;
