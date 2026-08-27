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

  if (!stats) return <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Memuat...</div>;

  const cards = [
    { label: 'Total Produk', value: stats.products, icon: '📦', color: '#3b82f6' },
    { label: 'Pesanan Hari Ini', value: stats.todayOrders, icon: '🛒', color: '#16a34a' },
    { label: 'Pendapatan Hari Ini', value: formatIDR(stats.todayRevenue), icon: '💰', color: '#f59e0b' },
    { label: 'Total Pesanan', value: stats.orders, icon: '📋', color: '#8b5cf6' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {cards.map((c, i) => (
          <div key={i} className="admin-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.color }} />
            <div style={{ fontSize: 28, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{c.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h2>Pesanan Terbaru</h2>
        {stats.recentOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>Belum ada pesanan</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Kode</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Waktu</th></tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o: any) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.order_code}</td>
                    <td>{o.customer_name}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatIDR(o.total)}</td>
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
