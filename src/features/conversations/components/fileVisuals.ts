/**
 * Pure file-type resolver and visual metadata mapping.
 * Strictly NO JSX in this file.
 */

export type FileVisualFamily =
  | 'PDF'
  | 'WORD'
  | 'EXCEL'
  | 'POWERPOINT'
  | 'ARCHIVE'
  | 'CODE'
  | 'GENERIC';

export type FileIconType =
  | 'FileText'
  | 'FileSpreadsheet'
  | 'Presentation'
  | 'FileArchive'
  | 'FileCode'
  | 'File';

export interface FileVisualMeta {
  family: FileVisualFamily;
  badge: string;
  iconName: FileIconType;
  containerClass: string;
  badgeClass: string;
  iconClass: string;
}

const FAMILY_STYLES: Record<
  FileVisualFamily,
  {
    containerClass: string;
    badgeClass: string;
    iconClass: string;
    defaultIcon: FileIconType;
  }
> = {
  PDF: {
    containerClass: 'bg-rose-50/95 border-rose-200 text-rose-700 shadow-2xs',
    badgeClass: 'bg-rose-600 text-white ring-1 ring-rose-700/20',
    iconClass: 'text-rose-600',
    defaultIcon: 'FileText',
  },
  WORD: {
    containerClass: 'bg-blue-50/95 border-blue-200 text-blue-700 shadow-2xs',
    badgeClass: 'bg-blue-600 text-white ring-1 ring-blue-700/20',
    iconClass: 'text-blue-600',
    defaultIcon: 'FileText',
  },
  EXCEL: {
    containerClass: 'bg-emerald-50/95 border-emerald-200 text-emerald-700 shadow-2xs',
    badgeClass: 'bg-emerald-600 text-white ring-1 ring-emerald-700/20',
    iconClass: 'text-emerald-600',
    defaultIcon: 'FileSpreadsheet',
  },
  POWERPOINT: {
    containerClass: 'bg-amber-50/95 border-amber-200 text-amber-700 shadow-2xs',
    badgeClass: 'bg-amber-600 text-white ring-1 ring-amber-700/20',
    iconClass: 'text-amber-600',
    defaultIcon: 'Presentation',
  },
  ARCHIVE: {
    containerClass: 'bg-purple-50/95 border-purple-200 text-purple-700 shadow-2xs',
    badgeClass: 'bg-purple-600 text-white ring-1 ring-purple-700/20',
    iconClass: 'text-purple-600',
    defaultIcon: 'FileArchive',
  },
  CODE: {
    containerClass: 'bg-cyan-50/95 border-cyan-200 text-cyan-700 shadow-2xs',
    badgeClass: 'bg-cyan-600 text-white ring-1 ring-cyan-700/20',
    iconClass: 'text-cyan-600',
    defaultIcon: 'FileCode',
  },
  GENERIC: {
    containerClass: 'bg-stone-100/95 border-stone-300 text-stone-700 shadow-2xs',
    badgeClass: 'bg-stone-600 text-white ring-1 ring-stone-700/20',
    iconClass: 'text-stone-600',
    defaultIcon: 'FileText',
  },
};

/**
 * Resolve canonical visual family from recognized MIME type.
 * Returns null if MIME type is missing or unrecognized.
 */
function resolveFamilyFromMime(mimeType?: string): FileVisualFamily | null {
  if (!mimeType) return null;
  const lower = mimeType.toLowerCase();

  if (lower.includes('pdf')) return 'PDF';
  if (
    lower.includes('wordprocessingml') ||
    lower.includes('msword') ||
    lower.includes('officedocument.word')
  ) {
    return 'WORD';
  }
  if (
    lower.includes('spreadsheetml') ||
    lower.includes('ms-excel') ||
    lower.includes('csv')
  ) {
    return 'EXCEL';
  }
  if (
    lower.includes('presentationml') ||
    lower.includes('ms-powerpoint') ||
    lower.includes('powerpoint')
  ) {
    return 'POWERPOINT';
  }
  if (
    lower.includes('zip') ||
    lower.includes('x-rar') ||
    lower.includes('x-7z') ||
    lower.includes('tar') ||
    lower.includes('compressed') ||
    lower.includes('archive')
  ) {
    return 'ARCHIVE';
  }
  if (
    lower.includes('javascript') ||
    lower.includes('typescript') ||
    lower.includes('json') ||
    lower.includes('html') ||
    lower.includes('css') ||
    lower.includes('python') ||
    lower.includes('x-sh') ||
    lower.includes('sql')
  ) {
    return 'CODE';
  }

  return null;
}

