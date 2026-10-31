'use client';

import { usePathname } from 'next/navigation';
import { whatsappLink } from '@/lib/phone';

/** Floating "chat on WhatsApp" button. Hidden on checkout so it never covers the order button. */
export function WhatsAppButton({ phone, storeName }: { phone: string | null; storeName: string }) {
  const pathname = usePathname();
  const href = whatsappLink(phone, `Hi ${storeName}, I have a question`);
  if (!href || pathname.startsWith('/checkout')) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-transform hover:scale-105 sm:bottom-8 sm:right-8"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M16.04 3C9.4 3 4 8.36 4 14.96c0 2.3.66 4.54 1.9 6.47L4 29l7.77-1.87a12.1 12.1 0 0 0 4.27.78h.01C22.68 27.91 28 22.55 28 15.95 28 9.36 22.68 3 16.04 3Zm0 22.6h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-4.61 1.11 1.13-4.43-.24-.38a9.6 9.6 0 0 1-1.5-5.15c0-5.36 4.4-9.72 9.8-9.72 5.39 0 9.66 4.36 9.66 9.72 0 5.37-4.4 10.44-8.82 10.44Zm5.45-7.3c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.23-.25-.59-.5-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
