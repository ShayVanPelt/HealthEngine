'use client';

import { Utensils } from 'lucide-react';
import type { CalorieEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatMacro } from '@/lib/units';

interface CalorieListProps {
  entries: CalorieEntry[];
  onDelete: (id: string) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export default function CalorieList({
  entries,
  onDelete,
  emptyTitle = 'No entries yet',
  emptySubtitle = 'Log your first meal to get started',
}: CalorieListProps) {
  const { preferences } = usePreferences();
  const { macros: macroUnit } = preferences.units;
  const calLabel = 'Cal';

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
        <div aria-hidden="true" className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
          <Utensils className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.id} className="animate-fade-in transition-colors hover:bg-muted/40">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Meal name */}
                <p className="text-base font-bold truncate" title={entry.mealName ?? undefined}>
                  {entry.mealName ?? 'Meal'}
                </p>

                {/* Calories */}
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-black text-primary tabular-nums">{entry.calories}</span>
                  <span className="text-xs text-muted-foreground">{calLabel}</span>
                </div>

                {/* Macros */}
                {(entry.protein !== null || entry.carbs !== null || entry.fat !== null) && (
                  <div className="flex gap-3 mt-1">
                    {entry.protein !== null && (
                      <span className="text-xs text-muted-foreground">
                        P <span className="font-semibold text-foreground">{formatMacro(entry.protein, macroUnit)}{macroUnit}</span>
                      </span>
                    )}
                    {entry.carbs !== null && (
                      <span className="text-xs text-muted-foreground">
                        C <span className="font-semibold text-foreground">{formatMacro(entry.carbs, macroUnit)}{macroUnit}</span>
                      </span>
                    )}
                    {entry.fat !== null && (
                      <span className="text-xs text-muted-foreground">
                        F <span className="font-semibold text-foreground">{formatMacro(entry.fat, macroUnit)}{macroUnit}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Delete */}
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${entry.mealName ?? 'entry'}`}
                onClick={() => onDelete(entry.id)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 h-8 px-2 text-xs mt-0.5"
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
