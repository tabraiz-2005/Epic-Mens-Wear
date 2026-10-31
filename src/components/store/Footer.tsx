import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { NavCategory } from './Header';
import type { StoreSettings } from '@/lib/commerce/types';
import { formatPhone, telLink } from '@/lib/phone';
import { Logo } from './Logo';
import { mapsLink } from '@/lib/commerce/local';

export function Footer({ settings, categories }: { settings: StoreSettings; categories: NavCategory[] }) {
  const cols = [
    {
      title: 'Shop',
      links: [
        { href: '/men', label: 'Men' },
        ...categories.map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
        { href: '/shop?sort=newest', label: 'New arrivals' },
        { href: '/sale', label: 'Sale' },
      ],
    },
    {
      title: 'Client care',
      links: [
        { href: '/shipping', label: 'Shipping' },
        { href: '/returns', label: 'Returns & exchanges' },
        { href: '/size-guide', label: 'Size guide' },
        { href: '/faq', label: 'FAQ' },
        { href: '/about', label: 'About Epic' },
        { href: '/contact', label: 'Contact & store' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '/terms', label: 'Terms of sale' },
        { href: '/privacy', label: 'Privacy policy' },
        { href: '/admin', label: 'Staff login' },
      ],
    },
  ];
  const phones = [settings.contact_phone, settings.contact_phone_2].filter(Boolean) as string[];
  const instaHandle = settings.instagram_url?.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
  const tiktokHandle = settings.tiktok_url?.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, '').replace(/[/?].*$/, '');

  return (
    <footer className="mt-24 border-t border-line">
      <div className="site-x grid gap-12 py-16 md:grid-cols-[1.5fr_repeat(3,1fr)] lg:py-20">
        <div>
          <Logo className="w-[170px] text-fg" title={settings.store_name} />
          <p className="mt-4 font-display text-sm text-muted">“{settings.tagline}”</p>
          <p className="mt-2 font-display text-[11px] uppercase tracking-label text-subtle">Eastridge Center · San Jose, CA</p>

          <ul className="mt-8 space-y-3 text-sm">
            {settings.address && (
              <li>
                <a
                  href={mapsLink(settings) ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 text-fg/85 hover:text-fg"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.6} /> {settings.address}
                </a>
              </li>
            )}
            {settings.opening_hours && (
              <li className="flex items-start gap-3 text-fg/85">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.6} /> {settings.opening_hours}
              </li>
            )}
            {phones.map((p) => (
              <li key={p}>
                <a href={telLink(p) ?? '#'} className="flex items-center gap-3 text-fg/85 hover:text-fg">
                  <Phone className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.6} /> {formatPhone(p) || p}
                </a>
              </li>
            ))}
            {settings.contact_email && (
              <li>
                <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-3 text-fg/85 hover:text-fg">
                  <Mail className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.6} /> {settings.contact_email}
                </a>
              </li>
            )}
            {settings.instagram_url && (
              <li>
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-fg/85 hover:text-fg">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
                  </svg>
                  @{instaHandle}
                </a>
              </li>
            )}
            {settings.tiktok_url && (
              <li>
                <a href={settings.tiktok_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-fg/85 hover:text-fg">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand" fill="currentColor" aria-hidden>
                    <path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a8 8 0 0 0 4.4 1.3V6.6a4.6 4.6 0 0 1-4.4-4.6Z" />
                  </svg>
                  TikTok @{tiktokHandle}
                </a>
              </li>
            )}
          </ul>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="label text-fg">{col.title}</h3>
            <ul className="mt-6 space-y-3.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-display text-[13px] uppercase tracking-[0.14em] text-muted hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="site-x flex justify-center overflow-hidden pb-6 text-fg/[0.06]">
        <Logo className="w-full max-w-[900px]" title="" mono />
      </div>
      <div className="site-x flex flex-col gap-3 border-t border-line py-6 font-display text-[11px] uppercase tracking-label text-subtle sm:flex-row sm:justify-between">
        <span>
          © {new Date().getFullYear()} {settings.store_name} · San Jose, California
        </span>
        <span>Prices in USD · Secure card payments · Shipping across the US</span>
      </div>
    </footer>
  );
}
