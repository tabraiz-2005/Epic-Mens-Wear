import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/jost';
import '@fontsource-variable/inter';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import './globals.css';
import { themeScript } from '@/components/ui/ThemeToggle';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: 'Epic Menswear | Formal Suits, Shirts & Shoes in San Jose, CA', template: '%s | Epic Menswear' },
  description:
    'Epic Menswear at Eastridge Center, San Jose: formal suits, dress shirts, formal and casual shoes, and accessories for men. Shop online with fast US shipping or visit the store.',
  openGraph: { siteName: 'Epic Menswear', type: 'website', locale: 'en_US' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#FCFBF8',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
