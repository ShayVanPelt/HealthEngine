'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WeightFormProps {
  onSuccess: () => void;
}

export default function WeightForm({ onSuccess }: WeightFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ weight?: string; api?: string }>({});
  const [form, setForm] = useState({ weight: '', bodyFat: '' });

  const validate = () => {
    const next: typeof errors = {};
    if (!form.weight.trim()) {
      next.weight = 'Weight is required.';
    } else if (isNaN(parseFloat(form.weight)) || parseFloat(form.weight) <= 0) {
      next.weight = 'Enter a valid weight greater than 0.';
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
          weight: parseFloat(form.weight),
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
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          placeholder="80.5"
          min="0"
          step="0.1"
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
        />
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
