export interface EditableImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  isHover: boolean;
}

export interface ColourDef {
  name: string;
  hex: string;
  family: string;
}

export interface VariantCell {
  id?: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  isActive: boolean;
  imageUrl: string | null;
}

export interface ProductFormInitial {
  id?: string;
  title: string;
  slug: string;
  sku: string;
  subtitle: string;
  description: string;
  price: string;
  compareAtPrice: string;
  gender: 'men' | 'women' | 'unisex';
  categoryId: string;
  collectionId: string;
  material: string;
  care: string;
  fitInfo: string;
  craftsmanshipNotes: string;
  shippingInfo: string;
  seoTitle: string;
  seoDescription: string;
  isNewArrival: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  status: 'draft' | 'active' | 'archived';
  relatedSlugs: string[];
  images: EditableImage[];
  colours: ColourDef[];
  sizes: string[];
  cells: Record<string, VariantCell>;
}

export const EMPTY_PRODUCT: ProductFormInitial = {
  title: '',
  slug: '',
  sku: '',
  subtitle: '',
  description: '',
  price: '',
  compareAtPrice: '',
  gender: 'men',
  categoryId: '',
  collectionId: '',
  material: '',
  care: '',
  fitInfo: '',
  craftsmanshipNotes: '',
  shippingInfo: '',
  seoTitle: '',
  seoDescription: '',
  isNewArrival: true,
  isFeatured: false,
  isBestseller: false,
  status: 'draft',
  relatedSlugs: [],
  images: [],
  colours: [],
  sizes: [],
  cells: {},
};

