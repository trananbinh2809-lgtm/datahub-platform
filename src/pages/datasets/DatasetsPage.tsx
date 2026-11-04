import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Database, Upload, Download, Wand2, Search, Table, 
  FileText, CheckCircle2, AlertTriangle, ArrowRight, Plus 
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { Button } from '../../components/common/Button.js';
import { Card, LoadingSpinner } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import { Input } from '../../components/common/Input.js';
import type { Dataset, Project } from '../../types/index.js';

export const DatasetsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');
  const shouldOpenUpload = searchParams.get('upload') === 'true';

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewSearch, setPreviewSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(shouldOpenUpload);
  const [uploadProjectId, setUploadProjectId] = useState(urlProjectId || '');
  const [datasetName, setDatasetName] = useState('');
  const [datasetDesc, setDatasetDesc] = useState('');
  const [fileFormat, setFileFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [rawContent, setRawContent] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dsList, projList] = await Promise.all([
        apiClient.get<Dataset[]>('/datasets'),
        apiClient.get<Project[]>('/projects'),
      ]);
      setDatasets(dsList);
      setProjects(projList);

      if (dsList.length > 0) {
        setSelectedDataset(dsList[0]);
        loadPreview(dsList[0].id, 1, '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadPreview = async (dsId: string, page: number, search: string) => {
    try {
      setPreviewLoading(true);
      const res = await apiClient.get<{
        rows: Record<string, any>[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>(`/datasets/${dsId}/preview?page=${page}&pageSize=15&search=${encodeURIComponent(search)}`);
      setPreviewRows(res.rows);
      setPreviewTotal(res.total);
      setPreviewPage(res.page);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSelectDataset = (ds: Dataset) => {
    setSelectedDataset(ds);
    setPreviewPage(1);
    setPreviewSearch('');
    loadPreview(ds.id, 1, '');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!datasetName) {
      setDatasetName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setRawContent(text);
    };
    reader.readAsText(file);
  };

  const handleFillDemoData = () => {
    setDatasetName('Danh sách giao dịch bán hàng (Sample)');
    setDatasetDesc('Dữ liệu chứa thông tin giao dịch cần làm sạch số tiền, số điện thoại người nhận và ngày thanh toán.');
    setRawContent(
`id,khach_hang,so_dien_thoai,email_lien_he,ngay_giao_dich,so_tien
1,  trần minh đức ,+84 987 654 321, DUC.TRAN@GMAIL.COM ,15/09/2026,1500000
2,nguyễn thị hoa,0912-333-444,hoa.nguyen@company.vn,2026-09-18,2450000
3,LÊ HOÀNG NAM ,+84903111222,nam.le@yahoo.com,05/10/2026,null
4,bùi văn phong ,0944.555.666,phong_bui@gmail.com,12/10/2026,890000
5,  trần minh đức ,+84 987 654 321, DUC.TRAN@GMAIL.COM ,15/09/2026,1500000`
    );
  };

  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadProjectId) {
      setUploadError('Vui lòng chọn dự án chứa dataset.');
      return;
    }
    if (!datasetName.trim()) {
      setUploadError('Tên tập dữ liệu là bắt buộc.');
      return;
    }
    if (!rawContent.trim()) {
      setUploadError('Vui lòng chọn file CSV hoặc nhập nội dung dữ liệu.');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    try {
      const created = await apiClient.post<Dataset>('/datasets/upload', {
        projectId: uploadProjectId,
        name: datasetName,
        description: datasetDesc,
        fileFormat,
        rawContent,
      });

      setDatasets([created, ...datasets]);
      setSelectedDataset(created);
      loadPreview(created.id, 1, '');
      setIsUploadModalOpen(false);
      setDatasetName('');
      setDatasetDesc('');
      setRawContent('');
    } catch (err: any) {
      setUploadError(err.message || 'Tải dữ liệu thất bại.');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải danh sách tập dữ liệu..." />;

  const columns = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Database className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Quản lý tập dữ liệu (Datasets)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tải lên tệp CSV/Excel/JSON, xem trước bảng tính thực tế, kiểm tra phân bố trường và chuẩn bị chuẩn hóa
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Upload className="w-4 h-4" />}
          onClick={() => {
            if (projects.length > 0 && !uploadProjectId) setUploadProjectId(projects[0].id);
            setIsUploadModalOpen(true);
          }}
        >
          Tải lên Dataset
        </Button>
      </div>

      {/* Main Split Layout: Datasets Sidebar + Table Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Datasets List (1 col) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tập dữ liệu hiện có ({datasets.length})
            </h2>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {datasets.map((ds) => {
              const isSelected = selectedDataset?.id === ds.id;
              return (
                <div
                  key={ds.id}
                  onClick={() => handleSelectDataset(ds)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                      {ds.name}
                    </span>
                    <Badge variant={isSelected ? 'primary' : 'secondary'} size="sm">
                      {ds.fileFormat}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {ds.projectName || 'Dự án chính'}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                    <span>{ds.rowCount} dòng • {ds.columnCount} cột</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{ds.currentVersionTag}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Dataset Spreadsheet Preview (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {selectedDataset ? (
            <>
              {/* Dataset Banner Toolbar */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedDataset.name}
                    </h2>
                    <Badge variant="primary">{selectedDataset.currentVersionTag}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tệp gốc: <code className="text-indigo-600 dark:text-indigo-400">{selectedDataset.originalFileName}</code> • {selectedDataset.rowCount} dòng dữ liệu thực tế
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`${(import.meta.env.VITE_API_URL as string) || '/api'}/datasets/${selectedDataset.id}/download`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất CSV</span>
                  </a>

                  <Link to={`/normalization?datasetId=${selectedDataset.id}`}>
                    <Button variant="primary" size="sm" leftIcon={<Wand2 className="w-3.5 h-3.5" />}>
                      Chuẩn hóa dữ liệu
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Table search & pagination control */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm trong bảng..."
                    value={previewSearch}
                    onChange={(e) => {
                      setPreviewSearch(e.target.value);
                      loadPreview(selectedDataset.id, 1, e.target.value);
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="text-xs text-slate-500">
                  Hiển thị {previewRows.length} trên tổng số {previewTotal} dòng
                </div>
              </div>

              {/* Spreadsheet Table View */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                {previewLoading ? (
                  <LoadingSpinner text="Đang tải dữ liệu bảng tính..." />
                ) : previewRows.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Không có dòng dữ liệu nào khớp với tìm kiếm.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2.5 font-bold border-r border-slate-200 dark:border-slate-800 text-slate-400 w-12 text-center">
                          #
                        </th>
                        {columns.map((col) => (
                          <th key={col} className="px-4 py-2.5 font-bold border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                            <span className="text-indigo-600 dark:text-indigo-400 mr-1.5 font-mono text-[10px]">
                              [{typeof previewRows[0][col] === 'number' ? 'NUM' : 'TXT'}]
                            </span>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-colors">
                          <td className="px-3 py-2 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 text-[11px] bg-slate-50/40 dark:bg-slate-800/40 font-mono">
                            {(previewPage - 1) * 15 + idx + 1}
                          </td>
                          {columns.map((col) => {
                            const val = row[col];
                            const isNull = val === null || val === undefined || val === '';
                            return (
                              <td key={col} className="px-4 py-2 border-r border-slate-200/60 dark:border-slate-800/60 whitespace-nowrap">
                                {isNull ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                    [EMPTY/NULL]
                                  </span>
                                ) : (
                                  <span className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                                    {String(val)}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Schema Inspector */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                  Phân tích cấu trúc các cột (Schema Summary)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {selectedDataset.schema.map((col) => (
                    <div key={col.name} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{col.name}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>Kiểu: <strong className="text-indigo-600 dark:text-indigo-400">{col.type}</strong></span>
                        {col.missingCount > 0 && (
                          <span className="text-rose-500 font-semibold">{col.missingCount} ô rỗng</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chưa chọn tập dữ liệu nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tải Lên Tập Dữ Liệu */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Tải lên tập dữ liệu mới"
        description="Hỗ trợ tải lên tệp CSV hoặc dán trực tiếp chuỗi dữ liệu thô."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveUpload} className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-lg bg-rose-50 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {uploadError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Chọn Repository Dự án *
            </label>
            <select
              value={uploadProjectId}
              onChange={(e) => setUploadProjectId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Chọn dự án --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.isPublic ? 'Public' : 'Private'})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Tên tập dữ liệu (Dataset Name) *"
            placeholder="Ví dụ: Du_lieu_Ban_hang_Q3_2026"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả dữ liệu
            </label>
            <textarea
              rows={2}
              value={datasetDesc}
              onChange={(e) => setDatasetDesc(e.target.value)}
              placeholder="Ghi chú về nguồn gốc dữ liệu..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* File Picker or Paste CSV */}
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Chọn tệp CSV từ máy tính
              </span>
              <button
                type="button"
                onClick={handleFillDemoData}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                + Điền dữ liệu mẫu (Dirty Data)
              </button>
            </div>

            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
            />

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Hoặc xem & chỉnh sửa trực tiếp nội dung CSV (Headers ở dòng 1):
              </label>
              <textarea
                rows={5}
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="id,ho_ten,email,sdt,ngay_sinh&#10;1,Nguyễn Văn An,an@gmail.com,0912345678,1995-12-25"
                className="w-full font-mono text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={uploadLoading}
            >
              Lưu & Tải lên Dataset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
