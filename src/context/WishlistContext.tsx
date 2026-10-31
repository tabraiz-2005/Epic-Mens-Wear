'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Product, WishlistItem } from '@/lib/commerce/types';
import { primaryImage } from '@/lib/utils';

const KEY = 'epic_wishlist_v1';

interface WishlistContextType {
  wishlist: WishlistItem[];
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  removeItem: (productId: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setWishlist(JSON.parse(saved));
    } catch {
      /* storage unavailable */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(wishlist));
    } catch {
      /* storage unavailable */
    }
  }, [wishlist, hydrated]);

  const isWishlisted = useCallback((id: string) => wishlist.some((w) => w.productId === id), [wishlist]);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) =>
      prev.some((w) => w.productId === product.id)
        ? prev.filter((w) => w.productId !== product.id)
        : [
            {
              productId: product.id,
              productSlug: product.slug,
              title: product.title,
              category: product.categoryName,
              price: product.price,
              image: primaryImage(product.images),
              addedAt: new Date().toISOString(),
            },
            ...prev,
          ]
    );
  }, []);

  const removeItem = useCallback((id: string) => setWishlist((prev) => prev.filter((w) => w.productId !== id)), []);

  const value = useMemo(
    () => ({ wishlist, toggleWishlist, isWishlisted, removeItem, count: wishlist.length }),
    [wishlist, toggleWishlist, isWishlisted, removeItem]
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
