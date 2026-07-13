'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatWeightWithUnit, formatWeight } from '@/lib/units';

interface DashboardStatsProps {
  caloriesToday: number;
  caloriesYesterday: number;
  latestWeightKg: number | null;
  latestWeightDate: string | null;
  weightDeltaKg: number | null;
  weekWorkouts: number;
  lastWeekWorkouts: number;
  dailyCalorieGoal: number | null;
  weeklyWorkoutGoal: number | null;
  targetWeightKg: number | null;
  daysSinceWorkout: number | null;
  dayOfWeek: number;
}

export default function DashboardStats({
  caloriesToday,
  caloriesYesterday,
  latestWeightKg,
  latestWeightDate,
  weightDeltaKg,
  weekWorkouts,
  lastWeekWorkouts,
  dailyCalorieGoal,
  weeklyWorkoutGoal,
  targetWeightKg,
  daysSinceWorkout,
  dayOfWeek,
}: DashboardStatsProps) {
  const { preferences } = usePreferences();
  const { bodyWeight } = preferences.units;
  const calLabel = 'Cal';

  const calorieDelta = caloriesToday - caloriesYesterday;
  const workoutDelta = weekWorkouts - lastWeekWorkouts;

  // Weight card subtitle — surface the target weight goal when set
  let weightSubtitle: string;
  if (latestWeightKg !== null && targetWeightKg !== null) {
    const toGoKg = Math.abs(latestWeightKg - targetWeightKg);
    weightSubtitle =
      toGoKg < 0.05
        ? `At your target of ${formatWeightWithUnit(targetWeightKg, bodyWeight)}`
        : `${formatWeightWithUnit(toGoKg, bodyWeight)} to your ${formatWeightWithUnit(targetWeightKg, bodyWeight)} target`;
  } else if (latestWeightKg !== null && latestWeightDate) {
    weightSubtitle = new Date(latestWeightDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } else {
    weightSubtitle = 'No entries yet';
  }

  // Build suggestions with destinations so users can act on them directly
  const suggestions: { text: string; href: string }[] = [];
  if (daysSinceWorkout !== null && daysSinceWorkout >= 3) {
    suggestions.push({
      text: `You haven't logged a workout in ${daysSinceWorkout} days — keep your streak going!`,
      href: '/workouts/live',
    });
  }
  if (caloriesToday === 0) {
    suggestions.push({
      text: "No calories logged today — don't forget to track your meals.",
      href: '/calories',
    });
  } else if (dailyCalorieGoal && caloriesToday < dailyCalorieGoal * 0.5) {
    suggestions.push({
      text: `You're at ${caloriesToday} ${calLabel} — less than half your daily goal.`,
      href: '/calories',
    });
  }
  if (weeklyWorkoutGoal && weekWorkouts < weeklyWorkoutGoal && dayOfWeek >= 5) {
    const remaining = weeklyWorkoutGoal - weekWorkouts;
    suggestions.push({
      text: `${remaining} more workout${remaining > 1 ? 's' : ''} to hit your weekly goal.`,
      href: '/workouts/live',
    });
  }

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10">
        <StatCard
          title="Today's Calories"
          value={caloriesToday}
          unit={calLabel}
          subtitle={caloriesToday === 0 ? 'No entries today' : 'Total for today'}
          animationDelay="80ms"
          trend={
            caloriesYesterday > 0
              ? { delta: calorieDelta, label: 'vs yesterday', positiveDirection: 'neutral' }
              : undefined
          }
          progress={
            dailyCalorieGoal
              ? { current: caloriesToday, goal: dailyCalorieGoal, label: 'Daily goal' }
              : undefined
          }
        />
        <StatCard
          title="Latest Weight"
          value={
            latestWeightKg !== null ? formatWeight(latestWeightKg, bodyWeight) : '--'
          }
          unit={latestWeightKg !== null ? bodyWeight : undefined}
          subtitle={weightSubtitle}
          animationDelay="180ms"
          trend={
            weightDeltaKg !== null
              ? {
                  delta: parseFloat(formatWeight(Math.abs(weightDeltaKg), bodyWeight)) * (weightDeltaKg < 0 ? -1 : 1),
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
              ? { delta: workoutDelta, label: 'vs last week', positiveDirection: 'up' }
              : undefined
          }
          progress={
            weeklyWorkoutGoal
              ? { current: weekWorkouts, goal: weeklyWorkoutGoal, label: 'Weekly goal' }
              : undefined
          }
        />
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-2">
            {suggestions.map((s, i) => (
              <Link
                key={i}
                href={s.href}
                className="flex items-start gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="mt-0.5 shrink-0 text-primary">
                  <Bell size={16} />
                </span>
                <span>{s.text}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
