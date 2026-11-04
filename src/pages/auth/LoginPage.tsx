import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';

export const LoginPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(usernameOrEmail, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setUsernameOrEmail('admin@datahub.vn');
      setPassword('DataHub@2026');
    } else {
      setUsernameOrEmail('nguyenvana@datahub.vn');
      setPassword('DataHub@2026');
    }
    setError(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Đăng nhập tài khoản
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Nhập thông tin xác thực để truy cập vào hệ thống DataHub
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email hoặc Tên đăng nhập"
          placeholder="admin@datahub.vn hoặc nguyenvana"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <div className="relative">
          <Input
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
            <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span>Ghi nhớ phiên đăng nhập</span>
          </label>
          <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Liên hệ quản trị viên admin@datahub.vn để đặt lại mật khẩu.'); }} className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Quên mật khẩu?
          </a>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="md"
          isLoading={isLoading}
        >
          Đăng nhập vào DataHub
        </Button>
      </form>

      {/* Quick Fill Test Accounts */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Tài khoản kiểm thử sẵn có:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('admin')}
            className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">SystemAdmin</p>
            <p className="text-[10px] text-slate-400">admin@datahub.vn</p>
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('user')}
            className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Data Engineer</p>
            <p className="text-[10px] text-slate-400">nguyenvana@datahub.vn</p>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};
