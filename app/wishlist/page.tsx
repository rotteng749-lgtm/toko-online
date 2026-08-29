'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product { id: number; name: string; slug: string; price: number; sale_price: number; stock: number; image_url: string; category_name: string; }

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      const ids: number[] = JSON.parse(saved);
      fetch('/api/products?limit=100').then(r => r.json()).then(d => {
        if (d.ok) {
          setAllProducts(d.products);
          setWishlist(d.products.filter((p: Product) => ids.includes(p.id)));
        }
      });
    }
  }, []);

  const removeWishlist = (id: number) => {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      const ids: number[] = JSON.parse(saved).filter((i: number) => i !== id);
      localStorage.setItem('wishlist', JSON.stringify(ids));
      setWishlist(prev => prev.filter(p => p.id !== id));
      (window as any).showToast?.('Dihapus dari wishlist', 'success');
    }
  };

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
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>❤️ Wishlist</div>
        </div>
      </header>

      <div className="container">
        <div style={{ padding: '32px 0 100px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 8 }} className="animate-fade-up">
            ❤️ Wishlist Saya
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }} className="animate-fade-up animate-delay-1">
            {wishlist.length > 0 ? `${wishlist.length} produk tersimpan` : 'Belum ada produk favorit~'}
          </p>

          {wishlist.length === 0 ? (
            <div className="empty-state animate-fade-up">
              <div className="icon" style={{ fontSize: 64 }}>💝</div>
              <h3 style={{ fontFamily: 'var(--font-kawaii)', marginBottom: 8 }}>Wishlist kosong~</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Klik ❤️ pada produk untuk menyimpannya!</p>
              <Link href="/#products" className="btn btn-primary">🛍️ Jelajahi Produk</Link>
            </div>
          ) : (
            <div className="product-grid">
              {wishlist.map(p => (
                <Link key={p.id} href={`/product/${p.slug}`}>
                  <div className="product-card">
                    {p.sale_price > 0 && (
                      <div className="badge-sale">-{Math.round((1 - p.sale_price / p.price) * 100)}%</div>
                    )}
                    <div className="product-card-img">
                      <img src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'} alt={p.name} loading="lazy" />
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeWishlist(p.id); }}
                        style={{
                          position: 'absolute', top: 12, right: 12,
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'rgba(255,107,107,0.9)', border: 'none',
                          color: '#fff', fontSize: 16, cursor: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                        }}
                        title="Hapus dari wishlist"
                      >❤️</button>
                    </div>
                    <div className="product-card-body">
                      <div className="product-card-cat">{p.category_name}</div>
                      <div className="product-card-name">{p.name}</div>
                      <div className="product-card-price">
                        <span className="price">{formatIDR(p.sale_price > 0 ? p.sale_price : p.price)}</span>
                        {p.sale_price > 0 && <span className="price-old">{formatIDR(p.price)}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <div id="toast-container" className="toast-container" />
    </div>
  );
}
