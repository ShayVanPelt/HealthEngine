import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { validateSets } from '@/lib/workout-validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface LiveSetInput {
  weight?: number | null;
  reps?: number | null;
  effort?: number | null;
  completed?: boolean;
}

// PATCH /api/workouts-v2/[id]/sets — sync one exercise's sets during a live session.
// Body: { exerciseId: string, sets: LiveSetInput[] }
// Creates the WorkoutExercise on first sync, then replaces its sets on subsequent syncs.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const { exerciseId, sets } = (await request.json()) as {
      exerciseId: string;
      sets: LiveSetInput[];
    };

    if (!exerciseId || !Array.isArray(sets)) {
      return NextResponse.json({ error: 'exerciseId and sets are required' }, { status: 400 });
    }

    if (sets.length > 0) {
      const setError = validateSets(sets);
      if (setError) {
        return NextResponse.json({ error: setError }, { status: 400 });
      }
    }

    const workout = await prisma.workout.findFirst({
      where: { id, userId: auth.session.userId },
    });
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId, userId: auth.session.userId },
    });
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    let workoutExercise = await prisma.workoutExercise.findFirst({
      where: { workoutId: id, exerciseId },
    });
    if (!workoutExercise) {
      workoutExercise = await prisma.workoutExercise.create({
        data: { workoutId: id, exerciseId },
      });
    }

    await prisma.workoutSet.deleteMany({ where: { workoutExerciseId: workoutExercise.id } });
    if (sets.length > 0) {
      const now = new Date();
      await prisma.workoutSet.createMany({
        data: sets.map((s) => ({
          workoutExerciseId: workoutExercise.id,
          weight: s.weight ?? null,
          reps: s.reps ?? null,
          effort: s.effort ?? null,
          completedAt: s.completed ? now : null,
        })),
      });
    }

    const updated = await prisma.workoutExercise.findUnique({
      where: { id: workoutExercise.id },
      include: { exercise: true, sets: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PATCH /api/workouts-v2/[id]/sets]', error);
    return NextResponse.json({ error: 'Failed to sync sets' }, { status: 500 });
  }
}
