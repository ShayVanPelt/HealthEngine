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
