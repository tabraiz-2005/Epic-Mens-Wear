'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { updateStock } from '@/app/admin/_actions/store';
import { cn } from '@/lib/utils';
import { Notice } from './FormBits';

export interface InvRow {
  id: string;
  productId: string;
  title: string;
  status: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  stock: number;
  isActive: boolean;
}

export function InventoryTable({ rows, threshold }: { rows: InvRow[]; threshold: number }) {
  const router = useRouter();
  const [edits, setEdits] = useState<Record<string, { stock: string; isActive: boolean }>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const changed = useMemo(
    () =>
      Object.entries(edits).filter(([id, e]) => {
        const r = rows.find((x) => x.id === id)!;
        return Number(e.stock) !== r.stock || e.isActive !== r.isActive;
      }),
    [edits, rows]
  );

  const val = (r: InvRow) => edits[r.id] ?? { stock: String(r.stock), isActive: r.isActive };
  const set = (r: InvRow, patch: Partial<{ stock: string; isActive: boolean }>) => setEdits((e) => ({ ...e, [r.id]: { ...val(r), ...patch } }));

  const save = () =>
    start(async () => {
      const res = await updateStock(changed.map(([id, e]) => ({ id, stock: Number(e.stock), isActive: e.isActive })));
      if (res.ok) {
        setEdits({});
        setMsg({ ok: true, text: res.message ?? 'Saved.' });
        router.refresh();
      } else setMsg({ ok: false, text: res.error });
    });

  return (
    <div>
      <div className="sticky top-14 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 border border-line bg-surface px-4 py-3 lg:top-0">
        <span className="text-sm text-muted">{changed.length ? `${changed.length} unsaved change${changed.length === 1 ? '' : 's'}` : `${rows.length} variants`}</span>
        <div className="flex gap-2">
          {changed.length > 0 && (
            <button type="button" onClick={() => setEdits({})} className="btn-ghost h-9">
              Discard
            </button>
          )}
          <button type="button" disabled={!changed.length || pending} onClick={save} className="btn-primary h-9 px-5">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save stock
          </button>
        </div>
      </div>
      {msg && <Notice kind={msg.ok ? 'success' : 'error'} className="mb-4">{msg.text}</Notice>}
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left font-display text-[10px] uppercase tracking-label text-muted">
              <th className="border-b border-line px-4 py-3 font-semibold">Product</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Variant</th>
              <th className="border-b border-line px-4 py-3 font-semibold">SKU</th>
              <th className="border-b border-line px-4 py-3 font-semibold">On sale</th>
              <th className="border-b border-line px-4 py-3 font-semibold">Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const v = val(r);
              const n = Number(v.stock);
              const isChanged = edits[r.id] && (n !== r.stock || v.isActive !== r.isActive);
              return (
                <tr key={r.id} className={cn('border-b border-line', isChanged && 'bg-gold/5')}>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/products/${r.productId}`} className="hover:underline">{r.title}</Link>
                    {r.status !== 'active' && <span className="ml-2 text-xs uppercase text-subtle">{r.status}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 border border-line" style={{ background: r.colorHex }} />
                      {r.color} / <b className="font-display">{r.size}</b>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">{r.sku}</td>
                  <td className="px-4 py-2.5">
                    <input type="checkbox" checked={v.isActive} onChange={(e) => set(r, { isActive: e.target.checked })} className="h-4 w-4 accent-current" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => set(r, { stock: String(Math.max(0, n - 1)) })} className="h-9 w-8 border border-line text-muted hover:text-fg">−</button>
                      <input
                        inputMode="numeric"
                        value={v.stock}
                        onChange={(e) => set(r, { stock: e.target.value.replace(/\D/g, '') || '0' })}
                        className={cn('field h-9 w-16 text-center', n === 0 ? 'border-danger/60 text-danger' : n <= threshold && 'border-gold/60')}
                      />
                      <button type="button" onClick={() => set(r, { stock: String(n + 1) })} className="h-9 w-8 border border-line text-muted hover:text-fg">+</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
