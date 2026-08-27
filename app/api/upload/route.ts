import { getSession } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/utils';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError('Unauthorized', 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return jsonError('No file provided', 400);
    if (file.size > MAX_SIZE) return jsonError('Ukuran file maksimal 5MB', 400);
    if (!ALLOWED_TYPES.includes(file.type)) return jsonError('Format file tidak didukung (jpg, png, webp, gif, avif)', 400);

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${random}.${ext}`;

    // Ensure uploads dir exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return jsonOk({ ok: true, url, filename });
  } catch (err: any) {
    console.error('Upload error:', err);
    return jsonError('Gagal upload file: ' + (err.message || 'Unknown error'), 500);
  }
}
