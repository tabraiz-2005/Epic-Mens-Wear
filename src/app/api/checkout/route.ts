import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getSettings } from '@/lib/commerce/catalog';
import { evaluateDiscount, shippingCost, type ShippingMethod } from '@/lib/commerce/pricing';
import { ConfigError } from '@/lib/env';
import { normalisePhone } from '@/lib/phone';
import { STORE_CURRENCY } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Starts a card payment with Stripe Checkout.
 * 1. Re-checks prices, stock and discounts on the server (never trusted from the browser).
 * 2. Creates a pending order and reserves the stock for 40 minutes.
 * 3. Returns the Stripe payment page URL. The order is confirmed by the Stripe webhook
 *    (and, as a safety net, on /checkout/success). Abandoned payments release the stock.
 */
interface CheckoutRequest {
  items: Array<{ variantId: string; quantity: number }>;
  customer: { email: string; firstName: string; lastName: string; phone: string };
  shippingAddress: { address: string; address2?: string; city: string; region: string; postalCode: string };
  shippingMethod: ShippingMethod;
  paymentMethod: 'card';
  promoCode?: string;
  notes?: string;
  website?: string; // honeypot — real customers never fill this
}

const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD',
  'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  let orderId: string | undefined;
  let sessionId: string | undefined;
  let reserved = false;

  let admin;
  let stripe;
  try {
    admin = getSupabaseAdmin();
    stripe = getStripe();
  } catch (e) {
    console.error('[checkout] configuration error:', e);
    return bad(e instanceof ConfigError ? 'Checkout is not configured yet. Please try again later.' : 'Checkout unavailable.', 503);
  }

  try {
    const body = (await request.json()) as CheckoutRequest;
    if (body.website) return bad('Could not start checkout.');
    if (!Array.isArray(body.items) || body.items.length === 0) return bad('Your bag is empty.');
    if (body.items.length > 30) return bad('Too many items in this order.');

    const firstName = str(body.customer?.firstName, 80);
    const lastName = str(body.customer?.lastName, 80);
    const email = str(body.customer?.email, 254).toLowerCase();
    const phone = normalisePhone(str(body.customer?.phone, 30));
    const addr = {
      address: str(body.shippingAddress?.address),
      address2: str(body.shippingAddress?.address2),
      city: str(body.shippingAddress?.city, 80),
      region: str(body.shippingAddress?.region, 2).toUpperCase(),
      postalCode: str(body.shippingAddress?.postalCode, 10),
      country: 'US',
    };
    if (!firstName || !lastName) return bad('Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Please enter a valid email address for your receipt.');
    if (!phone) return bad('Please enter a valid US phone number, e.g. (408) 555-0123.');
    if (addr.address.length < 5 || !addr.city) return bad('Please enter your full street address and city.');
    if (!US_STATES.has(addr.region)) return bad('Please choose your state.');
    if (!/^\d{5}(-\d{4})?$/.test(addr.postalCode)) return bad('Please enter a valid 5-digit ZIP code.');

    const method: ShippingMethod = body.shippingMethod === 'express' ? 'express' : 'standard';

    const requested = new Map<string, number>();
    for (const item of body.items) {
      if (!uuid.test(item?.variantId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10)
        return bad('Your bag contains an invalid item. Please remove it and try again.');
      requested.set(item.variantId, (requested.get(item.variantId) ?? 0) + item.quantity);
    }
    const variantIds = Array.from(requested.keys());

    const { data: variants, error: vErr } = await admin
      .from('product_variants')
      .select('id, product_id, sku, color, size, price, inventory_quantity, is_active, image_url')
      .in('id', variantIds);
    if (vErr) throw vErr;
    if (!variants || variants.length !== variantIds.length)
      return bad('One or more items are no longer available. Please refresh your bag.', 409);

    const { data: products, error: pErr } = await admin
      .from('products')
      .select('id, slug, title, currency, status, product_images ( url, is_primary, position )')
      .in('id', Array.from(new Set(variants.map((v) => v.product_id))));
    if (pErr) throw pErr;
    const productMap = new Map((products ?? []).map((p) => [p.id, p]));

    const lines = variants.map((variant) => {
      const product = productMap.get(variant.product_id);
      const quantity = requested.get(variant.id) ?? 0;
      if (!variant.is_active || !product || product.status !== 'active' || variant.inventory_quantity < quantity) {
        throw new Error('Insufficient inventory');
      }
      const unitAmount = Math.round(Number(variant.price) * 100); // cents
      if (!Number.isSafeInteger(unitAmount) || unitAmount < 0) throw new Error('Invalid price');
      const imgs = [...((product.product_images as { url: string; is_primary: boolean; position: number }[]) ?? [])].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position
      );
      return { variant, product, quantity, unitAmount, image: variant.image_url || imgs[0]?.url || null };
    });

    const currency = STORE_CURRENCY;
    if (lines.some((l) => l.product.currency !== currency)) return bad('Some items are not priced in US dollars yet. Please contact us.');

    const settings = await getSettings();
    const subtotal = lines.reduce((n, l) => n + l.unitAmount * l.quantity, 0);

    let discount = 0;
    let promo: string | null = null;
    if (body.promoCode?.trim()) {
      const result = await evaluateDiscount(admin, body.promoCode, subtotal);
      if ('error' in result) return bad(result.error);
      discount = result.amount;
      promo = result.code;
    }
    const shipping = shippingCost(settings, method, subtotal - discount);
    const total = Math.max(0, subtotal - discount + shipping);
    if (total > 0 && total < 50) return bad('The order total is below the minimum card payment.');

    // Stripe requires expires_at to be at least 30 minutes away; leave headroom.
    const expiresAt = new Date(Date.now() + 40 * 60 * 1000);

    const { data: order, error: oErr } = await admin
      .from('orders')
      .insert({
        customer_email: email,
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_phone: phone,
        shipping_address: addr,
        shipping_method: method,
        payment_method: 'card',
        currency,
        subtotal_amount: subtotal,
        discount_amount: discount,
        shipping_amount: shipping,
        tax_amount: 0,
        total_amount: total,
        promo_code: promo,
        gift_message: str(body.notes, 500) || null,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, order_number')
      .single();
    if (oErr || !order) throw oErr ?? new Error('Unable to create order');
    orderId = order.id;

    const { error: iErr } = await admin.from('order_items').insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.product.id,
        variant_id: l.variant.id,
        sku: l.variant.sku,
        product_slug: l.product.slug,
        title: l.product.title,
        color: l.variant.color,
        size: l.variant.size,
        image_url: l.image,
        unit_amount: l.unitAmount,
        quantity: l.quantity,
      }))
    );
    if (iErr) throw iErr;

    // Hold the stock while the customer pays.
    const { error: rErr } = await admin.rpc('reserve_order_inventory', { p_order_id: order.id });
    if (rErr) throw rErr;
    reserved = true;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: l.unitAmount,
        product_data: {
          name: `${l.product.title} — ${l.variant.color} / ${l.variant.size}`,
          metadata: { product_id: l.product.id, variant_id: l.variant.id, sku: l.variant.sku },
          ...(l.image?.startsWith('https://') ? { images: [l.image] } : {}),
        },
      },
    }));

    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (discount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: discount,
        currency: currency.toLowerCase(),
        duration: 'once',
        max_redemptions: 1,
        name: promo ?? 'Discount',
        metadata: { order_id: order.id },
      });
      discounts = [{ coupon: coupon.id }];
    }

    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      client_reference_id: order.id,
      line_items: lineItems,
      discounts,
      billing_address_collection: 'auto',
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: shipping, currency: currency.toLowerCase() },
            display_name: method === 'express' ? 'Express shipping' : shipping === 0 ? 'Free shipping' : 'Standard shipping',
          },
        },
      ],
      // Sales tax: turn on Stripe Tax in your Stripe dashboard, then uncomment the next line.
      // automatic_tax: { enabled: true },
      metadata: { order_id: order.id, order_number: order.order_number },
      payment_intent_data: {
        metadata: { order_id: order.id, order_number: order.order_number },
        shipping: {
          name: `${firstName} ${lastName}`,
          phone,
          address: {
            line1: addr.address,
            line2: addr.address2 || undefined,
            city: addr.city,
            state: addr.region,
            postal_code: addr.postalCode,
            country: 'US',
          },
        },
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=1`,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });
    sessionId = session.id;
    if (!session.url) throw new Error('Stripe did not return a checkout URL');

    const { error: uErr } = await admin.from('orders').update({ stripe_checkout_session_id: session.id }).eq('id', order.id);
    if (uErr) throw uErr;

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    if (sessionId) {
      try {
        await stripe.checkout.sessions.expire(sessionId);
      } catch {
        /* continue cleanup */
      }
    }
    if (orderId) {
      if (reserved) await admin.rpc('release_order_inventory', { p_order_id: orderId });
      else await admin.from('orders').delete().eq('id', orderId);
    }
    const inventory = error instanceof Error && error.message.toLowerCase().includes('inventory');
    console.error('[checkout] failed:', error);
    return bad(
      inventory ? 'One or more items are no longer available in the quantity requested.' : 'We could not start checkout. Please try again.',
      inventory ? 409 : 500
    );
  }
}
