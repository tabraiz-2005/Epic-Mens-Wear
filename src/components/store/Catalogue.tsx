import Link from 'next/link';
import { Suspense } from 'react';
import { X } from 'lucide-react';
import { getCategories, getProducts, type SortKey } from '@/lib/commerce/catalog';
import { cn } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import { SortSelect } from './SortSelect';

type G = 'all' | 'men' | 'women';
const SORTS: SortKey[] = ['featured', 'newest', 'price-low', 'price-high'];

export interface CatalogueParams {
  gender?: string;
  category?: string;
  sort?: string;
  collection?: string;
  q?: string;
  sale?: string;
}

const basePath = (g: G) => (g === 'men' ? '/men' : '/shop');

function href(g: G, category: string | undefined, sort: string | undefined, extra: Record<string, string | undefined> = {}) {
  const p = new URLSearchParams();
  if (category) p.set('category', category);
  if (sort && sort !== 'featured') p.set('sort', sort);
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  const qs = p.toString();
  return qs ? `${basePath(g)}?${qs}` : basePath(g);
}

export async function Catalogue({
  params,
  fixedGender,
  eyebrow: _eyebrow = 'Garment system // Catalogue',
  title,
  description,
}: {
  params: CatalogueParams;
  fixedGender?: G;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const gender: G = fixedGender ?? (params.gender === 'men' ? 'men' : 'all');
  const sort = SORTS.includes(params.sort as SortKey) ? (params.sort as SortKey) : 'featured';
  const allCategories = await getCategories();
  const inDept = allCategories.filter((c) => gender === 'all' || c.gender === 'all' || c.gender === gender);
  const category = allCategories.find((c) => c.slug === params.category);

  const onSale = Boolean(params.sale);
  const [products, inGender] = await Promise.all([
    getProducts({ gender, category: category?.slug, collection: params.collection, search: params.q, onSale, sort }),
    getProducts({ gender, collection: params.collection, search: params.q, onSale }),
  ]);
  const countFor = (slug: string) => inGender.filter((p) => p.category === slug).length;
  // In a sale, only list categories that actually have sale pieces.
  const categories = onSale ? inDept.filter((c) => countFor(c.slug) > 0) : inDept;

  const heading =
    title ??
    (onSale
      ? `Sale${category ? ` · ${category.name}` : ''}`
      : category ? category.name : gender === 'men' ? "Men’s Collection" : 'All Pieces');
  const filtered = Boolean(category) || sort !== 'featured';
  const extra = { collection: params.collection, q: params.q, sale: params.sale };

  return (
    <div className="site-x">
      {/* Breadcrumb + title */}
      <section className="border-b border-line pb-6 pt-6 lg:pb-8 lg:pt-10">
        <nav className="flex flex-wrap items-center gap-2 text-[12px] text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-fg">Home</Link>
          {gender !== 'all' && (
            <>
              <span>/</span>
              <Link href={basePath(gender)} className="capitalize hover:text-fg">{gender}</Link>
            </>
          )}
          {category && (
            <>
              <span>/</span>
              <span className="text-fg/80">{category.name}</span>
            </>
          )}
        </nav>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-[26px] font-normal uppercase tracking-[0.06em] sm:text-[32px] lg:text-[38px]">{heading}</h1>
          <p className="text-[13px] text-muted">
            {products.length} {products.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
        {(description || category?.description) && (
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted sm:text-[14px]">{description || category?.description}</p>
        )}
      </section>

      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 pt-8">
            <p className="label text-fg">Category</p>
            <div className="mt-3">
              <Link
                href={href(gender, undefined, sort, extra)}
                scroll={false}
                className={cn('flex items-center justify-between py-2.5 text-[14px] hover:text-fg', !category ? 'font-medium text-fg' : 'text-muted')}
              >
                All pieces <span className="text-[12px] text-subtle">{inGender.length}</span>
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={href(gender, c.slug, sort, extra)}
                  scroll={false}
                  className={cn(
                    'flex items-center justify-between py-2.5 text-[14px] hover:text-fg',
                    category?.slug === c.slug ? 'font-medium text-fg' : 'text-muted'
                  )}
                >
                  {c.name} <span className="text-[12px] text-subtle">{countFor(c.slug)}</span>
                </Link>
              ))}
            </div>
            {filtered && (
              <Link href="/shop" className="mt-6 inline-flex items-center gap-2 text-[13px] text-muted hover:text-fg">
                <X className="h-3.5 w-3.5" /> <span className="underline underline-offset-4">Clear filters</span>
              </Link>
            )}
          </div>
        </aside>

        <div>
          {/* Mobile filters */}
          <div className="sticky top-[116px] z-20 -mx-4 border-b border-line bg-bg/95 px-4 backdrop-blur sm:-mx-8 sm:px-8 lg:hidden">
            <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
              <Link
                href={href(gender, undefined, sort, extra)}
                scroll={false}
                className={cn('shrink-0 rounded-full border px-4 py-1.5 text-[13px]', !category ? 'border-fg bg-fg text-bg' : 'border-line text-fg/80')}
              >
                All pieces
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={href(gender, c.slug, sort, extra)}
                  scroll={false}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-1.5 text-[13px]',
                    category?.slug === c.slug ? 'border-fg bg-fg text-bg' : 'border-line text-fg/80'
                  )}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Sort row */}
          <div className="flex items-center justify-end border-b border-line py-3 lg:py-4">
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <p className="font-display text-[20px] text-muted">No pieces found</p>
              <p className="text-[13px] text-muted">Try another category.</p>
              <Link href="/shop" className="btn-outline h-12">View all pieces</Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:mt-8 lg:gap-x-6 lg:gap-y-12 2xl:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
