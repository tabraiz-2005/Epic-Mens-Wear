'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/utils';
import { Img } from '@/components/ui/Img';
import { GarmentArt } from '@/components/store/GarmentArt';

export default function WishlistPage() {
  const { wishlist, removeItem } = useWishlist();
  return (
    <div className="site-x pt-10 lg:pt-14">
      <p className="eyebrow">Saved for later</p>
      <h1 className="serif-title mt-4 text-[44px] lg:text-[64px]">Wishlist</h1>
      <div className="mt-10 border-t border-line pt-10">
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-start gap-6">
            <p className="text-muted">Tap the heart on any piece to save it here.</p>
            <Link href="/shop" className="btn-primary">Browse the catalogue</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:gap-x-[42px] xl:grid-cols-4">
            {wishlist.map((w) => (
              <div key={w.productId} className="group relative">
                <Link href={`/products/${w.productSlug}`}>
                  <div className="relative aspect-[3/4.1] overflow-hidden border border-line">
                    {w.image ? <Img src={w.image} alt={w.title} /> : <GarmentArt category={w.category} title={w.title} />}
                  </div>
                  <div className="mt-4 flex justify-between gap-4">
                    <h3 className="truncate font-display text-sm font-semibold uppercase tracking-[0.14em]">{w.title}</h3>
                    <span className="font-display text-sm font-semibold">{formatPrice(w.price)}</span>
                  </div>
                </Link>
                <button
                  onClick={() => removeItem(w.productId)}
                  aria-label={`Remove ${w.title}`}
                  className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#0C0D11]/90 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
