'use client';

import type { CalorieEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CalorieListProps {
  entries: CalorieEntry[];
  onDelete: (id: string) => void;
}

export default function CalorieList({ entries, onDelete }: CalorieListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No calorie entries yet.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">{entry.calories}</span>
                  <span className="text-sm text-muted-foreground">kcal</span>
                </div>

                {(entry.protein !== null || entry.carbs !== null || entry.fat !== null) && (
                  <div className="flex gap-4 mt-1.5">
                    {entry.protein !== null && (
                      <span className="text-xs text-muted-foreground">P: {entry.protein}g</span>
                    )}
                    {entry.carbs !== null && (
                      <span className="text-xs text-muted-foreground">C: {entry.carbs}g</span>
                    )}
                    {entry.fat !== null && (
                      <span className="text-xs text-muted-foreground">F: {entry.fat}g</span>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                aria-label={`Delete ${entry.calories} kcal entry`}
                onClick={() => onDelete(entry.id)}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
