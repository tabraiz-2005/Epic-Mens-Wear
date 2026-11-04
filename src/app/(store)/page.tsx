import Link from 'next/link';
import { ArrowRight, MapPin, RotateCcw, Truck } from 'lucide-react';
import { arrange, getCategories, getCollections, getProducts, getSettings, newestMix } from '@/lib/commerce/catalog';
import type { Product } from '@/lib/commerce/types';
import { ProductCard } from '@/components/store/ProductCard';
import { GarmentArt } from '@/components/store/GarmentArt';
import { Img } from '@/components/ui/Img';
import { formatCents } from '@/lib/utils';
import { mapsEmbed, mapsLink } from '@/lib/commerce/local';

function SectionHead({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 text-center sm:mb-10 lg:mb-14">
      <p className="nav-label text-[11px] text-muted">{eyebrow}</p>
      <h2 className="serif-title mt-2 text-[30px] sm:mt-3 sm:text-[42px] lg:text-[48px]">{title}</h2>
      {href && (
        <Link href={href} className="nav-label mt-5 inline-flex items-center gap-2 text-[11px] underline underline-offset-[6px] hover:opacity-70">
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}

function Grid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:gap-x-6 lg:gap-y-14 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 2} />
      ))}
    </div>
  );
}

// Which part of a wide hero photo stays in view on a phone.
const FOCUS: Record<string, string> = {
  left: 'object-[22%_center]',
  center: 'object-center',
  right: 'object-[78%_center]',
};

const STILL_LIFE = [
  { title: 'Classic Two-Piece Suit', color: '#1E2A3F' },
  { title: 'French Cuff Dress Shirt', color: '#F2F2EF' },
  { title: 'Leather Oxford Shoes', color: '#3E2A1E' },
];

