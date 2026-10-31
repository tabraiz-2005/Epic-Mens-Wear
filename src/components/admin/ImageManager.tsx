'use client';

import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Star, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/admin/upload-client';
import { cn } from '@/lib/utils';
import type { EditableImage } from './product-types';
export type { EditableImage } from './product-types';



export function ImageManager({ images, onChange }: { images: EditableImage[]; onChange: (next: EditableImage[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState('');

  const latest = useRef(images);
  latest.current = images;

  const add = (urls: string[]) => {
    const cur = latest.current;
    const next = [...cur, ...urls.map((u) => ({ url: u, alt: '', isPrimary: false, isHover: false }))];
    if (!next.some((i) => i.isPrimary) && next[0]) next[0] = { ...next[0], isPrimary: true };
    onChange(next);
  };

  const upload = async (files: FileList | File[]) => {
    setError('');
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setBusy((n) => n + list.length);
    for (const f of list) {
      try {
        const u = await uploadImage(f, 'products');
        add([u]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed.');
      } finally {
        setBusy((n) => n - 1);
      }
    }
  };

  const update = (i: number, patch: Partial<EditableImage>) => onChange(images.map((img, j) => (j === i ? { ...img, ...patch } : img)));
  const setPrimary = (i: number) => onChange(images.map((img, j) => ({ ...img, isPrimary: j === i })));
  const setHover = (i: number) => onChange(images.map((img, j) => ({ ...img, isHover: j === i ? !img.isHover : false })));
  const remove = (i: number) => {
    const next = images.filter((_, j) => j !== i);
    if (next.length && !next.some((x) => x.isPrimary)) next[0] = { ...next[0], isPrimary: true };
    onChange(next);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          upload(e.dataTransfer.files);
        }}
        className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4', drag && 'outline outline-1 outline-fg')}
      >
        {images.map((img, i) => (
          <div key={img.url + i} className="group border border-line bg-bg">
            <div className="relative aspect-[3/4] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute left-2 top-2 flex flex-col gap-1">
                {img.isPrimary && <span className="bg-fg px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-label text-bg">Cover</span>}
                {img.isHover && <span className="bg-surface px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-label">Hover</span>}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button type="button" title="Move left" onClick={() => move(i, -1)} className="p-1.5 hover:bg-white/20"><ArrowLeft className="h-3.5 w-3.5" /></button>
                <button type="button" title="Use as cover" onClick={() => setPrimary(i)} className="p-1.5 hover:bg-white/20"><Star className={cn('h-3.5 w-3.5', img.isPrimary && 'fill-white')} /></button>
                <button type="button" title="Show on hover in the grid" onClick={() => setHover(i)} className="px-1.5 font-display text-[9px] uppercase tracking-[0.1em] hover:bg-white/20">Hover</button>
                <button type="button" title="Remove" onClick={() => remove(i)} className="p-1.5 hover:bg-white/20"><Trash2 className="h-3.5 w-3.5" /></button>
                <button type="button" title="Move right" onClick={() => move(i, 1)} className="p-1.5 hover:bg-white/20"><ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <input
              value={img.alt}
              onChange={(e) => update(i, { alt: e.target.value })}
              placeholder="Alt text (describe the photo)"
              className="w-full border-t border-line bg-transparent px-2 py-2 text-xs placeholder:text-subtle focus:outline-none"
            />
          </div>
        ))}

        {Array.from({ length: busy }).map((_, i) => (
          <div key={`busy-${i}`} className="flex aspect-[3/4] items-center justify-center border border-line bg-bg">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ))}

        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed border-line-strong text-muted transition-colors hover:border-fg hover:text-fg"
        >
          <ImagePlus className="h-6 w-6" strokeWidth={1.4} />
          <span className="font-display text-[10px] uppercase tracking-label">Upload photos</span>
          <span className="text-[10px] text-subtle">or drag & drop</span>
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        {urlMode ? (
          <>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="field h-9 max-w-sm text-xs" />
            <button
              type="button"
              className="btn-outline h-9 px-3"
              onClick={() => {
                if (/^https:\/\//.test(url)) {
                  add([url]);
                  setUrl('');
                  setUrlMode(false);
                } else setError('Image links must start with https://');
              }}
            >
              Add
            </button>
            <button type="button" onClick={() => setUrlMode(false)} className="underline">Cancel</button>
          </>
        ) : (
          <button type="button" onClick={() => setUrlMode(true)} className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-fg">
            <Link2 className="h-3.5 w-3.5" /> Add by link instead
          </button>
        )}
        <span className="text-subtle">· First photo / ★ is the cover. Portrait 3:4 photos look best.</span>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

/** Single image field (category, collection, homepage hero). */
export function SingleImage({
  value,
  onChange,
  folder,
  aspect = 'aspect-[16/10]',
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: 'categories' | 'collections' | 'site';
  aspect?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <div className={cn('relative w-full overflow-hidden border border-line bg-bg', aspect)}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-subtle">No image</div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/70">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-3 text-xs">
        <button type="button" className="underline underline-offset-4" onClick={() => input.current?.click()}>
          {value ? 'Replace' : 'Upload image'}
        </button>
        {value && (
          <button type="button" className="text-muted underline underline-offset-4" onClick={() => onChange(null)}>
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setError('');
          try {
            onChange(await uploadImage(f, folder));
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed.');
          } finally {
            setBusy(false);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
