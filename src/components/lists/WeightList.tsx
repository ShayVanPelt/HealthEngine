'use client';

import type { WeightEntry } from '@/types';
import Button from '@/components/ui/Button';

interface WeightListProps {
  entries: WeightEntry[];
  onDelete: (id: string) => void;
}

export default function WeightList({ entries, onDelete }: WeightListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No weight entries yet.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="border border-black p-4 flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold">{entry.weight}</span>
              <span className="text-sm text-gray-500">kg</span>
              {entry.bodyFat !== null && (
                <span className="text-sm text-gray-500">{entry.bodyFat}% body fat</span>
              )}
            </div>
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
