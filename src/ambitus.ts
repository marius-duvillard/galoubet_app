// Ambitus du galoubet : l'étendue notée tenable sur la portée.
// notée = réelle − FLUTE_INTERVAL (intervalle ≤ 0 → notée plus haut).
// Pure : aucun DOM, dépend uniquement de ./transposition.

import type { Candidate, Flute } from "./transposition";
import {
  CHIP_KEYS,
  FLUTE_COMMONNESS,
  FLUTE_INTERVAL,
  bestConfigs,
} from "./transposition";

/** Mi♭4 : première ligne de la portée. */
export const AMBITUS_LOW = 63;
/** Si♭5 : au-dessus de la portée. */
export const AMBITUS_HIGH = 82;

/** Bornes de sélection de l'étendue d'un morceau (Do3…Do6). */
export const RANGE_MIN = 48;
export const RANGE_MAX = 84;

/** Note MIDI au format « Do4 » (pitch class via CHIP_KEYS, octave MIDI). */
export function formatNote(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${CHIP_KEYS[pc].name}${octave}`;
}

/** Étendue réelle → étendue notée pour une flûte donnée. */
export function writtenRange(
  realLow: number,
  realHigh: number,
  flute: Flute,
): { low: number; high: number } {
  const shift = -FLUTE_INTERVAL[flute];
  return { low: realLow + shift, high: realHigh + shift };
}

/** L'étendue notée tient-elle dans l'ambitus [63, 82] ? */
export function fitsAmbitus(low: number, high: number): boolean {
  return low >= AMBITUS_LOW && high <= AMBITUS_HIGH;
}

export interface RangeCandidate {
  flute: Flute;
  writtenPc: number;
  d: number;
  inRange: boolean;
  label: string;
  fitsRange: boolean;
  writtenLow: number;
  writtenHigh: number;
}

export interface PickResult {
  candidates: RangeCandidate[];
  primary: RangeCandidate | null;
  noneFits: boolean;
  fallback: RangeCandidate | null;
}

function annotate(
  candidate: Candidate,
  realLow: number,
  realHigh: number,
): RangeCandidate {
  const written = writtenRange(realLow, realHigh, candidate.flute);
  return {
    flute: candidate.flute,
    writtenPc: candidate.writtenPc,
    d: candidate.d,
    inRange: candidate.inRange,
    label: candidate.label,
    fitsRange: fitsAmbitus(written.low, written.high),
    writtenLow: written.low,
    writtenHigh: written.high,
  };
}

function byFitThenComfort(a: RangeCandidate, b: RangeCandidate): number {
  return (
    Number(b.fitsRange) - Number(a.fitsRange) ||
    a.d - b.d ||
    FLUTE_COMMONNESS[a.flute] - FLUTE_COMMONNESS[b.flute]
  );
}

/**
 * Choix de flûte avec contrôle d'ambitus : les candidats de confort de
 * bestConfigs sont annotés avec l'étendue notée, triés par (tient, d,
 * commonness) ; primary = premier qui tient. Si aucun ne tient, noneFits.
 * En l'absence de candidat de confort, le fallback de bestConfigs est
 * annoté et exposé seul (candidates = [fallback], noneFits = false).
 * bestConfigs et ses objets ne sont jamais mutés.
 */
export function pickWithRange(
  realPc: number,
  realLow: number,
  realHigh: number,
): PickResult {
  const base = bestConfigs(realPc);
  const comfort = base.candidates
    .map((candidate) => annotate(candidate, realLow, realHigh))
    .sort(byFitThenComfort);
  const fallback =
    base.fallback === null
      ? null
      : annotate(base.fallback, realLow, realHigh);
  const candidates =
    comfort.length > 0
      ? comfort
      : fallback === null
        ? []
        : [fallback];
  const primary = candidates.find((candidate) => candidate.fitsRange) ?? null;
  const noneFits = comfort.length > 0 && primary === null;
  return { candidates, primary, noneFits, fallback };
}
