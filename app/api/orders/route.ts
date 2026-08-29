import { getDb, ensureDb } from '@/lib/db';
import { generateOrderCode, buildWhatsAppLink } from '@/lib/whatsapp';
import { jsonError, jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  await ensureDb();
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_REQUEST', 400);
  }

  const { customer_name, phone, address, notes, items, coupon_code, discount_amount, payment_proof_url } = body;

  if (!customer_name || !phone || !items || !items.length) {
    return jsonError('Nama, telepon, dan minimal 1 item wajib diisi', 400);
  }

  const db = getDb();

  // Get store settings
  const settingsResult = await db.execute('SELECT * FROM settings');
  const settings: Record<string, string> = {};
  for (const row of settingsResult.rows) {
    settings[String(row.key)] = String(row.value || '');
  }

  // Calculate total and validate stock
  let total = 0;
  const validItems: { name: string; qty: number; price: number; product_id: number }[] = [];

  for (const item of items) {
    const product = await db.execute({
      sql: 'SELECT id, name, price, sale_price, stock FROM products WHERE id = ? AND active = 1',
      args: [item.product_id],
    });

    if (product.rows.length === 0) continue;

    const p = product.rows[0];
    const price = Number(p.sale_price) > 0 ? Number(p.sale_price) : Number(p.price);
    const qty = parseInt(item.qty) || 1;

    if (Number(p.stock) < qty) {
      return jsonError(`Stok ${p.name} tidak mencukupi`, 400);
    }

    total += price * qty;
    validItems.push({ name: String(p.name), qty, price, product_id: Number(p.id) });

    // Decrement stock
    await db.execute({
      sql: 'UPDATE products SET stock = stock - ? WHERE id = ?',
      args: [qty, Number(p.id)],
    });
  }

  if (validItems.length === 0) {
    return jsonError('Tidak ada item valid', 400);
  }

  const orderCode = generateOrderCode();
  const itemsJson = JSON.stringify(validItems);

  const finalTotal = Math.max(0, total - (discount_amount || 0));

  await db.execute({
    sql: `INSERT INTO orders (order_code, customer_name, phone, address, notes, items_json, total, status, payment_proof_url, payment_status, coupon_code, discount_amount)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`,
    args: [orderCode, customer_name, phone, address || '', notes || '', itemsJson, finalTotal, payment_proof_url || '', payment_proof_url ? 'uploaded' : 'pending', coupon_code || '', discount_amount || 0],
  });

  // Build WhatsApp link
  const waLink = buildWhatsAppLink({
    waNumber: settings.wa_number || '6281234567890',
    storeName: settings.store_name || 'Toko Kita',
    orderCode,
    items: validItems,
    total,
    customerName: customer_name,
    phone,
    address: address || '',
    notes: notes || '',
    paymentNote: settings.bank_info || '',
  });

  return jsonOk({
    ok: true,
    order_code: orderCode,
    total,
    wa_link: waLink,
  });
}
