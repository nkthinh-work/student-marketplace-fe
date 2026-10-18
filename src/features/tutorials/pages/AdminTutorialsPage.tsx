import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit2,
  Trash2,
  Video,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  useAdminTutorials,
  useCreateTutorial,
  useDeleteTutorial,
  useReorderTutorials,
  useReplaceTutorialVideo,
  useUpdateTutorialMetadata,
} from '../hooks';
import {
  NAVIGATION_SECTIONS,
  TUTORIAL_FEATURES,
} from '../featureRegistry';
import { TUTORIAL_ACTIONS, getActionMeta } from '../actionRegistry';
import { NativeVideoPlayer } from '../components/NativeVideoPlayer';
import {
  AdminTutorial,
  MAX_TUTORIAL_VIDEO_SIZE_BYTES,
} from '../types';

export function extractErrorMessage(err: any, fallback: string): string {
  const isDevTunnel =
    typeof window !== 'undefined' &&
    window.location.hostname.includes('devtunnels.ms');

  const requestId =
    err?.response?.headers?.['x-railway-request-id'] ||
    err?.response?.headers?.['x-request-id'] ||
    null;
  const reqIdSuffix = requestId ? ` [Mã yêu cầu: ${requestId}]` : '';

  if (err?.response?.status === 413) {
    if (isDevTunnel) {
      return `Dung lượng tệp vượt quá giới hạn 16 MB của Dev Tunnel. Vui lòng nén video hoặc truy cập localhost:3000.${reqIdSuffix}`;
    }
    return `Dung lượng tệp vượt quá giới hạn tải lên cho phép (HTTP 413 Payload Too Large).${reqIdSuffix}`;
  }

  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return `${detail.trim()}${reqIdSuffix}`;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const joined = detail
      .map((item: any) => item?.msg || (typeof item === 'string' ? item : ''))
      .filter(Boolean)
      .join(', ');
    if (joined) {
      return `${joined}${reqIdSuffix}`;
    }
  }

  const status = err?.response?.status;
  if (status === 502 || status === 503 || status === 504) {
    return `Máy chủ lưu trữ video hoặc cổng kết nối tạm thời không phản hồi (HTTP ${status}). Vui lòng kiểm tra lại danh sách tutorial trước khi thử lại.${reqIdSuffix}`;
  }

  if (status === 500) {
    return `Máy chủ gặp sự cố nội bộ khi xử lý video (HTTP 500). Vui lòng thử lại sau.${reqIdSuffix}`;
  }

  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'Quá thời gian tải lên (timeout). Máy chủ có thể vẫn đang xử lý trong nền, vui lòng kiểm tra lại danh sách tutorial trước khi tải lại.';
  }

  if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
    if (isDevTunnel) {
      return 'Lỗi kết nối mạng hoặc đường truyền tải lên bị ngắt quãng (nếu dùng Dev Tunnel, tệp không được vượt quá 16 MB). Vui lòng kiểm tra lại danh sách.';
    }
    return 'Không thể kết nối đến máy chủ hoặc đường truyền bị gián đoạn (Network Error). Máy chủ có thể đã lưu video, vui lòng làm mới danh sách tutorial để kiểm tra trước khi tải lại.';
  }

  return `${fallback}${reqIdSuffix}`;
}

