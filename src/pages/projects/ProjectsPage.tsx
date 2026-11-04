import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderGit2, Plus, Search, Filter, Lock, Globe, 
  Users, Database, Clock, Sparkles 
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { Button } from '../../components/common/Button.js';
import { Card, LoadingSpinner } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { Input } from '../../components/common/Input.js';
import type { Project } from '../../types/index.js';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  
  // Modal New Project state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [icon, setIcon] = useState('database');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Project[]>('/projects');
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Tên dự án là bắt buộc.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiClient.post<Project>('/projects', {
        name,
        description,
        isPublic,
        icon,
      });
      setProjects([created, ...projects]);
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setIsPublic(false);
    } catch (err: any) {
      setFormError(err.message || 'Không thể tạo dự án.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterType === 'public') return matchesSearch && p.isPublic;
    if (filterType === 'private') return matchesSearch && !p.isPublic;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Quản lý dự án (Repositories)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Không gian lưu trữ, tổ chức các tập dữ liệu, phân quyền cộng tác và quản lý phiên bản
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Tạo dự án mới
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm dự án theo tên hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 mr-1">Lọc:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tất cả ({projects.length})
          </button>
          <button
            onClick={() => setFilterType('public')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
              filterType === 'public'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Công khai
          </button>
          <button
            onClick={() => setFilterType('private')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
              filterType === 'private'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Riêng tư
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <LoadingSpinner text="Đang tải danh sách dự án..." />
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <FolderGit2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Không tìm thấy dự án nào
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Hãy bắt đầu tạo một dự án mới để lưu trữ các tập dữ liệu cần làm sạch và chuẩn hóa.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Tạo dự án đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <Card key={p.id} className="p-5 flex flex-col justify-between" hoverable>
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <Link
                        to={`/projects/${p.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                      >
                        {p.name}
                      </Link>
                      <span className="text-[10px] text-slate-400">/{p.slug}</span>
                    </div>
                  </div>

                  <Badge variant={p.isPublic ? 'success' : 'secondary'} size="sm">
                    {p.isPublic ? (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Private
                      </span>
                    )}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4">
                  {p.description || 'Chưa có thông tin mô tả chi tiết cho dự án này.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {p.membersCount || 1}
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" /> {p.datasetsCount || 0}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3" />
                  {new Date(p.updatedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Tạo Dự Án Mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Khởi tạo Repository Dự án mới"
        description="Dự án chứa các tập dữ liệu, cấu hình quy tắc chuẩn hóa và lịch sử phiên bản."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {formError}
            </div>
          )}

          <Input
            label="Tên dự án (Repository Name)"
            placeholder="Ví dụ: Du_lieu_Khach_hang_Online_2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            helperText="Tên ngắn gọn, rõ nghĩa để phân biệt với các dự án khác."
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả mục tiêu dữ liệu
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nguồn gốc dữ liệu, mục tiêu chuẩn hóa hoặc lưu ý cho thành viên nhóm..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Chế độ hiển thị (Visibility)
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Riêng tư (Private)
                  </span>
                  <p className="text-[11px] text-slate-500">Chỉ những thành viên được mời mới có thể xem và xử lý dữ liệu.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> Công khai (Public)
                  </span>
                  <p className="text-[11px] text-slate-500">Mọi người trong hệ thống đều có thể xem và tải xuống dữ liệu chuẩn hóa.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Khởi tạo Repository
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
