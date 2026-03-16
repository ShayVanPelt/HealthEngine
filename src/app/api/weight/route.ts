import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.weightEntry.findMany({
      where: { userId: session.userId },
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
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weight, bodyFat } = await request.json();

    if (typeof weight !== 'number' || weight <= 0) {
      return NextResponse.json({ error: 'weight (positive number) is required' }, { status: 400 });
    }

    const entry = await prisma.weightEntry.create({
      data: {
        userId: session.userId,
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
