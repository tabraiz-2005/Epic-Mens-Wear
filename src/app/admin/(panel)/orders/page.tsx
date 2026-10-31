import Link from 'next/link';
import { Download } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Badge, Empty, PageBody, PageHeader, statusTone, td, th } from '@/components/admin/Page';
import { cn, formatCents } from '@/lib/utils';
import { formatPhone } from '@/lib/phone';

export const metadata = { title: 'Orders' };

const VIEWS = [
  { v: 'to-fulfil', label: 'To fulfil' },
  { v: 'shipped', label: 'Shipped' },
  { v: 'delivered', label: 'Delivered' },
  { v: 'unpaid', label: 'Awaiting payment' },
  { v: 'closed', label: 'Cancelled / refunded' },
  { v: 'all', label: 'All' },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const view = VIEWS.some((x) => x.v === sp.view) ? sp.view! : 'to-fulfil';
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 50;

  let q = getSupabaseAdmin()
    .from('orders')
    .select('id, order_number, customer_email, customer_first_name, customer_last_name, customer_phone, total_amount, currency, payment_status, payment_method, confirmed_by_phone, fulfillment_status, shipping_method, created_at, order_items(quantity)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * per, page * per - 1);

  if (view === 'to-fulfil') q = q.eq('status', 'confirmed').in('fulfillment_status', ['unfulfilled', 'processing']);
  if (view === 'cod-unconfirmed') q = q.eq('status', 'confirmed').eq('payment_method', 'cod').eq('confirmed_by_phone', false).in('fulfillment_status', ['unfulfilled', 'processing']);
  if (view === 'shipped') q = q.eq('fulfillment_status', 'shipped');
  if (view === 'delivered') q = q.eq('fulfillment_status', 'delivered');
  if (view === 'unpaid') q = q.neq('payment_method', 'cod').in('payment_status', ['unpaid', 'processing', 'failed']).eq('status', 'pending');
  if (view === 'closed') q = q.in('status', ['cancelled', 'refunded']);
  if (sp.q) {
    const term = sp.q.replace(/[%,()]/g, '').trim();
    const phoneDigits = term.replace(/\D/g, '').replace(/^0/, '');
    q = q.or(`order_number.ilike.%${term}%,customer_email.ilike.%${term}%,customer_last_name.ilike.%${term}%${phoneDigits.length >= 6 ? `,customer_phone.ilike.%${phoneDigits}%` : ''}`);
  }
  const { data: orders, count, error } = await q;
  const pages = Math.max(1, Math.ceil((count ?? 0) / per));
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const m = { view, q: sp.q, ...patch };
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, v);
    return `/admin/orders?${p}`;
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Paid orders appear under “To fulfil”. Pack them, then mark them shipped with the carrier tracking number (USPS, UPS, FedEx…)."
        actions={
          <a href={`/admin/orders-export?view=${view}`} className="btn-outline h-10 px-4">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />
      <PageBody>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1">
            {VIEWS.map((t) => (
              <Link key={t.v} href={link({ view: t.v, page: undefined })} className={cn('px-3 py-2 font-display text-[11px] uppercase tracking-[0.16em]', view === t.v ? 'bg-fg font-semibold text-bg' : 'text-muted hover:text-fg')}>
                {t.label}
              </Link>
            ))}
          </div>
          <form>
            <input type="hidden" name="view" value={view} />
            <input name="q" defaultValue={sp.q} placeholder="Order number, phone or surname" className="field h-10 w-72" />
          </form>
        </div>

        {error ? (
          <p className="mt-6 text-sm text-danger">{error.message}</p>
        ) : !orders?.length ? (
          <div className="mt-6"><Empty title="No orders here">{view === 'to-fulfil' ? 'You’re all caught up.' : null}</Empty></div>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto border border-line bg-surface">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr>
                    <th className={th}>Order</th><th className={th}>Date</th><th className={th}>Customer</th><th className={th}>Items</th>
                    <th className={th}>Payment</th><th className={th}>Fulfilment</th><th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-2">
                      <td className={td}>
                        <Link href={`/admin/orders/${o.id}`} className="font-display font-semibold hover:underline">{o.order_number}</Link>
                        {o.shipping_method === 'express' && <span className="ml-2 text-[10px] font-bold uppercase text-gold">Express</span>}
                      </td>
                      <td className={`${td} whitespace-nowrap text-muted`}>{new Date(o.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className={td}>{o.customer_first_name} {o.customer_last_name}<span className="block text-xs text-subtle">{formatPhone(o.customer_phone) || o.customer_email}</span></td>
                      <td className={td}>{(o.order_items ?? []).reduce((n: number, i: { quantity: number }) => n + i.quantity, 0)}</td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1">
                          {o.payment_method === 'cod' ? <Badge tone={o.payment_status === 'paid' ? 'green' : 'blue'}>{o.payment_status === 'paid' ? 'COD · collected' : 'COD'}</Badge> : <Badge tone={statusTone(o.payment_status)}>{o.payment_status}</Badge>}
                          {o.payment_method === 'cod' && !o.confirmed_by_phone && ['unfulfilled', 'processing'].includes(o.fulfillment_status) && <Badge tone="amber">Confirm</Badge>}
                        </div>
                      </td>
                      <td className={td}><Badge tone={statusTone(o.fulfillment_status)}>{o.fulfillment_status}</Badge></td>
                      <td className={`${td} text-right font-display`}>{formatCents(o.total_amount, o.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-muted">
                <span>Page {page} of {pages} · {count} orders</span>
                <div className="flex gap-2">
                  {page > 1 && <Link href={link({ page: String(page - 1) })} className="btn-outline h-9 px-4">Previous</Link>}
                  {page < pages && <Link href={link({ page: String(page + 1) })} className="btn-outline h-9 px-4">Next</Link>}
                </div>
              </div>
            )}
          </>
        )}
      </PageBody>
    </>
  );
}
