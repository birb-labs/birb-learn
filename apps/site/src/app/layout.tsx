import type { ReactNode } from 'react';
import { Fraunces, Inter } from 'next/font/google';
import { noFlashScript } from '@birb-learn/theme';
import '@birb-learn/theme/tokens.css';
import './globals.css';

// `variable` names the exact CSS custom property next/font will set on the
// element carrying its className -- picking the same names Task 1 already
// declared as fallbacks on `<html>` in tokens.css means this override
// "just works" via normal CSS cascade, with no other file needing to know
// which font loader is in play.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const langSyncScript = `(function() {
  try {
    var seg = window.location.pathname.split('/')[1];
    if (['pt-BR', 'en-US', 'es'].indexOf(seg) !== -1) {
      document.documentElement.lang = seg;
    }
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <script dangerouslySetInnerHTML={{ __html: langSyncScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
