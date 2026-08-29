'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product { id: number; name: string; slug: string; price: number; sale_price: number; stock: number; image_url: string; category_name: string; }

export default function FlashSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetch('/api/products?limit=100').then(r => r.json()).then(d => {
      if (d.ok) {
        const onSale = d.products.filter((p: Product) => p.sale_price > 0);
        setProducts(onSale);
      }
    });
  }, []);

  // Countdown to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  return (
    <div className="page-enter">
      <div className="ambient-bg" />
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali
          </Link>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>🔥 Flash Sale</div>
        </div>
      </header>

      <div className="container">
        <div style={{ padding: '32px 0 100px' }}>
          {/* Flash Sale Header */}
          <div className="animate-fade-up" style={{
            textAlign: 'center', marginBottom: 40,
            background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(254,202,87,0.1))',
            borderRadius: 'var(--radius-lg)', padding: '40px 24px',
            border: '1px solid rgba(255,107,107,0.2)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800,
              marginBottom: 8, background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Flash Sale Hari Ini!</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 24 }}>
              Penawaran spesial berakhir saat jam 00:00
            </p>

            {/* Countdown Timer */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
              {[
                { value: timeLeft.hours, label: 'Jam' },
                { value: timeLeft.minutes, label: 'Menit' },
                { value: timeLeft.seconds, label: 'Detik' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 16,
                    background: 'var(--glass)', border: '2px solid var(--danger)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)',
                    color: 'var(--danger)', marginBottom: 4,
                  }}>
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          {products.length === 0 ? (
            <div className="empty-state animate-fade-up">
              <div className="icon" style={{ fontSize: 64 }}>😢</div>
              <h3>Tidak ada flash sale saat ini</h3>
              <p>Cek lagi nanti ya!</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(p => {
                const discount = Math.round((1 - p.sale_price / p.price) * 100);
                return (
                  <Link key={p.id} href={`/product/${p.slug}`}>
                    <div className="product-card">
                      <div className="badge-sale" style={{
                        background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                        fontSize: 14, fontWeight: 800, padding: '6px 14px',
                      }}>-{discount}%</div>
                      <div className="product-card-img">
                        <img src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'} alt={p.name} loading="lazy" />
                      </div>
                      <div className="product-card-body">
                        <div className="product-card-cat">{p.category_name}</div>
                        <div className="product-card-name">{p.name}</div>
                        <div className="product-card-price">
                          <span className="price" style={{ color: 'var(--danger)' }}>{formatIDR(p.sale_price)}</span>
                          <span className="price-old">{formatIDR(p.price)}</span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <div style={{ height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${Math.min(100, (1 - p.stock / 100) * 100)}%`,
                              borderRadius: 999, background: 'linear-gradient(90deg, var(--danger), var(--warning))',
                            }} />
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            🔥 {p.stock} tersisa
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div id="toast-container" className="toast-container" />
    </div>
  );
}
