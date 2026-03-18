'use client';

import type { Workout } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface WorkoutDayViewProps {
  date: string;
  workouts: Workout[];
  loading: boolean;
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function WorkoutDayView({ date, workouts, loading }: WorkoutDayViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div role="status" aria-label="Loading workouts" className="flex gap-1">
          <span className="sr-only">Loading workouts…</span>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div aria-hidden="true" className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-2xl">
          🏋️
        </div>
        <p className="text-sm text-muted-foreground">No workouts on this day</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Click &ldquo;+ Add Workout&rdquo; to log one
        </p>
      </div>
    );
  }

  const totalSets = workouts.reduce(
    (acc, w) => acc + w.workoutExercises.reduce((a, we) => a + we.sets.length, 0),
    0
  );
  const totalExercises = workouts.reduce((acc, w) => acc + w.workoutExercises.length, 0);

  return (
    <div className="space-y-5">
      {/* Day header */}
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">
          {formatDisplayDate(date)}
        </p>
        <span className="text-xs text-muted-foreground">
          {totalExercises} {totalExercises === 1 ? 'exercise' : 'exercises'} · {totalSets}{' '}
          {totalSets === 1 ? 'set' : 'sets'}
        </span>
      </div>

      {workouts.map((workout) =>
        workout.workoutExercises.map((we) => (
          <Card key={we.id} className="overflow-hidden">
            <CardHeader className="px-4 py-3 bg-muted/50 flex-row items-center justify-between space-y-0 gap-2">
              <h3 className="font-medium text-sm truncate min-w-0">{we.exercise.name}</h3>
              <span className="text-xs text-muted-foreground">
                {we.sets.length} {we.sets.length === 1 ? 'set' : 'sets'}
              </span>
            </CardHeader>

            <CardContent className="px-4 py-3">
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">Set</span>
                <span className="text-xs font-medium text-muted-foreground text-right">Weight</span>
                <span className="text-xs font-medium text-muted-foreground text-right">Reps</span>
                <span className="text-xs font-medium text-muted-foreground text-right">RPE</span>
              </div>
              <div className="space-y-0">
                {we.sets.map((set, i) => (
                  <div
                    key={set.id}
                    className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 py-2 border-t border-border/50"
                  >
                    <span className="text-sm text-muted-foreground">{i + 1}</span>
                    <span className="text-sm text-right tabular-nums">
                      {set.weight != null ? `${set.weight}kg` : '—'}
                    </span>
                    <span className="text-sm text-right tabular-nums">
                      {set.reps != null ? set.reps : '—'}
                    </span>
                    <span className="text-sm text-right tabular-nums">
                      {set.effort != null ? set.effort : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
