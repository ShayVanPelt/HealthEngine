'use client';

import { useState, useMemo } from 'react';
import type { Workout, WorkoutExercise } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import EditWorkoutExerciseModal from './EditWorkoutExerciseModal';

interface WorkoutDayViewProps {
  date: string;
  workouts: Workout[];
  loading: boolean;
  onRefresh: () => void;
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

function calcVolume(sets: WorkoutExercise['sets']): number {
  return sets.reduce((acc, s) => {
    if (s.weight != null && s.reps != null) acc += s.weight * s.reps;
    return acc;
  }, 0);
}

function PencilIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function WorkoutDayView({ date, workouts, loading, onRefresh }: WorkoutDayViewProps) {
  const [editing, setEditing] = useState<{ workoutId: string; workoutExercise: WorkoutExercise } | null>(null);

  const { totalSets, totalExercises, totalVolume, exercises } = useMemo(() => {
    let sets = 0;
    let exCount = 0;
    let volume = 0;
    const flat: { we: WorkoutExercise; workoutId: string }[] = [];
    for (const w of workouts) {
      exCount += w.workoutExercises.length;
      for (const we of w.workoutExercises) {
        sets += we.sets.length;
        volume += calcVolume(we.sets);
        flat.push({ we, workoutId: w.id });
      }
    }
    return { totalSets: sets, totalExercises: exCount, totalVolume: volume, exercises: flat };
  }, [workouts]);

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
        <p className="text-sm font-semibold text-foreground">No workouts on this day</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Click &ldquo;+ Add Workout&rdquo; to log one
        </p>
      </div>
    );
  }

  return (
    <>
      {/* key={date} remounts this div when date changes, replaying the animations */}
      <div key={date} className="space-y-5 animate-fade-in">
        {/* Day header */}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-muted-foreground">
            {formatDisplayDate(date)}
          </p>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {totalExercises} {totalExercises === 1 ? 'exercise' : 'exercises'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary">
              {totalSets} {totalSets === 1 ? 'set' : 'sets'}
            </span>
            {totalVolume > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {totalVolume.toLocaleString()} kg vol
              </span>
            )}
          </div>
        </div>

        {exercises.map(({ we, workoutId }, cardIdx) => {
          const volume = calcVolume(we.sets);
          return (
            <Card
              key={we.id}
              className="overflow-hidden animate-scale-in"
              style={{ animationDelay: `${cardIdx * 60}ms` }}
            >
              <CardHeader className="px-4 py-3 bg-primary/8 flex-row items-center justify-between space-y-0 gap-2 border-b border-border">
                <div className="min-w-0">
                  <h3 className="font-bold text-base truncate">{we.exercise.name}</h3>
                  {volume > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {volume.toLocaleString()} kg total volume
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {we.sets.length} {we.sets.length === 1 ? 'set' : 'sets'}
                  </span>
                  <button
                    onClick={() => setEditing({ workoutId, workoutExercise: we })}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label={`Edit ${we.exercise.name}`}
                  >
                    <PencilIcon />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="px-4 py-3">
                <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Set</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Weight</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Reps</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">RPE</span>
                </div>
                <div className="space-y-0">
                  {we.sets.map((set, i) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 py-2 border-t border-border/50"
                    >
                      <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                      <span className="text-sm font-semibold text-right tabular-nums">
                        {set.weight != null ? `${set.weight}kg` : '—'}
                      </span>
                      <span className="text-sm font-semibold text-right tabular-nums">
                        {set.reps != null ? set.reps : '—'}
                      </span>
                      <span className="text-sm font-semibold text-right tabular-nums">
                        {set.effort != null ? set.effort : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing && (
        <EditWorkoutExerciseModal
          workoutId={editing.workoutId}
          workoutExercise={editing.workoutExercise}
          onClose={() => setEditing(null)}
          onSaved={onRefresh}
          onWorkoutDeleted={onRefresh}
        />
      )}
    </>
  );
}
