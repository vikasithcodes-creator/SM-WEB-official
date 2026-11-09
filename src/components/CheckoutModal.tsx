import React, { useState } from 'react';
import { X, CheckCircle, Truck, ShieldCheck, Printer, ArrowRight, Copy, Loader2, AlertCircle } from 'lucide-react';
import { CartItem, Product } from '../types';
import { formatINR, isValidIndianMobile, formatIndianPhoneNumber } from '../utils';
import { useAuth } from '../context/AuthContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products?: Product[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  onOrderCompleted: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  subtotal,
  discount,
  shipping,
  total,
  onOrderCompleted,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    priorityQueue: 'standard', // 'standard' | 'rush'
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<string>('Pending Review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Validates Indian mobile number (10 digits starting with 6-9, optionally prefixed with +91, 91, or 0)
  const validateIndianPhone = (raw: string): { isValid: boolean; error?: string } => {
    if (!raw.trim() || !isValidIndianMobile(raw)) {
      return {
        isValid: false,
        error: 'Please enter a valid mobile number.',
      };
    }
    return { isValid: true };
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setPhoneError(null);

    // Frontend validation for mandatory Mobile Number
    const phoneCheck = validateIndianPhone(formData.phone);
    if (!phoneCheck.isValid) {
      const err = phoneCheck.error || 'Please enter a valid mobile number.';
      setPhoneError(err);
      setSubmitError(err);
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedPhone = formatIndianPhoneNumber(formData.phone);
      const bodyFormData = new FormData();
      bodyFormData.append('customerName', formData.name.trim());
      bodyFormData.append('email', formData.email.trim());
      bodyFormData.append('phone', formattedPhone);
      if (user?.uid) {
        bodyFormData.append('userId', user.uid);
      }
      bodyFormData.append('address', formData.address.trim());
      bodyFormData.append('city', formData.city.trim());
      bodyFormData.append('postalCode', formData.zip.trim());
      bodyFormData.append('priorityQueue', formData.priorityQueue);
      bodyFormData.append('subtotal', String(subtotal));
      bodyFormData.append('discount', String(discount));
      bodyFormData.append('shipping', String(shipping));
      bodyFormData.append('total', String(total));
      bodyFormData.append('quantity', String(cart.reduce((s, i) => s + i.quantity, 0)));

      // Sanitize items with authoritative canonical price and name
      const serializedItems = cart.map((item) => {
        const { rawFile, ...itemData } = item;
        const canonical = products?.find((p) => p.id === (item.figurineId || item.id));
        return {
          ...itemData,
          price: canonical ? canonical.price : item.price,
          name: canonical ? canonical.name : item.name,
          src: canonical ? (canonical.image || canonical.src) : item.src,
        };
      });
      bodyFormData.append('items', JSON.stringify(serializedItems));

      // Check for custom job and attached file
      const customItem = cart.find((i) => i.isCustomJob || i.rawFile);
      if (customItem) {
        bodyFormData.append('hasCustomJob', 'true');
        if (customItem.rawFile instanceof File) {
          bodyFormData.append('uploadedFile', customItem.rawFile);
        }
        if (customItem.customDetails?.customEngraving) {
          bodyFormData.append('notes', customItem.customDetails.customEngraving);
        }
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: bodyFormData,
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received from /api/orders:', text);
        throw new Error(
          `Server returned an unexpected response (Status ${response.status}). Please try again.`
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to schedule print order');
      }

      setOrderId(data.order.trackingId);
      setOrderStatus(data.order.status);
      setStep('success');
      onOrderCompleted();
    } catch (err: any) {
      console.error('Order creation error:', err);
      setSubmitError(err?.message || 'Failed to submit order. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderId = () => {
    navigator.clipboard?.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="checkout-modal-backdrop"
      className="fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
    >
      <div
        id="checkout-modal-card"
        className="relative w-full max-w-xl bg-white text-[#111111] border border-[#E5E5E5] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header: Solid Black with White Text */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4.5 bg-[#0A0A0A] text-white border-b border-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
              <Printer className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-wider uppercase text-white leading-none">
                {step === 'details' ? '3D Print Dispatch Order' : 'Order Confirmed'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 hidden sm:block">
                Precision Resin Manufacturing Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close checkout modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body: Clean White with Black Typography */}
        <div
          className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-white"
          style={{ scrollbarColor: '#888888 #F5F5F5' }}
        >
          {step === 'details' ? (
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {/* Cart Summary Box */}
              <div className="p-4 bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#666666] font-medium">Cart Items:</span>{' '}
                  <span className="font-bold text-[#111111] ml-1">
                    {cart.reduce((s, i) => s + i.quantity, 0)} items
                  </span>
                </div>
                <div>
                  <span className="text-[#666666] font-medium">Total Due:</span>{' '}
                  <span className="font-bold text-black font-mono text-base ml-1">
                    {formatINR(total)}
                  </span>
                </div>
              </div>

              {/* 1. Shipping Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-3">
                  1. Shipping & Delivery Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#222222] uppercase mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#222222] uppercase mb-1.5">
                      Email (for Print Status Tracking)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#222222] uppercase mb-1.5 flex items-center justify-between">
                      <span>
                        MOBILE NUMBER <span className="text-red-500 font-bold">*</span>
                      </span>
                      <span className="text-[10px] text-[#666666] normal-case font-normal">
                        10-digit Indian mobile or +91
                      </span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210 or +91 9876543210"
                      value={formData.phone}
                      onChange={(e) => {
                        setPhoneError(null);
                        setSubmitError(null);
                        setFormData({ ...formData, phone: e.target.value });
                      }}
                      onBlur={() => {
                        if (formData.phone) {
                          const check = validateIndianPhone(formData.phone);
                          if (!check.isValid) {
                            setPhoneError(check.error || 'Please enter a valid mobile number.');
                          }
                        }
                      }}
                      className={`w-full bg-white border ${
                        phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-[#D1D5DB]'
                      } rounded-xl px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors`}
                    />
                    {phoneError ? (
                      <p className="mt-1 text-xs text-red-600 font-medium">{phoneError}</p>
                    ) : (
                      <p className="mt-1 text-[10px] text-[#666666]">
                        Enter 10-digit mobile number (e.g. 9876543210 or +91 9876543210).
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#222222] uppercase mb-1.5">
                      Street Address
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your street address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#222222] uppercase mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#222222] uppercase mb-1.5">
                      Postal / ZIP Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter postal / ZIP code"
                      value={formData.zip}
                      onChange={(e) =>
                        setFormData({ ...formData, zip: e.target.value })
                      }
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Print Queue Speed */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-3">
                  2. 3D Print Queue Priority
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex flex-col p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      formData.priorityQueue === 'standard'
                        ? 'border-black bg-[#F5F5F5] ring-1 ring-black'
                        : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-black">Standard</span>
                      <input
                        type="radio"
                        name="queue"
                        checked={formData.priorityQueue === 'standard'}
                        onChange={() =>
                          setFormData({ ...formData, priorityQueue: 'standard' })
                        }
                        className="accent-black"
                      />
                    </div>
                    <span className="text-[11px] text-[#666666]">
                      Printed & UV cured in 48-72h
                    </span>
                    <span className="text-[11px] font-bold text-black mt-1">
                      Included Free
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      formData.priorityQueue === 'rush'
                        ? 'border-black bg-[#F5F5F5] ring-1 ring-black'
                        : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-black">Rush Priority</span>
                      <input
                        type="radio"
                        name="queue"
                        checked={formData.priorityQueue === 'rush'}
                        onChange={() =>
                          setFormData({ ...formData, priorityQueue: 'rush' })
                        }
                        className="accent-black"
                      />
                    </div>
                    <span className="text-[11px] text-[#666666]">
                      Top of print bed within 12h
                    </span>
                    <span className="text-[11px] font-bold text-black mt-1">
                      + ₹250 Express
                    </span>
                  </label>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="flex items-center gap-3.5 p-3.5 bg-[#F5F5F5] rounded-2xl border border-[#E5E5E5] text-xs text-[#333333]">
                <ShieldCheck className="w-5 h-5 text-black shrink-0" />
                <span className="leading-relaxed">
                  <strong className="text-black">100% Zero-Break Guarantee:</strong> Laser-cut foam packaging protects every delicate resin limb. Free replacement if damaged in transit.
                </span>
              </div>

              {/* Validation / Submission Error */}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Primary Action Button: Solid Black with White Text */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs bg-black text-white hover:bg-[#1A1A1A] disabled:opacity-60 active:scale-[0.99] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-white" />
                    <span>Scheduling Print Job...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize & Send to Print Bed</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Confirmation Step: Clean White & Black */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle size={32} />
              </div>

              <div>
                <h3 className="text-xl font-bold uppercase tracking-wider text-black">
                  3D Print Order Scheduled!
                </h3>
                <p className="text-xs text-[#666666] mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Your figurine files have been queued to our industrial 8K photopolymer resin printers.
                </p>
              </div>

              {/* Order ID Box */}
              <div className="p-4 bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl max-w-sm mx-auto flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider text-[#666666] font-bold">
                    Order Tracking ID
                  </div>
                  <div className="text-sm font-mono font-bold text-black tracking-widest mt-0.5">
                    {orderId}
                  </div>
                  <div className="text-[11px] font-semibold text-[#111111] mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    <span>Status: {orderStatus}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-xs font-semibold text-black border border-[#D1D5DB] transition-colors cursor-pointer shadow-2xs"
                >
                  <Copy size={12} />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Printing Progress Timeline */}
              <div className="p-4 bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl text-left space-y-3 max-w-md mx-auto">
                <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <Truck size={14} className="text-black" />
                  <span>Estimated Schedule</span>
                </div>
                <ul className="text-xs text-[#444444] space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                    <span><strong className="text-black">Today:</strong> Slicing, support generation & resin vat prep</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neutral-600 shrink-0" />
                    <span><strong className="text-black">Next 24h:</strong> 8K Light-cure cycle + 2-stage alcohol wash</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
                    <span><strong className="text-black">Day 3:</strong> Final UV post-cure, foam packaging & tracking email</span>
                  </li>
                </ul>
              </div>

              {/* Secondary/Primary Return Button: Solid Black */}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer shadow-xs"
              >
                Return to Storefront
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
