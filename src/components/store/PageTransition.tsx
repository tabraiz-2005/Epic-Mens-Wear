'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

const MIN_SHOW_MS = 650; // long enough to register the logo, short enough not to slow shopping
const FADE_MS = 380;
const MAX_SHOW_MS = 6000; // safety net if a page never finishes loading

/**
 * Between pages: a translucent ivory veil with the Epic logo, shown when a visitor
 * follows a link inside the store (category, product, collection…), removed once
 * the next page has arrived. Skipped for new tabs, downloads, same-page anchors,
 * the admin, and visitors who prefer reduced motion.
 */
export function PageTransition({ storeName }: { storeName: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState<'hidden' | 'shown' | 'leaving'>('hidden');
  const startedAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const routeKey = `${pathname}?${params.toString()}`;
  const firstRoute = useRef(routeKey);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Start the veil when an internal link is clicked.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onClick = (e: MouseEvent) => {
      // Runs in the capture phase (before Next.js's <Link> handler), so don't rely on defaultPrevented.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest('a');
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) return;
      const here = window.location;
      if (url.pathname === here.pathname && url.search === here.search) return; // same page / #anchor

      clearTimers();
      startedAt.current = Date.now();
      setState('shown');
      timers.current.push(setTimeout(() => setState('hidden'), MAX_SHOW_MS));
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Fade out once the new page is on screen (after a short minimum, so it never flickers).
  useEffect(() => {
    if (routeKey === firstRoute.current) return;
    firstRoute.current = routeKey;
    if (state === 'hidden') return;
    clearTimers();
    const wait = Math.max(0, MIN_SHOW_MS - (Date.now() - startedAt.current));
    timers.current.push(
      setTimeout(() => {
        setState('leaving');
        timers.current.push(setTimeout(() => setState('hidden'), FADE_MS));
      }, wait)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  useEffect(() => clearTimers, []);

  if (state === 'hidden') return null;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-0 z-[70] flex flex-col items-center justify-center bg-bg/75 backdrop-blur-[6px] transition-opacity ease-out',
        state === 'leaving' ? 'opacity-0' : 'opacity-100 animate-veil-in'
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <Logo title={storeName} className="w-[150px] text-fg animate-logo-breath sm:w-[190px]" />
      <span className="mt-8 block h-px w-24 overflow-hidden bg-line">
        <span className="block h-full w-1/2 animate-[veilBar_1.1s_ease-in-out_infinite] bg-fg/60" />
      </span>
    </div>
  );
}
