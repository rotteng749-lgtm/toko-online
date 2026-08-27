import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Toko Online — Belanja Mudah via WhatsApp',
  description: 'Temukan produk terbaikmu dan pesan langsung lewat WhatsApp. Cepat, praktis, tanpa ribet.',
  icons: { icon: '🛒' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="ambient-bg" />
        {children}
      </body>
    </html>
  );
}
