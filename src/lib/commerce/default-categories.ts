import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

/**
 * The store's standard menu (keep in sync with supabase/parts/06_categories.sql).
 * Missing ones are created automatically; edits made in the admin are kept.
 */
export const DEFAULT_CATEGORIES = [
  { slug: 'formal-suits', name: 'Formal Suits', gender: 'men', description: 'Two-piece, three-piece, double-breasted and tuxedo suits.' },
  { slug: 'formal-shirts', name: 'Formal Shirts', gender: 'men', description: 'Dress shirts, French cuff and tuxedo shirts.' },
  { slug: 'formal-shoes', name: 'Formal Shoes', gender: 'men', description: 'Oxfords, loafers and patent tuxedo shoes.' },
  { slug: 'casual-shoes', name: 'Casual Shoes', gender: 'men', description: 'Leather sneakers, boots and driving loafers.' },
  { slug: 'accessories', name: 'Accessories', gender: 'men', description: 'Ties, bow ties, belts, pocket squares and cufflinks.' },
] as const;

const ORDER = new Map<string, number>(DEFAULT_CATEGORIES.map((c, i) => [c.slug, i]));
export const menuOrder = (slug: string) => ORDER.get(slug) ?? 100;

let ensured: Promise<boolean> | null = null;

/** Adds any standard category that is missing (runs once per server). Returns true if anything was added. */
export function ensureDefaultCategories(existing: string[]): Promise<boolean> {
  const missing = DEFAULT_CATEGORIES.filter((c) => !existing.includes(c.slug));
  if (!missing.length || !env.supabaseSecretKey) return Promise.resolve(false);
  if (!ensured) {
    ensured = (async () => {
      try {
        const { error } = await getSupabaseAdmin()
          .from('categories')
          .upsert(
            missing.map((c) => ({ ...c, sort_order: menuOrder(c.slug) + 1, is_active: true })),
            { onConflict: 'slug', ignoreDuplicates: true }
          );
        if (error) {
          console.warn('[catalog] Could not add standard categories:', error.message);
          return false;
        }
        return true;
      } catch (e) {
        console.warn('[catalog] Could not add standard categories:', (e as Error).message);
        return false;
      }
    })();
  }
  return ensured;
}
