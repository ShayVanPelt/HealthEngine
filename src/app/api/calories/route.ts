import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');   // YYYY-MM-DD
    const month = searchParams.get('month'); // YYYY-MM

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);

      const entries = await prisma.calorieEntry.findMany({
        where: { userId: auth.session.userId, createdAt: { gte: start, lt: end } },
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
      const [year, mon, day] = date.split('-').map(Number);
      const start = new Date(year, mon - 1, day, 0, 0, 0, 0);
      const end = new Date(year, mon - 1, day, 23, 59, 59, 999);

      const entries = await prisma.calorieEntry.findMany({
        where: { userId: auth.session.userId, createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, data: entries });
    }

    const entries = await prisma.calorieEntry.findMany({
      where: { userId: auth.session.userId },
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
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { mealName, calories, protein, carbs, fat } = await request.json();

    if (typeof calories !== 'number' || calories < 0 || calories > 50000) {
      return NextResponse.json({ error: 'calories must be a number between 0 and 50,000' }, { status: 400 });
    }

    if (!mealName || typeof mealName !== 'string' || !mealName.trim()) {
      return NextResponse.json({ error: 'mealName is required' }, { status: 400 });
    }

    if (mealName.trim().length > 200) {
      return NextResponse.json({ error: 'mealName must be 200 characters or fewer' }, { status: 400 });
    }

    const MAX_MACRO_G = 2000;
    if (protein !== null && protein !== undefined && (typeof protein !== 'number' || protein < 0 || protein > MAX_MACRO_G)) {
      return NextResponse.json({ error: `protein must be a number between 0 and ${MAX_MACRO_G}g` }, { status: 400 });
    }
    if (carbs !== null && carbs !== undefined && (typeof carbs !== 'number' || carbs < 0 || carbs > MAX_MACRO_G)) {
      return NextResponse.json({ error: `carbs must be a number between 0 and ${MAX_MACRO_G}g` }, { status: 400 });
    }
    if (fat !== null && fat !== undefined && (typeof fat !== 'number' || fat < 0 || fat > MAX_MACRO_G)) {
      return NextResponse.json({ error: `fat must be a number between 0 and ${MAX_MACRO_G}g` }, { status: 400 });
    }

    const entry = await prisma.calorieEntry.create({
      data: {
        userId: auth.session.userId,
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
