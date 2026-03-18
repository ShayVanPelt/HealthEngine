'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface WorkoutFormProps {
  onSuccess: () => void;
}

export default function WorkoutForm({ onSuccess }: WorkoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ workoutType: '', duration: '', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutType: form.workoutType,
          duration: parseInt(form.duration),
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to log workout');
      }

      setForm({ workoutType: '', duration: '', notes: '' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Workout Type
        </label>
        <input
          type="text"
          placeholder="e.g. Running, Weight Training, Yoga"
          value={form.workoutType}
          onChange={(e) => setForm({ ...form, workoutType: e.target.value })}
          required
          className="form-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Duration (minutes)
        </label>
        <input
          type="number"
          placeholder="30"
          min="1"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          required
          className="form-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Notes (optional)
        </label>
        <textarea
          placeholder="Any notes about this workout..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="form-input resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging...' : 'Log Workout'}
      </Button>
    </form>
  );
}
