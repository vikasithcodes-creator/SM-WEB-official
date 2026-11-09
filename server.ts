import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import {
  readOrders,
  createOrder,
  getOrderById,
  getOrderByTrackingId,
  updateOrderStatus,
  updateOrderQuote,
  confirmOrderByTrackingId,
  formatIndianPhoneNumber,
  matchPhoneNumbers,
  deleteOrder,
  OrderStatus,
  OrderRecord,
  OrderItem,
  CanonicalOrderStatus,
  normalizeOrderStatus,
  getAllProducts,
  getProductRecordById,
  createProduct,
  updateProduct,
  deleteProduct,
  hydrateFromFirestore,
} from './src/server/db';
import { adminAuth, adminDb } from './src/server/firebaseAdmin';
import { GoogleGenAI, Type } from '@google/genai';
import {
  toolGetProducts,
  toolGetProductDetails,
  toolGetProductPricing,
  toolGetBusinessInformation,
  toolGetShippingPolicy,
  toolGetOrderStatus,
  toolGetCustomerOrders,
} from './src/server/chatbotTools';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'smstudios2026';

// Storage directories
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory active admin sessions map (token -> expiration timestamp)
const adminSessions = new Map<string, { createdAt: number; expiresAt: number }>();

function generateSessionToken(): string {
  return `sm_adm_${crypto.randomBytes(32).toString('hex')}`;
}

// Admin Auth Middleware (supports session tokens and verified Firebase Admin Auth ID tokens)
async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in as admin.' });
    return;
  }

  const token = authHeader.substring(7).trim();

  // 1. Check in-memory admin session token
  const session = adminSessions.get(token);
  if (session && Date.now() <= session.expiresAt) {
    next();
    return;
  }

  // 2. Check Firebase Auth ID Token for admin
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded && decoded.uid) {
        // Check if admin is registered in admins collection
        let isPermitted = true;
        if (adminDb) {
          const adminDoc = await adminDb.collection('admins').doc(decoded.uid).get();
          if (!adminDoc.exists) {
            // Also allow default admin email or designated admin email
            const email = (decoded.email || '').toLowerCase();
            if (email !== 'vikasithcodes@gmail.com' && email !== 'admin@smstudios.in') {
              isPermitted = false;
            }
          }
        }
        if (isPermitted) {
          (req as any).user = decoded;
          next();
          return;
        }
      }
    } catch {
      // Token was not a valid Firebase ID token
    }
  }

  res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
}

// Multer configuration for file uploads (Supports up to 60MB images or STL 3D models)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePrefix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${uniquePrefix}_${cleanName}`);
  },
});

// Express 4 does not catch rejected promises from async handlers; forward them to the error middleware.
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

