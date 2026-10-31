'use client';

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="site-x flex flex-col items-start gap-6 py-32">
      <p className="eyebrow">Error // 500</p>
      <h1 className="display text-[40px] lg:text-[64px]">Something went wrong</h1>
      <p className="text-muted">Please try again. If it keeps happening, contact us.</p>
      <button onClick={reset} className="btn-primary">Try again</button>
    </div>
  );
}
