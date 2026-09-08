import { describe, expect, it } from "vitest";
import type { Flute } from "./transposition";
import {
  CHIP_KEYS,
  FLUTE_COMMONNESS,
  FLUTES,
  FLUTE_INTERVAL,
  accidentalsOf,
  bestConfigs,
  comfort,
  flatsOf,
  formatKey,
  keyInfo,
  realTone,
  sharpsOf,
  writtenTone,
} from "./transposition";

// A) Constantes des flûtes

describe("A) flûtes", () => {
  it("FLUTE_INTERVAL deep-equals the spec", () => {
    expect(FLUTE_INTERVAL).toEqual({
      "Si": -1,
      "Si♭": -2,
      "La": -3,
      "Sol": -5,
      "Ut": 0,
    });
  });

  it("FLUTES equals commonness order", () => {
    expect(FLUTES).toEqual(["Si", "Si♭", "La", "Sol", "Ut"]);
  });

  it("FLUTE_COMMONNESS equals the spec", () => {
    expect(FLUTE_COMMONNESS).toEqual({
      "Si": 0,
      "Si♭": 1,
      "La": 2,
      "Sol": 3,
      "Ut": 4,
    });
  });
});

// B) F1 — realTone / writtenTone

describe("B) F1 realTone / writtenTone", () => {
  it("spot checks", () => {
    expect(realTone(10, "Si")).toBe(9); // notée Si♭, flûte Si → La
    expect(realTone(10, "Ut")).toBe(10); // notée Si♭, flûte Ut → Si♭ (transposition nulle)
    expect(realTone(0, "Sol")).toBe(7); // notée Do, flûte Sol → Sol (correction de spec: pas Fa)
    expect(realTone(10, "Sol")).toBe(5); // notée Si♭, flûte Sol → Fa
  });

  it("writtenTone ∘ realTone = identity, every pc, every flute", () => {
    for (let pc = 0; pc < 12; pc++) {
      for (const f of FLUTES) {
        expect(writtenTone(realTone(pc, f), f)).toBe(pc);
      }
    }
  });

  it("realTone(pc, Ut) = pc, every pc", () => {
    for (let pc = 0; pc < 12; pc++) {
      expect(realTone(pc, "Ut")).toBe(pc);
    }
  });
});

// C) F2 — tableau d'acceptation

const ROWS: {
  real: number;
  primary?: [Flute, number, number];
  others?: [Flute, number, number][];
  fallback?: [Flute, number];
}[] = [
  { real: 0,  primary: ["La", 3, 1],   others: [["Sol", 5, 1], ["Ut", 0, 2]] },
  { real: 1,  primary: ["Si♭", 3, 1],  others: [] },
  { real: 2,  primary: ["Si", 3, 1],   others: [["La", 5, 1]] },
  { real: 3,  primary: ["Si♭", 5, 1],  others: [["Ut", 3, 1]] },
  { real: 4,  primary: ["Si", 5, 1],   others: [] },
  { real: 5,  primary: ["Sol", 10, 0], others: [["Ut", 5, 1]] },
  { real: 6,  fallback: ["Si", 7] },
  { real: 7,  primary: ["La", 10, 0],  others: [["Sol", 0, 2]] },
  { real: 8,  primary: ["Si♭", 10, 0], others: [] },
  { real: 9,  primary: ["Si", 10, 0],  others: [["La", 0, 2]] },
  { real: 10, primary: ["Ut", 10, 0],  others: [["Sol", 3, 1], ["Si♭", 0, 2]] },
  { real: 11, primary: ["Si", 0, 2],   others: [] },
];

describe("C) F2 acceptance table", () => {
  for (const row of ROWS) {
    it(`real=${row.real}`, () => {
      const r = bestConfigs(row.real);
      if (row.fallback) {
        expect(r.candidates).toEqual([]);
        expect(r.primary).toBeNull();
        expect(r.fallback).not.toBeNull();
        expect(r.fallback!.flute).toBe(row.fallback[0]);
        expect(r.fallback!.writtenPc).toBe(row.fallback[1]);
        expect(r.fallback!.inRange).toBe(false);
        expect(r.fallback!.label).toBe("hors plage");
      } else {
        expect(r.fallback).toBeNull();
        const primary = r.primary!;
        expect(primary).not.toBeNull();
        expect([primary.flute, primary.writtenPc, primary.d]).toEqual(row.primary);
        expect(r.candidates[0]).toBe(primary);
        expect(r.candidates.length).toBe(1 + (row.others?.length ?? 0));
        for (const [flute, writtenPc, d] of row.others ?? []) {
          expect(r.candidates).toContainEqual({
            flute,
            writtenPc,
            d,
            inRange: true,
            label: comfort(writtenPc).label,
          });
        }
        const expectedOrder: [Flute, number, number][] = [
          row.primary!,
          ...(row.others ?? []),
        ];
        const actualOrder: [Flute, number, number][] = r.candidates.map((c) => [
          c.flute,
          c.writtenPc,
          c.d,
        ]);
        expect(actualOrder).toEqual(expectedOrder);
      }
    });
  }
});

