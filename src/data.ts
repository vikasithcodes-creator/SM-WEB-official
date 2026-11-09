import { Product, ReviewItem, CartItem } from './types';
import balajiImg from './assets/images/balaji_golden_idol.png';
import ganeshaShivlingImg from './assets/images/ganesha_shivling_idol.png';
import lakshmiLotusImg from './assets/images/lakshmi_lotus_idol.png';
import krishnaFluteImg from './assets/images/bal_krishna_flute_idol.png';

/**
 * =========================================================================
 * SINGLE SOURCE OF TRUTH (CANONICAL PRODUCT DATABASE)
 * =========================================================================
 * Every product across the entire store (Homepage Hero, Product Catalog,
 * Product Details / Specs Modal, Quick Add, and Cart) reads from this array.
 *
 * Each canonical product record contains at minimum:
 * - id
 * - name
 * - category
 * - price (the single canonical price for hero, catalog, modals & cart)
 * - image
 * - description
 * - available (boolean: true = in-stock/orderable)
 * - featured (boolean: true = appears dynamically in homepage hero carousel)
 * =========================================================================
 */
export const PRODUCTS: Product[] = [
  {
    id: 'fig-01',
    name: 'LORD VENKATESWARA (BALAJI)',
    subtitle: 'Golden Divine Standing Murti • Blessing & Prosperity Idol',
    category: 'god-idols',
    categoryLabel: 'Sacred God Idol',
    edition: 'Divine Gold Edition • In Stock',
    price: 1499,
    basePrice: 1499,
    image: balajiImg,
    src: balajiImg,
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
    image: ganeshaShivlingImg,
    src: ganeshaShivlingImg,
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
    image: lakshmiLotusImg,
    src: lakshmiLotusImg,
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
    image: krishnaFluteImg,
    src: krishnaFluteImg,
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

/**
 * =========================================================================
 * DYNAMIC DERIVED COLLECTIONS
 * =========================================================================
 */
// Unified catalog - points to the same canonical PRODUCTS
export const ALL_PRODUCTS: Product[] = PRODUCTS;

/**
 * Helper to dynamically pull all active products for the homepage hero carousel.
 * Every product added to PRODUCTS is automatically included in the home hero page,
 * ensuring complete 1:1 synchronization between hero and catalog.
 */
export const getFeaturedProducts = (source: Product[] = PRODUCTS): Product[] => {
  const list = Array.isArray(source) && source.length > 0 ? source : PRODUCTS;
  const active = list.filter((p) => p.available !== false);
  return active.length > 0 ? active : list;
};

// Hero Carousel dynamically pulls all catalog products
export const HERO_PRODUCTS: Product[] = getFeaturedProducts(PRODUCTS);

/**
 * Normalizes any category string (slug or display label)
 */
export const normalizeCategory = (cat: string): string => {
  const c = (cat || '').toLowerCase().trim();
  if (!c || c === 'all' || c === 'all products') return 'all';
  if (c === 'god-idols' || c.includes('god') || c.includes('sacred') || c.includes('murti')) return 'god-idols';
  if (c === 'figurines' || c.includes('figurin') || c.includes('divine') || c.includes('art')) return 'figurines';
  if (c === 'accessories' || c.includes('accessor') || c.includes('gaming')) return 'accessories';
  if (c === 'custom-prints' || c.includes('custom')) return 'custom-prints';
  return c;
};

/**
 * Filter products dynamically using the canonical collection
 */
export const filterProductsByCategory = (source: Product[], category: string): Product[] => {
  const target = normalizeCategory(category);
  if (target === 'all') return source;
  return source.filter((p) => {
    const pCat = normalizeCategory(p.category);
    return pCat === target || (p.category && p.category.toLowerCase() === category.toLowerCase());
  });
};

/**
 * Unified search querying the canonical product collection
 */
export const searchProducts = (source: Product[], query: string): Product[] => {
  if (!query || !query.trim()) return source;
  const q = query.toLowerCase().trim();
  return source.filter((p) => {
    const nameMatch = p.name.toLowerCase().includes(q);
    const catMatch = (p.category && p.category.toLowerCase().includes(q)) ||
                     (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q));
    const descMatch = p.description && p.description.toLowerCase().includes(q);
    const subMatch = p.subtitle && p.subtitle.toLowerCase().includes(q);
    const techMatch = p.printTech && p.printTech.toLowerCase().includes(q);
    const highlightMatch = p.highlights && p.highlights.some((h) => h.toLowerCase().includes(q));
    return nameMatch || catMatch || descMatch || subMatch || techMatch || highlightMatch;
  });
};

/**
 * Resolves a product record by ID from the canonical product collection
 */
export const getCanonicalProduct = (source: Product[] = PRODUCTS, idOrFigurineId?: string): Product | undefined => {
  if (!idOrFigurineId) return undefined;
  const list = Array.isArray(source) && source.length > 0 ? source : PRODUCTS;
  return list.find((p) => p.id === idOrFigurineId);
};

/**
 * Authoritative single price resolution for cart items:
 * Always fetches the canonical price from the product record.
 */
export const getCartItemPrice = (item: CartItem, source: Product[] = PRODUCTS): number => {
  const targetId = item.figurineId || item.id;
  const list = Array.isArray(source) && source.length > 0 ? source : PRODUCTS;
  const canonical = list.find((p) => p.id === targetId);
  if (canonical) {
    return canonical.price;
  }
  return item.price;
};

/**
 * Authoritative name resolution for cart items
 */
export const getCartItemName = (item: CartItem, source: Product[] = PRODUCTS): string => {
  const targetId = item.figurineId || item.id;
  const list = Array.isArray(source) && source.length > 0 ? source : PRODUCTS;
  const canonical = list.find((p) => p.id === targetId);
  return canonical ? canonical.name : item.name;
};

/**
 * Authoritative image resolution for cart items
 */
export const getCartItemImage = (item: CartItem, source: Product[] = PRODUCTS): string => {
  const targetId = item.figurineId || item.id;
  const list = Array.isArray(source) && source.length > 0 ? source : PRODUCTS;
  const canonical = list.find((p) => p.id === targetId);
  return canonical ? (canonical.image || canonical.src) : (item.src || '');
};

/**
 * Computes live subtotal by referencing authoritative product prices
 */
export const calculateCartSubtotal = (cart: CartItem[], source: Product[] = PRODUCTS): number => {
  if (!Array.isArray(cart)) return 0;
  const list = Array.isArray(source) && source.length > 0 ? source : PRODUCTS;
  return cart.reduce((sum, item) => {
    const price = getCartItemPrice(item, list);
    return sum + price * item.quantity;
  }, 0);
};

// Backwards-compatible aliases
export const IMAGES: Product[] = HERO_PRODUCTS;
export const GOD_IDOLS: Product[] = PRODUCTS.filter((p) => p.category === 'god-idols');
export const ACCESSORIES: Product[] = PRODUCTS.filter((p) => p.category === 'accessories');

// Customer Reviews (Clean array for genuine customer reviews)
export const REVIEWS: ReviewItem[] = [];

export const TECH_SPECS = [
  {
    title: '12K & 8K SLA Photopolymer Precision',
    description:
      'Sub-20 micron layer resolution captures sacred jewelry filigree, meditative facial calmness, and fine mechanical grooves with zero stepping.',
    stat: '20μm',
    statLabel: 'Layer Precision',
  },
  {
    title: 'Incense, Heat & UV Inert Curing',
    description:
      'God idols and dashboard accessories receive a proprietary thermal-resistant UV barrier that protects against automotive dashboard heat and temple incense smoke.',
    stat: '90°C',
    statLabel: 'Thermal Resistance',
  },
  {
    title: 'Armored Vault Safe Packaging',
    description:
      'Custom contour-cut high-density EVA foam protects delicate modaks, flutes, tridents, and gaming controller prongs during transit worldwide.',
    stat: '100%',
    statLabel: 'Zero-Break Guarantee',
  },
];
