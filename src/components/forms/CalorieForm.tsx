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
  const [error, setError] = useState('');
  const [form, setForm] = useState({ calories: '', protein: '', carbs: '', fat: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      setForm({ calories: '', protein: '', carbs: '', fat: '' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="calories">Calories</Label>
        <Input
          id="calories"
          type="number"
          placeholder="2000"
          min="0"
          value={form.calories}
          onChange={(e) => setForm({ ...form, calories: e.target.value })}
          required
        />
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

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging...' : 'Log Calories'}
      </Button>
    </form>
  );
}
