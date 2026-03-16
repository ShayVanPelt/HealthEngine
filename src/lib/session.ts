import type { SessionOptions } from 'iron-session';

export interface SessionData {
  userId: string;
  email: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'health-engine-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

/**
 * Use this helper in Server Components and API Route Handlers only.
 * Do NOT call from middleware (use request.cookies there instead).
 */
export async function getSession() {
  // Dynamic imports keep this function out of the Edge runtime bundle
  const { getIronSession } = await import('iron-session');
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
