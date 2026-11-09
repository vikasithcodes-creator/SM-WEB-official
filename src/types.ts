export type ProductCategory = 'god-idols' | 'accessories' | 'custom-prints' | 'figurines' | 'home-decor';

export type FinishOption =
  | 'unpainted'
  | 'primer'
  | 'hand-painted'
  | 'antique-brass'
  | 'pure-marble-white'
  | 'gold-leaf'
  | 'stealth-black'
  | 'cyber-neon'
  | 'stone-finish';

export type ScaleOption =
  | '4 inches'
  | '6 inches'
  | '8 inches'
  | '10 inches'
  | '12 inches'
  | '75mm (Car Dashboard)'
  | '120mm'
  | '130mm (Home Mandir)'
  | '160mm'
  | '200mm (Grand Altar)'
  | '220mm'
  | 'Standard Controller Fit'
  | 'Dual Controller Mount';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string;
  description: string;
  available: boolean;
  featured: boolean;

  // Unified visual, crafting and presentation attributes
  src: string; // alias to image for visual consumers
  gallery?: string[]; // extra photo angles shown in the product modal (first entry = main image)
  basePrice?: number; // backwards-compatible alias to price
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
  recommendedFinish?: FinishOption;
  availableFinishes?: { key: FinishOption; label: string; priceDelta: number }[];
  availableScales?: { key: ScaleOption; label: string; priceDelta: number }[];
  accessoryCompatibility?: string; // e.g., 'PS5 DualSense / DualSense Edge / Xbox Series X / Switch Pro'
  idealPlacement?: string; // e.g. 'Pooja Altar / Car Dashboard / Gaming Setup'
}

export type FigurineItem = Product;

export type CarouselRole = 'center' | 'left' | 'right' | 'back';

export type NavigationDirection = 'next' | 'prev';

export interface CartItem {
  id: string;
  figurineId?: string;
  name: string;
  category?: ProductCategory;
  src?: string;
  price: number;
  quantity: number;
  finish: string;
  scale: string;
  isCustomJob?: boolean;
  rawFile?: File;
  customDetails?: {
    fileName: string;
    tech: string;
    infill: number;
    material: string;
    dimensions: string;
    customEngraving?: string;
  };
}

export interface ReviewItem {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  figurineName: string;
  category: ProductCategory;
  comment: string;
  verified: boolean;
}
