import Link from 'next/link';
import type { NavCategory } from './Header';
import type { StoreSettings } from '@/lib/commerce/types';
import { formatPhone, telLink } from '@/lib/phone';
import { Logo } from './Logo';
import { NewsletterForm } from './NewsletterForm';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { mapsLink } from '@/lib/commerce/local';

/** A column on computers; a tap-to-open row on phones and tablets. */
function Col({ title, children, openOnPhone }: { title: string; children: React.ReactNode; openOnPhone?: boolean }) {
  return (
    <>
      <div className="hidden lg:block">
        <h3 className="nav-label text-[11px] font-semibold text-fg">{title}</h3>
        <ul className="mt-6 space-y-3.5 text-[14px] text-fg/70">{children}</ul>
      </div>
      <details className="group border-b border-line lg:hidden" open={openOnPhone}>
        <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between text-fg [&::-webkit-details-marker]:hidden">
          <span className="nav-label text-[11px] font-semibold">{title}</span>
          <span aria-hidden className="relative h-3 w-3">
            <span className="absolute left-0 top-1/2 h-px w-3 bg-current" />
            <span className="absolute left-1/2 top-0 h-3 w-px bg-current transition-transform duration-200 group-open:scale-y-0" />
          </span>
        </summary>
        <ul className="space-y-4 pb-6 text-[15px] text-fg/75">{children}</ul>
      </details>
    </>
  );
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link href={href} className="transition-colors hover:text-fg">{children}</Link>
  </li>
);

export function Footer({ settings, categories }: { settings: StoreSettings; categories: NavCategory[] }) {
  const phones = [settings.contact_phone, settings.contact_phone_2].filter(Boolean) as string[];
  const maps = mapsLink(settings);
  const socials = [
    settings.instagram_url && { href: settings.instagram_url, label: 'Instagram', icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
      </svg>
    ) },
    settings.tiktok_url && { href: settings.tiktok_url, label: 'TikTok', icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
        <path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a8 8 0 0 0 4.4 1.3V6.6a4.6 4.6 0 0 1-4.4-4.6Z" />
      </svg>
    ) },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  return (
    <footer className="mt-20 lg:mt-28">
      {/* Newsletter */}
      <section id="newsletter" className="scroll-mt-40 border-y border-line bg-surface">
        <div className="site-x py-12 text-center sm:py-16 lg:py-20">
          <p className="nav-label text-[11px] text-muted">Newsletter</p>
          <h2 className="serif-title mx-auto mt-4 max-w-xl text-[30px] sm:text-[42px]">The world of {settings.store_name}</h2>
          <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-muted">
            New arrivals, private sales and styling notes for every occasion, delivered a few times a month.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* Columns */}
      <div className="site-x py-6 lg:grid lg:grid-cols-4 lg:gap-12 lg:py-20">
        <Col title="Client service">
          <A href="/contact">Contact us</A>
          <A href="/shipping">Shipping</A>
          <A href="/returns">Orders & returns</A>
          <A href="/size-guide">Size guide</A>
          <A href="/faq">FAQ</A>
          <A href="/wishlist">Wishlist</A>
        </Col>
        <Col title="Shop">
          <A href="/shop?sort=newest">New arrivals</A>
          {categories.map((c) => (
            <A key={c.slug} href={`/men?category=${c.slug}`}>{c.name}</A>
          ))}
          <A href="/sale">Sale</A>
        </Col>
        <Col title="The store" openOnPhone>
          {settings.address && (
            <li className="leading-relaxed">
              {maps ? (
                <a href={maps} target="_blank" rel="noreferrer" className="hover:text-fg">{settings.address}</a>
              ) : (
                settings.address
              )}
            </li>
          )}
          {settings.opening_hours && <li>{settings.opening_hours}</li>}
          {phones.map((p) => (
            <li key={p}><a href={telLink(p) ?? '#'} className="hover:text-fg">{formatPhone(p) || p}</a></li>
          ))}
          {settings.contact_email && (
            <li><a href={`mailto:${settings.contact_email}`} className="hover:text-fg">{settings.contact_email}</a></li>
          )}
          {maps && (
            <li>
              <a href={maps} target="_blank" rel="noreferrer" className="nav-label text-[11px] text-fg underline underline-offset-[6px]">
                Get directions
              </a>
            </li>
          )}
        </Col>
        <Col title="Company">
          <A href="/about">Our world</A>
          <A href="/terms">Terms of sale</A>
          <A href="/privacy">Privacy policy</A>
          <A href="/admin">Staff login</A>
        </Col>
      </div>

      {/* Follow us */}
      {socials.length > 0 && (
        <div className="site-x flex flex-wrap items-center justify-center gap-6 border-t border-line py-8">
          <span className="nav-label text-[11px] text-muted">Follow us on</span>
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="text-fg/70 transition-colors hover:text-fg">
              {s.icon}
            </a>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="site-x grid items-center gap-5 py-7 pb-[calc(1.75rem+env(safe-area-inset-bottom))] text-[12px] text-muted lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start">
            <span>Ship to: United States · USD $</span>
            <ThemeToggle variant="text" />
          </div>
          <Link href="/" className="mx-auto block text-fg" aria-label={`${settings.store_name} home`}>
            <Logo title="" className="w-[96px]" />
          </Link>
          <p className="text-center lg:text-right">
            © {new Date().getFullYear()} {settings.store_name} · San Jose, California
          </p>
        </div>
      </div>
    </footer>
  );
}
