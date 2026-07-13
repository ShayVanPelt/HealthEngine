import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/workouts-v2/[id]/complete — finish a live workout session.
// If the session has no logged sets it is deleted instead (abandoned workout).
export async function PATCH(_request: Request, { params }: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const workout = await prisma.workout.findFirst({
      where: { id, userId: auth.session.userId },
      include: { workoutExercises: { include: { sets: { select: { id: true } } } } },
    });
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    const hasSets = workout.workoutExercises.some((we) => we.sets.length > 0);
    if (!hasSets) {
      await prisma.workout.delete({ where: { id } });
      return NextResponse.json({ success: true, data: null, deleted: true });
    }

    // Drop exercises that never got a set so empty shells don't linger in the day view
    const emptyExerciseIds = workout.workoutExercises
      .filter((we) => we.sets.length === 0)
      .map((we) => we.id);
    if (emptyExerciseIds.length > 0) {
      await prisma.workoutExercise.deleteMany({ where: { id: { in: emptyExerciseIds } } });
    }

    const updated = await prisma.workout.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PATCH /api/workouts-v2/[id]/complete]', error);
    return NextResponse.json({ error: 'Failed to complete workout' }, { status: 500 });
  }
}
