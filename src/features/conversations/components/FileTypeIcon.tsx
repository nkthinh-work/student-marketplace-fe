import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  FileCode,
  File,
} from 'lucide-react';
import { getFileVisualMeta, FileIconType } from './fileVisuals';

export interface FileTypeIconProps {
  filename?: string;
  mimeType?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ICON_COMPONENTS: Record<FileIconType, React.ElementType> = {
  FileText,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  FileCode,
  File,
};

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  filename,
  mimeType,
  size = 'md',
  className = '',
}) => {
  const meta = getFileVisualMeta(filename, mimeType);
  const IconComp = ICON_COMPONENTS[meta.iconName] || FileText;

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  }[size];

  const badgeSizes = {
    sm: 'text-[6.5px] px-1 py-0.2 tracking-tighter',
    md: 'text-[7.5px] px-1.5 py-0.2 tracking-tight',
    lg: 'text-[8.5px] px-1.5 py-0.5 tracking-tight',
  }[size];

  return (
    <div
      className={`relative flex flex-col items-center justify-center shrink-0 border overflow-hidden select-none transition-all ${sizeClasses} ${meta.containerClass} ${className}`}
      title={`${meta.family}: ${filename || meta.badge}`}
    >
      <IconComp className={`${iconSizes} ${meta.iconClass} shrink-0 mb-0.5`} />
      <span
        className={`font-black font-mono leading-none rounded-[3px] uppercase shadow-2xs ${badgeSizes} ${meta.badgeClass}`}
      >
        {meta.badge}
      </span>
    </div>
  );
};
