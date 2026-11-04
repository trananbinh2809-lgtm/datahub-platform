import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FolderGit2, Database, Wand2, GitBranch, 
  MessageSquare, Bell, User, Settings, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Quản lý dự án', icon: FolderGit2 },
    { to: '/datasets', label: 'Tập dữ liệu (Datasets)', icon: Database },
    { to: '/normalization', label: 'Chuẩn hóa dữ liệu', icon: Wand2, highlight: true },
    { to: '/versions', label: 'Phiên bản & Diff (Git)', icon: GitBranch },
    { to: '/chat', label: 'Phòng Chat & Cộng tác', icon: MessageSquare },
    { to: '/notifications', label: 'Thông báo', icon: Bell },
    { to: '/profile', label: 'Hồ sơ cá nhân', icon: User },
    { to: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block bg-slate-50/70 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4">
      {/* Quick Status / Workspace */}
      <div className="mb-6 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            DataHub Engine v1.0
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Sẵn sàng xử lý dữ liệu và cộng tác trực tuyến
        </p>
      </div>

      {/* Nav List */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] uppercase font-bold bg-indigo-500 text-white rounded">
                  Core
                </span>
              )}
            </NavLink>
          );
        })}

        {/* System Admin Link */}
        {user?.systemRole === 'SystemAdmin' && (
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Quản trị hệ thống
            </span>
            <NavLink
              to="/admin"
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }
              `}
            >
              <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
              <span>Trang Quản trị (Admin)</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer hint */}
      <div className="mt-8 px-3 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-4">
        <span>© 2026 DataHub Platform.</span>
        <br />
        <span>Hệ thống chuẩn hóa & quản lý phiên bản dữ liệu kiểu Git.</span>
      </div>
    </aside>
  );
};
