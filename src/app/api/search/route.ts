import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/commerce/catalog';
import { primaryImage } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim().slice(0, 100) ?? '';
  if (q.length < 2) return NextResponse.json({ products: [] });
  const products = await getProducts({ search: q });
  return NextResponse.json({
    products: products.slice(0, 12).map((p) => ({
      slug: p.slug,
      title: p.title,
      price: p.price,
      image: primaryImage(p.images) || null,
      category: p.category,
      color: p.availableColors[0]?.hex ?? null,
      categoryName: p.categoryName,
    })),
  });
}
