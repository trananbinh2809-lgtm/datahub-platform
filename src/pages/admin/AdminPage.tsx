import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Lock, Unlock, Activity, 
  FolderGit2, Database, Wand2, CheckCircle, Clock 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { apiClient } from '../../services/apiClient.js';
import { Card, LoadingSpinner } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import type { User, ActivityLog } from '../../types/index.js';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [overviewData, usersData, logsData] = await Promise.all([
        apiClient.get<any>('/admin/overview'),
        apiClient.get<User[]>('/admin/users'),
        apiClient.get<ActivityLog[]>('/admin/audit-logs'),
      ]);
      setOverview(overviewData);
      setUsers(usersData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.systemRole === 'SystemAdmin') {
      fetchAdminData();
    }
  }, [user]);

  const handleToggleLock = async (targetUser: User) => {
    if (targetUser.systemRole === 'SystemAdmin') {
      alert('Không thể khóa tài khoản SystemAdmin.');
      return;
    }

    try {
      const res = await apiClient.put<any>(`/admin/users/${targetUser.id}/toggle-lock`);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: res.isActive } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thay đổi trạng thái tài khoản.');
    }
  };

  if (user?.systemRole !== 'SystemAdmin') {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 max-w-xl mx-auto">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Quyền truy cập bị từ chối (403 Forbidden)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Chỉ Quản trị viên cấp cao (SystemAdmin) mới có quyền truy cập trang quản trị hệ thống.
        </p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu kiểm toán hệ thống..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          Bảng điều khiển Quản trị Hệ thống (Admin Portal)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quản lý tài khoản người dùng, giám sát dung lượng dữ liệu và nhật ký kiểm toán bảo mật
        </p>
      </div>

      {/* System Metrics */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase text-slate-400">Tổng tài khoản</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {overview.totalUsers}
            </p>
            <span className="text-[10px] text-emerald-500 font-semibold">
              {overview.activeUsers} đang hoạt động
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase text-slate-400">Repositories</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {overview.totalProjects}
            </p>
            <span className="text-[10px] text-indigo-500 font-semibold">Dự án toàn hệ thống</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase text-slate-400">Tập dữ liệu</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {overview.totalDatasets}
            </p>
            <span className="text-[10px] text-sky-500 font-semibold">Datasets lưu trữ</span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-bold uppercase text-slate-400">Dòng đã xử lý</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {overview.totalRowsProcessed?.toLocaleString('vi-VN')}
            </p>
            <span className="text-[10px] text-amber-500 font-semibold">{overview.totalRules} rules engine</span>
          </Card>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Quản lý Tài khoản ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Nhật ký Kiểm toán (Audit Logs - {auditLogs.length})
        </button>
      </div>

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Người dùng</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Vai trò hệ thống</th>
                <th className="px-5 py-3 font-semibold">Trạng thái</th>
                <th className="px-5 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 flex items-center gap-2.5">
                    <img
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.fullName)}`}
                      alt={u.fullName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{u.fullName}</p>
                      <p className="text-[10px] text-slate-400">@{u.userName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={u.systemRole === 'SystemAdmin' ? 'danger' : 'primary'}>
                      {u.systemRole}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={u.isActive ? 'success' : 'danger'}>
                      {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {u.systemRole !== 'SystemAdmin' && (
                      <Button
                        variant={u.isActive ? 'danger' : 'success'}
                        size="sm"
                        leftIcon={u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        onClick={() => handleToggleLock(u)}
                      >
                        {u.isActive ? 'Khóa' : 'Mở khóa'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab Content: Audit Logs */}
      {activeTab === 'logs' && (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-sans border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Thời gian</th>
                <th className="px-4 py-3 font-semibold">Người thực hiện</th>
                <th className="px-4 py-3 font-semibold">Hành động</th>
                <th className="px-4 py-3 font-semibold">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-bold whitespace-nowrap">
                    {log.userName || 'System'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-sans text-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
