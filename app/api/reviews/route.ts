import { getDb, ensureDb } from '@/lib/db';
import { jsonOk, jsonError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// GET /api/reviews?product_id=123
export async function GET(request: Request) {
  await ensureDb();
  const url = new URL(request.url);
  const productId = url.searchParams.get('product_id');
  
  if (!productId) {
    return jsonError('product_id required', 400);
  }

  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
    args: [parseInt(productId)],
  });

  const avgResult = await db.execute({
    sql: 'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE product_id = ?',
    args: [parseInt(productId)],
  });

  return jsonOk({
    ok: true,
    reviews: result.rows,
    avg_rating: Number(avgResult.rows[0]?.avg_rating) || 0,
    total_reviews: Number(avgResult.rows[0]?.total) || 0,
  });
}

// POST /api/reviews { product_id, customer_name, rating, comment }
export async function POST(request: Request) {
  await ensureDb();
  const body = await request.json();
  const { product_id, customer_name, rating, comment } = body;

  if (!product_id || !customer_name || !rating) {
    return jsonError('product_id, customer_name, rating wajib diisi', 400);
  }
  if (rating < 1 || rating > 5) {
    return jsonError('Rating harus 1-5', 400);
  }

  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO reviews (product_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)',
    args: [parseInt(product_id), customer_name, parseInt(rating), comment || ''],
  });

  return jsonOk({ ok: true, message: 'Review berhasil!' });
}
