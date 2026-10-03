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
import { AdminProductApprovalsPage } from '@/features/products/pages/AdminProductApprovalsPage';
import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage';
import { BuyingOrdersPage } from '@/features/orders/pages/BuyingOrdersPage';
import { SellingOrdersPage } from '@/features/orders/pages/SellingOrdersPage';
import { OrderDetailPage } from '@/features/orders/pages/OrderDetailPage';
import { ConversationsPage } from '@/features/conversations/pages/ConversationsPage';
import { ChatThreadPage } from '@/features/conversations/pages/ChatThreadPage';
import { NotificationsPage } from '@/features/notifications';
import { AuctionRedirectPage } from '@/features/auctions/pages/AuctionRedirectPage';
import { AdminReportsPage } from '@/features/reports/pages/AdminReportsPage';
import { AdminCommunityMomentsPage } from '@/features/communityMoments';
import { FeedbackPage, AdminFeedbackPage, AdminSupportPage } from '@/features/feedback';
import { TutorialProvider, TutorialOverlayModal, AdminTutorialsPage } from '@/features/tutorials';
import { AccountRestrictedPage } from '@/features/auth/pages/AccountRestrictedPage';
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
            <TutorialProvider>
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

                    {/* Public User Profile (Public, both /profile/:publicId and /users/:publicId supported) */}
                    <Route path="/profile/:publicId" element={<PublicProfilePage />} />
                    <Route path="/users/:publicId" element={<PublicProfilePage />} />

                    {/* Account Restricted Page (Public / Authenticated with restricted status) */}
                    <Route path="/account-restricted" element={<AccountRestrictedPage />} />

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

                    {/* Admin Product Approvals Queue (Protected, ADMIN only) */}
                    <Route
                      path="/admin/product-approvals"
                      element={
                        <ProtectedRoute requiredRole="ADMIN">
                          <AdminProductApprovalsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Reports Queue (Protected, ADMIN only) */}
                    <Route
                      path="/admin/reports"
                      element={
                        <ProtectedRoute requiredRole="ADMIN">
                          <AdminReportsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Community Moments Queue (Protected, ADMIN only) */}
                    <Route
                      path="/admin/community-moments"
                      element={
                        <ProtectedRoute requiredRole="ADMIN">
                          <AdminCommunityMomentsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Auction Redirect (Public / Optional Auth) */}
                    <Route path="/auctions/:auctionId" element={<AuctionRedirectPage />} />

                    {/* Feedback Page (Public) */}
                    <Route path="/feedback" element={<FeedbackPage />} />

                    {/* Admin Feedback Moderation Queue (Protected, ADMIN only) */}
                    <Route
                      path="/admin/feedback"
                      element={
                        <ProtectedRoute requiredRole="ADMIN">
                          <AdminFeedbackPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Support Contributions Ledger (Protected, ADMIN only) */}
                    <Route
                      path="/admin/support"
                      element={
                        <ProtectedRoute requiredRole="ADMIN">
                          <AdminSupportPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Tutorials CMS (Protected, ADMIN only) */}
                    <Route
                      path="/admin/tutorials"
                      element={
                        <ProtectedRoute requiredRole="ADMIN">
                          <AdminTutorialsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                  </Routes>
                </main>
                <TutorialOverlayModal />
              </div>
            </TutorialProvider>
          </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
);
}
