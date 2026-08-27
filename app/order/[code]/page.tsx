'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function OrderPage() {
  const params = useParams();

  return (
    <div className="container">
      <div className="order-success">
        <div className="icon">✅</div>
        <h1>Pesanan Berhasil!</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Pesanan kamu sudah diterima. Silakan cek WhatsApp untuk konfirmasi dari penjual.
        </p>
        <div className="order-code">#{params.code}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          <Link href="/" className="btn btn-primary">Belanja Lagi</Link>
        </div>
      </div>
    </div>
  );
}
