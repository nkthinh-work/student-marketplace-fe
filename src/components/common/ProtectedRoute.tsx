import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentUser } from '@/features/users/hooks';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'STUDENT' | 'ADMIN';
}

// Wrapper bảo vệ route: xử lý loading auth, redirect khi chưa đăng nhập, chặn tài khoản BANNED/INACTIVE, kiểm tra role
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
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

    if (status === 403) {
      return <Navigate to="/account-restricted" replace />;
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

  if (user?.status === 'BANNED' || user?.status === 'INACTIVE') {
    return <Navigate to="/account-restricted" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">🚫</div>
        <h2 className="text-lg font-semibold text-brand-text">
          Truy cập bị từ chối
        </h2>
        <p className="text-sm text-brand-text-secondary">
          Bạn không có quyền truy cập trang này. Khu vực này chỉ dành cho quản trị viên hệ thống.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

