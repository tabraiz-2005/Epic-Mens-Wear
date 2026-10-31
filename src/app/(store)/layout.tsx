import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { CartDrawer } from '@/components/store/CartDrawer';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { getCategories, getSettings } from '@/lib/commerce/catalog';
import { storeJsonLd } from '@/lib/commerce/local';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const nav = categories.map((c) => ({ slug: c.slug, name: c.name, gender: c.gender }));

  return (
    <WishlistProvider>
      <CartProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd(settings, env.siteUrl)).replace(/</g, '\\u003c') }} />
        <div className="flex min-h-screen flex-col">
          {settings.announcement_enabled && settings.announcement_text && (
            <div className="border-b border-line bg-surface text-fg/75">
              <p className="site-x py-2.5 text-center text-[11px] tracking-[0.08em] sm:text-[12px]">{settings.announcement_text}</p>
            </div>
          )}
          <Header storeName={settings.store_name} categories={nav} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} categories={nav} />
        </div>
        <CartDrawer freeShippingThreshold={settings.free_shipping_threshold} />
        <WhatsAppButton phone={settings.contact_phone} storeName={settings.store_name} />
      </CartProvider>
    </WishlistProvider>
  );
}
