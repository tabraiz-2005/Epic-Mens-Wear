import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="site-x flex flex-col items-start gap-6 py-32">
      <p className="eyebrow">Error // 404</p>
      <h1 className="display text-[48px] lg:text-[80px]">Not found</h1>
      <p className="text-muted">This page or piece doesn’t exist, or is no longer available.</p>
      <Link href="/shop" className="btn-primary">Back to the catalogue</Link>
    </div>
  );
}
