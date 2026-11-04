import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FolderGit2, Database, Users, Wand2, Plus, MessageSquare, 
  ShieldCheck, Upload, ArrowLeft, Clock, Lock, Globe 
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { Button } from '../../components/common/Button.js';
import { Card, LoadingSpinner } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { Input } from '../../components/common/Input.js';
import type { Project, ProjectMember, Dataset, ProjectRole } from '../../types/index.js';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<(Project & { members: ProjectMember[]; datasets: Dataset[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'datasets' | 'members'>('datasets');

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('Contributor');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchProjectDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await apiClient.get<Project & { members: ProjectMember[]; datasets: Dataset[] }>(`/projects/${id}`);
      setProject(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteInput.trim()) return;
    setInviteError(null);
    setInviteLoading(true);

    try {
      await apiClient.post(`/projects/${id}/members`, {
        emailOrUsername: inviteInput.trim(),
        role: inviteRole,
      });
      setIsInviteModalOpen(false);
      setInviteInput('');
      fetchProjectDetail();
    } catch (err: any) {
      setInviteError(err.message || 'Không thể mời thành viên.');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải thông tin chi tiết dự án..." />;
  if (!project) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy dự án</h2>
        <Link to="/projects" className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 inline-block">
          &larr; Quay lại danh sách dự án
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Danh sách dự án</span>
        </Link>
      </div>

      {/* Project Banner Header */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 shrink-0">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {project.name}
                </h1>
                <Badge variant={project.isPublic ? 'success' : 'secondary'}>
                  {project.isPublic ? <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span> : <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {project.description || 'Chưa có mô tả chi tiết cho repository này.'}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span>Chủ sở hữu: <strong className="text-slate-700 dark:text-slate-300">{project.ownerName || 'Admin'}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to={`/chat?channel=conv_proj_${project.id}`}>
              <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                Chat Dự Án
              </Button>
            </Link>
            <Link to={`/datasets?projectId=${project.id}&upload=true`}>
              <Button variant="primary" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
                Tải Dataset
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-6 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab('datasets')}
            className={`flex items-center gap-2 text-sm font-semibold pb-1 border-b-2 transition-all cursor-pointer ${
              activeTab === 'datasets'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Tập dữ liệu ({project.datasets?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 text-sm font-semibold pb-1 border-b-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Thành viên & Phân quyền ({project.members?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Tab Content: Datasets */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Các tập dữ liệu trong repository
            </h2>
            <Link to={`/datasets?projectId=${project.id}`}>
              <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Thêm Dataset
              </Button>
            </Link>
          </div>

          {project.datasets.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Chưa có tập dữ liệu nào trong dự án này
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tải lên tệp CSV hoặc JSON để bắt đầu phân tích và chuẩn hóa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.datasets.map((ds) => (
                <Card key={ds.id} className="p-5" hoverable>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {ds.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {ds.description || 'Tập dữ liệu thô chưa qua làm sạch.'}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{ds.rowCount} dòng</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{ds.columnCount} cột</span>
                        <span>•</span>
                        <Badge variant="primary" size="sm">{ds.currentVersionTag}</Badge>
                      </div>
                    </div>

                    <Link to={`/normalization?datasetId=${ds.id}`}>
                      <Button variant="primary" size="sm" leftIcon={<Wand2 className="w-3.5 h-3.5" />}>
                        Chuẩn hóa
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Members */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Danh sách thành viên và vai trò RBAC
            </h2>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Mời thành viên mới
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Thành viên</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Vai trò (Role)</th>
                  <th className="px-5 py-3 font-semibold">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {project.members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <img
                        src={member.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.fullName)}`}
                        alt={member.fullName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{member.fullName}</p>
                        <p className="text-[10px] text-slate-400">@{member.userName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{member.email}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          member.role === 'Owner' ? 'danger' :
                          member.role === 'Admin' ? 'warning' :
                          member.role === 'Maintainer' ? 'primary' :
                          member.role === 'Contributor' ? 'success' : 'secondary'
                        }
                      >
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Mời Thành Viên */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Mời thành viên vào dự án"
        description="Thành viên sẽ nhận được thông báo và có quyền truy cập repository này."
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          {inviteError && (
            <div className="p-3 rounded-lg bg-rose-50 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {inviteError}
            </div>
          )}

          <Input
            label="Email hoặc Username người dùng"
            placeholder="nguyenvana@datahub.vn"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            required
            helperText="Nhập chính xác email hoặc username đã đăng ký trên DataHub."
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Vai trò và quyền hạn (RBAC)
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Admin">Admin (Quản trị dự án & thành viên)</option>
              <option value="Maintainer">Maintainer (Quản lý dữ liệu & phiên bản)</option>
              <option value="Contributor">Contributor (Tải dữ liệu & chạy chuẩn hóa)</option>
              <option value="Viewer">Viewer (Chỉ xem và tải dữ liệu)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={inviteLoading}
            >
              Gửi lời mời
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
