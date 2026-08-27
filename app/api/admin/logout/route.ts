import { clearSession } from '@/lib/auth';
import { jsonOk } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST() {
  await clearSession();
  return jsonOk({ ok: true });
}
