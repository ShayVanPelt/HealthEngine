import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId query param is required' }, { status: 400 });
    }

    // Verify the exercise belongs to this user
    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId, userId: session.userId },
    });
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const history = await prisma.workoutExercise.findMany({
      where: {
        exerciseId,
        workout: { userId: session.userId },
      },
      include: {
        workout: { select: { id: true, date: true } },
        sets: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: {
        workout: { date: 'desc' },
      },
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('[GET /api/exercise-history]', error);
    return NextResponse.json({ error: 'Failed to fetch exercise history' }, { status: 500 });
  }
}
