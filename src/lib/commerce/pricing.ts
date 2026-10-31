import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StoreSettings } from './types';
import { formatCents } from '@/lib/utils';

export type ShippingMethod = 'standard' | 'express';

export interface DiscountRow {
  code: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  usage_limit: number | null;
  times_used: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

/** Returns { amount } in cents, or { error } explaining why the code can't be used. */
export async function evaluateDiscount(
  admin: SupabaseClient,
  rawCode: string,
  subtotalCents: number
): Promise<{ code: string; amount: number; label: string } | { error: string }> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { error: 'Enter a code.' };
  const { data, error } = await admin.from('discount_codes').select('*').eq('code', code).maybeSingle();
  if (error) {
    console.error('[discount] lookup failed', error);
    return { error: 'Could not check this code right now.' };
  }
  const d = data as DiscountRow | null;
  const now = Date.now();
  if (!d || !d.is_active) return { error: 'This code is not valid.' };
  if (d.starts_at && new Date(d.starts_at).getTime() > now) return { error: 'This code is not active yet.' };
  if (d.ends_at && new Date(d.ends_at).getTime() < now) return { error: 'This code has expired.' };
  if (d.usage_limit !== null && d.times_used >= d.usage_limit) return { error: 'This code has reached its usage limit.' };
  if (subtotalCents < d.min_subtotal)
    return { error: `This code needs a minimum spend of ${formatCents(d.min_subtotal)}.` };

  const amount =
    d.discount_type === 'percent'
      ? Math.round((subtotalCents * Math.min(100, d.value)) / 100)
      : Math.min(d.value, subtotalCents);
  const label = d.discount_type === 'percent' ? `${d.value}% off` : `${formatCents(d.value)} off`;
  return { code, amount, label };
}

export function shippingCost(settings: StoreSettings, method: ShippingMethod, subtotalAfterDiscountCents: number) {
  if (method === 'express') return settings.express_shipping_amount;
  if (settings.free_shipping_threshold !== null && subtotalAfterDiscountCents >= settings.free_shipping_threshold) return 0;
  return settings.standard_shipping_amount;
}
