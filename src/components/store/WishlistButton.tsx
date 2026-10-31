'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import type { Product } from '@/lib/commerce/types';
import { cn } from '@/lib/utils';

export function WishlistButton({ product, className }: { product: Product; className?: string }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const on = isWishlisted(product.id);
  return (
    <button
      type="button"
      aria-label={on ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
      }}
      className={cn(
        'flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#0C0D11]/90 text-white backdrop-blur transition-transform hover:scale-105',
        className
      )}
    >
      <Heart className={cn('h-5 w-5', on && 'fill-[#E0475B] text-[#E0475B]')} strokeWidth={1.75} />
    </button>
  );
}