const upload = multer({
  storage,
  limits: {
    fileSize: 60 * 1024 * 1024, // 60MB max file size
  },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// CUSTOMER ORDER ENDPOINTS
// ==========================================

// Create order with optional file upload (Image or STL)
app.post(
  '/api/orders',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('uploadedFile')(req, res, (err: any) => {
      if (err) {
        console.error('File upload error in /api/orders:', err);
        res.status(400).json({
          success: false,
          error:
            err instanceof multer.MulterError
              ? `File upload error: ${err.message}`
              : err?.message || 'File upload failed',
        });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const file = req.file;

    let items: OrderItem[] = [];
    try {
      items = body.items ? JSON.parse(body.items) : [];
    } catch {
      items = [];
    }

    const hasCustomJob =
      body.hasCustomJob === 'true' ||
      body.hasCustomJob === true ||
      items.some((i) => i.isCustomJob || i.category === 'custom-prints') ||
      !!file;

    // Detect order type
    let orderType: OrderRecord['orderType'] = 'Standard Figurine';
    if (file) {
      const isStl = /\.stl$/i.test(file.originalname);
      orderType = isStl ? 'Direct STL Print' : 'Image to 3D Print';
    } else if (items.some((i) => i.isCustomJob)) {
      orderType = 'Image to 3D Print';
    } else if (items.length > 1) {
      orderType = 'Mixed Order';
    }

    const subtotal = parseFloat(body.subtotal || '0') || 0;
    const discount = parseFloat(body.discount || '0') || 0;
    const shipping = parseFloat(body.shipping || '0') || 0;
    const total = parseFloat(body.total || '0') || 0;
    const quantity = parseInt(body.quantity || '1', 10) || 1;

    // Mandatory Mobile Number / WhatsApp Number validation (Backend level)
    const rawPhone = (body.phone || body.mobile || '').trim();
    const digitsOnly = rawPhone.replace(/[\s\-\(\)\+]/g, '');
    const isValidIndianMobile = /^((91|0)?[6-9]\d{9}|[6-9]\d{9})$/.test(digitsOnly);
    if (!rawPhone || !isValidIndianMobile) {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid mobile number.',
      });
      return;
    }

    // Extract preferred colour / notes
    const colour = body.colour || (items[0]?.finish ? items[0].finish : undefined);
    const notes = body.notes || (items[0]?.customDetails?.customEngraving ? items[0].customDetails.customEngraving : undefined);

    const newOrder = await createOrder({
      customerName: body.customerName || 'Anonymous Customer',
      email: body.email || 'no-email@smstudios.local',
      phone: rawPhone,
      userId: body.userId ? String(body.userId).trim() : undefined,
      address: body.address || 'Address pending',
      city: body.city || '',
      postalCode: body.postalCode || '',
      priorityQueue: body.priorityQueue === 'rush' ? 'rush' : 'standard',
      orderType,
      hasCustomJob,
      uploadedFile: file ? file.filename : undefined,
      uploadedFileUrl: file ? `/api/uploads/${file.filename}` : undefined,
      uploadedFileName: file ? file.originalname : undefined,
      uploadedFileType: file ? file.mimetype : undefined,
      uploadedFileSize: file ? file.size : undefined,
      colour,
      notes,
      quantity,
      quoteAmount: hasCustomJob ? null : total,
      items,
      subtotal,
      discount,
      shipping,
      total,
    });

    res.status(201).json({
      success: true,
      order: newOrder,
    });
  } catch (err: any) {
    console.error('Failed to create order:', err);
    res.status(500).json({ error: err?.message || 'Failed to process order' });
  }
});

// Customer public order tracking endpoint - Requires BOTH Tracking ID and WhatsApp Mobile Number
const handleCustomerTrackOrder = (req: Request, res: Response): void => {
  const { trackingId } = req.params;
  const rawPhone = (
    (typeof req.query.phone === 'string' ? req.query.phone : '') ||
    ((req.body && typeof req.body.phone === 'string') ? req.body.phone : '')
  ).trim();

  // "Do not allow a customer to retrieve an order using the Tracking ID alone."
  if (!rawPhone) {
    res.status(400).json({
      success: false,
      error: 'Please enter your WhatsApp number.',
    });
    return;
  }

  const order = getOrderByTrackingId(trackingId);
  if (!order) {
    res.status(404).json({
      success: false,
      error: 'Order not found. Please check your Tracking ID and WhatsApp number.',
    });
    return;
  }

  // Verify that the customer's phone matches the phone stored on the order record
  const isMatch = matchPhoneNumbers(rawPhone, order.phone);
  if (!isMatch) {
    res.status(404).json({
      success: false,
      error: 'Order not found. Please check your Tracking ID and WhatsApp number.',
    });
    return;
  }

  // Return public safe view of order (strictly customer tracking data, no database IDs or admin internals)
  res.json({
    success: true,
    order: {
      trackingId: order.trackingId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerName: order.customerName,
      phone: order.phone,
      status: order.status,
      statusHistory: order.statusHistory || [],
      orderType: order.orderType || 'Precision 3D Print',
      hasCustomJob: order.hasCustomJob,
      uploadedFileName: order.uploadedFileName,
      colour: order.colour,
      notes: order.notes,
      quoteAmount: order.quoteAmount,
      total: order.total,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      quantity: order.quantity,
      items: (order.items || []).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        finish: i.finish,
        scale: i.scale,
        price: i.price != null ? i.price : (order.quoteAmount ? Math.round(order.quoteAmount / (order.quantity || 1)) : 0),
      })),
    },
  });
};

app.get('/api/orders/track/:trackingId', handleCustomerTrackOrder);
app.post('/api/orders/track/:trackingId', handleCustomerTrackOrder);

