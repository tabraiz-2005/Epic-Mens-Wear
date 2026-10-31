'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';

export function SubmitButton({ children, className, pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn('btn-primary h-12', className)}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingText ?? 'Working…' : children}
    </button>
  );
}

export function Notice({ kind, children, className }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode; className?: string }) {
  const Icon = kind === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 border p-3.5 text-sm',
        kind === 'error' && 'border-danger/50 bg-danger/10',
        kind === 'success' && 'border-success/50 bg-success/10',
        kind === 'info' && 'border-line bg-surface',
        className
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', kind === 'error' ? 'text-danger' : kind === 'success' ? 'text-success' : 'text-muted')} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-subtle">{hint}</span>}
    </label>
  );
}
