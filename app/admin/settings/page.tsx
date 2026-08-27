'use client';

import { useEffect, useState } from 'react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.ok) setSettings(d.settings);
      setLoading(false);
    });
  }, []);

  const save = async (updates: Record<string, string>) => {
    setSettings({ ...settings, ...updates });
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    (window as any).showToast?.('Pengaturan disimpan', 'success');
  };

  const savePassword = async () => {
    if (!newPass) return;
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_pass: newPass }) });
    setNewPass('');
    (window as any).showToast?.('Password diubah', 'success');
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>Memuat...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Pengaturan</h1>

      <div style={{ display: 'grid', gap: 20, maxWidth: 700 }}>
        {/* Store Info */}
        <div className="admin-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🛒 Informasi Toko</h2>
          <div className="form-group">
            <label className="form-label">Nama Toko</label>
            <input className="form-input" value={settings.store_name || ''} onChange={e => setSettings({ ...settings, store_name: e.target.value })}
              onBlur={() => save({ store_name: settings.store_name })} />
          </div>
          <div className="form-group">
            <label className="form-label">Nomor WhatsApp (format: 628xxx)</label>
            <input className="form-input" value={settings.wa_number || ''} onChange={e => setSettings({ ...settings, wa_number: e.target.value })}
              onBlur={() => save({ wa_number: settings.wa_number })} placeholder="6281234567890" />
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Toko</label>
            <textarea className="form-textarea" value={settings.store_address || ''} onChange={e => setSettings({ ...settings, store_address: e.target.value })}
              onBlur={() => save({ store_address: settings.store_address })} />
          </div>
          <div className="form-group">
            <label className="form-label">Info Rekening / Pembayaran</label>
            <textarea className="form-textarea" value={settings.bank_info || ''} onChange={e => setSettings({ ...settings, bank_info: e.target.value })}
              onBlur={() => save({ bank_info: settings.bank_info })} placeholder="BCA 1234567890 a/n Pemilik" />
          </div>
          <div className="form-group">
            <label className="form-label">URL Logo</label>
            <input className="form-input" value={settings.logo_url || ''} onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
              onBlur={() => save({ logo_url: settings.logo_url })} placeholder="https://..." />
          </div>
        </div>

        {/* Security */}
        <div className="admin-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔒 Keamanan</h2>
          <div className="form-group">
            <label className="form-label">Ubah Password Admin</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Password baru" style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={savePassword}>Simpan</button>
            </div>
          </div>
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
      <script src="/app.js" async />
    </div>
  );
}
