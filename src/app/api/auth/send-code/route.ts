import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

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

    if (!rateLimit(`send-code:${email}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many codes requested. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    // Remove any existing codes for this email
    await prisma.verificationCode.deleteMany({ where: { email } });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.verificationCode.create({
      data: { email, code, expiresAt },
    });

    await sendVerificationEmail({ to: email, code });

    // devMode tells the login UI whether the OTP is console-logged (no Resend configured)
    return NextResponse.json({ success: true, devMode: !process.env.RESEND_API_KEY });
  } catch (error) {
    console.error('[send-code]', error);
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
