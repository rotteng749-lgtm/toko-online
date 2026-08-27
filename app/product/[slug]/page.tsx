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
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ product, qty });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    (window as any).showToast?.(`${product.name} ditambahkan ke keranjang`, 'success');
    setTimeout(() => router.push('/'), 800);
  };

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Memuat...</div>;
  if (!product) return <div style={{ textAlign: 'center', padding: 80 }}>Produk tidak ditemukan</div>;

  return (
    <div className="container">
      <div style={{ padding: '16px 0' }}>
        <Link href="/" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>← Kembali ke toko</Link>
      </div>

      <div className="product-detail">
        <div className="product-gallery">
          <img src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'} alt={product.name} />
        </div>

        <div className="product-info">
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 500 }}>
            {product.category_name}
          </div>
          <h1>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 16 }}>
            <span className="price" style={{ fontSize: 28 }}>{formatIDR(product.sale_price > 0 ? product.sale_price : product.price)}</span>
            {product.sale_price > 0 && <span className="price-old" style={{ fontSize: 16 }}>{formatIDR(product.price)}</span>}
          </div>

          <div style={{ marginTop: 8, fontSize: 14, color: product.stock > 0 ? 'var(--accent)' : 'var(--danger)' }}>
            {product.stock > 0 ? `✓ Stok tersedia (${product.stock})` : '✗ Stok habis'}
          </div>

          <div className="desc" style={{ marginTop: 24 }}>{product.description}</div>

          {product.stock > 0 && (
            <div style={{ marginTop: 32, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', borderRadius: 12, padding: '6px 4px' }}>
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 10 }}>-</button>
                <span style={{ fontSize: 16, fontWeight: 700, minWidth: 30, textAlign: 'center' }}>{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ width: 36, height: 36, borderRadius: 10 }}>+</button>
              </div>
              <button className="btn btn-primary" onClick={addToCart} style={{ flex: 1, padding: 14, fontSize: 15 }}>
                🛒 Tambah ke Keranjang
              </button>
            </div>
          )}
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
      <script src="/app.js" async />
    </div>
  );
}
