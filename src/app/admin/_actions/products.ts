'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { assertAdmin, fail, type ActionResult } from '@/lib/admin/auth';
import { COLOR_FAMILIES } from '@/lib/commerce/types';
import { slugify } from '@/lib/utils';

export interface ProductPayload {
  id?: string;
  title: string;
  slug: string;
  sku: string;
  subtitle: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  gender: 'men' | 'women' | 'unisex';
  categoryId: string | null;
  collectionId: string | null;
  material: string;
  careInstructions: string[];
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
  images: { url: string; alt: string; isPrimary: boolean; isHover: boolean }[];
  variants: {
    id?: string;
    color: string;
    colorHex: string;
    colorFamily: string;
    size: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    isActive: boolean;
    imageUrl: string | null;
  }[];
}

const money = (n: unknown) => {
  const v = Math.round(Number(n) * 100) / 100;
  return Number.isFinite(v) && v >= 0 ? v : NaN;
};

function refresh(slug?: string) {
  revalidatePath('/', 'layout');
  if (slug) revalidatePath(`/products/${slug}`);
}

export async function saveProduct(p: ProductPayload): Promise<ActionResult<{ id: string; slug: string; variantIds: Record<string, string> }>> {
  try {
    await assertAdmin();
    const admin = getSupabaseAdmin();

    const title = p.title?.trim();
    if (!title) return { ok: false, error: 'Give the product a name.' };
    const slug = slugify(p.slug || title);
    if (!slug) return { ok: false, error: 'The URL slug is empty.' };
    const sku = (p.sku || slug).trim().toUpperCase().replace(/\s+/g, '-').slice(0, 60);
    const price = money(p.price);
    if (Number.isNaN(price)) return { ok: false, error: 'Enter a valid price.' };
    const compare = p.compareAtPrice ? money(p.compareAtPrice) : null;
    if (compare !== null && (Number.isNaN(compare) || compare < price))
      return { ok: false, error: '“Compare at” price must be higher than the price (it shows as a strikethrough).' };
    if (!p.description?.trim()) return { ok: false, error: 'Add a description.' };
    if (p.status === 'active' && p.variants.filter((v) => v.isActive).length === 0)
      return { ok: false, error: 'Add at least one colour and size before publishing.' };

    // Validate variants.
    const seen = new Set<string>();
    const skus = new Set<string>();
    const variants = p.variants.map((v) => {
      const color = v.color.trim();
      const size = v.size.trim();
      if (!color || !size) throw new Error('Every variant needs a colour and a size.');
      const key = `${color.toLowerCase()}|${size.toLowerCase()}`;
      if (seen.has(key)) throw new Error(`Duplicate variant: ${color} / ${size}.`);
      seen.add(key);
      const vsku = (v.sku || `${sku}-${color.slice(0, 3)}-${size}`).trim().toUpperCase().replace(/\s+/g, '-');
      if (skus.has(vsku)) throw new Error(`Two variants share the SKU ${vsku}.`);
      skus.add(vsku);
      const vprice = money(v.price || price);
      if (Number.isNaN(vprice)) throw new Error(`Invalid price for ${color} / ${size}.`);
      const vcompare = v.compareAtPrice ? money(v.compareAtPrice) : compare;
      const stock = Math.max(0, Math.floor(Number(v.stock) || 0));
      return {
        id: v.id,
        name: `${color} / ${size}`,
        color,
        color_hex: /^#[0-9a-f]{6}$/i.test(v.colorHex) ? v.colorHex : '#1A1A1A',
        color_family: COLOR_FAMILIES.includes(v.colorFamily as never) ? v.colorFamily : 'neutral',
        size,
        sku: vsku,
        price: vprice,
        compare_at_price: vcompare !== null && vcompare > vprice ? vcompare : null,
        inventory_quantity: stock,
        is_active: Boolean(v.isActive),
        image_url: v.imageUrl || null,
      };
    });

    const row = {
      title,
      slug,
      sku,
      subtitle: p.subtitle?.trim() || null,
      description: p.description.trim(),
      price,
      compare_at_price: compare,
      currency: 'USD',
      gender: ['men', 'women', 'unisex'].includes(p.gender) ? p.gender : 'men',
      category_id: p.categoryId || null,
      collection_id: p.collectionId || null,
      material: p.material?.trim() || null,
      care_instructions: (p.careInstructions ?? []).map((c) => c.trim()).filter(Boolean),
      fit_info: p.fitInfo?.trim() || null,
      craftsmanship_notes: p.craftsmanshipNotes?.trim() || null,
      shipping_info: p.shippingInfo?.trim() || null,
      seo_title: p.seoTitle?.trim() || null,
      seo_description: p.seoDescription?.trim() || null,
      is_new_arrival: Boolean(p.isNewArrival),
      is_featured: Boolean(p.isFeatured),
      is_bestseller: Boolean(p.isBestseller),
      related_product_slugs: (p.relatedSlugs ?? []).filter((s) => s && s !== slug),
      status: p.status,
    };

    let id = p.id;
    let previousSlug: string | undefined;
    if (id) {
      const { data: existing, error: exErr } = await admin.from('products').select('slug, status, published_at').eq('id', id).single();
      if (exErr) throw exErr;
      previousSlug = existing.slug;
      const published_at = row.status === 'active' && !existing.published_at ? new Date().toISOString() : existing.published_at;
      const { error } = await admin.from('products').update({ ...row, published_at }).eq('id', id);
      if (error) throw error;
    } else {
      const { data, error } = await admin
        .from('products')
        .insert({ ...row, published_at: row.status === 'active' ? new Date().toISOString() : null })
        .select('id')
        .single();
      if (error) throw error;
      id = data.id as string;
    }

    // Images: replace the set (nothing else references product_images).
    const { error: delImgErr } = await admin.from('product_images').delete().eq('product_id', id);
    if (delImgErr) throw delImgErr;
    const images = p.images.filter((i) => i.url);
    const hasPrimary = images.some((i) => i.isPrimary);
    if (images.length) {
      const { error } = await admin.from('product_images').insert(
        images.map((img, i) => ({
          product_id: id,
          url: img.url,
          alt_text: img.alt?.trim() || title,
          position: i,
          is_primary: hasPrimary ? img.isPrimary : i === 0,
          is_hover: img.isHover,
        }))
      );
      if (error) throw error;
    }

    // Variants: delete removed (or deactivate if they have order history), update kept, insert new.
    const { data: current, error: curErr } = await admin.from('product_variants').select('id').eq('product_id', id);
    if (curErr) throw curErr;
    const keep = new Set(variants.filter((v) => v.id).map((v) => v.id));
    const removed = (current ?? []).map((v) => v.id as string).filter((vid) => !keep.has(vid));
    for (const vid of removed) {
      const { error } = await admin.from('product_variants').delete().eq('id', vid);
      if (error) {
        // Referenced by past orders — keep the row but hide it, and free its colour/size key.
        const { error: e2 } = await admin
          .from('product_variants')
          .update({ is_active: false, inventory_quantity: 0, size: `retired-${vid.slice(0, 8)}`, sku: `RETIRED-${vid.slice(0, 8)}` })
          .eq('id', vid);
        if (e2) throw e2;
      }
    }
    for (const v of variants.filter((x) => x.id)) {
      const { id: vid, ...rest } = v;
      const { error } = await admin.from('product_variants').update(rest).eq('id', vid!).eq('product_id', id);
      if (error) throw error;
    }
    const fresh = variants.filter((x) => !x.id).map(({ id: _omit, ...rest }) => ({ ...rest, product_id: id }));
    if (fresh.length) {
      const { error } = await admin.from('product_variants').insert(fresh);
      if (error) throw error;
    }

    const { data: saved, error: savedErr } = await admin.from('product_variants').select('id, color, size').eq('product_id', id);
    if (savedErr) throw savedErr;
    const variantIds: Record<string, string> = {};
    for (const v of saved ?? []) variantIds[`${v.color}__${v.size}`] = v.id;

    refresh(slug);
    if (previousSlug && previousSlug !== slug) refresh(previousSlug);
    return { ok: true, data: { id: id!, slug, variantIds }, message: 'Product saved.' };
  } catch (e) {
    return fail(e);
  }
}

