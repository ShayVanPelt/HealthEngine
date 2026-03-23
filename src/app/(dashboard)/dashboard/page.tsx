import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Flame, Scale } from 'lucide-react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Separator } from '@/components/ui/separator';
import GoalSetupCard from '@/components/dashboard/GoalSetupCard';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const QUICK_ACTIONS = [
  { href: '/workouts', label: 'Log a Workout', description: 'Track sets, reps & RPE', icon: Dumbbell },
  { href: '/calories', label: 'Log Calories', description: 'Record meals & macros', icon: Flame },
  { href: '/weight', label: 'Log Weight', description: 'Monitor your progress', icon: Scale },
];

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);

  const [
    todayCalories,
    yesterdayCalories,
    latestWeight,
    prevWeight,
    weekWorkouts,
    lastWeekWorkouts,
    goal,
    recentWorkout,
  ] = await Promise.all([
    prisma.calorieEntry.aggregate({
      where: { userId: session.userId, createdAt: { gte: todayStart } },
      _sum: { calories: true },
    }),
    prisma.calorieEntry.aggregate({
      where: { userId: session.userId, createdAt: { gte: yesterdayStart, lt: yesterdayEnd } },
      _sum: { calories: true },
    }),
    prisma.weightEntry.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.weightEntry.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      skip: 1,
    }),
    prisma.workout.count({
      where: { userId: session.userId, date: { gte: weekStart } },
    }),
    prisma.workout.count({
      where: { userId: session.userId, date: { gte: lastWeekStart, lt: weekStart } },
    }),
    prisma.userGoal.findUnique({ where: { userId: session.userId } }),
    prisma.workout.findFirst({
      where: { userId: session.userId },
      orderBy: { date: 'desc' },
    }),
  ]);

  const caloriesToday = todayCalories._sum.calories ?? 0;
  const caloriesYesterday = yesterdayCalories._sum.calories ?? 0;
  const weightDeltaKg =
    latestWeight && prevWeight ? +(latestWeight.weight - prevWeight.weight).toFixed(2) : null;

  const daysSinceWorkout = recentWorkout
    ? Math.floor(
        (now.getTime() - new Date(recentWorkout.date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-10 sm:mb-12 animate-fade-in-up">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">Dashboard</h1>
        <p className="text-muted-foreground mt-3 text-sm">{session.email}</p>
      </div>

      {/* Stat cards + smart suggestions (client component reads unit preferences) */}
      <DashboardStats
        caloriesToday={caloriesToday}
        caloriesYesterday={caloriesYesterday}
        latestWeightKg={latestWeight?.weight ?? null}
        latestWeightDate={latestWeight?.createdAt.toISOString() ?? null}
        weightDeltaKg={weightDeltaKg}
        weekWorkouts={weekWorkouts}
        lastWeekWorkouts={lastWeekWorkouts}
        dailyCalorieGoal={goal?.dailyCalories ?? null}
        weeklyWorkoutGoal={goal?.weeklyWorkouts ?? null}
        daysSinceWorkout={daysSinceWorkout}
        dayOfWeek={now.getDay()}
      />

      <Separator className="mb-8" />

      {/* Quick actions */}
      <div className="animate-fade-in-up" style={{ animationDelay: '360ms' }}>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg border border-border bg-card p-4',
                  'hover:border-primary/40 hover:bg-primary/5 transition-all duration-150',
                  'animate-scale-in'
                )}
                style={{ animationDelay: `${400 + i * 60}ms` }}
              >
                <span className="shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                  <Icon />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Goals section */}
      <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '520ms' }}>
        <GoalSetupCard
          goal={
            goal
              ? {
                  id: goal.id,
                  dailyCalories: goal.dailyCalories,
                  weeklyWorkouts: goal.weeklyWorkouts,
                  targetWeight: goal.targetWeight,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
