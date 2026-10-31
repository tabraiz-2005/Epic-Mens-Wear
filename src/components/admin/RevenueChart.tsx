'use client';

import { useState } from 'react';
import { formatCents } from '@/lib/utils';

/** Single-series daily revenue bars with a hover tooltip. */
export function RevenueChart({ days }: { days: { date: string; cents: number; orders: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.cents));
  const h = 160;

  return (
    <div className="relative">
      <div className="flex h-[160px] items-end gap-[2px]" role="img" aria-label="Revenue per day for the last 30 days">
        {days.map((d, i) => {
          const bh = d.cents === 0 ? 2 : Math.max(4, (d.cents / max) * h);
          return (
            <div
              key={d.date}
              className="group relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className={`w-full rounded-t-[4px] transition-colors ${d.cents === 0 ? 'bg-line' : hover === i ? 'bg-fg' : 'bg-fg/70'}`}
                style={{ height: bh }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-display text-[10px] uppercase tracking-[0.14em] text-subtle">
        <span>{new Date(days[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>Today</span>
      </div>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-line-strong bg-bg px-3 py-2 text-xs shadow-lg"
          style={{ left: `${((hover + 0.5) / days.length) * 100}%` }}
        >
          <p className="font-display text-[10px] uppercase tracking-label text-muted">
            {new Date(days[hover].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="mt-1 font-semibold">{formatCents(days[hover].cents)}</p>
          <p className="text-muted">
            {days[hover].orders} order{days[hover].orders === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  );
}
