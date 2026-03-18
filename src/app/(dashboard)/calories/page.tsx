'use client';

import { useState, useEffect, useCallback } from 'react';
import CalorieForm from '@/components/forms/CalorieForm';
import CalorieList from '@/components/lists/CalorieList';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import type { CalorieEntry } from '@/types';

export default function CaloriesPage() {
  const [entries, setEntries] = useState<CalorieEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/calories');
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
    await fetch(`/api/calories/${id}`, { method: 'DELETE' });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEntries = entries.filter((e) => new Date(e.createdAt) >= todayStart);
  const totals = todayEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + (e.protein ?? 0),
      carbs: acc.carbs + (e.carbs ?? 0),
      fat: acc.fat + (e.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold">Calories</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">Track your daily nutrition</p>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:mb-8">
          <StatCard title="Calories Today" value={totals.calories} unit="kcal" />
          <StatCard title="Protein Today" value={Math.round(totals.protein)} unit="g" />
          <StatCard title="Carbs Today" value={Math.round(totals.carbs)} unit="g" />
          <StatCard title="Fat Today" value={Math.round(totals.fat)} unit="g" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
        <div>
          <h2 className="font-semibold text-lg mb-3 text-zinc-900 dark:text-zinc-100">Log Calories</h2>
          <Card>
            <CalorieForm onSuccess={fetchEntries} />
          </Card>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-3 text-zinc-900 dark:text-zinc-100">
            Recent Entries
            {!loading && (
              <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-2">
                ({entries.length} total)
              </span>
            )}
          </h2>

          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
          ) : (
            <CalorieList entries={entries} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  );
}