// Customer confirms quote / order
const handleCustomerConfirmOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { trackingId } = req.params;
  const existingOrder = getOrderByTrackingId(trackingId);

  if (!existingOrder) {
    res.status(404).json({ success: false, error: 'Order not found for tracking ID' });
    return;
  }

  const updated = await confirmOrderByTrackingId(trackingId, 'Order confirmed by customer');
  if (!updated) {
    res.status(400).json({ success: false, error: 'Could not confirm order. Please try again.' });
    return;
  }

  res.json({
    success: true,
    message: 'Order confirmed successfully',
    order: {
      trackingId: updated.trackingId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      customerName: updated.customerName,
      phone: updated.phone,
      status: updated.status,
      statusHistory: updated.statusHistory,
      orderType: updated.orderType,
      hasCustomJob: updated.hasCustomJob,
      uploadedFileName: updated.uploadedFileName,
      colour: updated.colour,
      notes: updated.notes,
      quoteAmount: updated.quoteAmount,
      total: updated.total,
      priorityQueue: updated.priorityQueue,
      items: updated.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        finish: i.finish,
        scale: i.scale,
      })),
    },
  });
});

app.post('/api/orders/track/:trackingId/confirm', handleCustomerConfirmOrder);
app.post('/api/orders/:trackingId/confirm', handleCustomerConfirmOrder);

// ==========================================
// ADMIN AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/admin/login', (req: Request, res: Response): void => {
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Password required' });
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  const token = generateSessionToken();
  const sessionDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  adminSessions.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + sessionDurationMs,
  });

  res.json({
    success: true,
    token,
    admin: {
      role: 'admin',
      name: 'SM Studios Owner',
    },
  });
});

app.get('/api/admin/session', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const token = authHeader.substring(7).trim();
  const session = adminSessions.get(token);

  if (!session || Date.now() > session.expiresAt) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    admin: {
      role: 'admin',
      name: 'SM Studios Owner',
    },
  });
});

app.post('/api/admin/logout', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    adminSessions.delete(token);
  }
  res.json({ success: true });
});

// ==========================================
// ADMIN ORDERS MANAGEMENT ENDPOINTS
// ==========================================

// Get all orders with optional search, filter, and sort
app.get('/api/admin/orders', requireAdminAuth, (req: Request, res: Response): void => {
  let orders = readOrders();

  const { search, status, orderType, sort } = req.query as Record<string, string>;

  if (search) {
    const term = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.trackingId.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.email.toLowerCase().includes(term) ||
        (o.uploadedFileName && o.uploadedFileName.toLowerCase().includes(term))
    );
  }

  if (status && status !== 'all') {
    const targetCanonical = normalizeOrderStatus(status);
    orders = orders.filter((o) => normalizeOrderStatus(o.status) === targetCanonical);
  }

  if (orderType && orderType !== 'all') {
    orders = orders.filter((o) => o.orderType === orderType);
  }

  if (sort === 'oldest') {
    orders = [...orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } else {
    // Default newest first
    orders = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  function getOrdersSummary() {
    const allRaw = readOrders();
    return {
      total: allRaw.length,
      pendingQuotes: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Pending Quote').length,
      quoteSent: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Quote Sent').length,
      confirmed: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Confirmed').length,
      inProduction: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'In Production').length,
      shipped: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Shipped').length,
      completed: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Completed').length,
      cancelled: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Cancelled').length,
    };
  }

  res.json({
    success: true,
    summary: getOrdersSummary(),
    orders,
  });
});

// Get single order details
app.get('/api/admin/orders/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const order = getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ success: true, order });
});

// Update order status
app.patch('/api/admin/orders/:id/status', requireAdminAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, note } = req.body;
  if (!status) {
    res.status(400).json({ error: 'Status is required' });
    return;
  }

  const updated = await updateOrderStatus(req.params.id, status, note);
  if (!updated) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const allRaw = readOrders();
  const summary = {
    total: allRaw.length,
    pendingQuotes: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Pending Quote').length,
    quoteSent: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Quote Sent').length,
    confirmed: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Confirmed').length,
    inProduction: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'In Production').length,
    shipped: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Shipped').length,
    completed: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Completed').length,
    cancelled: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Cancelled').length,
  };

  res.json({ success: true, order: updated, summary });
}));

