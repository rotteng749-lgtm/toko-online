import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Toko Online — Belanja Mudah via WhatsApp',
  description: 'Temukan produk terbaikmu dan pesan langsung lewat WhatsApp. Cepat, praktis, tanpa ribet.',
  icons: { icon: '🛒' },
  openGraph: {
    title: 'Toko Online',
    description: 'Belanja mudah, kirim via WhatsApp',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="page-enter">
        <div className="ambient-bg" />
        {children}
      </body>
    </html>
  );
}
