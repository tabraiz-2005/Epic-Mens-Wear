import { redirect } from 'next/navigation';

export default async function Legacy({ params }: { params: Promise<{ category: string }> }) {
  redirect(`/men?category=${encodeURIComponent((await params).category)}`);
}
