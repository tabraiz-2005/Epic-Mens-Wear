'use client';

import { useActionState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { subscribeToNewsletter } from '@/app/(store)/_actions/newsletter';
import { cn } from '@/lib/utils';

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, null);
  return (
    <form action={action} className="mx-auto mt-8 w-full max-w-md">
      <div className="flex items-center border-b border-fg/40 focus-within:border-fg">
        <label htmlFor="nl-email" className="sr-only">Email address</label>
        <input
          id="nl-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          className="h-12 flex-1 bg-transparent text-[15px] text-fg placeholder:text-subtle focus:outline-none"
        />
        <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button type="submit" disabled={pending} className="nav-label flex items-center gap-2 py-3 text-[11px] disabled:opacity-50">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Subscribe <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} /></>}
        </button>
      </div>
      <p className={cn('mt-3 min-h-[1.25rem] text-[12px]', state ? (state.ok ? 'text-success' : 'text-danger') : 'text-muted')} role="status">
        {state ? state.message : (
          <>By subscribing you agree to our <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.</>
        )}
      </p>
    </form>
  );
}
