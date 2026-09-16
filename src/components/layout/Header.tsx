import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useUnreadCount } from '@/features/notifications/hooks';


export function Header() {
  const { firebaseUser, signOut } = useAuth();
  const { data: user } = useCurrentUser();
  const { data: unreadData } = useUnreadCount(!!firebaseUser);
  const unreadCount = unreadData?.count ?? 0;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

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

  useEffect(() => {
    return () => {
      clearDebounceTimer();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isComposingRef.current || e.nativeEvent.isComposing) {
        return;
      }
      clearDebounceTimer();
      commitSearch(searchTerm);
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
      <header className="fixed top-0 inset-x-0 z-50 flex h-[56px] w-full items-center justify-between bg-brand-burgundy px-4 shadow-header">
        {!isSearchOpen ? (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="icon-btn-interactive flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
              aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={menuOpen}
              id="header-menu-btn"
            >
              <Menu className="h-5 w-5" />
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
                className="icon-btn-interactive flex h-10 w-10 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
                aria-label="Tìm kiếm"
                id="header-search-btn"
              >
                <Search className="h-5 w-5" />
              </button>

              {firebaseUser && (
                <>
                  <Link
                    to="/messages"
                    className="icon-btn-interactive flex h-10 w-10 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
                    aria-label="Tin nhắn"
                    id="header-messages-btn"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Link>

                  <Link
                    to="/notifications"
                    className="relative icon-btn-interactive flex h-10 w-10 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
                    aria-label="Thông báo"
                    id="header-notifications-btn"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs">
                        {unreadCount >= 100 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleProfileClick}
                className="icon-btn-interactive flex h-10 w-10 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
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
                  <User className="h-5 w-5" />
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
              className="icon-btn-interactive flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
              aria-label="Đóng tìm kiếm"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Search Input Box */}
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-brand-text-muted pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onKeyDown={handleKeyDown}
                placeholder="Tìm sách, máy tính, phòng trọ..."
                className="w-full rounded-full bg-brand-warm-white py-2 pl-9 pr-8 text-xs sm:text-sm text-brand-text placeholder:text-brand-text-muted focus:outline-hidden shadow-inner"
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
            </div>
          </div>
        )}
      </header>

      {/* Document flow spacer preserving exact 56px height */}
      <div className="h-[56px] w-full shrink-0" aria-hidden="true" />

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <button
            type="button"
            aria-label="Đóng menu"
            className="fixed inset-0 z-50 cursor-default bg-black/40"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <nav
            className="fixed inset-y-0 left-0 z-[60] flex w-72 max-w-[85vw] flex-col bg-brand-warm-white shadow-xl animate-in slide-in-from-left duration-200"
            aria-label="Menu chính"
          >
            {/* Drawer header */}
            <div className="flex h-14 w-full items-center justify-between border-b border-white/10 bg-[#5E232B] px-4">
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
                className="icon-btn-interactive flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
              {/* MUA HÀNG */}
              <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                  Mua hàng
                </span>
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-brand-text no-underline transition-colors hover:bg-brand-soft-pink"
                >
                  <span className="text-base">🏠</span> Trang chủ
                </Link>
                {firebaseUser && (
                  <>
                    <Link
                      to="/messages"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-brand-text no-underline transition-colors hover:bg-brand-soft-pink"
                    >
                      <MessageSquare className="h-4 w-4 text-brand-burgundy" /> Tin nhắn
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-brand-text no-underline transition-colors hover:bg-brand-soft-pink"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="h-4 w-4 text-brand-burgundy" /> Thông báo
                      </div>
                      {unreadCount > 0 && (
                        <span className="flex min-w-4 h-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs">
                          {unreadCount >= 100 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-brand-text no-underline transition-colors hover:bg-brand-soft-pink"
                    >
                      <Heart className="h-4 w-4 text-brand-price" /> Tin đã lưu
                    </Link>
                    <Link
                      to="/orders/buying"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-brand-text no-underline transition-colors hover:bg-brand-soft-pink"
                    >
                      <ShoppingBag className="h-4 w-4 text-brand-burgundy" /> Đơn mua
                    </Link>

                  </>
                )}
              </div>

              {/* BÁN HÀNG */}
              {firebaseUser && (
                <div className="space-y-1 pt-2 border-t border-brand-border/60">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                    Bán hàng
                  </span>
                  <Link
                    to="/products/new"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-brand-burgundy no-underline transition-colors hover:bg-brand-soft-pink bg-brand-soft-pink/40"
                  >
                    <PlusCircle className="h-4 w-4" /> Đăng tin bán
                  </Link>
                  <Link
                    to="/my-products"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-brand-text no-underline transition-colors hover:bg-brand-soft-pink"
                  >
                    <Package className="h-4 w-4 text-brand-text-secondary" /> Quản lý tin đăng
                  </Link>
                  <Link
                    to="/orders/selling"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-brand-text no-underline transition-colors hover:bg-brand-soft-pink"
                  >
                    <Store className="h-4 w-4 text-brand-text-secondary" /> Đơn bán
                  </Link>
                </div>
              )}

              {/* TÀI KHOẢN */}
              {firebaseUser && (
                <div className="space-y-1 pt-2 border-t border-brand-border/60">
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                    Tài khoản
                  </span>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-brand-text no-underline transition-colors hover:bg-brand-soft-pink"
                  >
                    <User className="h-4 w-4 text-brand-text-secondary" /> Hồ sơ cá nhân
                  </Link>
                </div>
              )}

              {firebaseUser && (
                <div className="mt-auto pt-3 border-t border-brand-border/60">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-bold text-brand-price transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}