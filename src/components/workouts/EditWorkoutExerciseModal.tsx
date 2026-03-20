'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import type { WorkoutExercise } from '@/types';

interface SetDraft {
  weight: string;
  reps: string;
  effort: string;
}

interface EditWorkoutExerciseModalProps {
  workoutId: string;
  workoutExercise: WorkoutExercise;
  onClose: () => void;
  onSaved: () => void;
  onWorkoutDeleted: () => void;
}

function toDraft(set: { weight: number | null; reps: number | null; effort: number | null }): SetDraft {
  return {
    weight: set.weight != null ? String(set.weight) : '',
    reps: set.reps != null ? String(set.reps) : '',
    effort: set.effort != null ? String(set.effort) : '',
  };
}

function emptySet(): SetDraft {
  return { weight: '', reps: '', effort: '' };
}

export default function EditWorkoutExerciseModal({
  workoutId,
  workoutExercise,
  onClose,
  onSaved,
  onWorkoutDeleted,
}: EditWorkoutExerciseModalProps) {
  const { toast } = useToast();
  const [sets, setSets] = useState<SetDraft[]>(workoutExercise.sets.map(toDraft));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const updateSet = (idx: number, field: keyof SetDraft, value: string) => {
    setSets((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeSet = (idx: number) => {
    setSets((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSet = () => {
    setSets((prev) => [...prev, emptySet()]);
  };

  const handleSave = async () => {
    // Validate ranges
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      const setNum = i + 1;
      if (s.weight !== '') {
        const w = parseFloat(s.weight);
        if (isNaN(w) || w < 0 || w > 500) {
          setError(`Set ${setNum}: weight must be 0–500 kg`);
          return;
        }
      }
      if (s.reps !== '') {
        const r = parseInt(s.reps, 10);
        if (isNaN(r) || r < 1 || r > 50) {
          setError(`Set ${setNum}: reps must be 1–50`);
          return;
        }
      }
      if (s.effort !== '') {
        const e = parseInt(s.effort, 10);
        if (isNaN(e) || e < 1 || e > 10) {
          setError(`Set ${setNum}: RPE must be 1–10`);
          return;
        }
      }
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/workouts-v2/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutExerciseId: workoutExercise.id,
          sets: sets.map((s) => ({
            weight: s.weight !== '' ? parseFloat(s.weight) : null,
            reps: s.reps !== '' ? parseInt(s.reps, 10) : null,
            effort: s.effort !== '' ? parseInt(s.effort, 10) : null,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      toast('Changes saved!', 'success');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkout = async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/workouts-v2/${workoutId}?exerciseId=${workoutExercise.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to delete');
      }
      toast('Exercise deleted', 'info');
      onWorkoutDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setDeleting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-full sm:max-w-lg flex flex-col max-h-[90dvh] p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border shrink-0">
          <DialogTitle className="truncate">{workoutExercise.exercise.name}</DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Column headers */}
          <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.25rem] gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">#</span>
            <span className="text-xs font-medium text-muted-foreground text-center">kg</span>
            <span className="text-xs font-medium text-muted-foreground text-center">Reps</span>
            <span className="text-xs font-medium text-muted-foreground text-center">RPE</span>
            <span />
          </div>

          {/* Set rows */}
          <div className="space-y-1.5">
            {sets.map((set, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.25rem] gap-1.5 items-center"
              >
                <span className="text-xs text-muted-foreground text-center">{idx + 1}</span>
                <Input
                  type="number"
                  placeholder="—"
                  value={set.weight}
                  onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                  min="0"
                  max="500"
                  step="0.5"
                  aria-label={`Set ${idx + 1} weight`}
                  className="text-center text-sm h-8 px-1"
                />
                <Input
                  type="number"
                  placeholder="—"
                  value={set.reps}
                  onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                  min="1"
                  max="50"
                  aria-label={`Set ${idx + 1} reps`}
                  className="text-center text-sm h-8 px-1"
                />
                <Input
                  type="number"
                  placeholder="—"
                  value={set.effort}
                  onChange={(e) => updateSet(idx, 'effort', e.target.value)}
                  min="1"
                  max="10"
                  aria-label={`Set ${idx + 1} RPE`}
                  className="text-center text-sm h-8 px-1"
                />
                <button
                  onClick={() => removeSet(idx)}
                  aria-label={`Remove set ${idx + 1}`}
                  className="text-muted-foreground hover:text-destructive transition-colors text-base leading-none"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            ))}
          </div>

          {/* Add set */}
          <button
            onClick={addSet}
            className="w-full py-2 text-xs font-medium text-primary border border-dashed border-primary/40 rounded-md hover:bg-primary/5 transition-colors"
          >
            + Add Set
          </button>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          {/* Delete workout section */}
          <div className="pt-2 border-t border-border">
            {confirmDelete ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Delete {workoutExercise.exercise.name}? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteWorkout}
                    disabled={deleting}
                    className="flex-1"
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Delete exercise
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border gap-2 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
