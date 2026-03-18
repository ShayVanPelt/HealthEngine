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
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    if (month) {
      // Return distinct dates that have workouts — used for calendar highlighting
      const [year, monthNum] = month.split('-').map(Number);
      const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
      const nextMonthStr =
        monthNum === 12
          ? `${year + 1}-01`
          : `${year}-${String(monthNum + 1).padStart(2, '0')}`;
      const startOfNextMonth = new Date(`${nextMonthStr}-01T00:00:00.000Z`);

      const workouts = await prisma.workout.findMany({
        where: {
          userId: session.userId,
          date: { gte: startOfMonth, lt: startOfNextMonth },
        },
        select: { date: true },
      });

      const dates = [...new Set(workouts.map((w) => w.date.toISOString().split('T')[0]))];
      return NextResponse.json({ success: true, data: dates });
    }

    if (date) {
      // Return full workout data for a specific calendar date
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);

      const workouts = await prisma.workout.findMany({
        where: {
          userId: session.userId,
          date: { gte: dayStart, lte: dayEnd },
        },
        include: {
          workoutExercises: {
            include: {
              exercise: true,
              sets: { orderBy: { createdAt: 'asc' } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({ success: true, data: workouts });
    }

    return NextResponse.json(
      { error: 'Provide either ?date=YYYY-MM-DD or ?month=YYYY-MM' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[GET /api/workouts-v2]', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

interface SetInput {
  weight?: number | null;
  reps?: number | null;
  effort?: number | null;
}

interface ExerciseInput {
  exerciseId: string;
  sets: SetInput[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, exercises } = body as { date: string; exercises: ExerciseInput[] };

    if (!date || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: 'date (string) and exercises (non-empty array) are required' },
        { status: 400 }
      );
    }

    // Validate all exercise IDs belong to this user
    const exerciseIds = exercises.map((e) => e.exerciseId);
    const owned = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds }, userId: session.userId },
      select: { id: true },
    });
    if (owned.length !== exerciseIds.length) {
      return NextResponse.json({ error: 'One or more exercises not found' }, { status: 400 });
    }

    const workout = await prisma.workout.create({
      data: {
        userId: session.userId,
        date: new Date(`${date}T00:00:00.000Z`),
        workoutExercises: {
          create: exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            sets: {
              create: (ex.sets ?? []).map((s) => ({
                weight: s.weight ?? null,
                reps: s.reps ?? null,
                effort: s.effort ?? null,
              })),
            },
          })),
        },
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            sets: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: workout }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/workouts-v2]', error);
    return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
  }
}
