'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin, assertAdmin, fail, type ActionResult } from '@/lib/admin/auth';
import { env } from '@/lib/env';

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === 'string' ? next : '';
  return n.startsWith('/admin') && !n.startsWith('//') ? n : '/admin';
}

export async function signIn(_: unknown, form: FormData): Promise<ActionResult> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { ok: false, error: 'Enter your email and password.' };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return {
        ok: false,
        error:
          error?.message === 'Invalid login credentials'
            ? 'Wrong email or password. First time here? Use “Create owner account”.'
            : error?.message ?? 'Sign-in failed.',
      };
    }
    const admin = await checkAdmin(data.user.id, email);
    if (!admin) {
      await supabase.auth.signOut();
      return { ok: false, error: 'This account does not have admin access.' };
    }
  } catch (e) {
    return fail(e);
  }
  redirect(safeNext(form.get('next')));
}

/** First-run: create the owner login for an email listed in ADMIN_EMAILS. */
export async function createOwnerAccount(_: unknown, form: FormData): Promise<ActionResult> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  if (!env.adminEmails.length)
    return { ok: false, error: 'ADMIN_EMAILS is not set. Add your email to it in Vercel → Settings → Environment Variables, then redeploy.' };
  if (!env.adminEmails.includes(email)) return { ok: false, error: 'This email is not listed in ADMIN_EMAILS.' };
  if (password.length < 8) return { ok: false, error: 'Use a password of at least 8 characters.' };
  try {
    const { error } = await getSupabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      if (/already|registered|exists/i.test(error.message))
        return { ok: false, error: 'An account with this email already exists — sign in instead, or use “Forgot password”.' };
      return { ok: false, error: error.message };
    }
    const supabase = await createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signErr) return { ok: false, error: signErr.message };
  } catch (e) {
    return fail(e);
  }
  redirect('/admin');
}

export async function sendPasswordReset(_: unknown, form: FormData): Promise<ActionResult> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'Enter your email.' };
  try {
    const h = await headers();
    const origin = h.get('origin') ?? env.siteUrl;
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/admin/auth/callback?next=/admin/account`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: 'If that email has an admin account, a reset link is on its way.' };
  } catch (e) {
    return fail(e);
  }
}

export async function changePassword(_: unknown, form: FormData): Promise<ActionResult> {
  const password = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');
  if (password.length < 8) return { ok: false, error: 'Use at least 8 characters.' };
  if (password !== confirm) return { ok: false, error: 'The passwords don’t match.' };
  try {
    await assertAdmin();
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: 'Password updated.' };
  } catch (e) {
    return fail(e);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
