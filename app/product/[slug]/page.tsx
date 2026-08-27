'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product { id: number; name: string; slug: string; price: number; sale_price: number; stock: number; image_url: string; description: string; category_name: string; }
interface CartItem { product: Product; qty: number; }

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
    fetch(`/api/products?limit=100`).then(r => r.json()).then(d => {
      if (d.ok) {
        const p = d.products.find((p: Product) => p.slug === params.slug);
        if (p) setProduct(p);
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

      {/* Minimal header */}
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
          {/* Gallery */}
          <div className="product-gallery animate-fade-up">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'}
              alt={product.name}
            />
            {discount > 0 && (
              <div className="badge-sale" style={{ top: 20, left: 20 }}>-{discount}%</div>
            )}
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
              {product.stock > 0 ? (
                <>✓ Stok tersedia: {product.stock} item</>
              ) : (
                <>✗ Stok habis</>
              )}
            </div>

            {product.description && (
              <div className="desc">{product.description}</div>
            )}

            {/* Qty selector */}
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
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
      <script src="/app.js" async />
    </div>
  );
}
