import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Database } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
              DataHub
            </span>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nền tảng chuẩn hóa dữ liệu & cộng tác trực tuyến
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Bảo mật cấp doanh nghiệp • Quản lý phiên bản dữ liệu kiểu Git
        </p>
      </div>
    </div>
  );
};
