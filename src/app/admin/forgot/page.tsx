'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { sendPasswordReset } from '../_actions/auth';
import { Field, Notice, SubmitButton } from '@/components/admin/FormBits';

export default function ForgotPage() {
  const [state, action] = useActionState(sendPasswordReset, null);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <p className="font-display text-xl font-bold uppercase tracking-logo">Epic Menswear</p>
        <h1 className="display mt-6 text-4xl">Reset password</h1>
        <form action={action} className="mt-8 space-y-4">
          {state && (state.ok ? <Notice kind="success">{state.message}</Notice> : <Notice kind="error">{state.error}</Notice>)}
          <Field label="Email">
            <input name="email" type="email" required className="field" />
          </Field>
          <SubmitButton className="w-full" pendingText="Sending…">Send reset link</SubmitButton>
        </form>
        <Link href="/admin/login" className="mt-5 inline-block text-xs text-muted underline underline-offset-4 hover:text-fg">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
