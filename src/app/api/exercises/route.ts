import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exercises = await prisma.exercise.findMany({
      where: { userId: session.userId },
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
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name (string) is required' }, { status: 400 });
    }

    const exercise = await prisma.exercise.create({
      data: {
        userId: session.userId,
        name: name.trim(),
      },
    });

    return NextResponse.json({ success: true, data: exercise }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/exercises]', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
