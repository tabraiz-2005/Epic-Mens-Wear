import Link from 'next/link';
import type { Product } from '@/lib/commerce/types';
import { formatPrice } from '@/lib/utils';
import { Img } from '@/components/ui/Img';
import { GarmentArt } from './GarmentArt';
import { WishlistButton } from './WishlistButton';

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const main = product.images.find((i) => i.isPrimary) ?? product.images[0];
  // The photo marked "hover" in the admin shows when the mouse is over the card.
  const hover = main ? product.images.find((i) => i.isHover && i.url !== main.url) : undefined;
  const soldOut = product.totalStock === 0;
  const badge = soldOut ? 'Sold out' : product.isNewArrival ? 'New' : null;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        {main ? (
          <>
            {/* Each photo sits on its own solid, isolated layer, so the two never show through each other. */}
            <div className="absolute inset-0 isolate bg-surface-2">
              <Img
                src={main.url}
                alt={main.alt}
                priority={priority}
                className="tile-photo object-cover object-top transition-transform duration-[1200ms] ease-out group-hover:scale-[1.035]"
              />
            </div>
            {hover && (
              <div className="absolute inset-0 isolate hidden bg-surface-2 opacity-0 transition-opacity duration-500 ease-out [@media(hover:hover)]:block group-hover:opacity-100">
                <Img src={hover.url} alt={hover.alt} className="tile-photo object-cover object-top" />
              </div>
            )}
          </>
        ) : (
          <GarmentArt category={product.category} title={product.title} color={product.availableColors[0]?.hex} />
        )}

        {badge && (
          <span className="absolute left-3 top-3 z-10 text-[10px] font-medium uppercase tracking-[0.18em] text-fg/70 sm:left-4 sm:top-4">
            {badge}
          </span>
        )}
        <WishlistButton
          product={product}
          className="absolute right-2 top-2 z-10 h-10 w-10 bg-transparent text-fg backdrop-blur-none hover:scale-110 sm:right-3 sm:top-3"
        />
      </div>

      <div className="mt-4 text-center">
        <h3 className="line-clamp-2 text-[13px] leading-snug tracking-[0.03em] text-fg sm:text-[14px]">{product.title}</h3>
        <p className="mt-1.5 text-[13px] text-fg/70 sm:text-[14px]">
          {formatPrice(product.price)}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="ml-2 text-[13px] text-subtle line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </p>
        {product.availableColors.length > 1 && (
          <p className="mt-1 text-[12px] text-muted">{product.availableColors.length} colours</p>
        )}
      </div>
    </Link>
  );
}
