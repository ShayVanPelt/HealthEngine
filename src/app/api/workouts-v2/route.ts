import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { validateSets, type SetInput } from '@/lib/workout-validation';

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
          status: 'COMPLETED',
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
          status: 'COMPLETED',
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
      const setError = validateSets(ex.sets);
      if (setError) {
        return NextResponse.json({ error: setError }, { status: 400 });
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

    const exercisesCreate = exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sets: {
        create: (ex.sets ?? []).map((s) => ({
          weight: s.weight ?? null,
          reps: s.reps ?? null,
          effort: s.effort ?? null,
        })),
      },
    }));

    const workoutInclude = {
      workoutExercises: {
        include: {
          exercise: true,
          sets: { orderBy: { createdAt: 'asc' as const } },
        },
      },
    };

    // If a completed workout already exists on this date, append the new exercises to it
    // instead of creating a duplicate session for the same day.
    const existing = await prisma.workout.findFirst({
      where: {
        userId: auth.session.userId,
        status: 'COMPLETED',
        date: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      const workout = await prisma.workout.update({
        where: { id: existing.id },
        data: { workoutExercises: { create: exercisesCreate } },
        include: workoutInclude,
      });
      return NextResponse.json({ success: true, data: workout }, { status: 200 });
    }

    const workout = await prisma.workout.create({
      data: {
        userId: auth.session.userId,
        date: new Date(`${date}T00:00:00.000Z`),
        workoutExercises: { create: exercisesCreate },
      },
      include: workoutInclude,
    });

    return NextResponse.json({ success: true, data: workout }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/workouts-v2]', error);
    return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
  }
}
