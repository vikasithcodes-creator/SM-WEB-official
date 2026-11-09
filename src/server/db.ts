import fs from 'fs';
import path from 'path';
import { adminDb } from './firebaseAdmin';

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
  userId?: string;
  address: string;
  city: string;
  postalCode: string;
  priorityQueue: 'standard' | 'rush';
  orderType: 'Image to 3D Print' | 'Direct STL Print' | 'Standard Figurine' | 'Mixed Order';
  hasCustomJob: boolean;
  uploadedFile?: string; // stored filename on disk
  uploadedFileUrl?: string;
  uploadedFileName?: string; // original client filename
  uploadedFileType?: string;
  uploadedFileSize?: number;
  colour?: string;
  notes?: string;
  quantity: number;
  quoteAmount?: number | null;
  quoteUpdatedAt?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  statusHistory: {
    orderId?: string;
    type?: string;
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
}

export interface ProductRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  available: boolean;
  featured: boolean;
  src?: string;
  basePrice?: number;
  subtitle?: string;
  categoryLabel?: string;
  edition?: string;
  bg?: string;
  panel?: string;
  dimensions?: string;
  printTech?: string;
  layerHeight?: string;
  weight?: string;
  leadTime?: string;
  highlights?: string[];
  recommendedFinish?: string;
  availableFinishes?: { key: string; label: string; priceDelta: number }[];
  availableScales?: { key: string; label: string; priceDelta: number }[];
  accessoryCompatibility?: string;
  idealPlacement?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'orders.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: 'fig-01',
    name: 'LORD VENKATESWARA (BALAJI)',
    subtitle: 'Golden Divine Standing Murti • Blessing & Prosperity Idol',
    category: 'god-idols',
    categoryLabel: 'Sacred God Idol',
    edition: 'Divine Gold Edition • In Stock',
    price: 1499,
    basePrice: 1499,
    image: '/src/assets/images/balaji_golden_idol.png',
    src: '/src/assets/images/balaji_golden_idol.png',
    bg: '#C97A1E',
    panel: '#D98A2C',
    dimensions: '150mm × 75mm × 65mm',
    printTech: 'Ultra-Fine Silk Gold 3D Filament & SLA Resin',
    layerHeight: '0.025 mm (25 microns)',
    weight: '185g solid core with circular stand',
    leadTime: 'Ready in Stock • Dispatches in 24 Hours',
    description:
      'Intricately 3D printed standing idol of Lord Venkateswara (Tirupati Balaji) in lustrous silk gold, featuring the sacred crown, Shankha & Chakra, and hands joined in Anjali prayer.',
    available: true,
    featured: true,
    highlights: [
      'Ornate crown (mukut) & Urdhva Pundra tilak',
      'Four-armed iconography holding Shankha and Chakra',
      'Gleaming silk gold finish with high-precision layer fidelity',
      'Stable integrated circular display pedestal',
    ],
    idealPlacement: 'Home Mandir Altar, Pooja Shelf, Living Room Showcase',
    availableFinishes: [
      { key: 'gold-leaf', label: 'Silk Gold Finish', priceDelta: 0 },
      { key: 'antique-brass', label: 'Antique Gold Patina', priceDelta: 0 },
      { key: 'hand-painted', label: 'Hand-Detailed Accents', priceDelta: 0 },
    ],
    availableScales: [
      { key: '120mm', label: '120mm Compact', priceDelta: 0 },
      { key: '160mm', label: '160mm Standard', priceDelta: 0 },
      { key: '200mm (Grand Altar)', label: '200mm Grand', priceDelta: 0 },
    ],
  },
  {
    id: 'fig-02',
    name: 'BAL GANESHA WITH SHIVLING',
    subtitle: 'Golden & Black Little Ganesha Embracing Sacred Shiva Lingam',
    category: 'god-idols',
    categoryLabel: 'Sacred God Idol',
    edition: 'Divine Gold Edition • In Stock',
    price: 999,
    basePrice: 999,
    image: '/src/assets/images/ganesha_shivling_idol.png',
    src: '/src/assets/images/ganesha_shivling_idol.png',
    bg: '#D84A1B',
    panel: '#E65D30',
    dimensions: '110mm × 70mm × 70mm',
    printTech: 'High-Precision Multi-Tone SLA Resin & Filament',
    layerHeight: '0.025 mm (25 microns)',
    weight: '160g solid core with pedestal',
    leadTime: 'Ready in Stock • Dispatches in 24 Hours',
    description:
      'Adorable Bal Ganesha affectionately holding the sacred Shiva Lingam in both hands. Crafted with glossy black hair detailing and a shimmering metallic gold body.',
    available: true,
    featured: true,
    highlights: [
      'Cute Bal Ganesha hugging holy Shiva Lingam',
      'Dual-tone metallic gold body with deep black hair',
      'Perfect size for car dashboard, office desk, or pooja altar',
      'Weighted pedestal base for vibration-resistant stability',
    ],
    idealPlacement: 'Car Dashboard, Work Desk, Mandir Altar',
    availableFinishes: [
      { key: 'gold-leaf', label: 'Classic Gold & Black Finish', priceDelta: 0 },
      { key: 'antique-brass', label: 'Antique Patina Brass', priceDelta: 0 },
      { key: 'hand-painted', label: 'Hand-Detailed Accents', priceDelta: 0 },
    ],
    availableScales: [
      { key: '75mm (Car Dashboard)', label: '75mm Dashboard', priceDelta: 0 },
      { key: '120mm', label: '120mm Standard', priceDelta: 0 },
      { key: '160mm', label: '160mm Grand', priceDelta: 0 },
    ],
  },
  {
    id: 'fig-03',
    name: 'GODDESS MAHALAKSHMI',
    subtitle: 'Pristine White Lotus Murti • Goddess of Wealth & Prosperity',
    category: 'god-idols',
    categoryLabel: 'Sacred God Idol',
    edition: 'Pure White Sacred Series • In Stock',
    price: 1499,
    basePrice: 1499,
    image: '/src/assets/images/lakshmi_lotus_idol.png',
    src: '/src/assets/images/lakshmi_lotus_idol.png',
    bg: '#B8235A',
    panel: '#D43973',
    dimensions: '130mm × 90mm × 85mm',
    printTech: 'Pristine White High-Density SLA Marble Resin',
    layerHeight: '0.020 mm (20 microns)',
    weight: '195g weighted lotus base',
    leadTime: 'Ready in Stock • Dispatches in 24 Hours',
    description:
      'Exquisite 3D printed murti of Goddess Mahalakshmi seated peacefully in padmasana upon an intricately sculpted blooming lotus flower, holding lotus blossoms and pouring prosperity coins.',
    available: true,
    featured: true,
    highlights: [
      'Detailed multi-petal blooming lotus pedestal',
      'Four-armed posture with coin pot & Abhaya mudra',
      'Pristine matte marble-like white resin finish',
      'Washable, fade-resistant pooja sculpture',
    ],
    idealPlacement: 'Home Mandir Altar, Diwali Pooja, Prosperity Gift',
    availableFinishes: [
      { key: 'pure-marble-white', label: 'Pristine Marble White', priceDelta: 0 },
      { key: 'gold-leaf', label: 'White with Gold Leaf', priceDelta: 0 },
      { key: 'hand-painted', label: 'Hand Detailed', priceDelta: 0 },
    ],
    availableScales: [
      { key: '120mm', label: '120mm Compact', priceDelta: 0 },
      { key: '130mm (Home Mandir)', label: '130mm Standard', priceDelta: 0 },
      { key: '200mm (Grand Altar)', label: '200mm Grand', priceDelta: 0 },
    ],
  },
  {
    id: 'fig-04',
    name: 'BAL KRISHNA WITH FLUTE',
    subtitle: 'Golden Laddu Gopal with Bansuri & Butter Matki',
    category: 'god-idols',
    categoryLabel: 'Sacred God Idol',
    edition: 'Divine Gold Edition • In Stock',
    price: 1199,
    basePrice: 1199,
    image: '/src/assets/images/bal_krishna_flute_idol.png',
    src: '/src/assets/images/bal_krishna_flute_idol.png',
    bg: '#0284C7',
    panel: '#0EA5E9',
    dimensions: '120mm × 80mm × 75mm',
    printTech: 'Ultra-Fine Gold Luster 3D Resin & Filament',
    layerHeight: '0.025 mm (25 microns)',
    weight: '170g solid core',
    leadTime: 'Ready in Stock • Dispatches in 24 Hours',
    description:
      'Joyful Little Krishna (Makhan Chor) playing the sweet melody of the golden flute, wearing a mukut adorned with a peacock feather, seated beside his beloved overflowing pot of butter.',
    available: true,
    featured: true,
    highlights: [
      'Detailed flute (bansuri) and butter pot (matki)',
      'Ornate peacock feather (mor pankh) turban detail',
      'Radiant golden luster with warm tonal depth',
      'Ideal sacred gift for Janmashtami, housewarming & pooja',
    ],
    idealPlacement: 'Home Mandir, Children Room, Pooja Shelf',
    availableFinishes: [
      { key: 'gold-leaf', label: 'Radiant Silk Gold', priceDelta: 0 },
      { key: 'antique-brass', label: 'Antique Patina Finish', priceDelta: 0 },
      { key: 'hand-painted', label: 'Hand-Detailed Accents', priceDelta: 0 },
    ],
    availableScales: [
      { key: '75mm (Car Dashboard)', label: '75mm Compact', priceDelta: 0 },
      { key: '120mm', label: '120mm Standard', priceDelta: 0 },
      { key: '160mm', label: '160mm Grand', priceDelta: 0 },
    ],
  },
];

