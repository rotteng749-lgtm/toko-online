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

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setCart(JSON.parse(saved));
    fetch('/api/products?limit=100').then(r => r.json()).then(d => { if (d.ok) setProducts(d.products); });
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.ok) setCategories(d.categories); });
  }, []);

  // Save cart to localStorage
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  // Fetch products with filters
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
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1 }];
    });
    (window as any).showToast?.(`${product.name} ditambahkan ke keranjang`, 'success');
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.product.id !== productId) return i;
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }).filter(i => i.qty > 0);
    });
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
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">{storeName}</Link>
          <div className="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </header>

      <div className="container">
        {/* Categories */}
        <div className="categories">
          <button className={`cat-pill${activeCat === '' ? ' active' : ''}`} onClick={() => setActiveCat('')}>
            Semua
          </button>
          {categories.map(c => (
            <button key={c.id} className={`cat-pill${activeCat === c.slug ? ' active' : ''}`} onClick={() => setActiveCat(c.slug)}>
              {c.name} ({c.product_count})
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>Belum ada produk</h3>
            <p>Produk akan segera tersedia</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <Link key={p.id} href={`/product/${p.slug}`}>
                <div className="product-card">
                  {p.sale_price > 0 && (
                    <div className="badge-sale">
                      -{Math.round((1 - p.sale_price / p.price) * 100)}%
                    </div>
                  )}
                  <div className="product-card-img">
                    <img src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'} alt={p.name} loading="lazy" />
                  </div>
                  <div className="product-card-body">
                    <div className="product-card-cat">{p.category_name}</div>
                    <div className="product-card-name">{p.name}</div>
                    <div className="product-card-price">
                      <span className="price">{formatIDR(p.sale_price > 0 ? p.sale_price : p.price)}</span>
                      {p.sale_price > 0 && <span className="price-old">{formatIDR(p.price)}</span>}
                    </div>
                    <div className="badge-stock">{p.stock > 0 ? `Stok: ${p.stock}` : 'Habis'}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button className="cart-fab" onClick={() => setCartOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span className="cart-count">{cartCount}</span>
        </button>
      )}

      {/* Cart Drawer */}
      <div className={`cart-overlay${cartOpen ? ' open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-drawer${cartOpen ? ' open' : ''}`}>
        <div className="cart-header">
          <h2>🛒 Keranjang ({cartCount})</h2>
          <button className="btn btn-icon btn-outline" onClick={() => setCartOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, fontSize: 18 }}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <p>Keranjang kosong</p>
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
                <span style={{ color: 'var(--accent)' }}>{formatIDR(cartTotal)}</span>
              </div>
              <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 15 }}
                onClick={() => {
                  localStorage.setItem('cart', JSON.stringify(cart));
                }}>
                Checkout →
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Toast container */}
      <div id="toast-container" className="toast-container" />
      <script src="/app.js" async />
    </div>
  );
}
