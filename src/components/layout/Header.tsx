import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentUser } from '@/features/users/hooks';
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
} from 'lucide-react';

export function Header() {
  const { firebaseUser, signOut } = useAuth();
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ searchTerm khi param 'q' trên URL thay đổi
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

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

  // Cập nhật tìm kiếm qua URL search params
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (location.pathname !== '/') {
      navigate(`/?q=${encodeURIComponent(value.trim())}`);
    } else {
      const newParams = new URLSearchParams(searchParams);
      if (value.trim()) {
        newParams.set('q', value.trim());
      } else {
        newParams.delete('q');
      }
      setSearchParams(newParams, { replace: true });
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (location.pathname === '/') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('q');
      setSearchParams(newParams, { replace: true });
    }
    searchInputRef.current?.focus();
  };

  const handleCloseSearch = () => {
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

            {/* Right: Search + Profile */}
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

              <button
                type="button"
                onClick={handleProfileClick}
                className="icon-btn-interactive flex h-10 w-10 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
                aria-label={firebaseUser ? 'Mở hồ sơ' : 'Đăng nhập'}
                id="header-profile-btn"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'Ảnh đại diện'}
                    className="h-8 w-8 rounded-full border-2 border-white/30 object-cover"
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