// Update quote amount & auto-set status to 'Quote Sent'
app.patch('/api/admin/orders/:id/quote', requireAdminAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const quoteAmount = parseFloat(req.body.quoteAmount);
  if (isNaN(quoteAmount) || quoteAmount <= 0) {
    res.status(400).json({ error: 'Valid positive quote amount is required' });
    return;
  }

  const updated = await updateOrderQuote(req.params.id, quoteAmount);
  if (!updated) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const allRaw = readOrders();
  const summary = {
    total: allRaw.length,
    pendingQuotes: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Pending Quote').length,
    quoteSent: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Quote Sent').length,
    confirmed: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Confirmed').length,
    inProduction: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'In Production').length,
    shipped: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Shipped').length,
    completed: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Completed').length,
    cancelled: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Cancelled').length,
  };

  res.json({ success: true, order: updated, summary });
}));

// Delete an order permanently
app.delete('/api/admin/orders/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const order = getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  // If order had an uploaded file on disk, optionally clean it up safely
  if (order.uploadedFile) {
    const filePath = path.join(UPLOADS_DIR, order.uploadedFile);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Failed to unlink uploaded file for deleted order:', err);
    }
  }

  const success = await deleteOrder(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Order not found or already deleted' });
    return;
  }

  const allRaw = readOrders();
  const summary = {
    total: allRaw.length,
    pendingQuotes: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Pending Quote').length,
    quoteSent: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Quote Sent').length,
    confirmed: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Confirmed').length,
    inProduction: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'In Production').length,
    shipped: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Shipped').length,
    completed: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Completed').length,
    cancelled: allRaw.filter((o) => normalizeOrderStatus(o.status) === 'Cancelled').length,
  };

  res.json({
    success: true,
    message: 'Order deleted successfully',
    deletedId: req.params.id,
    deletedTrackingId: order.trackingId,
    summary,
  });
}));

// Securely download customer's uploaded file (Image or STL)
app.get('/api/admin/orders/:id/download-file', requireAdminAuth, (req: Request, res: Response): void => {
  const order = getOrderById(req.params.id);
  if (!order || !order.uploadedFile) {
    res.status(404).json({ error: 'No uploaded file attached to this order' });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, order.uploadedFile);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File was not found on server disk' });
    return;
  }

  const downloadName = order.uploadedFileName || order.uploadedFile;
  res.download(filePath, downloadName);
});

// View customer's image file inline
app.get('/api/admin/orders/:id/view-file', requireAdminAuth, (req: Request, res: Response): void => {
  const order = getOrderById(req.params.id);
  if (!order || !order.uploadedFile) {
    res.status(404).json({ error: 'No uploaded file attached to this order' });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, order.uploadedFile);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found on server disk' });
    return;
  }

  res.sendFile(filePath);
});

// ==========================================
// CANONICAL PRODUCT MANAGEMENT ENDPOINTS
// ==========================================

// Public endpoint: retrieve canonical product collection
app.get('/api/products', (_req: Request, res: Response): void => {
  try {
    const products = getAllProducts();
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load products' });
  }
});

// Public endpoint: retrieve single product by canonical ID
app.get('/api/products/:id', (req: Request, res: Response): void => {
  try {
    const product = getProductRecordById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to retrieve product' });
  }
});

// Admin endpoint: add new product to canonical database
app.post('/api/products', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, category } = req.body;
    if (!name || price === undefined || !category) {
      res.status(400).json({ error: 'Name, price, and category are required' });
      return;
    }
    const newProduct = await createProduct(req.body);
    res.status(201).json({ success: true, product: newProduct });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create product' });
  }
});

// Admin endpoint: update existing product in canonical database
app.put('/api/products/:id', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update product' });
  }
});

// Admin endpoint: delete product from canonical database
app.delete('/api/products/:id', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await deleteProduct(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product removed' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete product' });
  }
});

// Serve uploaded customer files
app.use('/api/uploads', express.static(UPLOADS_DIR));

// ==========================================
// GEMINI AI CONVERSATIONAL ENGINE WITH TOOLS
// ==========================================

