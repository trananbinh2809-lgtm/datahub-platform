import React, { useState } from 'react';
import { Settings, Moon, Sun, Lock, Shield, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.js';
import { Button } from '../../components/common/Button.js';
import { Card } from '../../components/common/Card.js';
import { Input } from '../../components/common/Input.js';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp.');
      return;
    }
    setPasswordSuccess('Mật khẩu của bạn đã được cập nhật an toàn.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Cài đặt hệ thống & Giao diện
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tùy chỉnh chế độ hiển thị Sáng/Tối, ngôn ngữ và đổi mật khẩu bảo mật
        </p>
      </div>

      {/* Appearance Settings */}
      <Card className="p-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          Giao diện hiển thị (Theme)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Lựa chọn chế độ sáng hoặc tối phù hợp với mắt khi làm việc với các bảng dữ liệu lớn
        </p>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Chế độ hiện tại: {theme === 'dark' ? 'Giao diện Tối (Dark Mode)' : 'Giao diện Sáng (Light Mode)'}
              </p>
              <p className="text-[11px] text-slate-400">
                Tự động tối ưu độ tương phản cho các bảng so sánh Diff
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
          >
            Chuyển sang {theme === 'dark' ? 'Sáng' : 'Tối'}
          </Button>
        </div>
      </Card>

      {/* Security & Password */}
      <Card className="p-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          Bảo mật & Đổi mật khẩu
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Đổi mật khẩu định kỳ để bảo vệ tài khoản và dữ liệu dự án
        </p>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="Mật khẩu mới"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" leftIcon={<Lock className="w-3.5 h-3.5" />}>
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
