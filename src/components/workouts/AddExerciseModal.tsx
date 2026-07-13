'use client';

import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import type { Exercise, ExerciseType } from '@/types';

interface AddExerciseModalProps {
  onClose: () => void;
  onSuccess: (exercise: Exercise) => void;
}

const TYPE_OPTIONS: { value: ExerciseType; label: string; hint: string }[] = [
  { value: 'WEIGHTED', label: 'Weighted', hint: 'Barbell, dumbbell, machine' },
  { value: 'BODYWEIGHT', label: 'Bodyweight', hint: 'Pull-ups, push-ups, dips' },
];

export default function AddExerciseModal({ onClose, onSuccess }: AddExerciseModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ExerciseType>('WEIGHTED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create exercise');
      }

      const { data } = await res.json();
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise to your library.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="exerciseName">Exercise name</Label>
            <Input
              id="exerciseName"
              type="text"
              placeholder="e.g. Bench Press, Squat, Pull-up"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Exercise type</Label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  aria-pressed={type === opt.value}
                  className={cn(
                    'rounded-md border p-3 text-left transition-colors',
                    type === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{opt.hint}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Adding...' : 'Add Exercise'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
