'use client';

import { useEffect, useState } from 'react';

interface Product { id: number; name: string; slug: string; price: number; sale_price: number; stock: number; image_url: string; category_name: string; active: number; }
interface Category { id: number; name: string; }

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', sale_price: '', stock: '', image_url: '', category_id: '' });

  const load = () => {
    fetch('/api/admin/products').then(r => r.json()).then(d => { if (d.ok) setProducts(d.products); });
    fetch('/api/admin/categories').then(r => r.json()).then(d => { if (d.ok) setCategories(d.categories); });
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm({ name: '', description: '', price: '', sale_price: '', stock: '', image_url: '', category_id: '' }); setShowModal(true); };
  const openEdit = (p: Product) => { setEditId(p.id); setForm({ name: p.name, description: '', price: String(p.price), sale_price: String(p.sale_price), stock: String(p.stock), image_url: p.image_url, category_id: '' }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = '/api/admin/products';
    const method = editId ? 'PATCH' : 'POST';
    const body = editId ? { id: editId, ...form, price: parseInt(form.price) || 0, sale_price: parseInt(form.sale_price) || 0, stock: parseInt(form.stock) || 0, category_id: parseInt(form.category_id) || null }
      : { ...form, price: parseInt(form.price) || 0, sale_price: parseInt(form.sale_price) || 0, stock: parseInt(form.stock) || 0, category_id: parseInt(form.category_id) || null };
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus produk ini?')) return;
    await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Produk</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Tambah Produk</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Nama *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Deskripsi</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Harga (Rp)</label><input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Harga Sale (Rp)</label><input className="form-input" type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Stok</label><input className="form-input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Kategori</label>
                  <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Pilih</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">URL Gambar</label><input className="form-input" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">{editId ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Produk</th><th>Harga</th><th>Stok</th><th>Kategori</th><th>Aksi</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                        <img src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatIDR(p.sale_price > 0 ? p.sale_price : p.price)}</div>
                    {p.sale_price > 0 && <div style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatIDR(p.price)}</div>}
                  </td>
                  <td>{p.stock}</td>
                  <td>{p.category_name || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Belum ada produk</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
