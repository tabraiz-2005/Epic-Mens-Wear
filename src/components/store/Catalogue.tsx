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

  const linkCls = (active: boolean) =>
    cn(
      'nav-label relative shrink-0 py-2 text-[11px] transition-opacity after:absolute after:inset-x-0 after:bottom-0.5 after:h-px after:bg-current after:transition-transform after:duration-300',
      active ? 'after:scale-x-100' : 'opacity-60 after:scale-x-0 hover:opacity-100 hover:after:scale-x-100'
    );

  return (
    <div className="site-x">
      {/* Breadcrumb + title */}
      <section className="pb-8 pt-10 text-center lg:pb-10 lg:pt-14">
        <nav className="flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-fg">Home</Link>
          {gender !== 'all' && (
            <>
              <span>/</span>
              <Link href={basePath(gender)} className="hover:text-fg">{gender === 'men' ? 'Men' : gender}</Link>
            </>
          )}
          {category && (
            <>
              <span>/</span>
              <span className="text-fg/80">{category.name}</span>
            </>
          )}
        </nav>
        <h1 className="serif-title mt-5 text-[40px] sm:text-[52px] lg:text-[60px]">{heading}</h1>
        {(description || category?.description) && (
          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-muted sm:text-[15px]">{description || category?.description}</p>
        )}
      </section>

      {/* Category links (scroll sideways on phones, stays visible under the header) */}
      <div className="sticky top-[72px] z-20 -mx-4 border-y border-line bg-bg/95 px-4 backdrop-blur sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-x-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        <div className="flex gap-7 overflow-x-auto py-3 no-scrollbar lg:justify-center lg:gap-10 lg:py-4">
          <Link href={href(gender, undefined, sort, extra)} scroll={false} className={linkCls(!category)}>
            All pieces <span className="ml-1 opacity-60">{inGender.length}</span>
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={href(gender, c.slug, sort, extra)} scroll={false} className={linkCls(category?.slug === c.slug)}>
              {c.name} <span className="ml-1 opacity-60">{countFor(c.slug)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-5">
        <p className="text-[12px] uppercase tracking-[0.14em] text-muted">
          {products.length} {products.length === 1 ? 'piece' : 'pieces'}
          {filtered && (
            <Link href={basePath(gender)} className="ml-4 inline-flex items-center gap-1 normal-case tracking-normal text-muted hover:text-fg">
              <X className="h-3 w-3" /> <span className="underline underline-offset-4">Clear</span>
            </Link>
          )}
        </p>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="font-serif text-[28px]">No pieces found</p>
          <p className="text-[14px] text-muted">Try another category.</p>
          <Link href="/men" className="nav-label mt-2 border-b border-fg pb-1 text-[11px]">View all pieces</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 lg:gap-y-14 xl:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
