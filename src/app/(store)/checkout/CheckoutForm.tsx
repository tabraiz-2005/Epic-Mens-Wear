'use client';

import Link from 'next/link';
import { AlertCircle, CreditCard, Loader2, Lock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { cn, formatCents, formatPrice } from '@/lib/utils';
import { Img } from '@/components/ui/Img';
import { GarmentArt } from '@/components/store/GarmentArt';

type Method = 'standard' | 'express';
const SAVED = 'epic_checkout_contact_v1';

const STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'],
  ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

export function CheckoutForm({ shipping }: { shipping: { standard: number; express: number; freeThreshold: number | null } }) {
  const { items, subtotal, hydrated } = useCart();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    address2: '',
    city: '',
    region: 'CA',
    postalCode: '',
    notes: '',
    website: '',
  });
  const [method, setMethod] = useState<Method>('standard');
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<{ code: string; amount: number; label: string } | null>(null);
  const [codeError, setCodeError] = useState('');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const s = localStorage.getItem(SAVED);
      if (s) setForm((f) => ({ ...f, ...JSON.parse(s) }));
    } catch {
      /* ignore */
    }
    // Back from Stripe without paying.
    if (new URLSearchParams(window.location.search).get('cancelled')) {
      setError('Payment was cancelled. Your bag is saved, so you can try again whenever you’re ready.');
    }
  }, []);

  const subtotalCents = Math.round(subtotal * 100);
  const discount = applied ? Math.min(applied.amount, subtotalCents) : 0;
  const standardCost =
    shipping.freeThreshold !== null && subtotalCents - discount >= shipping.freeThreshold ? 0 : shipping.standard;
  const shippingCents = method === 'express' ? shipping.express : standardCost;
  const total = Math.max(0, subtotalCents - discount + shippingCents);

  useEffect(() => {
    if (applied) setApplied(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotalCents]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyCode = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setCodeError('');
    try {
      const res = await fetch('/api/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalCents }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setApplied(null);
        setCodeError(json.error ?? 'This code is not valid.');
      } else setApplied(json);
    } catch {
      setCodeError('Could not check this code right now.');
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { firstName, lastName, phone, email, address, address2, city, region, postalCode } = form;
      localStorage.setItem(SAVED, JSON.stringify({ firstName, lastName, phone, email, address, address2, city, region, postalCode }));
    } catch {
      /* ignore */
    }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          customer: { firstName: form.firstName, lastName: form.lastName, phone: form.phone, email: form.email },
          shippingAddress: {
            address: form.address,
            address2: form.address2,
            city: form.city,
            region: form.region,
            postalCode: form.postalCode,
          },
          shippingMethod: method,
          paymentMethod: 'card',
          promoCode: applied?.code,
          notes: form.notes,
          website: form.website,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.checkoutUrl) throw new Error(json.error ?? 'We could not start checkout.');
      // The bag is cleared on the success page, after payment.
      window.location.href = json.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not start checkout.');
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const rows = useMemo(
    () => [
      { label: 'Subtotal', value: formatPrice(subtotal) },
      ...(discount ? [{ label: `Discount (${applied?.code})`, value: `−${formatCents(discount)}` }] : []),
      { label: 'Shipping', value: shippingCents === 0 ? 'Free' : formatCents(shippingCents) },
    ],
    [subtotal, discount, applied, shippingCents]
  );

  if (hydrated && items.length === 0 && !submitting) {
    return (
      <div className="site-x flex flex-col items-center gap-6 py-32 text-center">
        <p className="eyebrow">Checkout</p>
        <h1 className="serif-title text-5xl">Your bag is empty</h1>
        <Link href="/shop" className="btn-primary">
          Browse the catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="site-x pb-10 pt-10 lg:pt-14">
      <p className="eyebrow">Secure checkout · Card payment by Stripe</p>
      <h1 className="serif-title mt-4 text-[44px] lg:text-[64px]">Checkout</h1>

      {error && (
        <div className="mt-8 flex items-start gap-3 border border-danger/50 bg-danger/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" /> {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-10 grid gap-12 border-t border-line pt-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <div className="space-y-12">
          <fieldset>
            <legend className="label mb-6">01 — Your details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="fn">First name</label>
                <input id="fn" required autoComplete="given-name" className="field" value={form.firstName} onChange={set('firstName')} />
              </div>
              <div>
                <label className="field-label" htmlFor="ln">Last name</label>
                <input id="ln" required autoComplete="family-name" className="field" value={form.lastName} onChange={set('lastName')} />
              </div>
              <div>
                <label className="field-label" htmlFor="phone">Phone (for delivery updates)</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(408) 555-0123"
                  className="field"
                  value={form.phone}
                  onChange={set('phone')}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="email">Email (for your receipt)</label>
                <input id="email" type="email" required autoComplete="email" className="field" value={form.email} onChange={set('email')} />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="label mb-6">02 — Shipping address</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="a1">Street address</label>
                <input
                  id="a1"
                  required
                  minLength={5}
                  autoComplete="address-line1"
                  placeholder="123 Main St"
                  className="field"
                  value={form.address}
                  onChange={set('address')}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="a2">Apartment, suite, etc. (optional)</label>
                <input id="a2" autoComplete="address-line2" className="field" value={form.address2} onChange={set('address2')} />
              </div>
              <div>
                <label className="field-label" htmlFor="city">City</label>
                <input id="city" required autoComplete="address-level2" className="field" value={form.city} onChange={set('city')} />
              </div>
              <div>
                <label className="field-label" htmlFor="region">State</label>
                <select id="region" required className="field" value={form.region} onChange={set('region')} autoComplete="address-level1">
                  {STATES.map(([abbr, name]) => (
                    <option key={abbr} value={abbr} className="bg-bg">
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="zip">ZIP code</label>
                <input
                  id="zip"
                  required
                  inputMode="numeric"
                  pattern="\d{5}(-\d{4})?"
                  title="5-digit ZIP code"
                  autoComplete="postal-code"
                  placeholder="95122"
                  className="field"
                  value={form.postalCode}
                  onChange={set('postalCode')}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="notes">Order notes (optional)</label>
                <textarea id="notes" rows={2} className="field h-auto py-3" value={form.notes} onChange={set('notes')} placeholder="e.g. event date, delivery instructions" />
              </div>
              {/* Honeypot: hidden from people, bots fill it in */}
              <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={set('website')} name="website" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="label mb-6">03 — Shipping method</legend>
            <div className="grid gap-3">
              {(
                [
                  { id: 'standard', title: 'Standard', eta: '3–7 business days, anywhere in the US', cost: standardCost },
                  { id: 'express', title: 'Express', eta: '1–3 business days', cost: shipping.express },
                ] as const
              ).map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between border p-5 transition-colors',
                    method === m.id ? 'border-fg bg-surface' : 'border-line hover:border-line-strong'
                  )}
                >
                  <span className="flex items-center gap-4">
                    <input type="radio" name="ship" className="accent-current" checked={method === m.id} onChange={() => setMethod(m.id)} />
                    <span>
                      <span className="block font-display text-sm font-semibold uppercase tracking-[0.14em]">{m.title}</span>
                      <span className="mt-1 block text-xs text-muted">{m.eta}</span>
                    </span>
                  </span>
                  <span className="font-display text-sm font-semibold">{m.cost === 0 ? 'Free' : formatCents(m.cost)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label mb-6">04 — Payment</legend>
            <div className="flex items-center justify-between border border-fg bg-surface p-5">
              <span className="flex items-center gap-4">
                <input type="radio" name="pay" checked readOnly className="accent-current" />
                <span>
                  <span className="block font-display text-sm font-semibold uppercase tracking-[0.14em]">Credit / debit card</span>
                  <span className="mt-1 block text-xs text-muted">
                    You’ll enter your card on Stripe’s secure payment page. Apple Pay and Google Pay are offered there when available.
                  </span>
                </span>
              </span>
              <CreditCard className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            </div>
          </fieldset>
        </div>

        <aside className="h-fit border border-line bg-surface p-6 lg:sticky lg:top-[136px] lg:p-8">
          <h2 className="label">Order summary</h2>
          <div className="mt-4 max-h-[340px] divide-y divide-line overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden border border-line">
                  {i.image ? <Img src={i.image} alt={i.title} sizes="64px" /> : <GarmentArt category={i.category} title={i.title} color={i.color} />}
                  <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center bg-fg px-1 font-display text-[10px] font-bold text-bg">
                    {i.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xs font-semibold uppercase tracking-[0.12em]">{i.title}</p>
                  <p className="mt-1 font-display text-[11px] uppercase tracking-label text-muted">
                    {i.color} / {i.size}
                  </p>
                </div>
                <p className="font-display text-sm">{formatPrice(i.price * i.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-line pt-5">
            <label className="field-label" htmlFor="promo">Discount code</label>
            <div className="flex gap-2">
              <input
                id="promo"
                className="field uppercase"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyCode();
                  }
                }}
              />
              <button type="button" onClick={applyCode} disabled={checking || !code.trim()} className="btn-outline h-12 px-5">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
            {codeError && <p className="mt-2 text-xs text-danger">{codeError}</p>}
            {applied && (
              <p className="mt-2 text-xs text-success">
                {applied.code} applied — {applied.label}.{' '}
                <button type="button" className="underline" onClick={() => setApplied(null)}>
                  Remove
                </button>
              </p>
            )}
          </div>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between">
                <dt className="text-muted">{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-4 font-display text-base font-bold uppercase tracking-[0.12em]">
              <dt>Total</dt>
              <dd>{formatCents(total)}</dd>
            </div>
          </dl>

          <button type="submit" disabled={submitting || !hydrated || items.length === 0} className="btn-primary mt-6 h-16 w-full">
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting ? 'Opening secure payment…' : `Continue to payment — ${formatCents(total)}`}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted">
            <Lock className="h-3.5 w-3.5" /> Payments are processed securely by Stripe.
          </p>
        </aside>
      </form>
    </div>
  );
}
