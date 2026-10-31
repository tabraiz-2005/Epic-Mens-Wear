'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { COLOR_FAMILIES } from '@/lib/commerce/types';
import { cn } from '@/lib/utils';
import type { ColourDef, VariantCell } from './product-types';
export type { ColourDef, VariantCell } from './product-types';




export const vkey = (color: string, size: string) => `${color}__${size}`;

const SIZE_PRESETS: Record<string, string[]> = {
  'Men S–XL': ['S', 'M', 'L', 'XL'],
  'Men S–XXL': ['S', 'M', 'L', 'XL', 'XXL'],
  'Suit 36R–48R': ['36R', '38R', '40R', '42R', '44R', '46R', '48R'],
  'Suit S/R/L 38–46': ['38S', '38R', '40S', '40R', '40L', '42S', '42R', '42L', '44R', '44L', '46R', '46L'],
  'Pants waist 28–42': ['28', '30', '32', '34', '36', '38', '40', '42'],
  'Shirt neck 14.5–18': ['14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18'],
  'Shoes US 7–13': ['7', '8', '9', '10', '11', '12', '13'],
  'One size': ['One Size'],
};

const COLOUR_PRESETS: ColourDef[] = [
  { name: 'Black', hex: '#111111', family: 'black' },
  { name: 'Charcoal', hex: '#3A3B3E', family: 'grey' },
  { name: 'Grey Melange', hex: '#8D8F93', family: 'grey' },
  { name: 'Navy', hex: '#1E2A3F', family: 'blue' },
  { name: 'Camel', hex: '#B48A5E', family: 'brown' },
  { name: 'Chocolate', hex: '#4A3326', family: 'brown' },
  { name: 'Oatmeal', hex: '#D8CDB8', family: 'beige' },
  { name: 'Ecru', hex: '#EDE6D6', family: 'white' },
  { name: 'Olive', hex: '#545A3A', family: 'green' },
  { name: 'Burgundy', hex: '#5B1F28', family: 'red' },
];

