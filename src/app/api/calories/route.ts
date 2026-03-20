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
    const date = searchParams.get('date');   // YYYY-MM-DD
    const month = searchParams.get('month'); // YYYY-MM

    if (month) {
      // Return array of date strings that have calorie entries in this month
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);

      const entries = await prisma.calorieEntry.findMany({
        where: { userId: session.userId, createdAt: { gte: start, lt: end } },
        select: { createdAt: true },
      });

      const dateSet = new Set(
        entries.map((e) => {
          const d = new Date(e.createdAt);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })
      );

      return NextResponse.json({ success: true, data: Array.from(dateSet) });
    }

    if (date) {
      // Filter entries for a specific date
      const [year, mon, day] = date.split('-').map(Number);
      const start = new Date(year, mon - 1, day, 0, 0, 0, 0);
      const end = new Date(year, mon - 1, day, 23, 59, 59, 999);

      const entries = await prisma.calorieEntry.findMany({
        where: { userId: session.userId, createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, data: entries });
    }

    // Default: return all entries
    const entries = await prisma.calorieEntry.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error('[GET /api/calories]', error);
    return NextResponse.json({ error: 'Failed to fetch calorie entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mealName, calories, protein, carbs, fat } = await request.json();

    if (typeof calories !== 'number' || calories < 0) {
      return NextResponse.json({ error: 'calories (number >= 0) is required' }, { status: 400 });
    }

    if (!mealName || typeof mealName !== 'string' || !mealName.trim()) {
      return NextResponse.json({ error: 'mealName is required' }, { status: 400 });
    }

    const entry = await prisma.calorieEntry.create({
      data: {
        userId: session.userId,
        mealName: mealName.trim(),
        calories,
        protein: protein ?? null,
        carbs: carbs ?? null,
        fat: fat ?? null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/calories]', error);
    return NextResponse.json({ error: 'Failed to log calories' }, { status: 500 });
  }
}
