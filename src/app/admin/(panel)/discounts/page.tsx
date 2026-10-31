import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PageBody, PageHeader } from '@/components/admin/Page';
import { DiscountManager } from '@/components/admin/DiscountManager';

export const metadata = { title: 'Discounts' };

export default async function DiscountsPage() {
  const { data, error } = await getSupabaseAdmin().from('discount_codes').select('*').order('created_at', { ascending: false });
  return (
    <>
      <PageHeader eyebrow="Marketing" title="Discounts" description="Codes customers enter at checkout. Usage is counted when an order is paid." />
      <PageBody>{error ? <p className="text-sm text-danger">{error.message}</p> : <DiscountManager rows={data ?? []} />}</PageBody>
    </>
  );
}
