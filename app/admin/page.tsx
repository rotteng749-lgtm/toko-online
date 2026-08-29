'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products').then(r => r.json()),
      fetch('/api/admin/orders').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
      fetch('/api/admin/reviews').then(r => r.json()),
    ]).then(([products, orders, settings, reviews]) => {
      const allOrders = orders.orders || [];
      const totalRevenue = allOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
      const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
      const todayOrders = allOrders.filter((o: any) => o.created_at >= todayStart);
      const todayRevenue = todayOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
      
      // Status breakdown
      const statusCounts: Record<string, number> = { new: 0, confirmed: 0, shipped: 0, done: 0, cancelled: 0 };
      allOrders.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

      // Top products by revenue
      const productRevenue: Record<string, { name: string; revenue: number; count: number }> = {};
      allOrders.forEach((o: any) => {
        try {
          const items = JSON.parse(o.items_json || '[]');
          items.forEach((item: any) => {
            const key = item.name;
            if (!productRevenue[key]) productRevenue[key] = { name: key, revenue: 0, count: 0 };
            productRevenue[key].revenue += item.price * item.qty;
            productRevenue[key].count += item.qty;
          });
        } catch {}
      });
      const topProducts = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      // This month stats
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000;
      const monthOrders = allOrders.filter((o: any) => o.created_at >= monthStart);
      const monthRevenue = monthOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);

      setStats({
        products: products.products?.length || 0,
        orders: allOrders.length,
        todayOrders: todayOrders.length,
        todayRevenue,
        totalRevenue,
        monthOrders: monthOrders.length,
        monthRevenue,
        statusCounts,
        topProducts,
        recentOrders: allOrders.slice(0, 5),
        recentReviews: reviews.reviews?.slice(0, 5) || [],
        avgRating: reviews.reviews?.length ? (reviews.reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.reviews.length).toFixed(1) : '0',
        totalReviews: reviews.reviews?.length || 0,
        storeName: settings.settings?.store_name || 'Toko',
      });
    });
  }, []);

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  if (!stats) return (
    <div style={{ padding: 60, color: 'var(--text-muted)', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      Memuat dashboard...
    </div>
  );

  return (
    <div>
      <div className="section-header animate-fade-up">
        <h1>Dashboard</h1>
        <p>Selamat datang kembali, {stats.storeName} 👋</p>
      </div>

      {/* ===== MAIN STAT CARDS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="stat-card purple animate-fade-up" style={{ animationDelay: '0s' }}>
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats.products}</div>
          <div className="stat-label">Total Produk</div>
        </div>
        <div className="stat-card pink animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="stat-icon">🛒</div>
          <div className="stat-value">{stats.todayOrders}</div>
          <div className="stat-label">Pesanan Hari Ini</div>
        </div>
        <div className="stat-card gold animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon">💰</div>
          <div className="stat-value">{formatIDR(stats.todayRevenue)}</div>
          <div className="stat-label">Pendapatan Hari Ini</div>
        </div>
        <div className="stat-card teal animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="stat-icon">📈</div>
          <div className="stat-value">{formatIDR(stats.monthRevenue)}</div>
          <div className="stat-label">Pendapatan Bulan Ini</div>
        </div>
      </div>

      {/* ===== SECONDARY STATS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        <div className="admin-card animate-fade-up" style={{ padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{stats.orders}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Pesanan</div>
        </div>
        <div className="admin-card animate-fade-up" style={{ padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-2)' }}>{formatIDR(stats.totalRevenue)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Pendapatan</div>
        </div>
        <div className="admin-card animate-fade-up" style={{ padding: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--warning)' }}>⭐ {stats.avgRating}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stats.totalReviews} Ulasan</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* ===== ORDER STATUS BREAKDOWN ===== */}
        <div className="admin-card animate-fade-up animate-delay-1">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Status Pesanan</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { key: 'new', label: 'Baru', color: 'var(--accent)', emoji: '🆕' },
              { key: 'confirmed', label: 'Dikonfirmasi', color: 'var(--accent-2)', emoji: '✅' },
              { key: 'shipped', label: 'Dikirim', color: 'var(--accent-3)', emoji: '🚚' },
              { key: 'done', label: 'Selesai', color: 'var(--wa-green)', emoji: '🎉' },
              { key: 'cancelled', label: 'Dibatalkan', color: 'var(--danger)', emoji: '❌' },
            ].map(({ key, label, color, emoji }) => {
              const count = stats.statusCounts[key] || 0;
              const pct = stats.orders > 0 ? (count / stats.orders * 100) : 0;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{count}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'var(--bg)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: color, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== TOP PRODUCTS ===== */}
        <div className="admin-card animate-fade-up animate-delay-2">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏆 Top Produk</h2>
          {stats.topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
              Belum ada data penjualan
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {stats.topProducts.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? 'var(--warning)' : 'var(--text-muted)', fontFamily: 'var(--font-display)', width: 24 }}>
                      {i + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.count} terjual</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'var(--font-display)' }}>
                    {formatIDR(p.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ===== RECENT ORDERS ===== */}
        <div className="admin-card animate-fade-up animate-delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>📋 Pesanan Terbaru</h2>
            <Link href="/admin/orders" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Lihat Semua →</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada pesanan</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {stats.recentOrders.map((o: any) => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--accent-2)' }}>#{o.order_code}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.customer_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{formatIDR(o.total)}</div>
                    <span className={`status status-${o.status}`} style={{ fontSize: 10 }}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== RECENT REVIEWS ===== */}
        <div className="admin-card animate-fade-up animate-delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>⭐ Ulasan Terbaru</h2>
          </div>
          {stats.recentReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p style={{ fontSize: 13 }}>Belum ada ulasan</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {stats.recentReviews.map((r: any) => (
                <div key={r.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                        {r.customer_name[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{r.customer_name}</span>
                    </div>
                    <span style={{ color: 'var(--warning)', fontSize: 11 }}>{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{r.product_name}</div>
                  {r.comment && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.comment}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
