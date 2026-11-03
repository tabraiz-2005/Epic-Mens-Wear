import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/lib/commerce/catalog';

export const metadata: Metadata = {
  title: 'About Epic Menswear',
  description:
    'Epic Menswear is a menswear store at Eastridge Center in San Jose, California: formal suits, dress shirts, formal and casual shoes, and accessories for every occasion.',
};

/*
 * PLACEHOLDER COPY: replace with Epic Menswear's real story (when the store opened,
 * who runs it, what makes it different). Keep each section to one or two short paragraphs.
 */
const STORY = [
  {
    heading: 'Who we are',
    body: [
      'Epic Menswear is a menswear store at Eastridge Center in San Jose. We dress men for the moments that matter: weddings, proms, interviews, celebrations and every day at the office.',
    ],
  },
  {
    heading: 'What we carry',
    body: [
      'Formal suits and tuxedos in classic and modern cuts, dress shirts, formal shoes and casual shoes, and the finishing touches: ties, bow ties, belts, pocket squares and cufflinks.',
    ],
  },
  {
    heading: 'Visit the store',
    body: [
      'Come and see us at 2200 Eastridge Loop, Suite 2066. Try pieces on, check the fit and put a complete look together with our team.',
    ],
  },
  {
    heading: 'Shop online',
    body: [
      'Can’t make it in? The same pieces are available here, with secure card checkout and tracked shipping across the United States.',
    ],
  },
];

const VALUES = [
  { title: 'Every occasion', text: 'From a first suit to a wedding party, one store for the whole look.' },
  { title: 'Fair prices', text: 'Sharp, well-made menswear at prices that make sense.' },
  { title: 'Personal service', text: 'Real people in store and online, happy to help with sizing.' },
];

export default async function About() {
  const s = await getSettings();
  return (
    <div className="site-x pt-10 lg:pt-14">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Our story</p>
        <h1 className="serif-title mt-4 text-[44px] lg:text-[64px]">About Epic</h1>
        <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-fg/85 lg:text-[19px]">
          Suits, shirts and shoes from Eastridge Center in San Jose, now delivered across the US.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-4xl border-t border-line">
        {STORY.map((sec, i) => (
          <section key={sec.heading} className="grid gap-4 border-b border-line py-10 md:grid-cols-[64px_200px_1fr] md:gap-8 lg:py-12">
            <span className="font-display text-sm text-subtle">{String(i + 1).padStart(2, '0')}</span>
            <h2 className="label text-fg md:pt-1">{sec.heading}</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-fg/85 lg:text-[16px]">
              {sec.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-px border border-line bg-line sm:grid-cols-3">
        {VALUES.map((v) => (
          <div key={v.title} className="bg-bg p-8">
            <h3 className="label text-fg">{v.title}</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-4xl flex-col items-center gap-4 text-center">
        {s.tagline && <p className="font-display text-[18px] italic text-fg/80">“{s.tagline}”</p>}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/shop" className="btn-primary h-14 px-10">Shop the collection</Link>
          <Link href="/contact" className="btn-outline h-14 px-10">Visit the store</Link>
        </div>
        {s.address && (
          <p className="mt-4 text-sm text-muted">
            {s.address}
            {s.opening_hours ? ` · ${s.opening_hours}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
