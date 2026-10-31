'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, Product, ProductVariant } from '@/lib/commerce/types';
import { primaryImage } from '@/lib/utils';

const KEY = 'epic_cart_v1';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      /* storage unavailable */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, variant: ProductVariant, quantity = 1) => {
    const max = Math.max(1, Math.min(20, variant.inventoryQuantity));
    setItems((prev) => {
      const i = prev.findIndex((it) => it.variantId === variant.id);
      if (i > -1) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: Math.min(next[i].quantity + quantity, max), maxQuantity: max };
        return next;
      }
      return [
        ...prev,
        {
          id: variant.id,
          productId: product.id,
          productSlug: product.slug,
          variantId: variant.id,
          title: product.title,
          category: product.categoryName,
          color: variant.color,
          size: variant.size,
          price: variant.price || product.price,
          image: variant.image || primaryImage(product.images),
          quantity: Math.min(quantity, max),
          maxQuantity: max,
        },
      ];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((it) => it.id !== id)), []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((it) => it.id !== id)
        : prev.map((it) => (it.id === id ? { ...it, quantity: Math.min(quantity, it.maxQuantity) } : it))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      itemCount: items.reduce((n, it) => n + it.quantity, 0),
      subtotal: items.reduce((n, it) => n + it.price * it.quantity, 0),
      hydrated,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, isCartOpen, hydrated]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
