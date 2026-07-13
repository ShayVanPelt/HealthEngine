'use client';

import { Scale } from 'lucide-react';
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
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
        <div aria-hidden="true" className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
          <Scale className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">No entries yet</p>
        <p className="text-xs text-muted-foreground mt-1">Log your first weight to start tracking</p>
      </div>
    );
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
