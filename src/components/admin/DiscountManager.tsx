'use client';

import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { deleteDiscount, saveDiscount, type DiscountPayload } from '@/app/admin/_actions/store';
import { formatCents } from '@/lib/utils';
import { Field, Notice } from './FormBits';
import { Badge } from './Page';

export interface DiscountRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  usage_limit: number | null;
  times_used: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

const toLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function state(d: DiscountRow): { tone: 'green' | 'amber' | 'red' | 'grey'; label: string } {
  const now = Date.now();
  if (!d.is_active) return { tone: 'grey', label: 'Off' };
  if (d.ends_at && new Date(d.ends_at).getTime() < now) return { tone: 'red', label: 'Expired' };
  if (d.usage_limit !== null && d.times_used >= d.usage_limit) return { tone: 'red', label: 'Used up' };
  if (d.starts_at && new Date(d.starts_at).getTime() > now) return { tone: 'amber', label: 'Scheduled' };
  return { tone: 'green', label: 'Active' };
}

export function DiscountManager({ rows }: { rows: DiscountRow[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<DiscountPayload | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const open = (d?: DiscountRow) =>
    setEdit(
      d
        ? {
            id: d.id,
            code: d.code,
            description: d.description ?? '',
            type: d.discount_type,
            value: d.discount_type === 'percent' ? d.value : d.value / 100,
            minSubtotal: d.min_subtotal / 100,
            usageLimit: d.usage_limit,
            startsAt: toLocal(d.starts_at),
            endsAt: toLocal(d.ends_at),
            isActive: d.is_active,
          }
        : { code: '', description: '', type: 'percent', value: 10, minSubtotal: 0, usageLimit: null, startsAt: '', endsAt: '', isActive: true }
    );

  const save = () =>
    edit &&
    start(async () => {
      const res = await saveDiscount({
        ...edit,
        startsAt: edit.startsAt ? new Date(edit.startsAt).toISOString() : null,
        endsAt: edit.endsAt ? new Date(edit.endsAt).toISOString() : null,
      });
      if (res.ok) {
        setEdit(null);
        setMsg({ ok: true, text: 'Discount saved.' });
        router.refresh();
      } else setMsg({ ok: false, text: res.error });
    });

  return (
    <div className="space-y-4">
      {msg && <Notice kind={msg.ok ? 'success' : 'error'}>{msg.text}</Notice>}
      {edit ? (
        <div className="border border-fg bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Code">
              <input autoFocus value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase().replace(/\s/g, '') })} className="field uppercase" placeholder="PROM20" />
            </Field>
            <Field label="Type">
              <select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as 'percent' })} className="field">
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </Field>
            <Field label={edit.type === 'percent' ? 'Percent off' : 'Amount off ($)'}>
              <input type="number" min={1} max={edit.type === 'percent' ? 100 : undefined} value={edit.value} onChange={(e) => setEdit({ ...edit, value: Number(e.target.value) })} className="field" />
            </Field>
            <Field label="Minimum spend ($)">
              <input type="number" min={0} value={edit.minSubtotal} onChange={(e) => setEdit({ ...edit, minSubtotal: Number(e.target.value) })} className="field" />
            </Field>
            <Field label="Total uses allowed" hint="Empty = unlimited">
              <input type="number" min={1} value={edit.usageLimit ?? ''} onChange={(e) => setEdit({ ...edit, usageLimit: e.target.value ? Number(e.target.value) : null })} className="field" />
            </Field>
            <Field label="Starts (optional)">
              <input type="datetime-local" value={edit.startsAt ?? ''} onChange={(e) => setEdit({ ...edit, startsAt: e.target.value })} className="field" />
            </Field>
            <Field label="Ends (optional)">
              <input type="datetime-local" value={edit.endsAt ?? ''} onChange={(e) => setEdit({ ...edit, endsAt: e.target.value })} className="field" />
            </Field>
            <label className="flex items-center gap-3 pt-6 text-sm">
              <input type="checkbox" checked={edit.isActive} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} className="h-4 w-4 accent-current" />
              Active
            </label>
            <Field label="Internal note" className="sm:col-span-2 lg:col-span-4">
              <input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className="field" placeholder="e.g. Prom season Instagram campaign" />
            </Field>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={save} disabled={pending} className="btn-primary h-10 px-6">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save discount
            </button>
            <button type="button" onClick={() => setEdit(null)} className="btn-ghost h-10">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => open()} className="btn-primary h-10 px-5">
          <Plus className="h-4 w-4" /> New discount code
        </button>
      )}

      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="text-left font-display text-[10px] uppercase tracking-label text-muted">
              {['Code', 'Discount', 'Conditions', 'Used', 'Status', ''].map((h) => (
                <th key={h} className="border-b border-line px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No discount codes yet.</td></tr>
            )}
            {rows.map((d) => {
              const s = state(d);
              return (
                <tr key={d.id} className="border-b border-line">
                  <td className="px-4 py-3">
                    <span className="font-display font-bold tracking-[0.1em]">{d.code}</span>
                    {d.description && <span className="block text-xs text-subtle">{d.description}</span>}
                  </td>
                  <td className="px-4 py-3">{d.discount_type === 'percent' ? `${d.value}% off` : `${formatCents(d.value)} off`}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {d.min_subtotal ? `Min ${formatCents(d.min_subtotal)}` : 'Any order'}
                    {d.ends_at && <span className="block">Ends {new Date(d.ends_at).toLocaleDateString()}</span>}
                  </td>
                  <td className="px-4 py-3">{d.times_used}{d.usage_limit ? ` / ${d.usage_limit}` : ''}</td>
                  <td className="px-4 py-3"><Badge tone={s.tone}>{s.label}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => open(d)} className="p-2 text-muted hover:text-fg" aria-label={`Edit ${d.code}`}><Pencil className="h-4 w-4" /></button>
                    <button
                      type="button"
                      onClick={() =>
                        confirm(`Delete ${d.code}?`) &&
                        start(async () => {
                          const r = await deleteDiscount(d.id);
                          if (!r.ok) setMsg({ ok: false, text: r.error });
                          router.refresh();
                        })
                      }
                      className="p-2 text-muted hover:text-danger"
                      aria-label={`Delete ${d.code}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
