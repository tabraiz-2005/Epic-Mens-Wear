'use client';

import { ChevronDown, Lock, MapPin, MessageCircle, RotateCcw, Share2, Truck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/commerce/types';
import { cn, formatPrice } from '@/lib/utils';
import { whatsappLink } from '@/lib/phone';
import { Img } from '@/components/ui/Img';
import { GarmentArt } from './GarmentArt';
import { WishlistButton } from './WishlistButton';

function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-line" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[14px] tracking-[0.02em] text-fg [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" strokeWidth={1.5} />
      </summary>
      <div className="pb-5 text-[13px] leading-relaxed text-fg/80">{children}</div>
    </details>
  );
}

export function ProductView({
  product,
  lowStockThreshold,
  freeShipping,
  deliveryNote,
  whatsappPhone,
}: {
  product: Product;
  lowStockThreshold: number;
  freeShipping: boolean;
  deliveryNote?: string;
  whatsappPhone?: string | null;
}) {
  const { addItem, setIsCartOpen } = useCart();
  const router = useRouter();
  const [pageUrl, setPageUrl] = useState('');
  useEffect(() => setPageUrl(window.location.href.split('?')[0]), []);

  const firstAvailable = product.variants.find((v) => v.inStock) ?? product.variants[0];
  const [color, setColor] = useState(firstAvailable?.color ?? '');
  const colorHex = product.availableColors.find((c) => c.name === color)?.hex ?? product.availableColors[0]?.hex;
  const [size, setSize] = useState<string | null>(firstAvailable?.size ?? null);
  const [slide, setSlide] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  const sizesForColor = useMemo(
    () =>
      product.availableSizes.map((s) => {
        const v = product.variants.find((x) => x.color === color && x.size === s);
        return { size: s, available: Boolean(v?.inStock) };
      }),
    [product, color]
  );

  const variant = product.variants.find((v) => v.color === color && v.size === size);
  const price = variant?.price ?? product.price;
  const compareAt = variant?.compareAtPrice ?? product.compareAtPrice;
  const discount = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
  const canBuy = Boolean(variant && variant.inStock);
  const soldOut = product.totalStock === 0;
  const stockLeft = variant ? variant.inventoryQuantity : 0;

  // Gallery: the chosen colour's photo first, then the rest.
  const images = useMemo(() => {
    const colourImg = product.variants.find((v) => v.color === color && v.image)?.image;
    const list = product.images.filter((i) => !i.isHover || product.images.length > 1);
    if (colourImg && !list.some((i) => i.url === colourImg)) return [{ url: colourImg, alt: product.title }, ...list];
    if (colourImg) return [...list.filter((i) => i.url === colourImg), ...list.filter((i) => i.url !== colourImg)];
    return list;
  }, [product, color]);

  const chooseColor = (c: string) => {
    setColor(c);
    const keep = product.variants.find((v) => v.color === c && v.size === size && v.inStock);
    if (!keep) setSize(product.variants.find((v) => v.color === c && v.inStock)?.size ?? null);
    setSlide(0);
    railRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const addToBag = () => {
    if (!variant || !variant.inStock) return;
    addItem(product, variant, 1); // opens the bag drawer
  };
  const buyNow = () => {
    if (!variant || !variant.inStock) return;
    addItem(product, variant, 1);
    setIsCartOpen(false);
    router.push('/checkout');
  };
  const share = async () => {
    const url = pageUrl || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* cancelled */
    }
  };

  const waOrder = whatsappLink(
    whatsappPhone,
    `Hi Epic Menswear, I have a question about: ${product.title}` +
      (color ? ` · ${color}` : '') +
      (size ? ` · size ${size}` : '') +
      ` · ${formatPrice(price)}` +
      (pageUrl ? `\n${pageUrl}` : '')
  );

  const dept = product.gender === 'men' || product.gender === 'unisex' ? 'Men' : null;

  return (
    <section className="site-x mx-auto grid max-w-[1280px] gap-6 pt-3 md:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] md:gap-10 md:pt-8 lg:gap-14">
      {/* Gallery */}
      <div className="relative -mx-4 sm:mx-0 md:ml-auto md:w-full md:max-w-[620px]">
        <div
          ref={railRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar md:block md:space-y-3 md:overflow-visible"
        >
          {images.length ? (
            images.map((img, i) => (
              <div key={img.url + i} className="relative aspect-[4/5] max-h-[72svh] w-full shrink-0 snap-center bg-surface-2 md:max-h-none">
                <Img src={img.url} alt={img.alt || product.title} sizes="(max-width:768px) 100vw, 620px" priority={i === 0} className="tile-photo object-cover object-top" />
              </div>
            ))
          ) : (
            <div className="relative aspect-[4/5] w-full bg-surface">
              <GarmentArt category={product.category} title={product.title} color={colorHex} />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-2 md:hidden">
            {images.map((_, i) => (
              <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i === slide ? 'bg-fg' : 'bg-line-strong')} />
            ))}
          </div>
        )}
      </div>

      {/* Buy panel */}
      <div className="md:sticky md:top-28 md:self-start lg:top-[136px]">
        <nav className="flex flex-wrap items-center gap-2 text-[12px] text-muted" aria-label="Breadcrumb">
          {dept && (
            <>
              <Link href={`/${dept.toLowerCase()}`} className="hover:text-fg">{dept}</Link>
              <span>/</span>
            </>
          )}
          <Link href={`/shop?category=${product.category}`} className="text-fg/80 hover:text-fg">{product.categoryName}</Link>
        </nav>

        <div className="mt-4 flex items-start justify-between gap-3">
          <h1 className="font-serif text-[clamp(28px,2.4vw,36px)] font-normal leading-[1.1]">{product.title}</h1>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={share} aria-label="Share" className="flex h-9 w-9 items-center justify-center text-fg/80 hover:text-fg">
              <Share2 className="h-[18px] w-[18px]" strokeWidth={1.4} />
            </button>
            <WishlistButton product={product} className="h-9 w-9 bg-transparent text-fg backdrop-blur-0 hover:scale-100" />
          </div>
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px]">
          <span>{formatPrice(price)}</span>
          {discount > 0 && (
            <>
              <span className="text-[13px] text-subtle line-through">{formatPrice(compareAt!)}</span>
              <span className="text-[12px] font-medium text-brand">-{discount}%</span>
            </>
          )}
        </p>
        {product.subtitle && <p className="mt-2 text-[13px] text-muted">{product.subtitle}</p>}

        {/* Colour */}
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px]">
              Colour: <span className="text-fg/80">{color || '—'}</span>
            </p>
            {product.availableColors.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2.5">
                {product.availableColors.map((c) => {
                  const any = product.variants.some((v) => v.color === c.name && v.inStock);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => chooseColor(c.name)}
                      aria-label={c.name}
                      aria-pressed={color === c.name}
                      title={c.name}
                      className={cn(
                        'h-7 w-7 rounded-full border p-[3px] transition-colors',
                        color === c.name ? 'border-fg' : 'border-transparent hover:border-line-strong',
                        !any && 'opacity-40'
                      )}
                    >
                      <span className="block h-full w-full rounded-full ring-1 ring-inset ring-line-strong" style={{ backgroundColor: c.hex }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Size */}
        <div className="mt-5 border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px]">
              Size: <span className="text-fg/80">{size ?? 'Select'}</span>
            </p>
            <Link href="/size-guide" className="text-[13px] text-muted underline underline-offset-4 hover:text-fg">
              Size guide
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {sizesForColor.map(({ size: s, available }) => (
              <button
                key={s}
                type="button"
                disabled={!available}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={cn(
                  'h-11 border text-[13px] transition-colors',
                  size === s ? 'border-fg bg-fg text-bg' : 'border-line text-fg/85 hover:border-fg',
                  !available && 'cursor-not-allowed text-subtle line-through hover:border-line'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {canBuy && stockLeft > 0 && stockLeft <= lowStockThreshold && (
            <p className="mt-3 text-[13px] text-warning">Only {stockLeft} left in this size</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            disabled={!canBuy}
            onClick={addToBag}
            className="flex h-12 w-full items-center justify-center bg-fg font-display text-[12px] font-medium uppercase tracking-[0.26em] text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {soldOut ? 'Sold out' : !variant ? 'Select a size' : !variant.inStock ? 'Unavailable' : 'Add to bag'}
          </button>
          <button
            type="button"
            disabled={!canBuy}
            onClick={buyNow}
            className="flex h-12 w-full items-center justify-center border border-fg font-display text-[12px] font-medium uppercase tracking-[0.26em] text-fg transition-colors hover:bg-fg hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            Buy now
          </button>
          {waOrder && (
            <a
              href={waOrder}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2.5 text-[13px] text-fg/85 hover:text-fg"
            >
              <MessageCircle className="h-5 w-5 text-[#25D366]" strokeWidth={1.6} /> Ask about this piece
            </a>
          )}
        </div>

        <ul className="mt-5 space-y-2 border-t border-line pt-5 text-[12px] text-muted">
          <li className="flex items-center gap-3">
            <Lock className="h-4 w-4 shrink-0" strokeWidth={1.5} /> Secure card checkout
          </li>
          <li className="flex items-center gap-3">
            <Truck className="h-4 w-4 shrink-0" strokeWidth={1.5} /> {freeShipping ? 'Free shipping on this piece' : deliveryNote ?? 'Tracked shipping across the US'}
          </li>
          <li className="flex items-center gap-3">
            <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={1.5} /> 30-day returns & exchanges
          </li>
          <li className="flex items-center gap-3">
            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} /> Try it on at Eastridge Center, San Jose
          </li>
        </ul>

        {/* Details */}
        <div className="mt-6 border-t border-line">
          <Accordion title="Details" open>
            {product.description && <p>{product.description}</p>}
            {product.craftsmanshipNotes && <p className="mt-3">{product.craftsmanshipNotes}</p>}
            {product.fitInfo && <p className="mt-3"><span className="text-fg">Fit:</span> {product.fitInfo}</p>}
            {product.sku && <p className="mt-3 text-[12px] text-subtle">SKU: {product.sku}</p>}
          </Accordion>
          {(product.material || product.careInstructions.length > 0) && (
            <Accordion title="Composition & care">
              {product.material && <p>{product.material}</p>}
              {product.careInstructions.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {product.careInstructions.map((c) => (
                    <li key={c}>— {c}</li>
                  ))}
                </ul>
              )}
            </Accordion>
          )}
          <Accordion title="Shipping & returns">
            <p>{product.shippingInfo || 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.'}</p>
            <p className="mt-3">
              <Link href="/shipping" className="underline underline-offset-4">Shipping</Link>
              {' · '}
              <Link href="/returns" className="underline underline-offset-4">Exchanges & returns</Link>
            </p>
          </Accordion>
        </div>
      </div>
    </section>
  );
}
