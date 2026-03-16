import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { type SessionData, sessionOptions } from '@/lib/session';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.destroy();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[logout]', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
