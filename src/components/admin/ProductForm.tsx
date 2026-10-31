'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { deleteProduct, duplicateProduct, saveProduct, type ProductPayload } from '@/app/admin/_actions/products';
import { cn, slugify } from '@/lib/utils';
import { Field, Notice } from './FormBits';
import { ImageManager } from './ImageManager';
import { VariantEditor, vkey } from './VariantEditor';
import type { ProductFormInitial } from './product-types';
export { EMPTY_PRODUCT, type ProductFormInitial } from './product-types';

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="border border-line bg-surface">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="font-display text-[12px] font-semibold uppercase tracking-label">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

export function ProductForm({
  initial,
  categories,
  collections,
  allProducts,
}: {
  initial: ProductFormInitial;
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  allProducts: { slug: string; title: string }[];
}) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [result, setResult] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const set = <K extends keyof ProductFormInitial>(k: K, v: ProductFormInitial[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const imageUrls = useMemo(() => f.images.map((i) => i.url), [f.images]);

  const save = (statusOverride?: ProductFormInitial['status']) => {
    setResult(null);
    const status = statusOverride ?? f.status;
    const payload: ProductPayload = {
      id: f.id,
      title: f.title,
      slug: f.slug || slugify(f.title),
      sku: f.sku,
      subtitle: f.subtitle,
      description: f.description,
      price: Number(f.price),
      compareAtPrice: f.compareAtPrice ? Number(f.compareAtPrice) : null,
      gender: f.gender,
      categoryId: f.categoryId || null,
      collectionId: f.collectionId || null,
      material: f.material,
      careInstructions: f.care.split('\n'),
      fitInfo: f.fitInfo,
      craftsmanshipNotes: f.craftsmanshipNotes,
      shippingInfo: f.shippingInfo,
      seoTitle: f.seoTitle,
      seoDescription: f.seoDescription,
      isNewArrival: f.isNewArrival,
      isFeatured: f.isFeatured,
      isBestseller: f.isBestseller,
      status,
      relatedSlugs: f.relatedSlugs,
      images: f.images,
      variants: f.colours.flatMap((c) =>
        f.sizes.map((s) => {
          const v = f.cells[vkey(c.name, s)];
          return {
            id: v?.id,
            color: c.name,
            colorHex: c.hex,
            colorFamily: c.family,
            size: s,
            sku: v?.sku ?? '',
            price: v?.price ? Number(v.price) : Number(f.price),
            compareAtPrice: v?.compareAtPrice ? Number(v.compareAtPrice) : null,
            stock: Number(v?.stock ?? 0),
            isActive: v?.isActive ?? true,
            imageUrl: v?.imageUrl ?? null,
          };
        })
      ),
    };
    startSave(async () => {
      const res = await saveProduct(payload);
      if (!res.ok) {
        setResult({ kind: 'error', text: res.error });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setDirty(false);
      const ids = res.data!.variantIds;
      setF((prev) => {
        const cells = { ...prev.cells };
        for (const c of prev.colours)
          for (const s of prev.sizes) {
            const k = vkey(c.name, s);
            cells[k] = { ...(cells[k] ?? { sku: '', price: '', compareAtPrice: '', stock: '0', isActive: true, imageUrl: null }), id: ids[k] };
          }
        return { ...prev, id: res.data!.id, slug: res.data!.slug, status, cells };
      });
      setResult({ kind: 'success', text: status === 'active' ? 'Saved — the product is live on the store.' : 'Saved.' });
      if (!f.id && res.data) router.replace(`/admin/products/${res.data.id}`);
    });
  };

  const remove = async () => {
    if (!f.id || !confirm(`Delete “${f.title}”? This cannot be undone.`)) return;
    setBusy(true);
    const res = await deleteProduct(f.id);
    setBusy(false);
    if (!res.ok) return setResult({ kind: 'error', text: res.error });
    setDirty(false);
    if (res.data?.archived) {
      setResult({ kind: 'success', text: res.message ?? 'Archived.' });
      setF((prev) => ({ ...prev, status: 'archived' }));
    } else router.push('/admin/products');
  };

  const duplicate = async () => {
    if (!f.id) return;
    setBusy(true);
    const res = await duplicateProduct(f.id);
    setBusy(false);
    if (!res.ok) return setResult({ kind: 'error', text: res.error });
    router.push(`/admin/products/${res.data!.id}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {/* Sticky action bar */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur sm:px-8 lg:top-0">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin/products" className="p-1 text-muted hover:text-fg" aria-label="Back to products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="truncate font-display text-lg font-bold uppercase tracking-[0.02em]">{f.title || 'New product'}</h1>
          {dirty && <span className="hidden text-xs text-gold sm:inline">Unsaved changes</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {f.id && f.status === 'active' && (
            <Link href={`/products/${f.slug}`} target="_blank" className="btn-ghost h-10">
              <ExternalLink className="h-4 w-4" /> View
            </Link>
          )}
          {f.status !== 'active' && (
            <button type="button" disabled={saving} onClick={() => save('active')} className="btn-outline h-10 px-4">
              Save & publish
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary h-10 px-6">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-8">
        {result && (
          <Notice kind={result.kind} className="mb-6">
            {result.text}
          </Notice>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            <Section title="Basics">
              <Field label="Product name">
                <input
                  value={f.title}
                  onChange={(e) => {
                    set('title', e.target.value);
                    if (!slugTouched) set('slug', slugify(e.target.value));
                  }}
                  required
                  className="field"
                  placeholder="e.g. Double-Breasted Wool Overcoat"
                />
              </Field>
              <Field label="Short line" hint="Shown under the name on the product page, e.g. “Satin shawl lapel, one button”.">
                <input value={f.subtitle} onChange={(e) => set('subtitle', e.target.value)} className="field" />
              </Field>
              <Field label="Description">
                <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={5} required className="field h-auto py-3" />
              </Field>
            </Section>

            <Section title="Photos" hint="Upload as many as you like. The cover shows in the catalogue; the “hover” photo appears when a shopper hovers.">
              <ImageManager images={f.images} onChange={(imgs) => set('images', imgs)} />
            </Section>

            <Section title="Colours, sizes & stock" hint="Every colour × size combination is a variant with its own stock.">
              <VariantEditor
                colours={f.colours}
                sizes={f.sizes}
                cells={f.cells}
                basePrice={f.price}
                baseSku={f.sku || f.slug.toUpperCase().slice(0, 20)}
                productImages={imageUrls}
                onColours={(c) => set('colours', c)}
                onSizes={(s) => set('sizes', s)}
                onCells={(c) => set('cells', c)}
              />
            </Section>

            <Section title="Product details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Composition / material">
                  <input value={f.material} onChange={(e) => set('material', e.target.value)} className="field" placeholder="Wool-blend suiting, fully lined" />
                </Field>
                <Field label="Fit">
                  <input value={f.fitInfo} onChange={(e) => set('fitInfo', e.target.value)} className="field" placeholder="Regular fit. True to size." />
                </Field>
              </div>
              <Field label="Care" hint="One instruction per line.">
                <textarea value={f.care} onChange={(e) => set('care', e.target.value)} rows={3} className="field h-auto py-3" />
              </Field>
              <Field label="Construction notes (optional)">
                <textarea value={f.craftsmanshipNotes} onChange={(e) => set('craftsmanshipNotes', e.target.value)} rows={2} className="field h-auto py-3" />
              </Field>
              <Field label="Shipping note (optional)" hint="Leave empty to use the standard note.">
                <input value={f.shippingInfo} onChange={(e) => set('shippingInfo', e.target.value)} className="field" />
              </Field>
            </Section>

            <Section title="Search engines">
              <Field label="URL" hint={`yourstore.com/products/${f.slug || 'product-name'}`}>
                <input
                  value={f.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', slugify(e.target.value));
                  }}
                  className="field"
                />
              </Field>
              <Field label="Page title" hint="Defaults to the product name.">
                <input value={f.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} className="field" maxLength={70} />
              </Field>
              <Field label="Meta description" hint={`${f.seoDescription.length}/160`}>
                <textarea value={f.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} rows={2} maxLength={160} className="field h-auto py-3" />
              </Field>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Status">
              <div className="grid grid-cols-3 border border-line">
                {(['draft', 'active', 'archived'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    className={cn('h-10 font-display text-[10px] uppercase tracking-label', f.status === s ? 'bg-fg font-bold text-bg' : 'text-muted hover:text-fg')}
                  >
                    {s === 'active' ? 'Live' : s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">
                {f.status === 'active' ? 'Visible to customers.' : f.status === 'draft' ? 'Hidden until you set it live.' : 'Hidden and out of your main list.'}
              </p>
            </Section>

            <Section title="Pricing">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price ($)">
                  <input inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value.replace(/[^\d.]/g, ''))} required className="field" />
                </Field>
                <Field label="Compare at" hint="Optional sale strikethrough">
                  <input inputMode="decimal" value={f.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value.replace(/[^\d.]/g, ''))} className="field" />
                </Field>
              </div>
              <Field label="Product SKU">
                <input value={f.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} className="field" placeholder="EM-SU-10" />
              </Field>
            </Section>

            <Section title="Organisation">
              <Field label="Department">
                <select value={f.gender} onChange={(e) => set('gender', e.target.value as ProductFormInitial['gender'])} className="field">
                  <option value="men">Men</option>
                  <option value="unisex">Unisex</option>
                </select>
              </Field>
              <Field label="Category" hint={<Link className="underline" href="/admin/categories">Manage categories</Link>}>
                <select value={f.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="field">
                  <option value="">— None —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Collection">
                <select value={f.collectionId} onChange={(e) => set('collectionId', e.target.value)} className="field">
                  <option value="">— None —</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <div className="space-y-2.5 pt-1">
                {(
                  [
                    ['isNewArrival', 'New arrival', 'Shows the “New arrival” badge'],
                    ['isFeatured', 'Featured', 'Shown first and on the homepage'],
                    ['isBestseller', 'Bestseller', 'Shows the “Bestseller” badge'],
                  ] as const
                ).map(([k, label, hint]) => (
                  <label key={k} className="flex cursor-pointer items-start gap-3 text-sm">
                    <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} className="mt-0.5 h-4 w-4 accent-current" />
                    <span>
                      {label}
                      <span className="block text-xs text-subtle">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Section>

            <Section title="You may also like" hint="Pick up to 4. Otherwise similar pieces are chosen automatically.">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !f.relatedSlugs.includes(e.target.value) && f.relatedSlugs.length < 4)
                    set('relatedSlugs', [...f.relatedSlugs, e.target.value]);
                }}
                className="field"
              >
                <option value="">Add a product…</option>
                {allProducts
                  .filter((p) => p.slug !== f.slug && !f.relatedSlugs.includes(p.slug))
                  .map((p) => (
                    <option key={p.slug} value={p.slug}>{p.title}</option>
                  ))}
              </select>
              <ul className="space-y-1">
                {f.relatedSlugs.map((s) => (
                  <li key={s} className="flex items-center justify-between border border-line px-3 py-2 text-sm">
                    <span className="truncate">{allProducts.find((p) => p.slug === s)?.title ?? s}</span>
                    <button type="button" className="text-xs text-muted hover:text-danger" onClick={() => set('relatedSlugs', f.relatedSlugs.filter((x) => x !== s))}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </Section>

            {f.id && (
              <Section title="More">
                <button type="button" onClick={duplicate} disabled={busy} className="btn-outline h-10 w-full">
                  <Copy className="h-4 w-4" /> Duplicate
                </button>
                <button type="button" onClick={remove} disabled={busy} className="btn h-10 w-full border border-danger/50 text-danger hover:bg-danger/10">
                  <Trash2 className="h-4 w-4" /> Delete product
                </button>
              </Section>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
