import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getSetting } from './db';

const SESSION_NAME = 'toko_session';

async function getSessionSecret(): Promise<Uint8Array> {
  const secret = await getSetting('session_secret');
  return new TextEncoder().encode(secret || 'fallback-secret');
}

export async function createSession(userId: string): Promise<string> {
  const secret = await getSessionSecret();
  return new SignJWT({ userId, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function getSession(): Promise<{ userId: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_NAME)?.value;
    if (!token) return null;
    const secret = await getSessionSecret();
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_NAME);
}
