'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { SearchOverlay } from './SearchOverlay';
import { Logo } from './Logo';
import { GarmentArt } from './GarmentArt';

export interface NavCategory {
  slug: string;
  name: string;
  gender?: 'all' | 'men' | 'women';
}
export interface NavCollection {
  slug: string;
  name: string;
}

interface HeaderProps {
  storeName: string;
  categories: NavCategory[];
  collections?: NavCollection[];
  announcement?: string | null;
  /** The homepage hero has a photo: header text turns white while it sits over it. */
  heroDark?: boolean;
}

const SERVICE_LINKS = [
  { href: '/size-guide', label: 'Size guide' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/returns', label: 'Returns & exchanges' },
  { href: '/contact', label: 'Contact us' },
];

/** Example piece drawn in the mega-menu for each category (the drawing follows the category name). */
const sampleTitle = (c?: NavCategory) => {
  const n = `${c?.slug ?? ''} ${c?.name ?? ''}`.toLowerCase();
  if (n.includes('casual') && n.includes('shoe')) return 'Leather Sneakers';
  if (n.includes('shoe')) return 'Leather Oxford Shoes';
  if (n.includes('shirt')) return 'Dress Shirt';
  if (n.includes('access')) return 'Silk Tie';
  return 'Classic Two-Piece Suit';
};
const sampleColor = (c?: NavCategory) => {
  const n = `${c?.slug ?? ''}`;
  if (n.includes('shirt')) return '#F2F2EF';
  if (n.includes('casual')) return '#A8835A';
  if (n.includes('shoe')) return '#3E2A1E';
  if (n.includes('access')) return '#5B1F28';
  return '#1E2A3F';
};

function Count({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fg px-1 font-display text-[9px] font-semibold text-bg">
      {n}
    </span>
  );
}

/** Underline that grows from the centre on hover, as on luxury fashion sites. */
const navLink = (active: boolean) =>
  cn(
    'nav-label relative py-3 transition-opacity after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-center after:bg-current after:transition-transform after:duration-300',
    active ? 'after:scale-x-100' : 'opacity-80 after:scale-x-0 hover:opacity-100 hover:after:scale-x-100'
  );

function DesktopNav({
  categories,
  collections,
  onOpenChange,
}: {
  categories: NavCategory[];
  collections: NavCollection[];
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<NavCategory | undefined>(categories[0]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentCat = params.get('category');

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    timer.current = setTimeout(() => setOpen(false), 140);
  };
  useEffect(() => setOpen(false), [pathname, params]);
  useEffect(() => onOpenChange(open), [open, onOpenChange]);

  return (
    <div onMouseLeave={hide}>
      <nav aria-label="Main" className="flex h-11 items-center justify-center gap-7 xl:gap-10">
        <Link href="/shop?sort=newest" onMouseEnter={() => setOpen(false)} className={navLink(params.get('sort') === 'newest')}>
          New arrivals
        </Link>
        <span className="flex items-center" onMouseEnter={show}>
          <Link href="/men" onFocus={show} className={navLink(open || (pathname === '/men' && !currentCat))}>
            Men
          </Link>
        </span>
        {categories.slice(0, 6).map((c) => (
          <Link
            key={c.slug}
            href={`/men?category=${c.slug}`}
            onMouseEnter={() => setOpen(false)}
            className={navLink(currentCat === c.slug)}
          >
            {c.name}
          </Link>
        ))}
        <Link href="/sale" onMouseEnter={() => setOpen(false)} className={cn(navLink(pathname.startsWith('/sale')), 'text-brand')}>
          Sale
        </Link>
        <Link href="/about" onMouseEnter={() => setOpen(false)} className={navLink(pathname.startsWith('/about'))}>
          Our world
        </Link>
      </nav>

      {open && (
        <div onMouseEnter={show} className="absolute inset-x-0 top-full border-y border-line bg-bg text-fg shadow-[0_24px_40px_-24px_rgba(0,0,0,0.25)] animate-fade-in">
          <div className="site-x grid grid-cols-[1fr_1fr_1fr_minmax(220px,260px)] gap-12 py-10">
            <div>
              <p className="nav-label text-[11px] font-semibold">Ready to wear</p>
              <ul className="mt-5 space-y-3">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/men?category=${c.slug}`}
                      onMouseEnter={() => setHover(c)}
                      className="font-serif text-[22px] leading-tight text-fg/80 transition-colors hover:text-fg"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/men" className="nav-label inline-flex items-center gap-2 text-[11px] underline underline-offset-[6px]">
                    All menswear <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="nav-label text-[11px] font-semibold">Collections</p>
              <ul className="mt-5 space-y-3 text-[15px]">
                <li><Link href="/shop?sort=newest" className="text-fg/75 hover:text-fg">New arrivals</Link></li>
                {collections.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/collections/${c.slug}`} className="text-fg/75 hover:text-fg">{c.name}</Link>
                  </li>
                ))}
                <li><Link href="/sale" className="text-brand hover:opacity-80">Sale</Link></li>
              </ul>
            </div>
            <div>
              <p className="nav-label text-[11px] font-semibold">Client service</p>
              <ul className="mt-5 space-y-3 text-[15px]">
                {SERVICE_LINKS.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-fg/75 hover:text-fg">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <Link href={hover ? `/men?category=${hover.slug}` : '/men'} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden">
                <GarmentArt key={hover?.slug} category={hover?.slug} title={sampleTitle(hover)} color={sampleColor(hover)} className="animate-fade-in" />
              </div>
              <p className="nav-label mt-4 text-[11px] text-muted">How we style</p>
              <p className="mt-1 font-serif text-[22px]">{hover?.name ?? 'The collection'}</p>
              <span className="nav-label mt-2 inline-block text-[11px] underline underline-offset-[6px] group-hover:opacity-70">Discover more</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenu({
  storeName,
  categories,
  collections,
  wishCount,
  onSearch,
  onClose,
}: {
  storeName: string;
  categories: NavCategory[];
  collections: NavCollection[];
  wishCount: number;
  onSearch: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-black/30 animate-fade-in" />
      <div className="relative flex h-full w-full max-w-[440px] flex-col bg-bg shadow-2xl animate-[slideInLeft_.35s_cubic-bezier(.2,.8,.2,1)_both]">
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-line px-5">
          <button className="-ml-1 flex items-center gap-2 p-1" aria-label="Close menu" onClick={onClose}>
            <X className="h-5 w-5" strokeWidth={1.4} />
            <span className="nav-label text-[11px]">Close</span>
          </button>
          <Logo title={storeName} className="w-[96px]" />
          <span className="w-16" />
        </div>

        <nav className="flex-1 overflow-y-auto px-6 pb-10 pt-6">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSearch();
            }}
            className="flex w-full items-center gap-3 border-b border-line-strong pb-3 text-left text-[14px] text-muted"
          >
            <Search className="h-4 w-4" strokeWidth={1.4} /> Search suits, shirts, shoes…
          </button>

          <ul className="mt-8 space-y-4">
            <li>
              <Link href="/shop?sort=newest" onClick={onClose} className="font-serif text-[28px] leading-none">New arrivals</Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/men?category=${c.slug}`} onClick={onClose} className="font-serif text-[28px] leading-none">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/men" onClick={onClose} className="font-serif text-[28px] leading-none">All menswear</Link>
            </li>
            <li>
              <Link href="/sale" onClick={onClose} className="font-serif text-[28px] leading-none text-brand">Sale</Link>
            </li>
          </ul>

          {collections.length > 0 && (
            <>
              <p className="nav-label mt-10 text-[11px] font-semibold">Collections</p>
              <ul className="mt-4 space-y-3 text-[15px] text-fg/80">
                {collections.map((c) => (
                  <li key={c.slug}><Link href={`/collections/${c.slug}`} onClick={onClose}>{c.name}</Link></li>
                ))}
              </ul>
            </>
          )}

          <p className="nav-label mt-10 text-[11px] font-semibold">Client service</p>
          <ul className="mt-4 space-y-3 text-[15px] text-fg/80">
            <li><Link href="/about" onClick={onClose}>Our world</Link></li>
            {SERVICE_LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} onClick={onClose}>{l.label}</Link></li>
            ))}
            <li><Link href="/wishlist" onClick={onClose}>Wishlist{wishCount ? ` (${wishCount})` : ''}</Link></li>
          </ul>

          <div className="mt-10 border-t border-line pt-6 text-[13px] text-muted">
            <ThemeToggle variant="text" />
          </div>
        </nav>
      </div>
    </div>
  );
}

export function Header({ storeName, categories, collections = [], announcement, heroDark }: HeaderProps) {
  const { itemCount, setIsCartOpen, hydrated } = useCart();
  const { count } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Over the homepage hero the header is see-through until you scroll or open the menu.
  const overlay = isHome && !scrolled && !megaOpen;
  const light = overlay && heroDark;

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,color] duration-300',
          overlay ? 'border-b border-transparent bg-transparent' : 'border-b border-line bg-bg/95 backdrop-blur-md',
          light ? 'text-white' : 'text-fg'
        )}
      >
        {/* Utility bar */}
        <div
          className={cn(
            'overflow-hidden transition-[height,opacity] duration-300',
            scrolled ? 'h-0 opacity-0' : 'h-8 opacity-100',
            !overlay && 'border-b border-line'
          )}
        >
          <div className="site-x grid h-8 grid-cols-1 items-center text-[11px] tracking-[0.06em] lg:grid-cols-[1fr_auto_1fr]">
            <span className="hidden opacity-70 lg:block">Ship to: United States · USD $</span>
            <p className="truncate text-center opacity-80">
              <span className="sm:hidden">{announcement?.split(/\s[·|•]\s/)[0]}</span>
              <span className="hidden sm:inline">{announcement}</span>
            </p>
            <div className="hidden justify-end gap-6 opacity-70 lg:flex">
              <Link href="/contact" className="hover:opacity-100">Contact us</Link>
              <Link href="/contact" className="hover:opacity-100">The store</Link>
              <a href="#newsletter" className="hover:opacity-100">Newsletter</a>
            </div>
          </div>
        </div>

        {/* Main row */}
        <div className="site-x grid h-[72px] grid-cols-[1fr_auto_1fr] items-center lg:h-[76px]">
          <div className="flex items-center gap-1 lg:gap-6">
            <button className="-ml-2 flex items-center gap-2 p-2 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Menu className="h-[22px] w-[22px]" strokeWidth={1.3} />
            </button>
            <button className="flex items-center gap-2.5 p-2 lg:-ml-2" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="h-[19px] w-[19px]" strokeWidth={1.3} />
              <span className="nav-label hidden text-[11px] lg:inline">Search</span>
            </button>
          </div>

          <Link href="/" className="block" aria-label={`${storeName} home`}>
            <Logo
              title={storeName}
              className={cn('transition-[width] duration-300', scrolled ? 'w-[104px] lg:w-[132px]' : 'w-[112px] lg:w-[156px]')}
            />
          </Link>

          <div className="flex items-center justify-end gap-1 sm:gap-3 lg:gap-6">
            <Link href="/contact" className="nav-label hidden text-[11px] opacity-80 hover:opacity-100 xl:inline">
              Visit the store
            </Link>
            <Link href="/wishlist" className="relative hidden p-2 sm:block" aria-label="Wishlist">
              <Heart className="h-[19px] w-[19px]" strokeWidth={1.3} />
              {hydrated && <Count n={count} />}
            </Link>
            <button className="flex items-center gap-2.5 p-2 lg:-mr-2" aria-label="Open bag" onClick={() => setIsCartOpen(true)}>
              <span className="relative">
                <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={1.3} />
                {hydrated && <Count n={itemCount} />}
              </span>
              <span className="nav-label hidden text-[11px] lg:inline">Bag</span>
            </button>
          </div>
        </div>

        {/* Navigation row (desktop) */}
        <div className="relative hidden lg:block">
          <Suspense fallback={<div className="h-11" />}>
            <DesktopNav categories={categories} collections={collections} onOpenChange={setMegaOpen} />
          </Suspense>
        </div>
      </header>

      {/* Leave room for the fixed header everywhere except over the homepage hero. */}
      {!isHome && <div aria-hidden style={{ height: 'var(--hdr)' }} />}

      {menuOpen && (
        <MobileMenu
          storeName={storeName}
          categories={categories}
          collections={collections}
          wishCount={count}
          onSearch={() => setSearchOpen(true)}
          onClose={() => setMenuOpen(false)}
        />
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
