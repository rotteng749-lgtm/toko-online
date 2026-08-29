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
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentProof, setPaymentProof] = useState('');
  const [proofUploading, setProofUploading] = useState(false);

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
  const subtotal = cart.reduce((sum, i) => {
    const price = i.product.sale_price > 0 ? i.product.sale_price : i.product.price;
    return sum + price * i.qty;
  }, 0);
  const total = Math.max(0, subtotal - couponDiscount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, order_total: subtotal }),
      });
      const data = await res.json();
      if (data.ok) {
        setCouponDiscount(data.coupon.discount);
        setCouponApplied(data.coupon.code);
        (window as any).showToast?.(`Kupon ${data.coupon.code} berhasil! Diskon ${data.coupon.discount_type === 'percent' ? data.coupon.discount_value + '%' : formatIDR(data.coupon.discount_value)}`, 'success');
      } else {
        (window as any).showToast?.(data.reason || 'Kupon tidak valid', 'error');
        setCouponDiscount(0);
        setCouponApplied('');
      }
    } catch {
      (window as any).showToast?.('Gagal validasi kupon', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const uploadProof = async (file: File) => {
    if (!file.type.startsWith('image/')) { (window as any).showToast?.('File harus gambar', 'error'); return; }
    setProofUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) { setPaymentProof(data.url); (window as any).showToast?.('✅ Bukti pembayaran diunggah', 'success'); }
      else (window as any).showToast?.('Gagal upload', 'error');
    } catch { (window as any).showToast?.('Gagal upload', 'error'); }
    finally { setProofUploading(false); }
  };

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
          coupon_code: couponApplied || '',
          discount_amount: couponDiscount,
          payment_proof_url: paymentProof || '',
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
                {/* Coupon */}
                <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                  <label className="form-label" style={{ marginBottom: 6, fontSize: 12 }}>🎟️ Kode Kupon</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="DISKON20" style={{ flex: 1, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, fontSize: 13 }} disabled={!!couponApplied} />
                    {couponApplied ? (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setCouponCode(''); setCouponDiscount(0); setCouponApplied(''); }} style={{ whiteSpace: 'nowrap', fontSize: 12 }}>✕ Batal</button>
                    ) : (
                      <button type="button" className="btn btn-primary btn-sm" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                        {couponLoading ? '⏳' : 'Gunakan'}</button>
                    )}
                  </div>
                  {couponApplied && (
                    <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(0,212,126,0.1)', border: '1px solid rgba(0,212,126,0.2)', fontSize: 12, color: 'var(--wa-green)', fontWeight: 600 }}>
                      ✅ Kupon {couponApplied} — Diskon {formatIDR(couponDiscount)}
                    </div>
                  )}
                </div>

                {/* Payment Proof Upload */}
                <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                  <label className="form-label" style={{ marginBottom: 6, fontSize: 12 }}>🧾 Bukti Pembayaran <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsional)</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 16px', borderRadius: 8, cursor: 'none',
                      background: paymentProof ? 'rgba(0,212,126,0.1)' : 'var(--bg)',
                      border: `1px dashed ${paymentProof ? 'var(--wa-green)' : 'var(--border)'}`,
                      fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                    }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadProof(f); }} />
                      {proofUploading ? '⏳ Uploading...' : paymentProof ? '✅ Bukti terunggah' : '📷 Upload Bukti Transfer'}
                    </label>
                  </div>
                </div>

                {/* Price Summary */}
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--wa-green)' }}>
                    <span>🎟️ Diskon Kupon</span>
                    <span style={{ fontWeight: 600 }}>-{formatIDR(couponDiscount)}</span>
                  </div>
                )}

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
