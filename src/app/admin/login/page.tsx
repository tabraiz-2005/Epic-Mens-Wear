import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/admin/auth';
import { isSupabaseConfigured } from '@/lib/env';
import { Notice } from '@/components/admin/FormBits';
import { LoginForm } from './LoginForm';
import { AuthShell } from '@/components/admin/AuthShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string; reset?: string }> }) {
  const sp = await searchParams;
  if (!isSupabaseConfigured()) {
    return (
      <AuthShell title="Setup needed">
        <div className="w-full max-w-[420px]">
          <Notice kind="error">
            Supabase is not connected. Add <b>NEXT_PUBLIC_SUPABASE_URL</b>, <b>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</b> and{' '}
            <b>SUPABASE_SECRET_KEY</b> in Vercel → Project → Settings → Environment Variables, then redeploy.
          </Notice>
        </div>
      </AuthShell>
    );
  }
  if (!sp.denied && (await getAdminUser())) redirect('/admin');
  return (
    <AuthShell title="Sign in">
      <LoginForm
        next={sp.next}
        notice={
          sp.denied ? 'Your session has ended or this account has no admin access. Please sign in.' : sp.reset === 'failed' ? 'That reset link has expired. Request a new one.' : undefined
        }
      />
    </AuthShell>
  );
}
