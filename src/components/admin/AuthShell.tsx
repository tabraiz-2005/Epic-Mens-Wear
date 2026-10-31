import Link from 'next/link';
import { Logo } from '@/components/store/Logo';

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-line bg-surface p-12 lg:flex">
        <Link href="/" className="text-fg"><Logo className="w-[150px]" /></Link>
        <div>
          <p className="eyebrow">Garment system // Control</p>
          <p className="display mt-4 text-7xl">Admin</p>
          <p className="mt-6 max-w-sm text-sm text-muted">Products, stock, orders, discounts and store settings — all in one place.</p>
        </div>
        <p className="font-display text-[11px] uppercase tracking-label text-subtle">Authorised staff only</p>
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="mb-10 w-full max-w-[420px]">
          <Logo className="w-[130px] text-fg lg:hidden" />
          <h1 className="display mt-6 text-4xl lg:mt-0">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
