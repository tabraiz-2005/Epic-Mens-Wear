import { requireAdmin } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Sidebar } from '@/components/admin/Sidebar';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  let pending = 0;
  try {
    const { count } = await getSupabaseAdmin()
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .in('fulfillment_status', ['unfulfilled', 'processing']);
    pending = count ?? 0;
  } catch {
    /* shown on dashboard health panel */
  }
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar email={admin.email} role={admin.role} pendingOrders={pending} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
