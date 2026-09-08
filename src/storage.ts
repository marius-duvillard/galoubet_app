// Persistance de l'état de l'app dans localStorage (clé versionnée).
// Validation de schéma : toute valeur illisible retombe sur la valeur par défaut.

import type { Flute } from "./transposition";

export type Tab = "f1" | "f2";

export interface AppState {
  tab: Tab;
  f1: { writtenPc: number; flute: Flute };
  f2: { realPc: number };
}

const STORAGE_KEY = "galoubet.state.v1";

export const DEFAULT_STATE: AppState = {
  tab: "f1",
  f1: { writtenPc: 10, flute: "Si" },
  f2: { realPc: 9 },
};

const FLUTE_VALUES: readonly Flute[] = ["Si", "Si♭", "La", "Sol", "Ut"];

function isPc(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 11;
}

function isFlute(value: unknown): value is Flute {
  return typeof value === "string" && (FLUTE_VALUES as readonly string[]).includes(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return DEFAULT_STATE;
    }
    const parsed = asRecord(JSON.parse(raw));
    if (parsed === null) {
      return DEFAULT_STATE;
    }

    const tab: Tab = parsed.tab === "f2" ? "f2" : parsed.tab === "f1" ? "f1" : DEFAULT_STATE.tab;

    const f1Raw = asRecord(parsed.f1);
    const writtenPc =
      f1Raw !== null && isPc(f1Raw.writtenPc) ? f1Raw.writtenPc : DEFAULT_STATE.f1.writtenPc;
    const flute =
      f1Raw !== null && isFlute(f1Raw.flute) ? f1Raw.flute : DEFAULT_STATE.f1.flute;

    const f2Raw = asRecord(parsed.f2);
    const realPc = f2Raw !== null && isPc(f2Raw.realPc) ? f2Raw.realPc : DEFAULT_STATE.f2.realPc;

    return { tab, f1: { writtenPc, flute }, f2: { realPc } };
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
