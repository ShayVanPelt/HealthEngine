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

  // Start of today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Start of this week (Sunday)
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Welcome back, {session.email}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
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

      {/* Quick actions */}
      <div className="border border-black p-6 max-w-xs">
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="space-y-2">
          {[
            { href: '/workouts', label: 'Log a workout' },
            { href: '/calories', label: 'Log calories' },
            { href: '/weight', label: 'Log weight' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="block text-sm text-gray-600 hover:text-black transition-colors"
            >
              → {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
