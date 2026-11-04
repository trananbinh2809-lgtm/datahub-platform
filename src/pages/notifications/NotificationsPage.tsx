import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ArrowRight, ShieldCheck, UserPlus, GitCommit, Wand2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { Button } from '../../components/common/Button.js';
import { Card, LoadingSpinner } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import type { NotificationItem } from '../../types/index.js';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<NotificationItem[]>('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải danh sách thông báo..." />;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ProjectInvite': return <UserPlus className="w-5 h-5 text-indigo-500" />;
      case 'NewVersion': return <GitCommit className="w-5 h-5 text-emerald-500" />;
      case 'NormalizationComplete': return <Wand2 className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Trung tâm Thông báo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cập nhật về lời mời tham gia dự án, các commit phiên bản mới và thông báo hệ thống
          </p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={handleMarkAllRead}
          >
            Đánh dấu đọc tất cả
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Bạn chưa có thông báo nào
            </p>
          </Card>
        ) : (
          notifications.map((item) => (
            <Card
              key={item.id}
              className={`p-4.5 transition-all ${
                !item.isRead ? 'border-l-4 border-l-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  {item.linkUrl && (
                    <Link
                      to={item.linkUrl}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-2.5"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
