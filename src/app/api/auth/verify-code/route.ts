import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { type SessionData, sessionOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null;
    const code = typeof body?.code === 'string' ? body.code.trim() : null;

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // Validate the code
    const record = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // Consume the code
    await prisma.verificationCode.delete({ where: { id: record.id } });

    // Find or create the user
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Write session cookie
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[verify-code]', error);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}
