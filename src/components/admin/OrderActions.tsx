'use client';

import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { useState, useTransition } from 'react';
import { cancelOrder, restockOrder, updateOrder } from '@/app/admin/_actions/orders';
import { Field, Notice } from './FormBits';

type F = 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

export function OrderActions({
  id,
  isCod,
  paid,
  active,
  whatsappConfirm,
  whatsappShipped,
  initial,
}: {
  id: string;
  isCod: boolean;
  paid: boolean;
  active: boolean;
  whatsappConfirm: string | null;
  whatsappShipped: string | null;
  initial: { fulfillmentStatus: F; trackingNumber: string; trackingUrl: string; adminNotes: string; confirmedByPhone: boolean };
}) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.message ?? 'Done.' } : { ok: false, text: r.error ?? 'Failed.' });
      router.refresh();
    });

  if (!active) {
    return (
      <div className="space-y-3">
        {msg && <Notice kind={msg.ok ? 'success' : 'error'}>{msg.text}</Notice>}
        <p className="text-sm text-muted">This order is closed. No further actions.</p>
      </div>
    );
  }

  const canShip = isCod || paid;

  return (
    <div className="space-y-5">
      {msg && <Notice kind={msg.ok ? 'success' : 'error'}>{msg.text}</Notice>}

      {isCod && (
        <div className="space-y-3 border-b border-line pb-5">
          <p className="field-label">1 · Confirm with the customer</p>
          {whatsappConfirm && (
            <a href={whatsappConfirm} target="_blank" rel="noreferrer" className="btn-outline h-10 w-full">
              <MessageCircle className="h-4 w-4" /> Confirm on WhatsApp
            </a>
          )}
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={f.confirmedByPhone}
              onChange={(e) => setF({ ...f, confirmedByPhone: e.target.checked })}
              className="h-4 w-4 accent-current"
            />
            Customer confirmed the order
          </label>
          <p className="text-xs text-subtle">Confirming COD orders before dispatch cuts fake orders and refused parcels.</p>
        </div>
      )}

      {canShip && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateOrder(id, f));
          }}
        >
          {isCod && <p className="field-label !mb-0">2 · Ship it</p>}
          <Field label="Status">
            <select value={f.fulfillmentStatus} onChange={(e) => setF({ ...f, fulfillmentStatus: e.target.value as F })} className="field">
              <option value="unfulfilled">New — not packed</option>
              <option value="processing">Packing</option>
              <option value="shipped">Shipped (with courier)</option>
              <option value="delivered">{isCod ? 'Delivered — cash received' : 'Delivered'}</option>
              <option value="returned">Returned / refused</option>
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Courier tracking number">
              <input value={f.trackingNumber} onChange={(e) => setF({ ...f, trackingNumber: e.target.value })} className="field" placeholder="TCS / Leopards / PostEx #" />
            </Field>
            <Field label="Tracking link (optional)">
              <input value={f.trackingUrl} onChange={(e) => setF({ ...f, trackingUrl: e.target.value })} className="field" placeholder="https://…" />
            </Field>
          </div>
          <Field label="Internal notes" hint="Only visible to admins.">
            <textarea rows={3} value={f.adminNotes} onChange={(e) => setF({ ...f, adminNotes: e.target.value })} className="field h-auto py-3" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="btn-primary h-10 px-5">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
            {f.fulfillmentStatus !== 'shipped' && f.fulfillmentStatus !== 'delivered' && (
              <button type="button" disabled={busy} className="btn-outline h-10 px-4" onClick={() => {
                  const next = { ...f, fulfillmentStatus: 'shipped' as F };
                  setF(next);
                  run(() => updateOrder(id, next));
                }}>
                Mark shipped
              </button>
            )}
            {f.fulfillmentStatus === 'shipped' && (
              <button type="button" disabled={busy} className="btn-outline h-10 px-4" onClick={() => {
                  const next = { ...f, fulfillmentStatus: 'delivered' as F };
                  setF(next);
                  run(() => updateOrder(id, next));
                }}>
                {isCod ? 'Delivered & cash received' : 'Mark delivered'}
              </button>
            )}
          </div>
          {whatsappShipped && f.trackingNumber && (
            <a href={whatsappShipped} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-muted underline underline-offset-4 hover:text-fg">
              <MessageCircle className="h-3.5 w-3.5" /> Send tracking to customer on WhatsApp
            </a>
          )}
        </form>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        {!paid && (
          <button
            type="button"
            disabled={busy}
            onClick={() => confirm('Cancel this order and return its items to stock?') && run(() => cancelOrder(id))}
            className="btn h-10 border border-danger/50 px-4 text-danger hover:bg-danger/10"
          >
            Cancel order
          </button>
        )}
        {f.fulfillmentStatus === 'returned' && (
          <button type="button" disabled={busy} onClick={() => run(() => restockOrder(id))} className="btn-outline h-10 px-4">
            Return items to stock
          </button>
        )}
      </div>
    </div>
  );
}
