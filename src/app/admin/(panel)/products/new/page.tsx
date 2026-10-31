import { ProductForm } from '@/components/admin/ProductForm';
import { EMPTY_PRODUCT } from '@/components/admin/product-types';
import { loadFormOptions } from '@/lib/admin/product-loader';

export const metadata = { title: 'New product' };

export default async function NewProductPage() {
  const options = await loadFormOptions();
  return <ProductForm initial={EMPTY_PRODUCT} {...options} />;
}
