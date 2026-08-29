import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/lib/db';

export async function GET() {
  try {
    await ensureDb();
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

    const result = await db.execute(`
      SELECT q.*, p.name as product_name 
      FROM questions q 
      LEFT JOIN products p ON q.product_id = p.id 
      ORDER BY q.answered_at ASC NULLS FIRST, q.created_at DESC
    `);

    return NextResponse.json({ ok: true, questions: result.rows });
  } catch (err) {
    return NextResponse.json({ ok: false, questions: [] });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureDb();
    const { id, answer } = await req.json();
    const db = getDb();

    await db.execute({
      sql: 'UPDATE questions SET answer = ?, answered_at = strftime(\'%s\',\'now\') WHERE id = ?',
      args: [answer, Number(id)],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureDb();
    const { id } = await req.json();
    const db = getDb();

    await db.execute({ sql: 'DELETE FROM questions WHERE id = ?', args: [Number(id)] });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
