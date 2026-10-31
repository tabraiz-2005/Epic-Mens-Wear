import type { Metadata } from 'next';
import { getSettings } from '@/lib/commerce/catalog';
import { CheckoutForm } from './CheckoutForm';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <CheckoutForm
      shipping={{
        standard: settings.standard_shipping_amount,
        express: settings.express_shipping_amount,
        freeThreshold: settings.free_shipping_threshold,
      }}
    />
  );
}
