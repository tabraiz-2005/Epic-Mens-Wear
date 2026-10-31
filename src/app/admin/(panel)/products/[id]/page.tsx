import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { loadFormOptions, loadProductForForm } from '@/lib/admin/product-loader';

export const metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [initial, options] = await Promise.all([loadProductForForm(id), loadFormOptions()]);
  if (!initial) notFound();
  return <ProductForm key={id} initial={initial} {...options} />;
}
