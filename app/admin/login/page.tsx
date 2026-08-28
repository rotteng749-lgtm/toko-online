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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background effects — anime style */}
      <div style={{
        position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(192,132,252,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-200px', right: '-100px',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(255,183,213,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }} className="animate-fade-up">
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
            background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 36,
            boxShadow: '0 8px 30px rgba(192,132,252,0.3)',
          }}>
            🧹
          </div>
          <h1 style={{
            fontFamily: 'var(--font-kawaii)', fontSize: 28, fontWeight: 900,
            background: 'var(--sakura-gradient)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: 8,
          }}>
            Toko Admin ✨
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Masuk ke panel admin~</p>
        </div>

        <form onSubmit={handleLogin} style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 32,
          backdropFilter: 'blur(20px)',
        }} className="animate-fade-up animate-delay-1">
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Username</label>
            <input style={{
              width: '100%', padding: '14px 16px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)', fontSize: 14, background: 'var(--glass)',
              color: 'var(--text)', outline: 'none', fontFamily: 'var(--font)',
              transition: 'all 0.3s', backdropFilter: 'blur(10px)',
            }}
              value={username} onChange={e => setUsername(e.target.value)} autoFocus
              onFocus={e => { e.target.style.borderColor = 'rgba(192,132,252,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(192,132,252,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Password</label>
            <input type="password" style={{
              width: '100%', padding: '14px 16px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)', fontSize: 14, background: 'var(--glass)',
              color: 'var(--text)', outline: 'none', fontFamily: 'var(--font)',
              transition: 'all 0.3s', backdropFilter: 'blur(10px)',
            }}
              value={password} onChange={e => setPassword(e.target.value)}
              onFocus={e => { e.target.style.borderColor = 'rgba(192,132,252,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(192,132,252,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius-xs)',
              background: 'rgba(251,113,133,0.1)', color: '#fb7185',
              fontSize: 13, marginBottom: 20, border: '1px solid rgba(251,113,133,0.15)',
            }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 15 }} disabled={loading}>
            {loading ? '⏳ Masuk...' : '✨ Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
