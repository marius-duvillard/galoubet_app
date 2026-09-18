import { describe, expect, it } from "vitest";
// Import par namespace : src/staff.ts n'existe pas encore (phase RED de la
// TDD). Comme il s'agit d'un fichier de tests entièrement nouveau, l'échec
// de collecte sur l'ensemble du fichier est l'état attendu de cette tâche.
import * as staff from "./staff";

// A) notePosition — octave 4 complet + ancres hors octave 4

// Table d'acceptation : les 12 classes de hauteur de l'octave 4
// (MIDI 60..71), orthographe imposée par CHIP_KEYS (mi = 1{Do♯}, 3{Mi♭},
// 6{Fa♯}, 8{La♭}, 10{Si♭}) ; diatonic = octave * 7 + step, octave = floor(midi/12) - 1.
const OCTAVE4_TABLE: { midi: number; pos: [string, number, number, number] }[] = [
  { midi: 60, pos: ["Do", 0, 0, 28] },
  { midi: 61, pos: ["Do", 0, 1, 29] },
  { midi: 62, pos: ["Ré", 1, 0, 30] },
  { midi: 63, pos: ["Mi", 2, -1, 30] },
  { midi: 64, pos: ["Mi", 2, 0, 31] },
  { midi: 65, pos: ["Fa", 3, 0, 31] },
  { midi: 66, pos: ["Fa", 3, 1, 32] },
  { midi: 67, pos: ["Sol", 4, 0, 32] },
  { midi: 68, pos: ["La", 5, -1, 33] },
  { midi: 69, pos: ["La", 5, 0, 33] },
  { midi: 70, pos: ["Si", 6, -1, 34] },
  { midi: 71, pos: ["Si", 6, 0, 34] },
];

// Ancres : bornes de la plage MIDI de l'app (48..84), La4 = 440 Hz (69),
// et notes clés de l'ambitus (63 = Mi♭4 première ligne, 82 = Si♭5 au-dessus
// de la portée). Tuples dérivés de la formule verrouillée :
// octave = floor(midi/12) - 1, diatonic = octave * 7 + step (Do3 = 21).
const ANCHORS: { midi: number; pos: [string, number, number, number] }[] = [
  { midi: 48, pos: ["Do", 0, 0, 21] },
  { midi: 63, pos: ["Mi", 2, -1, 30] },
  { midi: 69, pos: ["La", 5, 0, 33] },
  { midi: 82, pos: ["Si", 6, -1, 41] },
  { midi: 84, pos: ["Do", 0, 0, 42] },
  { midi: 59, pos: ["Si", 6, 0, 27] },
  { midi: 61, pos: ["Do", 0, 1, 29] },
];

describe("A) notePosition", () => {
  for (const { midi, pos } of OCTAVE4_TABLE) {
    it(`notePosition(${midi}) — octave 4, mi ${pos[0]}`, () => {
      const [letter, step, accidental, diatonic] = pos;
      expect(staff.notePosition(midi)).toEqual({ letter, step, accidental, diatonic });
    });
  }

  for (const { midi, pos } of ANCHORS) {
    it(`ancre notePosition(${midi})`, () => {
      const [letter, step, accidental, diatonic] = pos;
      expect(staff.notePosition(midi)).toEqual({ letter, step, accidental, diatonic });
    });
  }
});

// B) yFromDiatonic — ordonnée pixel (y vers le bas), 38 = ligne supérieure Fa5

describe("B) yFromDiatonic", () => {
  it("y(38, 6, 20) = 20 : la ligne supérieure est à topLineY", () => {
    expect(staff.yFromDiatonic(38, 6, 20)).toBe(20);
  });

  it("y(30, 6, 20) = 44 : la ligne inférieure est 4 intervalles de demi-ligne plus bas", () => {
    expect(staff.yFromDiatonic(30, 6, 20)).toBe(44);
  });

  it("y(41, 6, 20) = 11 : au-dessus de la portée, y décroît", () => {
    expect(staff.yFromDiatonic(41, 6, 20)).toBe(11);
  });

  it("y(28, 6, 20) = 50 : une ligne sous la portée", () => {
    expect(staff.yFromDiatonic(28, 6, 20)).toBe(50);
  });

  it("strictement décroissant de 3 (spacing / 2) par diatonic + 1, spacing 6", () => {
    for (let d = 24; d < 44; d++) {
      expect(staff.yFromDiatonic(d + 1, 6, 20)).toBe(
        staff.yFromDiatonic(d, 6, 20) - 3,
      );
    }
  });
});

// C) ledgerLinesFor — lignes additives, positions paires ascendantes

const LEDGER_TABLE: [number, number[]][] = [
  [30, []],
  [29, []],
  [28, [28]],
  [27, [28]],
  [26, [28, 26]],
  [25, [28, 26]],
  [24, [28, 26, 24]],
  [38, []],
  [39, []],
  [40, [40]],
  [41, [40]],
  [42, [40, 42]],
  [43, [40, 42]],
];

describe("C) ledgerLinesFor", () => {
  for (const [diatonic, lines] of LEDGER_TABLE) {
    it(`ledgerLinesFor(${diatonic}) = [${lines.join(", ")}]`, () => {
      expect(staff.ledgerLinesFor(diatonic)).toEqual(lines);
    });
  }
});

// D) Constantes de portée

describe("D) constantes de portée", () => {
  it("STAFF_TOP_LINE = 38 (Fa5, ligne supérieure)", () => {
    expect(staff.STAFF_TOP_LINE).toBe(38);
  });

  it("STAFF_BOTTOM_LINE = 30 (Mi4, ligne inférieure)", () => {
    expect(staff.STAFF_BOTTOM_LINE).toBe(30);
  });
});
