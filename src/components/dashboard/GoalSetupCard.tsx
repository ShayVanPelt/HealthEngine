'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { usePreferences } from '@/contexts/PreferencesContext';
import { convertWeight, weightInputToKg } from '@/lib/units';

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
  const { preferences } = usePreferences();
  const wtUnit = preferences.units.bodyWeight;
  const calLabel = 'Cal';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [goal, setGoal] = useState<GoalData | null>(initialGoal);

  const [dailyCalories, setDailyCalories] = useState(String(initialGoal?.dailyCalories ?? ''));
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(String(initialGoal?.weeklyWorkouts ?? ''));
  const [targetWeight, setTargetWeight] = useState(
    initialGoal?.targetWeight != null
      ? String(convertWeight(initialGoal.targetWeight, wtUnit))
      : ''
  );

  const hasGoals = goal?.dailyCalories || goal?.weeklyWorkouts || goal?.targetWeight;

  const validate = (): string | null => {
    if (dailyCalories !== '') {
      const v = Number(dailyCalories);
      if (!Number.isInteger(v) || v < 0 || v > 50000) return 'Daily calories must be a whole number between 0 and 50,000.';
    }
    if (weeklyWorkouts !== '') {
      const v = Number(weeklyWorkouts);
      if (!Number.isInteger(v) || v < 0 || v > 14) return 'Weekly workouts must be a whole number between 0 and 14.';
    }
    if (targetWeight !== '') {
      const v = Number(targetWeight);
      if (!Number.isFinite(v) || v <= 0) return 'Enter a valid target weight greater than 0.';
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyCalories: dailyCalories !== '' ? Number(dailyCalories) : null,
          weeklyWorkouts: weeklyWorkouts !== '' ? Number(weeklyWorkouts) : null,
          targetWeight: targetWeight !== '' ? weightInputToKg(Number(targetWeight), wtUnit) : null,
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
    setFormError('');
    setDailyCalories(String(goal?.dailyCalories ?? ''));
    setWeeklyWorkouts(String(goal?.weeklyWorkouts ?? ''));
    setTargetWeight(
      goal?.targetWeight != null ? String(convertWeight(goal.targetWeight, wtUnit)) : ''
    );
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
              <Label className="text-xs text-muted-foreground">Daily calories ({calLabel})</Label>
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
              <Label className="text-xs text-muted-foreground">Target weight ({wtUnit})</Label>
              <Input
                type="number"
                placeholder={wtUnit === 'lbs' ? 'e.g. 165' : 'e.g. 75'}
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                min="0"
                step={wtUnit === 'lbs' ? '0.5' : '0.1'}
                className="h-8 text-sm"
              />
            </div>
          </div>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
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
            <GoalChip label="Daily calories" value={`${goal.dailyCalories.toLocaleString()} ${calLabel}`} />
          )}
          {goal?.weeklyWorkouts && (
            <GoalChip label="Weekly workouts" value={`${goal.weeklyWorkouts}×`} />
          )}
          {goal?.targetWeight && (
            <GoalChip
              label="Target weight"
              value={`${convertWeight(goal.targetWeight, wtUnit)} ${wtUnit}`}
            />
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
