'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartItem { product: { id: number; name: string; slug: string; price: number; sale_price: number; image_url: string }; qty: number; }

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const items = JSON.parse(saved);
      if (items.length === 0) { router.push('/'); return; }
      setCart(items);
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
    if (!form.customer_name || !form.phone) return;
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name,
          phone: form.phone,
          address: form.address,
          notes: form.notes,
          items: cart.map(i => ({ product_id: i.product.id, qty: i.qty })),
        }),
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.removeItem('cart');
        // Open WhatsApp
        window.open(data.wa_link, '_blank');
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
    <div className="container">
      <div style={{ padding: '16px 0' }}>
        <Link href="/" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>← Kembali ke toko</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>Checkout</h1>

      <div className="checkout-grid">
        {/* Order Summary */}
        <div>
          <div className="admin-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Ringkasan Pesanan</h2>
            {cart.map(item => {
              const price = item.product.sale_price > 0 ? item.product.sale_price : item.product.price;
              return (
                <div key={item.product.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                    <img src={item.product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.product.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>x{item.qty}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{formatIDR(price * item.qty)}</div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, fontSize: 18, fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>{formatIDR(total)}</span>
            </div>
          </div>
        </div>

        {/* Customer Form */}
        <div>
          <div className="admin-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Data Diri</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input className="form-input" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">No. WhatsApp *</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="08123456789" />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat Pengiriman</label>
                <textarea className="form-textarea" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Jl. Contoh No. 123, Kota" />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Warna, ukuran, dll." />
              </div>

              <button type="submit" className="btn btn-wa" style={{ width: '100%', padding: 16, fontSize: 16 }} disabled={loading || cart.length === 0}>
                {loading ? 'Memproses...' : '💬 Pesan via WhatsApp'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                Pesanan akan dikirim ke WhatsApp penjual
              </p>
            </form>
          </div>
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
      <script src="/app.js" async />
    </div>
  );
}
