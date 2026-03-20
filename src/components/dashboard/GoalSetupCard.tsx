'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';

interface GoalData {
  id: string;
  dailyCalories: number | null;
  weeklyWorkouts: number | null;
  targetWeight: number | null;
}

interface GoalSetupCardProps {
  goal: GoalData | null;
}

export default function GoalSetupCard({ goal: initialGoal }: GoalSetupCardProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [goal, setGoal] = useState<GoalData | null>(initialGoal);

  const [dailyCalories, setDailyCalories] = useState(String(initialGoal?.dailyCalories ?? ''));
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(String(initialGoal?.weeklyWorkouts ?? ''));
  const [targetWeight, setTargetWeight] = useState(String(initialGoal?.targetWeight ?? ''));

  const hasGoals = goal?.dailyCalories || goal?.weeklyWorkouts || goal?.targetWeight;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyCalories: dailyCalories !== '' ? Number(dailyCalories) : null,
          weeklyWorkouts: weeklyWorkouts !== '' ? Number(weeklyWorkouts) : null,
          targetWeight: targetWeight !== '' ? Number(targetWeight) : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const { data } = await res.json();
      setGoal(data);
      setEditing(false);
      toast('Goals saved!', 'success');
    } catch {
      toast('Failed to save goals', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset draft fields back to saved values
    setDailyCalories(String(goal?.dailyCalories ?? ''));
    setWeeklyWorkouts(String(goal?.weeklyWorkouts ?? ''));
    setTargetWeight(String(goal?.targetWeight ?? ''));
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Goals
        </p>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground -mr-1"
            onClick={() => setEditing(true)}
          >
            {hasGoals ? 'Edit' : 'Set up goals'}
          </Button>
        )}
      </div>

      {editing ? (
        /* ── Edit form ── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Daily calories (kcal)</Label>
              <Input
                type="number"
                placeholder="e.g. 2200"
                value={dailyCalories}
                onChange={(e) => setDailyCalories(e.target.value)}
                min="0"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Weekly workouts</Label>
              <Input
                type="number"
                placeholder="e.g. 4"
                value={weeklyWorkouts}
                onChange={(e) => setWeeklyWorkouts(e.target.value)}
                min="0"
                max="14"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Target weight (kg)</Label>
              <Input
                type="number"
                placeholder="e.g. 75"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                min="0"
                step="0.1"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save goals'}
            </Button>
          </div>
        </div>
      ) : hasGoals ? (
        /* ── Goal chips ── */
        <div className="flex flex-wrap gap-3">
          {goal?.dailyCalories && (
            <GoalChip label="Daily calories" value={`${goal.dailyCalories.toLocaleString()} kcal`} />
          )}
          {goal?.weeklyWorkouts && (
            <GoalChip label="Weekly workouts" value={`${goal.weeklyWorkouts}×`} />
          )}
          {goal?.targetWeight && (
            <GoalChip label="Target weight" value={`${goal.targetWeight} kg`} />
          )}
        </div>
      ) : (
        /* ── Empty state ── */
        <p className="text-sm text-muted-foreground">
          Set daily calorie, workout, and weight goals to track progress on the cards above.
        </p>
      )}
    </div>
  );
}

function GoalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md bg-muted px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-bold text-foreground">{value}</span>
    </div>
  );
}
