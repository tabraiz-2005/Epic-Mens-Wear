import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { env, isPlaceholder, isSupabaseConfigured } from '@/lib/env';

export const BUCKET = 'product-images';

export interface Check {
  label: string;
  ok: boolean;
  fix?: string;
}

export async function runHealthChecks(): Promise<Check[]> {
  const checks: Check[] = [
    { label: 'Supabase URL & public key', ok: isSupabaseConfigured(), fix: 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.' },
    { label: 'Supabase secret key', ok: !isPlaceholder(env.supabaseSecretKey), fix: 'Set SUPABASE_SECRET_KEY (Supabase → Project Settings → API keys → secret).' },
    {
      label: 'Payments',
      ok: true,
      fix: 'Card payments run through Stripe. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to enable checkout.',
    },
  ];
  if (isPlaceholder(env.supabaseSecretKey) || isPlaceholder(env.supabaseUrl)) return checks;
  const admin = getSupabaseAdmin();
  const [settings, discounts, bucket] = await Promise.all([
    admin.from('store_settings').select('id').limit(1),
    admin.from('discount_codes').select('id').limit(1),
    admin.storage.getBucket(BUCKET),
  ]);
  checks.push({
    label: 'Database tables',
    ok: !settings.error && !discounts.error,
    fix: 'Open Supabase → SQL Editor, paste supabase/setup.sql and press Run.',
  });
  checks.push({
    label: 'Image storage bucket',
    ok: !bucket.error && Boolean(bucket.data),
    fix: 'Run supabase/setup.sql (it creates the "product-images" bucket), or upload one image — the portal creates it automatically.',
  });
  return checks;
}
