// Portée (clef de Sol) : géométrie pure des notes de l'étendue.
// Position = diatonique depuis la ligne du bas (E4 = 0, F4 = 1, …).
// Pure : aucun DOM, testable seul. Le rendu SVG est dans components/Staff.

import { RANGE_MAX, RANGE_MIN } from "./ambitus";

/** Écart entre deux lignes de la portée, en unités du viewBox. */
export const STAFF_SPACING = 16;

/** Ligne du bas (E4) en y du viewBox ; les lignes sont à 0, 16, 32, 48, 64. */
export const STAFF_BOTTOM_Y = 64;

/** y SVG d'une position (0 = E4 ligne du bas). */
export function positionY(position: number): number {
  return STAFF_BOTTOM_Y - position * (STAFF_SPACING / 2);
}

/**
 * Nom de portée canonique par pitch class (aligné sur CHIP_KEYS) :
 * letter 0=Do…6=Si, accidental −1/0/+1.
 */
const STAFF_NAMES: readonly { letter: number; accidental: number }[] = [
  { letter: 0, accidental: 0 }, // Do
  { letter: 0, accidental: 1 }, // Do♯
  { letter: 1, accidental: 0 }, // Ré
  { letter: 2, accidental: -1 }, // Mi♭
  { letter: 2, accidental: 0 }, // Mi
  { letter: 3, accidental: 0 }, // Fa
  { letter: 3, accidental: 1 }, // Fa♯
  { letter: 4, accidental: 0 }, // Sol
  { letter: 5, accidental: -1 }, // La♭
  { letter: 5, accidental: 0 }, // La
  { letter: 6, accidental: -1 }, // Si♭
  { letter: 6, accidental: 0 }, // Si
];

/** pc naturel de chaque letter (Do 0, Ré 2, Mi 4, Fa 5, Sol 7, La 9, Si 11). */
const NATURAL_PC: readonly number[] = [0, 2, 4, 5, 7, 9, 11];

/** Position diatonique de la ligne du bas (E4). */
const E4_STEP = 2 + 7 * 4;

/** MIDI → position sur la portée (E4 = 0, C4 = −2, C6 = 12). */
export function midiToPosition(midi: number): number {
  const pc = ((midi % 12) + 12) % 12;
  const { letter, accidental } = STAFF_NAMES[pc];
  const natural = midi - accidental;
  const octave = Math.floor(natural / 12) - 1;
  return letter + 7 * octave - E4_STEP;
}

/** MIDI naturel (sans altération) de la position, lettre d'implémentation près. */
export function positionToNaturalMidi(position: number): number {
  const step = position + E4_STEP;
  const letter = ((step % 7) + 7) % 7;
  const octave = Math.floor(step / 7);
  return NATURAL_PC[letter] + (octave + 1) * 12;
}

/** Altération canonique (−1/0/+1) du pitch class d'un MIDI. */
export function midiAccidental(midi: number): number {
  return STAFF_NAMES[((midi % 12) + 12) % 12].accidental;
}

/** Clamp dans les bornes de sélection de l'étendue. */
export function clampMidi(midi: number): number {
  return Math.min(RANGE_MAX, Math.max(RANGE_MIN, midi));
}

/**
 * MIDI obtenu en déplaçant une note vers une position : la note garde
 * l'altération canonique qu'elle portait (Mi♭ → Fa♭), clampée dans [48, 84].
 */
export function midiWithAccidental(midi: number, position: number): number {
  return clampMidi(positionToNaturalMidi(position) + midiAccidental(midi));
}

/** MIDI après changement d'altération (−1 = ♭, 0 = ♮, +1 = ♯), même position. */
export function midiWithAccidentalShift(midi: number, delta: number): number {
  const position = midiToPosition(midi);
  const natural = positionToNaturalMidi(position);
  return clampMidi(natural + Math.max(-1, Math.min(1, midiAccidental(midi) + delta)));
}

/**
 * Lignes supplémentaires (lignes d'attente) à tirer pour une position :
 * positions paires ≤ −2 (graves) et ≥ 10 (aiguës).
 */
export function ledgerLinesFor(position: number): number[] {
  const lines: number[] = [];
  if (position <= -2) {
    const last = position % 2 === 0 ? position : position + 1;
    for (let line = -2; line >= last; line -= 2) lines.push(line);
  } else if (position >= 10) {
    const last = position % 2 === 0 ? position : position - 1;
    for (let line = 10; line <= last; line += 2) lines.push(line);
  }
  return lines;
}

/** Symbole d'altération à tirer devant la note (♭ / ♯ / null). */
export function accidentalSymbol(midi: number): string | null {
  const acc = midiAccidental(midi);
  return acc < 0 ? "♭" : acc > 0 ? "♯" : null;
}
