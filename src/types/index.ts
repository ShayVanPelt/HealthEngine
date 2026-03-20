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

export interface Exercise {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  weight: number | null;
  reps: number | null;
  effort: number | null;
  createdAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  userId: string;
  date: string;
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

// — Dashboard trend/insight types —

export interface StatTrend {
  delta: number;
  label: string;
  /** true = higher is better (calories on track), false = lower is better (weight) */
  positiveDirection: 'up' | 'down' | 'neutral';
}