export async function setProductStatus(id: string, status: 'draft' | 'active' | 'archived'): Promise<ActionResult> {
  try {
    await assertAdmin();
    const admin = getSupabaseAdmin();
    const patch: Record<string, unknown> = { status };
    if (status === 'active') {
      const { data } = await admin.from('products').select('published_at').eq('id', id).single();
      if (!data?.published_at) patch.published_at = new Date().toISOString();
    }
    const { error } = await admin.from('products').update(patch).eq('id', id);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProduct(id: string): Promise<ActionResult<{ archived: boolean }>> {
  try {
    await assertAdmin();
    const admin = getSupabaseAdmin();
    const { error } = await admin.from('products').delete().eq('id', id);
    if (error) {
      // Has order history (inventory reservations reference its variants) → archive instead.
      const { error: e2 } = await admin.from('products').update({ status: 'archived' }).eq('id', id);
      if (e2) throw e2;
      refresh();
      return { ok: true, data: { archived: true }, message: 'This product has order history, so it was archived instead of deleted.' };
    }
    refresh();
    return { ok: true, data: { archived: false } };
  } catch (e) {
    return fail(e);
  }
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin();
    const admin = getSupabaseAdmin();
    const { data: src, error } = await admin
      .from('products')
      .select('*, product_images(*), product_variants(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    const suffix = Math.random().toString(36).slice(2, 6);
    const {
      id: _id,
      legacy_id: _l,
      created_at: _c,
      updated_at: _u,
      published_at: _p,
      product_images: imgs,
      product_variants: vars,
      ...rest
    } = src;
    const { data: copy, error: insErr } = await admin
      .from('products')
      .insert({ ...rest, title: `${src.title} (copy)`, slug: `${src.slug}-copy-${suffix}`, sku: `${src.sku}-C${suffix}`.toUpperCase(), status: 'draft' })
      .select('id')
      .single();
    if (insErr) throw insErr;
    if (imgs?.length) {
      await admin.from('product_images').insert(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imgs.map(({ id: _i, created_at: _ca, product_id: _pid, ...r }: any) => ({ ...r, product_id: copy.id }))
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeVars = (vars ?? []).filter((v: any) => !String(v.size).startsWith('retired-'));
    if (activeVars.length) {
      const { error: vErr } = await admin.from('product_variants').insert(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeVars.map(({ id: _i, legacy_id: _lg, created_at: _ca, updated_at: _ua, product_id: _pid, ...r }: any) => ({
          ...r,
          sku: `${r.sku}-C${suffix}`.toUpperCase(),
          inventory_quantity: 0,
          product_id: copy.id,
        }))
      );
      if (vErr) throw vErr;
    }
    return { ok: true, data: { id: copy.id }, message: 'Duplicated as a draft (stock set to 0).' };
  } catch (e) {
    return fail(e);
  }
}
