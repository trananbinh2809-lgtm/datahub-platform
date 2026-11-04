import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  GitBranch, GitCommit, RotateCcw, CheckCircle, Database, 
  ArrowRight, ShieldCheck, Clock, Eye, AlertCircle, Plus, Minus, RefreshCw 
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { Button } from '../../components/common/Button.js';
import { Card, LoadingSpinner } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import type { Dataset, DatasetVersion } from '../../types/index.js';

export const VersionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlDatasetId = searchParams.get('datasetId') || '';

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(urlDatasetId);
  const [versions, setVersions] = useState<DatasetVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Compare diff modal state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [fromVerId, setFromVerId] = useState<string>('');
  const [toVerId, setToVerId] = useState<string>('');
  const [diffResult, setDiffResult] = useState<any>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  // Snapshot modal
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<DatasetVersion | null>(null);

  // Rollback state
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const dsList = await apiClient.get<Dataset[]>('/datasets');
      setDatasets(dsList);

      const targetId = selectedDatasetId || (dsList.length > 0 ? dsList[0].id : '');
      if (targetId) {
        setSelectedDatasetId(targetId);
        await loadVersions(targetId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (dsId: string) => {
    try {
      const vList = await apiClient.get<DatasetVersion[]>(`/datasets/${dsId}/versions`);
      setVersions(vList);
      if (vList.length >= 2) {
        setFromVerId(vList[vList.length - 1].id);
        setToVerId(vList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleSelectDataset = (id: string) => {
    setSelectedDatasetId(id);
    loadVersions(id);
    setDiffResult(null);
    setActionMessage(null);
  };

  const handleRunCompare = async () => {
    if (!fromVerId || !toVerId) return;
    setDiffLoading(true);
    try {
      const res = await apiClient.get<any>(
        `/versions/compare?datasetId=${selectedDatasetId}&fromVersionId=${fromVerId}&toVersionId=${toVerId}`
      );
      setDiffResult(res);
      setCompareModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi so sánh phiên bản.');
    } finally {
      setDiffLoading(false);
    }
  };

  const handleRollback = async (ver: DatasetVersion) => {
    if (!confirm(`Bạn có chắc chắn muốn khôi phục lại dữ liệu về phiên bản [${ver.versionTag}]? Thao tác này sẽ tạo một commit mới giữ nguyên lịch sử.`)) {
      return;
    }

    setIsRollingBack(true);
    setActionMessage(null);
    try {
      const res = await apiClient.post<any>(`/versions/${ver.id}/rollback`, {
        datasetId: selectedDatasetId,
      });
      setActionMessage(`Đã khôi phục thành công! Phiên bản hiện tại là ${res.dataset.currentVersionTag}`);
      loadVersions(selectedDatasetId);
    } catch (err: any) {
      alert(err.message || 'Không thể khôi phục phiên bản.');
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleToggleStable = async (ver: DatasetVersion) => {
    try {
      await apiClient.put(`/versions/${ver.id}/tag-stable`, {
        datasetId: selectedDatasetId,
        isStable: !ver.isStable,
      });
      loadVersions(selectedDatasetId);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đổi cờ phiên bản.');
    }
  };

  if (loading) return <LoadingSpinner text="Đang nạp cây lịch sử phiên bản..." />;

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <GitBranch className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Lịch sử phiên bản dữ liệu (Data Versioning & Diff)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mô hình commit và snapshot kiểu Git dành cho dữ liệu: xem sự khác biệt giữa các lần làm sạch và khôi phục an toàn
          </p>
        </div>

        {selectedDataset && (
          <Link to={`/normalization?datasetId=${selectedDataset.id}`}>
            <Button variant="primary" size="sm">
              Chuẩn hóa & Commit mới
            </Button>
          </Link>
        )}
      </div>

      {/* Dataset Picker and Diff Compare Trigger Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Chọn tập dữ liệu cần theo dõi:
            </label>
            <select
              value={selectedDatasetId}
              onChange={(e) => handleSelectDataset(e.target.value)}
              className="mt-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-3 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.currentVersionTag})
                </option>
              ))}
            </select>
          </div>
        </div>

        {versions.length >= 2 && (
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">So sánh Diff:</span>
            <select
              value={fromVerId}
              onChange={(e) => setFromVerId(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionTag}
                </option>
              ))}
            </select>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={toVerId}
              onChange={(e) => setToVerId(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionTag}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunCompare}
              isLoading={diffLoading}
            >
              So sánh Diff
            </Button>
          </div>
        )}
      </Card>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Version Commits Timeline */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Nhật ký Commits ({versions.length} phiên bản đã lưu)
        </h2>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-950">
          {versions.map((ver, idx) => {
            const isLatest = idx === 0;
            return (
              <div key={ver.id} className="relative group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isLatest
                      ? 'bg-indigo-600 border-white dark:border-slate-900 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-700 text-indigo-600'
                  }`}
                >
                  <GitCommit className="w-3 h-3" />
                </div>

                {/* Commit Card */}
                <Card className={`p-5 ${isLatest ? 'border-l-4 border-l-indigo-600' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                          {ver.versionTag}
                        </span>
                        {isLatest && <Badge variant="primary">Phiên bản hiện tại</Badge>}
                        {ver.isStable && <Badge variant="success">Release Ổn định</Badge>}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {ver.commitMessage}
                      </h3>

                      {ver.appliedRulesSummary && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Quy tắc đã áp dụng: <em>{ver.appliedRulesSummary}</em>
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span>Tác giả: <strong className="text-slate-700 dark:text-slate-300">{ver.createdByName || 'Admin'}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          {ver.rowCount} dòng / {ver.columnCount} cột
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ver.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setViewingVersion(ver);
                          setSnapshotModalOpen(true);
                        }}
                      >
                        Xem dữ liệu
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStable(ver)}
                        title={ver.isStable ? 'Hủy đánh dấu bản ổn định' : 'Đánh dấu bản ổn định'}
                      >
                        {ver.isStable ? 'Bỏ Stable' : 'Tag Stable'}
                      </Button>

                      {!isLatest && (
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-500" />}
                          onClick={() => handleRollback(ver)}
                          isLoading={isRollingBack}
                        >
                          Rollback
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal So Sánh Diff Giữa 2 Phiên Bản */}
      <Modal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        title="Bảng so sánh Diff giữa hai phiên bản"
        description={diffResult ? `Từ ${diffResult.fromVersion.versionTag} sang ${diffResult.toVersion.versionTag}` : ''}
        maxWidth="4xl"
      >
        {diffResult && (
          <div className="space-y-4">
            {/* Diff Summary Badges */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <Plus className="w-4 h-4" /> {diffResult.diff.added} dòng thêm mới
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <RefreshCw className="w-3.5 h-3.5" /> {diffResult.diff.modified} dòng đã sửa
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-rose-600 font-bold">
                <Minus className="w-4 h-4" /> {diffResult.diff.removed} dòng đã xóa / khử trùng
              </span>
            </div>

            {/* Diff Rows Table */}
            <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2">Trạng thái</th>
                    <th className="px-3 py-2">Hàng trước đó (Old)</th>
                    <th className="px-3 py-2">Hàng hiện tại (New)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {diffResult.diff.diffRows.map((r: any, idx: number) => {
                    const isMod = r.status === 'modified';
                    const isAdd = r.status === 'added';
                    const isRem = r.status === 'removed';

                    return (
                      <tr
                        key={idx}
                        className={
                          isMod
                            ? 'bg-amber-50/50 dark:bg-amber-950/20'
                            : isAdd
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                            : isRem
                            ? 'bg-rose-50/50 dark:bg-rose-950/20'
                            : ''
                        }
                      >
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              isMod ? 'warning' : isAdd ? 'success' : isRem ? 'danger' : 'secondary'
                            }
                            size="sm"
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-slate-500 whitespace-pre-wrap">
                          {r.old ? JSON.stringify(r.old) : '-'}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                          {r.new ? JSON.stringify(r.new) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setCompareModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Xem Snapshot Chi Tiết */}
      <Modal
        isOpen={snapshotModalOpen}
        onClose={() => setSnapshotModalOpen(false)}
        title={`Dữ liệu Snapshot: ${viewingVersion?.versionTag || ''}`}
        description={viewingVersion?.commitMessage || ''}
        maxWidth="4xl"
      >
        {viewingVersion && (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-96 border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    {viewingVersion.snapshotData.length > 0 &&
                      Object.keys(viewingVersion.snapshotData[0]).map((h) => (
                        <th key={h} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {viewingVersion.snapshotData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-1.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          {String(v ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setSnapshotModalOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
