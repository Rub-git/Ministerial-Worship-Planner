import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { MainWrapper } from '@/components/main-wrapper';
import { TrialBanner } from '@/components/trial-banner';
import { Toaster } from 'react-hot-toast';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: 'Ministerial Worship Planner – Structured Christian Worship System',
  description: 'A denomination-aware worship planning platform designed to bring order, biblical balance, and pastoral excellence to Christian churches.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Ministerial Worship Planner – Structured Christian Worship System',
    description: 'A denomination-aware worship planning platform designed to bring order, biblical balance, and pastoral excellence to Christian churches.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-gray-50 min-h-screen flex flex-col`} suppressHydrationWarning>
        <Providers>
          <Navbar />
          <TrialBanner />
          <MainWrapper>
            {children}
          </MainWrapper>
          <Footer />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
