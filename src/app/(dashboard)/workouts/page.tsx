'use client';

import { useState, useEffect, useCallback } from 'react';
import WorkoutForm from '@/components/forms/WorkoutForm';
import WorkoutList from '@/components/lists/WorkoutList';
import Card from '@/components/ui/Card';
import type { WorkoutEntry } from '@/types';

export default function WorkoutsPage() {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/workouts');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/workouts/${id}`, { method: 'DELETE' });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold">Workouts</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">Log and track your training sessions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
        <div>
          <h2 className="font-semibold text-lg mb-3 text-zinc-900 dark:text-zinc-100">Log Workout</h2>
          <Card>
            <WorkoutForm onSuccess={fetchEntries} />
          </Card>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-3 text-zinc-900 dark:text-zinc-100">
            History
            {!loading && (
              <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-2">
                ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
              </span>
            )}
          </h2>

          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
          ) : (
            <WorkoutList entries={entries} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  );
}
