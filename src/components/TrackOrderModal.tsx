import React, { useState } from 'react';
import {
  Search,
  X,
  Package,
  Calendar,
  User,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ArrowLeft,
  Clock,
  Truck,
  Box,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatINR, buildCustomerConfirmWhatsAppUrl } from '../utils';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingId?: string;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  initialTrackingId = '',
}) => {
  const [trackingId, setTrackingId] = useState(initialTrackingId);
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTrackingId = trackingId.trim().toUpperCase();
    const cleanPhone = phone.trim();

    if (!cleanTrackingId) {
      setError('Please enter your Order Tracking ID.');
      return;
    }

    if (!cleanPhone) {
      setError('Please enter your WhatsApp number.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setConfirmError(null);
    setConfirmSuccess(null);

    try {
      const res = await fetch(
        `/api/orders/track/${encodeURIComponent(cleanTrackingId)}?phone=${encodeURIComponent(cleanPhone)}`
      );

      if (res.status === 404 || res.status === 400) {
        setError('Order not found. Please check your Tracking ID and WhatsApp number.');
        setOrder(null);
        return;
      }

      if (!res.ok) {
        setError('Unable to retrieve your order right now. Please try again.');
        setOrder(null);
        return;
      }

      const data = await res.json();
      if (!data || !data.success || !data.order) {
        setError('Order not found. Please check your Tracking ID and WhatsApp number.');
        setOrder(null);
        return;
      }

      setOrder(data.order);
    } catch {
      setError('Unable to retrieve your order right now. Please try again.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!order || isConfirming) return;
    setIsConfirming(true);
    setConfirmError(null);
    setConfirmSuccess(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(order.trackingId)}/confirm`, {
        method: 'POST',
      });
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      }
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Could not confirm order. Please try again.');
      }
      setOrder(data.order);
      setConfirmSuccess('Order confirmed! We have placed this into the production schedule.');
    } catch {
      setConfirmError('Could not confirm order. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const getOrderProductName = (orderRecord: any): string => {
    if (!orderRecord) return 'Custom 3D Print';
    if (Array.isArray(orderRecord.items) && orderRecord.items.length > 0) {
      const names = orderRecord.items.map((i: any) => i.name).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    if (orderRecord.uploadedFileName) {
      return orderRecord.uploadedFileName;
    }
    if (orderRecord.orderType) {
      return orderRecord.orderType;
    }
    return 'Custom 3D Print';
  };

  const handleResetSearch = () => {
    setOrder(null);
    setError(null);
    setConfirmError(null);
    setConfirmSuccess(null);
  };

  const formatOrderDate = (isoString?: string): string => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Restrained semantic status badges
  const getStatusBadgeStyle = (rawStatus: string): string => {
    const status = (rawStatus || '').toLowerCase();
    if (status.includes('cancel')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (status.includes('complete') || status.includes('deliver')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
    }
    if (status.includes('ship')) {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    if (status.includes('production') || status.includes('printing')) {
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
    if (status.includes('confirm')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (status.includes('quotesent') || (status.includes('quote') && status.includes('sent'))) {
      return 'bg-slate-100 text-slate-800 border-slate-300 font-semibold';
    }
    if (status.includes('pending') || status.includes('quote') || status.includes('review')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTimelineIcon = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete') || s.includes('deliver')) return <CheckCircle size={13} className="text-emerald-700" />;
    if (s.includes('ship')) return <Truck size={13} className="text-sky-700" />;
    if (s.includes('production')) return <Layers size={13} className="text-indigo-700" />;
    if (s.includes('confirm')) return <CheckCircle2 size={13} className="text-emerald-700" />;
    if (s.includes('cancel')) return <XCircle size={13} className="text-red-700" />;
    return <Clock size={13} className="text-gray-700" />;
  };

  return (
    <div
      id="track-order-modal-backdrop"
      className="fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
    >
      <div
        id="track-order-modal-card"
        className="relative w-full max-w-xl bg-[#FAFAFA] text-gray-950 border border-[#E5E5E5] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Modal Header: Strictly Black + White */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4.5 bg-black text-white border-b border-black">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
              <Package size={17} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-wider uppercase text-white leading-none">
                TRACK YOUR ORDER
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 hidden sm:block">
                Precision 3D Print Dispatch Tracking
              </p>
            </div>
          </div>
          <button
            id="close-track-modal-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="Close tracking modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="p-4 sm:p-6 overflow-y-auto space-y-4"
          style={{ scrollbarColor: '#999999 #F2F2F2' }}
        >
          {/* Tracking Search Form (Shown when no order active or searching) */}
          {!order ? (
            <div className="space-y-4 bg-white p-5 sm:p-6 border border-[#E5E5E5] rounded-2xl shadow-xs">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-black tracking-tight">
                  Track Your Order
                </h4>
                <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                  Enter your Order Tracking ID and WhatsApp number to check your order status.
                </p>
              </div>

              <form onSubmit={handleTrack} className="space-y-4 pt-1">
                {/* FIELD 1: Order Tracking ID */}
                <div>
                  <label
                    htmlFor="track-order-id-input"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1.5"
                  >
                    ORDER TRACKING ID
                  </label>
                  <input
                    id="track-order-id-input"
                    type="text"
                    value={trackingId}
                    onChange={(e) => {
                      setTrackingId(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="TH-3D-555512"
                    className="w-full bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl px-3.5 py-2.5 text-sm font-mono text-black placeholder:text-[#888888] focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                {/* FIELD 2: WhatsApp / Mobile Number */}
                <div>
                  <label
                    htmlFor="track-phone-input"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1.5"
                  >
                    WHATSAPP / MOBILE NUMBER
                  </label>
                  <input
                    id="track-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your WhatsApp number"
                    className="w-full bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl px-3.5 py-2.5 text-sm text-black placeholder:text-[#888888] focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                {/* Error State Banner */}
                {error && (
                  <div
                    id="track-order-error-banner"
                    className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 animate-in fade-in"
                  >
                    <AlertCircle size={16} className="shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button: Solid Black with White Text */}
                <button
                  id="submit-track-order-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-xs bg-black text-white hover:bg-[#1A1A1A] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-white" />
                      <span>Verifying Order...</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>TRACK ORDER</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-1 text-center">
                <span className="text-[11px] text-[#888888]">
                  No login required. Your tracking ID was provided upon checkout.
                </span>
              </div>
            </div>
          ) : (
            /* ================================================================ */
            /* TRACKING RESULT UI: UNIFIED ORDER INFORMATION CONTAINER          */
            /* ================================================================ */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Back to Search Action & Status Badge */}
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-black transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Track another order</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#888888]">
                    Live Status:
                  </span>
                  <span
                    id="track-order-status-badge"
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* SINGLE UNIFIED ORDER INFORMATION CONTAINER */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xs p-4 sm:p-6 space-y-5">
                {/* 1. ORDER INFORMATION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Package size={14} className="text-black" />
                      <span>ORDER INFORMATION</span>
                    </h4>
                    <span className="text-[11px] font-mono font-bold text-black tracking-wider">
                      {order.trackingId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-0.5">
                    <div>
                      <span className="text-[#666666] block text-[11px]">Order Tracking ID:</span>
                      <strong className="text-black font-mono text-sm tracking-wide font-bold">
                        {order.trackingId}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[#666666] block text-[11px]">Order Date:</span>
                      <strong className="text-black flex items-center gap-1.5 mt-0.5">
                        <Calendar size={12} className="text-[#888888]" />
                        <span>{formatOrderDate(order.createdAt)}</span>
                      </strong>
                    </div>

                    <div>
                      <span className="text-[#666666] block text-[11px]">Customer Name:</span>
                      <strong className="text-black flex items-center gap-1.5 mt-0.5">
                        <User size={12} className="text-[#888888]" />
                        <span>{order.customerName}</span>
                      </strong>
                    </div>

                    <div>
                      <span className="text-[#666666] block text-[11px]">Order Type:</span>
                      <strong className="text-black flex items-center gap-1.5 mt-0.5">
                        <Layers size={12} className="text-[#888888]" />
                        <span>{order.orderType || 'Precision 3D Print'}</span>
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Subtle Horizontal Divider */}
                <div className="border-t border-[#E5E5E5]" />

                {/* 2. ORDERED ITEMS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Box size={14} className="text-black" />
                      <span>ORDERED ITEMS</span>
                    </h4>
                    <span className="text-[11px] text-[#666666]">
                      {order.items?.length || 1} item(s)
                    </span>
                  </div>

                  {order.items && order.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[320px]">
                        <thead>
                          <tr className="border-b border-[#E5E5E5] text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                            <th className="pb-2">Product</th>
                            <th className="pb-2">Scale</th>
                            <th className="pb-2">Colour / Finish</th>
                            <th className="pb-2 text-center">Qty</th>
                            <th className="pb-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E5]">
                          {order.items.map((item: any, idx: number) => (
                            <tr key={idx} className="text-black">
                              <td className="py-2.5 pr-2 font-bold text-black">
                                {item.name}
                              </td>
                              <td className="py-2.5 px-2 text-[#666666]">
                                {item.scale || 'Default'}
                              </td>
                              <td className="py-2.5 px-2 text-[#666666]">
                                {item.finish || order.colour || 'Standard'}
                              </td>
                              <td className="py-2.5 px-2 text-center text-black font-mono">
                                {item.quantity || 1}
                              </td>
                              <td className="py-2.5 pl-2 text-right font-mono font-bold text-black">
                                {item.price > 0
                                  ? formatINR(item.price * (item.quantity || 1))
                                  : order.quoteAmount != null
                                  ? formatINR(order.quoteAmount)
                                  : 'Quote Pending'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Custom single item / STL print display */
                    <div className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-black font-bold block">
                          {order.uploadedFileName || order.orderType || 'Custom 3D Commission'}
                        </strong>
                        <span className="text-[#666666] text-[11px]">
                          Colour / Finish: {order.colour || 'Standard'} • Scale: Custom Specs
                        </span>
                      </div>
                      <span className="font-mono font-bold text-black text-sm">
                        {order.quoteAmount != null
                          ? formatINR(order.quoteAmount)
                          : order.total > 0
                          ? formatINR(order.total)
                          : 'Quote Pending'}
                      </span>
                    </div>
                  )}

                  {/* Price / Quote Summary Line */}
                  <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-xs">
                    <span className="text-[#666666] font-medium">Order Total / Quote:</span>
                    <span className="text-sm font-bold font-mono text-black">
                      {order.quoteAmount != null
                        ? formatINR(order.quoteAmount)
                        : order.total > 0
                        ? formatINR(order.total)
                        : 'Under Review by Studio'}
                    </span>
                  </div>

                  {/* Quote in Progress Notice (When Status is 'Pending Quote') */}
                  {order.status === 'Pending Quote' && (
                    <div className="p-3 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-black">
                          QUOTE IN PROGRESS
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Quote
                        </span>
                      </div>
                      <p className="text-[11px] text-[#666666] leading-relaxed">
                        Your 3D print request is currently being reviewed by our specialists to determine optimal slicing parameters and material requirements. You will receive your quote here and on WhatsApp shortly.
                      </p>
                    </div>
                  )}

                  {/* Quote Received & Actions (When Status is 'Quote Sent') */}
                  {order.quoteAmount != null && order.status === 'Quote Sent' && (
                    <div className="p-4 bg-[#F7F7F7] border border-black rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666] block">
                            QUOTE RECEIVED
                          </span>
                          <span className="text-xl font-bold font-mono text-black">
                            ₹{order.quoteAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                          Quote Sent
                        </span>
                      </div>

                      <p className="text-xs text-[#666666] leading-relaxed">
                        Our 3D print technicians have reviewed your model and specifications. Please confirm your order to begin print production.
                      </p>

                      {confirmError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                          {confirmError}
                        </div>
                      )}

                      {confirmSuccess && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                          {confirmSuccess}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={isConfirming}
                          onClick={handleConfirmOrder}
                          className="flex-1 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-black hover:bg-[#1A1A1A] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                        >
                          {isConfirming ? (
                            <RefreshCw size={14} className="animate-spin text-white" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          <span>CONFIRM ORDER</span>
                        </button>

                        <a
                          id="confirm-whatsapp-btn"
                          href={buildCustomerConfirmWhatsAppUrl({
                            trackingId: order.trackingId,
                            orderName: getOrderProductName(order),
                            quoteAmount: order.quoteAmount != null ? order.quoteAmount : order.total,
                            customerName: order.customerName,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 no-underline"
                        >
                          <MessageSquare size={14} />
                          <span>CONFIRM ON WHATSAPP</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtle Horizontal Divider */}
                <div className="border-t border-[#E5E5E5]" />

                {/* 3. ORDER ACTIVITY */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Clock size={14} className="text-black" />
                      <span>ORDER ACTIVITY</span>
                    </h4>
                    <span className="text-[10px] text-[#888888]">Chronological Updates</span>
                  </div>

                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E5E5] pt-1">
                      {order.statusHistory.map((step: any, idx: number) => (
                        <div key={idx} className="relative flex items-start gap-3 pl-1 text-xs">
                          <div className="relative z-10 w-5 h-5 rounded-full bg-white border border-[#CCCCCC] flex items-center justify-center shrink-0">
                            {getTimelineIcon(step.status)}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <strong className="text-black text-xs font-bold">
                                {step.status}
                              </strong>
                              <span className="text-[10px] text-[#888888] font-mono">
                                {formatOrderDate(step.timestamp)}
                              </span>
                            </div>
                            {step.note && (
                              <p className="text-[11px] text-[#666666] mt-0.5 leading-relaxed">
                                {step.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-2 text-xs text-[#888888] text-center">
                      No status activity recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
