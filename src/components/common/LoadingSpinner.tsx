export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-border border-t-brand-burgundy" />
      {message && (
        <p className="text-sm text-brand-text-muted">{message}</p>
      )}
    </div>
  );
}
