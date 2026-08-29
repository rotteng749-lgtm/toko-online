import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    await ensureDb();
    const url = new URL(req.url);
    const productId = url.searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 });
    }

    const db = getDb();

    // Create table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT DEFAULT NULL,
        answered_at INTEGER DEFAULT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    const result = await db.execute({
      sql: 'SELECT * FROM questions WHERE product_id = ? ORDER BY created_at DESC',
      args: [Number(productId)],
    });

    return NextResponse.json({ questions: result.rows });
  } catch (err) {
    return NextResponse.json({ questions: [] });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDb();
    const body = await req.json();
    const { product_id, customer_name, question } = body;

    if (!product_id || !customer_name || !question) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = getDb();

    // Create table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT DEFAULT NULL,
        answered_at INTEGER DEFAULT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    const result = await db.execute({
      sql: 'INSERT INTO questions (product_id, customer_name, question) VALUES (?, ?, ?)',
      args: [Number(product_id), customer_name, question],
    });

    return NextResponse.json({
      ok: true,
      question: {
        id: Number(result.lastInsertRowid),
        product_id: Number(product_id),
        customer_name,
        question,
        answer: null,
        answered_at: null,
        created_at: Math.floor(Date.now() / 1000),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