function formatDuration(ms?: number | null): string {
  if (!ms || ms <= 0) return '';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export const AdminTutorialsPage: React.FC = () => {
  const [selectedFeatureFilter, setSelectedFeatureFilter] = useState<string>('ALL');
  const [previewTutorial, setPreviewTutorial] = useState<AdminTutorial | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<AdminTutorial | null>(null);
  const [replacingVideoTutorial, setReplacingVideoTutorial] = useState<AdminTutorial | null>(null);
  const [deletingTutorial, setDeletingTutorial] = useState<AdminTutorial | null>(null);

  const { data: tutorials, isLoading, isError, refetch } = useAdminTutorials(
    selectedFeatureFilter === 'ALL' ? undefined : selectedFeatureFilter
  );

  const createMutation = useCreateTutorial();
  const updateMutation = useUpdateTutorialMetadata();
  const replaceVideoMutation = useReplaceTutorialVideo();
  const reorderMutation = useReorderTutorials();
  const deleteMutation = useDeleteTutorial();

  // Group tutorials by feature
  const groupedTutorials: Record<string, AdminTutorial[]> = {};
  if (tutorials) {
    for (const t of tutorials) {
      const arr = groupedTutorials[t.feature_key] ?? (groupedTutorials[t.feature_key] = []);
      arr.push(t);
    }
    // Sort items inside each feature by sort_order
    for (const key of Object.keys(groupedTutorials)) {
      groupedTutorials[key]?.sort((a, b) => a.sort_order - b.sort_order || a.tutorial_id - b.tutorial_id);
    }
  }

  // Handle reorder up/down
  const handleMove = async (tutorial: AdminTutorial, direction: 'UP' | 'DOWN') => {
    const list = groupedTutorials[tutorial.feature_key] || [];
    const index = list.findIndex((t) => t.tutorial_id === tutorial.tutorial_id);
    if (index === -1) return;
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === list.length - 1) return;

    const newIndex = direction === 'UP' ? index - 1 : index + 1;
    const reordered = [...list];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(newIndex, 0, moved);

    try {
      await reorderMutation.mutateAsync({
        feature_key: tutorial.feature_key,
        tutorial_ids: reordered.map((t) => t.tutorial_id),
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể sắp xếp lại tutorial');
    }
  };

  const handleTogglePublish = async (tutorial: AdminTutorial) => {
    try {
      await updateMutation.mutateAsync({
        tutorialId: tutorial.tutorial_id,
        payload: { is_published: !tutorial.is_published },
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async () => {
    if (!deletingTutorial) return;
    try {
      await deleteMutation.mutateAsync(deletingTutorial.tutorial_id);
      setDeletingTutorial(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể xóa tutorial');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-burgundy font-outfit">
            Quản lý Tutorial
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            Quản lý các video hướng dẫn ngắn dạng dọc 9:16 định hướng theo cấu trúc điều hướng website
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy/90 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Tutorial</span>
        </button>
      </div>

      {/* Filter by Navigation Location */}
      <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-2xl border border-brand-border/60 shadow-xs flex-wrap">
        <span className="text-xs font-semibold text-brand-text-secondary shrink-0">
          Vị trí điều hướng:
        </span>
        <select
          value={selectedFeatureFilter}
          onChange={(e) => setSelectedFeatureFilter(e.target.value)}
          className="text-xs sm:text-sm border border-brand-border rounded-xl px-3 py-1.5 bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-burgundy cursor-pointer"
        >
          <option value="ALL">Tất cả vị trí</option>
          {NAVIGATION_SECTIONS.map((section) => {
            const sectionFeatures = TUTORIAL_FEATURES.filter((f) => f.section === section.label);
            return (
              <optgroup key={section.id} label={section.label}>
                {sectionFeatures.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      {/* Loading / Error States */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-white rounded-3xl border border-brand-border/60 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="p-8 text-center bg-white rounded-2xl border border-brand-border">
          <AlertCircle className="h-8 w-8 text-brand-price mx-auto mb-2" />
          <p className="text-sm font-semibold text-brand-text">
            Không thể tải danh sách Tutorial
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-burgundy text-white text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && (!tutorials || tutorials.length === 0) && (
        <div className="p-12 text-center bg-white rounded-3xl border border-brand-border/80 shadow-xs">
          <Sparkles className="h-10 w-10 text-brand-burgundy/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-brand-text">
            Chưa có Tutorial nào
          </h3>
          <p className="text-xs text-brand-text-secondary mt-1 max-w-sm mx-auto">
            Bấm nút &ldquo;+ Thêm Tutorial&rdquo; phía trên để tải lên video hướng dẫn MP4 9:16 đầu tiên.
          </p>
        </div>
      )}

      {/* Grouped Features List */}
      {!isLoading && !isError && (
        <div className="space-y-6">
          {TUTORIAL_FEATURES.filter(
            (f) => selectedFeatureFilter === 'ALL' || f.key === selectedFeatureFilter
          ).map((feature) => {
            const featureItems = groupedTutorials[feature.key] || [];
            if (featureItems.length === 0 && selectedFeatureFilter === 'ALL') {
              return null; // hide empty groups in ALL view
            }
            const Icon = feature.icon;

            return (
              <div
                key={feature.key}
                className="bg-white rounded-3xl border border-brand-border/80 p-5 shadow-xs"
              >
                {/* Feature Header */}
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-brand-border/40">
                  <div className="h-8 w-8 rounded-xl bg-brand-soft-pink flex items-center justify-center text-brand-burgundy">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-brand-text-muted tracking-wider bg-stone-100 px-2 py-0.5 rounded-md">
                        {feature.section}
                      </span>
                      <h2 className="text-sm sm:text-base font-bold text-brand-text">
                        {feature.label}
                      </h2>
                    </div>
                    <span className="text-xs text-brand-text-muted mt-0.5 block">
                      {featureItems.length} video hướng dẫn
                    </span>
                  </div>
                </div>

                {/* Items in Feature */}
                {featureItems.length === 0 ? (
                  <p className="text-xs text-brand-text-muted italic py-3">
                    Chưa có tutorial nào trong nhóm này.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {featureItems.map((item, idx) => {
                      const actionMeta = getActionMeta(item.action_key);
                      return (
                        <div
                          key={item.tutorial_id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50/70 border border-brand-border/50 hover:border-brand-border transition-colors"
                        >
                          {/* Left: Reorder controls + Thumbnail + Metadata */}
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Up / Down Reorder buttons */}
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0 || reorderMutation.isPending}
                                onClick={() => handleMove(item, 'UP')}
                                className="h-7 w-7 rounded-lg bg-white border border-brand-border/60 flex items-center justify-center text-brand-text-muted hover:text-brand-burgundy disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                aria-label="Di chuyển lên"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === featureItems.length - 1 || reorderMutation.isPending}
                                onClick={() => handleMove(item, 'DOWN')}
                                className="h-7 w-7 rounded-lg bg-white border border-brand-border/60 flex items-center justify-center text-brand-text-muted hover:text-brand-burgundy disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                aria-label="Di chuyển xuống"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Derived Video Thumbnail */}
                            <div className="relative h-16 w-11 rounded-xl overflow-hidden bg-black shrink-0 border border-brand-border flex items-center justify-center">
                              {item.thumbnail_url ? (
                                <img
                                  src={item.thumbnail_url}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Video className="h-5 w-5 text-white/60" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xs sm:text-sm font-semibold text-brand-text break-words line-clamp-2" title={item.title}>
                                  {item.title}
                                </h3>
                                {/* Status badge */}
                                {item.is_published ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Đã xuất bản
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Bản nháp
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-brand-text-muted mt-1 flex-wrap">
                                {item.duration_ms && (
                                  <span>Thời lượng: {formatDuration(item.duration_ms)}</span>
                                )}
                                {actionMeta && (
                                  <span className="bg-brand-soft-pink text-brand-burgundy px-2 py-0.5 rounded-md font-medium">
                                    {actionMeta.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions row */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setPreviewTutorial(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-white border border-brand-border/60 hover:bg-stone-100 text-xs font-semibold text-brand-text transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Xem thử</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingTutorial(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-white border border-brand-border/60 hover:bg-stone-100 text-xs font-semibold text-brand-text transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setReplacingVideoTutorial(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-white border border-brand-border/60 hover:bg-stone-100 text-xs font-semibold text-brand-text transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Video className="h-3.5 w-3.5" />
                              <span>Đổi video</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePublish(item)}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                                item.is_published
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {item.is_published ? 'Ẩn' : 'Xuất bản'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingTutorial(item)}
                              className="p-1.5 rounded-xl bg-white border border-brand-border/60 hover:bg-red-50 text-brand-price transition-colors cursor-pointer"
                              aria-label="Xóa tutorial"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD TUTORIAL */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <AddTutorialModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => setIsAddModalOpen(false)}
          createMutation={createMutation}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT METADATA */}
      {/* ========================================================= */}
      {editingTutorial && (
        <EditMetadataModal
          tutorial={editingTutorial}
          onClose={() => setEditingTutorial(null)}
          onSuccess={() => setEditingTutorial(null)}
          updateMutation={updateMutation}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 3: REPLACE VIDEO */}
      {/* ========================================================= */}
      {replacingVideoTutorial && (
        <ReplaceVideoModal
          tutorial={replacingVideoTutorial}
          onClose={() => setReplacingVideoTutorial(null)}
          onSuccess={() => setReplacingVideoTutorial(null)}
          replaceMutation={replaceVideoMutation}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 4: PREVIEW MODAL */}
      {/* ========================================================= */}
      {previewTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-brand-border flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewTutorial(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center text-brand-text-muted hover:text-brand-text hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Đóng xem trước"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-bold text-brand-text mb-3 px-6 text-center line-clamp-2">
              {previewTutorial.title}
            </h3>

            <NativeVideoPlayer
              videoUrl={previewTutorial.video_url}
              posterUrl={previewTutorial.thumbnail_url}
              title={previewTutorial.title}
            />

            {previewTutorial.description && (
              <p className="text-xs text-brand-text-secondary mt-3 text-center line-clamp-3">
                {previewTutorial.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: DELETE CONFIRMATION */}
      {/* ========================================================= */}
      {deletingTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-brand-border">
            <h3 className="text-base font-bold text-brand-text">
              Xác nhận xóa Tutorial
            </h3>
            <p className="text-xs text-brand-text-secondary mt-2 leading-relaxed break-words">
              Bạn có chắc chắn muốn xóa tutorial &ldquo;<span className="font-semibold text-brand-text">{deletingTutorial.title}</span>&rdquo;? Hành động này sẽ xóa vĩnh viễn video khỏi cơ sở dữ liệu và Cloudinary.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setDeletingTutorial(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-brand-border hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-price text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// SUBCOMPONENT: ADD TUTORIAL MODAL
// =========================================================
function AddTutorialModal({
  onClose,
  onSuccess,
  createMutation,
}: {
  onClose: () => void;
  onSuccess: () => void;
  createMutation: ReturnType<typeof useCreateTutorial>;
}) {
  const queryClient = useQueryClient();
  const initialFeature = TUTORIAL_FEATURES[0]?.key || 'HOME';
  const initialDefaultAction = TUTORIAL_FEATURES[0]?.defaultActionKey || 'HOME';

  const [featureKey, setFeatureKey] = useState<string>(initialFeature);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionKey, setActionKey] = useState(initialDefaultAction);
  const [isPublished, setIsPublished] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadStageText, setUploadStageText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleFeatureChange = (newKey: string) => {
    setFeatureKey(newKey);
    const meta = TUTORIAL_FEATURES.find((f) => f.key === newKey);
    if (meta?.defaultActionKey) {
      setActionKey(meta.defaultActionKey);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp4') && file.type !== 'video/mp4') {
      setErrorMsg('Vui lòng chọn tệp video định dạng MP4');
      return;
    }
    if (file.size > MAX_TUTORIAL_VIDEO_SIZE_BYTES) {
      setErrorMsg('Video vượt quá dung lượng cho phép (tối đa 100 MB)');
      return;
    }
    setErrorMsg(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      setErrorMsg('Vui lòng chọn tệp video MP4 9:16');
      return;
    }
    if (videoFile.size > MAX_TUTORIAL_VIDEO_SIZE_BYTES) {
      setErrorMsg('Video vượt quá dung lượng cho phép (tối đa 100 MB)');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề Tutorial');
      return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('feature_key', featureKey);
    formData.append('title', title.trim());
    if (description.trim()) {
      formData.append('description', description.trim());
    }
    if (actionKey) {
      formData.append('action_key', actionKey);
    }
    formData.append('is_published', String(isPublished));

    try {
      setUploadPercent(0);
      setUploadStageText('Đang khởi tạo phiên tải lên...');
      await createMutation.mutateAsync({
        formData,
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent && typeof progressEvent.stage === 'string') {
            if (progressEvent.stage === 'REQUESTING_SIGNATURE') {
              setUploadStageText('Đang xin chữ ký tải lên Cloudinary...');
            } else if (progressEvent.stage === 'UPLOADING_CLOUDINARY') {
              const chunkInfo =
                progressEvent.totalChunks && progressEvent.totalChunks > 1
                  ? ` (Đoạn ${progressEvent.currentChunk}/${progressEvent.totalChunks})`
                  : '';
              setUploadStageText(`Đang tải lên Cloudinary${chunkInfo}...`);
              setUploadPercent(progressEvent.percent);
            } else if (progressEvent.stage === 'VERIFYING_BACKEND') {
              setUploadStageText('Đang xác thực và lưu tutorial...');
              setUploadPercent(100);
            }
          } else if (progressEvent?.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadPercent(percent);
          }
        },
      });
      onSuccess();
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      setErrorMsg(extractErrorMessage(err, 'Tạo tutorial thất bại. Vui lòng kiểm tra lại.'));
    } finally {
      setUploadPercent(null);
      setUploadStageText(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-brand-border my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-brand-border/50">
          <h2 className="text-base font-bold text-brand-burgundy font-outfit">
            Thêm Tutorial mới
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-price flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Vị trí Tutorial *
            </label>
            <select
              value={featureKey}
              onChange={(e) => handleFeatureChange(e.target.value)}
              className="w-full text-xs sm:text-sm border border-brand-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-burgundy"
            >
              {NAVIGATION_SECTIONS.map((section) => {
                const sectionFeatures = TUTORIAL_FEATURES.filter((f) => f.section === section.label);
                return (
                  <optgroup key={section.id} label={section.label}>
                    {sectionFeatures.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Tiêu đề Tutorial *
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="VD: Cách quản lý tin đăng"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm border border-brand-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-burgundy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Mô tả ngắn (tối đa 500 ký tự)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="Hướng dẫn xem, chỉnh sửa và quản lý các tin đã đăng..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs sm:text-sm border border-brand-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-burgundy resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Video dọc 9:16 (MP4) *
            </label>
            <input
              type="file"
              accept="video/mp4"
              onChange={handleVideoChange}
              className="w-full text-xs border border-brand-border rounded-xl p-2 cursor-pointer"
            />
            {videoFile && (
              <div className="space-y-1.5 mt-1.5">
                <p className="text-[11px] text-emerald-700 font-medium">
                  Đã chọn: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </p>
                {typeof window !== 'undefined' &&
                  window.location.hostname.includes('devtunnels.ms') &&
                  videoFile.size > 15 * 1024 * 1024 && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-tight">
                      ⚠️ <strong>Lưu ý:</strong> Bạn đang truy cập qua Dev Tunnel (giới hạn 16 MB của Microsoft). Tệp dung lượng {(videoFile.size / (1024 * 1024)).toFixed(1)} MB có thể bị Dev Tunnel chặn với lỗi 413. Vui lòng truy cập trực tiếp qua localhost:3000 hoặc nén video dưới 16 MB khi sử dụng Dev Tunnel.
                    </div>
                  )}
              </div>
            )}
            {videoPreviewUrl && (
              <div className="mt-2 w-28 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-brand-border">
                <video
                  src={videoPreviewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Hành động sau khi xem (&ldquo;Làm ngay&rdquo;)
            </label>
            <select
              value={actionKey}
              onChange={(e) => setActionKey(e.target.value)}
              className="w-full text-xs sm:text-sm border border-brand-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-burgundy"
            >
              <option value="">Không có hành động</option>
              {TUTORIAL_ACTIONS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-brand-border text-brand-burgundy focus:ring-brand-burgundy cursor-pointer"
            />
            <label htmlFor="is_published" className="text-xs font-semibold text-brand-text cursor-pointer">
              Xuất bản ngay (hiển thị công khai)
            </label>
          </div>

          {uploadPercent !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-brand-text-secondary">
                <span>{uploadStageText || (uploadPercent < 100 ? 'Đang tải tệp lên Cloudinary...' : 'Đang xử lý và đồng bộ video...')}</span>
                <span>{uploadPercent}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-burgundy h-full transition-all duration-200 rounded-full"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-brand-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-brand-border hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-burgundy text-white hover:bg-brand-burgundy/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>
                    {uploadStageText
                      ? `${uploadStageText} ${uploadPercent ?? 0}%`
                      : uploadPercent !== null && uploadPercent < 100
                      ? `Đang tải lên... ${uploadPercent}%`
                      : 'Đang xử lý video...'}
                  </span>
                </>
              ) : (
                <span>Lưu Tutorial</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================
// SUBCOMPONENT: EDIT METADATA MODAL
// =========================================================
function EditMetadataModal({
  tutorial,
  onClose,
  onSuccess,
  updateMutation,
}: {
  tutorial: AdminTutorial;
  onClose: () => void;
  onSuccess: () => void;
  updateMutation: ReturnType<typeof useUpdateTutorialMetadata>;
}) {
  const [featureKey, setFeatureKey] = useState<string>(tutorial.feature_key);
  const [title, setTitle] = useState(tutorial.title);
  const [description, setDescription] = useState(tutorial.description || '');
  const [actionKey, setActionKey] = useState(tutorial.action_key || '');
  const [isPublished, setIsPublished] = useState(tutorial.is_published);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề Tutorial');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        tutorialId: tutorial.tutorial_id,
        payload: {
          feature_key: featureKey,
          title: title.trim(),
          description: description.trim() || null,
          action_key: actionKey || null,
          is_published: isPublished,
        },
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, 'Cập nhật thất bại'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-brand-border">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-brand-border/50 gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-brand-burgundy font-outfit">
              Chỉnh sửa Tutorial
            </h2>
            <p className="text-xs text-stone-500 truncate" title={tutorial.title}>
              {tutorial.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-price flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Vị trí Tutorial *
            </label>
            <select
              value={featureKey}
              onChange={(e) => setFeatureKey(e.target.value)}
              className="w-full text-xs sm:text-sm border border-brand-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-burgundy"
            >
              {NAVIGATION_SECTIONS.map((section) => {
                const sectionFeatures = TUTORIAL_FEATURES.filter((f) => f.section === section.label);
                return (
                  <optgroup key={section.id} label={section.label}>
                    {sectionFeatures.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Tiêu đề Tutorial *
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm border border-brand-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-burgundy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs sm:text-sm border border-brand-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-burgundy resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Hành động sau khi xem
            </label>
            <select
              value={actionKey}
              onChange={(e) => setActionKey(e.target.value)}
              className="w-full text-xs sm:text-sm border border-brand-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-burgundy"
            >
              <option value="">Không có hành động</option>
              {TUTORIAL_ACTIONS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit_is_published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-brand-border text-brand-burgundy focus:ring-brand-burgundy cursor-pointer"
            />
            <label htmlFor="edit_is_published" className="text-xs font-semibold text-brand-text cursor-pointer">
              Đã xuất bản (công khai)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-brand-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-brand-border hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-burgundy text-white hover:bg-brand-burgundy/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================
// SUBCOMPONENT: REPLACE VIDEO MODAL
// =========================================================
function ReplaceVideoModal({
  tutorial,
  onClose,
  onSuccess,
  replaceMutation,
}: {
  tutorial: AdminTutorial;
  onClose: () => void;
  onSuccess: () => void;
  replaceMutation: ReturnType<typeof useReplaceTutorialVideo>;
}) {
  const queryClient = useQueryClient();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadStageText, setUploadStageText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      setErrorMsg('Vui lòng chọn video MP4 mới');
      return;
    }
    if (videoFile.size > MAX_TUTORIAL_VIDEO_SIZE_BYTES) {
      setErrorMsg('Video vượt quá dung lượng cho phép (tối đa 100 MB)');
      return;
    }

    try {
      setUploadPercent(0);
      setUploadStageText('Đang khởi tạo phiên tải lên...');
      await replaceMutation.mutateAsync({
        tutorialId: tutorial.tutorial_id,
        videoFile,
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent && typeof progressEvent.stage === 'string') {
            if (progressEvent.stage === 'REQUESTING_SIGNATURE') {
              setUploadStageText('Đang xin chữ ký tải lên Cloudinary...');
            } else if (progressEvent.stage === 'UPLOADING_CLOUDINARY') {
              const chunkInfo =
                progressEvent.totalChunks && progressEvent.totalChunks > 1
                  ? ` (Đoạn ${progressEvent.currentChunk}/${progressEvent.totalChunks})`
                  : '';
              setUploadStageText(`Đang tải lên Cloudinary${chunkInfo}...`);
              setUploadPercent(progressEvent.percent);
            } else if (progressEvent.stage === 'VERIFYING_BACKEND') {
              setUploadStageText('Đang xác thực và đồng bộ video...');
              setUploadPercent(100);
            }
          } else if (progressEvent?.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadPercent(percent);
          }
        },
      });
      onSuccess();
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      setErrorMsg(extractErrorMessage(err, 'Thay thế video thất bại'));
    } finally {
      setUploadPercent(null);
      setUploadStageText(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-brand-border">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-brand-border/50 gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-brand-burgundy font-outfit">
              Thay thế Video
            </h2>
            <p className="text-xs text-stone-500 truncate" title={tutorial.title}>
              {tutorial.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={replaceMutation.isPending}
            className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-price flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Chọn tệp video MP4 dọc 9:16 mới
            </label>
            <input
              type="file"
              accept="video/mp4"
              required
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && file.size > MAX_TUTORIAL_VIDEO_SIZE_BYTES) {
                  setErrorMsg('Video vượt quá dung lượng cho phép (tối đa 100 MB)');
                } else {
                  setErrorMsg(null);
                }
                if (videoPreviewUrl) {
                  URL.revokeObjectURL(videoPreviewUrl);
                }
                setVideoFile(file);
                if (file) {
                  setVideoPreviewUrl(URL.createObjectURL(file));
                } else {
                  setVideoPreviewUrl(null);
                }
              }}
              className="w-full text-xs border border-brand-border rounded-xl p-2 cursor-pointer"
            />
            {videoFile && (
              <div className="space-y-1.5 mt-1.5">
                <p className="text-[11px] text-emerald-700 font-medium">
                  Đã chọn: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </p>
                {typeof window !== 'undefined' &&
                  window.location.hostname.includes('devtunnels.ms') &&
                  videoFile.size > 15 * 1024 * 1024 && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-tight">
                      ⚠️ <strong>Lưu ý:</strong> Bạn đang truy cập qua Dev Tunnel (giới hạn 16 MB của Microsoft). Tệp dung lượng {(videoFile.size / (1024 * 1024)).toFixed(1)} MB có thể bị Dev Tunnel chặn với lỗi 413. Vui lòng truy cập trực tiếp qua localhost:3000 hoặc nén video dưới 16 MB khi sử dụng Dev Tunnel.
                    </div>
                  )}
              </div>
            )}
            {videoPreviewUrl && (
              <div className="mt-2 w-28 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-brand-border">
                <video
                  src={videoPreviewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {uploadPercent !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-brand-text-secondary">
                <span>{uploadStageText || (uploadPercent < 100 ? 'Đang tải tệp lên Cloudinary...' : 'Đang xử lý và đồng bộ video...')}</span>
                <span>{uploadPercent}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-burgundy h-full transition-all duration-200 rounded-full"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-brand-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={replaceMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-brand-border hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={replaceMutation.isPending || !videoFile}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-burgundy text-white hover:bg-brand-burgundy/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {replaceMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>
                    {uploadStageText
                      ? `${uploadStageText} ${uploadPercent ?? 0}%`
                      : uploadPercent !== null && uploadPercent < 100
                      ? `Đang tải lên... ${uploadPercent}%`
                      : 'Đang xử lý video...'}
                  </span>
                </>
              ) : (
                <span>Cập nhật Video</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
