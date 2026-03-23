import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
      const nextMonthStr =
        monthNum === 12
          ? `${year + 1}-01`
          : `${year}-${String(monthNum + 1).padStart(2, '0')}`;
      const startOfNextMonth = new Date(`${nextMonthStr}-01T00:00:00.000Z`);

      const workouts = await prisma.workout.findMany({
        where: {
          userId: auth.session.userId,
          date: { gte: startOfMonth, lt: startOfNextMonth },
        },
        select: { date: true },
      });

      const dates = [...new Set(workouts.map((w) => w.date.toISOString().split('T')[0]))];
      return NextResponse.json({ success: true, data: dates });
    }

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);

      const workouts = await prisma.workout.findMany({
        where: {
          userId: auth.session.userId,
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
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { date, exercises } = body as { date: string; exercises: ExerciseInput[] };

    if (!date || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: 'date (string) and exercises (non-empty array) are required' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 });
    }

    for (const ex of exercises) {
      if (typeof ex.exerciseId !== 'string' || !ex.exerciseId) {
        return NextResponse.json({ error: 'Each exercise must have a valid exerciseId' }, { status: 400 });
      }
      if (!Array.isArray(ex.sets) || ex.sets.length === 0) {
        return NextResponse.json({ error: 'Each exercise must have at least one set' }, { status: 400 });
      }
      for (const s of ex.sets) {
        if (s.weight !== null && s.weight !== undefined && (typeof s.weight !== 'number' || s.weight < 0 || s.weight > 1000)) {
          return NextResponse.json({ error: 'Set weight must be between 0 and 1,000 kg' }, { status: 400 });
        }
        if (s.reps !== null && s.reps !== undefined && (typeof s.reps !== 'number' || s.reps < 1 || s.reps > 50)) {
          return NextResponse.json({ error: 'Set reps must be between 1 and 50' }, { status: 400 });
        }
        if (s.effort !== null && s.effort !== undefined && (typeof s.effort !== 'number' || s.effort < 1 || s.effort > 10)) {
          return NextResponse.json({ error: 'Set effort (RPE) must be between 1 and 10' }, { status: 400 });
        }
      }
    }

    const exerciseIds = exercises.map((e) => e.exerciseId);
    const owned = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds }, userId: auth.session.userId },
      select: { id: true },
    });
    if (owned.length !== exerciseIds.length) {
      return NextResponse.json({ error: 'One or more exercises not found' }, { status: 400 });
    }

    const workout = await prisma.workout.create({
      data: {
        userId: auth.session.userId,
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
