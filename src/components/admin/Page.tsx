import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 lg:py-8">
      <div className="min-w-0">
        {eyebrow && <p className="font-display text-[11px] uppercase tracking-label text-muted">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-[-0.02em] lg:text-4xl">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-sm text-muted">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 py-6 sm:px-8 lg:py-8', className)}>{children}</div>;
}

export function Card({ title, actions, children, className, bodyClass }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn('border border-line bg-surface', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          {title && <h2 className="font-display text-[12px] font-semibold uppercase tracking-label">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={cn('p-5', bodyClass)}>{children}</div>
    </section>
  );
}

const TONES: Record<string, string> = {
  green: 'border-success/40 bg-success/10 text-success',
  amber: 'border-gold/40 bg-gold/10 text-gold',
  red: 'border-danger/40 bg-danger/10 text-danger',
  grey: 'border-line-strong bg-surface-2 text-muted',
  blue: 'border-sky-500/40 bg-sky-500/10 text-sky-500',
};

export function Badge({ tone = 'grey', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center border px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.14em]', TONES[tone])}>
      {children}
    </span>
  );
}

export function statusTone(s: string): keyof typeof TONES {
  if (['paid', 'active', 'delivered', 'confirmed', 'shipped'].includes(s)) return s === 'shipped' ? 'blue' : 'green';
  if (['unpaid', 'processing', 'pending', 'unfulfilled', 'draft', 'partially_refunded'].includes(s)) return 'amber';
  if (['failed', 'cancelled', 'refunded', 'returned'].includes(s)) return 'red';
  return 'grey';
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-line-strong px-6 py-16 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-label">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  );
}

export const th = 'border-b border-line px-4 py-3 text-left font-display text-[10px] font-semibold uppercase tracking-label text-muted';
export const td = 'border-b border-line px-4 py-3 align-middle';
