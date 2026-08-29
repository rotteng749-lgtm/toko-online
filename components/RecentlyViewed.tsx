'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price: number;
  image_url: string;
}

const STORAGE_KEY = 'recently_viewed';
const MAX_ITEMS = 6;

export function trackView(product: Product) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: Product[] = raw ? JSON.parse(raw) : [];
    // Remove duplicate
    const filtered = items.filter(i => i.id !== product.id);
    // Add to front
    filtered.unshift({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: product.sale_price,
      image_url: product.image_url,
    });
    // Keep max
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {}
}

export default function RecentlyViewed() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  if (items.length === 0) return null;

  return (
    <section style={{ marginTop: 48 }}>
      <h2 style={{
        fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #fff)',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        🕐 Baru Dilihat
      </h2>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
      }}>
        {items.map(item => (
          <Link
            key={item.id}
            href={`/product/${item.slug}`}
            style={{
              background: 'var(--card-bg, rgba(255,255,255,0.05))',
              borderRadius: 12, overflow: 'hidden', textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '100%', aspectRatio: '1', objectFit: 'cover',
              background: 'rgba(255,255,255,0.05)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '10px 12px' }}>
              <p style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)',
                margin: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {item.name}
              </p>
              <p style={{
                fontSize: 14, fontWeight: 700, color: 'var(--accent, #a855f7)',
                margin: '4px 0 0',
              }}>
                {item.sale_price > 0
                  ? `Rp ${item.sale_price.toLocaleString('id-ID')}`
                  : `Rp ${item.price.toLocaleString('id-ID')}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
