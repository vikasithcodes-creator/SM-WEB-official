/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { CarouselItem } from './components/CarouselItem';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomPrintQuote } from './components/CustomPrintQuote';
import { DiscoverLink } from './components/DiscoverLink';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { NavigationControls } from './components/NavigationControls';
import { ReviewsSection } from './components/ReviewsSection';
import { StoreCatalog } from './components/StoreCatalog';
import { Toast } from './components/Toast';
import { TrackOrderModal } from './components/TrackOrderModal';
import { ChatbotWidget } from './components/ChatbotWidget';
import { AuthModal } from './components/AuthModal';
import { PRODUCTS, getFeaturedProducts, ALL_PRODUCTS, getProductSrcSet, getHeroImage, heroImageSizes } from './data';
import {
  CarouselRole,
  CartItem,
  Product,
  NavigationDirection,
} from './types';
import { Heart, Sparkles, Box, ShieldCheck, Car, Lamp } from 'lucide-react';

// Grain overlay SVG data URI with fractalNoise
const GRAIN_SVG_DATA_URI = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E`;

const CART_STORAGE_KEY = 'toonhub_cart_v2';

export default function App() {
  // Homepage Hero Carousel dynamically pulls only products with featured: true
  const heroProducts = getFeaturedProducts(PRODUCTS);

  const [activeProductIndex, setActiveProductIndex] = useState<number>(0);
  const activeIndex = activeProductIndex;
  const setActiveIndex = setActiveProductIndex;
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  // Canonical active figurine displayed in Hero stage and product carousel
  const activeFigurine = heroProducts[activeProductIndex] || heroProducts[0];

  // Selected catalog category
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart & Storefront State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default initial sample item: Balaji idol using exact canonical price
    const sampleProduct = PRODUCTS.find((p) => p.id === 'fig-01');
    return sampleProduct
      ? [
          {
            id: 'init-cart-1',
            figurineId: sampleProduct.id,
            name: sampleProduct.name,
            category: sampleProduct.category,
            src: sampleProduct.image || sampleProduct.src,
            price: sampleProduct.price,
            quantity: 1,
            finish: 'gold-leaf',
            scale: '160mm Standard',
          },
        ]
      : [];
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Dedicated Admin Route Management (/admin, #admin, ?admin=true)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === '/admin' ||
      path.startsWith('/admin/') ||
      hash === '#admin' ||
      search.includes('admin=true')
    );
  });

  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      setIsAdmin(
        path === '/admin' ||
        path.startsWith('/admin/') ||
        hash === '#admin' ||
        search.includes('admin=true')
      );
    };

    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);
    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, []);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Preload all hero images on mount via new Image()
  useEffect(() => {
    heroProducts.forEach((item) => {
      const img = new Image();
      // Same srcset/sizes as the carousel, so the preloaded file is the one it will display.
      const srcSet = getProductSrcSet(getHeroImage(item));
      if (srcSet) {
        img.sizes = heroImageSizes(isMobile);
        img.srcset = srcSet;
      }
      img.src = getHeroImage(item);
    });
  }, [heroProducts, isMobile]);

  // Update isMobile state & scroll listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Toast notifier
  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Navigation handler with 650ms animation lock
  // Shared activeProductIndex state is updated synchronously and loops seamlessly
  const navigate = useCallback(
    (direction: NavigationDirection) => {
      if (isAnimating) return;
      const count = heroProducts.length;
      if (count === 0) return;
      setIsAnimating(true);
      setActiveProductIndex((prev) =>
        direction === 'next' ? (prev + 1) % count : (prev + count - 1) % count
      );
      setTimeout(() => {
        setIsAnimating(false);
      }, 650);
    },
    [isAnimating, heroProducts.length]
  );

  // Keyboard navigation support (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigate('prev');
      } else if (e.key === 'ArrowRight') {
        navigate('next');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Touch & pointer swipe support for hero carousel
  // Required bidirectional behavior:
  // Swiping left on the hero -> move to previous product (navigate('prev'))
  // Swiping right on the hero -> move to next product (navigate('next'))
  // Natural swipe direction: left = previous, right = next
  const pointerStartXRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
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
        // Swiping left -> both hero and products move left -> show NEXT product
        navigate('next');
      } else {
        // Swiping right -> both hero and products move right -> show PREVIOUS product
        navigate('prev');
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

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
        // Swiping left -> show NEXT product
        navigate('next');
      } else {
        // Swiping right -> show PREVIOUS product
        navigate('prev');
      }
    }
    pointerStartXRef.current = null;
    pointerStartYRef.current = null;
  };

  // Cart operations - Always references canonical product.price
  const handleAddToCart = (
    item: Product,
    finish: string,
    scale: string,
    _price?: number
  ) => {
    const itemKey = `${item.id}-${finish}-${scale}`;
    // Canonical price from the single source of truth
    const canonicalPrice = item.price;

    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemKey);
      if (existing) {
        return prev.map((i) =>
          i.id === itemKey ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: itemKey,
          figurineId: item.id,
          name: item.name,
          category: item.category,
          src: item.image || item.src,
          price: canonicalPrice,
          quantity: 1,
          finish,
          scale,
        },
      ];
    });
    showToast(`Added ${item.name} (${scale}) to cart!`);
  };

  const handleQuickOrderActive = () => {
    if (!activeFigurine) return;
    const defaultFinish = activeFigurine.availableFinishes?.[0]?.key || 'gold-leaf';
    const defaultScale = activeFigurine.availableScales?.[0]?.key || '160mm';
    handleAddToCart(activeFigurine, defaultFinish, defaultScale, activeFigurine.price);
    setIsCartOpen(true);
  };

  const handleAddCustomToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
    showToast(`Added ${item.name} to 3D print cart!`);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
      );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderCompleted = () => {
    setCart([]);
  };

  const scrollToCustomQuote = () => {
    const el = document.getElementById('custom-service');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectHeroFigurine = (index: number) => {
    setActiveIndex(index);
    const heroEl = document.getElementById('hero-root');
    heroEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJumpToCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'custom-prints') {
      scrollToCustomQuote();
    } else {
      const targetId =
        cat === 'god-idols' || cat === 'figurines' || cat === 'home-decor'
          ? `category-section-${cat}`
          : 'storefront-catalog';
      const el = document.getElementById(targetId);
      if (el) {
        const headerOffset = 90;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      } else {
        const catalogEl = document.getElementById('storefront-catalog');
        catalogEl?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Derive role for each hero product index dynamically based on activeIndex
  const getRole = (index: number): CarouselRole => {
    const total = heroProducts.length;
    if (total <= 1) return 'center';
    if (index === activeIndex) return 'center';
    if (index === (activeIndex + total - 1) % total) return 'left';
    if (index === (activeIndex + 1) % total) return 'right';
    return 'back';
  };

  // Cart subtotal calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = 0;
  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const total = subtotal - discount + shipping;

  // Render Admin Panel if on /admin route
  if (isAdmin) {
    return (
      <AdminPanel
        onExitAdmin={() => {
          window.history.pushState(null, '', '/');
          setIsAdmin(false);
        }}
      />
    );
  }

  return (
    <div id="sm-studios-storefront-root" className="relative w-full bg-white text-gray-950">
      {/* Sticky Storefront Navigation Bar */}
      <Header
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCustomQuote={scrollToCustomQuote}
        onOpenTrackOrder={() => setIsTrackModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        scrolled={scrolled}
        onSelectCategory={handleJumpToCategory}
      />

      {/* Hero Section */}
      <div
        id="hero-root"
        data-testid="hero-carousel"
        aria-label="Hero Carousel"
        data-active-index={activeProductIndex}
        className="hero-carousel relative w-full overflow-hidden select-none touch-pan-y"
        style={{
          backgroundColor: activeFigurine?.bg || '#C97A1E',
          transition: 'background-color 650ms cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: "'Inter', sans-serif",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          id="hero-viewport"
          className="relative w-full flex flex-col justify-between overflow-hidden min-h-[100svh] min-h-[calc(100vh-4.5rem)]"
        >
          {/* 1. Grain overlay */}
          <div
            id="grain-overlay"
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              opacity: 0.4,
              backgroundImage: `url("${GRAIN_SVG_DATA_URI}")`,
              backgroundSize: '200px 200px',
              backgroundRepeat: 'repeat',
            }}
          />

          {/* 2. Giant ghost text "3D SHAPE" watermark */}
          <div
            id="giant-ghost-text"
            className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none uppercase"
            style={{
              zIndex: 2,
              top: 'clamp(80px, 16vh, 160px)',
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(70px, 24vw, 340px)',
              fontWeight: 900,
              color: '#ffffff',
              opacity: 0.12,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            3D SHAPE
          </div>

          {/* 4. Carousel dynamically rendering all featured products */}
          <div
            id="carousel-stage"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 10 }}
          >
            {heroProducts.map((item, index) => {
              const role = getRole(index);
              return (
                <CarouselItem
                  key={item.id}
                  item={item}
                  index={index}
                  role={role}
                  isMobile={isMobile}
                  onNavigate={navigate}
                />
              );
            })}
          </div>

          {/* Dedicated top spacing below fixed header to guarantee separation */}
          <div className="shrink-0 h-16 sm:h-20 pointer-events-none" />

          {/* Flexible center space keeping figurine visually prominent and centered */}
          <div className="flex-1 min-h-[140px] sm:min-h-[180px] pointer-events-none" />

          {/* Foreground UI Controls: responsive flex layout that stacks on mobile/tablet */}
          <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 flex flex-col md:flex-row items-stretch md:items-end justify-between gap-3 sm:gap-4 pointer-events-none">
            {/* Left: Product Information, Specs & Nav Controls */}
            <div className="pointer-events-auto w-full md:w-auto shrink-0 flex justify-start">
              <NavigationControls
                onNavigate={navigate}
                isAnimating={isAnimating}
                activeFigurine={activeFigurine}
                activeProductIndex={activeProductIndex}
                totalProducts={heroProducts.length}
                onQuickOrder={handleQuickOrderActive}
                onViewProduct={() => setIsHeroModalOpen(true)}
                onExploreSection={handleJumpToCategory}
              />
            </div>

            {/* Right: "DISCOVER IT ->" CTA */}
            <div className="pointer-events-auto flex justify-end shrink-0">
              <DiscoverLink />
            </div>
          </div>

          {/* Subtle bottom mist inside hero viewport blending into the transition */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              zIndex: 15,
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.12) 100%)',
            }}
          />
        </div>

        {/* Seamless Dynamic Gradient Fade from Hero Color into White Background */}
        <div
          id="hero-fade-to-white"
          className="w-full h-16 sm:h-24 pointer-events-none relative z-20"
          style={{
            background: `linear-gradient(to bottom, ${activeFigurine?.bg || '#C97A1E'} 0%, rgba(255, 255, 255, 0.45) 45%, rgba(255, 255, 255, 0.9) 75%, #ffffff 100%)`,
            transition: 'background 650ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Featured Pillar Quick-Jump Bar: Specialized 3D Print Focus */}
      <div
        id="specialized-3d-print-focus"
        className="relative z-20 bg-white border-y border-gray-200 py-4 sm:py-5 px-4 sm:px-8 shadow-xs"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 shrink-0 flex items-center gap-2">
            <span>Specialized 3D Print Focus:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleJumpToCategory('god-idols')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-900 hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <Heart size={14} className="fill-amber-500 text-amber-500 shrink-0" />
              <span>Sacred God Idols (Home & Car Dash)</span>
            </button>

            <button
              type="button"
              onClick={() => handleJumpToCategory('custom-prints')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-900 hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <Sparkles size={14} className="text-emerald-600 shrink-0" />
              <span>Custom 3D Print</span>
            </button>

            <button
              type="button"
              onClick={() => handleJumpToCategory('figurines')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-900 hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <Box size={14} className="text-gray-700 shrink-0" />
              <span>Art Figurines</span>
            </button>

            <button
              type="button"
              onClick={() => handleJumpToCategory('home-decor')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-900 hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <Lamp size={14} className="text-amber-600 shrink-0" />
              <span>Home Decor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Storefront Catalog */}
      <StoreCatalog
        products={ALL_PRODUCTS}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onAddToCart={handleAddToCart}
        onSelectHeroFigurine={handleSelectHeroFigurine}
        onOpenCustomQuote={scrollToCustomQuote}
        activeProductModal={isHeroModalOpen ? activeFigurine : null}
        onCloseProductModal={() => setIsHeroModalOpen(false)}
      />

      {/* On-Demand Custom 3D Printing Estimator */}
      <CustomPrintQuote onAddCustomToCart={handleAddCustomToCart} />

      {/* Customer Testimonials & Proof */}
      <ReviewsSection />

      {/* Footer */}
      <Footer
        onOpenTrackOrder={() => setIsTrackModalOpen(true)}
        onNavigateAdmin={() => {
          window.history.pushState(null, '', '/admin');
          setIsAdmin(true);
        }}
      />

      {/* Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        products={PRODUCTS}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Full Checkout & Dispatch Simulation Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        products={PRODUCTS}
        subtotal={subtotal}
        discount={discount}
        shipping={shipping}
        total={total}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Feedback Toast */}
      <Toast
        message={toastMessage}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Customer & Admin Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Guided FAQ Selection-Based Chatbot */}
      <ChatbotWidget
        onOpenTrackOrder={() => setIsTrackModalOpen(true)}
        onOpenCustomQuote={scrollToCustomQuote}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigateCatalog={() => {
          const el = document.getElementById('storefront-catalog') || document.getElementById('store-catalog');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}
