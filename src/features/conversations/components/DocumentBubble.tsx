import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { MessageAttachment } from '../types';
import { requestAttachmentDownload } from '../download';
import { FileTypeIcon } from './FileTypeIcon';

interface DocumentBubbleProps {
  attachment: MessageAttachment;
  conversationId?: number;
  isMine?: boolean;
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentBubble: React.FC<DocumentBubbleProps> = ({
  attachment,
  conversationId,
  isMine = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    if (!conversationId || isNaN(conversationId) || conversationId <= 0) {
      window.open(attachment.url, '_blank');
      return;
    }
    try {
      setIsDownloading(true);
      await requestAttachmentDownload(
        conversationId,
        attachment.attachment_id,
        attachment.original_name
      );
    } catch {
      // Handled in requestAttachmentDownload
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all mb-2 max-w-sm ${
        isMine
          ? 'bg-rose-950/40 border-rose-800/60 text-white'
          : 'bg-stone-50 border-stone-200 text-stone-900 hover:bg-stone-100/80'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <FileTypeIcon
          filename={attachment.original_name}
          mimeType={attachment.mime_type}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold truncate leading-tight ${
              isMine ? 'text-white' : 'text-stone-900'
            }`}
            title={attachment.original_name}
          >
            {attachment.original_name}
          </p>
          <span
            className={`text-[10px] ${
              isMine ? 'text-rose-200' : 'text-stone-400'
            }`}
          >
            {formatFileSize(attachment.size_bytes)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className={`shrink-0 text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 font-medium transition-colors cursor-pointer disabled:opacity-50 ${
          isMine
            ? 'bg-white text-brand-burgundy hover:bg-rose-50 shadow-xs'
            : 'bg-brand-burgundy text-white hover:bg-brand-burgundy/90 shadow-xs'
        }`}
        title="Tải xuống"
      >
        {isDownloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <span>Tải về</span>
            <Download className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  );
};