export function VariantEditor({
  colours,
  sizes,
  cells,
  basePrice,
  baseSku,
  productImages,
  onColours,
  onSizes,
  onCells,
}: {
  colours: ColourDef[];
  sizes: string[];
  cells: Record<string, VariantCell>;
  basePrice: string;
  baseSku: string;
  productImages: string[];
  onColours: (c: ColourDef[]) => void;
  onSizes: (s: string[]) => void;
  onCells: (c: Record<string, VariantCell>) => void;
}) {
  const [newColour, setNewColour] = useState<ColourDef>({ name: '', hex: '#111111', family: 'black' });
  const [newSize, setNewSize] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  const cell = (c: string, s: string): VariantCell =>
    cells[vkey(c, s)] ?? { sku: '', price: '', compareAtPrice: '', stock: '0', isActive: true, imageUrl: null };
  const setCell = (c: string, s: string, patch: Partial<VariantCell>) =>
    onCells({ ...cells, [vkey(c, s)]: { ...cell(c, s), ...patch } });

  const addColour = (def: ColourDef) => {
    const name = def.name.trim();
    if (!name || colours.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    onColours([...colours, { ...def, name }]);
  };
  const addSize = (s: string) => {
    const v = s.trim();
    if (!v || sizes.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onSizes([...sizes, v]);
  };
  const totalStock = colours.reduce((n, c) => n + sizes.reduce((m, s) => m + (Number(cell(c.name, s).stock) || 0), 0), 0);

  return (
    <div className="space-y-6">
      {/* Colours */}
      <div>
        <p className="field-label">Colours</p>
        <div className="flex flex-wrap gap-2">
          {colours.map((c, i) => (
            <span key={c.name} className="inline-flex items-center gap-2 border border-line bg-bg py-1 pl-1 pr-2 text-sm">
              <input
                type="color"
                value={c.hex}
                onChange={(e) => onColours(colours.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0"
                title="Swatch colour"
              />
              {c.name}
              <select
                value={c.family}
                onChange={(e) => onColours(colours.map((x, j) => (j === i ? { ...x, family: e.target.value } : x)))}
                className="bg-transparent text-xs text-muted focus:outline-none"
                title="Colour family (used for filtering)"
              >
                {COLOR_FAMILIES.map((f) => (
                  <option key={f} value={f} className="bg-bg">{f}</option>
                ))}
              </select>
              <button type="button" onClick={() => onColours(colours.filter((_, j) => j !== i))} className="text-muted hover:text-danger" aria-label={`Remove ${c.name}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={newColour.name}
            onChange={(e) => setNewColour({ ...newColour, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addColour(newColour);
                setNewColour({ ...newColour, name: '' });
              }
            }}
            placeholder="New colour name"
            className="field h-9 w-44 text-sm"
          />
          <input type="color" value={newColour.hex} onChange={(e) => setNewColour({ ...newColour, hex: e.target.value })} className="h-9 w-10 cursor-pointer border border-line bg-transparent p-1" />
          <button
            type="button"
            className="btn-outline h-9 px-3"
            onClick={() => {
              addColour(newColour);
              setNewColour({ ...newColour, name: '' });
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
          <span className="mx-1 text-xs text-subtle">Quick add:</span>
          {COLOUR_PRESETS.filter((p) => !colours.some((c) => c.name === p.name)).slice(0, 7).map((p) => (
            <button key={p.name} type="button" onClick={() => addColour(p)} className="inline-flex items-center gap-1.5 border border-line px-2 py-1 text-xs text-muted hover:border-line-strong hover:text-fg">
              <span className="h-3 w-3 border border-line" style={{ background: p.hex }} /> {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <p className="field-label">Sizes</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s, i) => (
            <span key={s} className="inline-flex items-center gap-2 border border-line bg-bg px-3 py-1.5 font-display text-sm">
              {s}
              <button type="button" onClick={() => onSizes(sizes.filter((_, j) => j !== i))} className="text-muted hover:text-danger" aria-label={`Remove size ${s}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSize(newSize);
                setNewSize('');
              }
            }}
            placeholder="Add size + Enter"
            className="field h-9 w-36 text-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-subtle">Presets:</span>
          {Object.entries(SIZE_PRESETS).map(([label, list]) => (
            <button key={label} type="button" onClick={() => onSizes(list)} className="border border-line px-2 py-1 text-xs text-muted hover:border-line-strong hover:text-fg">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix */}
      {colours.length > 0 && sizes.length > 0 ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="field-label !mb-0">
              {colours.length * sizes.length} variants · {totalStock} in stock
            </p>
            <div className="flex items-center gap-2">
              <input value={bulkStock} onChange={(e) => setBulkStock(e.target.value.replace(/\D/g, ''))} placeholder="Qty" className="field h-8 w-20 text-xs" />
              <button
                type="button"
                className="btn-outline h-8 px-3 text-[10px]"
                onClick={() => {
                  if (bulkStock === '') return;
                  const next = { ...cells };
                  for (const c of colours) for (const s of sizes) next[vkey(c.name, s)] = { ...cell(c.name, s), stock: bulkStock };
                  onCells(next);
                }}
              >
                Set all stock
              </button>
            </div>
          </div>
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-bg">
                <tr className="text-left font-display text-[10px] uppercase tracking-label text-muted">
                  <th className="px-3 py-2.5 font-medium">Variant</th>
                  <th className="px-3 py-2.5 font-medium">Stock</th>
                  <th className="px-3 py-2.5 font-medium">Price $</th>
                  <th className="px-3 py-2.5 font-medium">SKU</th>
                  <th className="px-3 py-2.5 font-medium">Photo</th>
                  <th className="px-3 py-2.5 font-medium">On sale</th>
                </tr>
              </thead>
              <tbody>
                {colours.map((c) =>
                  sizes.map((s, si) => {
                    const v = cell(c.name, s);
                    return (
                      <tr key={vkey(c.name, s)} className={cn('border-t border-line', si === 0 && 'border-t-line-strong', !v.isActive && 'opacity-50')}>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 shrink-0 border border-line" style={{ background: c.hex }} />
                            <span className="whitespace-nowrap">{c.name} / <b className="font-display">{s}</b></span>
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            inputMode="numeric"
                            value={v.stock}
                            onChange={(e) => setCell(c.name, s, { stock: e.target.value.replace(/\D/g, '') })}
                            className={cn('field h-9 w-20 text-sm', Number(v.stock) === 0 && 'border-danger/60')}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            inputMode="decimal"
                            value={v.price}
                            placeholder={basePrice || '0'}
                            onChange={(e) => setCell(c.name, s, { price: e.target.value.replace(/[^\d.]/g, '') })}
                            className="field h-9 w-24 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={v.sku}
                            placeholder={`${baseSku || 'SKU'}-${c.name.slice(0, 3).toUpperCase()}-${s}`}
                            onChange={(e) => setCell(c.name, s, { sku: e.target.value.toUpperCase() })}
                            className="field h-9 w-48 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {si === 0 ? (
                            <select
                              value={v.imageUrl ?? ''}
                              onChange={(e) => {
                                const next = { ...cells };
                                for (const sz of sizes) next[vkey(c.name, sz)] = { ...cell(c.name, sz), imageUrl: e.target.value || null };
                                onCells(next);
                              }}
                              className="field h-9 w-36 text-xs"
                              title="Photo shown when this colour is selected"
                            >
                              <option value="">Cover photo</option>
                              {productImages.map((u, i) => (
                                <option key={u} value={u}>Photo {i + 1}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-subtle">same</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={v.isActive} onChange={(e) => setCell(c.name, s, { isActive: e.target.checked })} className="h-4 w-4 accent-current" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-subtle">Leave price empty to use the product price. Untick “On sale” to hide a variant without deleting it.</p>
        </div>
      ) : (
        <p className="border border-dashed border-line-strong p-4 text-sm text-muted">Add at least one colour and one size to create variants.</p>
      )}
    </div>
  );
}
