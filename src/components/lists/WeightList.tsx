'use client';

import type { WeightEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatWeight } from '@/lib/units';

interface WeightListProps {
  entries: WeightEntry[];
  onDelete: (id: string) => void;
}

export default function WeightList({ entries, onDelete }: WeightListProps) {
  const { preferences } = usePreferences();
  const unit = preferences.units.bodyWeight;

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No weight entries yet.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-primary">{formatWeight(entry.weight, unit)}</span>
                <span className="text-sm text-muted-foreground">{unit}</span>
                {entry.bodyFat !== null && (
                  <span className="text-sm text-muted-foreground">{entry.bodyFat}% body fat</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
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
              variant="ghost"
              size="sm"
              aria-label={`Delete ${formatWeight(entry.weight, unit)}${unit} entry`}
              onClick={() => onDelete(entry.id)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
