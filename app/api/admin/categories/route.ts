import { getDb, ensureDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET() {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  const db = getDb();
  const result = await db.execute('SELECT * FROM categories ORDER BY sort_order');
  return jsonOk({ ok: true, categories: result.rows });
}

export async function POST(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  let body: Record<string, any>;
  try { body = await request.json(); } catch { return jsonError('INVALID_REQUEST', 400); }

  const { name, sort_order } = body;
  if (!name) return jsonError('Nama kategori wajib', 400);

  const slug = slugify(name);
  const db = getDb();

  try {
    await db.execute({
      sql: 'INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)',
      args: [name, slug, sort_order || 0],
    });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return jsonError('Kategori sudah ada', 409);
    throw e;
  }

  return jsonOk({ ok: true, message: 'Kategori ditambahkan' });
}

export async function PATCH(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  let body: Record<string, any>;
  try { body = await request.json(); } catch { return jsonError('INVALID_REQUEST', 400); }

  const { id, name, sort_order, active } = body;
  if (!id) return jsonError('id wajib', 400);

  const db = getDb();
  if (name !== undefined) await db.execute({ sql: 'UPDATE categories SET name = ? WHERE id = ?', args: [name, id] });
  if (sort_order !== undefined) await db.execute({ sql: 'UPDATE categories SET sort_order = ? WHERE id = ?', args: [sort_order, id] });
  if (active !== undefined) await db.execute({ sql: 'UPDATE categories SET active = ? WHERE id = ?', args: [active ? 1 : 0, id] });

  return jsonOk({ ok: true, message: 'Kategori diperbarui' });
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
  await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
  return jsonOk({ ok: true, message: 'Kategori dihapus' });
}
