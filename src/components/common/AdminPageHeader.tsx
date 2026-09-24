import React from 'react';

interface AdminPageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  icon,
  title,
  subtitle,
  action,
  className = '',
}: AdminPageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 sm:pb-5 border-b border-brand-border/60 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft-pink/80 border border-brand-burgundy/15 text-brand-burgundy shadow-2xs"
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-brand-text tracking-tight truncate">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        </div>
      </div>

      {action && <div className="self-start sm:self-auto shrink-0">{action}</div>}
    </div>
  );
}
