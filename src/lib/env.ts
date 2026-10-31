/**
 * Central place for environment variables (server-side only).
 *
 * Every setting accepts several spellings, so the store works whether the
 * variables were added in Vercel as NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL or
 * SUPABASEURL, etc. Values are read at request time, so changing them in
 * Vercel only needs a redeploy — no code change.
 */
function pick(...names: string[]): string {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  return '';
}

export const env = {
  get supabaseUrl() {
    return pick('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASEURL', 'NEXTPUBLICSUPABASEURL').replace(/\/+$/, '');
  },
  get supabasePublicKey() {
    return pick(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_ANON_KEY',
      'SUPABASEPUBLISHABLEKEY',
      'NEXTPUBLICSUPABASEPUBLISHABLEKEY',
      'SUPABASEANONKEY'
    );
  },
  get supabaseSecretKey() {
    return pick('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASESECRETKEY', 'SUPABASESERVICEROLEKEY');
  },
  get stripeSecretKey() {
    return pick('STRIPE_SECRET_KEY', 'STRIPESECRETKEY');
  },
  get stripeWebhookSecret() {
    return pick('STRIPE_WEBHOOK_SECRET', 'STRIPEWEBHOOKSECRET');
  },
  get adminEmails(): string[] {
    return pick('ADMIN_EMAILS', 'ADMINEMAILS')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  },
  get siteUrl() {
    const explicit = pick('NEXT_PUBLIC_SITE_URL', 'SITE_URL', 'SITEURL');
    if (explicit) return explicit;
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    return vercel ? `https://${vercel}` : 'http://localhost:3000';
  },
};

/** True for values still copied from .env.example (e.g. "https://YOUR-PROJECT.supabase.co", "sb_publishable_..."). */
export function isPlaceholder(value: string) {
  return !value || /YOUR-PROJECT|\.\.\.$|^sb_(publishable|secret)_\.*$|^sk_test_\.*$|^whsec_\.*$/i.test(value);
}

export function isSupabaseConfigured() {
  return !isPlaceholder(env.supabaseUrl) && !isPlaceholder(env.supabasePublicKey);
}

export class ConfigError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. ` +
        'Add them in Vercel → Project → Settings → Environment Variables, then redeploy.'
    );
    this.name = 'ConfigError';
  }
}
