import { ensureDb, getSetting, verifyPassword } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  await ensureDb();
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_REQUEST', 400);
  }

  const { username, password } = body;
  if (!username || !password) return jsonError('Username dan password wajib', 400);

  const adminUser = await getSetting('admin_user');
  const adminPassHash = await getSetting('admin_pass');

  if (username !== adminUser) return jsonError('Username atau password salah', 401);

  if (adminPassHash) {
    const valid = await verifyPassword(password, adminPassHash);
    if (!valid) return jsonError('Username atau password salah', 401);
  }

  const token = await createSession(username);
  await setSessionCookie(token);
  return jsonOk({ ok: true, message: 'Login berhasil' });
}
