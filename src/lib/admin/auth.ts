import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

export interface AdminUser {
  id: string;
  email: string;
  role: 'owner' | 'staff';
}

export async function checkAdmin(userId: string, email: string): Promise<AdminUser | null> {
  const e = email.toLowerCase();
  if (env.adminEmails.includes(e)) return { id: userId, email: e, role: 'owner' };
  try {
    const { data } = await getSupabaseAdmin()
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) return { id: userId, email: e, role: data.role === 'owner' ? 'owner' : 'staff' };
  } catch (err) {
    console.error('[admin] role lookup failed', err);
  }
  return null;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    return checkAdmin(user.id, user.email);
  } catch {
    return null;
  }
}

/** For pages: redirects to the login screen when the visitor isn't an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login?denied=1');
  return admin;
}

/** For server actions: throws when the caller isn't an admin. */
export async function assertAdmin(role?: 'owner'): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) throw new Error('Not authorised. Please sign in again.');
  if (role === 'owner' && admin.role !== 'owner') throw new Error('Only an owner can do this.');
  return admin;
}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

export function fail(e: unknown): { ok: false; error: string } {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : 'Something went wrong.';
  console.error('[admin action]', e);
  return { ok: false, error: friendlyDbError(msg) };
}

function friendlyDbError(msg: string) {
  if (/products_slug_key/.test(msg)) return 'Another product already uses this URL slug.';
  if (/products_sku_key/.test(msg)) return 'Another product already uses this SKU.';
  if (/product_variants_sku_key/.test(msg)) return 'A variant SKU is already used by another product. Change the SKU.';
  if (/product_variants_product_id_color_size_key/.test(msg)) return 'Two variants have the same colour and size.';
  if (/categories_slug_key/.test(msg)) return 'Another category already uses this slug.';
  if (/collections_slug_key/.test(msg)) return 'Another collection already uses this slug.';
  if (/discount_codes_code_key/.test(msg)) return 'A discount with this code already exists.';
  if (/check constraint/.test(msg) && /slug/.test(msg)) return 'Slugs can only contain lowercase letters, numbers and dashes.';
  if (/relation .* does not exist|Could not find the table/.test(msg))
    return 'The database is not set up yet. Run supabase/setup.sql in the Supabase SQL editor.';
  return msg;
}
