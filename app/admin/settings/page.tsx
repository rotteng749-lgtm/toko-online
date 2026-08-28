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
    (window as any).showToast?.('✅ Pengaturan disimpan', 'success');
  };

  const savePassword = async () => {
    if (!newPass) return;
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_pass: newPass }) });
    setNewPass('');
    (window as any).showToast?.('🔒 Password diubah', 'success');
  };

  if (loading) return (
    <div style={{ padding: 60, color: 'var(--text-muted)', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      Memuat pengaturan...
    </div>
  );

  return (
    <div>
      <div className="section-header animate-fade-up">
        <h1>Pengaturan</h1>
        <p>Konfigurasi toko kamu</p>
      </div>

      <div style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
        {/* Store Info */}
        <div className="admin-card animate-fade-up animate-delay-1">
          <h2>🛒 Informasi Toko</h2>
          <div className="form-group">
            <label className="form-label">Nama Toko</label>
            <input className="form-input" value={settings.store_name || ''} onChange={e => setSettings({ ...settings, store_name: e.target.value })}
              onBlur={() => save({ store_name: settings.store_name })} placeholder="Nama toko kamu" />
          </div>
          <div className="form-group">
            <label className="form-label">Nomor WhatsApp (format: 628xxx)</label>
            <input className="form-input" value={settings.wa_number || ''} onChange={e => setSettings({ ...settings, wa_number: e.target.value })}
              onBlur={() => save({ wa_number: settings.wa_number })} placeholder="6281234567890" />
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Toko</label>
            <textarea className="form-textarea" value={settings.store_address || ''} onChange={e => setSettings({ ...settings, store_address: e.target.value })}
              onBlur={() => save({ store_address: settings.store_address })} placeholder="Alamat lengkap toko" />
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
        <div className="admin-card animate-fade-up animate-delay-2">
          <h2>🔒 Keamanan</h2>
          <div className="form-group">
            <label className="form-label">Ubah Password Admin</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="form-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Password baru" style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={savePassword}>💾 Simpan</button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="admin-card animate-fade-up animate-delay-3">
          <h2>👁️ Preview Link</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            <a href="/" target="_blank" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              borderRadius: 'var(--radius-xs)', background: 'var(--glass)',
              border: '1px solid var(--border)', transition: 'all 0.2s',
              color: 'var(--accent-2)', fontWeight: 500, fontSize: 14,
            }}>
              🌐 Buka Toko
            </a>
            <a href="/admin" target="_blank" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              borderRadius: 'var(--radius-xs)', background: 'var(--glass)',
              border: '1px solid var(--border)', transition: 'all 0.2s',
              color: 'var(--accent-2)', fontWeight: 500, fontSize: 14,
            }}>
              ⚡ Panel Admin
            </a>
          </div>
        </div>
      </div>

      <div id="toast-container" className="toast-container" />
    </div>
  );
}
