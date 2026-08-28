'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartItem {
  product: { id: number; name: string; slug: string; price: number; sale_price: number; image_url: string };
  qty: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCart(parsed);
      if (parsed.length === 0) router.push('/');
    } else {
      router.push('/');
    }
  }, [router]);

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
  const total = cart.reduce((sum, i) => {
    const price = i.product.sale_price > 0 ? i.product.sale_price : i.product.price;
    return sum + price * i.qty;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      (window as any).showToast?.('Nama dan telepon wajib diisi', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          phone: form.phone,
          address: form.address,
          notes: form.notes,
          items: cart.map(i => ({ product_id: i.product.id, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.removeItem('cart');
        router.push(`/order/${data.order_code}`);
      } else {
        (window as any).showToast?.(data.reason || 'Gagal membuat pesanan', 'error');
      }
    } catch {
      (window as any).showToast?.('Terjadi kesalahan', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="ambient-bg" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ WebkitTextFillColor: 'var(--accent)' }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali
          </Link>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Checkout</div>
        </div>
      </header>

      <div className="container">
        <div style={{ padding: '32px 0 100px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 32 }} className="animate-fade-up">
            Checkout
          </h1>

          <form onSubmit={handleSubmit} className="checkout-grid">
            {/* Form */}
            <div className="checkout-form animate-fade-up animate-delay-1">
              <div className="checkout-section">
                <div className="checkout-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Info Pelanggan
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Budi Santoso" required />
                </div>
                <div className="form-group">
                  <label className="form-label">No. Telepon *</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08123456789" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Alamat Pengiriman</label>
                  <textarea className="form-textarea" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Jl. Merdeka No. 10, RT 01/RW 02, Jakarta Selatan" style={{ minHeight: 90 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>(opsional)</span></label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Warna, ukuran, atau catatan lainnya..." style={{ minHeight: 70 }} />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="checkout-summary animate-fade-up animate-delay-2">
              <div className="checkout-section">
                <div className="checkout-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  Ringkasan Pesanan
                </div>
                {cart.map(item => (
                  <div key={item.product.id} className="checkout-item">
                    <div className="checkout-item-img">
                      <img src={item.product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'} alt="" />
                      <span className="checkout-item-qty">{item.qty}</span>
                    </div>
                    <div className="checkout-item-info">
                      <div className="checkout-item-name">{item.product.name}</div>
                      <div className="checkout-item-price">
                        {formatIDR((item.product.sale_price > 0 ? item.product.sale_price : item.product.price) * item.qty)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="checkout-total">
                  <span>Total</span>
                  <span className="price" style={{ fontSize: 24 }}>{formatIDR(total)}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-wa" style={{ width: '100%', fontSize: 16, padding: '16px 32px' }} disabled={loading}>
                {loading ? '⏳ Memproses...' : '💬 Pesan via WhatsApp'}
              </button>

              <div className="checkout-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>Setelah menekan tombol, Anda akan diarahkan ke WhatsApp untuk konfirmasi pesanan.</span>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
    </div>
  );
}
