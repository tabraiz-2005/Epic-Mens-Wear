'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { Img } from '@/components/ui/Img';
import { GarmentArt } from './GarmentArt';

interface Hit {
  slug: string;
  title: string;
  price: number;
  image: string | null;
  category: string;
  categoryName: string;
  color?: string | null;
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = await res.json();
        setHits(json.products ?? []);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="border-b border-line bg-bg" onClick={(e) => e.stopPropagation()}>
        <form
          className="site-x flex h-[100px] items-center gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) {
              router.push(`/search?q=${encodeURIComponent(q.trim())}`);
              onClose();
            }
          }}
        >
          <Search className="h-6 w-6 shrink-0 text-muted" strokeWidth={1.5} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search suits, shirts, shoes…"
            className="h-full flex-1 font-display text-xl uppercase tracking-[0.12em] placeholder:text-subtle focus:outline-none sm:text-3xl"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="p-2">
            <X className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </form>

        {q.trim().length >= 2 && (
          <div className="site-x pb-10">
            <p className="label mb-6 text-muted">
              {loading ? 'Searching…' : `${hits.length} ${hits.length === 1 ? 'piece' : 'pieces'}`}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {hits.slice(0, 6).map((h) => (
                <Link key={h.slug} href={`/products/${h.slug}`} onClick={onClose} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden border border-line">
                    {h.image ? <Img src={h.image} alt={h.title} sizes="200px" /> : <GarmentArt category={h.category} title={h.title} color={h.color ?? undefined} />}
                  </div>
                  <p className="mt-3 truncate font-display text-xs font-semibold uppercase tracking-[0.14em]">{h.title}</p>
                  <p className="mt-1 font-display text-xs text-muted">{formatPrice(h.price)}</p>
                </Link>
              ))}
            </div>
            {hits.length > 0 && (
              <Link
                href={`/search?q=${encodeURIComponent(q.trim())}`}
                onClick={onClose}
                className="label mt-8 inline-flex items-center gap-3 text-fg"
              >
                View all results <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
