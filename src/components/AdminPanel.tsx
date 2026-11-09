import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  LogOut,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Eye,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  FileText,
  ImageIcon,
  Box,
  Truck,
  Send,
  X,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Printer,
  MessageSquare,
} from 'lucide-react';
import { formatINR, buildAdminQuoteWhatsAppUrl, formatIndianPhoneNumber } from '../utils';
import { useAuth } from '../context/AuthContext';

export type CanonicalOrderStatus =
  | 'Pending Quote'
  | 'Quote Sent'
  | 'Confirmed'
  | 'In Production'
  | 'Shipped'
  | 'Completed'
  | 'Cancelled';

export type OrderStatus =
  | CanonicalOrderStatus
  | 'Pending Review'
  | 'Quote Updated'
  | 'Quote Accepted'
  | 'Payment Pending'
  | 'Ready to Ship';

export const CANONICAL_STATUSES: CanonicalOrderStatus[] = [
  'Pending Quote',
  'Quote Sent',
  'Confirmed',
  'In Production',
  'Shipped',
  'Completed',
  'Cancelled',
];

export function normalizeOrderStatus(raw: string | undefined | null): CanonicalOrderStatus {
  if (!raw) return 'Pending Quote';
  const clean = raw.trim().toLowerCase().replace(/[\s\-_]+/g, '');
  if (clean.includes('cancel')) return 'Cancelled';
  if (clean.includes('complete') || clean.includes('deliver')) return 'Completed';
  if (clean.includes('ship')) return 'Shipped';
  if (clean.includes('production') || clean.includes('printing') || clean.includes('queue')) return 'In Production';
  if (clean.includes('confirm')) return 'Confirmed';
  if (clean.includes('quotesent') || (clean.includes('quote') && clean.includes('sent'))) return 'Quote Sent';
  if (clean.includes('pending') || clean.includes('quote') || clean.includes('review')) return 'Pending Quote';
  return 'Pending Quote';
}

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  finish?: string;
  scale?: string;
  isCustomJob?: boolean;
  customDetails?: {
    fileName?: string;
    tech?: string;
    infill?: number;
    material?: string;
    dimensions?: string;
    customEngraving?: string;
  };
}

export interface OrderRecord {
  id: string;
  trackingId: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  priorityQueue: 'standard' | 'rush';
  orderType: 'Image to 3D Print' | 'Direct STL Print' | 'Standard Figurine' | 'Mixed Order';
  hasCustomJob: boolean;
  uploadedFile?: string;
  uploadedFileUrl?: string;
  uploadedFileName?: string;
  uploadedFileType?: string;
  uploadedFileSize?: number;
  colour?: string;
  notes?: string;
  quantity: number;
  quoteAmount?: number | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
}

interface OrderSummary {
  total: number;
  pendingQuotes: number;
  confirmed: number;
  inProduction: number;
  shipped: number;
  completed: number;
  cancelled: number;
}

const ALL_STATUSES = CANONICAL_STATUSES;

