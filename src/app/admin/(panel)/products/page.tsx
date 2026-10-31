import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Badge, Empty, PageBody, PageHeader, statusTone, td, th } from '@/components/admin/Page';
import { GarmentArt } from '@/components/store/GarmentArt';
import { Img } from '@/components/ui/Img';
import { cn, formatPrice } from '@/lib/utils';

export const metadata = { title: 'Products' };

type SP = { q?: string; status?: string; category?: string; gender?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const admin = getSupabaseAdmin();
  let query = admin
    .from('products')
    .select('id, title, sku, slug, status, gender, price, updated_at, is_featured, is_new_arrival, category:categories(name, slug), product_images(url, is_primary, position), product_variants(inventory_quantity, is_active, color_hex)')
    .order('updated_at', { ascending: false });
  if (sp.status && sp.status !== 'all') query = query.eq('status', sp.status);
  else query = query.neq('status', 'archived');
  if (sp.gender) query = query.eq('gender', sp.gender);
  if (sp.q) query = query.or(`title.ilike.%${sp.q.replace(/[%,()]/g, '')}%,sku.ilike.%${sp.q.replace(/[%,()]/g, '')}%`);

  const [{ data: products, error }, { data: categories }] = await Promise.all([
    query,
    admin.from('categories').select('id, name, slug').order('sort_order'),
  ]);
  const rows = (products ?? []).filter((p) => {
    if (!sp.category) return true;
    const c = Array.isArray(p.category) ? p.category[0] : p.category;
    return c?.slug === sp.category;
  });

  const tabs = [
    { v: undefined, label: 'Current' },
    { v: 'active', label: 'Live' },
    { v: 'draft', label: 'Drafts' },
    { v: 'archived', label: 'Archived' },
    { v: 'all', label: 'All' },
  ];
  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : '';
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Everything on the store. Drafts are hidden from customers until you set them live."
        actions={
          <Link href="/admin/products/new" className="btn-primary h-10 px-5">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        }
      />
      <PageBody>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1">
            {tabs.map((t) => (
              <Link
                key={t.label}
                href={`/admin/products${qs({ status: t.v })}`}
                className={cn('px-3 py-2 font-display text-[11px] uppercase tracking-[0.16em]', sp.status === t.v ? 'bg-fg font-semibold text-bg' : 'text-muted hover:text-fg')}
              >
                {t.label}
              </Link>
            ))}
          </div>
          <form className="flex flex-wrap gap-2">
            {sp.status && <input type="hidden" name="status" value={sp.status} />}
            <input name="q" defaultValue={sp.q} placeholder="Search name or SKU" className="field h-10 w-56" />
            <select name="category" defaultValue={sp.category ?? ''} className="field h-10 w-40">
              <option value="">All categories</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <select name="gender" defaultValue={sp.gender ?? ''} className="field h-10 w-32">
              <option value="">All departments</option>
              <option value="men">Men</option>
              <option value="unisex">Unisex</option>
            </select>
            <button className="btn-outline h-10 px-4">Filter</button>
          </form>
        </div>

        {error ? (
          <p className="mt-6 text-sm text-danger">{error.message}</p>
        ) : rows.length === 0 ? (
          <div className="mt-6">
            <Empty title="No products here">
              <Link href="/admin/products/new" className="underline underline-offset-4">Add your first product</Link>
            </Empty>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto border border-line bg-surface">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Status</th>
                  <th className={th}>Category</th>
                  <th className={th}>For</th>
                  <th className={`${th} text-right`}>Price</th>
                  <th className={`${th} text-right`}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const imgs = [...(p.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position);
                  const cat = Array.isArray(p.category) ? p.category[0] : p.category;
                  const vars = (p.product_variants ?? []).filter((v) => v.is_active);
                  const stock = vars.reduce((n, v) => n + v.inventory_quantity, 0);
                  return (
                    <tr key={p.id} className="hover:bg-surface-2">
                      <td className={td}>
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                          <span className="relative h-14 w-11 shrink-0 overflow-hidden border border-line">
                            {imgs[0] ? <Img src={imgs[0].url} alt="" sizes="44px" /> : <GarmentArt category={cat?.slug} title={p.title} color={vars[0]?.color_hex} />}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-medium hover:underline">{p.title}</span>
                            <span className="text-xs text-subtle">{p.sku}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1">
                          <Badge tone={statusTone(p.status)}>{p.status === 'active' ? 'Live' : p.status}</Badge>
                          {p.is_featured && <Badge>Featured</Badge>}
                          {p.is_new_arrival && <Badge>New</Badge>}
                        </div>
                      </td>
                      <td className={td}>{cat?.name ?? <span className="text-subtle">—</span>}</td>
                      <td className={`${td} capitalize`}>{p.gender}</td>
                      <td className={`${td} text-right font-display`}>{formatPrice(Number(p.price))}</td>
                      <td className={`${td} text-right`}>
                        <span className={cn('font-display', stock === 0 && 'text-danger')}>{stock}</span>
                        <span className="block text-xs text-subtle">{vars.length} variants</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </>
  );
}
