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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Workouts</h1>
        <p className="text-gray-500 mt-1 text-sm">Log and track your training sessions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-lg mb-4">Log Workout</h2>
          <Card>
            <WorkoutForm onSuccess={fetchEntries} />
          </Card>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-4">
            History
            {!loading && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
              </span>
            )}
          </h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <WorkoutList entries={entries} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  );
}
