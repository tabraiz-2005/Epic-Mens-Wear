'use server';

import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type NewsletterState = { ok: boolean; message: string } | null;

/** Footer newsletter sign-up. Saves the email to the `newsletter_subscribers` table (see supabase/parts/08_newsletter.sql). */
export async function subscribeToNewsletter(_: NewsletterState, form: FormData): Promise<NewsletterState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 254);
  if (form.get('company')) return { ok: true, message: 'Thank you for subscribing.' }; // honeypot
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Please enter a valid email address.' };
  try {
    const { error } = await getSupabaseAdmin()
      .from('newsletter_subscribers')
      .upsert({ email, source: 'footer' }, { onConflict: 'email', ignoreDuplicates: true });
    if (error) {
      console.error('[newsletter]', error.message);
      return { ok: false, message: 'Sign-ups are not open yet. Please try again soon.' };
    }
    return { ok: true, message: 'Thank you. You are now on the list.' };
  } catch (e) {
    console.error('[newsletter]', e);
    return { ok: false, message: 'Sign-ups are not open yet. Please try again soon.' };
  }
}
