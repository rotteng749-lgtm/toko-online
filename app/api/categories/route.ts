import { getDb, ensureDb } from '@/lib/db';
import { jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureDb();
  const db = getDb();
  const result = await db.execute(
    'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.active = 1 WHERE c.active = 1 GROUP BY c.id ORDER BY c.sort_order'
  );
  return jsonOk({ ok: true, categories: result.rows });
}
