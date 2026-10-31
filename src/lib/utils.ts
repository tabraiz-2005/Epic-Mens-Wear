import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The store's currency. Product prices are whole dollars (e.g. 349.99); orders and settings are stored in cents. */
export const STORE_CURRENCY = 'USD';

/** Format a currency amount (e.g. 349 → "$349", 89.5 → "$89.50"). */
export function formatPrice(amount: number, currency = STORE_CURRENCY): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format an amount stored in cents (orders, settings). */
export function formatCents(cents: number, currency = STORE_CURRENCY): string {
  return formatPrice(cents / 100, currency);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function primaryImage(images: { url: string; isPrimary?: boolean }[]): string {
  return images.find((i) => i.isPrimary)?.url || images[0]?.url || '';
}