export default async function HomePage() {
  const [settings, collections, categories, all] = await Promise.all([
    getSettings(),
    getCollections(),
    getCategories(),
    getProducts({ sort: 'recent' }),
  ]);
  const newest = newestMix(all, 4);
  const newIds = new Set(newest.map((p) => p.id));
  // "The essentials" only when it fills a whole row of 4.
  const featuredPool = arrange(all.filter((p) => p.isFeatured && !newIds.has(p.id)));
  const featuredRest = featuredPool.length >= 4 ? featuredPool.slice(0, 4) : [];
  const shownIds = new Set(newest.concat(featuredRest).map((p) => p.id));
  const everything = arrange(all.filter((p) => !shownIds.has(p.id)));
  // Whole rows only (4 per row on desktop), up to 3 rows.
  const ALL_LIMIT = everything.length >= 12 ? 12 : everything.length >= 4 ? everything.length - (everything.length % 4) : everything.length;
  const heroPhoto = settings.hero_image_url;
  const mobilePhoto = settings.hero_image_mobile_url;
  const embed = mapsEmbed(settings);
  const maps = mapsLink(settings);

  // One tile per category, using a real product photo when there is one.
  const catTiles = categories
    .filter((c) => c.itemCount > 0)
    .map((c) => {
      const inCat = arrange(all.filter((p) => p.category === c.slug));
      const withPhoto = inCat.find((p) => p.images.length > 0);
      return { c, photo: withPhoto?.images[0]?.url, alt: withPhoto?.images[0]?.alt, sample: inCat[0] };
    });

  return (
    <>
      {/* Hero: sits under the transparent header */}
      {heroPhoto ? (
        <section className="relative h-[88svh] min-h-[560px] overflow-hidden bg-black md:h-[100svh] md:min-h-[620px]">
          {mobilePhoto ? (
            <>
              <div className="md:hidden">
                <Img src={mobilePhoto} alt={settings.hero_title} sizes="100vw" priority className="object-cover object-center" />
              </div>
              <div className="hidden md:block">
                <Img src={heroPhoto} alt={settings.hero_title} sizes="100vw" priority className="object-cover object-center" />
              </div>
            </>
          ) : (
            <Img src={heroPhoto} alt={settings.hero_title} sizes="100vw" priority className={`object-cover ${FOCUS[settings.hero_focus] ?? FOCUS.center} md:object-center`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-40% to-black/80 md:from-black/35 md:via-black/5 md:to-black/55" />
          <div className="site-x relative flex h-full flex-col items-center justify-end pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-center text-white md:pb-20 lg:pb-24">
            <p className="nav-label text-[10px] text-white/80 sm:text-[11px]">{settings.hero_eyebrow}</p>
            <h1 className="serif-title mt-3 max-w-4xl text-[38px] leading-[1.05] sm:mt-4 sm:text-[64px] lg:text-[84px]">{settings.hero_title}</h1>
            {settings.hero_subtitle && (
              <p className="mt-4 hidden max-w-xl text-[15px] leading-relaxed text-white/85 sm:block">{settings.hero_subtitle}</p>
            )}
            <div className="mt-7 flex w-full flex-col items-center gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:gap-8">
              <Link
                href={settings.hero_cta_href || '/men'}
                className="nav-label flex h-12 w-full max-w-[320px] items-center justify-center bg-white text-[11px] text-black sm:h-auto sm:w-auto sm:border-b sm:border-white sm:bg-transparent sm:pb-1.5 sm:text-[12px] sm:text-white"
              >
                {settings.hero_cta_label || 'Discover the collection'}
              </Link>
              <Link href="/contact" className="nav-label border-b border-white/50 pb-1.5 text-[11px] text-white/85 hover:border-white sm:text-[12px]">
                Visit the store
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative min-h-[100svh] overflow-hidden bg-surface">
          <div className="site-x flex min-h-[100svh] flex-col items-center pb-12 text-center" style={{ paddingTop: 'calc(var(--hdr) + 3.5rem)' }}>
            <p className="nav-label text-[11px] text-muted animate-rise">{settings.hero_eyebrow}</p>
            <h1 className="serif-title mt-4 max-w-4xl text-[46px] animate-rise sm:text-[64px] lg:text-[80px]">{settings.hero_title}</h1>
            {settings.hero_subtitle && (
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted animate-rise">{settings.hero_subtitle}</p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-8 animate-rise">
              <Link href={settings.hero_cta_href || '/men'} className="nav-label border-b border-fg pb-1.5 text-[12px]">
                {settings.hero_cta_label || 'Discover the collection'}
              </Link>
              <Link href="/contact" className="nav-label border-b border-fg/30 pb-1.5 text-[12px] text-fg/75 hover:border-fg">
                Visit the store
              </Link>
            </div>
            <div className="mt-12 grid w-full max-w-5xl flex-1 grid-cols-1 gap-4 sm:grid-cols-3 lg:mt-14 lg:gap-6">
              {STILL_LIFE.map((s, i) => (
                <div key={s.title} className={i > 0 ? 'hidden sm:block' : ''}>
                  <div className="relative h-full min-h-[300px] overflow-hidden bg-surface-2">
                    <GarmentArt title={s.title} color={s.color} className="bg-surface-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop by category */}
      {catTiles.length > 0 && (
        <section className="site-x pt-14 sm:pt-20 lg:pt-28">
          <SectionHead eyebrow="Ready to wear" title="Shop by category" />
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5 lg:gap-6 [&::-webkit-scrollbar]:hidden">
            {catTiles.map(({ c, photo, alt, sample }) => (
              <Link key={c.slug} href={`/men?category=${c.slug}`} className="group block w-[62%] shrink-0 snap-start sm:w-auto">
                <div className="relative aspect-[3/4] overflow-hidden bg-surface-2">
                  {photo ? (
                    <Img src={photo} alt={alt || c.name} sizes="(max-width: 1024px) 50vw, 20vw" className="tile-photo object-cover object-top transition-transform duration-[900ms] group-hover:scale-[1.04]" />
                  ) : (
                    <GarmentArt category={c.slug} title={sample?.title} color={sample?.availableColors[0]?.hex} />
                  )}
                </div>
                <p className="mt-3 text-center font-serif text-[20px] leading-tight sm:mt-4 sm:text-[22px]">{c.name}</p>
                <p className="nav-label mt-1 text-center text-[10px] text-muted group-hover:text-fg">Discover</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newest.length > 0 && (
        <section className="site-x pt-14 sm:pt-20 lg:pt-28">
          <SectionHead eyebrow="Just in" title="New arrivals" href="/shop?sort=newest" linkLabel="View all" />
          <Grid products={newest} />
        </section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section className="site-x pt-14 sm:pt-20 lg:pt-28">
          <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
            {collections.slice(0, 2).map((c, i) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-surface-2 sm:aspect-[5/6]">
                {c.heroImage ? (
                  <>
                    <Img src={c.heroImage} alt={c.name} sizes="(max-width: 768px) 100vw, 50vw" className="transition-transform duration-[900ms] group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-x-0 top-0 bottom-[34%]">
                    <GarmentArt
                      title={i === 0 ? 'Black Tuxedo Suit' : 'Double-Breasted Suit'}
                      color={i === 0 ? '#16171A' : '#3A3B3E'}
                      className="bg-transparent transition-transform duration-[900ms] group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <div className={`absolute inset-x-0 bottom-0 p-6 text-center sm:p-8 lg:p-12 ${c.heroImage ? 'text-white' : 'text-fg'}`}>
                  <p className="nav-label text-[11px] opacity-75">{c.season || 'Collection'}</p>
                  <h3 className="serif-title mt-2 text-[30px] sm:mt-3 sm:text-[34px] lg:text-[44px]">{c.name}</h3>
                  {c.storyQuote && <p className="mx-auto mt-3 max-w-sm text-[14px] italic opacity-80">{c.storyQuote}</p>}
                  <span className="nav-label mt-6 inline-block border-b border-current pb-1 text-[11px]">Discover the collection</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* The essentials */}
      {featuredRest.length > 0 && (
        <section className="site-x pt-14 sm:pt-20 lg:pt-28">
          <SectionHead eyebrow="Our picks" title="The essentials" />
          <Grid products={featuredRest} />
        </section>
      )}

      {/* The collection */}
      {everything.length > 0 && (
        <section className="site-x pt-14 sm:pt-20 lg:pt-28">
          <SectionHead eyebrow="The collection" title="All pieces" href="/men" linkLabel={`Shop all ${all.length}`} />
          <Grid products={everything.slice(0, ALL_LIMIT)} />
        </section>
      )}

      {/* The store */}
      {settings.address && (
        <section className="site-x pt-14 sm:pt-20 lg:pt-28">
          <div className="grid overflow-hidden border border-line lg:grid-cols-2">
            <div className="flex flex-col justify-center bg-surface px-6 py-10 text-center lg:p-16">
              <p className="nav-label text-[11px] text-muted">The store</p>
              <h2 className="serif-title mt-3 text-[30px] sm:text-[34px] lg:text-[44px]">Visit us in San Jose</h2>
              <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-fg/80">{settings.address}</p>
              {settings.opening_hours && <p className="mt-2 text-[14px] text-muted">{settings.opening_hours}</p>}
              <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-muted">
                See the fabrics, try on the fit and put together the complete look in store at Eastridge Center.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-8">
                {maps && (
                  <a href={maps} target="_blank" rel="noreferrer" className="nav-label border-b border-fg pb-1.5 text-[11px]">Get directions</a>
                )}
                <Link href="/contact" className="nav-label border-b border-fg/30 pb-1.5 text-[11px] hover:border-fg">Contact us</Link>
              </div>
            </div>
            {embed && (
              <div className="relative min-h-[260px] bg-surface-2 sm:min-h-[320px]">
                <iframe
                  src={embed}
                  title={`Map of ${settings.store_name}`}
                  className="absolute inset-0 h-full w-full grayscale-[60%] contrast-[0.95]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Services */}
      <section className="site-x pt-14 sm:pt-20 lg:pt-28">
        <div className="grid gap-8 text-center sm:grid-cols-3 sm:gap-10">
          {[
            {
              icon: Truck,
              title: 'Shipping across the US',
              text: settings.free_shipping_threshold
                ? `Tracked delivery, free on orders over ${formatCents(settings.free_shipping_threshold)}.`
                : 'Tracked delivery to your door.',
            },
            { icon: RotateCcw, title: 'Returns & exchanges', text: 'Unworn pieces can be returned or exchanged within 30 days.' },
            { icon: MapPin, title: 'In store', text: 'Try it on at Eastridge Center, San Jose.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col items-center">
              <Icon className="h-5 w-5 text-fg/70" strokeWidth={1.2} />
              <h3 className="mt-4 font-serif text-[22px]">{title}</h3>
              <p className="mt-2 max-w-xs text-[14px] text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
