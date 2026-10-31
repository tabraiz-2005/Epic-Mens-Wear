'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Package,
  Percent,
  Receipt,
  Settings,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { signOut } from '@/app/admin/_actions/auth';
import { Logo } from '@/components/store/Logo';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: Receipt },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/collections', label: 'Collections', icon: Layers },
  { href: '/admin/discounts', label: 'Discounts', icon: Percent },
  { href: '/admin/settings', label: 'Store settings', icon: Settings },
  { href: '/admin/team', label: 'Team', icon: Users },
];

export function Sidebar({ email, role, pendingOrders }: { email: string; role: string; pendingOrders: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 font-display text-[12px] uppercase tracking-[0.16em] transition-colors',
              active ? 'bg-brand font-semibold text-brand-ink' : 'text-muted hover:bg-surface-2 hover:text-fg'
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.6} />
            <span className="flex-1">{label}</span>
            {href === '/admin/orders' && pendingOrders > 0 && (
              <span className={cn('px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-brand-ink text-brand' : 'bg-brand text-brand-ink')}>{pendingOrders}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-line p-3">
      <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2 font-display text-[11px] uppercase tracking-[0.16em] text-muted hover:text-fg">
        <ExternalLink className="h-4 w-4" strokeWidth={1.6} /> View store
      </Link>
      <Link href="/admin/account" className="flex items-center gap-3 px-3 py-2 text-xs text-muted hover:text-fg">
        <UserRound className="h-4 w-4 shrink-0" strokeWidth={1.6} />
        <span className="min-w-0">
          <span className="block truncate">{email}</span>
          <span className="font-display text-[10px] uppercase tracking-label text-subtle">{role}</span>
        </span>
      </Link>
      <div className="flex items-center justify-between gap-2 px-1 pt-2">
        <form action={signOut}>
          <button className="flex items-center gap-2 px-2 py-2 font-display text-[11px] uppercase tracking-[0.16em] text-muted hover:text-fg">
            <LogOut className="h-4 w-4" strokeWidth={1.6} /> Sign out
          </button>
        </form>
        <ThemeToggle className="h-9 w-9" />
      </div>
    </div>
  );

  const brand = (
    <div className="flex h-16 items-center justify-between border-b border-line px-5">
      <Link href="/admin" className="flex items-center gap-3 text-fg">
        <Logo className="w-[104px]" /> <span className="font-display text-[10px] font-medium uppercase tracking-label text-muted">Admin</span>
      </Link>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="-ml-2 p-2">
          <Menu className="h-5 w-5" />
        </button>
        <Logo className="w-[96px] text-fg" />
        <span className="w-9" />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col border-r border-line bg-surface animate-fade-in">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
