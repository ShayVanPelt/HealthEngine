import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const exercises = await prisma.exercise.findMany({
      where: { userId: auth.session.userId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: exercises });
  } catch (error) {
    console.error('[GET /api/exercises]', error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { name, type } = await request.json();

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name (string) is required' }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Exercise name must be 100 characters or fewer' }, { status: 400 });
    }

    const VALID_TYPES = ['WEIGHTED', 'BODYWEIGHT'] as const;
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'type must be WEIGHTED or BODYWEIGHT' }, { status: 400 });
    }

    const existing = await prisma.exercise.findFirst({
      where: { userId: auth.session.userId, name: { equals: name.trim(), mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ error: 'An exercise with this name already exists' }, { status: 409 });
    }

    const exercise = await prisma.exercise.create({
      data: {
        userId: auth.session.userId,
        name: name.trim(),
        type: type ?? 'WEIGHTED',
      },
    });

    return NextResponse.json({ success: true, data: exercise }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/exercises]', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
