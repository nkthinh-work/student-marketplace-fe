import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Paperclip,
  X,
  FileText,
  Video as VideoIcon,
  Mic,
  Package,
  AlertCircle,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import {
  ConversationMemberItem,
  MessageMentionInput,
  ProductContextSummary,
  ReplyMessageSummary,
} from '../types';
import { useGroupMembers } from '../hooks';
import { useCurrentUser } from '@/features/users/hooks';
import { ProductPickerModal } from './ProductPickerModal';
import { VoiceRecorder, VoiceRecorderHandle } from './VoiceRecorder';
import { formatVND } from '@/lib/formatters';
import { getGroupChatDisplayName } from '../utils/displayNames';

interface MessageComposerProps {
  onSend: (
    content?: string | null,
    files?: File[],
    productId?: number | null,
    voiceDurationMs?: number | null,
    mentions?: MessageMentionInput[],
    replyToMessageId?: number | null
  ) => void;
  disabled?: boolean;
  placeholder?: string;
  conversationType?: 'DIRECT' | 'GROUP' | 'COMMUNITY';
  otherUserId?: number;
  otherUserName?: string;
  conversationId?: number;
  replyingTo?: ReplyMessageSummary | null;
  onCancelReply?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const MAX_ATTACHMENTS = 4;
const MAX_TOTAL_SIZE = 60 * 1024 * 1024; // 60MB total cap
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'mp4',
  'webm',
  'ogg',
  'mp3',
  'm4a',
  'aac',
  'pdf',
  'txt',
  'docx',
  'xlsx',
  'pptx',
];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Nhập tin nhắn...',
  conversationType = 'DIRECT',
  otherUserId,
  otherUserName = 'Người dùng',
  conversationId,
  replyingTo,
  onCancelReply,
  onFocus,
  onBlur,
}) => {
  const { data: currentUser } = useCurrentUser();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductContextSummary | null>(null);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mention suggestions state
  const { data: members = [] } = useGroupMembers(conversationId || 0);
  const [mentionTrigger, setMentionTrigger] = useState<{
    query: string;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [activeMentions, setActiveMentions] = useState<
    Array<{ id: string; userId: number; displayText: string }>
  >([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorderHandle>(null);
  const [isComposing, setIsComposing] = useState(false);

  const isDirect = conversationType === 'DIRECT';

  // Filter members for @mentions (GROUP only, excluding current user)
  const filteredMentionMembers = useMemo(() => {
    if (!mentionTrigger || conversationType !== 'GROUP') return [];
    const q = mentionTrigger.query.toLowerCase().trim();
    const candidateMembers = members.filter(
      (m) => !currentUser || m.user_id !== currentUser.user_id
    );
    if (!q) return candidateMembers;
    return candidateMembers.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        (m.nickname && m.nickname.toLowerCase().includes(q))
    );
  }, [mentionTrigger, conversationType, members, currentUser]);

  // Reset mention state when conversation changes
  useEffect(() => {
    setActiveMentions([]);
    setMentionTrigger(null);
  }, [conversationId]);

  // Reset mention highlighted index when list size changes
  useEffect(() => {
    setSelectedMentionIndex(0);
  }, [filteredMentionMembers.length]);

  // Generate object URLs for preview
  const filePreviews = useMemo(() => {
    return selectedFiles.map((file) => {
      const lowerName = file.name.toLowerCase();
      const ext = lowerName.split('.').pop() || '';
      const isImg =
        file.type.startsWith('image/') ||
        ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
      const isVid =
        file.type.startsWith('video/') || ['mp4', 'webm'].includes(ext);
      const isAud =
        file.type.startsWith('audio/') ||
        ['mp3', 'ogg', 'wav', 'm4a', 'aac', 'webm'].includes(ext);
      const previewUrl = isImg ? URL.createObjectURL(file) : null;
      return {
        file,
        previewUrl,
        ext,
        isImg,
        isVid,
        isAud,
      };
    });
  }, [selectedFiles]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      filePreviews.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [filePreviews]);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = /(?:^|\s)@([^\s@]*)$/.exec(textBeforeCursor);

    if (match && conversationType === 'GROUP' && members.length > 0) {
      const matchQuery = match[1] ?? '';
      const atIndex = textBeforeCursor.lastIndexOf('@');
      setMentionTrigger({
        query: matchQuery,
        startIndex: atIndex,
        endIndex: cursorPos,
      });
    } else {
      setMentionTrigger(null);
    }
  };

  const handleSelectMention = (member: ConversationMemberItem) => {
    if (!mentionTrigger) return;
    const before = content.slice(0, mentionTrigger.startIndex);
    const after = content.slice(mentionTrigger.endIndex);
    const mentionDisplayName = getGroupChatDisplayName(member);
    const mentionText = `@${mentionDisplayName} `;
    const newContent = `${before}${mentionText}${after}`;

    setContent(newContent);
    setMentionTrigger(null);

    const newEntity = {
      id: `${member.user_id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: member.user_id,
      displayText: `@${mentionDisplayName}`,
    };
    setActiveMentions((prev) => [...prev, newEntity]);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextCursorPos = mentionTrigger.startIndex + mentionText.length;
        textareaRef.current.setSelectionRange(nextCursorPos, nextCursorPos);
      }
    }, 0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrorMessage(null);

    const totalCount = selectedFiles.length + files.length;
    if (totalCount > MAX_ATTACHMENTS) {
      setErrorMessage(
        `Tối đa ${MAX_ATTACHMENTS} tệp đính kèm cho mỗi tin nhắn.`
      );
      return;
    }

    const currentTotalSize = selectedFiles.reduce(
      (acc, f) => acc + f.size,
      0
    );
    const newFilesTotalSize = files.reduce((acc, f) => acc + f.size, 0);

    if (currentTotalSize + newFilesTotalSize > MAX_TOTAL_SIZE) {
      setErrorMessage(
        'Tổng dung lượng đính kèm vượt quá giới hạn 60MB cho mỗi tin nhắn.'
      );
      return;
    }

    const validNewFiles: File[] = [];
    for (const file of files) {
      const ext = file.name.toLowerCase().split('.').pop() || '';
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorMessage(
          `Định dạng ".${ext}" không được hỗ trợ. Chỉ nhận ảnh, video, audio, PDF, DOCX, XLSX, PPTX, TXT.`
        );
        return;
      }

      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) && file.size > MAX_IMAGE_SIZE) {
        setErrorMessage(`Ảnh "${file.name}" vượt quá giới hạn 10MB.`);
        return;
      }
      if (['mp4', 'webm'].includes(ext) && file.size > MAX_VIDEO_SIZE) {
        setErrorMessage(`Video "${file.name}" vượt quá giới hạn 50MB.`);
        return;
      }
      if (['mp3', 'ogg', 'm4a', 'aac'].includes(ext) && file.size > MAX_AUDIO_SIZE) {
        setErrorMessage(`Âm thanh "${file.name}" vượt quá giới hạn 15MB.`);
        return;
      }
      if (['pdf', 'docx', 'xlsx', 'pptx', 'txt'].includes(ext) && file.size > MAX_DOC_SIZE) {
        setErrorMessage(`Tài liệu "${file.name}" vượt quá giới hạn 20MB.`);
        return;
      }

      validNewFiles.push(file);
    }

    setSelectedFiles((prev) => [...prev, ...validNewFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const handleStartVoiceRecording = () => {
    setIsVoiceRecording(true);
    setTimeout(() => {
      voiceRecorderRef.current?.startRecording();
    }, 0);
  };

  const handleSendVoice = (audioFile: File, voiceDurationMs: number) => {
    setIsVoiceRecording(false);
    onSend(
      null,
      [audioFile],
      null,
      voiceDurationMs,
      undefined,
      replyingTo ? replyingTo.message_id : null
    );
  };

  const handleCancelVoice = () => {
    setIsVoiceRecording(false);
    voiceRecorderRef.current?.cancelRecording();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    const hasFiles = selectedFiles.length > 0;
    const hasProduct = Boolean(selectedProduct);
    const hasText = trimmed.length > 0;

    if (
      (!hasText && !hasFiles && !hasProduct) ||
      disabled ||
      trimmed.length > 2000
    ) {
      return;
    }

    // Build structured mentions accurately: GROUP only, and only for activeMentions explicitly selected whose token is present in trimmed text
    const mentionsToSend: MessageMentionInput[] = [];
    if (conversationType === 'GROUP' && trimmed && activeMentions.length > 0) {
      const takenRanges: Array<{ start: number; end: number }> = [];

      for (const entity of activeMentions) {
        let searchPos = 0;
        while (searchPos < trimmed.length) {
          const foundIndex = trimmed.indexOf(entity.displayText, searchPos);
          if (foundIndex === -1) break;
          const endIndex = foundIndex + entity.displayText.length;

          const overlaps = takenRanges.some(
            (r) => Math.max(r.start, foundIndex) < Math.min(r.end, endIndex)
          );

          if (!overlaps) {
            takenRanges.push({ start: foundIndex, end: endIndex });
            mentionsToSend.push({
              mentioned_user_id: entity.userId,
              display_text: entity.displayText,
              start_offset: foundIndex,
              end_offset: endIndex,
            });
            break;
          }
          searchPos = endIndex;
        }
      }

      mentionsToSend.sort((a, b) => a.start_offset - b.start_offset);
    }

    onSend(
      hasText ? trimmed : null,
      hasFiles ? selectedFiles : undefined,
      selectedProduct ? selectedProduct.product_id : null,
      null,
      mentionsToSend.length > 0 ? mentionsToSend : undefined,
      replyingTo ? replyingTo.message_id : null
    );

    setContent('');
    setSelectedFiles([]);
    setSelectedProduct(null);
    setErrorMessage(null);
    setMentionTrigger(null);
    setActiveMentions([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing || e.nativeEvent.isComposing) return;

    // Handle mention autocomplete keyboard navigation
    if (mentionTrigger && filteredMentionMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(
          (prev) => (prev + 1) % filteredMentionMembers.length
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(
          (prev) =>
            (prev - 1 + filteredMentionMembers.length) %
            filteredMentionMembers.length
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredMentionMembers[selectedMentionIndex];
        if (selected) {
          handleSelectMention(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionTrigger(null);
        return;
      }
    }

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const charCount = content.length;
  const isTooLong = charCount > 2000;
  const canSubmit =
    (content.trim().length > 0 ||
      selectedFiles.length > 0 ||
      selectedProduct !== null) &&
    !isTooLong &&
    !disabled;

  return (
    <div
      data-ui-role="message-composer"
      className="shrink-0 flex flex-col bg-white border-t border-stone-200 relative pb-[env(safe-area-inset-bottom,0px)]"
    >
      {/* Mention Autocomplete Suggestion Dropdown */}
      {mentionTrigger && filteredMentionMembers.length > 0 && (
        <div className="absolute bottom-full left-2 right-2 sm:right-auto sm:left-3 mb-2 sm:w-80 max-w-[calc(100vw-16px)] bg-white rounded-2xl shadow-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden z-30 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-2 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Nhắc đến thành viên
            </span>
            <span className="text-[10px] text-stone-400">
              ↑↓ chọn · Enter
            </span>
          </div>
          <div className="p-1 space-y-0.5">
            {filteredMentionMembers.map((m, idx) => {
              const isSelected = idx === selectedMentionIndex;
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => handleSelectMention(m)}
                  className={`w-full p-2 rounded-xl flex items-center justify-between gap-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-rose-50 text-brand-burgundy'
                      : 'hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt={m.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-3.5 h-3.5 text-stone-400" />
                        )}
                      </div>
                      {m.is_online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
                      )}
                    </div>
                    <span className="text-xs font-semibold truncate">
                      {getGroupChatDisplayName(m)}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                    {m.role === 'OWNER'
                      ? 'Trưởng nhóm'
                      : m.role === 'ADMIN'
                      ? 'Phó nhóm'
                      : 'Thành viên'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Voice Recorder Mode */}
      {isVoiceRecording ? (
        <VoiceRecorder
          ref={voiceRecorderRef}
          onSendVoice={handleSendVoice}
          onCancel={handleCancelVoice}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col px-2 py-2 sm:px-3 sm:py-2.5 relative"
        >
          {/* Replying banner */}
          {replyingTo && (
            <div className="mb-2 px-3 py-1.5 bg-stone-50 border-l-3 border-brand-burgundy rounded-r-xl flex items-center justify-between text-xs text-stone-700 shadow-2xs animate-in fade-in duration-150">
              <div className="min-w-0 pr-2">
                <span className="font-semibold text-brand-burgundy block truncate text-[11px]">
                  Trả lời {replyingTo.sender_name || 'Người dùng'}
                </span>
                <span className="text-stone-500 truncate block text-[11px]">
                  {replyingTo.preview}
                </span>
              </div>
              <button
                type="button"
                onClick={onCancelReply}
                className="p-1 hover:bg-stone-200/60 rounded-full text-stone-400 hover:text-stone-600 transition-colors shrink-0"
                title="Hủy trả lời"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error alert message */}
          {errorMessage && (
            <div className="mb-1.5 p-1.5 px-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 hover:bg-rose-100 rounded-full transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5 text-rose-600" />
              </button>
            </div>
          )}

          {/* Staged Product Context Card (Compact) */}
          {selectedProduct && (
            <div className="mb-2 flex items-center justify-between p-1.5 px-2 bg-stone-50 border border-stone-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-stone-200 overflow-hidden shrink-0 border border-stone-300 flex items-center justify-center">
                  {selectedProduct.thumbnail_url ? (
                    <img
                      src={selectedProduct.thumbnail_url}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-3.5 h-3.5 text-stone-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate">
                    {selectedProduct.title}
                  </p>
                  <p className="text-[10px] font-bold text-brand-burgundy">
                    {formatVND(selectedProduct.price, {
                      showFreeForZero: true,
                    })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition-colors shrink-0"
                title="Bỏ đính kèm sản phẩm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Staged Attachments Preview Strip (Compact) */}
          {filePreviews.length > 0 && (
            <div className="mb-2 flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
              {filePreviews.map((item, idx) => (
                <div
                  key={idx}
                  className="relative shrink-0 flex items-center bg-stone-50 border border-stone-200 rounded-xl p-1 pr-1.5 max-w-[150px] sm:max-w-[170px] shadow-2xs group"
                  title={item.file.name}
                >
                  {item.isImg && item.previewUrl ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-200 shrink-0">
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : item.isVid ? (
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                      <VideoIcon className="w-4 h-4" />
                    </div>
                  ) : item.ext === 'xlsx' || item.ext === 'xls' ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}

                  <div className="ml-1.5 min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-stone-800 truncate leading-tight">
                      {item.file.name}
                    </p>
                    <span className="text-[9px] text-stone-400">
                      {formatFileSize(item.file.size)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    disabled={disabled}
                    aria-label={`Xóa ${item.file.name}`}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-stone-700 text-white rounded-full flex items-center justify-center shadow-xs hover:bg-stone-900 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {selectedFiles.length < MAX_ATTACHMENTS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="shrink-0 h-8 px-2 border border-dashed border-stone-300 hover:border-brand-burgundy rounded-xl flex items-center gap-1 text-[11px] text-stone-500 hover:text-brand-burgundy transition-colors"
                >
                  <Paperclip className="w-3 h-3" />
                  <span>Thêm</span>
                </button>
              )}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.ogg,.mp3,.m4a,.aac,.pdf,.txt,.docx,.xlsx,.pptx"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex items-end gap-1 sm:gap-1.5">
            {/* Left Utility Controls Cluster */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 pb-0.5">
              {/* Product Picker CTA (DIRECT CHAT ONLY) */}
              {isDirect && (
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(true)}
                  disabled={disabled}
                  aria-label="Chia sẻ sản phẩm"
                  title="Chia sẻ sản phẩm"
                  className={`shrink-0 h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
                    selectedProduct
                      ? 'text-brand-burgundy bg-rose-100/70'
                      : 'text-stone-500 hover:text-brand-burgundy hover:bg-stone-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                </button>
              )}

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || selectedFiles.length >= MAX_ATTACHMENTS}
                aria-label="Đính kèm tệp"
                title="Đính kèm ảnh, video, âm thanh hoặc tài liệu"
                className="shrink-0 h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl flex items-center justify-center text-stone-500 hover:text-brand-burgundy hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Microphone Button for Voice Notes */}
              <button
                type="button"
                onClick={handleStartVoiceRecording}
                disabled={disabled}
                aria-label="Ghi âm tin nhắn thoại"
                title="Ghi âm tin nhắn thoại"
                className="shrink-0 h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl flex items-center justify-center text-stone-500 hover:text-brand-burgundy hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Text Input Area */}
            <div className="flex-1 min-w-0 relative flex items-center bg-stone-50 border border-stone-200 rounded-2xl focus-within:border-brand-burgundy focus-within:ring-1 focus-within:ring-brand-burgundy transition-all px-2.5 sm:px-3 py-1 min-h-[38px]">
              <textarea
                ref={textareaRef}
                rows={1}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder={
                  selectedFiles.length > 0 || selectedProduct
                    ? 'Thêm chú thích...'
                    : placeholder
                }
                disabled={disabled}
                onFocus={onFocus}
                onBlur={onBlur}
                className="w-full bg-transparent resize-none outline-none text-base md:text-sm text-stone-900 placeholder:text-stone-400 max-h-[110px] py-0.5 leading-relaxed"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              aria-label="Gửi tin nhắn"
              title="Gửi tin nhắn"
              className={`shrink-0 h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full flex items-center justify-center transition-all ${
                canSubmit
                  ? 'bg-brand-burgundy text-white hover:bg-brand-burgundy/90 active:scale-95 shadow-xs'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {charCount > 1800 && (
            <div className="flex justify-end mt-1 px-1">
              <span
                className={`text-[11px] ${
                  isTooLong ? 'text-red-500 font-semibold' : 'text-stone-400'
                }`}
              >
                {charCount}/2000
              </span>
            </div>
          )}
        </form>
      )}

      {/* Product Picker Modal */}
      {isDirect && (
        <ProductPickerModal
          isOpen={isProductPickerOpen}
          onClose={() => setIsProductPickerOpen(false)}
          otherUserId={otherUserId || 0}
          otherUserName={otherUserName}
          onSelectProduct={(prod) => setSelectedProduct(prod)}
        />
      )}
    </div>
  );
};
