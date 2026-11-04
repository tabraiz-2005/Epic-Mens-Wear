'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { saveSettings } from '@/app/admin/_actions/store';
import type { StoreSettings } from '@/lib/commerce/types';
import { Field, Notice } from './FormBits';
import { SingleImage } from './ImageManager';
import { focusPct } from '@/lib/commerce/focus';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-line py-8 lg:grid-cols-[280px_1fr] lg:gap-10">
      <div>
        <h2 className="font-display text-[12px] font-semibold uppercase tracking-label">{title}</h2>
        {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const dollars = (c: number | null) => (c === null ? '' : String(c / 100));
const cents = (v: string) => Math.round(Number(v || 0) * 100);

export function SettingsForm({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [ship, setShip] = useState({
    standard: dollars(initial.standard_shipping_amount),
    express: dollars(initial.express_shipping_amount),
    free: dollars(initial.free_shipping_threshold),
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const t = (k: keyof StoreSettings) => ({
    value: (s[k] as string | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never),
  });

  const save = () =>
    start(async () => {
      const res = await saveSettings({
        ...s,
        standard_shipping_amount: cents(ship.standard),
        express_shipping_amount: cents(ship.express),
        free_shipping_threshold: ship.free.trim() === '' ? null : cents(ship.free),
      });
      setMsg(res.ok ? { ok: true, text: res.message ?? 'Saved.' } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {msg && <Notice kind={msg.ok ? 'success' : 'error'} className="mb-2">{msg.text}</Notice>}

      <Section title="Brand" hint="The name appears in the header, footer and browser tab.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name"><input {...t('store_name')} className="field" /></Field>
          <Field label="Tagline"><input {...t('tagline')} className="field" /></Field>
        </div>
      </Section>

      <Section title="Announcement bar" hint="The thin bar above the header on every page.">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={s.announcement_enabled} onChange={(e) => set('announcement_enabled', e.target.checked)} className="h-4 w-4 accent-current" />
          Show announcement
        </label>
        <Field label="Text"><input {...t('announcement_text')} className="field" /></Field>
      </Section>

      <Section title="Homepage hero" hint="The full-screen photo at the top of the homepage. Use a wide (landscape) photo for computers; most visitors are on phones, so also choose what phones should show.">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Field label="Small label"><input {...t('hero_eyebrow')} className="field" /></Field>
            <Field label="Headline"><input {...t('hero_title')} className="field" /></Field>
            <Field label="Sub-headline"><textarea rows={2} {...t('hero_subtitle')} className="field h-auto py-3" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button text"><input {...t('hero_cta_label')} className="field" /></Field>
              <Field label="Button link" hint="e.g. /men, /shop, /sale, /collections/wedding-season"><input {...t('hero_cta_href')} className="field" /></Field>
            </div>
          </div>
          <div className="space-y-4">
            <Field label="Hero photo (wide, for computers)">
              <SingleImage value={s.hero_image_url} onChange={(u) => set('hero_image_url', u)} folder="site" aspect="aspect-[16/10]" />
            </Field>
            <Field label="Phone photo (optional, tall)" hint="A portrait photo just for phones. If empty, phones use the wide photo.">
              <SingleImage value={s.hero_image_mobile_url ?? null} onChange={(u) => set('hero_image_mobile_url', u)} folder="site" aspect="aspect-[9/16]" />
            </Field>
            <Field label="On phones, keep this part of the wide photo" hint="Drag until the person sits in the middle of the phone frame.">
              <div className="flex items-center gap-4">
                {s.hero_image_url && !s.hero_image_mobile_url && (
                  <div className="relative aspect-[9/17] w-[84px] shrink-0 overflow-hidden rounded-[12px] border-[3px] border-fg/80 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${focusPct(s.hero_focus)}% 50%` }} />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={focusPct(s.hero_focus)}
                    onChange={(e) => set('hero_focus', e.target.value)}
                    className="w-full accent-[rgb(var(--fg))]"
                    aria-label="Phone crop position"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-muted">
                    <span>Left</span>
                    <span>{focusPct(s.hero_focus)}%</span>
                    <span>Right</span>
                  </div>
                </div>
              </div>
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Shipping" hint="Charged at checkout, in US dollars.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Standard ($)"><input inputMode="decimal" value={ship.standard} onChange={(e) => setShip({ ...ship, standard: e.target.value })} className="field" /></Field>
          <Field label="Express ($)"><input inputMode="decimal" value={ship.express} onChange={(e) => setShip({ ...ship, express: e.target.value })} className="field" /></Field>
          <Field label="Free standard over ($)" hint="Empty = never free"><input inputMode="decimal" value={ship.free} onChange={(e) => setShip({ ...ship, free: e.target.value })} className="field" /></Field>
        </div>
      </Section>

      <Section title="Stock alerts" hint="Variants at or below this number are flagged as low stock, and the product page shows “Low stock — N remaining”.">
        <Field label="Low-stock threshold" className="max-w-[200px]">
          <input type="number" min={0} value={s.low_stock_threshold} onChange={(e) => set('low_stock_threshold', Number(e.target.value))} className="field" />
        </Field>
      </Section>

      <Section title="Contact & social">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer email"><input type="email" {...t('contact_email')} className="field" /></Field>
          <Field label="Store phone" hint="Shown in the footer and contact page. If it takes WhatsApp, a chat button appears on the store"><input {...t('contact_phone')} className="field" placeholder="(408) 555-0123" /></Field>
          <Field label="Second phone (optional)"><input {...t('contact_phone_2')} className="field" placeholder="(408) 555-0124" /></Field>
          <Field label="Shop address" className="sm:col-span-2"><input {...t('address')} className="field" placeholder="2200 Eastridge Loop Ste 2066, San Jose, CA 95122, United States" /></Field>
          <Field label="Opening hours" hint="Shown in the footer and contact page, e.g. Mon–Sat 11am–10pm · Sun closed"><input {...t('opening_hours')} className="field" placeholder="Mon–Sat 11am–10pm · Sun closed" /></Field>
          <Field label="Google Maps link" hint="Google Maps → your shop → Share → Copy link"><input {...t('google_maps_url')} className="field" placeholder="https://maps.app.goo.gl/…" /></Field>
          <Field label="Instagram URL"><input {...t('instagram_url')} className="field" placeholder="instagram.com/epicmenswear" /></Field>
          <Field label="TikTok URL"><input {...t('tiktok_url')} className="field" /></Field>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-line bg-bg/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <button type="submit" disabled={pending} className="btn-primary h-11 px-8">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save settings
        </button>
      </div>
    </form>
  );
}
