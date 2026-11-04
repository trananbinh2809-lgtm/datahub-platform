import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { Input } from '../../components/common/Input.js';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản sử dụng của DataHub.');
      return;
    }

    setIsLoading(true);
    try {
      await register(fullName, userName, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Đăng ký tài khoản không thành công.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Đăng ký tài khoản mới
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Bắt đầu chuẩn hóa dữ liệu và cộng tác nhóm trên DataHub
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
          label="Họ và tên"
          placeholder="Ví dụ: Trần Minh Đức"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label="Tên đăng nhập (Username)"
          placeholder="minhduc_data"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="minhduc@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        <Input
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        <div className="flex items-center gap-2 text-xs">
          <input
            id="terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="terms" className="text-slate-600 dark:text-slate-400 cursor-pointer">
            Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật dữ liệu.
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="md"
          isLoading={isLoading}
        >
          Hoàn tất Đăng ký
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
};
