import type { Metadata } from 'next';
import { InfoPage } from '@/components/store/InfoPage';

export const metadata: Metadata = { title: 'Size guide' };

const JACKETS = [['36', '36', '30', 'XS'], ['38', '38', '32', 'S'], ['40', '40', '34', 'M'], ['42', '42', '36', 'M/L'], ['44', '44', '38', 'L'], ['46', '46', '40', 'XL'], ['48', '48', '42', 'XL/XXL'], ['50', '50', '44', 'XXL']];
const SHOES = [['8', '41', '9.9'], ['9', '42', '10.2'], ['10', '43', '10.6'], ['11', '44', '10.9'], ['12', '45', '11.2']];
const SHIRTS = [['14–14.5', '32–33', 'S'], ['15–15.5', '32–33 / 34–35', 'M'], ['16–16.5', '34–35', 'L'], ['17–17.5', '34–35 / 36–37', 'XL'], ['18–18.5', '36–37', 'XXL']];

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border border-line text-left font-display text-sm">
        <thead className="bg-surface text-[11px] uppercase tracking-label text-muted">
          <tr>{head.map((h) => <th key={h} className="border-b border-line px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-line last:border-0">
              {r.map((c, i) => <td key={i} className={`px-4 py-3 ${i === 0 ? 'font-bold' : 'text-fg/85'}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuide() {
  return (
    <InfoPage
      eyebrow="Client care // Fit"
      title="Size guide"
      intro="Body measurements in inches. Each product page also describes how that piece fits."
      sections={[
        { heading: 'Formal suits', body: <><Table head={['Jacket size', 'Chest (in)', 'Pant waist (in)', 'Approx.']} rows={JACKETS} /><p className="text-muted">Jackets come in Short (under 5′8″), Regular (5′8″–6′0″) and Long (over 6′0″) where shown.</p></> },
        { heading: 'Formal shirts', body: <Table head={['Neck (in)', 'Sleeve (in)', 'Size']} rows={SHIRTS} /> },
        { heading: 'Shoes', body: <><Table head={['US', 'EU', 'Foot length (in)']} rows={SHOES} /><p className="text-muted">Between sizes? Go half a size up for formal shoes and boots.</p></> },
        { heading: 'Between sizes?', body: <p>Size up for jackets and coats you’ll layer over knitwear. Pants are sent with unfinished or standard hems; any local tailor can adjust the length.</p> },
      ]}
    />
  );
}
