import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';
import { getSettings } from '@/lib/commerce/catalog';
import { mapsEmbed, mapsLink } from '@/lib/commerce/local';
import { formatPhone, telLink, whatsappLink } from '@/lib/phone';

export const metadata: Metadata = {
  title: 'Contact & store',
  description: 'Visit Epic Menswear at Eastridge Center, 2200 Eastridge Loop Ste 2066, San Jose, CA 95122, or shop online with shipping across the US.',
};

export default async function Contact() {
  const s = await getSettings();
  const phones = [s.contact_phone, s.contact_phone_2].filter(Boolean) as string[];
  const maps = mapsLink(s);
  const embed = mapsEmbed(s);
  return (
    <InfoPage
      eyebrow="Client care // Contact"
      title="Contact"
      intro="Questions about sizing, an order or a return? Call, email or visit us at Eastridge Center. We’re happy to help."
      sections={[
        ...(s.address
          ? [{
              heading: 'Visit the store',
              body: (
                <>
                  <p>
                    {s.address}
                    {maps && (
                      <>
                        <br />
                        <a className="link-u" href={maps} target="_blank" rel="noreferrer">Open in Google Maps</a>
                      </>
                    )}
                  </p>
                  {s.opening_hours && <p className="text-muted">{s.opening_hours}</p>}
                  {embed && (
                    <div className="mt-2 aspect-[4/3] w-full overflow-hidden border border-line sm:aspect-[16/9]">
                      <iframe
                        src={embed}
                        title={`Map of ${s.store_name}`}
                        className="h-full w-full grayscale-[30%]"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </>
              ),
            }]
          : []),
        ...(phones.length
          ? [{
              heading: 'Phone',
              body: (
                <ul className="space-y-2">
                  {phones.map((p) => (
                    <li key={p}>
                      <a className="link-u" href={telLink(p) ?? '#'}>{formatPhone(p) || p}</a>
                      {whatsappLink(p) && (
                        <span className="text-muted"> · <a className="link-u" href={whatsappLink(p)!} target="_blank" rel="noreferrer">text on WhatsApp</a></span>
                      )}
                    </li>
                  ))}
                </ul>
              ),
            }]
          : []),
        ...(s.instagram_url ? [{ heading: 'Instagram', body: <p><a className="link-u" href={s.instagram_url} target="_blank" rel="noreferrer">{s.instagram_url.replace(/^https?:\/\/(www\.)?/, '')}</a></p> }] : []),
        ...(s.contact_email ? [{ heading: 'Email', body: <p><a className="link-u" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></p> }] : []),
      ]}
    />
  );
}
