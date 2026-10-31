export function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  sections: { heading: string; body: React.ReactNode }[];
}) {
  return (
    <div className="site-x pt-10 lg:pt-14">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-4 text-[40px] lg:text-[60px]">{title}</h1>
      {intro && <div className="mt-6 max-w-2xl text-[17px] leading-relaxed text-fg/85">{intro}</div>}
      <div className="mt-12 border-t border-line">
        {sections.map((s, i) => (
          <section key={s.heading} className="grid gap-4 border-b border-line py-10 lg:grid-cols-[80px_1fr_2fr] lg:gap-10">
            <span className="font-display text-sm text-subtle">{String(i + 1).padStart(2, '0')}</span>
            <h2 className="label text-fg">{s.heading}</h2>
            <div className="max-w-2xl space-y-4 text-[15px] leading-relaxed text-fg/85">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
