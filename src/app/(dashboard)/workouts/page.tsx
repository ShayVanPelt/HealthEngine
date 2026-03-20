'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CalendarView from '@/components/workouts/CalendarView';
import WorkoutDayView from '@/components/workouts/WorkoutDayView';
import ExerciseHistoryView from '@/components/workouts/ExerciseHistoryView';
import AddExerciseModal from '@/components/workouts/AddExerciseModal';
import AddWorkoutModal from '@/components/workouts/AddWorkoutModal';
import type { Exercise, Workout, ExerciseHistoryEntry } from '@/types';

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WorkoutsPage() {
  const now = new Date();

  // Calendar / date-mode state
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [dayWorkouts, setDayWorkouts] = useState<Workout[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  // Exercise-mode state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modals
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddWorkout, setShowAddWorkout] = useState(false);

  // — Fetchers —

  const fetchExercises = useCallback(async () => {
    try {
      const res = await fetch('/api/exercises');
      if (res.ok) {
        const { data } = await res.json();
        setExercises(data ?? []);
      }
    } catch {}
  }, []);

  const fetchWorkoutDates = useCallback(async (year: number, month: number) => {
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/workouts-v2?month=${monthStr}`);
      if (res.ok) {
        const { data } = await res.json();
        setWorkoutDates(data ?? []);
      }
    } catch {}
  }, []);

  const fetchDayWorkouts = useCallback(async (date: string) => {
    setDayLoading(true);
    try {
      const res = await fetch(`/api/workouts-v2?date=${date}`);
      if (res.ok) {
        const { data } = await res.json();
        setDayWorkouts(data ?? []);
      }
    } finally {
      setDayLoading(false);
    }
  }, []);

  const fetchExerciseHistory = useCallback(async (exerciseId: string) => {
    if (!exerciseId) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/exercise-history?exerciseId=${exerciseId}`);
      if (res.ok) {
        const { data } = await res.json();
        setExerciseHistory(data ?? []);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // — Effects —

  useEffect(() => { fetchExercises(); }, [fetchExercises]);
  useEffect(() => { fetchWorkoutDates(calYear, calMonth); }, [calYear, calMonth, fetchWorkoutDates]);
  useEffect(() => { fetchDayWorkouts(selectedDate); }, [selectedDate, fetchDayWorkouts]);
  useEffect(() => {
    if (selectedExerciseId) fetchExerciseHistory(selectedExerciseId);
  }, [selectedExerciseId, fetchExerciseHistory]);

  // — Handlers —

  const handleMonthChange = (year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  };

  const handleWorkoutAdded = (date: string) => {
    fetchWorkoutDates(calYear, calMonth);
    setSelectedDate(date);
    fetchDayWorkouts(date);
  };

  const handleExerciseCreated = (exercise: Exercise) => {
    setExercises((prev) =>
      [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-5 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold">Workouts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track your training, set by set.
        </p>
      </div>

      {/* Sticky action bar */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/90 backdrop-blur-sm border-b border-border mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddExercise(true)}
            className="h-9 gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Exercise</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddWorkout(true)}
            className="h-9 gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Workout</span>
          </Button>
          {exercises.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            </span>
          )}
        </div>
      </div>

      {/* Mode tabs */}
      <Tabs defaultValue="date" className="space-y-6">
        <TabsList>
          <TabsTrigger value="date">By Date</TabsTrigger>
          <TabsTrigger value="exercise">By Exercise</TabsTrigger>
        </TabsList>

        {/* ── DATE MODE ── */}
        <TabsContent value="date">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8 items-start">
            {/* Calendar */}
            <Card className="shrink-0">
              <CardContent className="p-4">
                <CalendarView
                  year={calYear}
                  month={calMonth}
                  workoutDates={workoutDates}
                  selectedDate={selectedDate}
                  onDayClick={setSelectedDate}
                  onMonthChange={handleMonthChange}
                />
              </CardContent>
            </Card>

            {/* Day detail */}
            <div className="min-h-[200px]">
              <WorkoutDayView
                date={selectedDate}
                workouts={dayWorkouts}
                loading={dayLoading}
                onRefresh={() => {
                  fetchDayWorkouts(selectedDate);
                  fetchWorkoutDates(calYear, calMonth);
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── EXERCISE MODE ── */}
        <TabsContent value="exercise">
          <div className="space-y-6 max-w-2xl">
            {/* Exercise picker */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Exercise
              </p>
              {exercises.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">No exercises yet.</p>
                  <button
                    onClick={() => setShowAddExercise(true)}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Create your first exercise →
                  </button>
                </div>
              ) : (
                <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger className="w-full sm:max-w-xs">
                    <SelectValue placeholder="Choose an exercise..." />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((ex) => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Exercise history */}
            {selectedExerciseId && (
              <ExerciseHistoryView
                history={exerciseHistory}
                loading={historyLoading}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── MODALS ── */}
      {showAddExercise && (
        <AddExerciseModal
          onClose={() => setShowAddExercise(false)}
          onSuccess={handleExerciseCreated}
        />
      )}

      {showAddWorkout && (
        <AddWorkoutModal
          exercises={exercises}
          onClose={() => setShowAddWorkout(false)}
          onSuccess={handleWorkoutAdded}
        />
      )}
    </div>
  );
}
