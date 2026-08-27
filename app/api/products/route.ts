import { getDb, ensureDb } from '@/lib/db';
import { jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await ensureDb();
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '';
  const search = url.searchParams.get('search') || '';
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const db = getDb();
  let where = 'p.active = 1';
  const args: any[] = [];

  if (category) {
    where += ' AND c.slug = ?';
    args.push(category);
  }
  if (search) {
    where += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    args.push(`%${search}%`, `%${search}%`);
  }

  const result = await db.execute({
    sql: `SELECT p.*, c.name as category_name, c.slug as category_slug
          FROM products p LEFT JOIN categories c ON p.category_id = c.id
          WHERE ${where}
          ORDER BY p.created_at DESC
          LIMIT ?`,
    args: [...args, limit],
  });

  return jsonOk({ ok: true, products: result.rows });
}
