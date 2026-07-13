'use client';

import { TrendingUp } from 'lucide-react';
import type { ExerciseHistoryEntry, ExerciseType } from '@/types';
import { Badge } from '@/components/ui/badge';
import LoadingDots from '@/components/ui/LoadingDots';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatWeight, convertWeight, convertEffortForDisplay } from '@/lib/units';

interface ExerciseHistoryViewProps {
  history: ExerciseHistoryEntry[];
  loading: boolean;
  exerciseType?: ExerciseType;
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

function getMaxReps(entry: ExerciseHistoryEntry): number | null {
  const reps = entry.sets.filter((s) => s.reps != null).map((s) => s.reps as number);
  return reps.length > 0 ? Math.max(...reps) : null;
}

function getTotalVolume(entry: ExerciseHistoryEntry): number {
  return entry.sets.reduce((acc, s) => {
    if (s.weight != null && s.reps != null) return acc + s.weight * s.reps;
    return acc;
  }, 0);
}

function getTotalReps(entry: ExerciseHistoryEntry): number {
  return entry.sets.reduce((acc, s) => acc + (s.reps ?? 0), 0);
}

export default function ExerciseHistoryView({ history, loading, exerciseType = 'WEIGHTED' }: ExerciseHistoryViewProps) {
  const { preferences } = usePreferences();
  const unit = preferences.units.liftingWeight;
  const effortUnit = preferences.units.effort;
  const isBodyweight = exerciseType === 'BODYWEIGHT';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingDots label="Loading exercise history" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div aria-hidden="true" className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
          <TrendingUp className="h-6 w-6" />
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
      {/* Summary row — all-time PR across every session */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pb-1">
        <span>{history.length} {history.length === 1 ? 'session' : 'sessions'}</span>
        {(() => {
          if (isBodyweight) {
            const maxReps = history.reduce<number | null>((best, e) => {
              const r = getMaxReps(e);
              return r != null && (best == null || r > best) ? r : best;
            }, null);
            if (maxReps == null) return null;
            return (
              <span>
                Best: <span className="font-semibold text-primary">{maxReps} reps</span>
              </span>
            );
          }
          const maxW = history.reduce<number | null>((best, e) => {
            const w = getMaxWeight(e);
            return w != null && (best == null || w > best) ? w : best;
          }, null);
          if (maxW == null) return null;
          return (
            <span>
              Best: <span className="font-semibold text-primary">{formatWeight(maxW, unit)}{unit}</span>
            </span>
          );
        })()}
      </div>

      {history.map((entry, idx) => {
        const prevEntry = idx < history.length - 1 ? history[idx + 1] : null;
        // Progress badge compares reps for bodyweight, max weight for weighted
        const current = isBodyweight ? getMaxReps(entry) : getMaxWeight(entry);
        const previous = prevEntry ? (isBodyweight ? getMaxReps(prevEntry) : getMaxWeight(prevEntry)) : null;
        const delta = current != null && previous != null ? current - previous : null;
        const volume = getTotalVolume(entry);
        const totalReps = getTotalReps(entry);

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
                {isBodyweight ? (
                  totalReps > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {totalReps.toLocaleString()} reps
                    </span>
                  )
                ) : (
                  volume > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {Math.round(convertWeight(volume, unit)).toLocaleString()}{unit} vol
                    </span>
                  )
                )}
                {delta !== null && delta !== 0 && (
                  <Badge
                    variant="secondary"
                    className={
                      delta > 0
                        ? 'bg-success/15 text-success hover:bg-success/15'
                        : 'bg-destructive/10 text-destructive hover:bg-destructive/10'
                    }
                  >
                    {delta > 0 ? '+' : ''}
                    {isBodyweight
                      ? `${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'rep' : 'reps'}`
                      : `${formatWeight(Math.abs(delta), unit)}${unit}`}
                  </Badge>
                )}
                {idx === 0 && previous === null && current !== null && (
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
                <span className="text-xs font-medium text-muted-foreground text-right">{effortUnit}</span>
              </div>
              {entry.sets.map((set, i) => (
                <div
                  key={set.id}
                  className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 py-2 border-t border-border/50"
                >
                  <span className="text-sm text-muted-foreground">{i + 1}</span>
                  <span className="text-sm text-right tabular-nums">
                    {isBodyweight
                      ? set.weight != null && set.weight > 0
                        ? `BW+${formatWeight(set.weight, unit)}${unit}`
                        : 'BW'
                      : set.weight != null
                        ? `${formatWeight(set.weight, unit)}${unit}`
                        : '—'}
                  </span>
                  <span className="text-sm text-right tabular-nums">
                    {set.reps != null ? set.reps : '—'}
                  </span>
                  <span className="text-sm text-right tabular-nums">
                    {set.effort != null ? convertEffortForDisplay(set.effort, effortUnit) : '—'}
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
