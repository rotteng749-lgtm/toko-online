import { getDb, ensureDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  const db = getDb();
  let where = '1=1';
  const args: any[] = [];

  if (status) {
    where += ' AND status = ?';
    args.push(status);
  }

  const countResult = await db.execute({ sql: `SELECT COUNT(*) as count FROM orders WHERE ${where}`, args });
  const result = await db.execute({
    sql: `SELECT * FROM orders WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });

  return jsonOk({
    ok: true,
    orders: result.rows,
    total: countResult.rows[0].count,
    page,
    pages: Math.ceil(Number(countResult.rows[0].count) / limit),
  });
}

export async function PATCH(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  let body: Record<string, any>;
  try { body = await request.json(); } catch { return jsonError('INVALID_REQUEST', 400); }

  const { id, status } = body;
  if (!id || !status) return jsonError('id dan status wajib', 400);

  const validStatuses = ['new', 'confirmed', 'shipped', 'done', 'cancelled'];
  if (!validStatuses.includes(status)) return jsonError('Status tidak valid', 400);

  const db = getDb();
  await db.execute({ sql: 'UPDATE orders SET status = ? WHERE id = ?', args: [status, id] });
  return jsonOk({ ok: true, message: 'Status diperbarui' });
}
