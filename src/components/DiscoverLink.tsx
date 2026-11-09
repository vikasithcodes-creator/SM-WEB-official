import React from 'react';
import { ArrowRight } from 'lucide-react';

interface DiscoverLinkProps {
  className?: string;
}

export const DiscoverLink: React.FC<DiscoverLinkProps> = ({ className }) => {
  return (
    <a
      id="discover-link"
      href="#storefront-catalog"
      className={`group flex items-center justify-center sm:justify-start gap-2 sm:gap-3 uppercase no-underline cursor-pointer select-none text-white transition-all duration-200 bg-black/50 backdrop-blur-md px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-2xl border border-white/20 shadow-2xl hover:bg-black/65 hover:scale-103 active:scale-95 ${
        className || 'relative'
      }`}
      style={{
        zIndex: 30,
        fontFamily: "'Anton', sans-serif",
        fontSize: 'clamp(18px, 2.5vw, 32px)',
        fontWeight: 400,
        color: '#ffffff',
        letterSpacing: '0.02em',
        lineHeight: 1,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)',
      }}
    >
      <span>DISCOVER IT</span>
      <ArrowRight
        className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:translate-x-1"
        strokeWidth={2.5}
      />
    </a>
  );
};
