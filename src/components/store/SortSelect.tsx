'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

const OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get('sort') ?? 'featured';

  return (
    <label className="flex items-center gap-2.5">
      <SlidersHorizontal className="h-4 w-4 text-muted" strokeWidth={1.5} />
      <span className="text-[13px] text-muted">Sort</span>
      <span className="relative">
        <select
          value={current}
          onChange={(e) => {
            const next = new URLSearchParams(params.toString());
            if (e.target.value === 'featured') next.delete('sort');
            else next.set('sort', e.target.value);
            const qs = next.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
          }}
          className="h-9 appearance-none border border-line bg-transparent pl-3 pr-9 text-[13px] text-fg focus:border-fg focus:outline-none"
          aria-label="Sort products"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" strokeWidth={1.5} />
      </span>
    </label>
  );
}
