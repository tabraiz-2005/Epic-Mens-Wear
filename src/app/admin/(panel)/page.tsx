import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { runHealthChecks } from '@/lib/admin/health';
import { Badge, Card, Empty, PageBody, PageHeader, statusTone, td, th } from '@/components/admin/Page';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { formatCents } from '@/lib/utils';

export const metadata = { title: 'Dashboard' };

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <div className="h-full border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      <p className="font-display text-[10px] uppercase tracking-label text-muted">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold tracking-[-0.02em]">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function Dashboard() {
  const checks = await runHealthChecks();
  const dbReady = checks.find((c) => c.label === 'Database tables')?.ok;

  if (!dbReady) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="Dashboard" />
        <PageBody>
          <SetupCard checks={checks} />
        </PageBody>
      </>
    );
  }

  const admin = getSupabaseAdmin();
  const now = new Date();
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 29 * 864e5);

  const [{ data: paid }, { data: recent }, { data: settings }, { data: variants }, { count: activeProducts }, { count: toFulfil }] =
    await Promise.all([
      admin.from('orders').select('total_amount, created_at').eq('status', 'confirmed').gte('created_at', since.toISOString()),
      admin
        .from('orders')
        .select('id, order_number, customer_first_name, customer_last_name, total_amount, payment_status, fulfillment_status, created_at')
        .order('created_at', { ascending: false })
        .limit(8),
      admin.from('store_settings').select('low_stock_threshold').eq('id', 1).maybeSingle(),
      admin
        .from('product_variants')
        .select('id, sku, color, size, inventory_quantity, product:products!inner ( id, title, status )')
        .eq('is_active', true)
        .eq('product.status', 'active')
        .order('inventory_quantity')
        .limit(400),
      admin.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').in('fulfillment_status', ['unfulfilled', 'processing']),
    ]);

  const threshold = settings?.low_stock_threshold ?? 5;
  const low = (variants ?? []).filter((v) => v.inventory_quantity <= threshold);
  const out = low.filter((v) => v.inventory_quantity === 0).length;

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since.getTime() + i * 864e5);
    return { date: d.toISOString().slice(0, 10), cents: 0, orders: 0 };
  });
  for (const o of paid ?? []) {
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    const day = days.find((d) => d.date === key);
    if (day) {
      day.cents += o.total_amount;
      day.orders += 1;
    }
  }
  const revenue = (paid ?? []).reduce((n, o) => n + o.total_amount, 0);
  const count = paid?.length ?? 0;
  const problems = checks.filter((c) => !c.ok);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        actions={
          <>
            <Link href="/admin/products/new" className="btn-primary h-10 px-5">Add product</Link>
            <Link href="/admin/orders?view=to-fulfil" className="btn-outline h-10 px-5">Orders to ship</Link>
          </>
        }
      />
      <PageBody className="space-y-6">
        {problems.length > 0 && <SetupCard checks={checks} compact />}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Sales · 30 days" value={formatCents(revenue)} sub={`${count} order${count === 1 ? '' : 's'} (excl. cancelled)`} />
          <Stat label="Average order" value={count ? formatCents(Math.round(revenue / count)) : '—'} sub="Last 30 days" />
          <Stat label="To fulfil" value={String(toFulfil ?? 0)} sub="Not yet shipped" href="/admin/orders?view=to-fulfil" />
          <Stat label="Live products" value={String(activeProducts ?? 0)} sub={`${low.length} low · ${out} sold out variants`} href="/admin/inventory?filter=low" />
        </div>

        <Card title="Sales · last 30 days">
          {revenue === 0 ? <p className="py-10 text-center text-sm text-muted">No orders in the last 30 days yet.</p> : <RevenueChart days={days} />}
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-xs text-muted underline underline-offset-4 hover:text-fg">All orders</Link>} bodyClass="p-0">
            {(recent ?? []).length === 0 ? (
              <div className="p-5"><Empty title="No orders yet">Orders appear here as soon as a customer checks out.</Empty></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Payment</th><th className={th}>Fulfilment</th><th className={`${th} text-right`}>Total</th></tr></thead>
                  <tbody>
                    {recent!.map((o) => (
                      <tr key={o.id} className="hover:bg-surface-2">
                        <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-display font-semibold hover:underline">{o.order_number}</Link><p className="text-xs text-subtle">{new Date(o.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p></td>
                        <td className={td}>{o.customer_first_name} {o.customer_last_name}</td>
                        <td className={td}><Badge tone={statusTone(o.payment_status)}>{o.payment_status}</Badge></td>
                        <td className={td}><Badge tone={statusTone(o.fulfillment_status)}>{o.fulfillment_status}</Badge></td>
                        <td className={`${td} text-right font-display`}>{formatCents(o.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title={`Low stock (≤ ${threshold})`} actions={<Link href="/admin/inventory?filter=low" className="text-xs text-muted underline underline-offset-4 hover:text-fg">Manage</Link>} bodyClass="p-0">
            {low.length === 0 ? (
              <p className="p-5 text-sm text-muted">Everything is well stocked.</p>
            ) : (
              <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
                {low.slice(0, 30).map((v) => {
                  const p = Array.isArray(v.product) ? v.product[0] : v.product;
                  return (
                    <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <Link href={`/admin/products/${p?.id}`} className="min-w-0 hover:underline">
                        <span className="block truncate">{p?.title}</span>
                        <span className="text-xs text-muted">{v.color} / {v.size}</span>
                      </Link>
                      <Badge tone={v.inventory_quantity === 0 ? 'red' : 'amber'}>{v.inventory_quantity === 0 ? 'Sold out' : `${v.inventory_quantity} left`}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </PageBody>
    </>
  );
}

function SetupCard({ checks, compact }: { checks: Awaited<ReturnType<typeof runHealthChecks>>; compact?: boolean }) {
  const list = compact ? checks.filter((c) => !c.ok) : checks;
  return (
    <Card title={compact ? 'Setup needs attention' : 'Finish setting up your store'}>
      <ul className="space-y-3">
        {list.map((c) => (
          <li key={c.label} className="flex items-start gap-3 text-sm">
            {c.label === 'Payments' ? (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            ) : c.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            )}
            <span>
              <span className="font-medium">{c.label}</span>
              {(!c.ok || c.label === 'Payments') && c.fix && <span className="block text-muted">{c.fix}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
