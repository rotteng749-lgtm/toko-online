'use client';

import { useEffect, useState } from 'react';

interface Category { id: number; name: string; slug: string; sort_order: number; active: number; }

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const load = () => { fetch('/api/admin/categories').then(r => r.json()).then(d => { if (d.ok) setCategories(d.categories); }); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? 'PATCH' : 'POST';
    const body = editId ? { id: editId, name, sort_order: parseInt(sortOrder) || 0 } : { name, sort_order: parseInt(sortOrder) || 0 };
    await fetch('/api/admin/categories', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowModal(false); setName(''); setSortOrder('0'); setEditId(null); load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kategori ini?')) return;
    await fetch('/api/admin/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Kategori</h1>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setName(''); setSortOrder('0'); setShowModal(true); }}>+ Tambah</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit' : 'Tambah'} Kategori</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Nama *</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Urutan</label><input className="form-input" type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Slug</th><th>Urutan</th><th>Aksi</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-muted)' }}>{c.slug}</td>
                  <td>{c.sort_order}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { setEditId(c.id); setName(c.name); setSortOrder(String(c.sort_order)); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
