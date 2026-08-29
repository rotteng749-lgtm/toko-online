'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      setIsDark(saved === 'dark');
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
      style={{
        background: 'var(--glass)', border: '1px solid var(--border)',
        borderRadius: 10, width: 38, height: 38, cursor: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, transition: 'all 0.3s',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
