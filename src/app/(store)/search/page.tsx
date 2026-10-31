import type { Metadata } from 'next';
import { Catalogue, type CatalogueParams } from '@/components/store/Catalogue';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  const params = await searchParams;
  const q = params.q?.trim().slice(0, 100);
  return <Catalogue params={{ ...params, q }} eyebrow="Search // Results" title={q ? `“${q}”` : 'Search'} />;
}
