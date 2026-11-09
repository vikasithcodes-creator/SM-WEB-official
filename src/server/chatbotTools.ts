import {
  getAllProducts,
  getProductRecordById,
  readOrders,
  getOrderByTrackingId,
  matchPhoneNumbers,
  ProductRecord,
  OrderRecord,
} from './db';
import { adminDb } from './firebaseAdmin';

// 1. get_products
export function toolGetProducts(category?: string): any[] {
  let products = getAllProducts().filter((p) => p.available !== false);
  if (category && category !== 'all') {
    const cat = category.toLowerCase().trim();
    products = products.filter(
      (p) =>
        p.category.toLowerCase().includes(cat) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(cat))
    );
  }
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    category: p.categoryLabel || p.category,
    priceINR: p.price,
    dimensions: p.dimensions,
    printTech: p.printTech,
    finishes: (p.availableFinishes || []).map((f) => f.label),
    scales: (p.availableScales || []).map((s) => s.label),
    leadTime: p.leadTime,
    inStock: p.available,
  }));
}

// 2. get_product_details
export function toolGetProductDetails(productNameOrId: string): any {
  if (!productNameOrId) return { error: 'Please provide a product name or ID.' };
  const products = getAllProducts();
  const query = productNameOrId.toLowerCase().trim();

  const found = products.find(
    (p) =>
      p.id.toLowerCase() === query ||
      p.name.toLowerCase().includes(query) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(query))
  );

  if (!found) {
    return {
      error: `No product found matching "${productNameOrId}". Available products: ${products.map((p) => p.name).join(', ')}`,
    };
  }

  return {
    id: found.id,
    name: found.name,
    subtitle: found.subtitle,
    category: found.categoryLabel || found.category,
    priceINR: found.price,
    dimensions: found.dimensions,
    materialAndTech: found.printTech,
    layerHeight: found.layerHeight,
    weight: found.weight,
    description: found.description,
    highlights: found.highlights,
    idealPlacement: found.idealPlacement,
    finishes: found.availableFinishes || [],
    scales: found.availableScales || [],
    leadTime: found.leadTime,
    inStock: found.available,
  };
}

// 3. get_product_pricing
export function toolGetProductPricing(productNameOrId?: string): any {
  const products = getAllProducts().filter((p) => p.available !== false);
  if (productNameOrId) {
    const detail = toolGetProductDetails(productNameOrId);
    if (!detail.error) {
      return {
        productName: detail.name,
        canonicalPriceINR: detail.priceINR,
        currency: 'INR (₹)',
        availableFinishes: detail.finishes,
        availableScales: detail.scales,
        freeShippingEligible: detail.priceINR >= 999,
      };
    }
  }

  return {
    currency: 'INR (₹)',
    catalogPricing: products.map((p) => ({
      name: p.name,
      priceINR: p.price,
      freeShipping: p.price >= 999,
    })),
    freeShippingThresholdINR: 999,
    standardShippingFeeINR: 99,
    rushPriorityAddonINR: 250,
  };
}

// 4. get_business_information
export function toolGetBusinessInformation(): any {
  return {
    businessName: 'SM Studios',
    specialization:
      'Precision manufacturing studio specializing in sacred Hindu god idols (Lord Venkateswara Balaji, Bal Ganesha with Shivling, Goddess Mahalakshmi, Bal Krishna) and on-demand custom 3D printing.',
    technology:
      'Industrial 8K & 12K photopolymer SLA resin printers producing micro-layer fidelity (0.025 mm / 25 microns) with zero visible layer lines.',
    finishes:
      'Hand-detailed silk gold leaf, antique bronze patina, and pure Italian marble white resin.',
    placement:
      'Vibration-damped 3M dashboard-mounting safe for car dashboards, home mandir altars, and executive desks.',
    packaging:
      'Laser-cut custom high-density foam casing ensuring 100% Zero-Break Guarantee during domestic transit.',
    orderingProcess:
      '1. Browse store catalogue and select figurine.\n2. Choose desired finish & scale.\n3. Add to cart & enter shipping details.\n4. Instant confirmation with unique tracking ID.',
    customPrintingProcess:
      '1. Click "Upload STL Quote" button on storefront.\n2. Upload CAD or 3D sculpt files (.STL, .OBJ, .STEP up to 60MB).\n3. Automatic volume computation & preview.\n4. Studio technicians review slicing & quote instantly.\n5. Print dispatched in shockproof packaging.',
  };
}

// 5. get_shipping_policy
export function toolGetShippingPolicy(): any {
  return {
    freeShippingThresholdINR: 999,
    standardShippingFeeINR: 99,
    coverage: 'All pin codes across India with door-to-door courier tracking',
    dispatchTimeInStock: 'Dispatched within 24 hours',
    dispatchTimeCustomPrint: '48 to 72 hours for slicing, UV light-curing, and alcohol washing',
    rushPriorityOption:
      '+₹250 Express Rush Priority puts your model at the top of the print bed queue within 12 hours.',
    packagingGuarantee:
      '100% Zero-Break Guarantee: If damaged in transit, free replacement is dispatched immediately upon WhatsApp verification.',
  };
}

// 6. get_order_status
export function toolGetOrderStatus(trackingId: string, phone: string): any {
  if (!trackingId || !phone) {
    return {
      error:
        'Both Order Tracking ID (e.g., TH-3D-XXXXXX) and registered customer WhatsApp number are strictly required for customer privacy.',
    };
  }

  const order = getOrderByTrackingId(trackingId);
  if (!order) {
    return {
      error:
        'No order found matching the provided Tracking ID. Please verify the ID from your confirmation email/SMS.',
    };
  }

  if (!matchPhoneNumbers(phone, order.phone)) {
    return {
      error:
        'The provided phone number does not match the customer record associated with this Tracking ID for security reasons.',
    };
  }

  return {
    trackingId: order.trackingId,
    customerName: order.customerName,
    currentStatus: order.status,
    orderType: order.orderType,
    items: (order.items || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      finish: i.finish || 'Standard',
      scale: i.scale || 'Standard',
      priceINR: i.price,
    })),
    totalINR: order.total,
    quoteAmountINR: order.quoteAmount,
    createdAt: order.createdAt,
    lastUpdated: order.updatedAt,
    timeline: (order.statusHistory || []).map((h) => ({
      status: h.status,
      timestamp: h.timestamp,
      note: h.note,
    })),
  };
}

// 7. get_customer_orders
export async function toolGetCustomerOrders(customerId?: string, customerEmail?: string, customerPhone?: string): Promise<any> {
  const allOrders = readOrders();
  let matched: OrderRecord[] = [];

  if (customerId) {
    matched = allOrders.filter((o) => o.userId === customerId);
  }

  if (matched.length === 0 && customerEmail) {
    matched = allOrders.filter(
      (o) => o.email.toLowerCase().trim() === customerEmail.toLowerCase().trim()
    );
  }

  if (matched.length === 0 && customerPhone) {
    matched = allOrders.filter((o) => matchPhoneNumbers(customerPhone, o.phone));
  }

  if (matched.length === 0) {
    return {
      message: 'No orders found for this customer profile. If you checked out as a guest, please provide your Tracking ID and phone number.',
      orders: [],
    };
  }

  return {
    customerOrderCount: matched.length,
    orders: matched.map((o) => ({
      trackingId: o.trackingId,
      status: o.status,
      totalINR: o.total,
      date: o.createdAt,
      items: (o.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', '),
    })),
  };
}
