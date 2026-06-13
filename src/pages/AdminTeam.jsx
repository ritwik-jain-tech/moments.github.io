import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AdminSidebar from '../components/AdminSidebar';
import { fetchEventsForUser } from '../utils/fetchUserEvents';

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

const ROLES = ['Cameraman', 'Editor', 'Reviewer', 'Retoucher', 'Manager'];

const COLUMNS = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const initialsOf = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

const fmtDue = (epoch) => {
  if (!epoch) return null;
  const d = new Date(Number(epoch));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const toEpoch = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

const toDateInput = (epoch) => {
  if (!epoch) return '';
  const d = new Date(Number(epoch));
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const EMPTY_MEMBER = { name: '', email: '', phone: '', role: 'Cameraman', avatarUrl: '', status: 'ACTIVE' };
const EMPTY_TASK = {
  title: '',
  description: '',
  assigneeId: '',
  status: 'TODO',
  priority: 'MEDIUM',
  eventId: '',
  dueDate: '',
};

const AdminTeam = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');
  const isDark = theme === 'dark';

  const agencyId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
  const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || '';

  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [dragTaskId, setDragTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Modal state
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null); // null = create
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = create
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [saving, setSaving] = useState(false);

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

  const loadAll = useCallback(async () => {
    if (!agencyId) {
      setError('No user ID found. Please login again.');
      setLoading(false);
      navigate('/admin/login');
      return;
    }
    try {
      setLoading(true);
      const [membersRes, tasksRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/team/members`, { params: { agencyId }, headers: authHeaders() }),
        axios.get(`${API_BASE_URL}/api/team/tasks`, { params: { agencyId }, headers: authHeaders() }),
        axios.get(`${API_BASE_URL}/api/team/stats`, { params: { agencyId }, headers: authHeaders() }),
      ]);
      setMembers(membersRes.data?.data ?? []);
      setTasks(tasksRes.data?.data ?? []);
      setStats(statsRes.data?.data ?? null);
      setError('');
    } catch (err) {
      console.error('Failed to load team data:', err.response || err);
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        setError(err.message || 'Failed to load team data.');
      }
    } finally {
      setLoading(false);
    }
  }, [agencyId, authHeaders, navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Events for the optional "link to project" task dropdown (best-effort).
  useEffect(() => {
    if (!agencyId) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchEventsForUser(agencyId, { token });
        if (!cancelled) setEvents(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agencyId, token]);

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

  // ---------------------------------------------------------------- Members
  const openCreateMember = () => {
    setEditingMember(null);
    setMemberForm(EMPTY_MEMBER);
    setMemberModalOpen(true);
  };

  const openEditMember = (m) => {
    setEditingMember(m);
    setMemberForm({
      name: m.name || '',
      email: m.email || '',
      phone: m.phone || '',
      role: m.role || 'Cameraman',
      avatarUrl: m.avatarUrl || '',
      status: m.status || 'ACTIVE',
    });
    setMemberModalOpen(true);
  };

  const saveMember = async () => {
    if (!memberForm.name.trim()) {
      setError('Member name is required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const payload = { ...memberForm, agencyId };
      if (editingMember?.memberId) {
        await axios.put(`${API_BASE_URL}/api/team/members/${editingMember.memberId}`, payload, { headers: authHeaders() });
      } else {
        await axios.post(`${API_BASE_URL}/api/team/members`, payload, { headers: authHeaders() });
      }
      setMemberModalOpen(false);
      await loadAll();
    } catch (err) {
      console.error('Failed to save member:', err.response || err);
      setError('Failed to save member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (m) => {
    if (!m?.memberId) return;
    if (!window.confirm(`Remove ${m.name || 'this member'} from the team?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/team/members/${m.memberId}`, { headers: authHeaders() });
      await loadAll();
    } catch (err) {
      console.error('Failed to delete member:', err.response || err);
      setError('Failed to delete member.');
    }
  };

  // ------------------------------------------------------------------ Tasks
  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm(EMPTY_TASK);
    setTaskModalOpen(true);
  };

  const openEditTask = (t) => {
    setEditingTask(t);
    setTaskForm({
      title: t.title || '',
      description: t.description || '',
      assigneeId: t.assigneeId || '',
      status: t.status || 'TODO',
      priority: t.priority || 'MEDIUM',
      eventId: t.eventId || '',
      dueDate: toDateInput(t.dueDate),
    });
    setTaskModalOpen(true);
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) {
      setError('Task title is required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const selectedEvent = events.find((e) => String(e.eventId) === String(taskForm.eventId));
      const payload = {
        ...taskForm,
        agencyId,
        createdBy: agencyId,
        dueDate: toEpoch(taskForm.dueDate),
        eventName: selectedEvent?.eventName || null,
      };
      if (editingTask?.taskId) {
        await axios.put(`${API_BASE_URL}/api/team/tasks/${editingTask.taskId}`, payload, { headers: authHeaders() });
      } else {
        await axios.post(`${API_BASE_URL}/api/team/tasks`, payload, { headers: authHeaders() });
      }
      setTaskModalOpen(false);
      await loadAll();
    } catch (err) {
      console.error('Failed to save task:', err.response || err);
      setError('Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (t) => {
    if (!t?.taskId) return;
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/team/tasks/${t.taskId}`, { headers: authHeaders() });
      setTaskModalOpen(false);
      await loadAll();
    } catch (err) {
      console.error('Failed to delete task:', err.response || err);
      setError('Failed to delete task.');
    }
  };

  const moveTask = async (task, newStatus) => {
    if (!task || task.status === newStatus) return;
    const prev = tasks;
    // Optimistic update
    setTasks((list) => list.map((t) => (t.taskId === task.taskId ? { ...t, status: newStatus } : t)));
    try {
      await axios.put(
        `${API_BASE_URL}/api/team/tasks/${task.taskId}`,
        { ...task, status: newStatus, agencyId, dueDate: task.dueDate || null },
        { headers: authHeaders() }
      );
      // Refresh stats so completion % stays in sync.
      const statsRes = await axios.get(`${API_BASE_URL}/api/team/stats`, { params: { agencyId }, headers: authHeaders() });
      setStats(statsRes.data?.data ?? null);
    } catch (err) {
      console.error('Failed to move task:', err.response || err);
      setTasks(prev); // rollback
      setError('Failed to update task status.');
    }
  };

  // ---------------------------------------------------------------- Derived
  const memberById = React.useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(m.memberId, m));
    return map;
  }, [members]);

  const memberTaskCounts = (memberId) => {
    const byMember = stats?.byMember?.[memberId];
    if (byMember) return { done: byMember.done || 0, total: byMember.total || 0 };
    const mine = tasks.filter((t) => t.assigneeId === memberId);
    return { done: mine.filter((t) => t.status === 'DONE').length, total: mine.length };
  };

  const filteredMembers = roleFilter === 'All' ? members : members.filter((m) => m.role === roleFilter);

  // ---------------------------------------------------------------- Styling
  const cardBorder = isDark ? 'border-white/10' : 'border-black/10';
  const cardBg = isDark ? 'bg-[#1A241E]' : 'bg-white';
  const subtle = isDark ? 'text-white/55' : 'text-slate-500';
  const inputCls = isDark
    ? 'bg-[#1F2A23] border-white/10 text-white placeholder:text-white/40'
    : 'bg-white border-black/10 text-slate-900 placeholder:text-slate-400';

  const priorityDot = (p) => {
    if (p === 'HIGH') return 'bg-red-500';
    if (p === 'LOW') return 'bg-slate-400';
    return 'bg-amber-500';
  };

  const roleBadge = (role) => {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold';
    return isDark
      ? `${base} bg-[#2a4d32]/20 text-[#8fd2a5] border border-[#2a4d32]/30`
      : `${base} bg-[#2a4d32]/10 text-[#2a4d32] border border-[#2a4d32]/20`;
  };

  const statCard = (label, value) => (
    <div className={`rounded-2xl border ${cardBorder} ${cardBg} px-5 py-4`}>
      <div className={`text-xs uppercase tracking-wide ${subtle}`}>{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );

  const sc = stats?.statusCounts || {};
  const openTasks = (sc.TODO || 0) + (sc.IN_PROGRESS || 0) + (sc.IN_REVIEW || 0);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#141C17] text-white' : 'bg-white text-slate-900'} font-sans ${isDark ? 'admin-theme-dark' : 'admin-theme-light'}`}>
      <div className="flex min-h-screen">
        <AdminSidebar
          isDark={isDark}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogout={handleLogout}
          activeKey="team"
          onNavigate={(key) => navigate(routeForKey(key))}
        />

        <main className="flex-1 p-6 md:p-10 space-y-6 overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Team Management</h1>
              <p className={`mt-1 text-sm ${subtle}`}>Your agency roster and the task board — assign work and track delivery.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openCreateMember}
                className={`h-11 px-4 rounded-xl border text-sm font-semibold ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-black/10 text-slate-800 hover:bg-slate-50'}`}
              >
                + Add Member
              </button>
              <button
                onClick={openCreateTask}
                className="h-11 px-4 rounded-xl bg-brand hover:bg-brand-2 transition-colors font-semibold border border-[#2a4d32]/20 text-on-brand"
              >
                + Create Task
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl">{error}</div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCard('Team Members', members.length)}
            {statCard('Open Tasks', openTasks)}
            {statCard('In Review', sc.IN_REVIEW || 0)}
            {statCard('Completion', `${stats?.completionPct ?? 0}%`)}
          </div>

          {loading ? (
            <div className={`rounded-2xl border ${cardBorder} ${cardBg} p-10 text-center ${subtle}`}>Loading team…</div>
          ) : (
            <>
              {/* Role filter chips */}
              <div className="flex flex-wrap items-center gap-2">
                {['All', ...ROLES].map((r) => {
                  const active = roleFilter === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        active
                          ? isDark
                            ? 'bg-[#2a4d32]/20 text-[#8fd2a5] border-[#2a4d32]/30'
                            : 'bg-[#2a4d32]/10 text-[#2a4d32] border-[#2a4d32]/20'
                          : isDark
                            ? 'bg-white/0 text-white/60 border-white/10 hover:text-white'
                            : 'bg-white text-slate-600 border-black/10 hover:text-slate-900'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>

              {/* Member grid */}
              {filteredMembers.length === 0 ? (
                <div className={`rounded-2xl border border-dashed ${cardBorder} ${cardBg} p-8 text-center ${subtle}`}>
                  {members.length === 0
                    ? 'No team members yet. Click “Add Member” to build your roster.'
                    : `No members with the “${roleFilter}” role.`}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredMembers.map((m) => {
                    const { done, total } = memberTaskCounts(m.memberId);
                    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                    return (
                      <div key={m.memberId} className={`rounded-2xl border ${cardBorder} ${cardBg} p-4`}>
                        <div className="flex items-center gap-3">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.name} className="w-11 h-11 rounded-full object-cover" />
                          ) : (
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${isDark ? 'bg-[#2a4d32]/30 text-[#8fd2a5]' : 'bg-[#2a4d32]/10 text-[#2a4d32]'}`}>
                              {initialsOf(m.name)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">{m.name}</div>
                            <span className={roleBadge(m.role)}>{m.role || 'Member'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditMember(m)}
                              className={`w-8 h-8 rounded-lg border text-xs ${isDark ? 'border-white/15 text-white/70 hover:bg-white/10' : 'border-black/10 text-slate-600 hover:bg-slate-50'}`}
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => deleteMember(m)}
                              className={`w-8 h-8 rounded-lg border text-xs ${isDark ? 'border-white/15 text-red-300 hover:bg-white/10' : 'border-black/10 text-red-600 hover:bg-slate-50'}`}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        {m.email && <div className={`mt-3 text-xs truncate ${subtle}`}>{m.email}</div>}
                        <div className="mt-3">
                          <div className={`flex items-center justify-between text-xs ${subtle}`}>
                            <span>Tasks</span>
                            <span>{done}/{total} done</span>
                          </div>
                          <div className={`mt-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                            <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Kanban board */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Task Board</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {COLUMNS.map((col) => {
                    const colTasks = tasks.filter((t) => (t.status || 'TODO') === col.key);
                    const isOver = dragOverCol === col.key;
                    return (
                      <div
                        key={col.key}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverCol(col.key);
                        }}
                        onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
                        onDrop={(e) => {
                          e.preventDefault();
                          const task = tasks.find((t) => t.taskId === dragTaskId);
                          if (task) moveTask(task, col.key);
                          setDragTaskId(null);
                          setDragOverCol(null);
                        }}
                        className={`rounded-2xl border ${cardBorder} p-3 min-h-[140px] transition-colors ${
                          isOver ? (isDark ? 'bg-[#2a4d32]/15 border-[#2a4d32]/40' : 'bg-[#2a4d32]/5 border-[#2a4d32]/30') : isDark ? 'bg-white/[0.02]' : 'bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold">{col.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-white/60' : 'bg-slate-200 text-slate-600'}`}>
                            {colTasks.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {colTasks.map((t) => {
                            const assignee = memberById.get(t.assigneeId);
                            const due = fmtDue(t.dueDate);
                            return (
                              <div
                                key={t.taskId}
                                draggable
                                onDragStart={() => setDragTaskId(t.taskId)}
                                onDragEnd={() => {
                                  setDragTaskId(null);
                                  setDragOverCol(null);
                                }}
                                onClick={() => openEditTask(t)}
                                className={`rounded-xl border ${cardBorder} ${cardBg} p-3 cursor-pointer hover:shadow-sm transition-shadow ${dragTaskId === t.taskId ? 'opacity-50' : ''}`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${priorityDot(t.priority)}`} title={t.priority} />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium leading-snug">{t.title}</div>
                                    {t.eventName && (
                                      <div className={`mt-1 inline-flex items-center text-[11px] px-1.5 py-0.5 rounded ${isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-500'}`}>
                                        {t.eventName}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  {assignee || t.assigneeName ? (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${isDark ? 'bg-[#2a4d32]/30 text-[#8fd2a5]' : 'bg-[#2a4d32]/10 text-[#2a4d32]'}`}>
                                        {initialsOf(assignee?.name || t.assigneeName)}
                                      </span>
                                      <span className={`text-xs truncate ${subtle}`}>{assignee?.name || t.assigneeName}</span>
                                    </div>
                                  ) : (
                                    <span className={`text-xs ${subtle}`}>Unassigned</span>
                                  )}
                                  {due && <span className={`text-xs ${subtle}`}>{due}</span>}
                                </div>
                              </div>
                            );
                          })}
                          {colTasks.length === 0 && (
                            <div className={`text-xs text-center py-4 ${subtle}`}>Drop tasks here</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Member modal */}
      {memberModalOpen && (
        <div className={`fixed inset-0 ${isDark ? 'bg-black/60' : 'bg-black/40'} flex items-center justify-center z-50 p-4`}>
          <div className={`rounded-2xl max-w-md w-full shadow-2xl border ${cardBorder} ${cardBg}`}>
            <div className={`px-6 py-4 border-b ${cardBorder} flex items-center justify-between`}>
              <h2 className="text-xl font-semibold">{editingMember ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={() => setMemberModalOpen(false)} className={`w-9 h-9 rounded-lg border ${cardBorder} ${subtle}`} aria-label="Close">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Name *</label>
                <input value={memberForm.name} onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))} className={`w-full rounded-xl px-4 py-2.5 border ${inputCls}`} placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Role</label>
                  <select value={memberForm.role} onChange={(e) => setMemberForm((f) => ({ ...f, role: e.target.value }))} className={`w-full rounded-xl px-3 py-2.5 border ${inputCls}`}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Status</label>
                  <select value={memberForm.status} onChange={(e) => setMemberForm((f) => ({ ...f, status: e.target.value }))} className={`w-full rounded-xl px-3 py-2.5 border ${inputCls}`}>
                    <option value="ACTIVE">Active</option>
                    <option value="INVITED">Invited</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Email</label>
                <input value={memberForm.email} onChange={(e) => setMemberForm((f) => ({ ...f, email: e.target.value }))} className={`w-full rounded-xl px-4 py-2.5 border ${inputCls}`} placeholder="name@studio.com" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Phone</label>
                <input value={memberForm.phone} onChange={(e) => setMemberForm((f) => ({ ...f, phone: e.target.value }))} className={`w-full rounded-xl px-4 py-2.5 border ${inputCls}`} placeholder="Optional" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Avatar URL</label>
                <input value={memberForm.avatarUrl} onChange={(e) => setMemberForm((f) => ({ ...f, avatarUrl: e.target.value }))} className={`w-full rounded-xl px-4 py-2.5 border ${inputCls}`} placeholder="Optional image URL" />
              </div>
            </div>
            <div className={`px-6 py-4 border-t ${cardBorder} flex items-center justify-end gap-2`}>
              <button onClick={() => setMemberModalOpen(false)} className={`px-5 py-2.5 rounded-xl border ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-black/10 text-slate-800 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={saveMember} disabled={saving || !memberForm.name.trim()} className={`px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-2 text-on-brand border border-[#2a4d32]/20 ${saving || !memberForm.name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {saving ? 'Saving…' : 'Save Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task modal */}
      {taskModalOpen && (
        <div className={`fixed inset-0 ${isDark ? 'bg-black/60' : 'bg-black/40'} flex items-center justify-center z-50 p-4`}>
          <div className={`rounded-2xl max-w-lg w-full shadow-2xl border ${cardBorder} ${cardBg}`}>
            <div className={`px-6 py-4 border-b ${cardBorder} flex items-center justify-between`}>
              <h2 className="text-xl font-semibold">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={() => setTaskModalOpen(false)} className={`w-9 h-9 rounded-lg border ${cardBorder} ${subtle}`} aria-label="Close">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Title *</label>
                <input value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} className={`w-full rounded-xl px-4 py-2.5 border ${inputCls}`} placeholder="e.g., Cull & select wedding highlights" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Description</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} rows={3} className={`w-full rounded-xl px-4 py-2.5 border ${inputCls}`} placeholder="Optional details" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Assignee</label>
                  <select value={taskForm.assigneeId} onChange={(e) => setTaskForm((f) => ({ ...f, assigneeId: e.target.value }))} className={`w-full rounded-xl px-3 py-2.5 border ${inputCls}`}>
                    <option value="">Unassigned</option>
                    {members.map((m) => <option key={m.memberId} value={m.memberId}>{m.name} · {m.role}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))} className={`w-full rounded-xl px-3 py-2.5 border ${inputCls}`}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Status</label>
                  <select value={taskForm.status} onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))} className={`w-full rounded-xl px-3 py-2.5 border ${inputCls}`}>
                    {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))} className={`w-full rounded-xl px-3 py-2.5 border ${inputCls}`} />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${subtle}`}>Link to Project (optional)</label>
                <select value={taskForm.eventId} onChange={(e) => setTaskForm((f) => ({ ...f, eventId: e.target.value }))} className={`w-full rounded-xl px-3 py-2.5 border ${inputCls}`}>
                  <option value="">None</option>
                  {events.map((e) => <option key={e.eventId} value={e.eventId}>{e.eventName || e.eventId}</option>)}
                </select>
              </div>
            </div>
            <div className={`px-6 py-4 border-t ${cardBorder} flex items-center justify-between gap-2`}>
              <div>
                {editingTask && (
                  <button onClick={() => deleteTask(editingTask)} className={`px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'border-red-400/30 text-red-300 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>
                    Delete
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setTaskModalOpen(false)} className={`px-5 py-2.5 rounded-xl border ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-black/10 text-slate-800 hover:bg-slate-50'}`}>Cancel</button>
                <button onClick={saveTask} disabled={saving || !taskForm.title.trim()} className={`px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-2 text-on-brand border border-[#2a4d32]/20 ${saving || !taskForm.title.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {saving ? 'Saving…' : editingTask ? 'Save Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeam;
