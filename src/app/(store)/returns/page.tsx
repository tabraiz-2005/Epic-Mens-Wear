import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';
import { getSettings } from '@/lib/commerce/catalog';

export const metadata: Metadata = { title: 'Returns & exchanges' };

export default async function ReturnsPage() {
  const s = await getSettings();
  return (
    <InfoPage
      eyebrow="Client care // Returns"
      title="Returns"
      intro="If something isn’t right, you can return it within 30 days of delivery."
      sections={[
        { heading: 'Conditions', body: <p>Items must be unworn, unwashed and returned with all original tags attached and in their original packaging.</p> },
        { heading: 'How to return', body: <p>Email <a className="link-u" href={`mailto:${s.contact_email}`}>{s.contact_email}</a> with your order number and the items you’d like to return. We’ll reply with return instructions.</p> },
        { heading: 'Refunds', body: <p>Refunds are issued to the original payment method within 5–10 business days of the return arriving with us. Original shipping costs are non-refundable.</p> },
        { heading: 'Exchanges', body: <p>Need a different size? Return the original item and place a new order — that way the size you want is reserved for you straight away.</p> },
      ]}
    />
  );
}
