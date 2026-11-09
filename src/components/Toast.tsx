import React from 'react';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onOpenCart: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onOpenCart }) => {
  if (!message) return null;

  return (
    <div
      id="store-toast"
      className="fixed bottom-6 right-6 z-70 max-w-sm flex items-center justify-between gap-3 px-4 py-3 bg-[#181A20] text-white border border-white/20 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200"
      style={{
        boxShadow: '0 20px 30px -10px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="text-xs sm:text-sm font-medium text-white/95">{message}</p>
      </div>
      <button
        onClick={onOpenCart}
        className="shrink-0 flex items-center gap-1 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-md transition-colors duration-150 cursor-pointer"
      >
        <ShoppingBag size={12} />
        View Cart
      </button>
    </div>
  );
};
