import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, Edit3, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { apiClient } from '../../services/apiClient.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { Input } from '../../components/common/Input.js';
import { Badge } from '../../components/common/Badge.js';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    try {
      const updated = await apiClient.put<any>('/auth/profile', {
        fullName,
        bio,
        avatarUrl,
      });
      updateUser(updated);
      setSuccessMsg('Hồ sơ của bạn đã được cập nhật thành công.');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <User className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Hồ sơ cá nhân
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quản lý thông tin định danh, giới thiệu bản thân và vai trò trên hệ thống DataHub
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <img
            src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`}
            alt={user.fullName}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600/30 shadow-md"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user.fullName}</h2>
            <p className="text-xs text-slate-400">@{user.userName} • {user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <Badge variant={user.systemRole === 'SystemAdmin' ? 'danger' : 'primary'}>
                {user.systemRole}
              </Badge>
              <Badge variant="success">Đang hoạt động</Badge>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-6">
          <Input
            label="Họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Đường dẫn ảnh đại diện (Avatar URL)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Giới thiệu bản thân (Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Chia sẻ về lĩnh vực chuyên môn, vai trò dữ liệu của bạn..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
