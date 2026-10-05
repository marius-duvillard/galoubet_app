import { describe, expect, it } from "vitest";
import type { Flute } from "./transposition";
import { bestConfigs } from "./transposition";
import type { OctaveShift } from "./ambitus";
import {
  AMBITUS_HIGH,
  AMBITUS_LOW,
  RANGE_MAX,
  RANGE_MIN,
  fitsAmbitus,
  formatNote,
  octaveLabel,
  octaveShiftToFit,
  pickWithRange,
  writtenRange,
} from "./ambitus";

// A) Constantes d'ambitus et de sélection

describe("A) constantes d'ambitus", () => {
  it("AMBITUS_LOW = 63 (Mi♭4, 1re ligne de portée)", () => {
    expect(AMBITUS_LOW).toBe(63);
  });
  it("AMBITUS_HIGH = 82 (Si♭5, au-dessus de la portée)", () => {
    expect(AMBITUS_HIGH).toBe(82);
  });
  it("RANGE_MIN = 48 (Do3, borne de sélection)", () => {
    expect(RANGE_MIN).toBe(48);
  });
  it("RANGE_MAX = 84 (Do6, borne de sélection)", () => {
    expect(RANGE_MAX).toBe(84);
  });
  it("galoubet en Ut : ambitus réel = ambitus noté (Mi♭4 → Si♭5)", () => {
    // Intervalle 0 : le son réel est la lecture.
    expect(writtenRange(AMBITUS_LOW, AMBITUS_HIGH, "Ut")).toEqual({
      low: 63,
      high: 82,
    });
    expect([formatNote(63), formatNote(82)]).toEqual(["Mi♭4", "Si♭5"]);
  });
});

// B) formatNote

const FORMAT_NOTE_EXPECTED: [number, string][] = [
  [48, "Do3"],
  [60, "Do4"],
  [63, "Mi♭4"],
  [71, "Si4"],
  [72, "Do5"],
  [82, "Si♭5"],
  [84, "Do6"],
];

describe("B) formatNote", () => {
  for (const [midi, name] of FORMAT_NOTE_EXPECTED) {
    it(`formatNote(${midi}) = ${name}`, () => {
      expect(formatNote(midi)).toBe(name);
    });
  }
});

// C) writtenRange — notée = réelle − FLUTE_INTERVAL

const WRITTEN_RANGE_EXPECTED: {
  flute: Flute;
  real: [number, number];
  written: [number, number];
}[] = [
  { flute: "Si", real: [63, 82], written: [64, 83] },
  { flute: "Si♭", real: [63, 82], written: [65, 84] },
  { flute: "La", real: [63, 82], written: [66, 85] },
  { flute: "Sol", real: [63, 82], written: [68, 87] },
  { flute: "Ut", real: [63, 82], written: [63, 82] },
  { flute: "Si♭", real: [60, 72], written: [62, 74] },
];

describe("C) writtenRange", () => {
  for (const { flute, real, written } of WRITTEN_RANGE_EXPECTED) {
    it(`writtenRange(${real[0]}, ${real[1]}, ${flute})`, () => {
      expect(writtenRange(real[0], real[1], flute)).toEqual({
        low: written[0],
        high: written[1],
      });
    });
  }
});

// D) fitsAmbitus — matrice de bornes (63 ≤ low, high ≤ 82)

const FITS_EXPECTED: [number, number, boolean][] = [
  [63, 82, true],
  [63, 63, true],
  [82, 82, true],
  [64, 81, true],
  [62, 82, false],
  [63, 83, false],
  [62, 83, false],
  [83, 83, false],
];

describe("D) fitsAmbitus", () => {
  for (const [low, high, expected] of FITS_EXPECTED) {
    it(`fitsAmbitus(${low}, ${high}) = ${expected}`, () => {
      expect(fitsAmbitus(low, high)).toBe(expected);
    });
  }
});

// E) pickWithRange — scénarios d'acceptation