export function readOrders(): OrderRecord[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as OrderRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((o) => ({
      ...o,
      status: normalizeOrderStatus(o.status),
    }));
  } catch (err) {
    console.error('Error reading orders DB:', err);
    return [];
  }
}

// Local JSON files act as a fast synchronous cache. Firestore is the durable
// source of truth: the cache is rebuilt from it on startup (hydrateFromFirestore)
// and every mutation is written through to it before the request completes.
export function writeOrders(orders: OrderRecord[]): void {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(orders, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing orders DB:', err);
    throw err;
  }
}

// ==========================================
// FIRESTORE PERSISTENCE
// ==========================================

type SyncedCollection = 'orders' | 'products';

const FIRESTORE_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${FIRESTORE_TIMEOUT_MS}ms`)), FIRESTORE_TIMEOUT_MS)
    ),
  ]);
}

// Firestore rejects `undefined` values, so strip them before saving.
function toFirestoreData<T>(record: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(record));
}

// Never throws: a Firestore outage must not break the storefront, but it is logged loudly.
async function saveDoc(collection: SyncedCollection, id: string, record: unknown): Promise<void> {
  if (!adminDb) return;
  try {
    await withTimeout(adminDb.collection(collection).doc(id).set(toFirestoreData(record)), `Firestore save ${collection}/${id}`);
  } catch (err) {
    console.error(`[persistence] Failed to save ${collection}/${id} to Firestore:`, err);
  }
}

async function removeDoc(collection: SyncedCollection, id: string): Promise<void> {
  if (!adminDb) return;
  try {
    await withTimeout(adminDb.collection(collection).doc(id).delete(), `Firestore delete ${collection}/${id}`);
  } catch (err) {
    console.error(`[persistence] Failed to delete ${collection}/${id} from Firestore:`, err);
  }
}

async function hydrateCollection<T extends { id: string }>(
  collection: SyncedCollection,
  readLocal: () => T[],
  writeLocal: (records: T[]) => void,
  sortRecords: (records: T[], local: T[]) => T[]
): Promise<void> {
  const snapshot = await withTimeout(adminDb!.collection(collection).get(), `Firestore load ${collection}`);
  const local = readLocal();

  if (snapshot.empty) {
    // First run against an empty database: seed it from the local files.
    await Promise.all(local.map((record) => saveDoc(collection, record.id, record)));
    console.log(`[persistence] Seeded Firestore ${collection} with ${local.length} local record(s)`);
    return;
  }

  const remote = snapshot.docs.map((doc) => ({ ...(doc.data() as T), id: doc.id }));
  writeLocal(sortRecords(remote, local));
  console.log(`[persistence] Loaded ${remote.length} ${collection} from Firestore`);
}

/**
 * Rebuilds the local cache from Firestore. Call once before the server starts
 * accepting requests, so a fresh Cloud Run container serves the real data
 * instead of the files baked into the image.
 */
export async function hydrateFromFirestore(): Promise<void> {
  if (!adminDb) {
    console.warn('[persistence] Firestore unavailable; using local JSON files only (data will not survive restarts)');
    return;
  }

  try {
    await hydrateCollection<OrderRecord>('orders', readOrders, writeOrders, (remote) =>
      // Newest first, matching how createOrder inserts.
      remote.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    );
  } catch (err) {
    console.error('[persistence] Could not load orders from Firestore; using local file:', err);
  }

  try {
    await hydrateCollection<ProductRecord>('products', readProducts, writeProducts, (remote, local) => {
      // Keep the existing catalog order; products added later go at the end.
      const position = new Map(local.map((p, i) => [p.id, i]));
      return remote.sort(
        (a, b) => (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity) || a.id.localeCompare(b.id)
      );
    });
  } catch (err) {
    console.error('[persistence] Could not load products from Firestore; using local file:', err);
  }
}

export function generateTrackingId(): string {
  // Ensure non-collision
  const orders = readOrders();
  const existingIds = new Set(orders.map((o) => o.trackingId));
  let candidate = '';
  do {
    const num = Math.floor(100000 + Math.random() * 900000);
    candidate = `TH-3D-${num}`;
  } while (existingIds.has(candidate));
  return candidate;
}

export function formatIndianPhoneNumber(phone: string): string {
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
}

export function matchPhoneNumbers(inputPhone: string, storedPhone?: string): boolean {
  if (!inputPhone || !storedPhone) return false;
  const cleanInput = inputPhone.replace(/[\s\-\(\)\+]/g, '');
  const cleanStored = storedPhone.replace(/[\s\-\(\)\+]/g, '');

  if (!cleanInput || !cleanStored) return false;
  if (cleanInput === cleanStored) return true;

  // Compare 10-digit Indian mobile numbers
  const input10 = cleanInput.length >= 10 ? cleanInput.slice(-10) : cleanInput;
  const stored10 = cleanStored.length >= 10 ? cleanStored.slice(-10) : cleanStored;

  if (input10.length === 10 && stored10.length === 10) {
    return input10 === stored10;
  }

  return false;
}

export async function createOrder(data: Omit<OrderRecord, 'id' | 'trackingId' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'status'> & {
  status?: OrderStatus;
}): Promise<OrderRecord> {
  const orders = readOrders();
  const now = new Date().toISOString();
  const trackingId = generateTrackingId();
  const id = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const status: OrderStatus = data.status
    ? normalizeOrderStatus(data.status)
    : (data.hasCustomJob ? 'Pending Quote' : 'Confirmed');

  const initialNote =
    status === 'Pending Quote'
      ? 'Custom 3D print request submitted for studio quote & review'
      : 'Order confirmed & placed by customer';

  const newOrder: OrderRecord = {
    ...data,
    phone: data.phone ? formatIndianPhoneNumber(data.phone) : undefined,
    id,
    trackingId,
    status,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      {
        orderId: id,
        type: status === 'Pending Quote' ? 'ORDER_CREATED' : 'CONFIRMED',
        status,
        timestamp: now,
        note: initialNote,
      },
    ],
  };

  orders.unshift(newOrder);
  writeOrders(orders);
  await saveDoc('orders', newOrder.id, newOrder);
  return newOrder;
}

export function getOrderById(id: string): OrderRecord | null {
  const orders = readOrders();
  return orders.find((o) => o.id === id) || null;
}

export function getOrderByTrackingId(trackingId: string): OrderRecord | null {
  const orders = readOrders();
  const normalized = trackingId.trim().toUpperCase();
  return orders.find((o) => o.trackingId.toUpperCase() === normalized) || null;
}

export async function updateOrderStatus(id: string, status: string, note?: string): Promise<OrderRecord | null> {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  const currentOrder = orders[index];
  const canonical = normalizeOrderStatus(status);
  const history = currentOrder.statusHistory || [];
  const lastEvent = history.length > 0 ? history[history.length - 1] : null;

  // Double-submission protection: if status is already set and last event matches, return current
  if (currentOrder.status === canonical && lastEvent && lastEvent.status === canonical) {
    return currentOrder;
  }

  const now = new Date().toISOString();
  let noteText = note;
  let type = 'STATUS_CHANGED';

  if (!noteText) {
    switch (canonical) {
      case 'Pending Quote':
        type = 'PENDING_QUOTE';
        noteText = 'Order status updated to Pending Quote';
        break;
      case 'Quote Sent':
        type = 'QUOTE_SENT';
        noteText = currentOrder.quoteAmount
          ? `Quote sent: ₹${currentOrder.quoteAmount.toLocaleString('en-IN')}`
          : 'Quote provided to customer';
        break;
      case 'Confirmed':
        type = 'CONFIRMED';
        noteText = 'Order confirmed by admin';
        break;
      case 'In Production':
        type = 'IN_PRODUCTION';
        noteText = 'Order moved to In Production';
        break;
      case 'Shipped':
        type = 'SHIPPED';
        noteText = 'Order marked as Shipped & dispatched';
        break;
      case 'Completed':
        type = 'COMPLETED';
        noteText = 'Order delivered & completed successfully';
        break;
      case 'Cancelled':
        type = 'CANCELLED';
        noteText = 'Order cancelled by admin';
        break;
      default:
        type = 'STATUS_CHANGED';
        noteText = `Status updated to ${canonical} by admin`;
    }
  }

  const updated: OrderRecord = {
    ...currentOrder,
    status: canonical,
    updatedAt: now,
    statusHistory: [
      ...history,
      {
        orderId: id,
        type,
        status: canonical,
        timestamp: now,
        note: noteText,
      },
    ],
  };

  orders[index] = updated;
  writeOrders(orders);
  await saveDoc('orders', updated.id, updated);
  return updated;
}

export async function updateOrderQuote(id: string, quoteAmount: number): Promise<OrderRecord | null> {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  const currentOrder = orders[index];
  const now = new Date().toISOString();
  const prevQuote = currentOrder.quoteAmount;
  const history = currentOrder.statusHistory || [];
  const lastEvent = history.length > 0 ? history[history.length - 1] : null;

  // Double-submission protection: if same quote amount already applied, prevent duplicate events
  if (prevQuote === quoteAmount && lastEvent && (lastEvent.type === 'QUOTE_SENT' || lastEvent.type === 'QUOTE_UPDATED')) {
    return currentOrder;
  }

  const isUpdate = prevQuote != null && prevQuote > 0 && prevQuote !== quoteAmount;
  const eventStatus: OrderStatus = isUpdate ? 'Quote Updated' : 'Quote Sent';
  const eventType = isUpdate ? 'QUOTE_UPDATED' : 'QUOTE_SENT';
  const eventNote = isUpdate
    ? `Quote changed from ₹${prevQuote.toLocaleString('en-IN')} to ₹${quoteAmount.toLocaleString('en-IN')}`
    : `Quote provided: ₹${quoteAmount.toLocaleString('en-IN')}`;

  const updated: OrderRecord = {
    ...currentOrder,
    quoteAmount,
    quoteUpdatedAt: now,
    total: quoteAmount + (currentOrder.shipping || 0),
    status: 'Quote Sent',
    updatedAt: now,
    statusHistory: [
      ...history,
      {
        orderId: id,
        type: eventType,
        status: eventStatus,
        timestamp: now,
        note: eventNote,
      },
    ],
  };

  orders[index] = updated;
  writeOrders(orders);
  await saveDoc('orders', updated.id, updated);
  return updated;
}

export async function confirmOrderByTrackingId(trackingId: string, note?: string): Promise<OrderRecord | null> {
  const orders = readOrders();
  const index = orders.findIndex(
    (o) => o.trackingId.toLowerCase() === trackingId.trim().toLowerCase()
  );
  if (index === -1) return null;

  const currentOrder = orders[index];
  const history = currentOrder.statusHistory || [];
  const lastEvent = history.length > 0 ? history[history.length - 1] : null;

  // Double-submission protection: if already confirmed and last event is CONFIRMED, return current
  if (currentOrder.status === 'Confirmed' && lastEvent && lastEvent.status === 'Confirmed') {
    return currentOrder;
  }

  const now = new Date().toISOString();
  const noteText = note || 'Order confirmed by customer';

  const updated: OrderRecord = {
    ...currentOrder,
    status: 'Confirmed',
    updatedAt: now,
    statusHistory: [
      ...history,
      {
        orderId: currentOrder.id,
        type: 'CONFIRMED',
        status: 'Confirmed',
        timestamp: now,
        note: noteText,
      },
    ],
  };

  orders[index] = updated;
  writeOrders(orders);
  await saveDoc('orders', updated.id, updated);
  return updated;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return false;

  orders.splice(index, 1);
  writeOrders(orders);
  await removeDoc('orders', id);
  return true;
}

// ==========================================
// CANONICAL PRODUCT DATABASE OPERATIONS
// ==========================================

export function readProducts(): ProductRecord[] {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(INITIAL_PRODUCTS, null, 2), 'utf-8');
      return INITIAL_PRODUCTS;
    }
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as ProductRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(INITIAL_PRODUCTS, null, 2), 'utf-8');
      return INITIAL_PRODUCTS;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading products DB:', err);
    return INITIAL_PRODUCTS;
  }
}

export function writeProducts(products: ProductRecord[]): void {
  try {
    const tempFile = `${PRODUCTS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(products, null, 2), 'utf-8');
    fs.renameSync(tempFile, PRODUCTS_FILE);
  } catch (err) {
    console.error('Error writing products DB:', err);
    throw err;
  }
}

