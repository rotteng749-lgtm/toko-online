'use client';

import { useState, useEffect } from 'react';

const STATUS_STEPS = [
  { key: 'new', label: 'Pesanan Diterima', icon: '📦', desc: 'Pesanan Anda telah diterima oleh sistem' },
  { key: 'confirmed', label: 'Dikonfirmasi', icon: '✅', desc: 'Pesanan Anda sudah dikonfirmasi oleh penjual' },
  { key: 'shipped', label: 'Dikirim', icon: '🚚', desc: 'Pesanan Anda sedang dalam perjalanan' },
  { key: 'done', label: 'Selesai', icon: '🎉', desc: 'Pesanan Anda telah sampai' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'var(--accent)',
  confirmed: '#818cf8',
  shipped: 'var(--warning)',
  done: 'var(--wa-green)',
  cancelled: 'var(--danger)',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Pesanan Diterima',
  confirmed: 'Dikonfirmasi',
  shipped: 'Dikirim',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
};

function formatIDR(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
  payment_note: string;
  created_at: number;
}

export default function TrackPage() {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('code');
    if (q) {
      setCode(q.toUpperCase());
      trackOrder(q.toUpperCase());
    }
  }, []);

  const trackOrder = async (orderCode: string) => {
    if (!orderCode.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/orders/track?code=${encodeURIComponent(orderCode.trim())}`);
      const data = await res.json();
      if (data.ok) {
        setOrder(data.order);
        // Update URL without reload
        const url = new URL(window.location.href);
        url.searchParams.set('code', orderCode.trim());
        window.history.replaceState({}, '', url.toString());
      } else {
        setError(data.reason || 'Pesanan tidak ditemukan');
      }
    } catch {
      setError('Gagal menghubungi server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackOrder(code);
  };

  const getStepIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="track-page">
      {/* Hero Section */}
      <div className="track-hero animate-fade-up">
        <div className="track-hero-icon">📍</div>
        <h1>Lacak Pesanan</h1>
        <p>Masukkan kode pesanan Anda untuk melihat status pengiriman</p>
      </div>

      {/* Search Form */}
      <form className="track-search animate-fade-up" onSubmit={handleSubmit}>
        <div className="track-search-inner">
          <div className="track-search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            className="track-search-input"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Contoh: ORD-M1A2B3C-X4Y5"
            autoFocus
          />
          <button type="submit" className="track-search-btn" disabled={loading || !code.trim()}>
            {loading ? (
              <span className="track-spinner" />
            ) : (
              'Lacak'
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="track-error animate-fade-up">
          <span className="track-error-icon">😔</span>
          <div>
            <div style={{ fontWeight: 600 }}>{error}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              Pastikan kode pesanan benar dan sudah pernah melakukan pemesanan
            </div>
          </div>
        </div>
      )}

      {/* Order Found */}
      {order && (
        <div className="track-result animate-fade-up">
          {/* Order Header */}
          <div className="track-order-header">
            <div>
              <div className="track-order-code">#{order.order_code}</div>
              <div className="track-order-time">
                {STATUS_LABELS[order.status] || order.status} • {timeAgo(order.created_at)}
              </div>
            </div>
            <div className="track-order-total">{formatIDR(order.total)}</div>
          </div>

          {/* Status Timeline */}
          {isCancelled ? (
            <div className="track-cancelled">
              <div className="track-cancelled-icon">❌</div>
              <div className="track-cancelled-text">Pesanan Dibatalkan</div>
              <div className="track-cancelled-sub">Pesanan ini telah dibatalkan</div>
            </div>
          ) : (
            <div className="track-timeline">
              {STATUS_STEPS.map((step, idx) => {
                const isActive = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div
                    key={step.key}
                    className={`track-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="track-step-line">
                      <div className="track-step-dot" style={{
                        background: isActive ? STATUS_COLORS[step.key] : 'var(--glass-strong)',
                        boxShadow: isCurrent ? `0 0 16px ${STATUS_COLORS[step.key]}60` : 'none',
                      }}>
                        {isActive ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{idx + 1}</span>
                        )}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className="track-step-connector" style={{
                          background: idx < currentStep
                            ? `linear-gradient(to bottom, ${STATUS_COLORS[step.key]}, ${STATUS_COLORS[STATUS_STEPS[idx + 1].key]})`
                            : 'var(--glass-strong)',
                        }} />
                      )}
                    </div>
                    <div className="track-step-content">
                      <div className="track-step-label" style={{ color: isActive ? STATUS_COLORS[step.key] : 'var(--text-muted)' }}>
                        {step.icon} {step.label}
                      </div>
                      {isCurrent && <div className="track-step-desc">{step.desc}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Order Items */}
          <div className="track-section">
            <div className="track-section-title">📋 Item Pesanan</div>
            <div className="track-items">
              {order.items.map((item, idx) => (
                <div key={idx} className="track-item">
                  <div className="track-item-info">
                    <div className="track-item-name">{item.name}</div>
                    <div className="track-item-qty">x{item.qty}</div>
                  </div>
                  <div className="track-item-price">{formatIDR(item.price * item.qty)}</div>
                </div>
              ))}
              <div className="track-item-total">
                <span>Total</span>
                <span>{formatIDR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="track-section">
            <div className="track-section-title">👤 Info Pelanggan</div>
            <div className="track-info-grid">
              <div className="track-info-row">
                <span className="track-info-label">Nama</span>
                <span className="track-info-value">{order.customer_name}</span>
              </div>
              <div className="track-info-row">
                <span className="track-info-label">Telepon</span>
                <span className="track-info-value">{order.phone}</span>
              </div>
              {order.address && (
                <div className="track-info-row">
                  <span className="track-info-label">Alamat</span>
                  <span className="track-info-value">{order.address}</span>
                </div>
              )}
              {order.notes && (
                <div className="track-info-row">
                  <span className="track-info-label">Catatan</span>
                  <span className="track-info-value">{order.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          {order.payment_note && (
            <div className="track-section">
              <div className="track-section-title">💳 Info Pembayaran</div>
              <div className="track-payment-note">{order.payment_note}</div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!searched && !order && !error && (
        <div className="track-empty animate-fade-up">
          <div className="track-empty-icon">🛒</div>
          <div className="track-empty-title">Belum ada pesanan?</div>
          <div className="track-empty-desc">
            Belanja dulu yuk! Masukkan kode pesanan yang Anda terima setelah checkout.
          </div>
          <a href="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            Mulai Belanja →
          </a>
        </div>
      )}

      {/* Quick Links */}
      <div className="track-quick-links animate-fade-up">
        <a href="/" className="track-quick-link">
          <span>🏠</span> Kembali ke Toko
        </a>
        <a href="/track" className="track-quick-link" onClick={() => { setCode(''); setOrder(null); setError(''); setSearched(false); }}>
          <span>🔍</span> Lacak Pesanan Lain
        </a>
      </div>
    </div>
  );
}
