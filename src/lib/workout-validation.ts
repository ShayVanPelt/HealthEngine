export interface SetInput {
  weight?: number | null;
  reps?: number | null;
  effort?: number | null;
}

// Shared server-side validation for workout sets (POST and PATCH must match the
// client rules: weight 0–500 kg, reps 1–50, effort RPE 1–10).
export function validateSets(sets: SetInput[]): string | null {
  for (const s of sets) {
    const weightEmpty = s.weight === null || s.weight === undefined;
    const repsEmpty = s.reps === null || s.reps === undefined;
    const effortEmpty = s.effort === null || s.effort === undefined;

    if (weightEmpty && repsEmpty && effortEmpty) {
      return 'Each set must have at least one of weight, reps, or effort';
    }
    if (!weightEmpty && (typeof s.weight !== 'number' || s.weight < 0 || s.weight > 500)) {
      return 'Set weight must be between 0 and 500 kg';
    }
    if (!repsEmpty && (typeof s.reps !== 'number' || s.reps < 1 || s.reps > 50)) {
      return 'Set reps must be between 1 and 50';
    }
    if (!effortEmpty && (typeof s.effort !== 'number' || s.effort < 1 || s.effort > 10)) {
      return 'Set effort (RPE) must be between 1 and 10';
    }
  }
  return null;
}
