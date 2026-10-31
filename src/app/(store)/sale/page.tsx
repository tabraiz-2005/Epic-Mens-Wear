import type { Metadata } from 'next';
import { Catalogue, type CatalogueParams } from '@/components/store/Catalogue';

export const metadata: Metadata = {
  title: 'Sale',
  description: 'Marked-down suits, shirts, shoes and accessories from Epic Menswear, San Jose. Limited sizes, while stock lasts.',
};

export default async function SalePage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  const params = await searchParams;
  return (
    <Catalogue
      params={{ ...params, sale: '1' }}
      description="Marked-down pieces from across the store. Limited sizes, while stock lasts."
    />
  );
}
