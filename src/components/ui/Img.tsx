'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const OPTIMIZED = [/\.supabase\.(co|in)$/, /^images\.unsplash\.com$/, /^plus\.unsplash\.com$/];

function canOptimize(src: string) {
  try {
    const host = new URL(src).hostname;
    return OPTIMIZED.some((r) => r.test(host));
  } catch {
    return false;
  }
}

/**
 * Fill-mode image: optimised for Supabase/Unsplash, plain <img> for any other URL.
 * If the photo fails to load it hides itself, so whatever is behind it (e.g. the
 * garment drawing on product cards) shows instead of a broken-image icon.
 */
export function Img({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 50vw, 25vw',
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return null;
  if (canOptimize(src)) {
    return (
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} onError={() => setFailed(true)} className={cn('object-cover', className)} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={cn('absolute inset-0 h-full w-full object-cover', className)}
    />
  );
}
