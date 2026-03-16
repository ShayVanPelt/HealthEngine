import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.calorieEntry.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error('[GET /api/calories]', error);
    return NextResponse.json({ error: 'Failed to fetch calorie entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { calories, protein, carbs, fat } = await request.json();

    if (typeof calories !== 'number' || calories < 0) {
      return NextResponse.json({ error: 'calories (number >= 0) is required' }, { status: 400 });
    }

    const entry = await prisma.calorieEntry.create({
      data: {
        userId: session.userId,
        calories,
        protein: protein ?? null,
        carbs: carbs ?? null,
        fat: fat ?? null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/calories]', error);
    return NextResponse.json({ error: 'Failed to log calories' }, { status: 500 });
  }
}
