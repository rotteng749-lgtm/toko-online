'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product { id: number; name: string; slug: string; price: number; sale_price: number; stock: number; image_url: string; }
interface CartItem { product: Product; qty: number; }

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== id) return i;
      const newQty = i.qty + delta;
      if (newQty <= 0) return { ...i, qty: 0 };
      if (newQty > i.product.stock) {
        (window as any).showToast?.(`Stok hanya ${i.product.stock}`, 'error');
        return i;
      }
      return { ...i, qty: newQty };
    }).filter(i => i.qty > 0));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(i => i.product.id !== id));
    (window as any).showToast?.('Produk dihapus dari keranjang', 'success');
  };

  const clearCart = () => {
    if (!confirm('Hapus semua item dari keranjang?')) return;
    setCart([]);
  };

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
  const subtotal = cart.reduce((sum, i) => {
    const price = i.product.sale_price > 0 ? i.product.sale_price : i.product.price;
    return sum + price * i.qty;
  }, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="page-enter">
      <div className="ambient-bg" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali
          </Link>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>🛒 Keranjang Belanja</div>
        </div>
      </header>

      <div className="container">
        <div style={{ padding: '32px 0 100px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }} className="animate-fade-up">
            🛒 Keranjang Belanja
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }} className="animate-fade-up animate-delay-1">
            {totalItems > 0 ? `${totalItems} item di keranjangmu` : 'Keranjangmu kosong~'}
          </p>

          {cart.length === 0 ? (
            <div className="empty-state animate-fade-up">
              <div className="icon" style={{ fontSize: 64 }}>🛒</div>
              <h3 style={{ fontFamily: 'var(--font-kawaii)', marginBottom: 8 }}>Keranjang kosong~</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Yuk mulai belanja!</p>
              <Link href="/#products" className="btn btn-primary">🛍️ Mulai Belanja</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }} className="cart-page-grid">
              {/* Cart Items */}
              <div className="animate-fade-up animate-delay-1">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Item ({totalItems})</h2>
                  <button onClick={clearCart} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    🗑️ Hapus Semua
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {cart.map(item => {
                    const price = item.product.sale_price > 0 ? item.product.sale_price : item.product.price;
                    const originalPrice = item.product.price;
                    const hasDiscount = item.product.sale_price > 0;
                    return (
                      <div key={item.product.id} className="cart-page-item" style={{
                        display: 'flex', gap: 16, padding: 18, borderRadius: 'var(--radius-md)',
                        background: 'var(--glass)', border: '1px solid var(--border)',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{
                          width: 90, height: 90, borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden', flexShrink: 0,
                          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        }}>
                          <img src={item.product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=150&fit=crop'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <Link href={`/product/${item.product.slug}`} style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                              {item.product.name}
                            </Link>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                              <span style={{ fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'var(--font-display)', fontSize: 16 }}>
                                {formatIDR(price)}
                              </span>
                              {hasDiscount && (
                                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: 12 }}>
                                  {formatIDR(originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', padding: 2 }}>
                              <button className="qty-btn" onClick={() => updateQty(item.product.id, -1)} style={{ width: 32, height: 32, borderRadius: 8 }}>−</button>
                              <span style={{ width: 36, textAlign: 'center', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)' }}>{item.qty}</span>
                              <button className="qty-btn" onClick={() => updateQty(item.product.id, 1)} style={{ width: 32, height: 32, borderRadius: 8 }}>+</button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
                                {formatIDR(price * item.qty)}
                              </span>
                              <button onClick={() => removeItem(item.product.id)} style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'none',
                                padding: 6, borderRadius: 8, transition: 'all 0.2s',
                              }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="animate-fade-up animate-delay-2" style={{ position: 'sticky', top: 100 }}>
                <div style={{
                  background: 'var(--glass)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: 24,
                }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📋 Ringkasan
                  </h3>

                  <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                    {cart.map(item => {
                      const price = item.product.sale_price > 0 ? item.product.sale_price : item.product.price;
                      return (
                        <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: 'var(--text-secondary)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.product.name} × {item.qty}
                          </span>
                          <span style={{ fontWeight: 600 }}>{formatIDR(price * item.qty)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Subtotal ({totalItems} item)</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{formatIDR(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Pengiriman</span>
                      <span style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600 }}>Dihitung via WA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '2px solid var(--border)' }}>
                      <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Total</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{formatIDR(subtotal)}</span>
                    </div>
                  </div>

                  <button onClick={() => router.push('/checkout')} className="btn btn-wa" style={{ width: '100%', fontSize: 16, padding: '16px 32px' }}>
                    💬 Checkout via WhatsApp
                  </button>

                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round" style={{ verticalAlign: -2, marginRight: 4 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    Anda akan diarahkan ke WhatsApp untuk konfirmasi pesanan
                  </div>
                </div>

                <Link href="/#products" style={{
                  display: 'block', textAlign: 'center', marginTop: 12, padding: 12,
                  fontSize: 14, color: 'var(--accent)', textDecoration: 'none',
                  background: 'var(--glass)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', transition: 'all 0.2s',
                }}>
                  ← Lanjut Belanja
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
    </div>
  );
}
