import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const goal = await prisma.userGoal.findUnique({ where: { userId: auth.session.userId } });
  return Response.json({ success: true, data: goal });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { dailyCalories, weeklyWorkouts, targetWeight } = body;

  const goal = await prisma.userGoal.upsert({
    where: { userId: auth.session.userId },
    update: {
      dailyCalories: dailyCalories != null ? Number(dailyCalories) : null,
      weeklyWorkouts: weeklyWorkouts != null ? Number(weeklyWorkouts) : null,
      targetWeight: targetWeight != null ? Number(targetWeight) : null,
    },
    create: {
      userId: auth.session.userId,
      dailyCalories: dailyCalories != null ? Number(dailyCalories) : null,
      weeklyWorkouts: weeklyWorkouts != null ? Number(weeklyWorkouts) : null,
      targetWeight: targetWeight != null ? Number(targetWeight) : null,
    },
  });

  return Response.json({ success: true, data: goal });
}
