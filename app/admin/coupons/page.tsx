'use client';

import { useEffect, useState } from 'react';

interface Coupon { id: number; code: string; discount_type: string; discount_value: number; min_order: number; max_uses: number; used_count: number; active: number; expires_at: number; }

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percent', discount_value: '', min_order: '', max_uses: '', expires_at: '' });

  const load = () => {
    fetch('/api/admin/coupons').then(r => r.json()).then(d => { if (d.ok) setCoupons(d.coupons); });
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        discount_value: parseInt(form.discount_value) || 0,
        min_order: parseInt(form.min_order) || 0,
        max_uses: parseInt(form.max_uses) || 0,
        expires_at: form.expires_at ? Math.floor(new Date(form.expires_at).getTime() / 1000) : 0,
      }),
    });
    setShowModal(false);
    setForm({ code: '', discount_type: 'percent', discount_value: '', min_order: '', max_uses: '', expires_at: '' });
    (window as any).showToast?.('✅ Kupon dibuat', 'success');
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kupon ini?')) return;
    await fetch('/api/admin/coupons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    (window as any).showToast?.('🗑️ Kupon dihapus', 'success');
    load();
  };

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h1>🎟️ Kupon</h1>
          <p>{coupons.length} kupon aktif</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Buat Kupon</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 28 }}>
            <h3 className="modal-title" style={{ marginBottom: 20 }}>🎟️ Buat Kupon Baru</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Kode Kupon *</label>
                <input className="form-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DISKON20" required style={{ fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Tipe Diskon</label>
                  <select className="form-select" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                    <option value="percent">Persen (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nilai Diskon *</label>
                  <input className="form-input" type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'percent' ? '20' : '50000'} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Min. Order (Rp)</label>
                  <input className="form-input" type="number" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Max. Penggunaan</label>
                  <input className="form-input" type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="0 = unlimited" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Kadaluarsa</label>
                <input className="form-input" type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">✨ Buat Kupon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-card animate-fade-up">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>Diskon</th><th>Min. Order</th><th>Digunakan</th><th>Kadaluarsa</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--accent-2)', letterSpacing: 1 }}>{c.code}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {c.discount_type === 'percent' ? `${c.discount_value}%` : formatIDR(c.discount_value)}
                  </td>
                  <td>{c.min_order > 0 ? formatIDR(c.min_order) : '—'}</td>
                  <td>{c.used_count}{c.max_uses > 0 ? `/${c.max_uses}` : ''}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {c.expires_at > 0 ? new Date(c.expires_at * 1000).toLocaleDateString('id-ID') : '∞'}
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: c.active ? 'rgba(0,212,126,0.1)' : 'rgba(255,107,107,0.1)',
                      color: c.active ? 'var(--wa-green)' : 'var(--danger)',
                    }}>{c.active ? '✅ Aktif' : '❌ Nonaktif'}</span>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)} style={{ padding: '6px 10px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎟️</div>
                Belum ada kupon
              </td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div id="toast-container" className="toast-container" />
    </div>
  );
}
