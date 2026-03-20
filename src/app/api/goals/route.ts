import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const goal = await prisma.userGoal.findUnique({ where: { userId: session.userId } });
  return NextResponse.json({ success: true, data: goal });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { dailyCalories, weeklyWorkouts, targetWeight } = body;

  const goal = await prisma.userGoal.upsert({
    where: { userId: session.userId },
    update: {
      dailyCalories: dailyCalories != null ? Number(dailyCalories) : null,
      weeklyWorkouts: weeklyWorkouts != null ? Number(weeklyWorkouts) : null,
      targetWeight: targetWeight != null ? Number(targetWeight) : null,
    },
    create: {
      userId: session.userId,
      dailyCalories: dailyCalories != null ? Number(dailyCalories) : null,
      weeklyWorkouts: weeklyWorkouts != null ? Number(weeklyWorkouts) : null,
      targetWeight: targetWeight != null ? Number(targetWeight) : null,
    },
  });

  return NextResponse.json({ success: true, data: goal });
}
