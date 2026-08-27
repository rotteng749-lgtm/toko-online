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
          {/* Animated check */}
          <div className="success-icon animate-fade-up">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="var(--wa-green)" strokeWidth="3" fill="rgba(0,212,126,0.08)" className="success-circle" />
              <polyline points="24,42 34,52 56,28" stroke="var(--wa-green)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" className="success-check" />
            </svg>
          </div>

          <h1 className="animate-fade-up animate-delay-1">Pesanan Berhasil!</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 16, lineHeight: 1.7, maxWidth: 420, margin: '12px auto 0' }} className="animate-fade-up animate-delay-2">
            Pesanan kamu sudah diterima. Silakan cek WhatsApp untuk konfirmasi dari penjual.
          </p>

          <div className="order-code animate-fade-up animate-delay-2">#{params.code}</div>

          {/* Steps */}
          <div className="order-steps animate-fade-up animate-delay-3">
            <div className="order-step">
              <div className="order-step-num">1</div>
              <div>
                <div className="order-step-title">Pesanan Diterima</div>
                <div className="order-step-desc">Sistem telah mencatat pesanan Anda</div>
              </div>
            </div>
            <div className="order-step">
              <div className="order-step-num">2</div>
              <div>
                <div className="order-step-title">Konfirmasi WhatsApp</div>
                <div className="order-step-desc">Penjual akan mengonfirmasi pesanan</div>
              </div>
            </div>
            <div className="order-step">
              <div className="order-step-num">3</div>
              <div>
                <div className="order-step-title">Pengiriman</div>
                <div className="order-step-desc">Pesanan dikirim ke alamat Anda</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }} className="animate-fade-up animate-delay-4">
            <Link href={`/track?code=${params.code}`} className="btn btn-outline" style={{ padding: '14px 28px', fontSize: 15 }}>
              📍 Lacak Pesanan
            </Link>
            <Link href="/" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 15 }}>
              🛍️ Belanja Lagi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
