import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { HomePage } from '@/features/home/pages/HomePage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { PublicProfilePage } from '@/features/users/pages/PublicProfilePage';
import { ProductDetailPage } from '@/features/products/pages/ProductDetailPage';
import { CreateProductPage } from '@/features/products/pages/CreateProductPage';
import { EditProductPage } from '@/features/products/pages/EditProductPage';
import { MyProductsPage } from '@/features/products/pages/MyProductsPage';
import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage';
import { BuyingOrdersPage } from '@/features/orders/pages/BuyingOrdersPage';
import { SellingOrdersPage } from '@/features/orders/pages/SellingOrdersPage';
import { OrderDetailPage } from '@/features/orders/pages/OrderDetailPage';
import { ConversationsPage } from '@/features/conversations/pages/ConversationsPage';
import { ChatThreadPage } from '@/features/conversations/pages/ChatThreadPage';
import { NotificationsPage } from '@/features/notifications';
import { AuctionRedirectPage } from '@/features/auctions/pages/AuctionRedirectPage';
import { usePrivateRealtime } from '@/app/realtime/usePrivateRealtime';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PrivateRealtimeBridge() {
  usePrivateRealtime();
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <PrivateRealtimeBridge />
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

                {/* Public User Profile (Public) */}
                <Route path="/users/:userId" element={<PublicProfilePage />} />

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

                {/* Favorites Page (Protected) */}
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <FavoritesPage />
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

                {/* Buying Orders (Protected) */}
                <Route
                  path="/orders/buying"
                  element={
                    <ProtectedRoute>
                      <BuyingOrdersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Selling Orders (Protected) */}
                <Route
                  path="/orders/selling"
                  element={
                    <ProtectedRoute>
                      <SellingOrdersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Order Detail (Protected) */}
                <Route
                  path="/orders/:orderId"
                  element={
                    <ProtectedRoute>
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Messages List (Protected) */}
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <ConversationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Chat Thread (Protected) */}
                <Route
                  path="/messages/:conversationId"
                  element={
                    <ProtectedRoute>
                      <ChatThreadPage />
                    </ProtectedRoute>
                  }
                />

                {/* Notifications (Protected) */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Auction Redirect (Public / Optional Auth) */}
                <Route path="/auctions/:auctionId" element={<AuctionRedirectPage />} />

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
