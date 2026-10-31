import Link from 'next/link';
import { ArrowUpRight, MapPin, Truck, RotateCcw } from 'lucide-react';
import { arrange, getCollections, getProducts, getSettings, newestMix } from '@/lib/commerce/catalog';
import { ProductCard } from '@/components/store/ProductCard';
import { GarmentArt } from '@/components/store/GarmentArt';
import { Img } from '@/components/ui/Img';
import { formatCents } from '@/lib/utils';

export default async function HomePage() {
  const [settings, collections, all] = await Promise.all([
    getSettings(),
    getCollections(),
    getProducts({ sort: 'recent' }),
  ]);
  const newest = newestMix(all, 4);
  const newIds = new Set(newest.map((p) => p.id));
  const featuredRest = arrange(all.filter((p) => p.isFeatured && !newIds.has(p.id))).slice(0, 4);
  const shownIds = new Set(newest.concat(featuredRest).map((p) => p.id));
  const everything = arrange(all.filter((p) => !shownIds.has(p.id)));
  const ALL_LIMIT = 24;

  return (
    <>
      {/* Campaign hero */}
      <section className="relative h-[calc(100svh-154px)] lg:h-[calc(100svh-110px)] min-h-[560px] overflow-hidden border-b border-line bg-black">
        {settings.hero_image_url ? (
          <Img
            src={settings.hero_image_url}
            alt={settings.hero_title}
            sizes="100vw"
            priority
            className="object-cover object-[72%_center] lg:object-center"
          />
        ) : (
          <div className="absolute inset-0 lg:left-[38%]">
            <GarmentArt title="Classic Two-Piece Suit" color="#1E2A3F" className="bg-surface" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent lg:bg-gradient-to-r lg:from-black/80 lg:via-black/35 lg:via-[38%] lg:to-transparent lg:to-[62%]" />
        <div className="site-x relative flex h-full flex-col justify-end pb-14 lg:justify-center lg:pb-0">
          <div className="max-w-[720px] text-white">
            <p className="font-display text-[11px] uppercase tracking-[0.32em] text-white/75 sm:text-[12px]">{settings.hero_eyebrow}</p>
            <h1 className="mt-4 font-display text-[40px] font-light uppercase leading-[1.02] tracking-[0.06em] sm:text-[56px] lg:text-[72px]">
              {settings.hero_title}
            </h1>
            {settings.hero_subtitle && <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-white/80 sm:text-[16px]">{settings.hero_subtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={settings.hero_cta_href || '/men'}
                className="inline-flex h-12 min-w-[140px] items-center justify-center border border-white px-8 font-display text-[12px] font-medium uppercase tracking-[0.24em] transition-colors sm:h-14 sm:min-w-[170px] bg-white text-[#0C0D11] hover:bg-white/0 hover:text-white"
              >
                {settings.hero_cta_label || 'Shop menswear'}
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 min-w-[140px] items-center justify-center border border-white px-8 font-display text-[12px] font-medium uppercase tracking-[0.24em] transition-colors sm:h-14 sm:min-w-[170px] bg-white/0 text-white hover:bg-white hover:text-[#0C0D11]"
              >
                Visit the store
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Everything else */}
      {everything.length > 0 && (
        <section className="site-x pt-14 lg:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted">The collection</p>
              <h2 className="mt-2 font-display text-[20px] font-normal uppercase tracking-[0.08em] lg:text-[24px]">All pieces</h2>
            </div>
            <Link href="/shop" className="label link-u text-muted">
              Shop all {all.length}
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 lg:gap-y-12 xl:grid-cols-4">
            {everything.slice(0, ALL_LIMIT).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {everything.length > ALL_LIMIT && (
            <div className="mt-12 flex justify-center">
              <Link href="/shop" className="btn-outline h-14 px-10">View all {all.length} pieces</Link>
            </div>
          )}
        </section>
      )}

      {/* New arrivals */}
      {newest.length > 0 && (
        <section className="site-x pt-14 lg:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Just in</p>
              <h2 className="mt-2 font-display text-[20px] font-normal uppercase tracking-[0.08em] lg:text-[24px]">New arrivals</h2>
            </div>
            <Link href="/shop?sort=newest" className="label link-u text-muted">
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 lg:gap-y-12 xl:grid-cols-4">
            {newest.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section className="site-x pt-14 lg:pt-20">
          <div className="grid gap-3 md:grid-cols-2 lg:gap-[42px]">
            {collections.slice(0, 2).map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden border border-line sm:aspect-[16/11]">
                {c.heroImage ? (
                  <Img src={c.heroImage} alt={c.name} sizes="(max-width: 768px) 100vw, 50vw" className="transition-transform duration-700 group-hover:scale-[1.03]" />
                ) : (
                  <GarmentArt title={c.slug.includes('wedding') ? 'Black Tuxedo Suit' : 'Double-Breasted Suit'} color={c.slug.includes('wedding') ? '#16171A' : '#3A3B3E'} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white lg:p-10">
                  <p className="font-display text-xs uppercase tracking-wide2 text-white/70">Collection</p>
                  <h3 className="mt-3 font-display text-[26px] font-normal uppercase tracking-[0.06em] lg:text-[34px]">{c.name}</h3>
                  {c.storyQuote && <p className="mt-4 max-w-md text-sm text-white/80">{c.storyQuote}</p>}
                  <span className="label mt-6 inline-flex items-center gap-2 border-b border-white pb-1">
                    Explore <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featuredRest.length > 0 && (
        <section className="site-x pt-14 lg:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Our picks</p>
              <h2 className="mt-2 font-display text-[20px] font-normal uppercase tracking-[0.08em] lg:text-[24px]">The essentials</h2>
            </div>
            <Link href="/shop" className="label link-u text-muted">
              Full catalogue
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 lg:gap-y-12 xl:grid-cols-4">
            {featuredRest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Service strip */}
      <section className="site-x pt-14 lg:pt-20">
        <div className="grid border border-line sm:grid-cols-3">
          {[
            {
              icon: Truck,
              title: 'Fast US shipping',
              text: settings.free_shipping_threshold
                ? `Tracked delivery anywhere in the US. Free on orders over ${formatCents(settings.free_shipping_threshold)}.`
                : 'Tracked delivery anywhere in the US.',
            },
            { icon: RotateCcw, title: 'Easy returns', text: 'Wrong size? Return or exchange unworn items within 30 days.' },
            {
              icon: MapPin,
              title: 'Visit us in San Jose',
              text: 'Try it on at Eastridge Center: 2200 Eastridge Loop Ste 2066, San Jose, CA 95122.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-5 border-line p-8 [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0 sm:[&:not(:last-child)]:border-r lg:p-10">
              <Icon className="h-6 w-6 shrink-0" strokeWidth={1.4} />
              <div>
                <h3 className="label">{title}</h3>
                <p className="mt-3 text-sm text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
