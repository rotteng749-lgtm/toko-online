import { getDb, ensureDb } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await ensureDb();
  const url = new URL(request.url);
  const code = url.searchParams.get('code')?.trim().toUpperCase();

  if (!code) return jsonError('Kode pesanan wajib diisi', 400);
  if (!/^ORD-/i.test(code)) return jsonError('Format kode pesanan tidak valid', 400);

  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT id, order_code, customer_name, phone, address, notes, items_json, total, status, payment_note, created_at FROM orders WHERE order_code = ?',
    args: [code],
  });

  if (result.rows.length === 0) {
    return jsonError('Pesanan tidak ditemukan. Periksa kode pesanan Anda.', 404);
  }

  const order = result.rows[0];

  // Parse items
  let items: { name: string; qty: number; price: number }[] = [];
  try {
    items = JSON.parse(String(order.items_json));
  } catch {}

  return jsonOk({
    ok: true,
    order: {
      id: order.id,
      order_code: order.order_code,
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address,
      notes: order.notes,
      items,
      total: order.total,
      status: order.status,
      payment_note: order.payment_note,
      created_at: order.created_at,
    },
  });
}
