import type { Metadata } from 'next';
import { Catalogue, type CatalogueParams } from '@/components/store/Catalogue';

export const metadata: Metadata = { title: 'Catalogue' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  return <Catalogue params={await searchParams} />;
}
