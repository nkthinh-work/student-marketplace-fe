import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentUser } from '@/features/users/hooks';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Wrapper bảo vệ route: xử lý loading auth, redirect khi chưa đăng nhập, chặn tài khoản BANNED/INACTIVE
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { initializing, firebaseUser } = useAuth();
  const { data: user, isLoading: userLoading, error } = useCurrentUser();

  if (initializing) {
    return <LoadingSpinner message="Đang khởi tạo..." />;
  }

  if (!firebaseUser) {
    return <Navigate to="/" replace />;
  }

  if (userLoading) {
    return <LoadingSpinner message="Đang tải thông tin..." />;
  }

  if (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    const detail = (
      error as { response?: { data?: { detail?: string } } }
    ).response?.data?.detail;

    if (status === 403) {
      const isBanned = detail?.toLowerCase().includes('banned');
      return (
        <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-4xl">{isBanned ? '🚫' : '⏸️'}</div>
          <h2 className="text-lg font-semibold text-brand-text">
            {isBanned
              ? 'Tài khoản đã bị khóa'
              : 'Tài khoản tạm ngưng hoạt động'}
          </h2>
          <p className="text-sm text-brand-text-secondary">
            {isBanned
              ? 'Tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ hỗ trợ.'
              : 'Tài khoản của bạn hiện không hoạt động. Vui lòng liên hệ hỗ trợ để kích hoạt lại.'}
          </p>
        </div>
      );
    }

    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold text-brand-text">
          Không thể tải thông tin
        </h2>
        <p className="text-sm text-brand-text-secondary">
          Đã có lỗi xảy ra. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  if (user?.status === 'BANNED') {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">🚫</div>
        <h2 className="text-lg font-semibold text-brand-text">
          Tài khoản đã bị khóa
        </h2>
        <p className="text-sm text-brand-text-secondary">
          Tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ hỗ trợ.
        </p>
      </div>
    );
  }

  if (user?.status === 'INACTIVE') {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">⏸️</div>
        <h2 className="text-lg font-semibold text-brand-text">
          Tài khoản tạm ngưng hoạt động
        </h2>
        <p className="text-sm text-brand-text-secondary">
          Tài khoản của bạn hiện không hoạt động. Vui lòng liên hệ hỗ trợ.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
