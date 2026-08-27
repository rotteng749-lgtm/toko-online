'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Product { id: number; name: string; slug: string; price: number; sale_price: number; stock: number; image_url: string; category_name: string; active: number; description: string; }
interface Category { id: number; name: string; }

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', sale_price: '', stock: '', image_url: '', category_id: '' });

  // Image upload state
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCSV, setBulkCSV] = useState('');
  const [bulkPreview, setBulkPreview] = useState<Record<string, string>[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch('/api/admin/products').then(r => r.json()).then(d => { if (d.ok) setProducts(d.products); });
    fetch('/api/admin/categories').then(r => r.json()).then(d => { if (d.ok) setCategories(d.categories); });
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', description: '', price: '', sale_price: '', stock: '', image_url: '', category_id: '' });
    setPreview('');
    setShowUrlInput(false);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), sale_price: String(p.sale_price), stock: String(p.stock), image_url: p.image_url, category_id: '' });
    setPreview(p.image_url);
    setShowUrlInput(false);
    setShowModal(true);
  };

  // Upload file to server
  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 200);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();
      if (data.ok) {
        return data.url;
      } else {
        (window as any).showToast?.(data.reason || 'Gagal upload', 'error');
        return null;
      }
    } catch {
      (window as any).showToast?.('Gagal upload file', 'error');
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  // Handle file selection
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      (window as any).showToast?.('File harus gambar', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      (window as any).showToast?.('Ukuran maksimal 5MB', 'error');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    // Upload
    const url = await uploadFile(file);
    if (url) {
      setForm(prev => ({ ...prev, image_url: url }));
      setPreview(url);
      (window as any).showToast?.('✅ Gambar berhasil diupload', 'success');
    }
  }, []);

  // Drag & Drop handlers
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // File input change
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Remove image
  const removeImage = () => {
    setPreview('');
    setForm(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle URL input
  const onUrlChange = (url: string) => {
    setForm(prev => ({ ...prev, image_url: url }));
    setPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = '/api/admin/products';
    const method = editId ? 'PATCH' : 'POST';
    const body = editId
      ? { id: editId, ...form, price: parseInt(form.price) || 0, sale_price: parseInt(form.sale_price) || 0, stock: parseInt(form.stock) || 0, category_id: parseInt(form.category_id) || null }
      : { ...form, price: parseInt(form.price) || 0, sale_price: parseInt(form.sale_price) || 0, stock: parseInt(form.stock) || 0, category_id: parseInt(form.category_id) || null };
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowModal(false);
    (window as any).showToast?.(editId ? '✅ Produk diperbarui' : '✅ Produk ditambahkan', 'success');
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus produk ini?')) return;
    await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    (window as any).showToast?.('🗑️ Produk dihapus', 'success');
    load();
  };

  const formatIDR = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID');

  const previewPrice = parseInt(form.price) || 0;
  const previewSale = parseInt(form.sale_price) || 0;
  const discount = previewSale > 0 && previewPrice > 0 ? Math.round((1 - previewSale / previewPrice) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h1>Produk</h1>
          <p>{products.length} produk total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => {
            // Download CSV template
            const csv = 'name,description,price,sale_price,stock,image_url,category,active\nT-Shirt Polos Premium,Bahan katun 20s nyaman,69000,59000,50,,T-Shirt,1\nHoodie Oversize Premium,Hoodie tebal untuk musim hujan,189000,0,30,,Hoodie,1';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'template-produk.csv'; a.click();
            URL.revokeObjectURL(url);
          }}>📥 Template CSV</button>
          <button className="btn btn-outline" onClick={() => { setShowBulkModal(true); setBulkCSV(''); setBulkPreview([]); setBulkResult(null); }}>📦 Bulk Import</button>
          <button className="btn btn-primary" onClick={openCreate}>+ Tambah Produk</button>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, padding: 0, overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 28px', borderBottom: '1px solid var(--border)',
              background: 'var(--glass)',
            }}>
              <h3 className="modal-title">{editId ? '✏️ Edit Produk' : '✨ Tambah Produk Baru'}</h3>
              <button onClick={() => setShowModal(false)} style={{
                background: 'var(--glass)', border: '1px solid var(--border)',
                borderRadius: 10, width: 36, height: 36, cursor: 'none',
                color: 'var(--text-muted)', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >✕</button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="product-form-grid" style={{ padding: '28px' }}>
                {/* Left: Image Upload */}
                <div className="product-form-sidebar">
                  <label className="form-label">📷 Gambar Produk</label>

                  {/* Dropzone */}
                  <div
                    className={`upload-dropzone${preview ? ' has-image' : ''}${dragOver ? ' drag-over' : ''}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => !preview && fileInputRef.current?.click()}
                  >
                    {preview ? (
                      <div className="upload-preview">
                        <img src={preview} alt="Preview" />
                        <div className="upload-preview-overlay">
                          <button type="button" className="upload-preview-btn change"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                            📷 Ganti
                          </button>
                          <button type="button" className="upload-preview-btn remove"
                            onClick={(e) => { e.stopPropagation(); removeImage(); }}>
                            🗑️ Hapus
                          </button>
                        </div>
                        {uploading && (
                          <div className="upload-progress">
                            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="upload-dropzone-icon">{uploading ? '⏳' : '📸'}</div>
                        <div className="upload-dropzone-text">
                          {uploading ? `Uploading... ${uploadProgress}%` : 'Drag & drop gambar ke sini'}
                        </div>
                        <div className="upload-dropzone-hint">atau klik untuk pilih file</div>
                        <div className="upload-dropzone-hint" style={{ marginTop: 4, fontSize: 11 }}>
                          JPG, PNG, WebP, GIF • Maks 5MB
                        </div>
                      </>
                    )}
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />

                  {/* URL Toggle */}
                  <div className="upload-url-toggle" onClick={() => setShowUrlInput(!showUrlInput)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    {showUrlInput ? 'Sembunyikan URL input' : 'Atau masukkan URL gambar'}
                  </div>

                  {showUrlInput && (
                    <input
                      className="form-input"
                      value={form.image_url}
                      onChange={e => onUrlChange(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      style={{ fontSize: 12 }}
                    />
                  )}
                </div>

                {/* Right: Form Fields */}
                <div className="product-form-main">
                  <div className="form-group">
                    <label className="form-label">Nama Produk *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Contoh: T-Shirt Polos Premium" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deskripsi</label>
                    <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat produk..." style={{ minHeight: 80 }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Harga Normal (Rp)</label>
                      <input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Harga Sale (Rp) <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 11 }}>*opsional</span></label>
                      <input className="form-input" type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} placeholder="0" />
                    </div>
                  </div>

                  {/* Price Preview */}
                  {(previewPrice > 0 || previewSale > 0) && (
                    <div className="price-preview">
                      <span className="main-price">{formatIDR(previewSale > 0 ? previewSale : previewPrice)}</span>
                      {previewSale > 0 && <span className="old-price">{formatIDR(previewPrice)}</span>}
                      {discount > 0 && <span className="discount-badge">-{discount}%</span>}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Stok</label>
                      <input className="form-input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                      {parseInt(form.stock) > 0 && parseInt(form.stock) <= 5 && (
                        <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4, fontWeight: 600 }}>⚠️ Stok menipis!</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kategori</label>
                      <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                        <option value="">Pilih kategori</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex', gap: 10, justifyContent: 'flex-end',
                padding: '16px 28px', borderTop: '1px solid var(--border)',
                background: 'var(--glass)',
              }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={uploading}>
                  {uploading ? '⏳ Uploading...' : editId ? '💾 Simpan Perubahan' : '✨ Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== BULK IMPORT MODAL ===== */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => !bulkImporting && setShowBulkModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 28px', borderBottom: '1px solid var(--border)',
              background: 'var(--glass)',
            }}>
              <h3 className="modal-title">📦 Bulk Import Produk</h3>
              <button onClick={() => !bulkImporting && setShowBulkModal(false)} style={{
                background: 'var(--glass)', border: '1px solid var(--border)',
                borderRadius: 10, width: 36, height: 36, cursor: 'none',
                color: 'var(--text-muted)', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}>✕</button>
            </div>

            <div style={{ padding: '28px' }}>
              {!bulkResult ? (
                <>
                  {/* Upload Zone */}
                  <div
                    className={`upload-dropzone${bulkCSV ? ' has-image' : ''}`}
                    onClick={() => !bulkCSV && bulkFileRef.current?.click()}
                    style={{ marginBottom: 20, minHeight: 120 }}
                  >
                    {bulkCSV ? (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent-2)', marginBottom: 4 }}>
                          {bulkPreview.length} produk terdeteksi
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                          Siap untuk diimport
                        </div>
                        <button type='button' className='btn btn-outline btn-sm' onClick={(e) => {
                          e.stopPropagation();
                          setBulkCSV(''); setBulkPreview([]);
                        }}>🔄 Ganti File</button>
                      </div>
                    ) : (
                      <>
                        <div className="upload-dropzone-icon">📄</div>
                        <div className="upload-dropzone-text">Drag & drop file CSV ke sini</div>
                        <div className="upload-dropzone-hint">atau klik untuk pilih file</div>
                        <div className="upload-dropzone-hint" style={{ marginTop: 4, fontSize: 11 }}>
                          Format: name, description, price, sale_price, stock, image_url, category, active
                        </div>
                      </>
                    )}
                  </div>

                  <input ref={bulkFileRef} type="file" accept='.csv' style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target?.result as string;
                      setBulkCSV(text);
                      // Parse preview
                      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                      if (lines.length >= 2) {
                        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                        const previewRows = lines.slice(1).map(line => {
                          const values = line.split(',').map(v => v.trim());
                          const row: Record<string, string> = {};
                          headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
                          return row;
                        });
                        setBulkPreview(previewRows);
                      }
                    };
                    reader.readAsText(file);
                  }} />

                  {/* Paste CSV */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label className="form-label" style={{ margin: 0 }}>Atau paste CSV langsung:</label>
                      <a href="/api/admin/products/bulk" download style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'underline' }}>
                        📥 Download Template
                      </a>
                    </div>
                    <textarea
                      className="form-textarea"
                      value={bulkCSV}
                      onChange={(e) => {
                        const text = e.target.value;
                        setBulkCSV(text);
                        // Parse preview
                        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                        if (lines.length >= 2) {
                          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                          const previewRows = lines.slice(1).map(line => {
                            const values = line.split(',').map(v => v.trim());
                            const row: Record<string, string> = {};
                            headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
                            return row;
                          });
                          setBulkPreview(previewRows);
                        } else {
                          setBulkPreview([]);
                        }
                      }}
                      placeholder={`name,description,price,sale_price,stock,image_url,category,active\nT-Shirt Polos Premium,Bahan katun 20s,69000,59000,50,,T-Shirt,1\nHoodie Premium,Hoodie tebal,189000,0,30,,Hoodie,1`}
                      style={{ minHeight: 100, fontFamily: 'monospace', fontSize: 12 }}
                    />
                  </div>

                  {/* Preview Table */}
                  {bulkPreview.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        👀 Preview ({bulkPreview.length} produk)
                      </div>
                      <div className="table-wrap" style={{ maxHeight: 240, overflowY: 'auto' }}>
                        <table style={{ fontSize: 12 }}>
                          <thead><tr>
                            <th>#</th><th>Nama</th><th>Harga</th><th>Stok</th><th>Kategori</th>
                          </tr></thead>
                          <tbody>
                            {bulkPreview.slice(0, 20).map((row, idx) => (
                              <tr key={idx}>
                                <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                                <td style={{ fontWeight: 600 }}>{row.name || row.nama || '—'}</td>
                                <td style={{ color: 'var(--accent-2)', fontFamily: 'var(--font-display)' }}>
                                  Rp {(parseInt(row.price || row.harga?.replace(/[^0-9]/g, '') || '0') || 0).toLocaleString('id-ID')}
                                </td>
                                <td>{row.stock || row.stok || '0'}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{row.category || row.kategori || '—'}</td>
                              </tr>
                            ))}
                            {bulkPreview.length > 20 && (
                              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 8 }}>
                                ...dan {bulkPreview.length - 20} produk lainnya
                              </td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* ===== IMPORT RESULTS ===== */
                <div>
                  {/* Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                    <div className="admin-card" style={{ textAlign: 'center', padding: 20, background: 'linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.1))' }}>
                      <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{bulkResult.total}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Baris</div>
                    </div>
                    <div className="admin-card" style={{ textAlign: 'center', padding: 20, background: 'linear-gradient(135deg, rgba(0,212,126,0.15), rgba(254,202,87,0.08))' }}>
                      <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--wa-green)' }}>{bulkResult.success}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Berhasil</div>
                    </div>
                    <div className="admin-card" style={{ textAlign: 'center', padding: 20, background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,159,67,0.08))' }}>
                      <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--danger)' }}>{bulkResult.errors}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gagal</div>
                    </div>
                  </div>

                  {/* Detail Results */}
                  <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
                    <table style={{ fontSize: 12 }}>
                      <thead><tr><th>Baris</th><th>Nama</th><th>Status</th><th>Pesan</th></tr></thead>
                      <tbody>
                        {bulkResult.results.map((r: any, idx: number) => (
                          <tr key={idx} style={{ background: r.status === 'error' ? 'rgba(255,107,107,0.05)' : 'transparent' }}>
                            <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.row}</td>
                            <td style={{ fontWeight: 600 }}>{r.name}</td>
                            <td>
                              {r.status === 'ok' ? (
                                <span style={{ color: 'var(--wa-green)', fontWeight: 600 }}>✅ Berhasil</span>
                              ) : (
                                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>❌ Gagal</span>
                              )}
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>{r.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {bulkImporting && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Importing...</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{bulkProgress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'var(--glass)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${bulkProgress}%`, borderRadius: 999, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', gap: 10, justifyContent: 'flex-end',
              padding: '16px 28px', borderTop: '1px solid var(--border)',
              background: 'var(--glass)',
            }}>
              <button type='button' className="btn btn-outline btn-sm" onClick={() => { if (!bulkImporting) setShowBulkModal(false); }}>
                {bulkResult ? '✅ Tutup' : 'Batal'}
              </button>
              {!bulkResult && (
                <button type='button' className="btn btn-primary btn-sm" disabled={!bulkCSV || bulkImporting} onClick={async () => {
                  setBulkImporting(true);
                  setBulkProgress(0);
                  const progressInterval = setInterval(() => {
                    setBulkProgress(prev => Math.min(prev + 8, 85));
                  }, 300);
                  try {
                    const res = await fetch('/api/admin/products/bulk', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ csv: bulkCSV }),
                    });
                    const data = await res.json();
                    clearInterval(progressInterval);
                    setBulkProgress(100);
                    setTimeout(() => {
                      setBulkResult(data);
                      setBulkImporting(false);
                      load();
                    }, 500);
                  } catch {
                    clearInterval(progressInterval);
                    setBulkImporting(false);
                    (window as any).showToast?.('Gagal import', 'error');
                  }
                }}>
                  {bulkImporting ? `⏳ Importing...` : `📦 Import ${bulkPreview.length} Produk`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCT TABLE ===== */}
      <div className="admin-card animate-fade-up">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Produk</th><th>Harga</th><th>Stok</th><th>Kategori</th><th>Aksi</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 'var(--radius-xs)',
                        overflow: 'hidden', background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                        flexShrink: 0, border: '1px solid var(--border)',
                      }}>
                        <img src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'var(--font-display)', fontSize: 14 }}>{formatIDR(p.sale_price > 0 ? p.sale_price : p.price)}</div>
                    {p.sale_price > 0 && <div style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatIDR(p.price)}</div>}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: p.stock > 10 ? 'rgba(0,212,126,0.1)' : p.stock > 0 ? 'rgba(254,202,87,0.1)' : 'rgba(255,107,107,0.1)',
                      color: p.stock > 10 ? 'var(--wa-green)' : p.stock > 0 ? 'var(--warning)' : 'var(--danger)',
                    }}>
                      {p.stock > 10 ? '🟢' : p.stock > 0 ? '🟡' : '🔴'} {p.stock}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.category_name || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)} style={{ padding: '8px 12px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12, filter: 'grayscale(0.5)' }}>📦</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Belum ada produk</div>
                <div style={{ fontSize: 13 }}>Klik &quot;+ Tambah Produk&quot; untuk mulai</div>
              </td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
      <script src="/app.js" async />
    </div>
  );
}
