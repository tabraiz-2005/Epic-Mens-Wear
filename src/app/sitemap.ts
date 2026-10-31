import type { MetadataRoute } from 'next';
import { getCategories, getCollections, getProducts } from '@/lib/commerce/catalog';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl.replace(/\/+$/, '');
  const now = new Date();
  const [products, categories, collections] = await Promise.all([getProducts(), getCategories(), getCollections()]);

  const page = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly') => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  const categoryPages = categories.map((c) => page(`/shop?category=${encodeURIComponent(c.slug)}`, 0.7));

  return [
    page('/', 1, 'daily'),
    page('/shop', 0.9, 'daily'),
    page('/men', 0.9, 'daily'),
    page('/sale', 0.7, 'daily'),
    page('/new-arrivals', 0.8, 'daily'),
    page('/sale', 0.8, 'daily'),
    ...categoryPages,
    ...collections.map((c) => page(`/collections/${c.slug}`, 0.7)),
    ...products.map((p) => page(`/products/${p.slug}`, 0.8)),
    page('/about', 0.6, 'monthly'),
    page('/contact', 0.6, 'monthly'),
    page('/size-guide', 0.4, 'monthly'),
    page('/shipping', 0.4, 'monthly'),
    page('/returns', 0.4, 'monthly'),
    page('/faq', 0.4, 'monthly'),
    page('/terms', 0.2, 'monthly'),
    page('/privacy', 0.2, 'monthly'),
  ];
}
