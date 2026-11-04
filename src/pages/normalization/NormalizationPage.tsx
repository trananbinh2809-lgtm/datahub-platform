import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Wand2, Check, ArrowRight, Play, GitCommit, AlertCircle, 
  RotateCcw, Sparkles, Filter, Database, CheckCircle2, Copy 
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { Button } from '../../components/common/Button.js';
import { Card, LoadingSpinner } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Input } from '../../components/common/Input.js';
import type { Dataset, NormalizationRule, NormalizationPreviewResult } from '../../types/index.js';

export const NormalizationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDatasetId = searchParams.get('datasetId') || '';
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(initialDatasetId);
  const [availableRules, setAvailableRules] = useState<NormalizationRule[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([
    'rule_trim',
    'rule_multi_space',
    'rule_title_case',
    'rule_email',
    'rule_phone_vn',
    'rule_date_iso',
    'rule_null_na',
    'rule_dedup',
  ]);

  // Target column filter
  const [targetColumn, setTargetColumn] = useState<string>('all');

  // Preview state
  const [previewResult, setPreviewResult] = useState<NormalizationPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Apply & Commit state
  const [commitMessage, setCommitMessage] = useState('Cleaned data: Chuẩn hóa họ tên, SĐT, email và khử trùng lặp');
  const [versionTag, setVersionTag] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [dsList, rulesList] = await Promise.all([
          apiClient.get<Dataset[]>('/datasets'),
          apiClient.get<NormalizationRule[]>('/normalization/rules'),
        ]);
        setDatasets(dsList);
        setAvailableRules(rulesList);

        if (!selectedDatasetId && dsList.length > 0) {
          setSelectedDatasetId(dsList[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  const toggleRule = (ruleId: string) => {
    setSelectedRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  const handleRunPreview = async () => {
    if (!selectedDatasetId) {
      setPreviewError('Vui lòng chọn một tập dữ liệu để chuẩn hóa.');
      return;
    }
    if (selectedRuleIds.length === 0) {
      setPreviewError('Vui lòng tích chọn ít nhất 1 quy tắc chuẩn hóa.');
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setApplySuccess(null);

    try {
      const res = await apiClient.post<NormalizationPreviewResult>('/normalization/preview', {
        datasetId: selectedDatasetId,
        ruleIds: selectedRuleIds,
      });
      setPreviewResult(res);

      if (selectedDataset) {
        setVersionTag(`v1.0.${selectedDataset.currentVersionNumber}-cleaned`);
      }
    } catch (err: any) {
      setPreviewError(err.message || 'Lỗi khi chạy xem trước chuẩn hóa.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyCommit = async () => {
    if (!selectedDatasetId) return;
    setIsApplying(true);
    setPreviewError(null);

    try {
      const res = await apiClient.post<{
        dataset: Dataset;
        version: any;
        stats: any;
      }>('/normalization/apply', {
        datasetId: selectedDatasetId,
        ruleIds: selectedRuleIds,
        commitMessage,
        versionTag: versionTag || undefined,
      });

      setApplySuccess(
        `Đã chuẩn hóa và commit phiên bản ${res.version.versionTag} thành công! Đã thay đổi ${res.stats.totalChanged} dòng, loại bỏ ${res.stats.duplicatesRemoved} dòng trùng.`
      );

      // Refresh datasets list
      const updatedDs = await apiClient.get<Dataset[]>('/datasets');
      setDatasets(updatedDs);
      setPreviewResult(null);
    } catch (err: any) {
      setPreviewError(err.message || 'Lỗi khi áp dụng chuẩn hóa vào dataset.');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang nạp bộ máy chuẩn hóa dữ liệu..." />;

  const columns = selectedDataset?.schema?.map((s) => s.name) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Wand2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Bộ máy chuẩn hóa dữ liệu (Normalization Engine)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Thiết lập chuỗi quy tắc làm sạch dữ liệu, kiểm tra đối chiếu trước/sau và commit phiên bản mới
          </p>
        </div>

        {selectedDataset && (
          <Link to={`/versions?datasetId=${selectedDataset.id}`}>
            <Button variant="outline" size="sm" leftIcon={<GitCommit className="w-4 h-4" />}>
              Xem lịch sử phiên bản (Git)
            </Button>
          </Link>
        )}
      </div>

      {/* Step 1 & 2: Dataset Selector & Rules Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dataset & Target Column Selection (1 col) */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              1. Chọn tập dữ liệu nguồn
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dataset mục tiêu:
                </label>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => {
                    setSelectedDatasetId(e.target.value);
                    setPreviewResult(null);
                    setApplySuccess(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.rowCount} dòng, {d.currentVersionTag})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDataset && (
                <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 text-xs space-y-1.5 border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số dòng hiện tại:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{selectedDataset.rowCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số cột thuộc tính:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{selectedDataset.columnCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phiên bản hiện tại:</span>
                    <Badge variant="primary" size="sm">{selectedDataset.currentVersionTag}</Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Preset Actions */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Tùy chọn nhanh quy tắc
            </h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSelectedRuleIds(availableRules.map((r) => r.id))}
                className="text-left text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                + Chọn tất cả quy tắc chuẩn
              </button>
              <button
                type="button"
                onClick={() => setSelectedRuleIds(['rule_title_case', 'rule_phone_vn', 'rule_email'])}
                className="text-left text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                + Gói CRM: Chuẩn hóa Họ Tên, SĐT, Email
              </button>
              <button
                type="button"
                onClick={() => setSelectedRuleIds(['rule_dedup', 'rule_trim', 'rule_null_na'])}
                className="text-left text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                + Gói Dọn Dữ Liệu: Khử trùng lặp & Khoảng trắng
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Rules Checklist & Sequence (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  2. Chuỗi quy tắc chuẩn hóa (Pipeline)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đã chọn {selectedRuleIds.length} trên {availableRules.length} quy tắc
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play className="w-3.5 h-3.5" />}
                onClick={handleRunPreview}
                isLoading={previewLoading}
              >
                Chạy thử & Xem trước
              </Button>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {availableRules.map((rule) => {
                const isChecked = selectedRuleIds.includes(rule.id);
                return (
                  <div
                    key={rule.id}
                    onClick={() => toggleRule(rule.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {rule.name}
                        </span>
                        <Badge variant="secondary" size="sm">
                          {rule.ruleType}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Errors or Success Notification */}
      {previewError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{previewError}</span>
        </div>
      )}

      {applySuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-start justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <div>
              <p className="font-semibold">{applySuccess}</p>
              <Link to={`/versions?datasetId=${selectedDatasetId}`} className="underline font-bold mt-1 inline-block">
                Đi tới Lịch sử phiên bản &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Comparison View (Original vs Cleaned) */}
      {previewResult && (
        <div className="space-y-6 pt-2">
          {/* Metrics summary banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Tổng số dòng</span>
                <strong className="text-base font-bold text-white">{previewResult.totalRows}</strong>
              </div>
              <div>
                <span className="text-amber-400 block text-[10px] uppercase">Dòng có thay đổi</span>
                <strong className="text-base font-bold text-amber-300">{previewResult.changedRowsCount}</strong>
              </div>
              <div>
                <span className="text-rose-400 block text-[10px] uppercase">Khử trùng lặp</span>
                <strong className="text-base font-bold text-rose-300">-{previewResult.duplicatesFound} dòng</strong>
              </div>
              <div>
                <span className="text-emerald-400 block text-[10px] uppercase">Tỷ lệ thành công</span>
                <strong className="text-base font-bold text-emerald-300">100%</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewResult(null)}
              >
                Hủy bỏ
              </Button>
            </div>
          </div>

          {/* Side by side sample comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Original Sample */}
            <Card className="p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  Dữ liệu gốc (Original Raw Sample)
                </h3>
                <span className="text-[11px] text-slate-400">10 dòng đầu</span>
              </div>
              <div className="overflow-x-auto max-h-80 border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      {previewResult.originalSample.length > 0 &&
                        Object.keys(previewResult.originalSample[0]).map((k) => (
                          <th key={k} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {k}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewResult.originalSample.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-1.5 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap font-mono text-slate-500">
                            {v === null || v === '' ? <span className="text-rose-400">[null]</span> : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Cleaned Sample */}
            <Card className="p-4 overflow-hidden border-indigo-200 dark:border-indigo-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Dữ liệu sau chuẩn hóa (Cleaned Sample)
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Đã chuẩn hóa</span>
              </div>
              <div className="overflow-x-auto max-h-80 border border-indigo-200 dark:border-indigo-950 rounded-lg">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                    <tr>
                      {previewResult.cleanedSample.length > 0 &&
                        Object.keys(previewResult.cleanedSample[0]).map((k) => (
                          <th key={k} className="px-3 py-2 border-r border-emerald-200/50 dark:border-emerald-800/50 whitespace-nowrap">
                            {k}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 dark:divide-emerald-950">
                    {previewResult.cleanedSample.map((row, i) => (
                      <tr key={i} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-1.5 border-r border-emerald-100 dark:border-emerald-950 whitespace-nowrap font-mono font-medium text-slate-900 dark:text-slate-100">
                            {String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Execution Pipeline Logs */}
          <Card className="p-4 bg-slate-950 text-slate-200 font-mono text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-2">
              Nhật ký thực thi (Execution Log):
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {previewResult.logs.map((log, idx) => (
                <div key={idx} className="text-emerald-400">
                  {log}
                </div>
              ))}
            </div>
          </Card>

          {/* Step 4: Commit as New Version */}
          <Card className="p-6 border-2 border-indigo-500/40">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <GitCommit className="w-4.5 h-4.5 text-indigo-600" />
              Lưu kết quả & Commit phiên bản mới (Git Versioning)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Dữ liệu phiên bản cũ sẽ được lưu lại toàn vẹn trong lịch sử snapshot để có thể so sánh diff hoặc khôi phục (rollback) bất cứ lúc nào.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <Input
                  label="Thông điệp Commit (Commit Message) *"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Mô tả các thao tác chuẩn hóa vừa áp dụng..."
                  required
                />
              </div>
              <div>
                <Input
                  label="Thẻ phiên bản (Version Tag) *"
                  value={versionTag}
                  onChange={(e) => setVersionTag(e.target.value)}
                  placeholder="v1.0.1-cleaned"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewResult(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="success"
                size="md"
                className="bg-emerald-600 hover:bg-emerald-700"
                leftIcon={<GitCommit className="w-4 h-4" />}
                onClick={handleApplyCommit}
                isLoading={isApplying}
              >
                Xác nhận Áp dụng & Tạo Phiên Bản
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
