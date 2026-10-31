'use client';

import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { deleteTaxonomy, saveTaxonomy, type TaxonomyPayload } from '@/app/admin/_actions/store';
import { slugify, cn } from '@/lib/utils';
import { Field, Notice } from './FormBits';
import { SingleImage } from './ImageManager';
import { Badge } from './Page';

export interface TaxonomyRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hero_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  gender?: 'all' | 'men' | 'women';
  season?: string | null;
  story_quote?: string | null;
  productCount: number;
}

const blank = (kind: TaxonomyPayload['kind'], sort: number): TaxonomyPayload => ({
  kind,
  name: '',
  slug: '',
  description: '',
  heroImageUrl: null,
  sortOrder: sort,
  isActive: true,
  gender: 'all',
  season: '',
  storyQuote: '',
});

export function TaxonomyManager({ kind, rows }: { kind: 'categories' | 'collections'; rows: TaxonomyRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<TaxonomyPayload | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const noun = kind === 'categories' ? 'category' : 'collection';

  const edit = (r: TaxonomyRow) => {
    setSlugTouched(true);
    setMsg(null);
    setEditing({
      id: r.id,
      kind,
      name: r.name,
      slug: r.slug,
      description: r.description ?? '',
      heroImageUrl: r.hero_image_url,
      sortOrder: r.sort_order,
      isActive: r.is_active,
      gender: r.gender ?? 'all',
      season: r.season ?? '',
      storyQuote: r.story_quote ?? '',
    });
  };

  const save = () =>
    editing &&
    start(async () => {
      const res = await saveTaxonomy(editing);
      if (res.ok) {
        setEditing(null);
        setMsg({ ok: true, text: `${editing.name} saved.` });
        router.refresh();
      } else setMsg({ ok: false, text: res.error });
    });

  const remove = (r: TaxonomyRow) => {
    if (!confirm(`Delete “${r.name}”?${r.productCount ? ` Its ${r.productCount} products will stay but have no ${noun}.` : ''}`)) return;
    start(async () => {
      const res = await deleteTaxonomy(kind, r.id);
      setMsg(res.ok ? { ok: true, text: res.message ?? 'Deleted.' } : { ok: false, text: res.error });
      router.refresh();
    });
  };

  const form = editing && (
    <div className="border border-fg bg-surface p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                autoFocus
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: slugTouched ? editing.slug : slugify(e.target.value) })}
                className="field"
              />
            </Field>
            <Field label="URL slug" hint={kind === 'categories' ? `/shop?category=${editing.slug || '…'}` : `/collections/${editing.slug || '…'}`}>
              <input
                value={editing.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setEditing({ ...editing, slug: slugify(e.target.value) });
                }}
                className="field"
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="field h-auto py-3" />
          </Field>
          {kind === 'collections' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Season label" hint="e.g. AW26">
                <input value={editing.season} onChange={(e) => setEditing({ ...editing, season: e.target.value })} className="field" />
              </Field>
              <Field label="Quote (homepage banner)">
                <input value={editing.storyQuote} onChange={(e) => setEditing({ ...editing, storyQuote: e.target.value })} className="field" />
              </Field>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Order" hint="Lower shows first">
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} className="field" />
            </Field>
            {kind === 'categories' && (
              <Field label="Shown for">
                <select value={editing.gender} onChange={(e) => setEditing({ ...editing, gender: e.target.value as 'all' })} className="field">
                  <option value="all">All</option>
                  <option value="men">Men</option>
                </select>
              </Field>
            )}
            <label className="flex items-center gap-3 pt-6 text-sm">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="h-4 w-4 accent-current" />
              Visible on store
            </label>
          </div>
        </div>
        <Field label="Image (optional)">
          <SingleImage value={editing.heroImageUrl} onChange={(u) => setEditing({ ...editing, heroImageUrl: u })} folder={kind} />
        </Field>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={save} disabled={pending} className="btn-primary h-10 px-6">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save {noun}
        </button>
        <button type="button" onClick={() => setEditing(null)} className="btn-ghost h-10">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {msg && <Notice kind={msg.ok ? 'success' : 'error'}>{msg.text}</Notice>}
      {editing && !editing.id && form}
      {!editing && (
        <button
          type="button"
          onClick={() => {
            setSlugTouched(false);
            setMsg(null);
            setEditing(blank(kind, (rows.at(-1)?.sort_order ?? 0) + 1));
          }}
          className="btn-primary h-10 px-5"
        >
          <Plus className="h-4 w-4" /> New {noun}
        </button>
      )}
      <div className="divide-y divide-line border border-line bg-surface">
        {rows.length === 0 && <p className="p-5 text-sm text-muted">No {kind} yet.</p>}
        {rows.map((r) =>
          editing?.id === r.id ? (
            <div key={r.id} className="p-2">{form}</div>
          ) : (
            <div key={r.id} className={cn('flex items-center gap-4 px-4 py-3', !r.is_active && 'opacity-60')}>
              <div className="relative h-12 w-16 shrink-0 overflow-hidden border border-line bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.hero_image_url && <img src={r.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {r.name} {!r.is_active && <Badge>Hidden</Badge>}
                </p>
                <p className="truncate text-xs text-muted">
                  /{r.slug} · {r.productCount} product{r.productCount === 1 ? '' : 's'}
                  {r.season ? ` · ${r.season}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => edit(r)} className="btn-ghost h-9 px-3" aria-label={`Edit ${r.name}`}>
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button type="button" onClick={() => remove(r)} className="p-2 text-muted hover:text-danger" aria-label={`Delete ${r.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
