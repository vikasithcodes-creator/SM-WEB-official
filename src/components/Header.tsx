import React, { useRef, useEffect } from 'react';
import { ShoppingBag, Sparkles, Heart, Box, Package, User } from 'lucide-react';
import { CartItem } from '../types';

interface HeaderProps {
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenCustomQuote: () => void;
  onOpenTrackOrder?: () => void;
  onOpenAuth?: () => void;
  scrolled: boolean;
  onSelectCategory?: (cat: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  cart,
  onOpenCart,
  onOpenCustomQuote,
  onOpenTrackOrder,
  onOpenAuth,
  scrolled,
  onSelectCategory,
}) => {
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const headerRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const currentPos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const opacityRef = useRef<number>(0);
  const targetOpacityRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const isFinePointer = useRef<boolean>(true);
  const scrolledRef = useRef<boolean>(scrolled);

  useEffect(() => {
    scrolledRef.current = scrolled;
  }, [scrolled]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      isFinePointer.current = window.matchMedia('(pointer: fine)').matches;
    }
  }, []);

  // Update canvas size on resize or scroll
  useEffect(() => {
    const header = headerRef.current;
    const canvas = canvasRef.current;
    if (!header || !canvas) return;

    const updateCanvasSize = () => {
      const rect = header.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    updateCanvasSize();
    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(header);

    return () => ro.disconnect();
  }, []);

  // Checkered cursor spotlight animation loop
  const startAnimationLoop = () => {
    if (animFrameRef.current !== null) return;

    const render = () => {
      const canvas = canvasRef.current;
      const header = headerRef.current;
      if (!canvas || !header) {
        animFrameRef.current = null;
        return;
      }

      // Smooth interpolation for position and opacity
      const lerpFactor = 0.16;
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * lerpFactor;
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * lerpFactor;
      opacityRef.current += (targetOpacityRef.current - opacityRef.current) * 0.12;

      // Stop loop when completely faded out to save resources
      if (opacityRef.current <= 0.005 && targetOpacityRef.current === 0) {
        opacityRef.current = 0;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        animFrameRef.current = null;
        return;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);

        const cx = currentPos.current.x;
        const cy = currentPos.current.y;
        const radius = 50; // Compact 100px area (within 80-120px range)
        const tileSize = 8; // Small 8px tight checker cells

        const minCol = Math.max(0, Math.floor((cx - radius) / tileSize));
        const maxCol = Math.min(Math.ceil(w / tileSize), Math.ceil((cx + radius) / tileSize));
        const minRow = Math.max(0, Math.floor((cy - radius) / tileSize));
        const maxRow = Math.min(Math.ceil(h / tileSize), Math.ceil((cy + radius) / tileSize));

        const baseAlpha = opacityRef.current;
        const isDarkHeader = !scrolledRef.current;

        for (let r = minRow; r < maxRow; r++) {
          for (let c = minCol; c < maxCol; c++) {
            const cellX = c * tileSize;
            const cellY = r * tileSize;
            const cellCenterX = cellX + tileSize / 2;
            const cellCenterY = cellY + tileSize / 2;

            const dist = Math.hypot(cellCenterX - cx, cellCenterY - cy);
            if (dist < radius) {
              // Soft, smooth cosine bell-curve fade toward the edges
              const falloff = Math.cos((dist / radius) * (Math.PI / 2)) ** 2;
              const isCheckered = (r + c) % 2 === 0;

              if (isCheckered) {
                // Whisper-soft primary micro-square (barely visible light neutral grey)
                const fillAlpha = falloff * baseAlpha * (isDarkHeader ? 0.06 : 0.038);
                ctx.fillStyle = isDarkHeader
                  ? `rgba(255, 255, 255, ${fillAlpha})`
                  : `rgba(0, 0, 0, ${fillAlpha})`;
                ctx.fillRect(cellX + 0.5, cellY + 0.5, tileSize - 1, tileSize - 1);
              } else {
                // Ultra-delicate alternate square for fine texture definition
                const altAlpha = falloff * baseAlpha * (isDarkHeader ? 0.015 : 0.01);
                ctx.fillStyle = isDarkHeader
                  ? `rgba(255, 255, 255, ${altAlpha})`
                  : `rgba(0, 0, 0, ${altAlpha})`;
                ctx.fillRect(cellX + 0.5, cellY + 0.5, tileSize - 1, tileSize - 1);
              }
            }
          }
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handlePointerEnter = (e: React.PointerEvent<HTMLElement>) => {
    if (!isFinePointer.current || e.pointerType === 'touch') return;
    const rect = headerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePos.current = { x, y };
    if (opacityRef.current <= 0.01) {
      currentPos.current = { x, y };
    }
    targetOpacityRef.current = 1;
    startAnimationLoop();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isFinePointer.current || e.pointerType === 'touch') return;
    const rect = headerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    targetOpacityRef.current = 1;
    startAnimationLoop();
  };

  const handlePointerLeave = () => {
    targetOpacityRef.current = 0;
  };

  const handleNavCategory = (cat: string, e: React.MouseEvent) => {
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory(cat);
      const el = document.getElementById('storefront-catalog');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header
      ref={headerRef}
      id="store-header"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        textShadow: scrolled ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.6)',
      }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 overflow-hidden ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs text-gray-950'
          : 'bg-black/25 backdrop-blur-md border-b border-white/10 text-white shadow-xs'
      }`}
    >
      {/* Interactive Checkered Spotlight Cursor Effect */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
        {/* Left Section: [ SM Studios ] Brand */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 min-w-0">
          <a
            id="header-brand-link"
            href="#hero-root"
            onClick={(e) => handleScrollToSection('hero-root', e)}
            className={`flex flex-col shrink-0 no-underline transition-opacity hover:opacity-90 select-none ${
              scrolled ? 'text-gray-950' : 'text-white'
            }`}
          >
            <span
              className="text-base sm:text-lg font-black tracking-[0.16em] leading-tight whitespace-nowrap"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              SM Studios
            </span>
            <span
              className={`text-[9px] uppercase tracking-widest font-semibold hidden sm:block leading-none mt-0.5 ${
                scrolled ? 'text-gray-500' : 'text-emerald-400'
              }`}
            >
              3D Print Studio
            </span>
          </a>
        </div>

        {/* Center Section: Navigation Links */}
        <nav
          id="header-nav-links"
          className={`hidden lg:flex items-center gap-3 xl:gap-5 text-[11px] xl:text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 ${
            scrolled ? 'text-gray-600' : 'text-white/85'
          }`}
        >
          <a
            id="nav-link-god-idols"
            href="#storefront-catalog"
            onClick={(e) => handleNavCategory('god-idols', e)}
            className={`transition-colors duration-150 flex items-center gap-1.5 shrink-0 ${
              scrolled ? 'hover:text-black' : 'hover:text-white'
            }`}
          >
            <Heart size={13} className="text-amber-500 fill-amber-500 shrink-0" />
            <span>God Idols</span>
          </a>

          <a
            id="nav-link-custom-prints"
            href="#custom-service"
            onClick={(e) => handleScrollToSection('custom-service', e)}
            className={`transition-colors duration-150 flex items-center gap-1.5 shrink-0 ${
              scrolled ? 'hover:text-black' : 'hover:text-white'
            }`}
          >
            <Sparkles size={13} className="text-emerald-500 shrink-0" />
            <span>Custom 3D Print</span>
          </a>

          <a
            id="nav-link-figurines"
            href="#storefront-catalog"
            onClick={(e) => handleNavCategory('figurines', e)}
            className={`transition-colors duration-150 flex items-center gap-1.5 shrink-0 ${
              scrolled ? 'hover:text-black' : 'hover:text-white'
            }`}
          >
            <Box size={13} className={`shrink-0 ${scrolled ? 'text-gray-500' : 'opacity-75'}`} />
            <span>Figurines</span>
          </a>

          <button
            id="nav-link-track-order"
            type="button"
            onClick={onOpenTrackOrder}
            className={`transition-colors duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer uppercase ${
              scrolled ? 'hover:text-black' : 'hover:text-white'
            }`}
          >
            <Package size={13} className={`shrink-0 ${scrolled ? 'text-gray-500' : 'opacity-80'}`} />
            <span>Track Order</span>
          </button>
        </nav>

        {/* Right Section: [ Track Order (Mobile) ] [ Upload STL Quote ] [ Cart ] */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="header-track-order-btn"
            type="button"
            onClick={onOpenTrackOrder}
            className={`lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
              scrolled
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                : 'text-white bg-white/15 hover:bg-white/25 border border-white/25'
            }`}
            title="Track Order"
          >
            <Package size={13} className="shrink-0" />
            <span className="hidden xs:inline">Track Order</span>
            <span className="xs:hidden">Track</span>
          </button>

          <button
            id="quote-trigger-btn"
            type="button"
            onClick={onOpenCustomQuote}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
              scrolled
                ? 'bg-black text-white hover:bg-gray-800 border border-black'
                : 'text-white bg-white/15 hover:bg-white/25 border border-white/25'
            }`}
          >
            <Sparkles size={13} className="text-yellow-300 shrink-0" />
            <span>Upload STL Quote</span>
          </button>

          {onOpenAuth && (
            <button
              id="auth-trigger-btn"
              type="button"
              onClick={onOpenAuth}
              aria-label="Account Login"
              className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-150 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                scrolled
                  ? 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-300'
                  : 'bg-white/15 hover:bg-white/25 border border-white/30 text-white'
              }`}
              title="Customer & Admin Account"
            >
              <User size={17} className="shrink-0" />
            </button>
          )}

          <button
            id="cart-trigger-btn"
            type="button"
            onClick={onOpenCart}
            aria-label="View shopping cart"
            className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-150 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
              scrolled
                ? 'bg-black text-white hover:bg-gray-800 border border-black'
                : 'bg-white/15 hover:bg-white/25 border border-white/30 text-white'
            }`}
          >
            <ShoppingBag size={18} className="shrink-0" />
            {totalItemCount > 0 && (
              <span
                id="cart-badge-count"
                className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-md animate-bounce"
              >
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
