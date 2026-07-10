import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { NotificationsSkeleton } from '../components/ui/Skeleton';

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

const AdminPlaceholder = ({ activeKey, title }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Section has no backend feed yet — show a skeleton briefly so the shell
    // doesn't flash empty, then reveal the placeholder content.
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#141C17] text-white' : 'bg-white text-slate-900'} font-sans ${isDark ? 'admin-theme-dark' : 'admin-theme-light'}`}>
      <div className="flex min-h-screen">
        <AdminSidebar
          isDark={isDark}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogout={handleLogout}
          activeKey={activeKey}
          onNavigate={(key) => navigate(routeForKey(key))}
        />
        <main className="flex-1 p-10">
          <h1 className="text-2xl font-semibold mb-6">{title}</h1>
          {loading ? (
            <div className="max-w-3xl">
              <NotificationsSkeleton isDark={isDark} />
            </div>
          ) : (
            <div className={`max-w-3xl rounded-2xl border p-8 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                This page is intentionally blank for now. We can build this section incrementally next.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