describe("E) pickWithRange", () => {
  it("Ré réel 60–79 : seul La tient, primary = La notée Fa (63–82)", () => {
    const r = pickWithRange(2, 60, 79);
    expect(r.candidates).toEqual([
      {
        flute: "La",
        writtenPc: 5,
        d: 1,
        inRange: true,
        label: "peu de demi-trous",
        fitsRange: true,
        writtenLow: 63,
        writtenHigh: 82,
        octaveShift: 0,
      },
      {
        flute: "Si",
        writtenPc: 3,
        d: 1,
        inRange: true,
        label: "peu de demi-trous",
        fitsRange: false,
        writtenLow: 61,
        writtenHigh: 80,
        octaveShift: 0,
      },
    ]);
    expect(r.primary).not.toBeNull();
    expect(r.primary!.flute).toBe("La");
    expect(r.noneFits).toBe(false);
    expect(r.fallback).toBeNull();
  });

  it("Do réel 63–80 : La/Sol (d=1) échouent, Ut (d=2) tient → primary = Ut", () => {
    const r = pickWithRange(0, 63, 80);
    expect(r.candidates).toEqual([
      {
        flute: "Ut",
        writtenPc: 0,
        d: 2,
        inRange: true,
        label: "demi-trous poussés",
        fitsRange: true,
        writtenLow: 63,
        writtenHigh: 80,
        octaveShift: 0,
      },
      {
        flute: "La",
        writtenPc: 3,
        d: 1,
        inRange: true,
        label: "peu de demi-trous",
        fitsRange: false,
        writtenLow: 66,
        writtenHigh: 83,
        octaveShift: 0,
      },
      {
        flute: "Sol",
        writtenPc: 5,
        d: 1,
        inRange: true,
        label: "peu de demi-trous",
        fitsRange: false,
        writtenLow: 68,
        writtenHigh: 85,
        octaveShift: 0,
      },
    ]);
    expect(r.primary).not.toBeNull();
    expect(r.primary!.flute).toBe("Ut");
    expect(r.primary!.d).toBe(2);
    expect(r.noneFits).toBe(false);
    expect(r.fallback).toBeNull();
  });

  it("plage 48–84 plus large que l'ambitus pour tous : noneFits, primary null", () => {
    const r = pickWithRange(2, 48, 84);
    expect(r.candidates).toEqual([
      {
        flute: "Si",
        writtenPc: 3,
        d: 1,
        inRange: true,
        label: "peu de demi-trous",
        fitsRange: false,
        writtenLow: 49,
        writtenHigh: 85,
        octaveShift: 0,
      },
      {
        flute: "La",
        writtenPc: 5,
        d: 1,
        inRange: true,
        label: "peu de demi-trous",
        fitsRange: false,
        writtenLow: 51,
        writtenHigh: 87,
        octaveShift: 0,
      },
    ]);
    expect(r.primary).toBeNull();
    expect(r.noneFits).toBe(true);
    expect(r.fallback).toBeNull();
  });

  it("Fa♯ réel 60–79 : candidats = [fallback annoté], primary null, noneFits false", () => {
    // Règle verrouillée fitsAmbitus : notée 61 < 63 (Mi♭4) → fitsRange = false.
    const r = pickWithRange(6, 60, 79);
    const fallback = {
      flute: "Si",
      writtenPc: 7,
      d: 1,
      inRange: false,
      label: "hors plage",
      fitsRange: false,
      writtenLow: 61,
      writtenHigh: 80,
      octaveShift: 0,
    };
    expect(r.candidates).toEqual([fallback]);
    expect(r.fallback).toEqual(fallback);
    expect(r.primary).toBeNull();
    expect(r.noneFits).toBe(false);
  });

  it("ne mute pas bestConfigs ni ses propres résultats (deux appels)", () => {
    const before = JSON.stringify(bestConfigs(2));
    const r1 = pickWithRange(2, 60, 79);
    const r2 = pickWithRange(2, 60, 79);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
    expect(JSON.stringify(bestConfigs(2))).toBe(before);
  });
});

// F) octaveShiftToFit — table (ordre de préférence 0, puis -12, puis +12)

const OCTAVE_SHIFT_EXPECTED: [number, number, OctaveShift | null][] = [
  [63, 82, 0],
  [63, 63, 0],
  [82, 82, 0],
  [63, 70, 0],
  [75, 82, 0],
  [75, 84, -12],
  [83, 89, -12],
  [51, 63, 12],
  [51, 70, 12],
  [62, 70, 12],
  [62, 71, null],
  [48, 67, null],
  [48, 48, null],
  [49, 85, null],
];

describe("F) octaveShiftToFit", () => {
  for (const [low, high, expected] of OCTAVE_SHIFT_EXPECTED) {
    it(`octaveShiftToFit(${low}, ${high}) = ${expected}`, () => {
      expect(octaveShiftToFit(low, high)).toBe(expected);
    });
  }
});

// G) pickWithRange — tolérance à l'octave

