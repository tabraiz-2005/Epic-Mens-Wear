import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';
import { getSettings } from '@/lib/commerce/catalog';

export const metadata: Metadata = { title: 'Terms of sale' };

/* Template only: have these terms reviewed for your business. */
export default async function Terms() {
  const s = await getSettings();
  return (
    <InfoPage
      eyebrow="Legal // Terms"
      title="Terms of sale"
      intro={`These terms apply to all orders placed with ${s.store_name}.`}
      sections={[
        { heading: 'Orders', body: <p>An order is confirmed once your payment is accepted and you receive an order number. We may cancel and refund an order if an item becomes unavailable or a pricing error occurs.</p> },
        { heading: 'Prices & tax', body: <p>Prices are in US dollars. Shipping and any applicable sales tax are shown at checkout before you pay.</p> },
        { heading: 'Delivery & risk', body: <p>Delivery estimates are not guaranteed. Risk passes to you on delivery.</p> },
        { heading: 'Returns', body: <p>See our returns policy for eligibility and how refunds are processed.</p> },
        { heading: 'Contact', body: <p>{s.store_name}, {s.address}<br /><a className="link-u" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></p> },
      ]}
    />
  );
}
