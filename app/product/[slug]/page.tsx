'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: number; name: string; slug: string; description: string;
  price: number; sale_price: number; stock: number; image_url: string;
  category_name: string; category_slug: string;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products?search=${params.slug}`).then(r => r.json()).then(d => {
      if (d.ok && d.products.length > 0) {
        setProduct(d.products.find((p: Product) => p.slug === params.slug) || d.products[0]);
      }
      setLoading(false);
    });
  }, [params.slug]);

  const addToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((i: any) => i.product.id === product.id);
    if (existing) existing.qty += qty;
    else cart.push({ product, qty });
    localStorage.setItem('cart', JSON.stringify(cart));
    (window as any).showToast?.(`${product.name} ditambahkan ke keranjang`, 'success');
    setTimeout(() => router.push('/'), 800);
  };

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 120, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      Memuat...
    </div>
  );
  if (!product) return (
    <div style={{ textAlign: 'center', padding: 120 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>Produk tidak ditemukan</div>
    </div>
  );

  return (
    <div className="page-enter">
      <div className="ambient-bg" />
      <div className="container">
        <div style={{ padding: '20px 0' }}>
          <Link href="/" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Kembali ke toko
          </Link>
        </div>

        <div className="product-detail">
          <div className="product-gallery animate-fade-up">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'}
              alt={product.name}
            />
          </div>

          <div className="product-info animate-fade-up animate-delay-1">
            <div style={{
              display: 'inline-block', fontSize: 11, fontWeight: 700,
              color: 'var(--accent-2)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 12,
              background: 'rgba(108,92,231,0.1)', padding: '5px 14px',
              borderRadius: 999,
            }}>
              {product.category_name}
            </div>
            <h1>{product.name}</h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 20 }}>
              <span className="price" style={{ fontSize: 32 }}>
                {formatIDR(product.sale_price > 0 ? product.sale_price : product.price)}
              </span>
              {product.sale_price > 0 && (
                <span className="price-old" style={{ fontSize: 16 }}>{formatIDR(product.price)}</span>
              )}
            </div>

            <div style={{
              marginTop: 12, fontSize: 14, fontWeight: 600,
              color: product.stock > 0 ? 'var(--wa-green)' : 'var(--danger)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {product.stock > 0 ? (
                <>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--wa-green)', display: 'inline-block',
                    boxShadow: '0 0 8px rgba(0,212,126,0.5)',
                  }} />
                  Stok tersedia ({product.stock})
                </>
              ) : (
                <>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--danger)', display: 'inline-block',
                  }} />
                  Stok habis
                </>
              )}
            </div>

            {product.description && (
              <div style={{
                marginTop: 28, padding: 20, borderRadius: 'var(--radius-sm)',
                background: 'var(--glass)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 15,
              }}>
                {product.description}
              </div>
            )}

            {product.stock > 0 && (
              <div style={{
                marginTop: 36, display: 'flex', gap: 16, alignItems: 'center',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--glass)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '8px 6px',
                  backdropFilter: 'blur(10px)',
                }}>
                  <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 40, borderRadius: 12 }}>-</button>
                  <span style={{ fontSize: 18, fontWeight: 800, minWidth: 32, textAlign: 'center', fontFamily: 'var(--font-display)' }}>{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ width: 40, height: 40, borderRadius: 12 }}>+</button>
                </div>
                <button className="btn btn-primary" onClick={addToCart} style={{ flex: 1, padding: 16, fontSize: 15 }}>
                  🛒 Tambah ke Keranjang
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
      <script src="/app.js" async />
    </div>
  );
}
