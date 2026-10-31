import type { StoreSettings } from './types';
import { normalisePhone } from '@/lib/phone';

/** Fixed store location, used for Google structured data. Edit here if the store moves. */
export const STORE_LOCATION = {
  streetAddress: '2200 Eastridge Loop Ste 2066',
  addressLocality: 'San Jose',
  addressRegion: 'CA',
  postalCode: '95122',
  addressCountry: 'US',
  mallName: 'Eastridge Center',
};

/** The shop's Google Maps page: the saved profile link, else a search for the address. */
export function mapsLink(s: StoreSettings): string | null {
  if (s.google_maps_url) return s.google_maps_url;
  if (!s.address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.store_name}, ${s.address}`)}`;
}

/** An embeddable map of the address (no API key needed). */
export function mapsEmbed(s: StoreSettings): string | null {
  if (!s.address) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${s.store_name}, ${s.address}`)}&z=16&output=embed`;
}

/** schema.org data so Google links the website to the shop on Maps. */
export function storeJsonLd(s: StoreSettings, siteUrl: string) {
  const phones = [s.contact_phone, s.contact_phone_2]
    .map((p) => (p ? normalisePhone(p) || p : null))
    .filter(Boolean) as string[];
  const sameAs = [s.instagram_url, s.tiktok_url, s.google_maps_url].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: s.store_name,
    slogan: s.tagline || undefined,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    image: s.hero_image_url || undefined,
    telephone: phones[0],
    email: s.contact_email || undefined,
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Credit Card, Debit Card',
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE_LOCATION.streetAddress,
      addressLocality: STORE_LOCATION.addressLocality,
      addressRegion: STORE_LOCATION.addressRegion,
      postalCode: STORE_LOCATION.postalCode,
      addressCountry: STORE_LOCATION.addressCountry,
    },
    containedInPlace: { '@type': 'ShoppingCenter', name: STORE_LOCATION.mallName },
    openingHours: s.opening_hours || undefined,
    hasMap: mapsLink(s) || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    contactPoint: phones.map((telephone) => ({ '@type': 'ContactPoint', telephone, contactType: 'customer service', areaServed: 'US' })),
  };
}
