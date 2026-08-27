'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function OrderPage() {
  const params = useParams();

  return (
    <div className="page-enter">
      <div className="ambient-bg" />
      <div className="container">
        <div className="order-success">
          <div className="icon animate-fade-up">✅</div>
          <h1 className="animate-fade-up animate-delay-1">Pesanan Berhasil!</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 16, lineHeight: 1.7 }} className="animate-fade-up animate-delay-2">
            Pesanan kamu sudah diterima. Silakan cek WhatsApp untuk konfirmasi dari penjual.
          </p>
          <div className="order-code animate-fade-up animate-delay-2">#{params.code}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }} className="animate-fade-up animate-delay-3">
            <Link href={`/track?code=${params.code}`} className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 15 }}>
              📍 Lacak Pesanan
            </Link>
            <Link href="/" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 15 }}>
              🛍️ Belanja Lagi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
