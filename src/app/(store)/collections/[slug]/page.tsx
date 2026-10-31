import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Catalogue, type CatalogueParams } from '@/components/store/Catalogue';
import { getCollections } from '@/lib/commerce/catalog';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogueParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCollections()).find((x) => x.slug === slug);
  return { title: c?.name ?? 'Collection', description: c?.description };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const collection = (await getCollections()).find((c) => c.slug === slug);
  if (!collection) notFound();
  return (
    <Catalogue
      params={{ ...(await searchParams), collection: slug }}
      eyebrow={`Collection // ${collection.season || 'Edit'}`}
      title={collection.name}
      description={collection.description}
    />
  );
}
