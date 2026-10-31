'use client';

import { useActionState } from 'react';
import { changePassword } from '@/app/admin/_actions/auth';
import { Field, Notice, SubmitButton } from './FormBits';

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} className="max-w-md space-y-4 border border-line bg-surface p-5">
      <h2 className="font-display text-[12px] font-semibold uppercase tracking-label">Change password</h2>
      {state && (state.ok ? <Notice kind="success">{state.message}</Notice> : <Notice kind="error">{state.error}</Notice>)}
      <Field label="New password"><input name="password" type="password" minLength={8} required autoComplete="new-password" className="field" /></Field>
      <Field label="Repeat new password"><input name="confirm" type="password" minLength={8} required autoComplete="new-password" className="field" /></Field>
      <SubmitButton pendingText="Saving…">Update password</SubmitButton>
    </form>
  );
}
