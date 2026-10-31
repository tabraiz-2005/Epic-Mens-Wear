import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  const view = request.nextUrl.searchParams.get('view') ?? 'all';
  let q = getSupabaseAdmin()
    .from('orders')
    .select('order_number, created_at, paid_at, payment_method, customer_first_name, customer_last_name, customer_email, customer_phone, shipping_address, shipping_method, subtotal_amount, discount_amount, shipping_amount, total_amount, promo_code, payment_status, fulfillment_status, tracking_number, order_items(title, color, size, sku, quantity)')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (view === 'to-fulfil') q = q.eq('status', 'confirmed').in('fulfillment_status', ['unfulfilled', 'processing']);
  if (view === 'shipped') q = q.eq('fulfillment_status', 'shipped');
  if (view === 'delivered') q = q.eq('fulfillment_status', 'delivered');
  if (view === 'unpaid') q = q.neq('payment_status', 'paid').eq('status', 'pending');
  if (view === 'closed') q = q.in('status', ['cancelled', 'refunded']);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ['Order', 'Created', 'Paid', 'Payment method', 'Name', 'Email', 'Phone', 'Address', 'City', 'Region', 'Postal code', 'Country', 'Shipping', 'Items', 'Subtotal', 'Discount', 'Shipping cost', 'Total', 'Code', 'Payment', 'Fulfilment', 'Tracking'];
  const lines = (data ?? []).map((o) => {
    const a = (o.shipping_address ?? {}) as Record<string, string>;
    const items = (o.order_items ?? []).map((i: { title: string; color: string; size: string; quantity: number }) => `${i.quantity}× ${i.title} (${i.color}/${i.size})`).join('; ');
    return [
      o.order_number, o.created_at, o.paid_at, o.payment_method, `${o.customer_first_name} ${o.customer_last_name}`, o.customer_email, o.customer_phone,
      [a.address, a.address2].filter(Boolean).join(', '), a.city, a.region, a.postalCode, a.country, o.shipping_method, items,
      (o.subtotal_amount / 100).toFixed(2), (o.discount_amount / 100).toFixed(2), (o.shipping_amount / 100).toFixed(2), (o.total_amount / 100).toFixed(2),
      o.promo_code, o.payment_status, o.fulfillment_status, o.tracking_number,
    ].map(esc).join(',');
  });
  return new NextResponse([header.join(','), ...lines].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="epic-orders-${view}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
