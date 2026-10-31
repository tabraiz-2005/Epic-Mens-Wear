import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts, getSettings } from '@/lib/commerce/catalog';
import { ProductView } from '@/components/store/ProductView';
import { ProductCard } from '@/components/store/ProductCard';
import { formatCents, primaryImage } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: 'Not found' };
  const image = primaryImage(product.images);
  return {
    title: product.seoTitle.replace(/\s*\|\s*Epic Menswear$/i, ''),
    description: product.seoDescription.slice(0, 160),
    openGraph: { images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const [settings, related] = await Promise.all([getSettings(), getRelatedProducts(product, 4)]);

  const freeShipping = settings.free_shipping_threshold !== null && product.price * 100 >= settings.free_shipping_threshold;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: settings.store_name },
    image: product.images.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency || 'USD',
      price: product.price,
      availability: product.totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView
        product={product}
        lowStockThreshold={settings.low_stock_threshold}
        freeShipping={freeShipping}
        deliveryNote={
          settings.free_shipping_threshold !== null
            ? `Free shipping over ${formatCents(settings.free_shipping_threshold)}`
            : 'Tracked shipping across the US'
        }
        whatsappPhone={settings.contact_phone}
      />

      {related.length > 0 && (
        <section className="site-x pt-24 lg:pt-32">
          <div className="flex items-end justify-between border-b border-line pb-8">
            <div>
              <h2 className="font-display text-[22px] font-normal tracking-[0.02em] lg:text-[26px]">You may also like</h2>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:gap-x-[42px] xl:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
