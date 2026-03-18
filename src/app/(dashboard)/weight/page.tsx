'use client';

import { useState, useEffect, useCallback } from 'react';
import WeightForm from '@/components/forms/WeightForm';
import WeightList from '@/components/lists/WeightList';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import type { WeightEntry } from '@/types';

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/weight');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/weight/${id}`, { method: 'DELETE' });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const latest = entries[0];
  const previous = entries[1];
  const trend =
    latest && previous ? (latest.weight - previous.weight).toFixed(1) : null;

  return (
    <div>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold">Weight / Stats</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">Monitor your body composition over time</p>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 sm:mb-8">
          <StatCard
            title="Current Weight"
            value={latest ? latest.weight : '--'}
            unit={latest ? 'kg' : undefined}
            subtitle={
              latest
                ? new Date(latest.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'No entries yet'
            }
          />
          <StatCard
            title="Body Fat"
            value={latest?.bodyFat ?? '--'}
            unit={latest?.bodyFat ? '%' : undefined}
          />
          <StatCard
            title="Trend"
            value={trend ? `${Number(trend) > 0 ? '+' : ''}${trend}` : '--'}
            unit={trend ? 'kg' : undefined}
            subtitle={trend ? 'vs previous entry' : 'Need 2+ entries'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
        <div>
          <h2 className="font-semibold text-lg mb-3 text-zinc-900 dark:text-zinc-100">Log Weight</h2>
          <Card>
            <WeightForm onSuccess={fetchEntries} />
          </Card>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-3 text-zinc-900 dark:text-zinc-100">
            History
            {!loading && (
              <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-2">
                ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
              </span>
            )}
          </h2>

          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
          ) : (
            <WeightList entries={entries} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  );
}
