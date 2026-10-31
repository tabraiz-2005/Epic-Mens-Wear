'use client';

import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { CartItem } from '@/lib/commerce/types';
import { formatPrice } from '@/lib/utils';
import { Img } from '@/components/ui/Img';
import { GarmentArt } from './GarmentArt';

export function CartLine({ item, onNavigate, large }: { item: CartItem; onNavigate?: () => void; large?: boolean }) {
  const { updateQuantity, removeItem } = useCart();
  return (
    <div className="flex gap-4 py-5">
      <Link
        href={`/products/${item.productSlug}`}
        onClick={onNavigate}
        className={`relative shrink-0 overflow-hidden border border-line ${large ? 'h-40 w-32' : 'h-32 w-24'}`}
      >
        {item.image ? <Img src={item.image} alt={item.title} sizes="128px" /> : <GarmentArt category={item.category} title={item.title} color={item.color} />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${item.productSlug}`}
            onClick={onNavigate}
            className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] hover:underline"
          >
            {item.title}
          </Link>
          <button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.title}`} className="-mr-1 p-1 text-muted hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 font-display text-[11px] uppercase tracking-label text-muted">
          {item.color} / {item.size}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex h-9 items-center border border-line">
            <button
              className="flex h-full w-9 items-center justify-center text-muted hover:text-fg"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center font-display text-sm">{item.quantity}</span>
            <button
              className="flex h-full w-9 items-center justify-center text-muted hover:text-fg disabled:opacity-30"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.maxQuantity}
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="font-display text-sm font-semibold tracking-[0.06em]">{formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
    </div>
  );
}
