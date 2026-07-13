'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingDots from '@/components/ui/LoadingDots';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import {
  convertWeight,
  weightInputToKg,
  weightMaxForUnit,
  weightRangeLabel,
  convertEffortForDisplay,
  convertEffortForStorage,
  effortMin,
  effortMax,
  effortRangeLabel,
} from '@/lib/units';
import type { Exercise, Workout } from '@/types';

interface LiveSet {
  weight: string;
  reps: string;
  effort: string;
  completed: boolean;
  /** Server persistence for this set — independent of local `completed` optimism. */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

interface LiveExercise {
  exerciseId: string;
  sets: LiveSet[];
}

const REST_OPTIONS = [60, 90, 120] as const;
const REST_DURATION_KEY = 'healthengine_rest_duration';

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function emptySet(): LiveSet {
  return { weight: '', reps: '', effort: '', completed: false, saveStatus: 'idle' };
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LiveWorkoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const liftUnit = preferences.units.liftingWeight;
  const liftMax = weightMaxForUnit(liftUnit);
  const effortUnit = preferences.units.effort;

  const [phase, setPhase] = useState<'loading' | 'setup' | 'active'>('loading');
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [session, setSession] = useState<LiveExercise[]>([]);
  const [error, setError] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [savingBack, setSavingBack] = useState(false);
  const [starting, setStarting] = useState(false);

  // Rest timer
  const [restDuration, setRestDuration] = useState<number>(90);
  const [restInput, setRestInput] = useState('90');
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  useEffect(() => {
    const saved = Number.parseInt(localStorage.getItem(REST_DURATION_KEY) ?? '', 10);
    if (Number.isInteger(saved) && saved > 0) {
      setRestDuration(saved);
      setRestInput(String(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(REST_DURATION_KEY, String(restDuration));
  }, [restDuration]);

  // Elapsed clock tick
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  // Rest countdown
  useEffect(() => {
    if (restRemaining == null) return;
    if (restRemaining <= 0) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(200);
      setRestRemaining(null);
      return;
    }
    const t = setTimeout(() => setRestRemaining((r) => (r != null ? r - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [restRemaining]);

  // Keep the screen awake during an active session where supported
  useEffect(() => {
    if (phase !== 'active') return;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
    };
    nav.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => {});
    return () => { lock?.release().catch(() => {}); };
  }, [phase]);

  // Initial load: exercise library + any in-progress session
  useEffect(() => {
    (async () => {
      try {
        const [exRes, liveRes] = await Promise.all([
          fetch('/api/exercises'),
          fetch('/api/workouts-v2/live'),
        ]);
        if (exRes.ok) {
          const { data } = await exRes.json();
          setLibrary(data ?? []);
        }
        if (liveRes.ok) {
          const { data } = (await liveRes.json()) as { data: Workout | null };
          if (data) {
            setWorkoutId(data.id);
            setStartedAt(data.startedAt ? new Date(data.startedAt).getTime() : Date.now());
            setSession(
              data.workoutExercises.map((we) => ({
                exerciseId: we.exerciseId,
                sets:
                  we.sets.length > 0
                    ? we.sets.map((s) => ({
                        weight: s.weight != null ? String(convertWeight(s.weight, liftUnit)) : '',
                        reps: s.reps != null ? String(s.reps) : '',
                        effort: s.effort != null ? String(convertEffortForDisplay(s.effort, effortUnit)) : '',
                        completed: s.completedAt != null,
                        saveStatus: 'saved' as const,
                      }))
                    : [emptySet()],
              }))
            );
            setPhase('active');
            return;
          }
        }
        setPhase('setup');
      } catch {
        toast('Failed to load workout mode', 'error');
        setPhase('setup');
      }
    })();
    // liftUnit/effortUnit intentionally omitted: hydration should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exerciseById = useMemo(() => new Map(library.map((e) => [e.id, e])), [library]);

  const availableExercises = useMemo(() => {
    const used = new Set(session.map((s) => s.exerciseId));
    return library.filter((e) => !used.has(e.id));
  }, [library, session]);

  // — Session persistence —

  const syncExercise = useCallback(
    async (
      exerciseId: string,
      sets: LiveSet[],
      includeDrafts = false,
      targetWorkoutId = workoutId
    ): Promise<boolean> => {
      if (!targetWorkoutId) return false;
      const persistedSets = sets.filter(
        (set) =>
          set.completed ||
          (includeDrafts && (set.weight !== '' || set.reps !== '' || set.effort !== ''))
      );
      try {
        const res = await fetch(`/api/workouts-v2/${targetWorkoutId}/sets`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId,
            sets: persistedSets.map((s) => ({
              weight: s.weight !== '' ? weightInputToKg(parseFloat(s.weight), liftUnit) : null,
              reps: s.reps !== '' ? parseInt(s.reps, 10) : null,
              effort: s.effort !== '' ? convertEffortForStorage(parseInt(s.effort, 10), effortUnit) : null,
              completed: s.completed,
            })),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast(data.error ?? 'Failed to save set', 'error');
          return false;
        }
        return true;
      } catch {
        toast('Failed to save set — check your connection', 'error');
        return false;
      }
    },
    [workoutId, liftUnit, effortUnit, toast]
  );

  // — Handlers —

  const createLiveWorkout = async (): Promise<{ id: string; startedAt: string | null }> => {
    const res = await fetch('/api/workouts-v2/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: getTodayString() }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? 'Failed to start workout');
    }
    const { data } = await res.json();
    return data;
  };

  const handleStart = async () => {
    setError('');
    setStarting(true);
    try {
      const data = await createLiveWorkout();
      setWorkoutId(data.id);
      setStartedAt(data.startedAt ? new Date(data.startedAt).getTime() : Date.now());

      // Persist anything entered during setup (drafts + already-checked sets)
      const results = await Promise.all(
        session.map((exercise) =>
          syncExercise(exercise.exerciseId, exercise.sets, true, data.id)
        )
      );
      if (results.some((saved) => !saved)) {
        setError('Workout started, but some sets failed to save — check values and try again');
      } else {
        setSession((prev) =>
          prev.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.weight !== '' || set.reps !== '' || set.effort !== '' || set.completed
                ? { ...set, saveStatus: 'saved' as const }
                : set
            ),
          }))
        );
      }

      setPhase('active');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setStarting(false);
    }
  };

  const addExercise = (exerciseId: string) => {
    if (!exerciseId) return;
    setSession((prev) => [...prev, { exerciseId, sets: [emptySet()] }]);
  };

  const removeExercise = (exIdx: number) => {
    const ex = session[exIdx];
    setSession((prev) => prev.filter((_, i) => i !== exIdx));
    // Clear any persisted sets for this exercise (completed or draft shells)
    if (workoutId && ex.sets.some((s) => s.saveStatus === 'saved' || s.completed)) {
      syncExercise(ex.exerciseId, []);
    }
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps' | 'effort', value: string) => {
    setSession((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      const current = sets[setIdx];
      sets[setIdx] = {
        ...current,
        [field]: value,
        // Editing a previously synced draft means it's dirty until Save again
        saveStatus: current.saveStatus === 'saved' && !current.completed ? 'idle' : current.saveStatus,
      };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const addSet = (exIdx: number) => {
    setSession((prev) => {
      const next = [...prev];
      const prevSets = next[exIdx].sets;
      // Prefill from the last set for faster logging
      const last = prevSets[prevSets.length - 1];
      const fresh = last
        ? { ...last, completed: false, saveStatus: 'idle' as const }
        : emptySet();
      next[exIdx] = { ...next[exIdx], sets: [...prevSets, fresh] };
      return next;
    });
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setSession((prev) => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.filter((_, i) => i !== setIdx) };
      return next;
    });
  };

  const validateSet = (s: LiveSet, isBodyweight: boolean): string | null => {
    if (s.weight === '' && s.reps === '' && s.effort === '') return 'Fill in at least one field';
    if (isBodyweight && s.reps === '') return 'Reps are required for bodyweight exercises';
    if (s.weight !== '') {
      const w = parseFloat(s.weight);
      if (isNaN(w) || w < 0 || w > liftMax) return `Weight must be ${weightRangeLabel(liftUnit)}`;
    }
    if (s.reps !== '') {
      const r = parseInt(s.reps, 10);
      if (isNaN(r) || r < 1 || r > 50) return 'Reps must be 1–50';
    }
    if (s.effort !== '') {
      const e = parseInt(s.effort, 10);
      if (isNaN(e) || e < effortMin(effortUnit) || e > effortMax(effortUnit)) return effortRangeLabel(effortUnit);
    }
    return null;
  };

  const completeSet = async (exIdx: number, setIdx: number) => {
    const ex = session[exIdx];
    const set = ex.sets[setIdx];
    const exercise = exerciseById.get(ex.exerciseId);
    const err = validateSet(set, exercise?.type === 'BODYWEIGHT');
    if (err) {
      toast(err, 'error');
      return;
    }

    const markSet = (status: LiveSet['saveStatus'], completed: boolean) => {
      setSession((prev) => {
        const next = [...prev];
        const sets = [...next[exIdx].sets];
        sets[setIdx] = { ...sets[setIdx], completed, saveStatus: status };
        next[exIdx] = { ...next[exIdx], sets };
        return next;
      });
    };

    markSet('saving', true);
    setRestRemaining(restDuration);

    try {
      let targetWorkoutId = workoutId;
      const startingFresh = !targetWorkoutId;
      if (!targetWorkoutId) {
        const data = await createLiveWorkout();
        targetWorkoutId = data.id;
        setWorkoutId(data.id);
        setStartedAt(data.startedAt ? new Date(data.startedAt).getTime() : Date.now());
        setPhase('active');
      }

      const nextSets = ex.sets.map((s, i) =>
        i === setIdx ? { ...s, completed: true, saveStatus: 'saving' as const } : s
      );

      // If this is the first persist, flush every exercise so setup drafts aren't lost
      if (startingFresh) {
        const results = await Promise.all(
          session.map((liveExercise, i) =>
            syncExercise(
              liveExercise.exerciseId,
              i === exIdx ? nextSets : liveExercise.sets,
              true,
              targetWorkoutId
            )
          )
        );
        const ok = results.every(Boolean);
        if (ok) {
          setSession((prev) =>
            prev.map((liveExercise, i) => ({
              ...liveExercise,
              sets: (i === exIdx ? nextSets : liveExercise.sets).map((set, j) => {
                const filled =
                  set.weight !== '' || set.reps !== '' || set.effort !== '' || set.completed;
                if (!filled) return set;
                return {
                  ...set,
                  completed: i === exIdx && j === setIdx ? true : set.completed,
                  saveStatus: 'saved' as const,
                };
              }),
            }))
          );
        } else {
          markSet('error', false);
          setRestRemaining(null);
        }
        return;
      }

      const ok = await syncExercise(ex.exerciseId, nextSets, false, targetWorkoutId);
      markSet(ok ? 'saved' : 'error', ok);
      if (!ok) setRestRemaining(null);
    } catch (startErr) {
      markSet('error', false);
      setRestRemaining(null);
      toast(startErr instanceof Error ? startErr.message : 'Failed to save set', 'error');
    }
  };

  const uncompleteSet = async (exIdx: number, setIdx: number) => {
    const ex = session[exIdx];
    const nextSets = ex.sets.map((s, i) =>
      i === setIdx ? { ...s, completed: false, saveStatus: 'saving' as const } : s
    );
    setSession((prev) => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], sets: nextSets };
      return next;
    });
    const ok = await syncExercise(ex.exerciseId, nextSets);
    setSession((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = {
        ...sets[setIdx],
        completed: false,
        saveStatus: ok ? 'idle' : 'error',
      };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const completedSetCount = useMemo(
    () => session.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0),
    [session]
  );

  const handleBack = async () => {
    if (session.length === 0) {
      router.push('/workouts');
      return;
    }

    for (const liveExercise of session) {
      const exercise = exerciseById.get(liveExercise.exerciseId);
      for (const set of liveExercise.sets) {
        if (set.weight === '' && set.reps === '' && set.effort === '') continue;
        const validationError = validateSet(set, exercise?.type === 'BODYWEIGHT');
        if (validationError) {
          toast(`${exercise?.name ?? 'Exercise'}: ${validationError}`, 'error');
          return;
        }
      }
    }

    setSavingBack(true);
    setError('');
    try {
      let targetWorkoutId = workoutId;
      if (!targetWorkoutId) {
        const data = await createLiveWorkout();
        targetWorkoutId = data.id;
        setWorkoutId(data.id);
      }

      const results = await Promise.all(
        session.map((exercise) =>
          syncExercise(exercise.exerciseId, exercise.sets, true, targetWorkoutId)
        )
      );
      if (results.some((saved) => !saved)) return;

      setSession((prev) =>
        prev.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map((set) =>
            set.weight !== '' || set.reps !== '' || set.effort !== '' || set.completed
              ? { ...set, saveStatus: 'saved' as const }
              : set
          ),
        }))
      );

      toast('Workout saved — resume when you’re ready', 'success');
      router.push('/workouts');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save workout', 'error');
    } finally {
      setSavingBack(false);
    }
  };

