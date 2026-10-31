'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Heart, Home, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { SearchOverlay } from './SearchOverlay';
import { Logo } from './Logo';

export interface NavCategory {
  slug: string;
  name: string;
  gender?: 'all' | 'men' | 'women';
}

// Epic Menswear is men only. Add another department here (and a page under app/(store)/) to bring one back.
type Dept = 'men';
const DEPTS: { key: Dept; label: string }[] = [{ key: 'men', label: 'Men' }];

const forDept = (cats: NavCategory[], d: Dept) => cats.filter((c) => !c.gender || c.gender === 'all' || c.gender === d);

function Count({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-fg px-1 font-display text-[10px] font-bold text-bg">
      {n}
    </span>
  );
}

/** Desktop: Home / Men (with a category panel on hover) / Sale. */
function DeptMenu({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState<Dept | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (d: Dept) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(d);
  };
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };

  useEffect(() => setOpen(null), [pathname, params]);

  return (
    <div className="flex items-center gap-9" onMouseLeave={hide}>
      <Link
        href="/"
        onMouseEnter={() => setOpen(null)}
        className={cn(
          'whitespace-nowrap py-9 font-display text-[13px] font-medium uppercase tracking-label transition-colors hover:text-fg',
          pathname === '/' ? 'text-fg' : 'text-fg/75'
        )}
      >
        Home
      </Link>
      {DEPTS.map((d) => (
        <div key={d.key} className="flex items-center" onMouseEnter={() => show(d.key)}>
          <Link
            href={`/${d.key}`}
            onFocus={() => show(d.key)}
            className={cn(
              'whitespace-nowrap py-9 font-display text-[13px] font-medium uppercase tracking-label transition-colors hover:text-fg',
              pathname.startsWith(`/${d.key}`) || open === d.key ? 'text-fg' : 'text-fg/75'
            )}
          >
            {d.label}
          </Link>
        </div>
      ))}
      <Link
        href="/shop?sort=newest"
        onMouseEnter={() => setOpen(null)}
        className="whitespace-nowrap py-9 font-display text-[13px] font-medium uppercase tracking-label text-fg/75 transition-colors hover:text-fg"
      >
        New in
      </Link>
      <Link
        href="/sale"
        onMouseEnter={() => setOpen(null)}
        className={cn(
          'whitespace-nowrap border px-3.5 py-2 font-display text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors',
          pathname.startsWith('/sale')
            ? 'border-brand bg-brand text-brand-ink'
            : 'border-brand text-brand hover:bg-brand hover:text-brand-ink'
        )}
      >
        Sale
      </Link>

      {open && (
        <div
          onMouseEnter={() => show(open)}
          className="absolute inset-x-0 top-full border-b border-line bg-bg shadow-2xl animate-fade-in"
        >
          <div className="site-x grid grid-cols-[200px_1fr] gap-12 py-10">
            <div>
              <p className="font-display text-[12px] uppercase tracking-[0.2em] text-muted">{DEPTS.find((d) => d.key === open)?.label}</p>
              <Link href={`/${open}`} className="mt-4 block font-display text-[15px] uppercase tracking-[0.12em] text-fg hover:underline">
                View all
              </Link>
            </div>
            <div>
              <p className="font-display text-[12px] uppercase tracking-[0.2em] text-muted">Shop by category</p>
              <ul className="mt-4 grid grid-flow-col grid-rows-5 auto-cols-[220px] gap-x-10 gap-y-3">
                {forDept(categories, open).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${open}?category=${c.slug}`}
                      className={cn(
                        'font-display text-[14px] uppercase tracking-[0.08em] transition-colors hover:text-fg',
                        pathname === `/${open}` && params.get('category') === c.slug ? 'text-fg' : 'text-fg/70'
                      )}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Mobile drawer: department tabs (only when there is more than one), then the category list. */
function MobileMenu({
  storeName,
  categories,
  wishCount,
  onClose,
}: {
  storeName: string;
  categories: NavCategory[];
  wishCount: number;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [dept, setDept] = useState<Dept>(DEPTS.find((d) => pathname.startsWith(`/${d.key}`))?.key ?? DEPTS[0].key);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg animate-fade-in lg:hidden">
      <div className="site-x flex h-[72px] shrink-0 items-center justify-between border-b border-line">
        <button className="-ml-2 p-2" aria-label="Close menu" onClick={onClose}>
          <X className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <Logo title={storeName} className="w-[118px]" />
        <span className="w-10" />
      </div>

      {DEPTS.length > 1 && (
      <div className="site-x flex shrink-0 gap-8 border-b border-line">
        {DEPTS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDept(d.key)}
            className={cn(
              '-mb-px border-b-2 py-4 font-display text-[15px] uppercase tracking-[0.12em]',
              dept === d.key ? 'border-fg text-fg' : 'border-transparent text-muted'
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
      )}

      <nav className="site-x flex-1 overflow-y-auto pb-10 pt-6">
        <Link
          href="/sale"
          onClick={onClose}
          className="mb-6 flex items-center justify-between border border-brand/40 px-4 py-3 font-display text-[15px] uppercase tracking-[0.12em] text-brand"
        >
          Sale <span className="text-[12px] normal-case tracking-normal text-muted">Marked-down pieces</span>
        </Link>
        <p className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-fg">Shop by categories</p>
        <ul className="mt-4 space-y-1">
          <li>
            <Link href={`/${dept}`} onClick={onClose} className="block py-2 font-display text-[16px] uppercase tracking-[0.06em] text-fg">
              View all
            </Link>
          </li>
          {forDept(categories, dept).map((c) => (
            <li key={c.slug}>
              <Link
                href={`/${dept}?category=${c.slug}`}
                onClick={onClose}
                className="block py-2 font-display text-[16px] uppercase tracking-[0.06em] text-fg/85"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-1 border-t border-line pt-6">
          {[
            { href: '/', label: 'Home' },
            { href: '/about', label: 'About' },
            { href: '/contact', label: 'Contact' },
            { href: '/wishlist', label: `Wishlist${wishCount ? ` (${wishCount})` : ''}` },
          ].map((l) => (
            <Link key={l.href} href={l.href} onClick={onClose} className="block py-2 text-[14px] text-muted">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <span className="text-[13px] text-muted">Appearance</span>
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
}

export function Header({ storeName, categories }: { storeName: string; categories: NavCategory[] }) {
  const { itemCount, setIsCartOpen, hydrated } = useCart();
  const { count } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
        <div className="site-x grid h-[72px] grid-cols-[1fr_auto_1fr] items-center lg:h-[100px]">
          <nav className="flex items-center" aria-label="Main">
            <button className="-ml-2 p-2 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <Link href="/" className="p-2 lg:hidden" aria-label="Home">
              <Home className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </Link>
            <div className="hidden lg:block">
              <Suspense fallback={null}>
                <DeptMenu categories={categories} />
              </Suspense>
            </div>
          </nav>

          <Link href="/" className="block text-fg" aria-label={`${storeName} home`}>
            <Logo title={storeName} className="w-[118px] sm:w-[140px] lg:w-[160px] min-[1440px]:w-[188px]" />
          </Link>

          <div className="flex items-center justify-end gap-1 sm:gap-3 lg:gap-6">
            <nav className="mr-1 hidden items-center gap-6 xl:flex min-[1440px]:mr-4 min-[1440px]:gap-7" aria-label="Store">
              {[
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'whitespace-nowrap font-display text-[13px] font-medium uppercase tracking-label transition-colors hover:text-fg',
                    pathname === l.href ? 'text-fg' : 'text-fg/75'
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <ThemeToggle className="hidden sm:flex" />
            <button className="p-2" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </button>
            <Link href="/wishlist" className="relative hidden p-2 sm:block" aria-label="Wishlist">
              <Heart className="h-[22px] w-[22px]" strokeWidth={1.6} />
              {hydrated && <Count n={count} />}
            </Link>
            <button className="flex items-center gap-3 p-2" aria-label="Open bag" onClick={() => setIsCartOpen(true)}>
              <span className="relative">
                <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.6} />
                {hydrated && <Count n={itemCount} />}
              </span>
              <span className="hidden font-display text-[13px] uppercase tracking-label text-fg/75 min-[1440px]:inline">Bag</span>
            </button>
          </div>
        </div>

        {/* Mobile quick links: Men, new arrivals and the sale, always one tap away */}
        <nav className="site-x flex h-11 items-center gap-6 border-t border-line lg:hidden" aria-label="Departments">
          {DEPTS.map((d) => (
            <Link
              key={d.key}
              href={`/${d.key}`}
              className={cn(
                'font-display text-[12px] font-medium uppercase tracking-[0.16em]',
                pathname.startsWith(`/${d.key}`) ? 'text-fg underline underline-offset-[6px]' : 'text-fg/75'
              )}
            >
              {d.label}
            </Link>
          ))}
          <Link href="/shop?sort=newest" className="font-display text-[12px] font-medium uppercase tracking-[0.16em] text-fg/75">
            New in
          </Link>
          <Link
            href="/sale"
            className={cn(
              'ml-auto inline-flex h-8 items-center border px-3 font-display text-[11px] font-semibold uppercase tracking-[0.16em]',
              pathname.startsWith('/sale') ? 'border-brand bg-brand text-brand-ink' : 'border-brand text-brand'
            )}
          >
            Sale
          </Link>
        </nav>
      </header>

      {menuOpen && <MobileMenu storeName={storeName} categories={categories} wishCount={count} onClose={() => setMenuOpen(false)} />}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
