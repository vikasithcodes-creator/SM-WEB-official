/**
 * Currency and formatting utilities for Indian Rupee (INR)
 */
export const formatINR = (amount: number): string => {
  const rounded = Math.round(amount * 100) / 100;
  if (rounded % 1 !== 0) {
    return '₹' + rounded.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return '₹' + rounded.toLocaleString('en-IN');
};

/**
 * Validates 10-digit Indian mobile number (optionally prefixed with +91, 91, or 0)
 */
export const isValidIndianMobile = (phone: string): boolean => {
  if (!phone) return false;
  const digits = phone.trim().replace(/[\s\-\(\)\+]/g, '');
  return /^((91|0)?[6-9]\d{9}|[6-9]\d{9})$/.test(digits);
};

/**
 * Formats Indian phone number to authoritative +91XXXXXXXXXX format:
 * - 9876543210 -> +919876543210
 * - +919876543210 -> +919876543210 (does NOT add +91 again)
 * - 09876543210 -> +919876543210
 * - removes spaces, hyphens, brackets
 */
export const formatIndianPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.trim().replace(/[\s\-\(\)\+]/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }
  if (phone.trim().startsWith('+')) {
    return phone.trim().replace(/[\s\-\(\)]/g, '');
  }
  return `+91${digits}`;
};

/**
 * Gets clean digits for WhatsApp wa.me link (country code + number, NO plus sign)
 * e.g. +919876543210 -> 919876543210
 */
export const getWhatsAppPhoneDigits = (phone: string): string => {
  const formatted = formatIndianPhoneNumber(phone);
  return formatted.replace(/\D/g, '');
};

/**
 * Builds prefilled WhatsApp message URL for Admin Quote notification:
 * Hi [CUSTOMER NAME],
 * 
 * This is SM Studios.
 * 
 * Your 3D printing quote for Order [TRACKING ID] is ₹[QUOTE AMOUNT].
 * 
 * Please confirm if you would like us to proceed with the order.
 * 
 * Thank you,
 * SM Studios
 */
export const buildAdminQuoteWhatsAppUrl = (params: {
  customerName: string;
  phone?: string;
  trackingId: string;
  quoteAmount: number;
}): string | null => {
  if (!params.phone) return null;
  const phoneDigits = getWhatsAppPhoneDigits(params.phone);
  if (!phoneDigits) return null;

  const quoteFormatted = params.quoteAmount.toLocaleString('en-IN');
  const message = `Hi ${params.customerName},\n\nThis is SM Studios.\n\nYour 3D printing quote for Order ${params.trackingId} is ₹${quoteFormatted}.\n\nPlease confirm if you would like us to proceed with the order.\n\nThank you,\nSM Studios`;

  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
};

/**
 * Official SM Studios WhatsApp Business Contact
 * Phone: +91 90145 06060
 * WhatsApp deep-link format: https://wa.me/919014506060
 */
export const SM_STUDIOS_WHATSAPP_NUMBER = '919014506060';

/**
 * Builds prefilled WhatsApp message URL for Customer Order Confirmation
 * Target: SM Studios business number (+91 90145 06060)
 * Uses actual Tracking ID, product name, and quote from the order record.
 */
export const buildCustomerConfirmWhatsAppUrl = (params: {
  trackingId: string;
  orderName?: string;
  quoteAmount: number;
  customerName?: string;
  phone?: string;
}): string => {
  const quoteFormatted = Number(params.quoteAmount || 0).toLocaleString('en-IN');
  const productName = params.orderName?.trim() || 'Custom 3D Print';

  const message = `Hi SM Studios, I would like to confirm my order.\n\nOrder Tracking ID: ${params.trackingId}\nOrder: ${productName}\nQuote: ₹${quoteFormatted}\n\nPlease proceed with my order.`;

  return `https://wa.me/${SM_STUDIOS_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

