import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Remove any existing codes for this email
    await prisma.verificationCode.deleteMany({ where: { email } });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.verificationCode.create({
      data: { email, code, expiresAt },
    });

    await sendVerificationEmail({ to: email, code });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[send-code]', error);
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
