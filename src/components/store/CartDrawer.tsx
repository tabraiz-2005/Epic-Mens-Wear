'use client';

import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';
import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { CartLine } from './CartLine';

export function FreeShippingBar({ subtotal, threshold }: { subtotal: number; threshold: number | null }) {
  if (!threshold) return null;
  const left = threshold / 100 - subtotal;
  const pct = Math.min(100, (subtotal / (threshold / 100)) * 100);
  return (
    <div>
      <p className="font-display text-[11px] uppercase tracking-label text-muted">
        {left > 0 ? (
          <>
            <span className="text-fg">{formatPrice(left)}</span> away from free shipping
          </>
        ) : (
          <span className="text-fg">Free shipping unlocked</span>
        )}
      </p>
      <div className="mt-3 h-[2px] w-full bg-line">
        <div className="h-full bg-fg transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number | null }) {
  const { items, isCartOpen, setIsCartOpen, subtotal, itemCount } = useCart();
  const close = () => setIsCartOpen(false);

  useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsCartOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={close} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-line bg-bg animate-slide-in">
        <div className="flex h-[72px] items-center justify-between border-b border-line px-6 lg:h-[100px] lg:px-8">
          <h2 className="font-display text-[15px] font-normal tracking-[0.18em]">
            Your selection <span className="text-muted">({itemCount})</span>
          </h2>
          <button onClick={close} aria-label="Close bag" className="-mr-2 p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <ShoppingBag className="h-10 w-10 text-subtle" strokeWidth={1.2} />
            <p className="label text-muted">Your bag is empty</p>
            <Link href="/shop" onClick={close} className="btn-outline">
              Browse the catalogue
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-6 py-5 lg:px-8">
              <FreeShippingBar subtotal={subtotal} threshold={freeShippingThreshold} />
            </div>
            <div className="flex-1 divide-y divide-line overflow-y-auto px-6 lg:px-8">
              {items.map((it) => (
                <CartLine key={it.id} item={it} onNavigate={close} />
              ))}
            </div>
            <div className="space-y-4 border-t border-line px-6 py-6 lg:px-8">
              <div className="flex items-center justify-between font-display text-sm uppercase tracking-label">
                <span className="text-muted">Subtotal</span>
                <span className="font-bold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Shipping and discount codes are applied at checkout.</p>
              <Link href="/checkout" onClick={close} className="btn-primary w-full">
                Checkout — {formatPrice(subtotal)}
              </Link>
              <Link href="/cart" onClick={close} className="btn-ghost w-full">
                View bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
