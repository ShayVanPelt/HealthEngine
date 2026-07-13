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
import type { Exercise } from '@/types';

interface EditExerciseModalProps {
  exercise: Exercise;
  onClose: () => void;
  onUpdated: (exercise: Exercise) => void;
  onDeleted: (exerciseId: string) => void;
}

export default function EditExerciseModal({
  exercise,
  onClose,
  onUpdated,
  onDeleted,
}: EditExerciseModalProps) {
  const [name, setName] = useState(exercise.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === exercise.name) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to update exercise');
      }

      const { data } = await response.json();
      onUpdated(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/exercises/${exercise.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to delete exercise');
      }

      onDeleted(exercise.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{confirmingDelete ? 'Delete exercise?' : 'Edit Exercise'}</DialogTitle>
          <DialogDescription>
            {confirmingDelete
              ? `This permanently deletes ${exercise.name} and all of its workout history.`
              : 'Rename this exercise everywhere it appears.'}
          </DialogDescription>
        </DialogHeader>

        {confirmingDelete ? (
          <>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setError('');
                }}
                disabled={loading}
              >
                Keep Exercise
              </Button>
              <Button variant="destructive" type="button" onClick={handleDelete} disabled={loading}>
                {loading ? 'Deleting…' : 'Delete Exercise'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="editExerciseName">Exercise name</Label>
              <Input
                id="editExerciseName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                autoFocus
                required
              />
            </div>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="min-h-11 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Delete exercise and history
            </button>

            <DialogFooter className="gap-2">
              <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !name.trim() || name.trim() === exercise.name}
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
