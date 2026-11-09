import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Check,
  ShieldCheck,
  Box,
  Heart,
  Sparkles,
  Car,
} from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils';
import { CatalogSidebar, MinimalCategory } from './CatalogSidebar';

interface StoreCatalogProps {
  products: Product[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onAddToCart: (
    item: Product,
    finish: string,
    scale: string,
    price: number
  ) => void;
  onSelectHeroFigurine: (index: number) => void;
  onOpenCustomQuote: () => void;
  activeProductModal?: Product | null;
  onCloseProductModal?: () => void;
}

export const SCALE_DIMENSION_OPTIONS = [
  { key: '4 inches', label: '4 inches (Dashboard Size)' },
  { key: '6 inches', label: '6 inches (Compact Altar)' },
  { key: '8 inches', label: '8 inches (Home Mandir)' },
  { key: '10 inches', label: '10 inches (Grand Showcase)' },
  { key: '12 inches', label: '12 inches (Temple Edition)' },
];

export const StoreCatalog: React.FC<StoreCatalogProps> = ({
  products,
  selectedCategory,
  onCategoryChange,
  onAddToCart,
  onSelectHeroFigurine,
  onOpenCustomQuote,
  activeProductModal,
  onCloseProductModal,
}) => {
  // Local state for each item's selected finish and scale
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, { finish: string; scale: string }>
  >(() => {
    const initial: Record<string, { finish: string; scale: string }> = {};
    products.forEach((p) => {
      const defaultFinish = p.availableFinishes?.[0]?.key || 'gold-leaf';
      const defaultScale = p.availableScales?.[0]?.key || '160mm';
      initial[p.id] = { finish: defaultFinish, scale: defaultScale };
    });
    return initial;
  });

  const [activeSpecsItem, setActiveSpecsItem] = useState<Product | null>(null);

  const currentModalItem =
    activeProductModal !== undefined
      ? activeProductModal || activeSpecsItem
      : activeSpecsItem;

  const handleCloseModal = () => {
    setActiveSpecsItem(null);
    onCloseProductModal?.();
  };

  const [activeCategory, setActiveCategory] = useState<string>(selectedCategory || 'all');
  const isManualScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Minimal categories with accurate display names and target section IDs
  const CATEGORIES: MinimalCategory[] = [
    { id: 'all', name: 'All Products', targetId: 'storefront-catalog' },
    { id: 'god-idols', name: 'Sacred God Idols', targetId: 'category-section-god-idols' },
    { id: 'figurines', name: 'Art & Divine Figurines', targetId: 'category-section-figurines' },
    { id: 'custom-prints', name: 'Custom 3D Prints', targetId: 'custom-service' },
  ];

  const CATEGORY_SECTIONS = [
    {
      id: 'god-idols',
      title: 'Sacred God Idols',
      tagline: 'Home Mandir & Car Dashboard',
      description:
        'Zero layer line SLA resin sculptures with vibration-damped 3M dashboard mounting and sacred antique patinas.',
    },
    {
      id: 'figurines',
      title: 'Art & Divine Figurines',
      tagline: 'Mythological Collectibles',
      description:
        'High-density photopolymer resin statues capturing microscopic deity ornaments and flowing drapery.',
    },
  ];

  // Sync external selectedCategory if updated from hero or navigation
  useEffect(() => {
    if (selectedCategory && selectedCategory !== activeCategory) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // True scroll-linked navigation / scroll-spy implementation
  useEffect(() => {
    const updateActiveSection = () => {
      if (isManualScrollingRef.current) return;

      // 1. Check if user reached near the bottom of the page
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      if (scrollBottom >= docHeight - 90) {
        setActiveCategory((prev) => (prev !== 'custom-prints' ? 'custom-prints' : prev));
        return;
      }

      // 2. Reading focus line (160px from viewport top, right where eyes focus below navbar)
      const focalLine = 160;

      // Tracked category sections in sequential order
      const sections = [
        { id: 'god-idols', elId: 'category-section-god-idols' },
        { id: 'figurines', elId: 'category-section-figurines' },
        { id: 'custom-prints', elId: 'custom-service' },
      ];

      // Check which section currently contains the focal line
      for (const sec of sections) {
        const el = document.getElementById(sec.elId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= focalLine && rect.bottom > focalLine) {
            setActiveCategory((prev) => (prev !== sec.id ? sec.id : prev));
            return;
          }
        }
      }

      // 3. Fallback: If above god-idols but inside storefront-catalog header
      const catalogEl = document.getElementById('storefront-catalog');
      const firstSectionEl = document.getElementById('category-section-god-idols');
      if (catalogEl && firstSectionEl) {
        const catalogRect = catalogEl.getBoundingClientRect();
        const firstSecRect = firstSectionEl.getBoundingClientRect();

        if (catalogRect.top <= focalLine + 120 && firstSecRect.top > focalLine) {
          setActiveCategory((prev) => (prev !== 'all' ? 'all' : prev));
        }
      }
    };

    // Set up IntersectionObserver with meaningful reading margins
    let observer: IntersectionObserver | null = null;
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        () => {
          updateActiveSection();
        },
        {
          rootMargin: '-120px 0px -40% 0px',
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
        }
      );

      const targetIds = [
        'storefront-catalog',
        'category-section-god-idols',
        'category-section-figurines',
        'custom-service',
      ];

      targetIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el && observer) observer.observe(el);
      });
    }

    // High-frequency, buttery smooth scroll listener with requestAnimationFrame
    let rafId: number | null = null;
    const handleScroll = () => {
      if (isManualScrollingRef.current) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateActiveSection();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial evaluation
    updateActiveSection();

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Smooth scroll and immediate active category update when clicked
  const handleSelectCategory = (cat: MinimalCategory) => {
    setActiveCategory(cat.id);
    onCategoryChange(cat.id);
    isManualScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    const targetEl = document.getElementById(cat.targetId);
    if (targetEl) {
      const headerOffset = 90; // offset for fixed navbar + breathing room
      const elementPosition = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }

    // Reset manual scroll lock after smooth scrolling completes
    scrollTimeoutRef.current = window.setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 850);
  };

  // The canonical product.price from the single shared source of truth
  const getProductPrice = (item: Product): number => {
    return item.price;
  };

  const handleFinishChange = (id: string, finish: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), finish },
    }));
  };

  const handleScaleChange = (id: string, scale: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), scale },
    }));
  };

  // Product Card - Always references the single canonical product.price
  const renderProductCard = (item: Product) => {
    const opts = selectedOptions[item.id] || {
      finish: item.availableFinishes?.[0]?.key || 'gold-leaf',
      scale: item.availableScales?.[0]?.key || '160mm',
    };
    const currentPrice = getProductPrice(item);

    return (
      <div
        key={item.id}
        id={`product-card-${item.id}`}
        className="group relative flex flex-col items-center cursor-pointer select-none"
        onClick={() => setActiveSpecsItem(item)}
      >
        {/* Product Visual Container */}
        <div className="w-full aspect-square relative rounded-2xl bg-neutral-50 border border-gray-100 flex items-center justify-center p-5 overflow-hidden transition-all duration-300 group-hover:bg-neutral-100/70 group-hover:border-gray-200">
          <img
            src={item.image || item.src}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Minimal Quick-Action Overlay */}
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSpecsItem(item);
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white/95 text-neutral-800 border border-gray-200 shadow-xs hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              Specs
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(item, opts.finish, opts.scale, currentPrice);
              }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-black text-white shadow-xs hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShoppingBag size={12} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Product Name & INR Price (exact canonical product.price) */}
        <div className="mt-3 text-center w-full px-1 flex flex-col items-center">
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-black group-hover:text-neutral-700 transition-colors leading-snug">
            {item.name}
          </h3>
          <span className="mt-0.5 text-xs font-mono font-bold text-neutral-900">
            {formatINR(currentPrice)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section
      id="storefront-catalog"
      data-section-id="all"
      className="relative py-16 sm:py-24 px-4 sm:px-8 bg-white text-gray-950 border-t border-gray-200"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Mobile Sticky Category Strip */}
      <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 sm:-mx-8 sm:px-8 py-2.5 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-2xs mb-8">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              id={`mobile-category-${cat.id}`}
              onClick={() => handleSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs tracking-tight transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200 font-medium'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full w-fit mb-3">
              <Box size={13} className="text-gray-900" />
              <span>3D Workshop Catalog • Zero Layer Lines</span>
            </div>
            <h2
              className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-black"
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              OUR 3D PRINTING WORKSHOP
            </h2>
            <p className="text-sm text-neutral-600 mt-2 max-w-2xl leading-relaxed">
              Precision 8K & 12K photopolymer resin manufacturing. Explore our sanctified <strong>Sacred God Idols</strong>, artistic collectibles, and custom print-on-demand services.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-neutral-700">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-50 border border-gray-200 shadow-2xs font-medium">
              <ShieldCheck size={13} className="text-emerald-600" />
              8K SLA Ultra HD
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-50 border border-gray-200 shadow-2xs font-medium">
              <Car size={13} className="text-amber-600" />
              Dashboard Safe
            </span>
          </div>
        </div>

        {/* Two-Column Layout: Minimal Sticky Sidebar + Continuous Categorized Product Grid */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12 items-start relative">
          {/* Desktop Sticky Rail (Consistently visible without scrolling away) */}
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-28 self-start pt-1">
            <CatalogSidebar
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
            />
          </aside>

          {/* Main Products Flow */}
          <div className="flex-1 min-w-0 w-full space-y-16 sm:space-y-20">
            {CATEGORY_SECTIONS.map((sec) => {
              const sectionProducts = products.filter(
                (p) => p.category === sec.id
              );
              if (sectionProducts.length === 0) return null;

              return (
                <section
                  key={sec.id}
                  id={`category-section-${sec.id}`}
                  data-section-id={sec.id}
                  className="space-y-6 pt-4 first:pt-0 scroll-mt-28"
                >
                  {/* Clean Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-black">
                        {sec.title}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                        {sec.description}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                      {sectionProducts.length} models
                    </span>
                  </div>

                  {/* Minimalist Product Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                    {sectionProducts.map(renderProductCard)}
                  </div>
                </section>
              );
            })}

            {/* Custom Print Callout in Catalog */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950 text-white border border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                    Looking for a Custom 3D STL Print?
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Upload your CAD or 3D sculpt files for instant volume calculation, density infills, and instant INR pricing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCustomQuote}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Instant .STL Quote Tool
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details & Ordering Modal */}
      {currentModalItem && (() => {
        const item = currentModalItem;
        const opts = selectedOptions[item.id] || {
          finish: item.availableFinishes?.[0]?.key || 'gold-leaf',
          scale: item.availableScales?.[0]?.key || '160mm',
        };
        const currentPrice = getProductPrice(item);

        return (
          <div
            id="product-specs-modal-backdrop"
            className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={handleCloseModal}
          >
            <div
              id="product-specs-modal-card"
              className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col md:flex-row gap-6 text-gray-950"
              style={{ fontFamily: "'Inter', sans-serif" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column: Visual Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                  <img
                    src={item.image || item.src}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain object-bottom"
                  />
                </div>
                <span className="mt-3 text-[11px] font-mono text-gray-500 uppercase tracking-wider">
                  {item.edition || 'Divine Collection'} • {item.printTech || '8K SLA Resin'}
                </span>
              </div>

              {/* Right Column: Interactive Specs & Customizer */}
              <div className="w-full md:w-1/2 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        {item.categoryLabel || item.category}
                      </span>
                      <h3 className="text-xl font-bold uppercase tracking-tight text-black mt-1.5">
                        {item.name}
                      </h3>
                      {item.subtitle && (
                        <p className="text-xs text-gray-600 mt-1">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-gray-700 mt-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Finish Selector */}
                  {item.availableFinishes && item.availableFinishes.length > 0 && (
                    <div className="mt-4">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                        Resin Curing & Finish
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {item.availableFinishes.map((f) => {
                          const isSel = opts.finish === f.key;
                          return (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => handleFinishChange(item.id, f.key)}
                              className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                                isSel
                                  ? 'border-black bg-black text-white font-semibold'
                                  : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400'
                              }`}
                            >
                              <div className="leading-tight">{f.label}</div>
                              <div className="text-[10px] opacity-70 mt-0.5">
                                Included
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Scale / Dimension Selector */}
                  <div className="mt-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                      Scale / Dimension
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {(item.availableScales && item.availableScales.length > 0
                        ? item.availableScales
                        : SCALE_DIMENSION_OPTIONS
                      ).map((s) => {
                        const isSel = (opts.scale || '160mm') === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => handleScaleChange(item.id, s.key)}
                            className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                              isSel
                                ? 'border-black bg-black text-white font-semibold'
                                : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400'
                            }`}
                          >
                            <div className="leading-tight font-medium">{s.label}</div>
                            <div className="text-[10px] opacity-70 mt-0.5">
                              Included
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Price & Action - Always references product.price */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Product Price
                    </span>
                    <span className="text-xl font-bold font-mono text-black">
                      {formatINR(currentPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.featured && (
                      <button
                        type="button"
                        onClick={() => {
                          const featuredList = products.filter(
                            (p) => p.featured && p.available !== false
                          );
                          const idx = featuredList.findIndex((p) => p.id === item.id);
                          if (idx >= 0) onSelectHeroFigurine(idx);
                          handleCloseModal();
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Inspect in Hero
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(item, opts.finish, opts.scale, currentPrice);
                        handleCloseModal();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ShoppingBag size={14} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