export function getAllProducts(): ProductRecord[] {
  return readProducts();
}

export function getProductRecordById(id: string): ProductRecord | null {
  const products = readProducts();
  return products.find((p) => p.id === id) || null;
}

export async function createProduct(data: Partial<ProductRecord>): Promise<ProductRecord> {
  const products = readProducts();
  const id = (data.id && data.id.trim()) || `prod-${Date.now()}`;
  const price = typeof data.price === 'number' ? data.price : parseFloat(data.price as any) || 0;

  const newProduct: ProductRecord = {
    id,
    name: (data.name || 'Untitled Product').trim(),
    subtitle: data.subtitle?.trim() || '',
    category: (data.category || 'god-idols').trim(),
    categoryLabel: data.categoryLabel?.trim() || (data.category === 'god-idols' ? 'Sacred God Idol' : 'Figurine'),
    edition: data.edition?.trim() || 'Standard Edition • In Stock',
    price,
    basePrice: price,
    image: data.image || '/src/assets/images/balaji_golden_idol.png',
    src: data.src || data.image || '/src/assets/images/balaji_golden_idol.png',
    bg: data.bg || '#C97A1E',
    panel: data.panel || '#D98A2C',
    dimensions: data.dimensions || '120mm × 80mm × 75mm',
    printTech: data.printTech || '8K SLA Precision Resin',
    layerHeight: data.layerHeight || '0.025 mm (25 microns)',
    weight: data.weight || '160g solid core',
    leadTime: data.leadTime || 'Ready in Stock • Dispatches in 24 Hours',
    description: (data.description || '').trim(),
    available: data.available !== false,
    featured: !!data.featured,
    highlights: Array.isArray(data.highlights) && data.highlights.length > 0
      ? data.highlights
      : [
          'High precision photopolymer resin construction',
          'Smooth surface finish with microscopic detail capture',
          'Vibration-damped and display ready',
        ],
    idealPlacement: data.idealPlacement || 'Pooja Altar, Work Desk, Living Room Showcase',
    availableFinishes: data.availableFinishes || [
      { key: 'gold-leaf', label: 'Silk Gold Finish', priceDelta: 0 },
      { key: 'antique-brass', label: 'Antique Patina Brass', priceDelta: 0 },
      { key: 'hand-painted', label: 'Hand-Detailed Accents', priceDelta: 0 },
    ],
    availableScales: data.availableScales || [
      { key: '75mm (Car Dashboard)', label: '75mm Compact', priceDelta: 0 },
      { key: '120mm', label: '120mm Standard', priceDelta: 0 },
      { key: '160mm', label: '160mm Grand', priceDelta: 0 },
    ],
  };

  products.push(newProduct);
  writeProducts(products);
  await saveDoc('products', newProduct.id, newProduct);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<ProductRecord>): Promise<ProductRecord | null> {
  const products = readProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = products[index];
  const price = updates.price !== undefined
    ? (typeof updates.price === 'number' ? updates.price : parseFloat(updates.price as any) || current.price)
    : current.price;

  const updated: ProductRecord = {
    ...current,
    ...updates,
    id: current.id, // ID is immutable canonical identifier
    price,
    basePrice: price,
    image: updates.image || current.image,
    src: updates.image || updates.src || current.src || current.image,
    featured: updates.featured !== undefined ? !!updates.featured : current.featured,
    available: updates.available !== undefined ? !!updates.available : current.available,
  };

  products[index] = updated;
  writeProducts(products);
  await saveDoc('products', updated.id, updated);
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = readProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  writeProducts(filtered);
  await removeDoc('products', id);
  return true;
}
