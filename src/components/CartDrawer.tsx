import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { CartItem, Product } from '../types';
import { formatINR } from '../utils';
import { getCanonicalProduct, getCartItemPrice, getCartItemName, getCartItemImage, calculateCartSubtotal, PRODUCTS } from '../data';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products?: Product[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  products = PRODUCTS,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Single authoritative subtotal calculation derived directly from canonical products
  const subtotal = calculateCartSubtotal(cart, products);
  const discount = (subtotal * discountPercent) / 100;
  const freeShippingThreshold = 999;
  const shipping = subtotal > 0 && subtotal - discount >= freeShippingThreshold ? 0 : subtotal > 0 ? 99 : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoInput.trim().toUpperCase();
    if (clean === 'TOON3D' || clean === 'RESIN10') {
      setDiscountPercent(10);
      setPromoMessage('10% 3D Studio Promo applied!');
    } else if (clean === 'COLLECTOR20' && subtotal >= 2500) {
      setDiscountPercent(20);
      setPromoMessage('20% Collector Tier discount applied!');
    } else {
      setPromoMessage('Invalid promo code. Try "TOON3D"');
    }
  };

  return (
    <div
      id="cart-drawer-backdrop"
      className="fixed inset-0 z-70 bg-black/40 backdrop-blur-xs flex justify-end transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        id="cart-drawer-panel"
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-gray-950 border-l border-gray-200"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-black" />
            <h2 className="text-base font-bold tracking-wider uppercase text-black">
              3D Print Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {subtotal > 0 && (
          <div className="px-6 py-2.5 bg-gray-100/70 border-b border-gray-200 text-xs flex items-center justify-between">
            {subtotal >= freeShippingThreshold ? (
              <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                ✓ Free Pan-India Shockproof Shipping unlocked!
              </span>
            ) : (
              <span className="text-gray-600">
                Add{' '}
                <strong className="text-black font-bold">
                  {formatINR(freeShippingThreshold - subtotal)}
                </strong>{' '}
                more for free priority shipping
              </span>
            )}
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-600">Your 3D print cart is empty.</p>
              <p className="text-xs text-gray-400">
                Select a figurine from the catalog or upload an image for custom 3D printing!
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const canonical = getCanonicalProduct(products, item.figurineId || item.id);
              const authoritativePrice = canonical ? canonical.price : item.price;
              const authoritativeName = canonical ? canonical.name : item.name;
              const authoritativeImage = canonical ? (canonical.image || canonical.src) : item.src;

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex gap-3 items-center"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-20 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                    {authoritativeImage ? (
                      <img
                        src={authoritativeImage}
                        alt={authoritativeName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain object-bottom"
                      />
                    ) : (
                      <div className="text-[10px] uppercase font-bold text-gray-700 text-center">
                        Custom 3D
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-black truncate">
                        {authoritativeName}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Finish & Scale tags */}
                    <div className="flex flex-wrap gap-1.5 my-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-200 text-gray-800 font-medium">
                        {item.scale}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-200 text-gray-800 capitalize font-medium">
                        {item.finish.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="px-2 py-1 text-gray-600 hover:text-black hover:bg-gray-100 text-xs cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 py-1 text-xs font-bold text-black min-w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-2 py-1 text-gray-600 hover:text-black hover:bg-gray-100 text-xs cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-black font-mono">
                          {authoritativePrice === 0 ? 'Quote Request' : formatINR(authoritativePrice * item.quantity)}
                        </div>
                        {authoritativePrice > 0 && item.quantity > 1 && (
                          <div className="text-[10px] text-gray-500">
                            {formatINR(authoritativePrice)} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-4">
            {/* Promo code form */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Promo (e.g. TOON3D)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full uppercase bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-black"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-black hover:bg-neutral-800 text-white transition-colors cursor-pointer shrink-0"
              >
                Apply
              </button>
            </form>

            {promoMessage && (
              <p
                className={`text-[11px] font-medium ${
                  discountPercent > 0 ? 'text-emerald-700' : 'text-red-500'
                }`}
              >
                {promoMessage}
              </p>
            )}

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-black font-medium font-mono">
                  {formatINR(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-mono">-{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Vault Foam Packaging & Freight</span>
                <span className="text-black font-medium font-mono">
                  {shipping === 0 ? 'FREE' : formatINR(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-black pt-2 border-t border-gray-200">
                <span>Estimated Total</span>
                <span className="text-black font-mono text-lg font-extrabold">
                  {formatINR(total)}
                </span>
              </div>
            </div>

            <button
              id="proceed-checkout-btn"
              onClick={onProceedToCheckout}
              className="w-full py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm bg-black text-white hover:bg-neutral-800 active:scale-[0.99] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
