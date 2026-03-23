import type { WeightUnit, MacroUnit, EffortUnit } from '@/types';

// --- Conversion constants ---
const KG_TO_LBS = 2.20462;
const G_TO_OZ = 0.035274;

// --- Base conversions ---
export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / KG_TO_LBS) * 100) / 100;
}

export function gToOz(g: number): number {
  return Math.round(g * G_TO_OZ * 10) / 10;
}

export function ozToG(oz: number): number {
  return Math.round((oz / G_TO_OZ) * 10) / 10;
}

// --- Generic converters (base → display) ---
export function convertWeight(kg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? kgToLbs(kg) : kg;
}

export function convertMacro(g: number, unit: MacroUnit): number {
  return unit === 'oz' ? gToOz(g) : g;
}

// --- Formatting ---
export function formatWeight(kg: number, unit: WeightUnit): string {
  const val = convertWeight(kg, unit);
  return unit === 'lbs' ? val.toFixed(1) : val % 1 === 0 ? String(val) : val.toFixed(1);
}

export function formatWeightWithUnit(kg: number, unit: WeightUnit): string {
  return `${formatWeight(kg, unit)} ${unit}`;
}

export function formatMacro(g: number, unit: MacroUnit): string {
  const val = convertMacro(g, unit);
  return unit === 'oz' ? val.toFixed(1) : String(Math.round(val));
}

export function formatMacroWithUnit(g: number, unit: MacroUnit): string {
  return `${formatMacro(g, unit)}${unit}`;
}

// --- Effort (RPE ↔ RIR) ---
// DB stores effort as RPE (1–10). RIR = 10 - RPE.

export function rpeToRir(rpe: number): number {
  return 10 - rpe;
}

export function rirToRpe(rir: number): number {
  return 10 - rir;
}

/** Convert a stored RPE value for display in the chosen unit */
export function convertEffortForDisplay(rpe: number, unit: EffortUnit): number {
  return unit === 'RIR' ? rpeToRir(rpe) : rpe;
}

/** Convert a user-entered effort value back to RPE for storage */
export function convertEffortForStorage(input: number, unit: EffortUnit): number {
  return unit === 'RIR' ? rirToRpe(input) : input;
}

/** Validation range for effort input based on unit */
export function effortRangeLabel(unit: EffortUnit): string {
  return unit === 'RIR' ? '0–9 RIR' : '1–10 RPE';
}

export function effortMin(unit: EffortUnit): number {
  return unit === 'RIR' ? 0 : 1;
}

export function effortMax(unit: EffortUnit): number {
  return unit === 'RIR' ? 9 : 10;
}

// --- Input → base (for form submit) ---
export function weightInputToKg(input: number, unit: WeightUnit): number {
  return unit === 'lbs' ? lbsToKg(input) : input;
}

export function macroInputToG(input: number, unit: MacroUnit): number {
  return unit === 'oz' ? ozToG(input) : input;
}

// --- Validation ranges ---
export const WEIGHT_MAX_KG = 500;
export const WEIGHT_MAX_LBS = 1102; // Math.round(500 * KG_TO_LBS)

export function weightMaxForUnit(unit: WeightUnit): number {
  return unit === 'lbs' ? WEIGHT_MAX_LBS : WEIGHT_MAX_KG;
}

export function weightRangeLabel(unit: WeightUnit): string {
  return unit === 'lbs' ? '0–1102 lbs' : '0–500 kg';
}
