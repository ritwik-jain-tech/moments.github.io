import React from 'react';

const AdminSidebar = ({
  isDark,
  collapsed,
  onToggleCollapsed,
  onToggleTheme,
  onLogout,
  activeKey = 'projects',
  onNavigate,
  className = '',
}) => {
  const dividerBorder = isDark ? 'border-white/10' : 'border-[#d4d4d8]';
  const sidebarBg = isDark ? 'bg-[#08101D]' : 'bg-white';
  const sidebarItemBase = `w-full flex items-center rounded-xl text-sm font-medium transition-colors ${
    collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-2'
  }`;
  const sidebarItemActive = `${sidebarItemBase} ${
    isDark ? 'bg-emerald-600/20 text-white border border-emerald-500/20' : 'bg-emerald-600/10 text-slate-900 border border-emerald-600/20'
  }`;
  const sidebarItemIdle = `${sidebarItemBase} ${
    isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
  }`;
  const surfaceBorder = isDark ? 'border-white/10' : 'border-[#d4d4d8]';

  const navItems = [
    { key: 'home', title: 'Homepage', icon: 'M3 12l2-2 7-7 7 7 2 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z' },
    { key: 'projects', title: 'Projects', icon: 'M3 7h6l2 2h10v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z' },
    { key: 'uploads', title: 'Uploads', icon: 'M12 5v14m-7-7h14' },
    { key: 'storage', title: 'Storage', icon: 'M4 7h16M4 12h16M4 17h16' },
    { key: 'notifications', title: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9' },
    { key: 'team', title: 'Team Management', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  return (
    <aside
      className={`hidden md:flex md:flex-col border-r ${dividerBorder} ${sidebarBg} ${
        collapsed ? 'md:w-20' : 'md:w-72'
      } h-screen sticky top-0 overflow-hidden transition-[width] duration-200 ${className}`}
    >
      <div className={`flex items-center ${collapsed ? 'px-3 py-4 justify-center' : 'px-6 py-6'} gap-3`}>
        <img src="/logo.png" alt="Moments" className="h-9 w-9" />
        {!collapsed && (
          <div className="leading-tight">
            <div className={`text-lg font-semibold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>MOMENTS</div>
            <div className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Studio dashboard</div>
          </div>
        )}
        <button
          onClick={onToggleCollapsed}
          className={`ml-auto w-9 h-9 rounded-xl border ${surfaceBorder} ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white/70 hover:bg-white'} transition-colors flex items-center justify-center`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 ${isDark ? 'text-white/80' : 'text-slate-700'} transition-transform ${collapsed ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className={`${collapsed ? 'px-3' : 'px-4'} space-y-1`}>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={activeKey === item.key ? sidebarItemActive : sidebarItemIdle}
            onClick={() => onNavigate?.(item.key)}
            title={item.title}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {!collapsed && item.title}
          </button>
        ))}
      </nav>

      <div className={`mt-auto ${collapsed ? 'px-3' : 'px-4'} py-6 space-y-2`}>
        <button
          className={sidebarItemIdle}
          onClick={onToggleTheme}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
          </svg>
          {!collapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
        </button>
        <button className={sidebarItemIdle} onClick={() => onNavigate?.('settings')} title="Account Settings">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V22a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 8.49a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09A1.65 1.65 0 0010 2.09V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09A1.65 1.65 0 0021.91 10H22a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          {!collapsed && 'Account Settings'}
        </button>
        <button
          className={`${sidebarItemIdle} ${isDark ? 'text-red-200 hover:text-red-100' : 'text-red-600 hover:text-red-700'}`}
          onClick={onLogout}
          title="Log Out"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 16l4-4-4-4m4 4H3m12 7a2 2 0 002-2V7a2 2 0 00-2-2h-3" />
          </svg>
          {!collapsed && 'Log Out'}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
