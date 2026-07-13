export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CalorieEntry {
  id: string;
  userId: string;
  mealName: string | null;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  userId: string;
  weight: number;
  bodyFat: number | null;
  createdAt: string;
}

// — Upgraded workout system —

export type ExerciseType = 'WEIGHTED' | 'BODYWEIGHT' | 'TIMED';

export interface Exercise {
  id: string;
  userId: string;
  name: string;
  type: ExerciseType;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  weight: number | null;
  reps: number | null;
  effort: number | null;
  completedAt: string | null;
  createdAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
}

export type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface Workout {
  id: string;
  userId: string;
  date: string;
  status: WorkoutStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  workoutExercises: WorkoutExercise[];
}

export interface ExerciseHistoryEntry {
  id: string;
  workoutId: string;
  exerciseId: string;
  workout: { id: string; date: string };
  sets: WorkoutSet[];
}

// — Goals —

export interface UserGoal {
  id: string;
  userId: string;
  dailyCalories: number | null;
  weeklyWorkouts: number | null;
  targetWeight: number | null;
  createdAt: string;
  updatedAt: string;
}

// — Preferences —

export type ThemePreference = 'light' | 'dark' | 'system';
export type WeightUnit = 'kg' | 'lbs';
export type MacroUnit = 'g' | 'oz';
export type EffortUnit = 'RPE' | 'RIR';

export interface UnitPreferences {
  bodyWeight: WeightUnit;
  liftingWeight: WeightUnit;
  macros: MacroUnit;
  effort: EffortUnit;
}

export interface AppPreferences {
  theme: ThemePreference;
  units: UnitPreferences;
}

// — Dashboard trend/insight types —

export interface StatTrend {
  delta: number;
  label: string;
  /** true = higher is better (calories on track), false = lower is better (weight) */
  positiveDirection: 'up' | 'down' | 'neutral';
}