/**
 * Deterministic mapping from clean filename extension to { family, badge }.
 */
const EXTENSION_MAP: Record<string, { family: FileVisualFamily; badge: string }> = {
  pdf: { family: 'PDF', badge: 'PDF' },
  doc: { family: 'WORD', badge: 'DOC' },
  docx: { family: 'WORD', badge: 'DOCX' },
  xls: { family: 'EXCEL', badge: 'XLS' },
  xlsx: { family: 'EXCEL', badge: 'XLSX' },
  csv: { family: 'EXCEL', badge: 'CSV' },
  ppt: { family: 'POWERPOINT', badge: 'PPT' },
  pptx: { family: 'POWERPOINT', badge: 'PPTX' },
  zip: { family: 'ARCHIVE', badge: 'ZIP' },
  rar: { family: 'ARCHIVE', badge: 'RAR' },
  '7z': { family: 'ARCHIVE', badge: '7Z' },
  tar: { family: 'ARCHIVE', badge: 'TAR' },
  gz: { family: 'ARCHIVE', badge: 'GZ' },
  js: { family: 'CODE', badge: 'JS' },
  ts: { family: 'CODE', badge: 'TS' },
  jsx: { family: 'CODE', badge: 'JSX' },
  tsx: { family: 'CODE', badge: 'TSX' },
  py: { family: 'CODE', badge: 'PY' },
  html: { family: 'CODE', badge: 'HTML' },
  css: { family: 'CODE', badge: 'CSS' },
  json: { family: 'CODE', badge: 'JSON' },
  sql: { family: 'CODE', badge: 'SQL' },
  cpp: { family: 'CODE', badge: 'CPP' },
  c: { family: 'CODE', badge: 'C' },
  java: { family: 'CODE', badge: 'JAVA' },
  txt: { family: 'GENERIC', badge: 'TXT' },
  md: { family: 'GENERIC', badge: 'MD' },
};

/**
 * Pure file-type resolver implementing:
 * 1. Recognized canonical MIME -> determines visual family.
 * 2. Valid original filename extension -> determines precise badge label.
 * 3. Fallback to extension for family if MIME missing/unrecognized.
 * 4. Fallback to generic FILE if both unknown.
 */
export function getFileVisualMeta(
  filename?: string,
  mimeType?: string
): FileVisualMeta {
  const cleanName = (filename || '').trim();
  const lastDotIndex = cleanName.lastIndexOf('.');
  const ext =
    lastDotIndex !== -1 && lastDotIndex < cleanName.length - 1
      ? cleanName.slice(lastDotIndex + 1).toLowerCase()
      : '';

  const extMatch = ext ? EXTENSION_MAP[ext] : undefined;
  const mimeFamily = resolveFamilyFromMime(mimeType);

  // Deterministic family resolution
  let family: FileVisualFamily = 'GENERIC';
  if (mimeFamily) {
    family = mimeFamily;
  } else if (extMatch) {
    family = extMatch.family;
  }

  // Precise badge label (preserves exact format e.g. DOC vs DOCX, XLS vs XLSX vs CSV)
  let badge = 'FILE';
  if (extMatch) {
    badge = extMatch.badge;
  } else if (ext && ext.length <= 5 && /^[a-z0-9]+$/i.test(ext)) {
    badge = ext.toUpperCase();
  } else if (family === 'PDF') {
    badge = 'PDF';
  } else if (family === 'WORD') {
    badge = 'DOCX';
  } else if (family === 'EXCEL') {
    badge = 'XLSX';
  } else if (family === 'POWERPOINT') {
    badge = 'PPTX';
  } else if (family === 'ARCHIVE') {
    badge = 'ZIP';
  } else if (family === 'CODE') {
    badge = 'CODE';
  }

  const style = FAMILY_STYLES[family];

  return {
    family,
    badge,
    iconName: style.defaultIcon,
    containerClass: style.containerClass,
    badgeClass: style.badgeClass,
    iconClass: style.iconClass,
  };
}
