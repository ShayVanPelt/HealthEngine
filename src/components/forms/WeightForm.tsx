'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface WeightFormProps {
  onSuccess: () => void;
}

export default function WeightForm({ onSuccess }: WeightFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ weight: '', bodyFat: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Weight (kg)
        </label>
        <input
          type="number"
          placeholder="80.5"
          min="0"
          step="0.1"
          value={form.weight}
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          required
          className="form-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Body Fat % (optional)
        </label>
        <input
          type="number"
          placeholder="18.5"
          min="0"
          max="100"
          step="0.1"
          value={form.bodyFat}
          onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
          className="form-input"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Logging...' : 'Log Weight'}
      </Button>
    </form>
  );
}
