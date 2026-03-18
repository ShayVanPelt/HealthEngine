'use client';

import { useState, useEffect, useCallback } from 'react';
import CalorieForm from '@/components/forms/CalorieForm';
import CalorieList from '@/components/lists/CalorieList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/ui/StatCard';
import type { CalorieEntry } from '@/types';

export default function CaloriesPage() {
  const [entries, setEntries] = useState<CalorieEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState('');

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
    setDeleteError('');
    const res = await fetch(`/api/calories/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setDeleteError('Failed to delete entry. Please try again.');
      return;
    }
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
        <p className="text-muted-foreground mt-2 text-sm">Track your daily nutrition</p>
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Log Calories</CardTitle>
            </CardHeader>
            <CardContent>
              <CalorieForm onSuccess={fetchEntries} />
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-3">
            Recent Entries
            {!loading && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({entries.length} total)
              </span>
            )}
          </h2>

          {deleteError && (
            <p role="alert" className="text-sm text-destructive mb-3">{deleteError}</p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <CalorieList entries={entries} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  );
}
