import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, RefreshCw, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchUserAccessStatus } from '@/features/users/api';
import { CURRENT_USER_KEY } from '@/features/users/hooks';

export function AccountRestrictedPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const handleCheckStatus = async () => {
    setChecking(true);
    setFeedback(null);

    try {
      const accessStatus = await fetchUserAccessStatus();
      if (accessStatus.status === 'ACTIVE') {
        setFeedback({
          type: 'success',
          message: 'Tài khoản của bạn đã được kích hoạt lại! Đang chuyển hướng về trang chủ...',
        });
        await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      } else {
        setFeedback({
          type: 'warning',
          message:
            accessStatus.status === 'BANNED'
              ? 'Tài khoản của bạn vẫn đang ở trạng thái bị khóa. Vui lòng liên hệ ban quản trị để giải quyết.'
              : 'Tài khoản của bạn đang ở trạng thái ngừng hoạt động.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Không thể kiểm tra trạng thái lúc này. Vui lòng thử lại sau.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSignOutAndBrowse = async () => {
    try {
      await signOut();
    } catch {
      // Continue navigating even if signOut has minor network hiccup
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-brand-border/70 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text">
            Tài khoản bị hạn chế
          </h1>
          <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
            Tài khoản của bạn hiện đang bị khóa hoặc hạn chế quyền truy cập vào các tính năng của sàn giao dịch (đăng tin, giao dịch, nhắn tin, đấu giá) do vi phạm quy định cộng đồng.
          </p>
        </div>

        {feedback && (
          <div
            className={`flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-medium text-left border animate-in fade-in duration-150 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : feedback.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="btn-interactive flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy-dark px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Đang kiểm tra...' : 'Kiểm tra lại trạng thái'}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOutAndBrowse}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-border bg-brand-warm-white hover:bg-stone-100 px-4 py-3 text-xs sm:text-sm font-semibold text-brand-text transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-brand-text-secondary" />
            <span>Đăng xuất và xem chợ</span>
          </button>
        </div>

        <div className="pt-2 border-t border-brand-border/40 text-[11px] text-brand-text-muted">
          Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ với ban quản trị sinh viên để được hỗ trợ phúc khảo.
        </div>
      </div>
    </div>
  );
}
