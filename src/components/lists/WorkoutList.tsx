'use client';

import type { WorkoutEntry } from '@/types';
import Button from '@/components/ui/Button';

interface WorkoutListProps {
  entries: WorkoutEntry[];
  onDelete: (id: string) => void;
}

export default function WorkoutList({ entries, onDelete }: WorkoutListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No workouts logged yet.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="border border-black p-4 flex items-start justify-between">
          <div className="min-w-0 mr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{entry.workoutType}</span>
              <span className="text-sm text-gray-500">{entry.duration} min</span>
            </div>
            {entry.notes && <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => onDelete(entry.id)}>
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}