// D) Round-trip — le couple (flûte, ton notée) choisi doit figurer parmi les candidats

describe("D) round-trip", () => {
  for (const f of FLUTES) {
    for (const W of [0, 5, 10, 3]) {
      it(`bestConfigs(realTone(W=${W}, ${f})) contains flute=${f} written=${W}`, () => {
        const r = bestConfigs(realTone(W, f));
        const c = r.candidates.find((x) => x.flute === f && x.writtenPc === W);
        expect(c).toBeDefined();
        expect(c!.d).toBe(comfort(W).d);
      });
    }
  }
});

// E) keyInfo

const KEY_INFO_EXPECTED: [string, "none" | "sharp" | "flat", number][] = [
  ["Do", "none", 0],
  ["Do♯", "sharp", 1],
  ["Ré", "sharp", 2],
  ["Mi♭", "flat", 3],
  ["Mi", "sharp", 4],
  ["Fa", "flat", 1],
  ["Fa♯", "sharp", 6],
  ["Sol", "sharp", 1],
  ["La♭", "flat", 4],
  ["La", "sharp", 3],
  ["Si♭", "flat", 2],
  ["Si", "sharp", 5],
];

describe("E) keyInfo", () => {
  for (let pc = 0; pc < 12; pc++) {
    const [name, accidentalType, accidentals] = KEY_INFO_EXPECTED[pc];
    it(`keyInfo(${pc})`, () => {
      expect(keyInfo(pc)).toEqual({ pc, name, accidentalType, accidentals });
    });
  }
});

// F) formatKey

const FORMAT_KEY_EXPECTED = [
  "Do majeur",
  "Do♯ majeur · 1 dièse",
  "Ré majeur · 2 dièses",
  "Mi♭ majeur · 3 bémols",
  "Mi majeur · 4 dièses",
  "Fa majeur · 1 bémol",
  "Fa♯ majeur · 6 dièses",
  "Sol majeur · 1 dièse",
  "La♭ majeur · 4 bémols",
  "La majeur · 3 dièses",
  "Si♭ majeur · 2 bémols",
  "Si majeur · 5 dièses",
];

describe("F) formatKey", () => {
  for (let pc = 0; pc < 12; pc++) {
    it(`formatKey(${pc})`, () => {
      expect(formatKey(pc)).toBe(FORMAT_KEY_EXPECTED[pc]);
    });
  }
});

// G) comfort

describe("G) comfort", () => {
  it("comfort(10)", () => {
    expect(comfort(10)).toEqual({ d: 0, label: "naturel", inRange: true });
  });
  it("comfort(5)", () => {
    expect(comfort(5)).toEqual({ d: 1, label: "peu de demi-trous", inRange: true });
  });
  it("comfort(3)", () => {
    expect(comfort(3)).toEqual({ d: 1, label: "peu de demi-trous", inRange: true });
  });
  it("comfort(0)", () => {
    expect(comfort(0)).toEqual({ d: 2, label: "demi-trous poussés", inRange: true });
  });
  it("comfort(7)", () => {
    expect(comfort(7)).toEqual({ d: 9, label: "hors plage", inRange: false });
  });
  it("comfort(1)", () => {
    expect(comfort(1)).toEqual({ d: 3, label: "hors plage", inRange: false });
  });
});

// H) Tables

describe("H) tables", () => {
  it("flatsOf pc 0..11", () => {
    expect(Array.from({ length: 12 }, (_, pc) => flatsOf(pc))).toEqual([
      0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7,
    ]);
  });
  it("sharpsOf pc 0..11", () => {
    expect(Array.from({ length: 12 }, (_, pc) => sharpsOf(pc))).toEqual([
      0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5,
    ]);
  });
  it("accidentalsOf pc 0..11", () => {
    expect(Array.from({ length: 12 }, (_, pc) => accidentalsOf(pc))).toEqual([
      0, 5, 2, 3, 4, 1, 6, 1, 4, 3, 2, 5,
    ]);
  });
});

// I) CHIP_KEYS

describe("I) CHIP_KEYS", () => {
  it("names in pc order", () => {
    expect(CHIP_KEYS.map((k) => k.name)).toEqual([
      "Do", "Do♯", "Ré", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "La♭", "La", "Si♭", "Si",
    ]);
  });
  it("pcs 0..11 in order", () => {
    expect(CHIP_KEYS.map((k) => k.pc)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });
});
