import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';
import { getSettings } from '@/lib/commerce/catalog';

export const metadata: Metadata = { title: 'Privacy policy' };

/* Template only: have this reviewed for your business (e.g. California CCPA/CPRA obligations). */
export default async function Privacy() {
  const s = await getSettings();
  return (
    <InfoPage
      eyebrow="Legal // Privacy"
      title="Privacy"
      sections={[
        { heading: 'What we collect', body: <p>When you order, we collect your name, email, phone number and shipping address so we can fulfill and support your order.</p> },
        { heading: 'Payments', body: <p>Card payments are processed by Stripe. Your card details go directly to Stripe and are never stored on our servers.</p> },
        { heading: 'On your device', body: <p>Your bag, wishlist and display preference (light or dark) are stored in your browser so they’re there when you come back.</p> },
        { heading: 'We don’t sell your data', body: <p>We do not sell or share your personal information for advertising. We only share what is needed to process payments and deliver your order.</p> },
        { heading: 'Your rights', body: <p>California residents and all customers can ask to access, correct or delete their data. Email <a className="link-u" href={`mailto:${s.contact_email}`}>{s.contact_email}</a>.</p> },
      ]}
    />
  );
}
