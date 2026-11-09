import React from 'react';
import { ShieldCheck, Truck, RefreshCw, Mail, Heart, Sparkles, Box } from 'lucide-react';

interface FooterProps {
  onOpenTrackOrder?: () => void;
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTrackOrder, onNavigateAdmin }) => {
  return (
    <footer
      id="store-footer"
      className="relative bg-white text-gray-950 border-t border-gray-200 pt-16 pb-12 px-4 sm:px-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-gray-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-black shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                Laser-Cut Shock Armor Packaging
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Custom cut EVA foam protects delicate modaks, flutes, tridents, and gaming controller prongs during transit.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-black shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                Zero-Break & Flawless Guarantee
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                If your sacred murti or controller dock arrives imperfect, our workshop reprints and dispatches priority free of charge.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-black shrink-0">
              <RefreshCw size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                24-48 Hour Print & Cure Speed
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                In-house fleet of 12K & 8K photopolymer resin systems operating with continuous active thermal monitoring.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span
              className="text-base font-bold uppercase tracking-widest text-black block mb-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              SM Studios
            </span>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-3">
              Precision 3D Studio
            </span>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs">
              Specialized 3D printing studio dedicated to sacred god idols for home mandirs & vehicle dashboards, custom image-to-3D printing, and fine photopolymer art collectibles.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-black mb-3 flex items-center gap-1.5">
              <Heart size={12} className="text-amber-500 fill-amber-500" />
              Sacred God Idols
            </h5>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>
                <a href="#storefront-catalog" className="hover:text-black transition-colors">
                  Lord Venkateswara (Balaji)
                </a>
              </li>
              <li>
                <a href="#storefront-catalog" className="hover:text-black transition-colors">
                  Bal Ganesha with Shivling
                </a>
              </li>
              <li>
                <a href="#storefront-catalog" className="hover:text-black transition-colors">
                  Goddess Mahalakshmi
                </a>
              </li>
              <li>
                <a href="#storefront-catalog" className="hover:text-black transition-colors">
                  Bal Krishna with Flute
                </a>
              </li>
              <li>
                <a href="#storefront-catalog" className="hover:text-black transition-colors">
                  Car Dashboard Murtis (75mm)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-black mb-3 flex items-center gap-1.5">
              <Box size={13} className="text-gray-700" />
              Art & Figurines
            </h5>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>
                <a href="#storefront-catalog" className="hover:text-black transition-colors">
                  Divine Heritage Figurines
                </a>
              </li>
              <li>
                <a href="#storefront-catalog" className="hover:text-black transition-colors">
                  High-Detail SLA Sculptures
                </a>
              </li>
              <li>
                <a href="#custom-service" className="hover:text-black transition-colors">
                  Custom 3D Conversions
                </a>
              </li>
              <li>
                <a href="#storefront-catalog" className="hover:text-black transition-colors">
                  8K Photopolymer Collectibles
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-black mb-3 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              Custom 3D Printing
            </h5>
            <p className="text-xs text-gray-600 mb-2">
              Have an STL file or need a custom CAD commission?
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-900 font-mono mb-3">
              <Mail size={12} className="text-black" />
              <span>orders@smstudios3d.com</span>
            </div>
            <a
              href="#custom-service"
              className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors"
            >
              Upload 3D File →
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} SM Studios 3D Print Studio. Dedicated to sacred craftsmanship & gamer gear.</p>
          <div className="flex items-center gap-4">
            {onOpenTrackOrder && (
              <button
                type="button"
                onClick={onOpenTrackOrder}
                className="text-gray-700 hover:text-black font-medium transition-colors cursor-pointer"
              >
                Track Order
              </button>
            )}
            <span>Slicing & Materials Guide</span>
            <span>Pan-India Express Shipping</span>
            <a
              href="/admin"
              onClick={(e) => {
                if (onNavigateAdmin) {
                  e.preventDefault();
                  onNavigateAdmin();
                }
              }}
              className="text-gray-400 hover:text-black transition-colors"
              title="Store Owner Portal"
            >
              Owner Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
