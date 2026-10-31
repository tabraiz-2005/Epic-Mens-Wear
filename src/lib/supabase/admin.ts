import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, ConfigError, isPlaceholder } from '@/lib/env';

let client: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS — only ever use on the server,
 * after checking the caller is allowed to do what they ask.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const missing: string[] = [];
  if (isPlaceholder(env.supabaseUrl)) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (isPlaceholder(env.supabaseSecretKey)) missing.push('SUPABASE_SECRET_KEY');
  if (missing.length) throw new ConfigError(missing);
  client = createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
