'use client';

import type { CalorieEntry } from '@/types';
import Button from '@/components/ui/Button';

interface CalorieListProps {
  entries: CalorieEntry[];
  onDelete: (id: string) => void;
}

export default function CalorieList({ entries, onDelete }: CalorieListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No calorie entries yet.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="border border-black p-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-2xl font-bold">{entry.calories}</span>
              <span className="text-sm text-gray-500 ml-1">kcal</span>
            </div>
            <Button variant="danger" size="sm" onClick={() => onDelete(entry.id)}>
              Delete
            </Button>
          </div>

          {(entry.protein !== null || entry.carbs !== null || entry.fat !== null) && (
            <div className="flex gap-4 mt-2">
              {entry.protein !== null && (
                <span className="text-xs text-gray-600">P: {entry.protein}g</span>
              )}
              {entry.carbs !== null && (
                <span className="text-xs text-gray-600">C: {entry.carbs}g</span>
              )}
              {entry.fat !== null && (
                <span className="text-xs text-gray-600">F: {entry.fat}g</span>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            {new Date(entry.createdAt).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
