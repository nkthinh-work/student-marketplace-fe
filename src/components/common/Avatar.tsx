import React, { useState, useEffect, useMemo } from 'react';
import { User as UserIcon } from 'lucide-react';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: React.ReactNode;
  rounded?: 'full' | '2xl' | 'xl' | 'lg';
  draggable?: boolean;
}

const sizeClasses: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { container: string; text: string; icon: string }> = {
  xs: { container: 'h-7 w-7', text: 'text-[10px]', icon: 'h-3.5 w-3.5' },
  sm: { container: 'h-8 w-8', text: 'text-xs', icon: 'h-4 w-4' },
  md: { container: 'h-10 w-10', text: 'text-sm', icon: 'h-5 w-5' },
  lg: { container: 'h-12 w-12', text: 'text-base', icon: 'h-6 w-6' },
  xl: { container: 'h-20 w-20 sm:h-24 sm:w-24', text: 'text-xl sm:text-2xl', icon: 'h-10 w-10 sm:h-12 sm:w-12' },
};

const roundedClasses: Record<'full' | '2xl' | 'xl' | 'lg', string> = {
  full: 'rounded-full',
  '2xl': 'rounded-2xl',
  xl: 'rounded-xl',
  lg: 'rounded-lg',
};

/**
 * Extracts 1-2 uppercase initials from a person's name according to Vietnamese & standard conventions.
 * Examples:
 *   "Nguyễn Khắc Thịnh" -> "NT"
 *   "Trần Nam" -> "TN"
 *   "Thịnh" -> "T"
 * Never renders the full name multiline inside an avatar.
 */
export function getInitials(name?: string | null): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  const words = trimmed.split(/\s+/).filter(Boolean);
  const firstWord = words[0];
  if (!firstWord) return '';

  const lastWord = words[words.length - 1];
  if (words.length === 1 || !lastWord) {
    return firstWord.charAt(0).toUpperCase();
  }

  const firstInitial = firstWord.charAt(0).toUpperCase();
  const lastInitial = lastWord.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  alt,
  size = 'md',
  className = '',
  fallbackIcon,
  rounded = 'full',
  draggable = false,
}) => {
  const [hasError, setHasError] = useState(false);

  // When src changes (e.g. fresh avatar synchronized, or changed from broken to valid),
  // reset error state so the new src is immediately retried.
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = useMemo(() => getInitials(name || alt), [name, alt]);
  const sizeConfig = sizeClasses[size];
  const roundedClass = roundedClasses[rounded];
  const accessibleLabel = name ? `Ảnh đại diện của ${name}` : alt || 'Ảnh đại diện';

  const shouldRenderImage = Boolean(src) && !hasError;

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      className={`relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none bg-brand-burgundy/10 text-brand-burgundy font-bold ${roundedClass} ${sizeConfig.container} ${className}`}
    >
      {shouldRenderImage ? (
        <img
          src={src!}
          alt=""
          aria-hidden="true"
          draggable={draggable}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover select-none"
        />
      ) : initials ? (
        <span className={`${sizeConfig.text} font-bold tracking-tight uppercase select-none`}>
          {initials}
        </span>
      ) : fallbackIcon ? (
        fallbackIcon
      ) : (
        <UserIcon className={sizeConfig.icon} aria-hidden="true" />
      )}
    </div>
  );
};
