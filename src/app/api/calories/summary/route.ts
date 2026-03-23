import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export interface CalorieSummaryDay {
  date: string; // YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// GET /api/calories/summary?days=30
// Returns per-day aggregated totals for the last N days (default 30, max 90)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const rawDays = Number(searchParams.get('days') ?? '30');
    const days = Math.min(90, Math.max(1, isNaN(rawDays) ? 30 : rawDays));

    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const entries = await prisma.calorieEntry.findMany({
      where: { userId: auth.session.userId, createdAt: { gte: since } },
      select: { createdAt: true, calories: true, protein: true, carbs: true, fat: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by local date string (YYYY-MM-DD)
    const map = new Map<string, CalorieSummaryDay>();
    for (const e of entries) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = map.get(key) ?? { date: key, calories: 0, protein: 0, carbs: 0, fat: 0 };
      existing.calories += e.calories;
      existing.protein += e.protein ?? 0;
      existing.carbs += e.carbs ?? 0;
      existing.fat += e.fat ?? 0;
      map.set(key, existing);
    }

    return NextResponse.json({ success: true, data: Array.from(map.values()) });
  } catch (error) {
    console.error('[GET /api/calories/summary]', error);
    return NextResponse.json({ error: 'Failed to fetch calorie summary' }, { status: 500 });
  }
}
