'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) window.location.href = '/admin';
      else setError(data.reason || 'Login gagal');
    } catch { setError('Koneksi error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>Toko Admin</h1>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>Masuk ke panel admin</p>
        </div>
        <form onSubmit={handleLogin} style={{ background: '#1e293b', padding: 28, borderRadius: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Username</label>
            <input style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #334155', borderRadius: 10, fontSize: 14, background: '#0f172a', color: '#f1f5f9', outline: 'none', fontFamily: 'inherit' }}
              value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Password</label>
            <input type="password" style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #334155', borderRadius: 10, fontSize: 14, background: '#0f172a', color: '#f1f5f9', outline: 'none', fontFamily: 'inherit' }}
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.15)', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 15 }} disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
