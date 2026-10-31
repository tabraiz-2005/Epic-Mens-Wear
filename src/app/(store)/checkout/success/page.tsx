import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Clock } from 'lucide-react';
import { getStripe } from '@/lib/stripe/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { formatCents } from '@/lib/utils';
import { ClearCart } from './ClearCart';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-x py-20 lg:py-28">
      <div className="mx-auto max-w-2xl border border-line bg-surface p-8 text-center sm:p-14">{children}</div>
    </div>
  );
}

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId?.startsWith('cs_')) {
    return (
      <Shell>
        <h1 className="display text-4xl">Invalid confirmation link</h1>
        <Link href="/" className="btn-primary mt-10">Return to the store</Link>
      </Shell>
    );
  }

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch {
    return (
      <Shell>
        <h1 className="display text-4xl">Confirmation unavailable</h1>
        <p className="mt-4 text-sm text-muted">If you completed a payment, your order is safe — contact us and we’ll confirm it.</p>
      </Shell>
    );
  }

  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  const orderId = session.metadata?.order_id;
  const admin = getSupabaseAdmin();

  // Safety net: confirm the order here too, in case the Stripe webhook is not set up yet.
  // confirm_order_payment is idempotent, so running it twice is harmless.
  if (paid && orderId) {
    const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
    const cust = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
    const { error } = await admin.rpc('confirm_order_payment', {
      p_order_id: orderId,
      p_checkout_session_id: session.id,
      p_payment_intent_id: pi,
      p_stripe_customer_id: cust,
    });
    if (error) console.error('[success] confirm fallback failed:', error.message);
  }

  const { data: order } = orderId
    ? await admin
        .from('orders')
        .select('order_number, customer_email, customer_first_name, total_amount, currency')
        .eq('id', orderId)
        .eq('stripe_checkout_session_id', session.id)
        .maybeSingle()
    : { data: null };

  if (!paid) {
    return (
      <Shell>
        <Clock className="mx-auto h-10 w-10 text-gold" strokeWidth={1.4} />
        <h1 className="display mt-6 text-4xl">Payment processing</h1>
        <p className="mt-4 text-sm text-muted">Your payment hasn’t been confirmed yet. We’ll email you as soon as it is.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <ClearCart />
      <div className="mx-auto flex h-16 w-16 items-center justify-center border border-line-strong">
        <Check className="h-7 w-7" />
      </div>
      <p className="eyebrow mt-8">Payment confirmed{order?.order_number ? ` // ${order.order_number}` : ''}</p>
      <h1 className="display mt-4 text-5xl">Thank you{order?.customer_first_name ? `, ${order.customer_first_name}` : ''}</h1>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted">
        Your order has been received
        {order?.customer_email ? ` and a receipt is on its way to ${order.customer_email}.` : '.'} We’ll send tracking details
        once it ships.
      </p>
      {order && (
        <div className="mt-8 flex justify-between border-y border-line py-5 font-display text-sm uppercase tracking-label">
          <span className="text-muted">Order total</span>
          <span className="font-bold">{formatCents(order.total_amount, order.currency)}</span>
        </div>
      )}
      <Link href="/shop" className="btn-primary mt-10">Continue shopping</Link>
    </Shell>
  );
}
