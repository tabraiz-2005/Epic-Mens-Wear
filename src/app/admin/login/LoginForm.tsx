'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { createOwnerAccount, signIn } from '../_actions/auth';
import { Field, Notice, SubmitButton } from '@/components/admin/FormBits';
import { cn } from '@/lib/utils';

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [signInState, signInAction] = useActionState(signIn, null);
  const [createState, createAction] = useActionState(createOwnerAccount, null);
  const state = mode === 'signin' ? signInState : createState;

  return (
    <div className="w-full max-w-[420px]">
      <div className="grid grid-cols-2 border border-line">
        {(['signin', 'create'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn('h-11 font-display text-[11px] uppercase tracking-label', mode === m ? 'bg-brand font-bold text-brand-ink' : 'text-muted hover:text-fg')}
          >
            {m === 'signin' ? 'Sign in' : 'Create owner account'}
          </button>
        ))}
      </div>

      <form action={mode === 'signin' ? signInAction : createAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next ?? ''} />
        {notice && !state && <Notice kind="info">{notice}</Notice>}
        {state && !state.ok && <Notice kind="error">{state.error}</Notice>}
        {mode === 'create' && (
          <Notice kind="info">
            For first-time setup. Your email must be listed in the <code className="font-mono text-xs">ADMIN_EMAILS</code> environment variable.
          </Notice>
        )}
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className="field" />
        </Field>
        <Field label={mode === 'create' ? 'Choose a password (8+ characters)' : 'Password'}>
          <input
            name="password"
            type="password"
            required
            minLength={mode === 'create' ? 8 : undefined}
            autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
            className="field"
          />
        </Field>
        <SubmitButton className="w-full" pendingText={mode === 'signin' ? 'Signing in…' : 'Creating account…'}>
          {mode === 'signin' ? 'Sign in' : 'Create account & sign in'}
        </SubmitButton>
      </form>
      {mode === 'signin' && (
        <Link href="/admin/forgot" className="mt-5 inline-block text-xs text-muted underline underline-offset-4 hover:text-fg">
          Forgot password?
        </Link>
      )}
    </div>
  );
}
