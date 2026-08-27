'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Product {
  id: number; name: string; slug: string; price: number; sale_price: number;
  stock: number; image_url: string; category_name: string; category_slug: string;
}
interface Category { id: number; name: string; slug: string; product_count: number; }
interface CartItem { product: Product; qty: number; }

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [storeName, setStoreName] = useState('Toko Online');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
    fetch('/api/products?limit=100').then(r => r.json()).then(d => { if (d.ok) setProducts(d.products); });
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.ok) setCategories(d.categories); });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (activeCat) params.set('category', activeCat);
    if (search) params.set('search', search);
    const res = await fetch(`/api/products?${params}`);
    const d = await res.json();
    if (d.ok) setProducts(d.products);
  }, [activeCat, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
    (window as any).showToast?.(`${product.name} ditambahkan ke keranjang`, 'success');
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const newQty = i.qty + delta;
      return newQty > 0 ? { ...i, qty: newQty } : i;
    }).filter(i => i.qty > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, i) => {
    const price = i.product.sale_price > 0 ? i.product.sale_price : i.product.price;
    return sum + price * i.qty;
  }, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  return (
    <div>
      {/* Header */}
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="header-inner">
          <Link href="/" className="logo">{storeName}</Link>
          <div className="header-actions">
            <div className="search-bar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Link href="/track" className="btn btn-outline btn-sm header-link" title="Lacak Pesanan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className="header-link-text">Lacak</span>
            </Link>
            <Link href="/admin" className="btn btn-outline btn-sm header-link" title="Admin Panel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span className="header-link-text">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Hero */}
        <div className="hero">
          <div className="hero-badge animate-fade-up">✨ Belanja Online Terpercaya</div>
          <h1 className="animate-fade-up animate-delay-1">
            Belanja <span className="gradient-text">Mudah</span>,<br />
            Kirim <span className="gradient-text-2">via WhatsApp</span>
          </h1>
          <p className="animate-fade-up animate-delay-2">
            Temukan produk terbaikmu dan pesan langsung lewat WhatsApp. Cepat, praktis, tanpa ribet.
          </p>
          <div className="hero-actions animate-fade-up animate-delay-3">
            <a href="#products" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Mulai Belanja
            </a>
            <Link href="/track" className="btn btn-outline">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Lacak Pesanan
            </Link>
          </div>
          <div className="hero-stats animate-fade-up animate-delay-4">
            <div className="hero-stat">
              <div className="hero-stat-value">{products.length}</div>
              <div className="hero-stat-label">Produk</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-value">{categories.length}</div>
              <div className="hero-stat-label">Kategori</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-value">⚡</div>
              <div className="hero-stat-label">Fast Order</div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div id="products" className="section-bar animate-fade-up">
          <h2 className="section-bar-title">Produk Kami</h2>
        </div>
        <div className="categories animate-fade-up animate-delay-1">
          <button className={`cat-pill${activeCat === '' ? ' active' : ''}`} onClick={() => setActiveCat('')}>
            <span>✨ Semua</span>
          </button>
          {categories.map(c => (
            <button key={c.id} className={`cat-pill${activeCat === c.slug ? ' active' : ''}`} onClick={() => setActiveCat(c.slug)}>
              <span>{c.name} ({c.product_count})</span>
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="empty-state animate-fade-up">
            <div className="icon">📦</div>
            <h3>Belum ada produk</h3>
            <p>Produk akan segera tersedia</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p, idx) => (
              <Link key={p.id} href={`/product/${p.slug}`}>
                <div className="product-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                  {p.sale_price > 0 && (
                    <div className="badge-sale">
                      -{Math.round((1 - p.sale_price / p.price) * 100)}%
                    </div>
                  )}
                  <div className="product-card-img">
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'}
                      alt={p.name}
                      loading="lazy"
                    />
                    <div className="product-card-overlay">
                      <span className="product-card-view">Lihat Produk →</span>
                    </div>
                  </div>
                  <div className="product-card-body">
                    <div className="product-card-cat">{p.category_name}</div>
                    <div className="product-card-name">{p.name}</div>
                    <div className="product-card-price">
                      <span className="price">{formatIDR(p.sale_price > 0 ? p.sale_price : p.price)}</span>
                      {p.sale_price > 0 && <span className="price-old">{formatIDR(p.price)}</span>}
                    </div>
                    <div className={`badge-stock${p.stock > 0 ? ' in-stock' : ''}`}>
                      {p.stock > 0 ? `✓ Stok: ${p.stock}` : '✗ Habis'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo" style={{ fontSize: 18 }}>{storeName}</div>
            <p>Belanja mudah, kirim via WhatsApp.</p>
          </div>
          <div className="footer-links">
            <Link href="/">🏠 Beranda</Link>
            <Link href="/track">📍 Lacak Pesanan</Link>
            <Link href="/admin">⚡ Admin</Link>
          </div>
          <div className="footer-bottom">
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button className="cart-fab" onClick={() => setCartOpen(true)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span className="cart-count">{cartCount}</span>
        </button>
      )}

      {/* Cart Drawer */}
      <div className={`cart-overlay${cartOpen ? ' open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-drawer${cartOpen ? ' open' : ''}`}>
        <div className="cart-header">
          <h2>🛒 Keranjang ({cartCount})</h2>
          <button className="btn btn-icon btn-outline" onClick={() => setCartOpen(false)} style={{ width: 38, height: 38, borderRadius: 12, fontSize: 18 }}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Keranjang kosong</p>
            <p style={{ fontSize: 13 }}>Yuk mulai belanja!</p>
          </div>
        ) : (
          <>
            <div className="cart-body">
              {cart.map(item => (
                <div key={item.product.id} className="cart-item">
                  <div className="cart-item-img">
                    <img src={item.product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'} alt={item.product.name} />
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.product.name}</div>
                    <div className="cart-item-price">{formatIDR(item.product.sale_price > 0 ? item.product.sale_price : item.product.price)}</div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => updateQty(item.product.id, -1)}>−</button>
                      <span className="qty-value">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.product.id, 1)}>+</button>
                      <button className="cart-item-remove" onClick={() => removeFromCart(item.product.id)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span className="price">{formatIDR(cartTotal)}</span>
              </div>
              <Link href="/checkout" className="btn btn-wa" style={{ width: '100%', fontSize: 15 }}
                onClick={() => localStorage.setItem('cart', JSON.stringify(cart))}>
                💬 Checkout via WhatsApp
              </Link>
            </div>
          </>
        )}
      </div>

      <div id="toast-container" className="toast-container" />
      <script src="/app.js" async />
    </div>
  );
}
