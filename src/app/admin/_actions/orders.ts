'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { assertAdmin, fail, type ActionResult } from '@/lib/admin/auth';

const FULFILMENT = ['unfulfilled', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'] as const;

function refresh(id: string) {
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin');
}

export async function updateOrder(
  id: string,
  patch: {
    fulfillmentStatus: (typeof FULFILMENT)[number];
    trackingNumber: string;
    trackingUrl: string;
    adminNotes: string;
    confirmedByPhone: boolean;
  }
): Promise<ActionResult> {
  try {
    await assertAdmin();
    if (!FULFILMENT.includes(patch.fulfillmentStatus)) return { ok: false, error: 'Unknown status.' };
    const admin = getSupabaseAdmin();
    const { data: order, error: getErr } = await admin
      .from('orders')
      .select('shipped_at, delivered_at, payment_status, payment_method, status')
      .eq('id', id)
      .single();
    if (getErr) throw getErr;
    if (order.status !== 'confirmed') return { ok: false, error: `This order is ${order.status}.` };
    const isCod = order.payment_method === 'cod';
    if (!isCod && order.payment_status !== 'paid' && ['shipped', 'delivered'].includes(patch.fulfillmentStatus))
      return { ok: false, error: 'This order hasn’t been paid — don’t ship it.' };

    const url = patch.trackingUrl.trim();
    const row: Record<string, unknown> = {
      fulfillment_status: patch.fulfillmentStatus,
      tracking_number: patch.trackingNumber.trim() || null,
      tracking_url: url ? (/^https?:\/\//.test(url) ? url : `https://${url}`) : null,
      admin_notes: patch.adminNotes.trim() || null,
      confirmed_by_phone: Boolean(patch.confirmedByPhone),
    };
    const now = new Date().toISOString();
    if (patch.fulfillmentStatus === 'shipped' && !order.shipped_at) row.shipped_at = now;
    if (patch.fulfillmentStatus === 'delivered') {
      if (!order.delivered_at) row.delivered_at = now;
      if (!order.shipped_at) row.shipped_at = now;
      // Courier collected the cash on delivery.
      if (isCod && order.payment_status !== 'paid') {
        row.payment_status = 'paid';
        row.paid_at = now;
      }
    }
    const { error } = await admin.from('orders').update(row).eq('id', id);
    if (error) throw error;
    refresh(id);
    return {
      ok: true,
      message: patch.fulfillmentStatus === 'delivered' && isCod ? 'Marked delivered — cash recorded as received.' : 'Order updated.',
    };
  } catch (e) {
    return fail(e);
  }
}

/** Cancel an order that hasn't been paid, and put its stock back. */
export async function cancelOrder(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const admin = getSupabaseAdmin();
    const { data: order, error } = await admin.from('orders').select('payment_status, payment_method').eq('id', id).single();
    if (error) throw error;
    if (order.payment_status === 'paid') return { ok: false, error: 'This order is already paid. Mark it “returned” instead.' };
    const fn = order.payment_method === 'cod' ? 'cancel_cod_order' : 'release_order_inventory';
    const { error: rErr } = await admin.rpc(fn, { p_order_id: id });
    if (rErr) throw rErr;
    refresh(id);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Order cancelled and stock returned.' };
  } catch (e) {
    return fail(e);
  }
}

/** Put a returned order's items back into stock (once). */
export async function restockOrder(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    const admin = getSupabaseAdmin();
    const { data: order, error } = await admin.from('orders').select('admin_notes, order_items(variant_id, quantity)').eq('id', id).single();
    if (error) throw error;
    if ((order.admin_notes ?? '').includes('[restocked]')) return { ok: false, error: 'This order has already been restocked.' };
    for (const item of order.order_items ?? []) {
      if (!item.variant_id) continue;
      const { data: v } = await admin.from('product_variants').select('inventory_quantity').eq('id', item.variant_id).maybeSingle();
      if (v) await admin.from('product_variants').update({ inventory_quantity: v.inventory_quantity + item.quantity }).eq('id', item.variant_id);
    }
    await admin
      .from('orders')
      .update({ fulfillment_status: 'returned', admin_notes: `${order.admin_notes ? order.admin_notes + '\n' : ''}[restocked]` })
      .eq('id', id);
    refresh(id);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Items returned to stock.' };
  } catch (e) {
    return fail(e);
  }
}
