import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId query param is required' }, { status: 400 });
    }

    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId, userId: auth.session.userId },
    });
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const history = await prisma.workoutExercise.findMany({
      where: {
        exerciseId,
        workout: { userId: auth.session.userId },
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
