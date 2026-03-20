'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import type { Exercise } from '@/types';

interface SetDraft {
  weight: string;
  reps: string;
  effort: string;
}

interface ExerciseDraft {
  exerciseId: string;
  sets: SetDraft[];
}

interface AddWorkoutModalProps {
  exercises: Exercise[];
  onClose: () => void;
  onSuccess: (date: string) => void;
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseDateString(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return { year: y, month: m, day: d };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function emptySet(): SetDraft {
  return { weight: '', reps: '', effort: '' };
}

export default function AddWorkoutModal({ exercises, onClose, onSuccess }: AddWorkoutModalProps) {
  const { toast } = useToast();
  const [date, setDate] = useState(getTodayString);
  const [drafts, setDrafts] = useState<ExerciseDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { year, month, day } = parseDateString(date);

  const updateDate = (nextYear: number, nextMonth: number, nextDay: number) => {
    const maxDay = daysInMonth(nextYear, nextMonth);
    const clampedDay = Math.min(nextDay, maxDay);
    setDate(
      `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
    );
  };

  const availableExercises = useMemo(() => {
    const addedIds = new Set(drafts.map((d) => d.exerciseId));
    return exercises.filter((e) => !addedIds.has(e.id));
  }, [drafts, exercises]);

  const dayOptions = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
    [year, month]
  );

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i),
    []
  );

  const addExercise = (exerciseId: string) => {
    if (!exerciseId) return;
    setDrafts((prev) => [...prev, { exerciseId, sets: [emptySet()] }]);
  };

  const removeExercise = (exIdx: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== exIdx));
  };

  const addSet = (exIdx: number) => {
    setDrafts((prev) => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets, emptySet()] };
      return next;
    });
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setDrafts((prev) => {
      const next = [...prev];
      const newSets = next[exIdx].sets.filter((_, i) => i !== setIdx);
      if (newSets.length === 0) return next.filter((_, i) => i !== exIdx);
      next[exIdx] = { ...next[exIdx], sets: newSets };
      return next;
    });
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetDraft, value: string) => {
    setDrafts((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (drafts.length === 0) {
      setError('Add at least one exercise');
      return;
    }

    // Validate ranges
    for (const ex of drafts) {
      const exercise = exercises.find((e) => e.id === ex.exerciseId);
      for (let i = 0; i < ex.sets.length; i++) {
        const s = ex.sets[i];
        const setNum = i + 1;
        if (s.weight !== '') {
          const w = parseFloat(s.weight);
          if (isNaN(w) || w < 0 || w > 500) {
            setError(`${exercise?.name ?? 'Exercise'} set ${setNum}: weight must be 0–500 kg`);
            return;
          }
        }
        if (s.reps !== '') {
          const r = parseInt(s.reps, 10);
          if (isNaN(r) || r < 1 || r > 50) {
            setError(`${exercise?.name ?? 'Exercise'} set ${setNum}: reps must be 1–50`);
            return;
          }
        }
        if (s.effort !== '') {
          const e = parseInt(s.effort, 10);
          if (isNaN(e) || e < 1 || e > 10) {
            setError(`${exercise?.name ?? 'Exercise'} set ${setNum}: RPE must be 1–10`);
            return;
          }
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        date,
        exercises: drafts.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets.map((s) => ({
            weight: s.weight !== '' ? parseFloat(s.weight) : null,
            reps: s.reps !== '' ? parseInt(s.reps, 10) : null,
            effort: s.effort !== '' ? parseInt(s.effort, 10) : null,
          })),
        })),
      };

      const res = await fetch('/api/workouts-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save workout');
      }

      toast('Workout saved!', 'success');
      onSuccess(date);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-full sm:max-w-lg flex flex-col max-h-[90dvh] p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border shrink-0">
          <DialogTitle>Add Workout</DialogTitle>
          <DialogDescription>
            Log your sets for {date}.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Date picker */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Day */}
              <Select value={String(day)} onValueChange={(v) => updateDate(year, month, Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {String(d).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Month */}
              <Select value={String(month)} onValueChange={(v) => updateDate(year, Number(v), day)}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year */}
              <Select value={String(year)} onValueChange={(v) => updateDate(Number(v), month, day)}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exercise entries */}
          {drafts.map((ex, exIdx) => {
            const exercise = exercises.find((e) => e.id === ex.exerciseId);
            return (
              <div
                key={exIdx}
                className="border border-border rounded-lg overflow-hidden animate-scale-in"
              >
                {/* Exercise header row */}
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted">
                  <span className="font-medium text-sm truncate min-w-0">{exercise?.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExercise(exIdx)}
                    aria-label={`Remove ${exercise?.name ?? 'exercise'}`}
                    className="text-xs text-muted-foreground hover:text-destructive h-auto py-0.5 px-2"
                  >
                    Remove
                  </Button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.25rem] gap-1.5 px-4 pt-3 pb-1">
                  <span className="text-xs font-medium text-muted-foreground">#</span>
                  <span className="text-xs font-medium text-muted-foreground text-center">kg</span>
                  <span className="text-xs font-medium text-muted-foreground text-center">Reps</span>
                  <span className="text-xs font-medium text-muted-foreground text-center">RPE</span>
                  <span />
                </div>

                {/* Sets */}
                <div className="px-4 pb-3 space-y-1.5">
                  {ex.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.25rem] gap-1.5 items-center animate-fade-in-up"
                    >
                      <span className="text-xs text-muted-foreground text-center">{setIdx + 1}</span>
                      <Input
                        type="number"
                        placeholder="—"
                        value={set.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        min="0"
                        max="500"
                        step="0.5"
                        aria-label={`${exercise?.name ?? 'Exercise'} set ${setIdx + 1} weight in kg`}
                        className="text-center text-sm h-8 px-1"
                      />
                      <Input
                        type="number"
                        placeholder="—"
                        value={set.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        min="1"
                        max="50"
                        aria-label={`${exercise?.name ?? 'Exercise'} set ${setIdx + 1} reps`}
                        className="text-center text-sm h-8 px-1"
                      />
                      <Input
                        type="number"
                        placeholder="—"
                        value={set.effort}
                        onChange={(e) => updateSet(exIdx, setIdx, 'effort', e.target.value)}
                        min="1"
                        max="10"
                        aria-label={`${exercise?.name ?? 'Exercise'} set ${setIdx + 1} RPE`}
                        className="text-center text-sm h-8 px-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSet(exIdx, setIdx)}
                        aria-label={`Remove set ${setIdx + 1}`}
                        className="h-8 w-5 text-muted-foreground hover:text-destructive"
                      >
                        <span aria-hidden="true">×</span>
                      </Button>
                    </div>
                  ))}

                  {/* Add set button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSet(exIdx)}
                    className="mt-1 w-full text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                  >
                    + Add Set
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add exercise selector */}
          {availableExercises.length > 0 ? (
            <Select value="" onValueChange={(val) => addExercise(val)}>
              <SelectTrigger>
                <SelectValue placeholder="+ Add exercise to workout..." />
              </SelectTrigger>
              <SelectContent>
                {availableExercises.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>
                    {ex.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : exercises.length === 0 ? (
            <div className="py-3 text-center border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                No exercises yet — create one with &ldquo;+ Add Exercise&rdquo; first.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-1">
              All your exercises have been added.
            </p>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border gap-2 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || drafts.length === 0}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save Workout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
