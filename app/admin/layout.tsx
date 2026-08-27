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
        ☰
      </button>

      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">🛍️ Toko Admin</div>
        <nav className="admin-nav">
          {nav.map(item => (
            <Link key={item.href} href={item.href} className={`admin-nav-item${pathname === item.href ? ' active' : ''}`}
              onClick={() => document.querySelector('.admin-sidebar')?.classList.remove('open')}>
              <span>{item.icon}</span> <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid #1e293b' }}>
          <Link href="/" className="admin-nav-item" target="_blank">
            <span>🌐</span> <span>Lihat Toko</span>
          </Link>
          <button className="admin-nav-item" style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); window.location.href = '/admin/login'; }}>
            <span>🚪</span> <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
