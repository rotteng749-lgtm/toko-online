'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products').then(r => r.json()),
      fetch('/api/admin/orders').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
    ]).then(([products, orders, settings]) => {
      const totalRevenue = orders.orders?.reduce((s: number, o: any) => s + (o.total || 0), 0) || 0;
      const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
      const todayOrders = orders.orders?.filter((o: any) => o.created_at >= todayStart) || [];
      const todayRevenue = todayOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
      setStats({
        products: products.products?.length || 0,
        orders: orders.total || 0,
        todayOrders: todayOrders.length,
        todayRevenue,
        totalRevenue,
        recentOrders: orders.orders?.slice(0, 5) || [],
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

  const cards = [
    { label: 'Total Produk', value: stats.products, icon: '📦', colorClass: 'purple', gradient: 'var(--accent-gradient)' },
    { label: 'Pesanan Hari Ini', value: stats.todayOrders, icon: '🛒', colorClass: 'pink', gradient: 'var(--accent-gradient-2)' },
    { label: 'Pendapatan Hari Ini', value: formatIDR(stats.todayRevenue), icon: '💰', colorClass: 'gold', gradient: 'var(--accent-gradient-4)' },
    { label: 'Total Pesanan', value: stats.orders, icon: '📋', colorClass: 'teal', gradient: 'var(--accent-gradient-3)' },
  ];

  return (
    <div>
      <div className="section-header animate-fade-up">
        <h1>Dashboard</h1>
        <p>Selamat datang kembali, {stats.storeName} 👋</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 32 }}>
        {cards.map((c, i) => (
          <div key={i} className={`stat-card ${c.colorClass} animate-fade-up`} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-card animate-fade-up animate-delay-2">
        <h2>📋 Pesanan Terbaru</h2>
        {stats.recentOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="icon">📭</div>
            <h3>Belum ada pesanan</h3>
            <p>Pesanan baru akan muncul di sini</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Kode</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Waktu</th></tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o: any) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--accent-2)' }}>#{o.order_code}</td>
                    <td style={{ fontWeight: 500 }}>{o.customer_name}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'var(--font-display)' }}>{formatIDR(o.total)}</td>
                    <td><span className={`status status-${o.status}`}>{o.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.created_at * 1000).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
