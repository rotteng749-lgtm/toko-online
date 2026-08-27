'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Produk', icon: '📦' },
  { href: '/admin/categories', label: 'Kategori', icon: '🏷️' },
  { href: '/admin/orders', label: 'Pesanan', icon: '🛒' },
  { href: '/admin/settings', label: 'Pengaturan', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="admin-layout">
      <button className="admin-hamburger" onClick={() => document.querySelector('.admin-sidebar')?.classList.toggle('open')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>

      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          🛍️ Toko Admin
        </div>
        <nav className="admin-nav">
          {nav.map(item => (
            <Link key={item.href} href={item.href} className={`admin-nav-item${pathname === item.href ? ' active' : ''}`}
              onClick={() => document.querySelector('.admin-sidebar')?.classList.remove('open')}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '14px 10px', borderTop: '1px solid var(--border)' }}>
          <Link href="/" className="admin-nav-item" target="_blank">
            <span style={{ fontSize: 18 }}>🌐</span>
            <span>Lihat Toko</span>
          </Link>
          <button className="admin-nav-item" style={{ width: '100%', border: 'none', cursor: 'none', fontFamily: 'inherit', background: 'none', textAlign: 'left' }}
            onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); window.location.href = '/admin/login'; }}>
            <span style={{ fontSize: 18 }}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main page-enter">{children}</main>
    </div>
  );
}