interface AdminPanelProps {
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExitAdmin }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('sm_admin_token');
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [summary, setSummary] = useState<OrderSummary>({
    total: 0,
    pendingQuotes: 0,
    confirmed: 0,
    inProduction: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<CanonicalOrderStatus>('Confirmed');
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null);
  const [quoteInput, setQuoteInput] = useState('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Delete Confirmation State
  const [orderToDelete, setOrderToDelete] = useState<OrderRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync selectedStatus whenever selectedOrder changes
  useEffect(() => {
    if (selectedOrder) {
      setSelectedStatus(normalizeOrderStatus(selectedOrder.status));
      setStatusSuccessMsg(null);
    }
  }, [selectedOrder?.id, selectedOrder?.status]);

  // Fetch orders
  const fetchOrders = useCallback(async (authToken: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm.trim()) queryParams.set('search', searchTerm.trim());
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (typeFilter !== 'all') queryParams.set('orderType', typeFilter);
      queryParams.set('sort', sortOrder);

      const res = await fetch(`/api/admin/orders?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.status === 401) {
        // Token expired
        sessionStorage.removeItem('sm_admin_token');
        setToken(null);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load orders');
      }

      setOrders(data.orders || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Error communicating with order database');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, sortOrder]);

  // Initial session or Firebase Admin check
  const { user, isAdmin, getIdToken, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (token) {
      fetchOrders(token);
    } else if (user && isAdmin) {
      getIdToken().then((idToken) => {
        if (idToken) {
          sessionStorage.setItem('sm_admin_token', idToken);
          setToken(idToken);
        }
      });
    }
  }, [token, user, isAdmin, getIdToken, fetchOrders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid password credentials');
      }

      sessionStorage.setItem('sm_admin_token', data.token);
      setToken(data.token);
      setPassword('');
    } catch (err: any) {
      setLoginError(err?.message || 'Failed to log in as admin');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    sessionStorage.removeItem('sm_admin_token');
    setToken(null);
    setSelectedOrder(null);
  };

  const safeParseJson = async (res: Response): Promise<{ ok: boolean; data: any; errorMessage: string }> => {
    const contentType = res.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    }

    if (!res.ok || (data && data.success === false)) {
      const errorMsg =
        data?.error ||
        data?.message ||
        (res.status === 404 ? 'Resource not found' : `Server error (HTTP ${res.status})`);
      return { ok: false, data, errorMessage: errorMsg };
    }

    return { ok: true, data, errorMessage: '' };
  };

  const handleSaveStatus = async (orderId: string, newStatus: CanonicalOrderStatus) => {
    if (!token || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setStatusSuccessMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const parsed = await safeParseJson(res);
      if (!parsed.ok) {
        throw new Error(parsed.errorMessage || 'Could not update status. Please try again.');
      }

      const updated = parsed.data.order;
      setSelectedOrder(updated);
      setSelectedStatus(normalizeOrderStatus(updated.status));
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (parsed.data.summary) {
        setSummary(parsed.data.summary);
      }
      setStatusSuccessMsg('Order status updated successfully.');
      setActionSuccessMsg(`Order status updated to "${newStatus}"`);
      setTimeout(() => {
        setStatusSuccessMsg(null);
        setActionSuccessMsg(null);
      }, 4000);
      fetchOrders(token);
    } catch (err: any) {
      alert(err?.message || 'Could not update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateStatus = handleSaveStatus;

  const handleSendQuote = async (orderId: string) => {
    if (!token || isSendingQuote) return;
    const amount = parseFloat(quoteInput);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive quote amount (₹)');
      return;
    }

    setIsSendingQuote(true);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/quote`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quoteAmount: amount }),
      });

      const parsed = await safeParseJson(res);
      if (!parsed.ok) {
        throw new Error(parsed.errorMessage || 'Could not save quote. Please try again.');
      }

      const updated = parsed.data.order;
      setSelectedOrder(updated);
      setSelectedStatus(normalizeOrderStatus(updated.status));
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (parsed.data.summary) {
        setSummary(parsed.data.summary);
      }
      setQuoteInput(String(amount));
      setActionSuccessMsg(`Quote of ₹${amount.toLocaleString('en-IN')} saved! Status set to "Quote Sent".`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchOrders(token);
    } catch (err: any) {
      alert(err?.message || 'Could not save quote. Please try again.');
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!token || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const parsed = await safeParseJson(res);
      if (!parsed.ok) {
        throw new Error(parsed.errorMessage || 'Could not delete order. Please try again.');
      }

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (parsed.data?.summary) {
        setSummary(parsed.data.summary);
      }
      setOrderToDelete(null);
      setActionSuccessMsg('Order permanently deleted.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      fetchOrders(token);
    } catch (err: any) {
      setDeleteError(err?.message || 'Could not delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadFile = (orderId: string) => {
    if (!token) return;
    window.open(`/api/admin/orders/${orderId}/download-file?token=${encodeURIComponent(token)}`, '_blank');
    // Direct link with authorization header via fetch
    fetch(`/api/admin/orders/${orderId}/download-file`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('File download failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedOrder?.uploadedFileName || 'customer_model_file';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => alert(err?.message || 'Error downloading file'));
  };

  const getStatusBadge = (rawStatus: string) => {
    const status = normalizeOrderStatus(rawStatus);
    switch (status) {
      case 'Pending Quote':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Quote Sent':
        return 'bg-sky-100 text-sky-950 border-sky-300 font-bold';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'In Production':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Shipped':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'Completed':
        return 'bg-emerald-200 text-emerald-950 border-emerald-400 font-bold';
      case 'Cancelled':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Format date helper
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  // =========================================================================
  // VIEW: AUTHENTICATION SCREEN
  // =========================================================================
  if (!token) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Lock size={22} />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black"
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              SM STUDIOS
            </h1>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Admin Portal Authentication
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter store owner password"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                setLoginError(null);
                try {
                  await signInWithGoogle();
                } catch (err: any) {
                  setLoginError(err?.message || 'Google admin sign-in failed');
                }
              }}
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs border border-gray-300 hover:bg-gray-50 text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs mb-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with Admin Google Account</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-gray-200" />
              <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-gray-400 tracking-widest absolute">
                or password
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Access with Store Password</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Store owner security lock</span>
            <button
              type="button"
              onClick={onExitAdmin}
              className="font-medium text-black hover:underline cursor-pointer"
            >
              ← Back to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-20" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Admin Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-black">
              <Printer size={18} />
            </div>
            <div>
              <h1
                className="text-xl font-bold uppercase tracking-tight text-black leading-none"
                style={{ fontFamily: "'Anton', sans-serif" }}
              >
                SM STUDIOS
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                ADMIN PANEL • PRODUCTION DATABASE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchOrders(token)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer"
              title="Refresh database"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">View Store</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* Summary Metric Cards */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
            {/* TOTAL ORDERS */}
            <div
              onClick={() => setStatusFilter('all')}
              className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-2xs cursor-pointer transition-all hover:border-black ${
                statusFilter === 'all' ? 'ring-2 ring-black border-transparent' : 'border-gray-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                TOTAL ORDERS
              </span>
              <span className="text-2xl sm:text-3xl font-black text-black">
                {summary.total}
              </span>
            </div>

            {/* PENDING QUOTES */}
            <div
              onClick={() => setStatusFilter('Pending Quote')}
              className={`border rounded-2xl p-4 sm:p-5 shadow-2xs bg-amber-50/40 cursor-pointer transition-all hover:border-amber-400 ${
                statusFilter === 'Pending Quote' ? 'ring-2 ring-amber-500 border-transparent' : 'border-amber-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                PENDING QUOTES
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-700">
                {summary.pendingQuotes}
              </span>
            </div>

            {/* CONFIRMED ORDERS */}
            <div
              onClick={() => setStatusFilter('Confirmed')}
              className={`border rounded-2xl p-4 sm:p-5 shadow-2xs bg-blue-50/30 cursor-pointer transition-all hover:border-blue-400 ${
                statusFilter === 'Confirmed' ? 'ring-2 ring-blue-500 border-transparent' : 'border-blue-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block mb-1">
                CONFIRMED ORDERS
              </span>
              <span className="text-2xl sm:text-3xl font-black text-black">
                {summary.confirmed}
              </span>
            </div>

            {/* IN PRODUCTION */}
            <div
              onClick={() => setStatusFilter('In Production')}
              className={`border rounded-2xl p-4 sm:p-5 shadow-2xs bg-purple-50/30 cursor-pointer transition-all hover:border-purple-400 ${
                statusFilter === 'In Production' ? 'ring-2 ring-purple-500 border-transparent' : 'border-purple-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block mb-1">
                IN PRODUCTION
              </span>
              <span className="text-2xl sm:text-3xl font-black text-purple-700">
                {summary.inProduction}
              </span>
            </div>

            {/* SHIPPED */}
            <div
              onClick={() => setStatusFilter('Shipped')}
              className={`border rounded-2xl p-4 sm:p-5 shadow-2xs bg-teal-50/30 cursor-pointer transition-all hover:border-teal-400 ${
                statusFilter === 'Shipped' ? 'ring-2 ring-teal-500 border-transparent' : 'border-teal-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block mb-1">
                SHIPPED
              </span>
              <span className="text-2xl sm:text-3xl font-black text-teal-700">
                {summary.shipped}
              </span>
            </div>

            {/* COMPLETED */}
            <div
              onClick={() => setStatusFilter('Completed')}
              className={`border rounded-2xl p-4 sm:p-5 shadow-2xs bg-emerald-50/30 cursor-pointer transition-all hover:border-emerald-400 ${
                statusFilter === 'Completed' ? 'ring-2 ring-emerald-500 border-transparent' : 'border-emerald-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                COMPLETED
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                {summary.completed}
              </span>
            </div>

            {/* CANCELLED */}
            <div
              onClick={() => setStatusFilter('Cancelled')}
              className={`border rounded-2xl p-4 sm:p-5 shadow-2xs bg-red-50/30 cursor-pointer transition-all hover:border-red-400 ${
                statusFilter === 'Cancelled' ? 'ring-2 ring-red-500 border-transparent' : 'border-red-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block mb-1">
                CANCELLED
              </span>
              <span className="text-2xl sm:text-3xl font-black text-red-700">
                {summary.cancelled}
              </span>
            </div>
          </div>
        </section>

        {/* Search, Filter & Sort Controls */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Order ID, customer name, email..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-black font-semibold focus:outline-none focus:border-black"
              >
                <option value="all">All Statuses</option>
                {CANONICAL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Type Filter */}
            <div className="md:col-span-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-black focus:outline-none focus:border-black"
              >
                <option value="all">All Types</option>
                <option value="Image to 3D Print">Image to 3D</option>
                <option value="Direct STL Print">Direct STL</option>
                <option value="Standard Figurine">Standard Figurine</option>
                <option value="Mixed Order">Mixed Order</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="md:col-span-2">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-black focus:outline-none focus:border-black"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </section>

        {/* Orders Table */}
        <section className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">
              Orders Ledger ({orders.length})
            </h2>
            <span className="text-xs text-gray-500">
              Showing real customer orders from persistent store
            </span>
          </div>

          {fetchError ? (
            <div className="p-8 text-center text-red-600 space-y-2">
              <AlertCircle size={24} className="mx-auto text-red-500" />
              <p className="text-sm font-semibold">{fetchError}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <Package size={36} className="mx-auto text-gray-300" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                No Orders in Database Yet
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Orders created by customers through the storefront or Custom 3D Print section will automatically populate here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    <th className="py-3.5 px-4">ORDER ID</th>
                    <th className="py-3.5 px-4">DATE</th>
                    <th className="py-3.5 px-4">CUSTOMER</th>
                    <th className="py-3.5 px-4">EMAIL</th>
                    <th className="py-3.5 px-4">ORDER TYPE</th>
                    <th className="py-3.5 px-4">FILE</th>
                    <th className="py-3.5 px-4">COLOUR</th>
                    <th className="py-3.5 px-4">QUOTE / PRICE</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {orders.map((order) => {
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        {/* ORDER ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-black whitespace-nowrap">
                          {order.trackingId}
                        </td>

                        {/* DATE */}
                        <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>

                        {/* CUSTOMER */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">{order.customerName}</div>
                          <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                            {order.phone ? (
                              <span>WA: {order.phone}</span>
                            ) : (
                              <span className="text-gray-400">Not provided</span>
                            )}
                          </div>
                        </td>

                        {/* EMAIL */}
                        <td className="py-3.5 px-4 text-gray-500 truncate max-w-[160px]">
                          {order.email}
                        </td>

                        {/* ORDER TYPE */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                              order.orderType === 'Image to 3D Print'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : order.orderType === 'Direct STL Print'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {order.orderType === 'Image to 3D Print' ? (
                              <ImageIcon size={11} />
                            ) : order.orderType === 'Direct STL Print' ? (
                              <Box size={11} />
                            ) : (
                              <Package size={11} />
                            )}
                            <span>{order.orderType}</span>
                          </span>
                        </td>

                        {/* FILE */}
                        <td className="py-3.5 px-4">
                          {order.uploadedFileName ? (
                            <div className="flex items-center gap-1.5 text-gray-700 max-w-[140px] truncate" title={order.uploadedFileName}>
                              <FileText size={13} className="shrink-0 text-gray-400" />
                              <span className="truncate">{order.uploadedFileName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* COLOUR */}
                        <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                          {order.colour || 'Standard'}
                        </td>

                        {/* QUOTE / PRICE */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-semibold">
                          {order.quoteAmount != null ? (
                            <span className="text-black">
                              {formatINR(order.quoteAmount)}
                            </span>
                          ) : order.total > 0 ? (
                            <span className="text-black">{formatINR(order.total)}</span>
                          ) : (
                            <span className="text-amber-700 font-bold">Quote Pending</span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(order);
                                setQuoteInput(order.quoteAmount ? String(order.quoteAmount) : '');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOrderToDelete(order);
                                setDeleteError(null);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[11px] bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ========================================================================= */}
      {/* DETAILED ORDER VIEW MODAL */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl bg-white border border-gray-200 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-gray-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-mono font-bold text-xs">
                  TH
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                    Order Details: {selectedOrder.trackingId}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Placed on {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification alert within modal */}
            {actionSuccessMsg && (
              <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Order Tracking ID Card */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    PERMANENT ORDER TRACKING ID
                  </span>
                  <div className="text-xl font-mono font-bold text-black tracking-wider">
                    {selectedOrder.trackingId}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Current Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Customer & Delivery 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Information */}
                <div className="p-4 border border-gray-200 rounded-2xl space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-700 border-b border-gray-100 pb-2">
                    CUSTOMER INFORMATION
                  </h4>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-gray-500">Full Name:</span>{' '}
                      <strong className="text-black">{selectedOrder.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>{' '}
                      <strong className="text-black">{selectedOrder.email}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Mobile / WhatsApp:</span>{' '}
                      <strong className="text-black">
                        {selectedOrder.phone ? formatIndianPhoneNumber(selectedOrder.phone) : 'Customer phone number not available.'}
                      </strong>
                      {selectedOrder.phone && (
                        <button
                          type="button"
                          onClick={() => {
                            const url = buildAdminQuoteWhatsAppUrl({
                              customerName: selectedOrder.customerName,
                              phone: selectedOrder.phone,
                              trackingId: selectedOrder.trackingId,
                              quoteAmount: selectedOrder.quoteAmount || 0,
                            });
                            if (url) window.open(url, '_blank');
                          }}
                          className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                        >
                          <MessageSquare size={11} />
                          <span>OPEN WHATSAPP</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="p-4 border border-gray-200 rounded-2xl space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-700 border-b border-gray-100 pb-2">
                    DELIVERY INFORMATION
                  </h4>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-gray-500">Street Address:</span>{' '}
                      <strong className="text-black">{selectedOrder.address}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">City / Postal Code:</span>{' '}
                      <strong className="text-black">
                        {selectedOrder.city} {selectedOrder.postalCode}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Queue Priority:</span>{' '}
                      <span
                        className={`font-semibold uppercase px-2 py-0.5 rounded text-[10px] ${
                          selectedOrder.priorityQueue === 'rush'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedOrder.priorityQueue}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Information & Uploaded File */}
              <div className="p-4 border border-gray-200 rounded-2xl space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-700 border-b border-gray-100 pb-2">
                  ORDER INFORMATION & SPECIFICATIONS
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-gray-500 block">Order Type:</span>
                    <strong className="text-black">{selectedOrder.orderType}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Requested Colour:</span>
                    <strong className="text-black">{selectedOrder.colour || 'Standard'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Total Quantity:</span>
                    <strong className="text-black">{selectedOrder.quantity}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Custom Notes / Pose:</span>
                    <strong className="text-black">
                      {selectedOrder.notes || 'None specified'}
                    </strong>
                  </div>
                </div>

                {/* Uploaded Files Section */}
                {selectedOrder.uploadedFile && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-[11px] text-gray-700 flex items-center gap-1.5">
                        <FileText size={14} />
                        <span>CUSTOMER UPLOADED FILE</span>
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {selectedOrder.uploadedFileSize
                          ? `${(selectedOrder.uploadedFileSize / 1024).toFixed(1)} KB`
                          : ''}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {selectedOrder.orderType === 'Image to 3D Print' ? (
                          <ImageIcon size={20} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Box size={20} className="text-sky-600 shrink-0" />
                        )}
                        <span className="font-mono font-bold text-black truncate">
                          {selectedOrder.uploadedFileName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* For images, allow viewing inline */}
                        {selectedOrder.orderType === 'Image to 3D Print' && (
                          <a
                            href={`/api/admin/orders/${selectedOrder.id}/view-file`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                          >
                            <Eye size={12} />
                            <span>Preview Image</span>
                          </a>
                        )}

                        {/* Download original image or STL */}
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(selectedOrder.id)}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <Download size={13} />
                          <span>
                            {selectedOrder.orderType === 'Direct STL Print'
                              ? 'Download .STL'
                              : 'Download File'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items in Cart Table */}
                <div className="space-y-2 pt-2">
                  <span className="font-semibold text-gray-700 block">Ordered Figurine Items:</span>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <tr>
                          <th className="py-2 px-3">Item</th>
                          <th className="py-2 px-3">Scale</th>
                          <th className="py-2 px-3">Finish / Colour</th>
                          <th className="py-2 px-3">Qty</th>
                          <th className="py-2 px-3 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-semibold text-black">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">{item.scale || 'Default'}</td>
                            <td className="py-2.5 px-3 text-gray-600">{item.finish || 'Standard'}</td>
                            <td className="py-2.5 px-3 text-gray-600">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold">
                              {item.price > 0 ? formatINR(item.price * item.quantity) : 'Custom Quote'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Quote Management & Status Controls (Interactive) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quote Management Card */}
                <div className="p-4 sm:p-5 border border-sky-200 bg-sky-50/20 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                    <h4 className="font-bold uppercase tracking-wider text-[11px] text-sky-950">
                      QUOTE MANAGEMENT
                    </h4>
                    <span className="text-xs font-bold text-sky-900">
                      {selectedOrder.quoteAmount != null
                        ? `Current Quote: ${formatINR(selectedOrder.quoteAmount)}`
                        : 'Quote Not Sent'}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Set a custom price for modeling, slicing, and 3D printing. Sending or updating a quote saves directly to the persistent database and sets the order status to &quot;Quote Sent&quot;.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="50"
                        value={quoteInput}
                        onChange={(e) => setQuoteInput(e.target.value)}
                        placeholder="Enter quote amount (e.g. 1499)"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:border-black"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isSendingQuote || !quoteInput}
                      onClick={() => handleSendQuote(selectedOrder.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-sky-700 text-white hover:bg-sky-800 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isSendingQuote ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>
                        {selectedOrder.quoteAmount != null ? 'UPDATE QUOTE' : 'SEND QUOTE'}
                      </span>
                    </button>
                  </div>

                  {/* Post-Quote Actions: OPEN WHATSAPP and Status display */}
                  {selectedOrder.quoteAmount != null && (
                    <div className="pt-3 border-t border-sky-200/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      {selectedOrder.phone ? (
                        <button
                          type="button"
                          onClick={() => {
                            const url = buildAdminQuoteWhatsAppUrl({
                              customerName: selectedOrder.customerName,
                              phone: selectedOrder.phone,
                              trackingId: selectedOrder.trackingId,
                              quoteAmount: selectedOrder.quoteAmount!,
                            });
                            if (url) {
                              window.open(url, '_blank');
                            }
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#25D366] hover:bg-[#20bd5a] text-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                        >
                          <MessageSquare size={13} />
                          <span>OPEN WHATSAPP</span>
                        </button>
                      ) : (
                        <span className="text-xs text-amber-700 font-medium italic">
                          Customer phone number not available.
                        </span>
                      )}

                      <div className="text-xs font-semibold text-gray-700 sm:text-right">
                        <span>Status: </span>
                        <strong className="text-sky-950 font-bold">
                          {selectedOrder.status}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Changer Card */}
                <div className="p-4 sm:p-5 border border-gray-200 rounded-2xl space-y-3.5 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-800 flex items-center gap-1.5">
                      <span>UPDATE ORDER STATUS</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Database Sync
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-600">
                        Current Status:{' '}
                        <strong className="text-black">
                          {normalizeOrderStatus(selectedOrder.status)}
                        </strong>
                      </label>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="relative flex-1">
                          <select
                            id="order-status-dropdown"
                            value={selectedStatus}
                            disabled={isUpdatingStatus}
                            onChange={(e) => {
                              setSelectedStatus(e.target.value as CanonicalOrderStatus);
                              setStatusSuccessMsg(null);
                            }}
                            className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-black focus:outline-none focus:border-black cursor-pointer transition-colors"
                          >
                            {CANONICAL_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          id="order-save-status-btn"
                          type="button"
                          disabled={
                            isUpdatingStatus ||
                            selectedStatus === normalizeOrderStatus(selectedOrder.status)
                          }
                          onClick={() => handleSaveStatus(selectedOrder.id, selectedStatus)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                            selectedStatus !== normalizeOrderStatus(selectedOrder.status)
                              ? 'bg-black text-white hover:bg-neutral-800 cursor-pointer shadow-sm active:scale-95'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          }`}
                        >
                          {isUpdatingStatus ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>SAVING...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} />
                              <span>SAVE STATUS</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Small confirmation message */}
                    {statusSuccessMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span>{statusSuccessMsg}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/70 pb-2">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-gray-700 block">
                    ORDER ACTIVITY TIMELINE
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {selectedOrder.statusHistory?.length || 0} recorded update(s)
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {selectedOrder.statusHistory?.map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-3 text-xs">
                      {/* Timeline dot and connector line */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-black ring-4 ring-gray-100" />
                        {idx < (selectedOrder.statusHistory?.length || 0) - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 mt-1" />
                        )}
                      </div>

                      <div className="flex-1 pb-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <strong className="text-black text-xs">
                            {step.status || step.type || 'Status Update'}
                          </strong>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {formatDateTime(step.timestamp)}
                          </span>
                        </div>
                        {step.note && (
                          <p className="text-[11px] text-gray-600 mt-0.5">{step.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Order ID: {selectedOrder.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderToDelete(selectedOrder);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE ORDER CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {orderToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-4 text-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete this order?</h3>
                <p className="text-xs text-gray-500 font-mono font-bold mt-0.5">
                  Order {orderToDelete.trackingId}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              This will permanently remove the order and its associated order data. This action cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setOrderToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteOrder(orderToDelete.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
