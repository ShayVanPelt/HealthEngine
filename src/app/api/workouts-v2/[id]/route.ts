import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { validateSets, type SetInput } from '@/lib/workout-validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE /api/workouts-v2/[id]?exerciseId=xxx — delete one exercise (and its sets).
// If no exerciseId is provided, deletes the entire workout session.
// If the workout has no remaining exercises after deletion, it is also deleted.
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const exerciseId = new URL(req.url).searchParams.get('exerciseId');

    const workout = await prisma.workout.findFirst({
      where: { id, userId: auth.session.userId },
      include: { workoutExercises: { select: { id: true } } },
    });

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    if (exerciseId) {
      const belongs = workout.workoutExercises.some((we) => we.id === exerciseId);
      if (!belongs) {
        return NextResponse.json({ error: 'Exercise not found in workout' }, { status: 404 });
      }

      await prisma.workoutExercise.delete({ where: { id: exerciseId } });

      if (workout.workoutExercises.length === 1) {
        await prisma.workout.delete({ where: { id } });
      }
    } else {
      await prisma.workout.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/workouts-v2/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
  }
}

// PATCH /api/workouts-v2/[id] — replace sets for one WorkoutExercise
// Body: { workoutExerciseId: string, sets: SetInput[] }
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { workoutExerciseId, sets } = body as {
      workoutExerciseId: string;
      sets: SetInput[];
    };

    if (!workoutExerciseId || !Array.isArray(sets)) {
      return NextResponse.json(
        { error: 'workoutExerciseId and sets are required' },
        { status: 400 }
      );
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: 'At least one set is required — remove the exercise instead to delete it' },
        { status: 400 }
      );
    }

    const setError = validateSets(sets);
    if (setError) {
      return NextResponse.json({ error: setError }, { status: 400 });
    }

    const workout = await prisma.workout.findFirst({
      where: { id, userId: auth.session.userId },
      include: { workoutExercises: { select: { id: true } } },
    });

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    const validExerciseIds = new Set(workout.workoutExercises.map((we) => we.id));
    if (!validExerciseIds.has(workoutExerciseId)) {
      return NextResponse.json({ error: 'Exercise not found in workout' }, { status: 404 });
    }

    await prisma.workoutSet.deleteMany({ where: { workoutExerciseId } });

    if (sets.length > 0) {
      await prisma.workoutSet.createMany({
        data: sets.map((s) => ({
          workoutExerciseId,
          weight: s.weight ?? null,
          reps: s.reps ?? null,
          effort: s.effort ?? null,
        })),
      });
    }

    const updated = await prisma.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
      include: {
        exercise: true,
        sets: { orderBy: { createdAt: 'asc' } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PATCH /api/workouts-v2/[id]]', error);
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 });
  }
}
