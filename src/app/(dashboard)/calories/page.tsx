'use client';

import { useState, useEffect, useCallback } from 'react';
import CalorieForm from '@/components/forms/CalorieForm';
import CalorieList from '@/components/lists/CalorieList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';
import CalendarView from '@/components/workouts/CalendarView';
import { useToast } from '@/hooks/useToast';
import type { CalorieEntry } from '@/types';

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function CaloriesPage() {
  const { toast } = useToast();
  const now = new Date();

  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [entries, setEntries] = useState<CalorieEntry[]>([]);
  const [calorieDates, setCalorieDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calories?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCalorieDates = useCallback(async (year: number, month: number) => {
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/calories?month=${monthStr}`);
      if (res.ok) {
        const { data } = await res.json();
        setCalorieDates(data ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchEntries(selectedDate); }, [selectedDate, fetchEntries]);
  useEffect(() => { fetchCalorieDates(calYear, calMonth); }, [calYear, calMonth, fetchCalorieDates]);

  const handleMonthChange = (year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  };

  const handleSuccess = useCallback(() => {
    fetchEntries(selectedDate);
    fetchCalorieDates(calYear, calMonth);
    toast('Calories logged!', 'success');
  }, [fetchEntries, fetchCalorieDates, selectedDate, calYear, calMonth, toast]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/calories/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast('Failed to delete entry', 'error');
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    fetchCalorieDates(calYear, calMonth);
    toast('Entry deleted', 'info');
  };

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + (e.protein ?? 0),
      carbs: acc.carbs + (e.carbs ?? 0),
      fat: acc.fat + (e.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const todayStr = getTodayString();
  const isToday = selectedDate === todayStr;

  return (
    <div>
      <div className="mb-8 sm:mb-10 animate-fade-in-up">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">Calories</h1>
        <p className="text-muted-foreground mt-3 text-sm">Track your daily nutrition</p>
      </div>

      {!loading && (
        <div
          key={selectedDate}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          <StatCard title="Calories" value={totals.calories} unit="kcal" animationDelay="0ms" />
          <StatCard title="Protein" value={Math.round(totals.protein)} unit="g" animationDelay="60ms" />
          <StatCard title="Carbs" value={Math.round(totals.carbs)} unit="g" animationDelay="120ms" />
          <StatCard title="Fat" value={Math.round(totals.fat)} unit="g" animationDelay="180ms" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        {/* Log form */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Log Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <CalorieForm onSuccess={handleSuccess} />
            </CardContent>
          </Card>
        </div>

        {/* Date selector + Entries — single unified card */}
        <Card className="flex flex-col">
          {/* Calendar */}
          <CardContent className="p-4 pb-0">
            <CalendarView
              year={calYear}
              month={calMonth}
              workoutDates={calorieDates}
              selectedDate={selectedDate}
              onDayClick={setSelectedDate}
              onMonthChange={handleMonthChange}
            />
          </CardContent>

          <Separator className="mt-4" />

          {/* Entries section */}
          <CardContent className="p-4 flex-1">
            {/* Date header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-bold">
                  {isToday ? 'Today' : formatDisplayDate(selectedDate)}
                </h2>
                {!loading && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
                  </span>
                )}
              </div>
              {!isToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-xs h-7 px-2"
                >
                  Today
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-1 py-8">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            ) : (
              <CalorieList
                entries={entries}
                onDelete={handleDelete}
                emptyTitle="No entries for this day"
                emptySubtitle="Log a meal above to track your nutrition"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
