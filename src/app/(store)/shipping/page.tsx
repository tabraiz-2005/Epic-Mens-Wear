import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';
import { getSettings } from '@/lib/commerce/catalog';
import { formatCents } from '@/lib/utils';

export const metadata: Metadata = { title: 'Shipping' };

export default async function ShippingPage() {
  const s = await getSettings();
  return (
    <InfoPage
      eyebrow="Client care // Shipping"
      title="Shipping"
      intro="Every order ships with full tracking. You’ll get an email with your tracking link as soon as your parcel leaves us."
      sections={[
        {
          heading: 'Rates',
          body: (
            <>
              <p>Standard (3–7 business days): {formatCents(s.standard_shipping_amount)}{s.free_shipping_threshold !== null && <>, free on orders over {formatCents(s.free_shipping_threshold)}</>}.</p>
              <p>Express (1–3 business days): {formatCents(s.express_shipping_amount)}.</p>
            </>
          ),
        },
        { heading: 'Processing', body: <p>Orders placed before 2pm Pacific on a business day usually ship the same or next business day. Weekend orders ship on Monday.</p> },
        { heading: 'Where we ship', body: <p>We ship to all 50 US states. We don’t ship internationally yet.</p> },
        { heading: 'Questions', body: <p>Write to <a className="link-u" href={`mailto:${s.contact_email}`}>{s.contact_email}</a> with your order number.</p> },
      ]}
    />
  );
}
