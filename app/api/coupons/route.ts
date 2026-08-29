import { getDb, ensureDb } from '@/lib/db';
import { jsonOk, jsonError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// POST /api/coupons { code, order_total }
export async function POST(request: Request) {
  await ensureDb();
  const { code, order_total } = await request.json();

  if (!code) return jsonError('Kode kupon wajib diisi', 400);

  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM coupons WHERE code = ? AND active = 1',
    args: [code.toUpperCase()],
  });

  const row = result.rows[0];
  if (!row) return jsonError('Kode kupon tidak valid', 404);

  const c = {
    code: String(row.code),
    discount_type: String(row.discount_type),
    discount_value: Number(row.discount_value) || 0,
    min_order: Number(row.min_order) || 0,
    max_uses: Number(row.max_uses) || 0,
    used_count: Number(row.used_count) || 0,
    expires_at: Number(row.expires_at) || 0,
  };

  // Check expiry
  if (c.expires_at > 0 && c.expires_at < Date.now() / 1000) {
    return jsonError('Kupon sudah expired', 400);
  }

  // Check max uses
  if (c.max_uses > 0 && c.used_count >= c.max_uses) {
    return jsonError('Kupon sudah habis digunakan', 400);
  }

  // Check min order
  if (c.min_order > 0 && order_total < c.min_order) {
    return jsonError(`Minimum order Rp ${c.min_order.toLocaleString('id-ID')}`, 400);
  }

  // Calculate discount
  let discount = 0;
  if (c.discount_type === 'percent') {
    discount = Math.round(order_total * (c.discount_value / 100));
  } else {
    discount = Math.min(c.discount_value, order_total);
  }

  // Increment used count
  await db.execute({ sql: 'UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', args: [c.code] });

  return jsonOk({
    ok: true,
    coupon: {
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      discount,
    },
  });
}
