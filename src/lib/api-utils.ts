import { NextResponse } from 'next/server';
import { getSession, type SessionData } from './session';

export async function requireAuth(): Promise<
  { ok: true; session: SessionData } | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { ok: true, session };
}
