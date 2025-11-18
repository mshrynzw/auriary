import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/header';
import { WireframeTerrainBackground } from '@/components/background/wireframe-terrain-background';
import PwaScript from '@/components/pwa/PwaScript';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'auriary',
  description: '日々の記録を楽に・幻想的に残せる次世代の日記アプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'auriary',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#B1B1B4',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon"></link>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <PwaScript />
        <OfflineIndicator />
        <WireframeTerrainBackground />
        <Header />
        <div className="mt-[48px]">{children}</div>
        <Toaster />
        <InstallPrompt />
      </body>
    </html>
  );
}