describe("G) pickWithRange à l'octave", () => {
  it("G-01 Mi♭ réel 75–84 : tout tient une octave plus bas, primary = La", () => {
    const r = pickWithRange(0, 75, 84);
    expect(r.candidates).toEqual([
      {
        flute: "La",
        writtenPc: 3,
        d: 1,
        inRange: true,
        label: "peu de demi-trous",
        fitsRange: true,
        writtenLow: 66,
        writtenHigh: 75,
        octaveShift: -12,
      },
      {
        flute: "Sol",
        writtenPc: 5,
        d: 1,
        inRange: true,
        label: "peu de demi-trous",
        fitsRange: true,
        writtenLow: 68,
        writtenHigh: 77,
        octaveShift: -12,
      },
      {
        flute: "Ut",
        writtenPc: 0,
        d: 2,
        inRange: true,
        label: "demi-trous poussés",
        fitsRange: true,
        writtenLow: 63,
        writtenHigh: 72,
        octaveShift: -12,
      },
    ]);
    expect(r.primary!.flute).toBe("La");
    expect(r.noneFits).toBe(false);
    expect(r.fallback).toBeNull();
  });

  it("G-02 Mi♭ réel 70–80 : Ut tient à la hauteur réelle (d=2) avant Sol à l'octave (d=1)", () => {
    const r = pickWithRange(0, 70, 80);
    expect(r.candidates.map((c) => c.flute)).toEqual(["Ut", "Sol", "La"]);
    expect(r.candidates[0]).toMatchObject({ d: 2, fitsRange: true, octaveShift: 0 });
    expect(r.candidates[1]).toMatchObject({ d: 1, fitsRange: true, octaveShift: -12 });
    expect(r.candidates[2]).toMatchObject({ d: 1, fitsRange: false, octaveShift: 0 });
    expect(r.primary!.flute).toBe("Ut");
  });

  it("G-03 Mi♭ réel 58–58 : à d égaux, la hauteur réelle gagne (Sol avant La)", () => {
    const r = pickWithRange(0, 58, 58);
    expect(r.candidates.map((c) => c.flute)).toEqual(["Sol", "La", "Ut"]);
    expect(r.primary!.flute).toBe("Sol");
  });

  it("G-04 Fa♯ réel 75–84 : le repli qui tient à l'octave ne devient jamais primary", () => {
    const r = pickWithRange(6, 75, 84);
    const attendu = {
      flute: "Si",
      writtenPc: 7,
      d: 1,
      inRange: false,
      label: "hors plage",
      fitsRange: true,
      writtenLow: 64,
      writtenHigh: 73,
      octaveShift: -12,
    };
    expect(r.candidates).toEqual([attendu]);
    expect(r.fallback).toEqual(attendu);
    expect(r.primary).toBeNull();
    expect(r.noneFits).toBe(false);
  });

  it("G-05 Mi♭ réel 51–63 : tout tient une octave plus haut, primary = La", () => {
    const r = pickWithRange(0, 51, 63);
    expect(r.candidates.map((c) => c.octaveShift)).toEqual([12, 12, 12]);
    expect(r.candidates.map((c) => c.writtenLow)).toEqual([66, 68, 63]);
    expect(r.primary!.flute).toBe("La");
  });

  it("G-06 Mi♭ réel 49–68 : l'octave ne sauve rien (bande 62/71), noneFits", () => {
    const r = pickWithRange(0, 49, 68);
    expect(r.candidates.map((c) => c.fitsRange)).toEqual([false, false, false]);
    expect(r.candidates.map((c) => c.octaveShift)).toEqual([0, 0, 0]);
    expect(r.primary).toBeNull();
    expect(r.noneFits).toBe(true);
  });

  it("G-07 invariant : octaveShift ≠ 0 ⟹ fitsRange (12 tonalités × 5 plages)", () => {
    const ranges: [number, number][] = [
      [48, 67],
      [63, 82],
      [75, 84],
      [51, 63],
      [49, 68],
    ];
    for (let realPc = 0; realPc < 12; realPc++) {
      for (const [low, high] of ranges) {
        for (const c of pickWithRange(realPc, low, high).candidates) {
          if (c.octaveShift !== 0) {
            expect(c.fitsRange).toBe(true);
          }
        }
      }
    }
  });

  it("G-08 Ré réel 60–79 : aucun décalage ne fuit sur ce qui tient déjà", () => {
    const r = pickWithRange(2, 60, 79);
    expect(r.candidates[0]).toMatchObject({
      flute: "La",
      fitsRange: true,
      octaveShift: 0,
      writtenLow: 63,
      writtenHigh: 82,
    });
    expect(r.candidates[1]).toMatchObject({
      flute: "Si",
      fitsRange: false,
      octaveShift: 0,
    });
  });
});

// H) octaveLabel

describe("H) octaveLabel", () => {
  it('octaveLabel(0) = "" (aucun décalage)', () => {
    expect(octaveLabel(0)).toBe("");
  });
  it('octaveLabel(-12) = "octave plus bas"', () => {
    expect(octaveLabel(-12)).toBe("octave plus bas");
  });
  it('octaveLabel(12) = "octave plus haut"', () => {
    expect(octaveLabel(12)).toBe("octave plus haut");
  });
});
