'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

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
      <div>
        <label className="block text-sm font-medium mb-1">Calories</label>
        <input
          type="number"
          placeholder="2000"
          min="0"
          value={form.calories}
          onChange={(e) => setForm({ ...form, calories: e.target.value })}
          required
          className="w-full border border-black px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(['protein', 'carbs', 'fat'] as const).map((macro) => (
          <div key={macro}>
            <label className="block text-sm font-medium mb-1 capitalize">{macro} (g)</label>
            <input
              type="number"
              placeholder="0"
              min="0"
              step="0.1"
              value={form[macro]}
              onChange={(e) => setForm({ ...form, [macro]: e.target.value })}
              className="w-full border border-black px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging...' : 'Log Calories'}
      </Button>
    </form>
  );
}
