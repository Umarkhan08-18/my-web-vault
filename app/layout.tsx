import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';

import { GrainOverlay } from '@/components/GrainOverlay';
import { MotionLayer } from '@/components/MotionLayer';
import { SectionRail } from '@/components/SectionRail';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'My Web Vault — Your Internet, Organized',
  description:
    'A personal website launcher: save the sites you use every day, organize them by category and favorites, and open any of them in one click.',
  applicationName: 'My Web Vault',
  openGraph: {
    title: 'My Web Vault — Your Internet, Organized',
    description: 'Save it once. Launch it forever. A personal web command center for the sites you actually use.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

/* Every reveal on the page is authored "hidden, then revealed by script".
   .js-motion gates that, and this block is the escape hatch for the one case
   where the script never runs at all. */
const NO_MOTION_FALLBACK = `[data-rv]{opacity:1!important;transform:none!important}
.js-motion .word{opacity:1!important;transform:none!important}
.js-motion .mask-line>span{transform:none!important}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`js-motion ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-white font-sans text-ink antialiased">
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: NO_MOTION_FALLBACK }} />
        </noscript>

        <div className="accent-stripe fixed inset-x-0 top-0 z-[100]" aria-hidden />
        <div className="cur-dot" id="cursor" aria-hidden />

        {children}

        <GrainOverlay />
        <SectionRail />
        <MotionLayer />
      </body>
    </html>
  );
}
