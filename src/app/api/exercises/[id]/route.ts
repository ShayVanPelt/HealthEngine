import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/exercises/[id] — rename an exercise and/or change its type
// Body: { name?: string, type?: 'WEIGHTED' | 'BODYWEIGHT' }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const { name, type } = await request.json();

    const exercise = await prisma.exercise.findFirst({
      where: { id, userId: auth.session.userId },
    });
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 });
      }
      if (name.trim().length > 100) {
        return NextResponse.json({ error: 'Exercise name must be 100 characters or fewer' }, { status: 400 });
      }
      const duplicate = await prisma.exercise.findFirst({
        where: {
          userId: auth.session.userId,
          id: { not: id },
          name: { equals: name.trim(), mode: 'insensitive' },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'An exercise with this name already exists' }, { status: 409 });
      }
    }

    const VALID_TYPES = ['WEIGHTED', 'BODYWEIGHT'] as const;
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'type must be WEIGHTED or BODYWEIGHT' }, { status: 400 });
    }

    const updated = await prisma.exercise.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(type !== undefined ? { type } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PATCH /api/exercises/[id]]', error);
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
  }
}

// DELETE /api/exercises/[id] — delete an exercise and its workout history.
// Cascading relations remove WorkoutExercise and WorkoutSet rows; workouts left empty are removed.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const exercise = await prisma.exercise.findFirst({
      where: { id, userId: auth.session.userId },
      include: {
        workoutExercises: {
          select: { workoutId: true },
        },
      },
    });
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const affectedWorkoutIds = exercise.workoutExercises.map(({ workoutId }) => workoutId);
    await prisma.$transaction(async (tx) => {
      await tx.exercise.delete({ where: { id } });
      if (affectedWorkoutIds.length > 0) {
        await tx.workout.deleteMany({
          where: {
            id: { in: affectedWorkoutIds },
            userId: auth.session.userId,
            workoutExercises: { none: {} },
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/exercises/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
  }
}
