import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

const WORKOUT_INCLUDE = {
  workoutExercises: {
    include: {
      exercise: true,
      sets: { orderBy: { createdAt: 'asc' as const } },
    },
  },
};

// GET /api/workouts-v2/live — return the user's in-progress workout, if any
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const workout = await prisma.workout.findFirst({
      where: { userId: auth.session.userId, status: 'IN_PROGRESS' },
      include: WORKOUT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: workout });
  } catch (error) {
    console.error('[GET /api/workouts-v2/live]', error);
    return NextResponse.json({ error: 'Failed to fetch live workout' }, { status: 500 });
  }
}

// POST /api/workouts-v2/live — start a live workout session
// Body: { date: 'YYYY-MM-DD' }
// If an in-progress workout already exists, it is returned instead of creating a second one.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { date } = await request.json();
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 });
    }

    const existing = await prisma.workout.findFirst({
      where: { userId: auth.session.userId, status: 'IN_PROGRESS' },
      include: WORKOUT_INCLUDE,
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, resumed: true });
    }

    const workout = await prisma.workout.create({
      data: {
        userId: auth.session.userId,
        date: new Date(`${date}T00:00:00.000Z`),
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: WORKOUT_INCLUDE,
    });

    return NextResponse.json({ success: true, data: workout }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/workouts-v2/live]', error);
    return NextResponse.json({ error: 'Failed to start workout' }, { status: 500 });
  }
}
