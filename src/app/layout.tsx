import type { Metadata, Viewport } from 'next';
import {
  Geist_Mono,
  Noto_Serif_JP,
  Zen_Old_Mincho,
  Shippori_Mincho,
  Kosugi_Maru,
  M_PLUS_Rounded_1c,
  Yuji_Syuku,
} from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/header';
import { WireframeTerrainBackground } from '@/components/background/wireframe-terrain-background';
import PwaScript from '@/components/pwa/PwaScript';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import './globals.css';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// 幻想的な日本語フォントの選択肢
// 以下のフォントから選んで、使用するフォントのコメントを外してください

// 1. Noto Serif JP - エレガントで読みやすい
const notoSerifJP = Noto_Serif_JP({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// 2. Zen Old Mincho - 古風で幻想的（推奨）
const zenOldMincho = Zen_Old_Mincho({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// 3. Shippori Mincho - 幻想的で読みやすい
const shipporiMincho = Shippori_Mincho({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// 4. Kosugi Maru - 丸みがあって優しい
const kosugiMaru = Kosugi_Maru({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

// 5. M PLUS Rounded 1c - 丸みがあってモダン
const mPlusRounded = M_PLUS_Rounded_1c({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

// 6. Yuji Syuku - 古風で幻想的
const yujiSyuku = Yuji_Syuku({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

// 使用するフォントを選択（現在は Zen Old Mincho を使用）
const mainFont = kosugiMaru;

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

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
        className={`${mainFont.variable} ${geistMono.variable} antialiased`}
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
