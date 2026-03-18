export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WorkoutEntry {
  id: string;
  userId: string;
  workoutType: string;
  duration: number;
  notes: string | null;
  createdAt: string;
}

export interface CalorieEntry {
  id: string;
  userId: string;
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
