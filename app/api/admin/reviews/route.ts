import { getDb, ensureDb } from '@/lib/db';
import { jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureDb();
  const db = getDb();
  const result = await db.execute(
    'SELECT r.*, p.name as product_name FROM reviews r LEFT JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC'
  );
  return jsonOk({ ok: true, reviews: result.rows });
}

export async function DELETE(request: Request) {
  await ensureDb();
  const { id } = await request.json();
  if (!id) return jsonOk({ ok: false, reason: 'ID required' }, 400);
  
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM reviews WHERE id = ?', args: [id] });
  return jsonOk({ ok: true });
}
