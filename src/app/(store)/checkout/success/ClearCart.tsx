'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export function ClearCart() {
  const { clearCart, hydrated } = useCart();
  useEffect(() => {
    if (hydrated) clearCart();
  }, [hydrated, clearCart]);
  return null;
}
