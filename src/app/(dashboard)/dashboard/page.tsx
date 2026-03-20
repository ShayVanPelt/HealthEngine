import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import StatCard from '@/components/ui/StatCard';
import { Separator } from '@/components/ui/separator';
import GoalSetupCard from '@/components/dashboard/GoalSetupCard';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Icons (inline SVG — no extra deps)
function DumbbellIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12v6H6z" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 110 18M12 3L4.5 9M12 3l7.5 6M4.5 9L3 21h18l-1.5-12" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

const QUICK_ACTIONS = [
  {
    href: '/workouts',
    label: 'Log a Workout',
    description: 'Track sets, reps & RPE',
    icon: DumbbellIcon,
  },
  {
    href: '/calories',
    label: 'Log Calories',
    description: 'Record meals & macros',
    icon: FlameIcon,
  },
  {
    href: '/weight',
    label: 'Log Weight',
    description: 'Monitor your progress',
    icon: ScaleIcon,
  },
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
  const calorieDelta = caloriesToday - caloriesYesterday;

  const weightDelta =
    latestWeight && prevWeight ? +(latestWeight.weight - prevWeight.weight).toFixed(2) : null;

  const workoutDelta = weekWorkouts - lastWeekWorkouts;

  // Smart suggestions
  const suggestions: string[] = [];

  const daysSinceWorkout = recentWorkout
    ? Math.floor(
        (now.getTime() - new Date(recentWorkout.date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  if (daysSinceWorkout !== null && daysSinceWorkout >= 3) {
    suggestions.push(`You haven't logged a workout in ${daysSinceWorkout} days — keep your streak going!`);
  }
  if (caloriesToday === 0) {
    suggestions.push("No calories logged today — don't forget to track your meals.");
  } else if (goal?.dailyCalories && caloriesToday < goal.dailyCalories * 0.5) {
    suggestions.push(`You're at ${caloriesToday} kcal — less than half your daily goal.`);
  }
  if (goal?.weeklyWorkouts && weekWorkouts < goal.weeklyWorkouts && now.getDay() >= 5) {
    suggestions.push(`${goal.weeklyWorkouts - weekWorkouts} more workout${goal.weeklyWorkouts - weekWorkouts > 1 ? 's' : ''} to hit your weekly goal.`);
  }


  return (
    <div>
      {/* Header */}
      <div className="mb-10 sm:mb-12 animate-fade-in-up">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">Dashboard</h1>
        <p className="text-muted-foreground mt-3 text-sm">{session.email}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10">
        <StatCard
          title="Today's Calories"
          value={caloriesToday}
          unit="kcal"
          subtitle={caloriesToday === 0 ? 'No entries today' : 'Total for today'}
          animationDelay="80ms"
          trend={
            caloriesYesterday > 0
              ? {
                  delta: calorieDelta,
                  label: 'vs yesterday',
                  positiveDirection: 'neutral',
                }
              : undefined
          }
          progress={
            goal?.dailyCalories
              ? { current: caloriesToday, goal: goal.dailyCalories, label: 'Daily goal' }
              : undefined
          }
        />
        <StatCard
          title="Latest Weight"
          value={latestWeight ? latestWeight.weight : '--'}
          unit={latestWeight ? 'kg' : undefined}
          subtitle={
            latestWeight
              ? new Date(latestWeight.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'No entries yet'
          }
          animationDelay="180ms"
          trend={
            weightDelta !== null
              ? {
                  delta: weightDelta,
                  label: 'since last entry',
                  positiveDirection: 'down',
                }
              : undefined
          }
        />
        <StatCard
          title="Workouts This Week"
          value={weekWorkouts}
          unit={weekWorkouts === 1 ? 'session' : 'sessions'}
          subtitle="Since Sunday"
          animationDelay="280ms"
          trend={
            lastWeekWorkouts > 0 || weekWorkouts > 0
              ? {
                  delta: workoutDelta,
                  label: 'vs last week',
                  positiveDirection: 'up',
                }
              : undefined
          }
          progress={
            goal?.weeklyWorkouts
              ? { current: weekWorkouts, goal: goal.weeklyWorkouts, label: 'Weekly goal' }
              : undefined
          }
        />
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-0.5 shrink-0 text-primary">
                  <BellIcon />
                </span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
