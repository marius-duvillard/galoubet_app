// Persistance de l'état de l'app dans localStorage (clé versionnée).
// Validation de schéma tolérante : toute valeur illisible retombe sur la
// valeur par défaut. parseState est pure (texte → état), sans localStorage.

import { AMBITUS_HIGH, AMBITUS_LOW, RANGE_MAX, RANGE_MIN } from "./ambitus";
import type { Flute } from "./transposition";

export type Tab = "f1" | "f2";

/** Étendue réelle d'un morceau, en MIDI. */
export interface Range {
  low: number;
  high: number;
}

export interface AppState {
  tab: Tab;
  f1: { writtenPc: number; flute: Flute; noteMidi: number };
  f2: { realPc: number; rangeLow?: number; rangeHigh?: number };
}

const STORAGE_KEY = "galoubet.state.v1";

/** Note écrite posée sur la portée de F1 (Sol4, libre dans l'ambitus). */
export const DEFAULT_NOTE_MIDI = 67;

export const DEFAULT_STATE: AppState = {
  tab: "f1",
  f1: { writtenPc: 10, flute: "Si", noteMidi: DEFAULT_NOTE_MIDI },
  f2: { realPc: 9 },
};

const FLUTE_VALUES: readonly Flute[] = ["Si", "Si♭", "La", "Sol", "Ut"];

function isPc(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 11;
}

function isFlute(value: unknown): value is Flute {
  return typeof value === "string" && (FLUTE_VALUES as readonly string[]).includes(value);
}

function isRangeMidi(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= RANGE_MIN &&
    value <= RANGE_MAX
  );
}

function isAmbitusMidi(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= AMBITUS_LOW &&
    value <= AMBITUS_HIGH
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

// Tolérant : les deux bornes sont conservées uniquement si toutes deux
// présentes, entières dans [RANGE_MIN, RANGE_MAX] et low ≤ high ; sinon les
// deux sont abandonnées.
function parseRange(
  raw: Record<string, unknown>,
): { rangeLow: number; rangeHigh: number } | null {
  if (isRangeMidi(raw.rangeLow) && isRangeMidi(raw.rangeHigh) && raw.rangeLow <= raw.rangeHigh) {
    return { rangeLow: raw.rangeLow, rangeHigh: raw.rangeHigh };
  }
  return null;
}

/** Parse un texte JSON en état validé ; tout repli renvoie DEFAULT_STATE. */
export function parseState(text: string | null): AppState {
  if (text === null) {
    return DEFAULT_STATE;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return DEFAULT_STATE;
  }
  const record = asRecord(parsed);
  if (record === null) {
    return DEFAULT_STATE;
  }

  const tab: Tab = record.tab === "f2" ? "f2" : record.tab === "f1" ? "f1" : DEFAULT_STATE.tab;

  const f1Raw = asRecord(record.f1);
  const writtenPc =
    f1Raw !== null && isPc(f1Raw.writtenPc) ? f1Raw.writtenPc : DEFAULT_STATE.f1.writtenPc;
  const flute = f1Raw !== null && isFlute(f1Raw.flute) ? f1Raw.flute : DEFAULT_STATE.f1.flute;
  const noteMidi =
    f1Raw !== null && isAmbitusMidi(f1Raw.noteMidi)
      ? f1Raw.noteMidi
      : DEFAULT_STATE.f1.noteMidi;

  const f2Raw = asRecord(record.f2);
  const realPc = f2Raw !== null && isPc(f2Raw.realPc) ? f2Raw.realPc : DEFAULT_STATE.f2.realPc;
  const range = f2Raw !== null ? parseRange(f2Raw) : null;
  const f2: AppState["f2"] =
    range === null ? { realPc } : { realPc, rangeLow: range.rangeLow, rangeHigh: range.rangeHigh };

  return { tab, f1: { writtenPc, flute, noteMidi }, f2 };
}

export function loadState(): AppState {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible (navigation privée, quota) : l'app reste fonctionnelle en mémoire.
  }
}
