import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderGit2, Database, Wand2, Users, ArrowUpRight, Plus, 
  Upload, GitCommit, CheckCircle2, Activity, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { apiClient } from '../../services/apiClient.js';
import { Card, LoadingSpinner } from '../../components/common/Card.js';
import { Button } from '../../components/common/Button.js';
import { Badge } from '../../components/common/Badge.js';
import type { Project, Dataset, ActivityLog } from '../../types/index.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, dsRes] = await Promise.all([
          apiClient.get<Project[]>('/projects'),
          apiClient.get<Dataset[]>('/datasets'),
        ]);
        setProjects(projRes);
        setDatasets(dsRes);

        // Fetch audit logs if admin, or generate user activity view
        if (user?.systemRole === 'SystemAdmin') {
          const logs = await apiClient.get<ActivityLog[]>('/admin/audit-logs');
          setActivities(logs.slice(0, 6));
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Đang đồng bộ dữ liệu tổng quan DataHub..." />;
  }

  const totalRows = datasets.reduce((acc, d) => acc + d.rowCount, 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Không gian làm việc trực tuyến
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.fullName || 'Nhà phát triển'}! 👋
          </h1>
          <p className="mt-2 text-indigo-100 text-sm leading-relaxed">
            Chào mừng bạn đến với DataHub. Quản lý các repository dữ liệu, chuẩn hóa dữ liệu thông minh, khử trùng lặp và theo dõi lịch sử phiên bản kiểu Git.
          </p>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link to="/projects">
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Tạo dự án
            </Button>
          </Link>
          <Link to="/datasets">
            <Button variant="secondary" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
              Tải dữ liệu
            </Button>
          </Link>
          <Link to="/normalization">
            <Button variant="primary" size="sm" className="bg-emerald-500 hover:bg-emerald-600 shadow-md" leftIcon={<Wand2 className="w-4 h-4" />}>
              Chuẩn hóa ngay
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng số dự án
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {projects.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Repository đang hoạt động
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tập dữ liệu
            </span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {datasets.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalRows.toLocaleString('vi-VN')} hàng dữ liệu
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quy tắc chuẩn hóa
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Wand2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            8 Presets
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Xử lý Text, Số điện thoại, Email, Date
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Phiên bản (Commits)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <GitCommit className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {datasets.reduce((acc, d) => acc + d.currentVersionNumber, 0)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Snapshots sẵn sàng khôi phục
          </span>
        </Card>
      </div>

      {/* Main Grid: Projects & Datasets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Projects (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Dự án gần đây (Repositories)
              </h2>
              <p className="text-xs text-slate-500">Các không gian lưu trữ dữ liệu của bạn và nhóm</p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Xem tất cả ({projects.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => (
              <Card key={project.id} className="p-4.5" hoverable>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
                      >
                        {project.name}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {project.description || 'Chưa có mô tả cho dự án.'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {project.membersCount || 1} thành viên
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3.5 h-3.5" />
                          {project.datasetsCount || 0} datasets
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(project.updatedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={project.isPublic ? 'success' : 'secondary'}>
                    {project.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Dataset Spotlight */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Tập dữ liệu nổi bật
              </h2>
              <Link to="/datasets" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Quản lý dataset &rarr;
              </Link>
            </div>

            {datasets.length > 0 && (
              <Card className="p-5 border-l-4 border-l-indigo-600">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {datasets[0].name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {datasets[0].description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {datasets[0].rowCount} hàng
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {datasets[0].columnCount} cột
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <Badge variant="primary">{datasets[0].currentVersionTag}</Badge>
                    </div>
                  </div>

                  <Link to={`/normalization?datasetId=${datasets[0].id}`}>
                    <Button variant="primary" size="sm" leftIcon={<Wand2 className="w-3.5 h-3.5" />}>
                      Làm sạch ngay
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column: System Stream & Guide */}
        <div className="space-y-6">
          {/* Quick Start Workflow */}
          <Card className="p-5 bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Quy trình chuẩn hóa chuẩn Git
            </h3>
            <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">1</span>
                <span><strong>Tải tập dữ liệu</strong> (CSV, JSON) lên Repository dự án.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">2</span>
                <span><strong>Chọn & cấu hình quy tắc</strong>: Họ tên, Email, SĐT, Ngày tháng, Khử trùng lặp.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">3</span>
                <span><strong>Xem trước bảng so sánh</strong> (Original vs Cleaned) và kiểm tra lỗi.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">4</span>
                <span><strong>Commit phiên bản mới</strong>: Tự động tính toán diff và lưu snapshot để có thể rollback.</span>
              </li>
            </ol>
          </Card>

          {/* Real-time Collaboration Preview */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Phòng Chat Cộng Tác
              </h3>
              <Link to="/chat" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Mở Chat &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Trao đổi về schema dữ liệu, báo cáo lỗi và chia sẻ phiên bản dataset với đồng nghiệp theo thời gian thực.
            </p>
            <Link to="/chat">
              <Button variant="outline" size="sm" className="w-full">
                Vào Phòng Chat Chung
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
