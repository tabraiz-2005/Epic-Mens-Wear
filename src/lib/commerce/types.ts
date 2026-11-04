export type Gender = 'women' | 'men' | 'unisex';
export type ColorFamily =
  | 'neutral'
  | 'brown'
  | 'black'
  | 'white'
  | 'blue'
  | 'grey'
  | 'green'
  | 'red'
  | 'beige';

export const COLOR_FAMILIES: ColorFamily[] = [
  'black',
  'grey',
  'white',
  'beige',
  'neutral',
  'brown',
  'blue',
  'green',
  'red',
];

export interface ProductImage {
  url: string;
  alt: string;
  width: number;
  height: number;
  isPrimary?: boolean;
  isHover?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  color: string;
  colorHex: string;
  colorFamily: ColorFamily;
  size: string;
  inStock: boolean;
  inventoryQuantity: number;
  price: number;
  compareAtPrice?: number;
  image?: string;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  category: string;
  categoryName: string;
  collection: string | null;
  collectionName: string | null;
  gender: Gender;
  material: string;
  images: ProductImage[];
  variants: ProductVariant[];
  availableColors: { name: string; hex: string }[];
  availableSizes: string[];
  careInstructions: string[];
  craftsmanshipNotes: string;
  fitInfo: string;
  shippingInfo: string;
  seoTitle: string;
  seoDescription: string;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  relatedProductSlugs?: string[];
  completeTheLookSlugs?: string[];
  totalStock: number;
}

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  gender: 'women' | 'men' | 'all';
  description: string;
  heroImage: string;
  itemCount: number;
}

export interface CollectionItem {
  id: string;
  slug: string;
  name: string;
  season: string;
  description: string;
  storyQuote: string;
  heroImage: string;
  featuredProductsCount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  variantId: string;
  title: string;
  category?: string;
  color: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
  maxQuantity: number;
}

export interface WishlistItem {
  productId: string;
  productSlug: string;
  title: string;
  category: string;
  price: number;
  image: string;
  addedAt: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  announcement_enabled: boolean;
  announcement_text: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  /** Optional tall photo used on phones instead of hero_image_url. */
  hero_image_mobile_url: string | null;
  /** Which part of a wide hero photo phones keep: left, center or right. */
  /** Where phones crop the wide hero photo: 0 (left edge) to 100 (right edge), or left/center/right. */
  hero_focus: string;
  hero_cta_label: string;
  hero_cta_href: string;
  standard_shipping_amount: number; // cents
  express_shipping_amount: number; // cents
  free_shipping_threshold: number | null; // cents
  low_stock_threshold: number;
  contact_email: string;
  contact_phone: string | null;
  contact_phone_2: string | null;
  address: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  opening_hours: string | null;
  google_maps_url: string | null;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'Epic Menswear',
  tagline: 'Dressed for every occasion',
  announcement_enabled: true,
  announcement_text: 'Free shipping on US orders over $150 · Visit us at Eastridge Center, San Jose',
  hero_eyebrow: 'Suits · Shirts · Shoes',
  hero_title: 'Sharp Looks, Epic Moments',
  hero_subtitle: 'Formal suits, dress shirts, formal and casual shoes, and the accessories that finish the look.',
  hero_image_url: null,
  hero_image_mobile_url: null,
  hero_focus: 'center',
  hero_cta_label: 'Shop menswear',
  hero_cta_href: '/men',
  standard_shipping_amount: 899, // $8.99
  express_shipping_amount: 1999, // $19.99
  free_shipping_threshold: 15000, // $150
  low_stock_threshold: 5,
  contact_email: 'info@epicmenswear.com', // PLACEHOLDER: change in Admin → Store settings
  contact_phone: null, // PLACEHOLDER: add the store phone in Admin → Store settings
  contact_phone_2: null,
  address: '2200 Eastridge Loop Ste 2066, San Jose, CA 95122, United States',
  instagram_url: null, // PLACEHOLDER
  tiktok_url: null,
  opening_hours: null, // PLACEHOLDER, e.g. 'Mon–Sat 10am–9pm · Sun 11am–7pm'
  google_maps_url: null,
};
