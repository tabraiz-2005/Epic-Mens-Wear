import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PageBody, PageHeader } from '@/components/admin/Page';
import { TaxonomyManager, type TaxonomyRow } from '@/components/admin/TaxonomyManager';

export const metadata = { title: 'Categories' };

export default async function Page() {
  const admin = getSupabaseAdmin();
  const [{ data, error }, { data: products }] = await Promise.all([
    admin.from('categories').select('id, name, slug, description, hero_image_url, sort_order, is_active, gender').order('sort_order'),
    admin.from('products').select('category_id').neq('status', 'archived'),
  ]);
  const rows: TaxonomyRow[] = (data ?? []).map((r) => ({
    ...r,
    productCount: (products ?? []).filter((p) => p.category_id === r.id).length,
  }));
  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Categories" description="Garment types shown as filters and in the main menu (e.g. Formal Suits, Formal Shirts, Casual Shoes)." />
      <PageBody>{error ? <p className="text-sm text-danger">{error.message}</p> : <TaxonomyManager kind="categories" rows={rows} />}</PageBody>
    </>
  );
}
