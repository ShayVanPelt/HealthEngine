import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import StatCard from '@/components/ui/StatCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [todayCalories, latestWeight, weekWorkouts] = await Promise.all([
    prisma.calorieEntry.aggregate({
      where: { userId: session.userId, createdAt: { gte: todayStart } },
      _sum: { calories: true },
    }),
    prisma.weightEntry.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.workoutEntry.count({
      where: { userId: session.userId, createdAt: { gte: weekStart } },
    }),
  ]);

  const caloriesToday = todayCalories._sum.calories ?? 0;

  return (
    <div>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">Welcome back, {session.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Today's Calories"
          value={caloriesToday}
          unit="kcal"
          subtitle={caloriesToday === 0 ? 'No entries today' : 'Total for today'}
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
        />
        <StatCard
          title="Workouts This Week"
          value={weekWorkouts}
          unit={weekWorkouts === 1 ? 'session' : 'sessions'}
          subtitle="Since Sunday"
        />
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            { href: '/workouts', label: 'Log a workout' },
            { href: '/calories', label: 'Log calories' },
            { href: '/weight', label: 'Log weight' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <span className="text-violet-500 dark:text-violet-400">→</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