const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Tool declarations for Gemini
const geminiTools = [
  {
    functionDeclarations: [
      {
        name: 'get_products',
        description: 'Retrieves all available 3D printed products and sacred god idols from the live SM Studios catalog, optionally filtered by category (e.g. "god-idols", "figurines"). Returns real prices, dimensions, and finishes.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'Optional category filter like "god-idols", "figurines", or "all".',
            },
          },
        },
      },
      {
        name: 'get_product_details',
        description: 'Retrieves detailed manufacturing specifications, resin material, micron layer height, weight, highlights, placement suitability, finishes, scales, and lead time for a specific product by name or ID (e.g. "Balaji", "Bal Ganesha", "Mahalakshmi").',
        parameters: {
          type: Type.OBJECT,
          properties: {
            productNameOrId: {
              type: Type.STRING,
              description: 'Name or ID of the product to inspect (e.g. "Balaji", "Lord Venkateswara", "Bal Ganesha", "fig-01").',
            },
          },
          required: ['productNameOrId'],
        },
      },
      {
        name: 'get_product_pricing',
        description: 'Retrieves the official pricing rules, canonical price for a product, currency (INR), free shipping threshold, standard shipping fee, and rush priority express fee.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            productNameOrId: {
              type: Type.STRING,
              description: 'Optional product name to get specific canonical pricing and finish options.',
            },
          },
        },
      },
      {
        name: 'get_business_information',
        description: 'Retrieves authentic background information about SM Studios: precision 8K SLA resin manufacturing, zero layer line fidelity, car dashboard mounting, laser-cut packaging, custom STL ordering workflow, and company identity.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'get_shipping_policy',
        description: 'Retrieves the official studio shipping policies: free shipping threshold (₹999), standard courier rate (₹99), dispatch turnaround (24h in stock / 48-72h custom), Rush Priority addon (+₹250), and 100% Zero-Break Guarantee.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'get_order_status',
        description: 'Securely retrieves the real-time production status, item list, total amount, and timeline events for an order. Requires BOTH the unique Tracking ID (e.g., TH-3D-XXXXXX) AND the registered customer WhatsApp phone number to protect customer privacy.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            trackingId: {
              type: Type.STRING,
              description: 'The unique tracking ID assigned to the order (format TH-3D-XXXXXX).',
            },
            phone: {
              type: Type.STRING,
              description: 'The customer registered WhatsApp mobile number used at checkout.',
            },
          },
          required: ['trackingId', 'phone'],
        },
      },
      {
        name: 'get_customer_orders',
        description: 'Retrieves the list of past orders belonging to an authenticated customer. Can look up orders by customer user ID, verified email, or registered phone number.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            customerId: {
              type: Type.STRING,
              description: 'The authenticated user ID.',
            },
            customerEmail: {
              type: Type.STRING,
              description: 'The customer email address.',
            },
            customerPhone: {
              type: Type.STRING,
              description: 'The customer phone number.',
            },
          },
        },
      },
    ],
  },
];

// Tool dispatcher
async function executeGeminiToolCall(name: string, args: any, authUser?: any): Promise<any> {
  switch (name) {
    case 'get_products':
      return toolGetProducts(args?.category);
    case 'get_product_details':
      return toolGetProductDetails(args?.productNameOrId);
    case 'get_product_pricing':
      return toolGetProductPricing(args?.productNameOrId);
    case 'get_business_information':
      return toolGetBusinessInformation();
    case 'get_shipping_policy':
      return toolGetShippingPolicy();
    case 'get_order_status':
      return toolGetOrderStatus(args?.trackingId, args?.phone);
    case 'get_customer_orders': {
      // Secure lookup: prioritize authenticated user credentials if present
      const uid = authUser?.uid || args?.customerId;
      const email = authUser?.email || args?.customerEmail;
      return await toolGetCustomerOrders(uid, email, args?.customerPhone);
    }
    default:
      return { error: `Tool ${name} not recognized.` };
  }
}

