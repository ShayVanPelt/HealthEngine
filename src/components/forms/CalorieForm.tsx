'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CalorieFormProps {
  onSuccess: () => void;
}

export default function CalorieForm({ onSuccess }: CalorieFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ mealName?: string; calories?: string; api?: string }>({});
  const [form, setForm] = useState({ mealName: '', calories: '', protein: '', carbs: '', fat: '' });

  const validate = () => {
    const next: typeof errors = {};
    if (!form.mealName.trim()) {
      next.mealName = 'Meal name is required.';
    }
    if (!form.calories.trim()) {
      next.calories = 'Calories is required.';
    } else if (isNaN(parseInt(form.calories)) || parseInt(form.calories) < 0) {
      next.calories = 'Enter a valid calorie amount.';
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealName: form.mealName.trim(),
          calories: parseInt(form.calories),
          protein: form.protein ? parseFloat(form.protein) : null,
          carbs: form.carbs ? parseFloat(form.carbs) : null,
          fat: form.fat ? parseFloat(form.fat) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to log calories');
      }

      setForm({ mealName: '', calories: '', protein: '', carbs: '', fat: '' });
      onSuccess();
    } catch (err) {
      setErrors({ api: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="mealName">Meal Name</Label>
        <Input
          id="mealName"
          type="text"
          placeholder="e.g. Chicken & Rice, Protein Shake"
          value={form.mealName}
          onChange={(e) => setForm({ ...form, mealName: e.target.value })}
          aria-invalid={!!errors.mealName}
          aria-describedby={errors.mealName ? 'mealName-error' : undefined}
        />
        {errors.mealName && (
          <p id="mealName-error" className="text-sm font-medium text-destructive">
            {errors.mealName}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="calories">Calories</Label>
        <Input
          id="calories"
          type="number"
          placeholder="2000"
          min="0"
          value={form.calories}
          onChange={(e) => setForm({ ...form, calories: e.target.value })}
          aria-invalid={!!errors.calories}
          aria-describedby={errors.calories ? 'calories-error' : undefined}
        />
        {errors.calories && (
          <p id="calories-error" className="text-sm font-medium text-destructive">
            {errors.calories}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['protein', 'carbs', 'fat'] as const).map((macro) => (
          <div key={macro} className="space-y-1.5">
            <Label htmlFor={macro} className="capitalize">{macro} (g)</Label>
            <Input
              id={macro}
              type="number"
              placeholder="0"
              min="0"
              step="0.1"
              value={form[macro]}
              onChange={(e) => setForm({ ...form, [macro]: e.target.value })}
            />
          </div>
        ))}
      </div>

      {errors.api && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errors.api}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging...' : 'Log Calories'}
      </Button>
    </form>
  );
}
