import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, ShoppingBag, Heart, Eye } from 'lucide-react';
import { Product, NavigationDirection } from '../types';
import { formatINR } from '../utils';

interface NavigationControlsProps {
  onNavigate: (direction: NavigationDirection) => void;
  isAnimating: boolean;
  activeFigurine?: Product;
  activeProductIndex?: number;
  totalProducts?: number;
  onQuickOrder?: () => void;
  onViewProduct?: () => void;
  onExploreSection?: (category?: string) => void;
  className?: string;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  onNavigate,
  activeFigurine,
  activeProductIndex = 0,
  totalProducts,
  onQuickOrder,
  onViewProduct,
  onExploreSection,
  className,
}) => {
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number | null>(null);

  // Touch handlers on product carousel: left = prev, right = next
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartXRef.current - touchEndX;
    const diffY =
      touchStartYRef.current !== null
        ? Math.abs(touchStartYRef.current - touchEndY)
        : 0;

    if (Math.abs(diffX) > 30 && Math.abs(diffX) > diffY) {
      if (diffX > 0) {
        // Swiping left -> show NEXT product
        onNavigate('next');
      } else {
        // Swiping right -> show PREVIOUS product
        onNavigate('prev');
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Pointer/mouse drag handlers for desktop or synthetic test gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartXRef.current === null) return;
    const diffX = pointerStartXRef.current - e.clientX;
    const diffY =
      pointerStartYRef.current !== null
        ? Math.abs(pointerStartYRef.current - e.clientY)
        : 0;

    if (Math.abs(diffX) > 30 && Math.abs(diffX) > diffY) {
      if (diffX > 0) {
        // Dragging left -> show NEXT product
        onNavigate('next');
      } else {
        // Dragging right -> show PREVIOUS product
        onNavigate('prev');
      }
    }
    pointerStartXRef.current = null;
    pointerStartYRef.current = null;
  };

  return (
    <div
      id="product-carousel"
      data-testid="product-carousel"
      aria-label="Product Carousel"
      data-active-index={activeProductIndex}
      data-total-products={totalProducts}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`product-carousel touch-pan-y select-none ${
        className || 'relative w-full max-w-[400px] sm:max-w-[460px]'
      }`}
    >
      <div
        id="bottom-left-nav"
        className="w-full bg-black/50 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 shadow-2xl"
        style={{
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <p
            id="heading-smstudios-figurines"
            className="font-black uppercase tracking-widest text-white text-base sm:text-[20px]"
            style={{
              letterSpacing: '0.04em',
            }}
          >
            SM STUDIOS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-white font-semibold mb-2">
          {activeFigurine ? (
            <>
              <span className="font-mono text-white font-bold">{activeFigurine.name}</span>
              <span className="text-white/50">•</span>
              <span className="text-amber-300 font-mono font-bold text-sm">
                {formatINR(activeFigurine.price)}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/25 uppercase tracking-wider font-bold text-white border border-white/20">
                8K Resin
              </span>
            </>
          ) : (
            <span className="text-white/80">Custom 3D Prints & Sacred Murti</span>
          )}
        </div>

        <p
          id="caption-smstudios-description"
          className="hidden sm:block text-xs sm:text-sm text-white/95 mb-3 leading-relaxed"
        >
          Specializing in sacred god idols and on-demand custom 3D printing. Hand-finished with zero visible layer lines.
        </p>

        {/* Quick category badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3 sm:mb-4">
          <button
            type="button"
            onClick={() => onExploreSection?.('god-idols')}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/30 text-amber-200 border border-amber-400/40 hover:bg-amber-500/45 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Heart size={10} className="fill-amber-300 text-amber-300" />
            <span>God Idols</span>
          </button>
          <button
            type="button"
            onClick={() => onExploreSection?.('custom-prints')}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors cursor-pointer"
          >
            <span>Custom 3D Print</span>
          </button>
        </div>

        <div id="nav-buttons-group" className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5">
          <button
            id="prev-btn"
            type="button"
            onClick={() => onNavigate('prev')}
            aria-label="Previous figurine"
            className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center border-2 border-white text-white cursor-pointer select-none bg-white/10 hover:scale-108 hover:bg-white/25 active:scale-95 focus:outline-none transition-[transform,background-color] duration-150 shadow-md"
            style={{
              transformOrigin: 'center',
            }}
          >
            <ArrowLeft size={20} strokeWidth={2.25} />
          </button>

          <button
            id="next-btn"
            type="button"
            onClick={() => onNavigate('next')}
            aria-label="Next figurine"
            className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center border-2 border-white text-white cursor-pointer select-none bg-white/10 hover:scale-108 hover:bg-white/25 active:scale-95 focus:outline-none transition-[transform,background-color] duration-150 shadow-md"
            style={{
              transformOrigin: 'center',
            }}
          >
            <ArrowRight size={20} strokeWidth={2.25} />
          </button>

          {activeFigurine && (
            <div className="flex flex-wrap xs:flex-nowrap items-center gap-2 min-w-0">
              {/* Primary CTA: ORDER */}
              <button
                id="hero-quick-add-btn"
                type="button"
                onClick={onQuickOrder}
                className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white text-gray-950 text-xs font-bold uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-lg whitespace-nowrap"
              >
                <ShoppingBag size={14} className="text-gray-950 shrink-0" />
                <span>Order {formatINR(activeFigurine.price)}</span>
              </button>

              {/* Secondary CTA: VIEW PRODUCT */}
              <button
                id="hero-view-product-btn"
                type="button"
                onClick={onViewProduct}
                className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/35 hover:border-white/55 text-xs font-semibold uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-xs whitespace-nowrap backdrop-blur-xs"
              >
                <Eye size={13} className="text-white/90 shrink-0" />
                <span>View Product</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
