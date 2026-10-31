'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CartLine } from '@/components/store/CartLine';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, subtotal, itemCount, hydrated } = useCart();
  return (
    <div className="site-x pt-10 lg:pt-14">
      <p className="eyebrow">Your selection</p>
      <h1 className="display mt-4 text-[40px] lg:text-[60px]">Your bag</h1>
      {hydrated && items.length === 0 ? (
        <div className="mt-10 flex flex-col items-start gap-6 border-t border-line pt-10">
          <p className="text-muted">Nothing here yet.</p>
          <Link href="/shop" className="btn-primary">Browse the catalogue</Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 border-t border-line lg:grid-cols-[1.6fr_1fr] lg:gap-20">
          <div className="divide-y divide-line">
            {items.map((i) => (
              <CartLine key={i.id} item={i} large />
            ))}
          </div>
          <aside className="h-fit border border-line bg-surface p-8 lg:mt-5">
            <div className="flex justify-between font-display text-sm uppercase tracking-label">
              <span className="text-muted">{itemCount} items</span>
              <span className="font-bold">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-3 text-xs text-muted">Shipping and discount codes are applied at checkout.</p>
            <Link href="/checkout" className="btn-primary mt-8 w-full">Checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
