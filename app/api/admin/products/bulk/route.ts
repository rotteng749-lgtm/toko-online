import { getDb, ensureDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

interface BulkResult {
  row: number;
  name: string;
  status: 'ok' | 'error';
  message: string;
}

export async function POST(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  const db = getDb();

  try {
    const contentType = request.headers.get('content-type') || '';
    let rows: Record<string, string>[] = [];

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) return jsonError('No file provided', 400);
      const text = await file.text();
      rows = parseCSV(text);
    } else {
      // JSON body with CSV text or rows array
      const body = await request.json();
      if (typeof body.csv === 'string') {
        rows = parseCSV(body.csv);
      } else if (Array.isArray(body.rows)) {
        rows = body.rows;
      } else {
        return jsonError('Provide CSV text or rows array', 400);
      }
    }

    if (rows.length === 0) return jsonError('Tidak ada data produk', 400);
    if (rows.length > 500) return jsonError('Maksimal 500 produk per import', 400);

    // Get categories for name→id mapping
    const catRes = await db.execute('SELECT id, name FROM categories');
    const catMap = new Map<string, number>();
    for (const row of catRes.rows) {
      catMap.set(String(row.name).toLowerCase(), row.id as number);
    }

    const results: BulkResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header
      const name = r.name || r.nama || '';
      if (!name) {
        results.push({ row: rowNum, name: '(empty)', status: 'error', message: 'Nama produk wajib' });
        errorCount++;
        continue;
      }

      const description = r.description || r.deskripsi || '';
      const priceStr = r.price || r.harga || '0';
      const price = parseInt(String(priceStr).replace(/[^0-9]/g, '')) || 0;
      if (price <= 0) {
        results.push({ row: rowNum, name, status: 'error', message: 'Harga harus > 0' });
        errorCount++;
        continue;
      }

      const salePriceStr = r.sale_price || r.harga_diskon || '0';
      const salePrice = parseInt(String(salePriceStr).replace(/[^0-9]/g, '')) || 0;

      const stockStr = r.stock || r.stok || '0';
      const stock = parseInt(String(stockStr).replace(/[^0-9]/g, '')) || 0;

      const imageUrl = r.image_url || r.image || r.gambar || '';

      // Resolve category
      const catName = (r.category || r.kategori || '').toLowerCase();
      const categoryId = catMap.get(catName) || null;

      const activeStr = r.active || r.status || '1';
      const active = activeStr === '0' || activeStr.toLowerCase() === 'inactive' ? 0 : 1;

      // Generate unique slug
      let slug = slugify(name);
      let attempt = 0;
      while (true) {
        const existing = await db.execute({ sql: 'SELECT 1 FROM products WHERE slug = ?', args: [slug] });
        if (existing.rows.length === 0) break;
        attempt++;
        slug = slugify(name) + '-' + attempt;
      }

      try {
        await db.execute({
          sql: `INSERT INTO products (name, slug, description, price, sale_price, stock, image_url, category_id, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [name, slug, description, price, salePrice, stock, imageUrl, categoryId, active],
        });
        results.push({ row: rowNum, name, status: 'ok', message: `Slug: ${slug}` });
        successCount++;
      } catch (err: any) {
        results.push({ row: rowNum, name, status: 'error', message: err.message || 'DB error' });
        errorCount++;
      }
    }

    return jsonOk({
      ok: true,
      total: rows.length,
      success: successCount,
      errors: errorCount,
      results,
    });
  } catch (err: any) {
    console.error('Bulk import error:', err);
    return jsonError('Gagal import: ' + (err.message || 'Unknown'), 500);
  }
}

export async function GET() {
  // Generate CSV template
  const template = `name,description,price,sale_price,stock,image_url,category,active
T-Shirt Polos Premium,Bahan katun 20s nyaman,69000,59000,50,,T-Shirt,1
Hoodie Oversize Premium,Hoodie tebal untuk musim hujan,189000,0,30,,Hoodie,1
Kemeja Flannel Classic,Bahan flannel lembut,129000,0,20,,Kemeja,1`;

  return new Response(template, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="template-produk.csv"',
    },
  });
}