app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    // Check optional authenticated user token from header for personalized order lookups
    let authUser: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      try {
        const token = authHeader.substring(7).trim();
        authUser = await adminAuth.verifyIdToken(token);
      } catch {
        // Not a verified ID token, treat as guest
      }
    }

    const systemInstruction = `You are the official SM Studios AI Assistant, a genuinely intelligent, conversational 3D printing and sacred god idol specialist.
You represent SM Studios, an artisanal, high-precision 3D printing workshop based in India specializing in:
1. Sacred Hindu God Idols (Lord Venkateswara Balaji, Bal Ganesha with Shivling, Goddess Mahalakshmi, Bal Krishna with Flute, etc.) crafted with ultra-high resolution 8K & 12K photopolymer resin with zero visible layer lines. Finished in silk gold leaf, antique brass patina, or pure marble white. Ideal for home mandirs and vibration-damped car dashboards.
2. Custom 3D Printing Service: Customers can upload CAD, 3D sculpts, or .STL / .OBJ / .STEP files directly on the website for instant volume calculations, material selection, and studio quotation.
3. Gaming Accessories & Art Figurines.

Guidelines:
- Tool Usage: You have access to real tools (get_products, get_product_details, get_product_pricing, get_business_information, get_shipping_policy, get_order_status, get_customer_orders). Whenever a customer asks about products, pricing, materials, specifications, shipping, order tracking, or customer orders, ALWAYS call the appropriate tool to retrieve actual application data.
- Never invent product prices, sizes, availability, shipping fees, or order statuses.
- Formulate helpful, natural, conversational responses using the returned tool data. Do not just dump raw JSON.
- Order Privacy: When customers ask about an order, explain that order tracking requires BOTH their Tracking ID (format TH-3D-XXXXXX) AND their registered WhatsApp phone number for privacy. If they provided both, call get_order_status. If a customer is logged in, you can look up their orders via get_customer_orders.
- Tone: Friendly, respectful, helpful, and concise. Maintain conversational context across follow-up queries.`;

    // Map conversation history cleanly into Gemini Content format
    const contents: any[] = [];

    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        const text = String(h.text || h.content || '').trim();
        if (text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text }],
          });
        }
      }
    }

    // Add current user query
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    // 1. Initial turn with Gemini including tool definitions
    let geminiResponse = await geminiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        tools: geminiTools,
      },
    });

    // 2. Multi-turn function execution loop (resolves any tool calls requested by Gemini)
    let turns = 0;
    while (turns < 4 && geminiResponse.functionCalls && geminiResponse.functionCalls.length > 0) {
      turns++;
      const functionCalls = geminiResponse.functionCalls;
      const candidateContent = geminiResponse.candidates?.[0]?.content;

      if (candidateContent) {
        contents.push(candidateContent);
      }

      // Execute each function call against live application database
      const functionResponseParts: any[] = [];
      for (const call of functionCalls) {
        console.log(`[Gemini Tool Call]: ${call.name} with args:`, call.args);
        const toolResult = await executeGeminiToolCall(call.name, call.args, authUser);
        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
          },
        });
      }

      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });

      // Submit function responses back to Gemini so it generates the final conversational answer
      geminiResponse = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          tools: geminiTools,
        },
      });
    }

    const reply = geminiResponse.text?.trim() || "I'm here to help with SM Studios 3D printing and sacred god idols. How can I assist you today?";

    res.json({
      success: true,
      reply,
    });
  } catch (err: any) {
    console.error('Gemini chatbot error:', err?.message || err);

    let errorDetail = 'Unable to reach the SM Studios AI assistant at the moment. Please try again or message us directly on WhatsApp.';
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('api key') || msg.includes('403') || msg.includes('permission_denied') || msg.includes('scope')) {
      errorDetail = 'The Gemini AI assistant is ready, but requires an active Gemini API key. Please configure your key in Settings > Secrets.';
    }

    res.status(500).json({
      success: false,
      error: errorDetail,
    });
  }
});


// Explicit catch-all for /api/* routes so unmatched API calls return JSON 404 and NEVER fall through to HTML!
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Explicit error handler for all /api/* routes (catches JSON parsing, multer, or route exceptions)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api') || req.originalUrl?.startsWith('/api')) {
    console.error('API Error handler:', err);
    res.status(err.status || err.statusCode || 500).json({
      success: false,
      error: err.message || 'An unexpected server error occurred',
    });
    return;
  }
  next(err);
});

// ==========================================
// STATIC ASSETS & VITE MOUNT
// ==========================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Load the durable data from Firestore before serving any request.
  await hydrateFromFirestore();

  if (!isProduction) {
    // Dynamic import of vite in dev mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SM Studios Full-Stack Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
