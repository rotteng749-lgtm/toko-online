'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, maxWidth: 400 }}>
      <input
        type="email"
        placeholder="Email untuk newsletter..."
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{
          flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary, #fff)',
          fontSize: 14, outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '10px 20px', borderRadius: 8, border: 'none',
          background: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'var(--accent, #a855f7)',
          color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {status === 'loading' ? '...' : status === 'success' ? '✓' : status === 'error' ? '✗' : 'Subscribe'}
      </button>
    </form>
  );
}
