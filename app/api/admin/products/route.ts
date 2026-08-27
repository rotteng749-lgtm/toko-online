import { getDb, ensureDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  const db = getDb();
  const result = await db.execute(`
    SELECT p.*, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `);
  return jsonOk({ ok: true, products: result.rows });
}

export async function POST(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  let body: Record<string, any>;
  try { body = await request.json(); } catch { return jsonError('INVALID_REQUEST', 400); }

  const { name, description, price, sale_price, stock, image_url, category_id, active } = body;
  if (!name) return jsonError('Nama produk wajib', 400);

  let slug = slugify(name);
  const db = getDb();

  // Ensure unique slug
  let i = 0;
  while (true) {
    const existing = await db.execute({ sql: 'SELECT 1 FROM products WHERE slug = ?', args: [slug] });
    if (existing.rows.length === 0) break;
    i++;
    slug = slugify(name) + '-' + i;
  }

  await db.execute({
    sql: `INSERT INTO products (name, slug, description, price, sale_price, stock, image_url, category_id, active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [name, slug, description || '', price || 0, sale_price || 0, stock || 0, image_url || '', category_id || null, active !== false ? 1 : 0],
  });

  return jsonOk({ ok: true, message: 'Produk ditambahkan' });
}

export async function PATCH(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  let body: Record<string, any>;
  try { body = await request.json(); } catch { return jsonError('INVALID_REQUEST', 400); }

  const { id, ...fields } = body;
  if (!id) return jsonError('id wajib', 400);

  const db = getDb();
  const allowed = ['name', 'description', 'price', 'sale_price', 'stock', 'image_url', 'category_id', 'active'];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      const val = key === 'active' ? (fields[key] ? 1 : 0) : fields[key];
      await db.execute({ sql: `UPDATE products SET ${key} = ? WHERE id = ?`, args: [val, id] });
    }
  }

  return jsonOk({ ok: true, message: 'Produk diperbarui' });
}

export async function DELETE(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  let body: Record<string, any>;
  try { body = await request.json(); } catch { return jsonError('INVALID_REQUEST', 400); }

  const { id } = body;
  if (!id) return jsonError('id wajib', 400);

  const db = getDb();
  await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
  return jsonOk({ ok: true, message: 'Produk dihapus' });
}
