'use client';

import { useEffect, useState } from 'react';

interface Order { id: number; order_code: string; customer_name: string; phone: string; address: string; notes: string; items_json: string; total: number; status: string; created_at: number; }

const STATUS_LABELS: Record<string, string> = { new: 'Baru', confirmed: 'Dikonfirmasi', shipped: 'Dikirim', done: 'Selesai', cancelled: 'Dibatalkan' };

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  const load = () => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    fetch(`/api/admin/orders?${params}`).then(r => r.json()).then(d => { if (d.ok) setOrders(d.orders); });
  };
  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: number, status: string) => {
    await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
    if (selected?.id === id) setSelected({ ...selected!, status });
  };

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h1>Pesanan</h1>
          <p>{orders.length} pesanan{filter ? ` (${STATUS_LABELS[filter]})` : ''}</p>
        </div>
        <select className="form-select" style={{ width: 200 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">🔍 Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 20, transition: 'all 0.3s' }}>
        <div className="admin-card animate-fade-up">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Kode</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Waktu</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} onClick={() => setSelected(o)} style={{
                    cursor: 'none',
                    background: selected?.id === o.id ? 'rgba(108,92,231,0.06)' : undefined,
                    borderLeft: selected?.id === o.id ? '3px solid var(--accent)' : '3px solid transparent',
                  }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--accent-2)' }}>#{o.order_code}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{o.customer_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.phone}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'var(--font-display)' }}>{formatIDR(o.total)}</td>
                    <td><span className={`status status-${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.created_at * 1000).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                  Belum ada pesanan
                </td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="order-detail-panel animate-fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Detail Pesanan</h2>
              <button onClick={() => setSelected(null)} style={{
                background: 'var(--glass)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xs)', cursor: 'none', fontSize: 14,
                padding: '6px 10px', color: 'var(--text-muted)', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >✕</button>
            </div>

            <div style={{
              fontFamily: 'monospace', fontWeight: 800, fontSize: 18, marginBottom: 16,
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>#{selected.order_code}</div>

            <div style={{ fontSize: 13, marginBottom: 20, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pelanggan</span>
                <span style={{ fontWeight: 600 }}>{selected.customer_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Telepon</span>
                <span style={{ fontWeight: 600 }}>{selected.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Alamat</span>
                <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{selected.address || '—'}</span>
              </div>
              {selected.notes && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Catatan</span>
                  <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{selected.notes}</span>
                </div>
              )}
            </div>

            <div style={{
              padding: 16, borderRadius: 'var(--radius-sm)',
              background: 'var(--glass)', border: '1px solid var(--border)',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</div>
              {JSON.parse(selected.items_json || '[]').map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: i < JSON.parse(selected.items_json || '[]').length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.qty}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatIDR(item.price * item.qty)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTop: '1px solid var(--border)', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-display)' }}>
                <span>Total</span>
                <span className="price">{formatIDR(selected.total)}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ubah Status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <button key={k} className={`btn btn-sm ${selected.status === k ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => updateStatus(selected.id, k)} style={{ fontSize: 12 }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
