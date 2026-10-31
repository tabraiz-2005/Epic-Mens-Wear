import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Empty, PageBody, PageHeader } from '@/components/admin/Page';
import { InventoryTable, type InvRow } from '@/components/admin/InventoryTable';
import { sortSizes } from '@/lib/commerce/catalog';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Inventory' };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const sp = await searchParams;
  const admin = getSupabaseAdmin();
  const [{ data, error }, { data: settings }] = await Promise.all([
    admin
      .from('product_variants')
      .select('id, sku, color, color_hex, size, inventory_quantity, is_active, product:products!inner ( id, title, status )')
      .neq('product.status', 'archived')
      .not('size', 'like', 'retired-%')
      .limit(5000),
    admin.from('store_settings').select('low_stock_threshold').eq('id', 1).maybeSingle(),
  ]);
  const threshold = settings?.low_stock_threshold ?? 5;

  let rows: InvRow[] = (data ?? []).map((v) => {
    const p = Array.isArray(v.product) ? v.product[0] : v.product;
    return {
      id: v.id,
      productId: p.id,
      title: p.title,
      status: p.status,
      color: v.color,
      colorHex: v.color_hex,
      size: v.size,
      sku: v.sku,
      stock: v.inventory_quantity,
      isActive: v.is_active,
    };
  });
  if (sp.filter === 'low') rows = rows.filter((r) => r.stock <= threshold);
  if (sp.filter === 'out') rows = rows.filter((r) => r.stock === 0);
  if (sp.q) {
    const q = sp.q.toLowerCase();
    rows = rows.filter((r) => `${r.title} ${r.sku} ${r.color}`.toLowerCase().includes(q));
  }
  const sizeOrder = sortSizes(Array.from(new Set(rows.map((r) => r.size))));
  rows.sort((a, b) => a.title.localeCompare(b.title) || a.color.localeCompare(b.color) || sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size));

  const tabs = [
    { v: undefined, label: 'All' },
    { v: 'low', label: `Low (≤ ${threshold})` },
    { v: 'out', label: 'Sold out' },
  ];

  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Inventory" description="Update stock for every colour and size in one place. Stock goes down automatically when an order is paid." />
      <PageBody>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <Link
                key={t.label}
                href={t.v ? `/admin/inventory?filter=${t.v}` : '/admin/inventory'}
                className={cn('px-3 py-2 font-display text-[11px] uppercase tracking-[0.16em]', sp.filter === t.v ? 'bg-fg font-semibold text-bg' : 'text-muted hover:text-fg')}
              >
                {t.label}
              </Link>
            ))}
          </div>
          <form>
            {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
            <input name="q" defaultValue={sp.q} placeholder="Search product, SKU, colour" className="field h-10 w-64" />
          </form>
        </div>
        {error ? <p className="text-sm text-danger">{error.message}</p> : rows.length === 0 ? <Empty title="Nothing to show" /> : <InventoryTable rows={rows} threshold={threshold} />}
      </PageBody>
    </>
  );
}
