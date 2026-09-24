import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams, useLocation, useMatch } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentUser } from '@/features/users/hooks';
import { Avatar } from '@/components/common/Avatar';
import {
  Menu,
  Search,
  User,
  LogOut,
  X,
  PlusCircle,
  Package,
  ArrowLeft,
  Heart,
  ShoppingBag,
  Store,
  MessageSquare,
  Bell,
  ShieldAlert,
  Camera,
  MessageSquareQuote,
} from 'lucide-react';
import { useUnreadCount } from '@/features/notifications/hooks';
import { coordinateSearchDismissAndScroll, cleanupSearchCoordinator } from '@/lib/searchScrollCoordinator';


export function Header() {
  const { firebaseUser, signOut } = useAuth();
  const { data: user } = useCurrentUser();
  const { data: unreadData } = useUnreadCount(!!firebaseUser);
  const unreadCount = unreadData?.count ?? 0;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isChatThreadRoute = Boolean(useMatch('/messages/:conversationId'));

  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComposingRef = useRef(false);

  const clearDebounceTimer = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  // Đồng bộ searchTerm khi param 'q' trên URL thay đổi (bao gồm Back/Forward)
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  // Safe scroll-preserving body lock for mobile menu drawer
  useEffect(() => {
    if (!menuOpen || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevOverflow = document.body.style.overflow;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      clearDebounceTimer();
      cleanupSearchCoordinator();
    };
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchOpen]);

  const handleProfileClick = () => {
    if (firebaseUser) {
      navigate('/profile');
      return;
    }

    const authCard = document.getElementById('auth-card');
    if (authCard) {
      authCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/');
  };

  // Commit query tìm kiếm lên URL mà không làm mất các filter khác (category, min_price,...)
  const commitSearch = (value: string) => {
    const trimmed = value.trim().normalize('NFC');
    if (location.pathname !== '/') {
      const targetParams = new URLSearchParams();
      if (trimmed.length >= 2) {
        targetParams.set('q', trimmed);
      }
      navigate(targetParams.toString() ? `/?${targetParams.toString()}` : '/');
    } else {
      const newParams = new URLSearchParams(searchParams);
      if (trimmed.length >= 2) {
        newParams.set('q', trimmed);
      } else {
        newParams.delete('q');
      }
      setSearchParams(newParams, { replace: true });
    }
  };

  const scheduleSearch = (value: string) => {
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(() => {
      commitSearch(value);
    }, 300);
  };

  // Cập nhật tìm kiếm: hiển thị input lập tức, debounce commit 300ms
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (isComposingRef.current) {
      return;
    }
    scheduleSearch(value);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
    clearDebounceTimer();
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const finalValue = e.currentTarget.value;
    setSearchTerm(finalValue);
    scheduleSearch(finalValue);
  };

  const handleExplicitSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    // Respect Vietnamese IME composition
    if (isComposingRef.current) {
      return;
    }

    clearDebounceTimer();

    // Flush latest input value directly to prevent race condition before debounce fires
    const liveValue = searchInputRef.current ? searchInputRef.current.value : searchTerm;
    const finalValue = liveValue.trim().normalize('NFC');
    setSearchTerm(finalValue);

    // Empty query: commit empty search, do NOT trigger scroll
    if (!finalValue) {
      commitSearch('');
      return;
    }

    // Meaningful query: handle same-route or cross-route
    if (location.pathname !== '/') {
      // Cross-route: navigate to '/' with search query and scrollToSearchResults state
      navigate(`/?q=${encodeURIComponent(finalValue)}`, {
        state: { scrollToSearchResults: true },
      });
      searchInputRef.current?.blur();
    } else {
      // Same-route: commit search on current URL
      const newParams = new URLSearchParams(searchParams);
      newParams.set('q', finalValue);
      setSearchParams(newParams, { replace: true });
      // Coordinate keyboard blur, viewport stabilization, and result scroll
      coordinateSearchDismissAndScroll(searchInputRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isComposingRef.current || e.nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      handleExplicitSubmit();
    }
  };

  const handleClearSearch = () => {
    clearDebounceTimer();
    setSearchTerm('');
    commitSearch('');
    searchInputRef.current?.focus();
  };

  const handleCloseSearch = () => {
    clearDebounceTimer();
    setIsSearchOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 h-[56px] w-full items-center justify-between bg-brand-burgundy text-white px-4 shadow-header ${isChatThreadRoute ? 'hidden md:flex' : 'flex'
          }`}
      >
        {!isSearchOpen ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="icon-btn-interactive flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
              aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={menuOpen}
              id="header-menu-btn"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>

            {/* Center: Logo */}
            <Link
              to="/"
              className="flex min-w-0 items-center no-underline"
              id="header-logo"
              aria-label="Chợ PTITers - Trang chủ"
            >
              <div className="flex items-center gap-0.5">
                {/* P mark */}
                <img
                  src="/logo.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-9 w-9 shrink-0 object-contain"
                />

                {/* Wordmark */}
                <div className="-ml-1 flex flex-col justify-center font-['Plus_Jakarta_Sans'] select-none">
                  <span className="text-[10px] font-medium tracking-[0.01em] text-[#D9A55D] leading-none">
                    Chợ
                  </span>
                  <span className="text-[15px] font-semibold tracking-[-0.04em] text-[#E0AE67] leading-none pt-0.5">
                    TITers
                  </span>
                </div>
              </div>
            </Link>

            {/* Right: Search + Messages + Profile */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="icon-btn-interactive flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
                aria-label="Tìm kiếm"
                id="header-search-btn"
              >
                <Search className="h-5 w-5 text-white" />
              </button>

              {firebaseUser && (
                <>
                  <Link
                    to="/messages"
                    className="icon-btn-interactive flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
                    aria-label="Tin nhắn"
                    id="header-messages-btn"
                  >
                    <MessageSquare className="h-5 w-5 text-white" />
                  </Link>

                  <Link
                    to="/notifications"
                    className="relative icon-btn-interactive flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
                    aria-label="Thông báo"
                    id="header-notifications-btn"
                  >
                    <Bell className="h-5 w-5 text-white" />
                    {unreadCount > 0 && (
                      <span
                        data-ui-role="notification-unread-badge"
                        className="ui-notification-badge"
                        style={{
                          position: 'absolute',
                          top: '1px',
                          right: '1px',
                          backgroundColor: '#FBBF24',
                          color: '#1C1917',
                          WebkitTextFillColor: '#1C1917',
                          border: '2px solid #722F37',
                        }}
                      >
                        {unreadCount >= 100 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleProfileClick}
                className="icon-btn-interactive flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
                aria-label={firebaseUser ? 'Mở hồ sơ' : 'Đăng nhập'}
                id="header-profile-btn"
              >

                {firebaseUser ? (
                  <Avatar
                    src={user?.avatar_url}
                    name={user?.full_name || firebaseUser.displayName}
                    size="sm"
                    className="border-2 border-white/30"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
          </>
        ) : (
          /* Search Header Mode (Height remains strictly 56px, 0px gap guarantee) */
          <div className="flex w-full items-center gap-2 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={handleCloseSearch}
              className="icon-btn-interactive flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
              aria-label="Đóng tìm kiếm"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>

            {/* Search Input Box Form */}
            <form
              role="search"
              onSubmit={handleExplicitSubmit}
              className="relative flex-1 flex items-center"
            >
              <Search className="absolute left-3 h-4 w-4 text-brand-text-muted pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                data-ui-role="product-search-input"
                enterKeyHint="search"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onKeyDown={handleKeyDown}
                placeholder="Tìm sách, máy tính, phòng trọ..."
                className="w-full rounded-full bg-brand-warm-white py-2 pl-9 pr-8 text-base md:text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-hidden shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-text-muted/30 text-brand-text-secondary hover:bg-brand-text-muted/50"
                  aria-label="Xóa từ khóa"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </form>
          </div>
        )}
      </header>

      {/* Document flow spacer preserving exact 56px height (hidden on mobile chat thread) */}
      <div
        className={`h-[56px] w-full shrink-0 ${isChatThreadRoute ? 'hidden md:block' : 'block'
          }`}
        aria-hidden="true"
      />

      {/* Mobile slide-out menu (Portaled to document.body) */}
      {menuOpen && typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Overlay */}
            <button
              type="button"
              aria-label="Đóng menu"
              className="fixed inset-0 z-50 cursor-default bg-black/40 animate-in fade-in duration-200"
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer */}
            <nav
              className="fixed inset-y-0 left-0 z-[60] flex w-72 max-w-[85vw] flex-col bg-brand-warm-white shadow-xl animate-in slide-in-from-left duration-200"
              aria-label="Menu chính"
            >
              {/* Drawer header */}
              <div className="flex h-14 w-full items-center justify-between border-b border-white/10 bg-[#5E232B] text-white px-4 shrink-0">
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center no-underline"
                  aria-label="Chợ PTITers - Trang chủ"
                >
                  <div className="flex items-center gap-0">
                    <img
                      src="/logo.svg"
                      alt=""
                      aria-hidden="true"
                      className="h-9 w-9 shrink-0 object-contain"
                    />

                    <div className="-ml-1 flex flex-col justify-center font-['Plus_Jakarta_Sans'] select-none">
                      <span className="text-[10px] font-medium tracking-[-0.02em] text-[#E3B566] leading-none">
                        Chợ
                      </span>
                      <span className="text-[15px] font-semibold tracking-[-0.05em] text-[#E3B566] leading-none pt-0.5">
                        PTITers
                      </span>
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="icon-btn-interactive flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                  aria-label="Đóng menu"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              {/* Navigation Links with IA regrouping */}
              <div className="flex flex-1 min-h-0 flex-col gap-3 p-4 overflow-y-auto overscroll-contain">
                {/* Trang chủ alone */}
                <div className="space-y-1">
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    aria-current={location.pathname === '/' ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                      location.pathname === '/'
                        ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                        : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                    }`}
                  >
                    <span className="text-base">🏠</span>
                    <span>Trang chủ</span>
                  </Link>
                  {!firebaseUser && (
                    <Link
                      to="/feedback"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname === '/feedback' ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname === '/feedback'
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <MessageSquareQuote className={`h-4 w-4 ${location.pathname === '/feedback' ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Feedback</span>
                    </Link>
                  )}
                </div>

                {/* TIN ĐĂNG */}
                {firebaseUser && (
                  <div className="space-y-1 pt-2 border-t border-brand-border/60">
                    <span className="px-3 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">
                      Tin đăng
                    </span>
                    <Link
                      to="/favorites"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname === '/favorites' ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname === '/favorites'
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${location.pathname === '/favorites' ? 'text-brand-burgundy' : 'text-brand-price'}`} />
                      <span>Tin đã lưu</span>
                    </Link>
                    <Link
                      to="/products/new"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname === '/products/new' ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname === '/products/new'
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <PlusCircle className={`h-4 w-4 ${location.pathname === '/products/new' ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Đăng tin bán</span>
                    </Link>
                    <Link
                      to="/my-products"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname === '/my-products' ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname === '/my-products'
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <Package className={`h-4 w-4 ${location.pathname === '/my-products' ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Quản lý tin đăng</span>
                    </Link>
                  </div>
                )}

                {/* GIAO DỊCH */}
                {firebaseUser && (
                  <div className="space-y-1 pt-2 border-t border-brand-border/60">
                    <span className="px-3 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">
                      Giao dịch
                    </span>
                    <Link
                      to="/orders/buying"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname.startsWith('/orders/buying') ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname.startsWith('/orders/buying')
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <ShoppingBag className={`h-4 w-4 ${location.pathname.startsWith('/orders/buying') ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Đơn mua</span>
                    </Link>
                    <Link
                      to="/orders/selling"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname.startsWith('/orders/selling') ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname.startsWith('/orders/selling')
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <Store className={`h-4 w-4 ${location.pathname.startsWith('/orders/selling') ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Đơn bán</span>
                    </Link>
                  </div>
                )}

                {/* LIÊN LẠC */}
                {firebaseUser && (
                  <div className="space-y-1 pt-2 border-t border-brand-border/60">
                    <span className="px-3 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">
                      Liên lạc
                    </span>
                    <Link
                      to="/notifications"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname.startsWith('/notifications') ? 'page' : undefined}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname.startsWith('/notifications')
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className={`h-4 w-4 ${location.pathname.startsWith('/notifications') ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                        <span>Thông báo</span>
                      </div>
                      {unreadCount > 0 && (
                        <span
                          className="ui-notification-badge"
                          style={{
                            position: 'static',
                            backgroundColor: '#FBBF24',
                            color: '#1C1917',
                            WebkitTextFillColor: '#1C1917',
                            border: '1px solid #722F37',
                          }}
                        >
                          {unreadCount >= 100 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/messages"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname.startsWith('/messages') ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname.startsWith('/messages')
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <MessageSquare className={`h-4 w-4 ${location.pathname.startsWith('/messages') ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Tin nhắn</span>
                    </Link>
                  </div>
                )}

                {/* TÀI KHOẢN */}
                {firebaseUser && (
                  <div className="space-y-1 pt-2 border-t border-brand-border/60">
                    <span className="px-3 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">
                      Tài khoản
                    </span>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname === '/profile' ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname === '/profile'
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <User className={`h-4 w-4 ${location.pathname === '/profile' ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <Link
                      to="/feedback"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname === '/feedback' ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname === '/feedback'
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <MessageSquareQuote className={`h-4 w-4 ${location.pathname === '/feedback' ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Feedback</span>
                    </Link>
                  </div>
                )}

                {/* QUẢN TRỊ */}
                {firebaseUser && user?.role === 'ADMIN' && (
                  <div className="space-y-1 pt-2 border-t border-brand-border/60">
                    <span className="px-3 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">
                      Quản trị
                    </span>
                    <Link
                      to="/admin/reports"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname.startsWith('/admin/reports') ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname.startsWith('/admin/reports')
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <ShieldAlert className={`h-4 w-4 ${location.pathname.startsWith('/admin/reports') ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Báo cáo vi phạm</span>
                    </Link>
                    <Link
                      to="/admin/community-moments"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname.startsWith('/admin/community-moments') ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname.startsWith('/admin/community-moments')
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <Camera className={`h-4 w-4 ${location.pathname.startsWith('/admin/community-moments') ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Ảnh cộng đồng</span>
                    </Link>
                    <Link
                      to="/admin/feedback"
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname.startsWith('/admin/feedback') ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm no-underline transition-colors ${
                        location.pathname.startsWith('/admin/feedback')
                          ? 'font-semibold text-brand-burgundy bg-brand-soft-pink'
                          : 'font-medium text-brand-text hover:bg-brand-soft-pink/60'
                      }`}
                    >
                      <MessageSquareQuote className={`h-4 w-4 ${location.pathname.startsWith('/admin/feedback') ? 'text-brand-burgundy' : 'text-brand-text-secondary'}`} />
                      <span>Feedback người dùng</span>
                    </Link>
                  </div>
                )}

                {firebaseUser && (
                  <div className="mt-auto pt-3 border-t border-brand-border/60">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold text-brand-price transition-colors hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </>,
          document.body
        )}
    </>
  );
}