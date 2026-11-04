'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { assertAdmin, fail, type ActionResult } from '@/lib/admin/auth';
import { slugify } from '@/lib/utils';
import type { StoreSettings } from '@/lib/commerce/types';

const refresh = () => revalidatePath('/', 'layout');

/* ----------------------------- Inventory -------------------------------- */

export async function updateStock(changes: { id: string; stock: number; isActive?: boolean }[]): Promise<ActionResult> {
  try {
    await assertAdmin();
    const admin = getSupabaseAdmin();
    for (const c of changes.slice(0, 500)) {
      const patch: Record<string, unknown> = { inventory_quantity: Math.max(0, Math.floor(Number(c.stock) || 0)) };
      if (typeof c.isActive === 'boolean') patch.is_active = c.isActive;
      const { error } = await admin.from('product_variants').update(patch).eq('id', c.id);
      if (error) throw error;
    }
    refresh();
    return { ok: true, message: `Updated ${changes.length} variant${changes.length === 1 ? '' : 's'}.` };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------ Categories & collections ----------------------- */

export interface TaxonomyPayload {
  id?: string;
  kind: 'categories' | 'collections';
  name: string;
  slug: string;
  description: string;
  heroImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  gender?: 'all' | 'men' | 'women';
  season?: string;
  storyQuote?: string;
}

export async function saveTaxonomy(p: TaxonomyPayload): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin();
    if (!['categories', 'collections'].includes(p.kind)) throw new Error('Invalid type.');
    const name = p.name.trim();
    if (!name) return { ok: false, error: 'Enter a name.' };
    const slug = slugify(p.slug || name);
    const row: Record<string, unknown> = {
      name,
      slug,
      description: p.description?.trim() || null,
      hero_image_url: p.heroImageUrl || null,
      sort_order: Math.floor(Number(p.sortOrder) || 0),
      is_active: Boolean(p.isActive),
    };
    if (p.kind === 'categories') row.gender = ['all', 'men', 'women'].includes(p.gender ?? '') ? p.gender : 'all';
    else {
      row.season = p.season?.trim() || null;
      row.story_quote = p.storyQuote?.trim() || null;
    }
    const admin = getSupabaseAdmin();
    const q = p.id ? admin.from(p.kind).update(row).eq('id', p.id).select('id').single() : admin.from(p.kind).insert(row).select('id').single();
    const { data, error } = await q;
    if (error) throw error;
    refresh();
    return { ok: true, data: { id: data.id }, message: 'Saved.' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTaxonomy(kind: 'categories' | 'collections', id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    if (!['categories', 'collections'].includes(kind)) throw new Error('Invalid type.');
    const { error } = await getSupabaseAdmin().from(kind).delete().eq('id', id);
    if (error) throw error;
    refresh();
    return { ok: true, message: 'Deleted. Products in it are now uncategorised.' };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------ Discounts -------------------------------- */

export interface DiscountPayload {
  id?: string;
  code: string;
  description: string;
  type: 'percent' | 'fixed';
  value: number; // percent, or dollars for fixed
  minSubtotal: number; // dollars
  usageLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export async function saveDiscount(p: DiscountPayload): Promise<ActionResult> {
  try {
    await assertAdmin();
    const code = p.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9_-]{2,40}$/.test(code)) return { ok: false, error: 'Codes use 2–40 letters, numbers, dashes or underscores.' };
    const value = p.type === 'percent' ? Math.round(Number(p.value)) : Math.round(Number(p.value) * 100);
    if (!(value > 0) || (p.type === 'percent' && value > 100)) return { ok: false, error: p.type === 'percent' ? 'Percent must be 1–100.' : 'Enter an amount.' };
    const row = {
      code,
      description: p.description?.trim() || null,
      discount_type: p.type,
      value,
      min_subtotal: Math.max(0, Math.round(Number(p.minSubtotal || 0) * 100)),
      usage_limit: p.usageLimit && p.usageLimit > 0 ? Math.floor(p.usageLimit) : null,
      starts_at: p.startsAt || null,
      ends_at: p.endsAt || null,
      is_active: Boolean(p.isActive),
    };
    const admin = getSupabaseAdmin();
    const { error } = p.id ? await admin.from('discount_codes').update(row).eq('id', p.id) : await admin.from('discount_codes').insert(row);
    if (error) throw error;
    revalidatePath('/admin/discounts');
    return { ok: true, message: 'Saved.' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteDiscount(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const { error } = await getSupabaseAdmin().from('discount_codes').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/discounts');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------- Settings -------------------------------- */

export async function saveSettings(s: Partial<StoreSettings>): Promise<ActionResult> {
  try {
    await assertAdmin();
    const cents = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
    const text = (v: unknown, fallback = '') => (typeof v === 'string' ? v.trim() : fallback);
    const url = (v: unknown) => {
      const t = text(v);
      return t ? (/^https?:\/\//.test(t) ? t : `https://${t}`) : null;
    };
    const row = {
      store_name: text(s.store_name) || 'Epic Menswear',
      tagline: text(s.tagline),
      announcement_enabled: Boolean(s.announcement_enabled),
      announcement_text: text(s.announcement_text),
      hero_eyebrow: text(s.hero_eyebrow),
      hero_title: text(s.hero_title) || 'Sharp Looks, Epic Moments',
      hero_subtitle: text(s.hero_subtitle),
      hero_image_url: text(s.hero_image_url) || null,
      hero_image_mobile_url: text(s.hero_image_mobile_url) || null,
      hero_focus: normalizeFocus(s.hero_focus),
      hero_cta_label: text(s.hero_cta_label) || 'Shop the collection',
      hero_cta_href: text(s.hero_cta_href).startsWith('/') ? text(s.hero_cta_href) : '/shop',
      standard_shipping_amount: cents(s.standard_shipping_amount),
      express_shipping_amount: cents(s.express_shipping_amount),
      free_shipping_threshold: s.free_shipping_threshold === null || s.free_shipping_threshold === undefined ? null : cents(s.free_shipping_threshold),
      low_stock_threshold: Math.max(0, Math.floor(Number(s.low_stock_threshold) || 0)),
      contact_email: text(s.contact_email),
      contact_phone: text(s.contact_phone) || null,
      contact_phone_2: text(s.contact_phone_2) || null,
      address: text(s.address) || null,
      instagram_url: url(s.instagram_url),
      tiktok_url: url(s.tiktok_url),
      opening_hours: text(s.opening_hours) || null,
      google_maps_url: url(s.google_maps_url),
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.contact_email)) return { ok: false, error: 'Enter a valid contact email.' };
    // If the database is missing a newer column (setup.sql not re-run yet),
    // save everything else instead of failing, and say which field was skipped.
    const payload: Record<string, unknown> = { id: 1, ...row };
    const skipped: string[] = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      const { error } = await getSupabaseAdmin().from('store_settings').upsert(payload);
      if (!error) break;
      const missing = /could not find the '([a-z0-9_]+)' column/i.exec(error.message)?.[1];
      if (!missing || !(missing in payload) || missing === 'id') throw error;
      delete payload[missing];
      skipped.push(missing);
    }
    refresh();
    if (skipped.length) {
      return {
        ok: true,
        message: `Saved, except ${skipped.join(', ')}: run supabase/setup.sql in Supabase once to enable ${skipped.length > 1 ? 'these fields' : 'this field'}.`,
      };
    }
    return { ok: true, message: 'Settings saved — the store is updated.' };
  } catch (e) {
    return fail(e);
  }
}

/* --------------------------------- Team ---------------------------------- */

export async function addTeamMember(email: string, password: string, role: 'owner' | 'staff'): Promise<ActionResult> {
  try {
    await assertAdmin('owner');
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, error: 'Enter a valid email.' };
    if (password.length < 8) return { ok: false, error: 'Temporary password must be at least 8 characters.' };
    const admin = getSupabaseAdmin();
    let userId: string | undefined;
    const { data: created, error } = await admin.auth.admin.createUser({ email: e, password, email_confirm: true });
    if (error) {
      if (!/already|registered|exists/i.test(error.message)) throw error;
      // Existing auth user — look them up and grant access.
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        userId = data.users.find((u) => u.email?.toLowerCase() === e)?.id;
        if (!data.users.length) break;
      }
      if (!userId) throw error;
    } else userId = created.user.id;
    const { error: insErr } = await admin.from('admin_users').upsert({ user_id: userId, email: e, role: role === 'owner' ? 'owner' : 'staff' });
    if (insErr) throw insErr;
    revalidatePath('/admin/team');
    return { ok: true, message: `${e} can now sign in at /admin.` };
  } catch (e) {
    return fail(e);
  }
}

export async function removeTeamMember(userId: string): Promise<ActionResult> {
  try {
    const me = await assertAdmin('owner');
    if (me.id === userId) return { ok: false, error: 'You can’t remove yourself.' };
    const { error } = await getSupabaseAdmin().from('admin_users').delete().eq('user_id', userId);
    if (error) throw error;
    revalidatePath('/admin/team');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** 0–100 (percent from the left edge of the photo), stored as text. */
function normalizeFocus(v: unknown): string {
  if (v === 'left') return '20';
  if (v === 'right') return '80';
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? String(n) : '50';
}
