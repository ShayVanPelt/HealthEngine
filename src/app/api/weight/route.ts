import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const entries = await prisma.weightEntry.findMany({
      where: { userId: auth.session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error('[GET /api/weight]', error);
    return NextResponse.json({ error: 'Failed to fetch weight entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { weight, bodyFat } = await request.json();

    if (typeof weight !== 'number' || weight <= 0 || weight > 1000) {
      return NextResponse.json({ error: 'weight must be a positive number up to 1,000 kg' }, { status: 400 });
    }

    if (bodyFat !== null && bodyFat !== undefined && (typeof bodyFat !== 'number' || bodyFat < 0 || bodyFat > 100)) {
      return NextResponse.json({ error: 'bodyFat must be a number between 0 and 100' }, { status: 400 });
    }

    const entry = await prisma.weightEntry.create({
      data: {
        userId: auth.session.userId,
        weight,
        bodyFat: bodyFat ?? null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/weight]', error);
    return NextResponse.json({ error: 'Failed to log weight' }, { status: 500 });
  }
}
