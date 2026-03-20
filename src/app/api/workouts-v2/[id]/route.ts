import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE /api/workouts-v2/[id]?exerciseId=xxx — delete one exercise (and its sets).
// If no exerciseId is provided, deletes the entire workout session.
// If the workout has no remaining exercises after deletion, it is also deleted.
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const exerciseId = new URL(req.url).searchParams.get('exerciseId');

    const workout = await prisma.workout.findFirst({
      where: { id, userId: session.userId },
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

      // Clean up the parent workout if it's now empty
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

interface SetInput {
  weight?: number | null;
  reps?: number | null;
  effort?: number | null;
}

// PATCH /api/workouts-v2/[id] — replace sets for one WorkoutExercise
// Body: { workoutExerciseId: string, sets: SetInput[] }
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Verify the workout belongs to this user
    const workout = await prisma.workout.findFirst({
      where: { id, userId: session.userId },
      include: { workoutExercises: { select: { id: true } } },
    });

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    const validExerciseIds = new Set(workout.workoutExercises.map((we) => we.id));
    if (!validExerciseIds.has(workoutExerciseId)) {
      return NextResponse.json({ error: 'Exercise not found in workout' }, { status: 404 });
    }

    // Replace all sets: delete existing, create new
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

    // Return updated workout
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
