import { createClient, type Client } from '@libsql/client';

let _db: Client | null = null;
let _initialized = false;

export function getDb(): Client {
  if (_db) return _db;
  if (process.env.TURSO_DATABASE_URL) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  } else {
    const dbPath = process.env.DATABASE_PATH || './data/app.db';
    _db = createClient({ url: `file:${dbPath}` });
  }
  return _db;
}

export async function ensureDb(): Promise<void> {
  if (_initialized) return;
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      price INTEGER NOT NULL DEFAULT 0,
      sale_price INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 0,
      image_url TEXT DEFAULT '',
      images_json TEXT DEFAULT '[]',
      category_id INTEGER,
      active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      items_json TEXT NOT NULL,
      total INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'new',
      payment_note TEXT DEFAULT '',
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      comment TEXT DEFAULT '',
      created_at INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'percent',
      discount_value INTEGER NOT NULL DEFAULT 0,
      min_order INTEGER DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      expires_at INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);

  // Add new columns (safe to run multiple times)
  try { await db.execute('ALTER TABLE products ADD COLUMN variants_json TEXT DEFAULT "[]"'); } catch {}
  try { await db.execute('ALTER TABLE orders ADD COLUMN payment_proof_url TEXT DEFAULT ""'); } catch {}
  try { await db.execute('ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT "pending"'); } catch {}
  try { await db.execute('ALTER TABLE orders ADD COLUMN coupon_code TEXT DEFAULT ""'); } catch {}
  try { await db.execute('ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0'); } catch {}

  // Seed settings
  const defaults: Record<string, string> = {
    store_name: 'Toko Kita',
    wa_number: '6281234567890',
    store_address: 'Jl. Contah No. 123, Jakarta',
    bank_info: 'BCA 1234567890 a/n Pemilik Toko',
    currency: 'IDR',
    theme_color: '#16a34a',
    logo_url: '',
    admin_user: process.env.ADMIN_USER || 'admin',
    admin_pass: '',
    session_secret: process.env.SESSION_SECRET || 'change-me',
  };

  for (const [key, value] of Object.entries(defaults)) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      args: [key, value],
    });
  }

  // Seed categories
  const cats = [
    { name: 'Elektronik', slug: 'elektronik', sort: 1 },
    { name: 'Fashion', slug: 'fashion', sort: 2 },
    { name: 'Makanan', slug: 'makanan', sort: 3 },
    { name: 'Aksesoris', slug: 'aksesoris', sort: 4 },
  ];
  for (const c of cats) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, ?)',
      args: [c.name, c.slug, c.sort],
    });
  }

  // Seed sample products
  const products = [
    { name: 'T-Shirt Polos Premium', slug: 'tshirt-polos', desc: 'Kaos polos 100% cotton, nyaman dipakai sehari-hari. Tersedia berbagai warna.', price: 89000, sale: 69000, stock: 50, cat: 'fashion', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' },
    { name: 'Headphone Wireless Pro', slug: 'headphone-wireless', desc: 'Headphone bluetooth dengan noise cancelling, baterai tahan 30 jam.', price: 450000, sale: 0, stock: 25, cat: 'elektronik', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop' },
    { name: 'Snack Keripik Singkong', slug: 'keripik-singkong', desc: 'Keripik singkong renyah rasa balado, pack 250gr.', price: 25000, sale: 20000, stock: 100, cat: 'makanan', img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop' },
    { name: 'Jam Tangan Digital', slug: 'jam-digital', desc: 'Jam tangan digital sport, water resistant 50m, tampilan LED.', price: 350000, sale: 275000, stock: 30, cat: 'aksesoris', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop' },
    { name: 'Tas Ransel Laptop', slug: 'tas-ransel', desc: 'Ransel anti-air, muat laptop 15.6", banyak kompartemen.', price: 250000, sale: 199000, stock: 40, cat: 'aksesoris', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop' },
    { name: 'Kaos Distro Limited', slug: 'kaos-distro', desc: 'Kaos distro edisi terbatas, bahan premium, sablon glow-in-the-dark.', price: 125000, sale: 0, stock: 15, cat: 'fashion', img: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=400&fit=crop' },
    { name: 'Power Bank 20000mAh', slug: 'powerbank', desc: 'Power bank kapasitas besar, fast charging, dual output.', price: 189000, sale: 149000, stock: 35, cat: 'elektronik', img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop' },
    { name: 'Sari Buah Mangga', slug: 'sari-buah-mangga', desc: 'Sari buah mangga asli, tanpa pengawet, 500ml.', price: 35000, sale: 0, stock: 60, cat: 'makanan', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=400&fit=crop' },
  ];

  for (const p of products) {
    const catResult = await db.execute({ sql: 'SELECT id FROM categories WHERE slug = ?', args: [p.cat] });
    const catId = catResult.rows[0]?.id || 1;
    await db.execute({
      sql: 'INSERT OR IGNORE INTO products (name, slug, description, price, sale_price, stock, image_url, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [p.name, p.slug, p.desc, p.price, p.sale, p.stock, p.img, catId],
    });
  }

  // Hash admin password
  const adminPass = process.env.ADMIN_PASS || 'admin123';
  const passHash = await hashPassword(adminPass);
  await db.execute({
    sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    args: ['admin_pass', passHash],
  });

  _initialized = true;
}

async function hashPassword(password: string): Promise<string> {
  const { randomBytes, scrypt } = await import('crypto');
  const salt = randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const { scrypt, timingSafeEqual } = await import('crypto');
  const [salt, keyHex] = hash.split(':');
  const key = Buffer.from(keyHex, 'hex');
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(timingSafeEqual(key, derivedKey));
    });
  });
}

export async function getSetting(key: string): Promise<string> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] });
  return String(result.rows[0]?.value || '');
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', args: [key, value] });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = getDb();
  const result = await db.execute('SELECT * FROM settings');
  const settings: Record<string, string> = {};
  for (const row of result.rows) {
    settings[String(row.key)] = String(row.value || '');
  }
  return settings;
}
