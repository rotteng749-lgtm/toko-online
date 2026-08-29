'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductQA from '@/components/ProductQA';
import { trackView } from '@/components/RecentlyViewed';

interface Product { id: number; name: string; slug: string; price: number; sale_price: number; stock: number; image_url: string; description: string; category_name: string; }
interface CartItem { product: Product; qty: number; }

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [galleryHover, setGalleryHover] = useState({ x: 50, y: 50 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ customer_name: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
    fetch(`/api/products?limit=100`).then(r => r.json()).then(d => {
      if (d.ok) {
        const p = d.products.find((p: Product) => p.slug === params.slug);
        if (p) {
          setProduct(p);
          setProductId(p.id);
          trackView(p);
          // Fetch reviews
          fetch(`/api/reviews?product_id=${p.id}`).then(r => r.json()).then(rd => {
            if (rd.ok) {
              setReviews(rd.reviews);
              setAvgRating(rd.avg_rating);
              setTotalReviews(rd.total_reviews);
            }
          });
        }
      }
    });
  }, [params.slug]);

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  const addToCart = () => {
    if (!product) return;
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product, qty }];
    });
    (window as any).showToast?.(`${product.name} × ${qty} ditambahkan ke keranjang`, 'success');
  };

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
  const discount = product?.sale_price && product?.price ? Math.round((1 - product.sale_price / product.price) * 100) : 0;

  const handleGalleryMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGalleryHover({ x, y });
  };

  if (!product) return (
    <div className="page-enter">
      <div className="ambient-bg" />
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ color: 'var(--text-muted)' }}>Memuat produk...</div>
      </div>
    </div>
  );

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
          <Link href="/track" className="btn btn-outline btn-sm">
            📍 Lacak Pesanan
          </Link>
        </div>
      </header>

      <div className="container">
        <div className="product-detail">
          {/* 3D Gallery */}
          <div
            className="product-gallery animate-fade-up"
            onMouseMove={handleGalleryMouseMove}
            onMouseLeave={() => setGalleryHover({ x: 50, y: 50 })}
            style={{
              '--glare-x': galleryHover.x + '%',
              '--glare-y': galleryHover.y + '%',
            } as React.CSSProperties}
          >
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'}
              alt={product.name}
            />
            {discount > 0 && (
              <div className="badge-sale" style={{ top: 20, left: 20 }}>-{discount}%</div>
            )}
            {/* Glare overlay */}
            <div className="gallery-glare" style={{
              background: `radial-gradient(circle at ${galleryHover.x}% ${galleryHover.y}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
            }} />
          </div>

          {/* Info */}
          <div className="product-info animate-fade-up animate-delay-1">
            <div className="product-card-cat" style={{ marginBottom: 12 }}>{product.category_name}</div>
            <h1>{product.name}</h1>

            <div className="product-price-block">
              <span className="price" style={{ fontSize: 32 }}>
                {formatIDR(product.sale_price > 0 ? product.sale_price : product.price)}
              </span>
              {product.sale_price > 0 && (
                <span className="price-old" style={{ fontSize: 18 }}>{formatIDR(product.price)}</span>
              )}
              {discount > 0 && (
                <span className="discount-pill">-{discount}%</span>
              )}
            </div>

            <div className={`product-stock-badge ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
              {product.stock > 0 ? `✓ Stok tersedia: ${product.stock} item` : '✗ Stok habis'}
            </div>

            {product.description && (
              <div className="desc">{product.description}</div>
            )}

            {/* Qty */}
            <div className="qty-selector">
              <label>Jumlah</label>
              <div className="qty-controls">
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>−</button>
                <span className="qty-display">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={qty >= product.stock}>+</button>
              </div>
            </div>

            {/* Total */}
            <div className="product-total">
              <span>Subtotal</span>
              <span className="price" style={{ fontSize: 24 }}>
                {formatIDR((product.sale_price > 0 ? product.sale_price : product.price) * qty)}
              </span>
            </div>

            {/* Actions */}
            <div className="product-actions">
              <button className="btn btn-primary product-add-btn" onClick={addToCart} disabled={product.stock <= 0}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                {product.stock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="trust-badges">
              <div className="trust-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--wa-green)" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Bayar via WhatsApp</span>
              </div>
              <div className="trust-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>Pengiriman cepat</span>
              </div>
              <div className="trust-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Produk berkualitas</span>
              </div>
            </div>
          </div>
        </div>          {/* ===== Q&A SECTION ===== */}
          {productId && (
            <div className="animate-fade-up" style={{ marginTop: 48 }}>
              <ProductQA productId={productId} />
            </div>
          )}

          {/* ===== REVIEWS SECTION ===== */}
        <div className="reviews-section animate-fade-up" style={{ marginTop: 48, marginBottom: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: 0 }}>⭐ Ulasan</h2>
              {totalReviews > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(254,202,87,0.1)', border: '1px solid rgba(254,202,87,0.2)' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-display)' }}>{avgRating.toFixed(1)}</span>
                  <span style={{ color: 'var(--warning)', fontSize: 16 }}>{'⭐'.repeat(Math.round(avgRating))}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({totalReviews})</span>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowReviewForm(!showReviewForm)}>
              {showReviewForm ? '✕ Tutup' : '✏️ Tulis Ulasan'}
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div style={{
              background: 'var(--glass)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: 24, marginBottom: 24,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>✍️ Tulis Ulasan Anda</h3>
              <div className="form-group">
                <label className="form-label">Nama</label>
                <input className="form-input" value={reviewForm.customer_name}
                  onChange={e => setReviewForm({ ...reviewForm, customer_name: e.target.value })}
                  placeholder="Nama Anda" />
              </div>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })} style={{
                      background: 'none', border: 'none', cursor: 'none', fontSize: 28, padding: 2,
                      color: star <= reviewForm.rating ? 'var(--warning)' : 'var(--border)',
                      transition: 'all 0.15s', transform: star <= reviewForm.rating ? 'scale(1.1)' : 'scale(1)',
                    }}>⭐</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Komentar</label>
                <textarea className="form-textarea" value={reviewForm.comment}
                  onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Ceritakan pengalaman Anda dengan produk ini..." style={{ minHeight: 80 }} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={async () => {
                if (!reviewForm.customer_name.trim()) {
                  (window as any).showToast?.('Nama wajib diisi', 'error');
                  return;
                }
                setReviewSubmitting(true);
                try {
                  const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: productId, ...reviewForm }),
                  });
                  const data = await res.json();
                  if (data.ok) {
                    (window as any).showToast?.('Ulasan berhasil ditambahkan! ✨', 'success');
                    setShowReviewForm(false);
                    setReviewForm({ customer_name: '', rating: 5, comment: '' });
                    // Reload reviews
                    fetch(`/api/reviews?product_id=${productId}`).then(r => r.json()).then(rd => {
                      if (rd.ok) { setReviews(rd.reviews); setAvgRating(rd.avg_rating); setTotalReviews(rd.total_reviews); }
                    });
                  } else {
                    (window as any).showToast?.(data.reason || 'Gagal', 'error');
                  }
                } catch {
                  (window as any).showToast?.('Terjadi kesalahan', 'error');
                } finally {
                  setReviewSubmitting(false);
                }
              }} disabled={reviewSubmitting}>
                {reviewSubmitting ? '⏳ Mengirim...' : '✨ Kirim Ulasan'}
              </button>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Belum ada ulasan</p>
              <p style={{ fontSize: 13 }}>Jadilah yang pertama memberikan ulasan!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {reviews.map((review: any) => (
                <div key={review.id} style={{
                  padding: 18, borderRadius: 'var(--radius-md)',
                  background: 'var(--glass)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--accent-gradient)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: '#fff',
                      }}>{review.customer_name[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{review.customer_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(review.created_at * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ color: 'var(--warning)', fontSize: 14 }}>
                      {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  {review.comment && (
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
    </div>
  );
}