  const handleFinish = async () => {
    if (!workoutId) return;
    setFinishing(true);
    try {
      const res = await fetch(`/api/workouts-v2/${workoutId}/complete`, { method: 'PATCH' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to finish workout');
      }
      const { deleted } = await res.json();
      toast(deleted ? 'Empty workout discarded' : 'Workout complete — nice work!', deleted ? 'info' : 'success');
      router.push('/workouts');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
      setFinishing(false);
    }
  };

  const handleDiscard = async () => {
    if (!workoutId) {
      router.push('/workouts');
      return;
    }
    if (!window.confirm('Discard this workout? All logged sets will be deleted.')) return;
    try {
      await fetch(`/api/workouts-v2/${workoutId}`, { method: 'DELETE' });
      toast('Workout discarded', 'info');
    } finally {
      router.push('/workouts');
    }
  };

  // — Render —

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingDots label="Loading workout mode" />
      </div>
    );
  }

  const elapsedSec = startedAt ? Math.max(0, Math.floor((nowTick - startedAt) / 1000)) : 0;

  return (
    <div className="pb-44 sm:pb-32">
      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-in-up">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={savingBack}
          className="-ml-3 mb-3 h-11 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {savingBack ? 'Saving…' : 'Back to workouts'}
        </Button>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
            Workout<span className="text-primary"> Mode</span>
          </h1>
          {phase === 'active' && (
            <span className="text-sm font-bold tabular-nums text-muted-foreground shrink-0">
              {formatClock(elapsedSec)}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          {phase === 'setup'
            ? 'Pick your exercises, then start the session.'
            : 'Log each set as you go — the rest timer starts automatically.'}
        </p>
      </div>

      {/* Rest duration selector */}
      <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
          Rest between sets
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex gap-2">
            {REST_OPTIONS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setRestDuration(sec);
                  setRestInput(String(sec));
                }}
                aria-pressed={restDuration === sec}
                className={cn(
                  'h-11 px-4 rounded-md border text-sm font-semibold transition-colors',
                  restDuration === sec
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {sec}s
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor="customRestDuration" className="sr-only">Custom rest time in seconds</Label>
            <div className="relative">
              <Input
                id="customRestDuration"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={restInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setRestInput(value);
                  const seconds = Number.parseInt(value, 10);
                  if (Number.isInteger(seconds) && seconds > 0) setRestDuration(seconds);
                }}
                onBlur={() => setRestInput(String(restDuration))}
                className="h-11 w-24 pr-8"
                aria-describedby="customRestUnit"
              />
              <span
                id="customRestUnit"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
              >
                sec
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise cards */}
      <div className="space-y-4">
        {session.map((ex, exIdx) => {
          const exercise = exerciseById.get(ex.exerciseId);
          const isBodyweight = exercise?.type === 'BODYWEIGHT';
          return (
            <Card key={ex.exerciseId} className="overflow-hidden animate-scale-in">
              <CardHeader className="px-4 py-3 bg-primary/8 flex-row items-center justify-between space-y-0 gap-2 border-b border-border">
                <h3 className="font-bold text-base truncate min-w-0">
                  {exercise?.name ?? 'Exercise'}
                  {isBodyweight && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-bold uppercase tracking-wider text-primary align-middle">
                      BW
                    </span>
                  )}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExercise(exIdx)}
                  className="text-xs text-muted-foreground hover:text-destructive h-auto py-1 px-2 shrink-0"
                >
                  Remove
                </Button>
              </CardHeader>

              <CardContent className="px-4 py-3">
                {/* Column headers */}
                <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_4.5rem] gap-1.5 pb-1">
                  <span className="text-xs font-medium text-muted-foreground">#</span>
                  <span className="text-xs font-medium text-muted-foreground text-center">
                    {isBodyweight ? `+${liftUnit}` : liftUnit}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground text-center">Reps</span>
                  <span className="text-xs font-medium text-muted-foreground text-center">{effortUnit}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Done
                  </span>
                </div>

                <div className="space-y-1.5">
                  {ex.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="grid grid-cols-[1.5rem_1fr_1fr_1fr_4.5rem] gap-1.5 items-center"
                    >
                      <span className="text-xs text-muted-foreground text-center">{setIdx + 1}</span>
                      <Input
                        type="number"
                        placeholder={isBodyweight ? 'BW' : '—'}
                        value={set.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        disabled={set.completed && set.saveStatus === 'saved'}
                        min="0"
                        max={String(liftMax)}
                        step="0.5"
                        aria-label={`Set ${setIdx + 1} weight in ${liftUnit}`}
                        className="text-center text-sm h-11 px-1 disabled:opacity-70"
                      />
                      <Input
                        type="number"
                        placeholder="—"
                        value={set.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        disabled={set.completed && set.saveStatus === 'saved'}
                        min="1"
                        max="50"
                        aria-label={`Set ${setIdx + 1} reps`}
                        className="text-center text-sm h-11 px-1 disabled:opacity-70"
                      />
                      <Input
                        type="number"
                        placeholder="—"
                        value={set.effort}
                        onChange={(e) => updateSet(exIdx, setIdx, 'effort', e.target.value)}
                        disabled={set.completed && set.saveStatus === 'saved'}
                        min={String(effortMin(effortUnit))}
                        max={String(effortMax(effortUnit))}
                        aria-label={`Set ${setIdx + 1} ${effortUnit}`}
                        className="text-center text-sm h-11 px-1 disabled:opacity-70"
                      />
                      {set.saveStatus === 'saving' ? (
                        <div
                          className="h-11 w-full flex items-center justify-center rounded-md border border-border bg-muted"
                          role="status"
                          aria-label={`Saving set ${setIdx + 1}`}
                        >
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                        </div>
                      ) : set.completed && set.saveStatus === 'saved' ? (
                        <button
                          type="button"
                          onClick={() => uncompleteSet(exIdx, setIdx)}
                          aria-label={`Set ${setIdx + 1} saved — tap to undo`}
                          className="h-11 w-full flex flex-col items-center justify-center gap-0.5 rounded-md bg-primary text-primary-foreground"
                        >
                          <Check className="h-4 w-4" aria-hidden />
                          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                            Saved
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => completeSet(exIdx, setIdx)}
                            aria-label={
                              set.saveStatus === 'error'
                                ? `Retry saving set ${setIdx + 1}`
                                : `Mark set ${setIdx + 1} complete and save`
                            }
                            className={cn(
                              'h-11 flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md border transition-colors',
                              set.saveStatus === 'error'
                                ? 'border-destructive text-destructive hover:bg-destructive/10'
                                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                            )}
                          >
                            <Check className="h-4 w-4" aria-hidden />
                            <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                              {set.saveStatus === 'error' ? 'Retry' : 'Save'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSet(exIdx, setIdx)}
                            aria-label={`Remove set ${setIdx + 1}`}
                            className="h-11 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSet(exIdx)}
                  className="mt-2 w-full h-11 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                >
                  + Add Set
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add exercise */}
      <div className="mt-4">
        {availableExercises.length > 0 ? (
          <Select value="" onValueChange={addExercise}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="+ Add exercise..." />
            </SelectTrigger>
            <SelectContent>
              {availableExercises.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                  {e.type === 'BODYWEIGHT' ? ' (BW)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : library.length === 0 ? (
          <div className="py-4 text-center border border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              No exercises yet — create some on the Workouts page first.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-1">
            All your exercises have been added.
          </p>
        )}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

      {/* Setup CTA */}
      {phase === 'setup' && (
        <div className="mt-6 space-y-2">
          <Button
            onClick={handleStart}
            disabled={session.length === 0 || starting}
            className="w-full h-12 text-base font-bold"
          >
            {starting ? 'Saving & starting…' : 'Start Workout'}
          </Button>
          {session.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">Add at least one exercise to start.</p>
          )}
        </div>
      )}

      {/* Sticky bottom bar (active session) — sits above the mobile floating nav */}
      {phase === 'active' && (
        <div className="fixed left-4 right-4 bottom-24 sm:bottom-6 z-30 mx-auto max-w-lg">
          {restRemaining != null ? (
            <div className="rounded-xl border border-primary/40 bg-card shadow-lg p-4 flex items-center justify-between gap-3 animate-scale-in">
              <div className="flex items-center gap-3 min-w-0">
                <Timer className="h-5 w-5 text-primary shrink-0" aria-hidden />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rest</p>
                  <p className="text-2xl font-black text-primary tabular-nums leading-none" aria-live="polite">
                    {formatClock(restRemaining)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="h-11" onClick={() => setRestRemaining((r) => (r != null ? r + 15 : null))}>
                  +15s
                </Button>
                <Button size="sm" className="h-11" onClick={() => setRestRemaining(null)}>
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-lg p-3 flex items-center gap-2 animate-scale-in">
              <button
                type="button"
                onClick={handleDiscard}
                className="h-11 px-3 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                Discard
              </button>
              <span className="text-xs text-muted-foreground tabular-nums min-w-0 truncate">
                {completedSetCount} {completedSetCount === 1 ? 'set' : 'sets'} done
              </span>
              <Button onClick={handleFinish} disabled={finishing} className="flex-1 h-11 font-bold">
                {finishing ? 'Finishing…' : 'Finish Workout'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
