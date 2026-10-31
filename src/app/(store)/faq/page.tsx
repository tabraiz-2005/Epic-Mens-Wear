import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';
import { getSettings } from '@/lib/commerce/catalog';
import { formatPhone } from '@/lib/phone';

export const metadata: Metadata = { title: 'FAQ' };

export default async function FAQ() {
  const s = await getSettings();
  return (
    <InfoPage
      eyebrow="Client care // FAQ"
      title="FAQ"
      sections={[
        { heading: 'How can I pay?', body: <p>Online orders are paid securely by card (Visa, Mastercard, American Express, Discover) and wallets such as Apple Pay and Google Pay where available, through Stripe. We never see or store your card number.</p> },
        { heading: 'Can I pick up in store?', body: <p>Visit us at {s.address ?? 'our San Jose store'}. Call or email us after ordering and we’ll let you know if your order can be held for pickup.</p> },
        { heading: 'Can I change or cancel my order?', body: <p>Contact us as soon as possible. If your order hasn’t shipped yet we can usually change or cancel it.</p> },
        { heading: 'How do I know my size?', body: <p>See the size guide and the fit notes on each product page. Still unsure? Email us your height, weight and usual jacket size, or come in for a fitting.</p> },
        { heading: 'Do you ship outside the US?', body: <p>We currently ship within the United States only.</p> },
        { heading: 'How do I contact you?', body: <p><a className="link-u" href={`mailto:${s.contact_email}`}>{s.contact_email}</a>{s.contact_phone && <> · {formatPhone(s.contact_phone)}</>}</p> },
      ]}
    />
  );
}
