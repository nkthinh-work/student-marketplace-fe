import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { HomePage } from '@/features/home/pages/HomePage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { ProductDetailPage } from '@/features/products/pages/ProductDetailPage';
import { CreateProductPage } from '@/features/products/pages/CreateProductPage';
import { EditProductPage } from '@/features/products/pages/EditProductPage';
import { MyProductsPage } from '@/features/products/pages/MyProductsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-brand-cream text-brand-text flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                {/* Home Page */}
                <Route path="/" element={<HomePage />} />

                {/* Profile Page (Protected) */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Product Detail (Public / Optional Auth) */}
                <Route path="/products/:productId" element={<ProductDetailPage />} />

                {/* Create Product (Protected) */}
                <Route
                  path="/products/new"
                  element={
                    <ProtectedRoute>
                      <CreateProductPage />
                    </ProtectedRoute>
                  }
                />

                {/* Edit Product (Protected) */}
                <Route
                  path="/products/:productId/edit"
                  element={
                    <ProtectedRoute>
                      <EditProductPage />
                    </ProtectedRoute>
                  }
                />

                {/* Seller My Products (Protected) */}
                <Route
                  path="/my-products"
                  element={
                    <ProtectedRoute>
                      <MyProductsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
