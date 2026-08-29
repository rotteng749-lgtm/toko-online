import { NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    await ensureDb();
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 });
    }

    const db = getDb();

    // Create newsletter_subscribers table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        subscribed_at INTEGER DEFAULT (strftime('%s','now')),
        active INTEGER DEFAULT 1
      )
    `);

    // Insert subscriber (ignore if exists)
    await db.execute({
      sql: 'INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)',
      args: [email.toLowerCase().trim()],
    });

    return NextResponse.json({ ok: true, message: 'Berhasil subscribe!' });
  } catch (err) {
    return NextResponse.json({ error: 'Gagal subscribe' }, { status: 500 });
  }
}
