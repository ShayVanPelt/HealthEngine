import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.workoutEntry.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error('[GET /api/workouts]', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workoutType, duration, notes } = await request.json();

    if (
      typeof workoutType !== 'string' ||
      !workoutType.trim() ||
      typeof duration !== 'number' ||
      duration < 1
    ) {
      return NextResponse.json(
        { error: 'workoutType (string) and duration (number >= 1) are required' },
        { status: 400 }
      );
    }

    const entry = await prisma.workoutEntry.create({
      data: {
        userId: session.userId,
        workoutType: workoutType.trim(),
        duration,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/workouts]', error);
    return NextResponse.json({ error: 'Failed to log workout' }, { status: 500 });
  }
}
