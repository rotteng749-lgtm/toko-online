import { getDb, ensureDb } from '@/lib/db';
import { jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureDb();
  const db = getDb();
  const result = await db.execute('SELECT * FROM coupons ORDER BY created_at DESC');
  return jsonOk({ ok: true, coupons: result.rows });
}

export async function POST(request: Request) {
  await ensureDb();
  const body = await request.json();
  const { code, discount_type, discount_value, min_order, max_uses, expires_at } = body;

  if (!code || !discount_value) return jsonOk({ ok: false, reason: 'Kode dan nilai diskon wajib' }, 400);

  const db = getDb();
  try {
    await db.execute({
      sql: 'INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [code.toUpperCase(), discount_type || 'percent', discount_value, min_order || 0, max_uses || 0, expires_at || 0],
    });
    return jsonOk({ ok: true });
  } catch (e: any) {
    return jsonOk({ ok: false, reason: e.message?.includes('UNIQUE') ? 'Kode kupon sudah ada' : e.message }, 400);
  }
}

export async function DELETE(request: Request) {
  await ensureDb();
  const { id } = await request.json();
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM coupons WHERE id = ?', args: [id] });
  return jsonOk({ ok: true });
}
