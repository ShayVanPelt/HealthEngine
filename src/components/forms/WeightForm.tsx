'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePreferences } from '@/contexts/PreferencesContext';
import { weightInputToKg, weightMaxForUnit } from '@/lib/units';

interface WeightFormProps {
  onSuccess: () => void;
}

export default function WeightForm({ onSuccess }: WeightFormProps) {
  const { preferences } = usePreferences();
  const unit = preferences.units.bodyWeight;
  const maxVal = weightMaxForUnit(unit);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ weight?: string; bodyFat?: string; api?: string }>({});
  const [form, setForm] = useState({ weight: '', bodyFat: '' });

  const validate = () => {
    const next: typeof errors = {};
    if (!form.weight.trim()) {
      next.weight = 'Weight is required.';
    } else {
      const w = parseFloat(form.weight);
      if (isNaN(w) || w <= 0) {
        next.weight = 'Enter a valid weight greater than 0.';
      } else if (w > maxVal) {
        next.weight = `Weight must be ${maxVal} ${unit} or less.`;
      }
    }
    if (form.bodyFat.trim()) {
      const bf = parseFloat(form.bodyFat);
      if (isNaN(bf) || bf < 0 || bf > 100) {
        next.bodyFat = 'Body fat must be between 0 and 100.';
      }
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
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: weightInputToKg(parseFloat(form.weight), unit),
          bodyFat: form.bodyFat ? parseFloat(form.bodyFat) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to log weight');
      }

      setForm({ weight: '', bodyFat: '' });
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
        <Label htmlFor="weight">Weight ({unit})</Label>
        <Input
          id="weight"
          type="number"
          placeholder={unit === 'lbs' ? '177' : '80.5'}
          min="0"
          max={String(maxVal)}
          step={unit === 'lbs' ? '0.5' : '0.1'}
          value={form.weight}
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          aria-invalid={!!errors.weight}
          aria-describedby={errors.weight ? 'weight-error' : undefined}
        />
        {errors.weight && (
          <p id="weight-error" className="text-sm font-medium text-destructive">
            {errors.weight}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bodyFat">Body Fat % (optional)</Label>
        <Input
          id="bodyFat"
          type="number"
          placeholder="18.5"
          min="0"
          max="100"
          step="0.1"
          value={form.bodyFat}
          onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
          aria-invalid={!!errors.bodyFat}
          aria-describedby={errors.bodyFat ? 'bodyFat-error' : undefined}
        />
        {errors.bodyFat && (
          <p id="bodyFat-error" className="text-sm font-medium text-destructive">
            {errors.bodyFat}
          </p>
        )}
      </div>

      {errors.api && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errors.api}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging...' : 'Log Weight'}
      </Button>
    </form>
  );
}
