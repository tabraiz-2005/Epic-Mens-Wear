import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sortSizes } from '@/lib/commerce/catalog';
import { EMPTY_PRODUCT, type ProductFormInitial } from '@/components/admin/product-types';
import type { VariantCell } from '@/components/admin/product-types';

export async function loadFormOptions() {
  const admin = getSupabaseAdmin();
  const [{ data: categories }, { data: collections }, { data: products }] = await Promise.all([
    admin.from('categories').select('id, name').order('sort_order'),
    admin.from('collections').select('id, name').order('sort_order'),
    admin.from('products').select('slug, title').neq('status', 'archived').order('title'),
  ]);
  return { categories: categories ?? [], collections: collections ?? [], allProducts: products ?? [] };
}

export async function loadProductForForm(id: string): Promise<ProductFormInitial | null> {
  const { data: p, error } = await getSupabaseAdmin()
    .from('products')
    .select('*, product_images(*), product_variants(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!p) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variants = (p.product_variants ?? []).filter((v: any) => !String(v.size).startsWith('retired-'));
  const colours: ProductFormInitial['colours'] = [];
  const cells: Record<string, VariantCell> = {};
  for (const v of variants) {
    if (!colours.some((c) => c.name === v.color)) colours.push({ name: v.color, hex: v.color_hex, family: v.color_family });
    cells[`${v.color}__${v.size}`] = {
      id: v.id,
      sku: v.sku,
      price: Number(v.price) === Number(p.price) ? '' : String(Number(v.price)),
      compareAtPrice: v.compare_at_price ? String(Number(v.compare_at_price)) : '',
      stock: String(v.inventory_quantity),
      isActive: v.is_active,
      imageUrl: v.image_url,
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sizes = sortSizes(Array.from(new Set(variants.map((v: any) => v.size as string))));
  // Fill holes in the colour × size grid as inactive so nothing appears that didn't exist.
  for (const c of colours)
    for (const s of sizes)
      cells[`${c.name}__${s}`] ??= { sku: '', price: '', compareAtPrice: '', stock: '0', isActive: false, imageUrl: null };

  const images = [...(p.product_images ?? [])]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.position - b.position)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((i: any) => ({ url: i.url, alt: i.alt_text === p.title ? '' : i.alt_text, isPrimary: i.is_primary, isHover: i.is_hover }));

  return {
    ...EMPTY_PRODUCT,
    id: p.id,
    title: p.title,
    slug: p.slug,
    sku: p.sku,
    subtitle: p.subtitle ?? '',
    description: p.description ?? '',
    price: String(Number(p.price)),
    compareAtPrice: p.compare_at_price ? String(Number(p.compare_at_price)) : '',
    gender: p.gender,
    categoryId: p.category_id ?? '',
    collectionId: p.collection_id ?? '',
    material: p.material ?? '',
    care: (p.care_instructions ?? []).join('\n'),
    fitInfo: p.fit_info ?? '',
    craftsmanshipNotes: p.craftsmanship_notes ?? '',
    shippingInfo: p.shipping_info ?? '',
    seoTitle: p.seo_title ?? '',
    seoDescription: p.seo_description ?? '',
    isNewArrival: p.is_new_arrival,
    isFeatured: p.is_featured,
    isBestseller: p.is_bestseller,
    status: p.status,
    relatedSlugs: p.related_product_slugs ?? [],
    images,
    colours,
    sizes,
    cells,
  };
}
