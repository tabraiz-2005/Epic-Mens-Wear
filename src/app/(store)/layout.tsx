import { Suspense } from 'react';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartDrawer } from '@/components/store/CartDrawer';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { PageTransition } from '@/components/store/PageTransition';
import { getCategories, getCollections, getSettings } from '@/lib/commerce/catalog';
import { storeJsonLd } from '@/lib/commerce/local';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, collections] = await Promise.all([getSettings(), getCategories(), getCollections()]);
  const nav = categories.map((c) => ({ slug: c.slug, name: c.name, gender: c.gender }));
  const navCollections = collections.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <WishlistProvider>
      <CartProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd(settings, env.siteUrl)).replace(/</g, '\\u003c') }} />
        <div className="flex min-h-screen flex-col">
          <Header
            storeName={settings.store_name}
            categories={nav}
            collections={navCollections}
            announcement={settings.announcement_enabled ? settings.announcement_text : null}
            heroDark={Boolean(settings.hero_image_url)}
          />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} categories={nav} />
        </div>
        <CartDrawer freeShippingThreshold={settings.free_shipping_threshold} />
        <WhatsAppButton phone={settings.contact_phone} storeName={settings.store_name} />
        <Suspense fallback={null}>
          <PageTransition storeName={settings.store_name} />
        </Suspense>
      </CartProvider>
    </WishlistProvider>
  );
}
