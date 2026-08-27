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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Pesanan</h1>
        <select className="form-select" style={{ width: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        <div className="admin-card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Kode</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Waktu</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: 'pointer', background: selected?.id === o.id ? 'var(--accent-light)' : undefined }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>{o.order_code}</td>
                    <td>{o.customer_name}<br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.phone}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatIDR(o.total)}</td>
                    <td><span className={`status status-${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.created_at * 1000).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Belum ada pesanan</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="admin-card" style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Detail Pesanan</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>#{selected.order_code}</div>
              <div><strong>Pelanggan:</strong> {selected.customer_name}</div>
              <div><strong>Telepon:</strong> {selected.phone}</div>
              <div><strong>Alamat:</strong> {selected.address || '—'}</div>
              <div><strong>Catatan:</strong> {selected.notes || '—'}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>ITEMS:</div>
              {JSON.parse(selected.items_json || '[]').map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span>{item.name} x{item.qty}</span>
                  <span style={{ fontWeight: 600 }}>{formatIDR(item.price * item.qty)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)', fontWeight: 700, fontSize: 15 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)' }}>{formatIDR(selected.total)}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>UBAH STATUS:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <button key={k} className={`btn btn-sm ${selected.status === k ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => updateStatus(selected.id, k)}>
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
