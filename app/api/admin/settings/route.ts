import { ensureDb, getAllSettings, setSetting } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  const settings = await getAllSettings();
  // Hide password hash
  delete settings.admin_pass;
  return jsonOk({ ok: true, settings });
}

export async function POST(request: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_REQUEST', 400);
  }

  for (const [key, value] of Object.entries(body)) {
    if (key === 'admin_pass' && value) {
      // Hash new password
      const { randomBytes, scrypt } = await import('crypto');
      const salt = randomBytes(16).toString('hex');
      const hash = await new Promise<string>((resolve, reject) => {
        scrypt(value, salt, 64, (err, derivedKey) => {
          if (err) reject(err);
          resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
      });
      await setSetting('admin_pass', hash);
    } else if (key !== 'admin_pass') {
      await setSetting(key, value);
    }
  }

  return jsonOk({ ok: true, message: 'Pengaturan disimpan' });
}
