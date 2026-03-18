'use client';

import type { ExerciseHistoryEntry } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ExerciseHistoryViewProps {
  history: ExerciseHistoryEntry[];
  loading: boolean;
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function getMaxWeight(entry: ExerciseHistoryEntry): number | null {
  const weights = entry.sets
    .filter((s) => s.weight != null)
    .map((s) => s.weight as number);
  return weights.length > 0 ? Math.max(...weights) : null;
}

function getTotalVolume(entry: ExerciseHistoryEntry): number {
  return entry.sets.reduce((acc, s) => {
    if (s.weight != null && s.reps != null) return acc + s.weight * s.reps;
    return acc;
  }, 0);
}

export default function ExerciseHistoryView({ history, loading }: ExerciseHistoryViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div role="status" aria-label="Loading exercise history" className="flex gap-1">
          <span className="sr-only">Loading exercise history…</span>
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

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div aria-hidden="true" className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-2xl">
          📈
        </div>
        <p className="text-sm text-muted-foreground">No history yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Log a workout with this exercise to see your progress
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pb-1">
        <span>{history.length} {history.length === 1 ? 'session' : 'sessions'}</span>
        {(() => {
          const maxW = getMaxWeight(history[0]);
          if (!maxW) return null;
          return (
            <span>
              Best: <span className="font-semibold text-primary">{maxW}kg</span>
            </span>
          );
        })()}
      </div>

      {history.map((entry, idx) => {
        const maxWeight = getMaxWeight(entry);
        const prevMaxWeight = idx < history.length - 1 ? getMaxWeight(history[idx + 1]) : null;
        const delta =
          maxWeight != null && prevMaxWeight != null ? maxWeight - prevMaxWeight : null;
        const volume = getTotalVolume(entry);

        return (
          <div
            key={entry.id}
            className="border border-border rounded-xl overflow-hidden"
          >
            {/* Session header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/50">
              <span className="text-sm font-medium truncate min-w-0">
                {formatDisplayDate(entry.workout.date)}
              </span>
              <div className="flex items-center gap-2">
                {volume > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {volume.toLocaleString()}kg vol
                  </span>
                )}
                {delta !== null && delta !== 0 && (
                  <Badge
                    variant="secondary"
                    className={
                      delta > 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100'
                    }
                  >
                    {delta > 0 ? '+' : ''}{delta}kg
                  </Badge>
                )}
                {idx === 0 && prevMaxWeight === null && maxWeight !== null && (
                  <span className="text-xs text-muted-foreground italic">First session</span>
                )}
              </div>
            </div>

            {/* Sets */}
            <div className="px-4 py-3">
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">Set</span>
                <span className="text-xs font-medium text-muted-foreground text-right">Weight</span>
                <span className="text-xs font-medium text-muted-foreground text-right">Reps</span>
                <span className="text-xs font-medium text-muted-foreground text-right">RPE</span>
              </div>
              {entry.sets.map((set, i) => (
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
          </div>
        );
      })}
    </div>
  );
}
