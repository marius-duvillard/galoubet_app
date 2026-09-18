import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, parseState } from "./storage";

// parseState : fonction pure (texte → état), sans localStorage.

function payload(f2: Record<string, unknown>): string {
  return JSON.stringify({
    tab: "f1",
    f1: { writtenPc: 10, flute: "Si" },
    f2: { realPc: 9, ...f2 },
  });
}

// A) Repli sur DEFAULT_STATE

describe("A) parseState — repli", () => {
  it("null → DEFAULT_STATE", () => {
    expect(parseState(null)).toEqual(DEFAULT_STATE);
  });

  it("JSON malformé → DEFAULT_STATE", () => {
    expect(parseState("{pas du json")).toEqual(DEFAULT_STATE);
  });

  it("chaîne vide → DEFAULT_STATE", () => {
    expect(parseState("")).toEqual(DEFAULT_STATE);
  });

  it("JSON non-objet (tableau) → DEFAULT_STATE", () => {
    expect(parseState("[1,2,3]")).toEqual(DEFAULT_STATE);
  });
});

// B) Plage f2 — rangeLow / rangeHigh

describe("B) parseState — plage f2", () => {
  it("payload v1 sans plage → f2 sans rangeLow/rangeHigh", () => {
    const r = parseState(
      JSON.stringify({ tab: "f2", f1: { writtenPc: 3, flute: "La" }, f2: { realPc: 7 } }),
    );
    expect(r).toEqual({
      tab: "f2",
      f1: { writtenPc: 3, flute: "La", noteMidi: 67 },
      f2: { realPc: 7 },
    });
    expect(r.f2.rangeLow).toBeUndefined();
    expect(r.f2.rangeHigh).toBeUndefined();
  });

  it("plage valide 60–79 conservée", () => {
    const r = parseState(payload({ rangeLow: 60, rangeHigh: 79 }));
    expect(r.f2.rangeLow).toBe(60);
    expect(r.f2.rangeHigh).toBe(79);
  });

  it("bornes 48–84 conservées", () => {
    const r = parseState(payload({ rangeLow: 48, rangeHigh: 84 }));
    expect(r.f2.rangeLow).toBe(48);
    expect(r.f2.rangeHigh).toBe(84);
  });

  it("low == high (63–63) conservé", () => {
    const r = parseState(payload({ rangeLow: 63, rangeHigh: 63 }));
    expect(r.f2.rangeLow).toBe(63);
    expect(r.f2.rangeHigh).toBe(63);
  });

  it("un seul des deux champs → les deux dropés", () => {
    const onlyLow = parseState(payload({ rangeLow: 60 }));
    expect(onlyLow.f2.rangeLow).toBeUndefined();
    expect(onlyLow.f2.rangeHigh).toBeUndefined();
    const onlyHigh = parseState(payload({ rangeHigh: 79 }));
    expect(onlyHigh.f2.rangeLow).toBeUndefined();
    expect(onlyHigh.f2.rangeHigh).toBeUndefined();
  });

  it("low > high → les deux dropés", () => {
    const r = parseState(payload({ rangeLow: 79, rangeHigh: 60 }));
    expect(r.f2.rangeLow).toBeUndefined();
    expect(r.f2.rangeHigh).toBeUndefined();
  });

  it("rangeLow 47 hors bornes → les deux dropés", () => {
    const r = parseState(payload({ rangeLow: 47, rangeHigh: 79 }));
    expect(r.f2.rangeLow).toBeUndefined();
    expect(r.f2.rangeHigh).toBeUndefined();
  });

  it("rangeHigh 85 hors bornes → les deux dropés", () => {
    const r = parseState(payload({ rangeLow: 60, rangeHigh: 85 }));
    expect(r.f2.rangeLow).toBeUndefined();
    expect(r.f2.rangeHigh).toBeUndefined();
  });

  it("non-entier (60.5) → les deux dropés", () => {
    const r = parseState(payload({ rangeLow: 60.5, rangeHigh: 79 }));
    expect(r.f2.rangeLow).toBeUndefined();
    expect(r.f2.rangeHigh).toBeUndefined();
  });
});

// C) Validation existante préservée (tab / f1 / f2)

describe("C) parseState — validation tab / f1 / f2 préservée", () => {
  it("tab 'f2' conservé", () => {
    const r = parseState(
      JSON.stringify({ tab: "f2", f1: { writtenPc: 0, flute: "Ut" }, f2: { realPc: 5 } }),
    );
    expect(r.tab).toBe("f2");
    expect(r.f1).toEqual({ writtenPc: 0, flute: "Ut", noteMidi: 67 });
    expect(r.f2.realPc).toBe(5);
  });

  it("tab invalide → défaut 'f1'", () => {
    const r = parseState(
      JSON.stringify({ tab: "f3", f1: { writtenPc: 0, flute: "Ut" }, f2: { realPc: 5 } }),
    );
    expect(r.tab).toBe("f1");
  });

  it("f1 invalide (flute inconnue, pc hors 0–11) → défauts f1", () => {
    const r = parseState(
      JSON.stringify({ tab: "f1", f1: { writtenPc: 12, flute: "Ré" }, f2: { realPc: 5 } }),
    );
    expect(r.f1).toEqual({ writtenPc: 10, flute: "Si", noteMidi: 67 });
  });

  it("f1.noteMidi conservé (63, borne basse)", () => {
    const r = parseState(
      JSON.stringify({ tab: "f1", f1: { writtenPc: 0, flute: "Ut", noteMidi: 63 }, f2: { realPc: 5 } }),
    );
    expect(r.f1.noteMidi).toBe(63);
  });

  it("f1.noteMidi hors ambitus (62) → défaut 67", () => {
    const r = parseState(
      JSON.stringify({ tab: "f1", f1: { writtenPc: 0, flute: "Ut", noteMidi: 62 }, f2: { realPc: 5 } }),
    );
    expect(r.f1.noteMidi).toBe(67);
  });

  it("f1.noteMidi non entier (67.5) → défaut 67", () => {
    const r = parseState(
      JSON.stringify({ tab: "f1", f1: { writtenPc: 0, flute: "Ut", noteMidi: 67.5 }, f2: { realPc: 5 } }),
    );
    expect(r.f1.noteMidi).toBe(67);
  });

  it("f1 sans noteMidi → défaut 67", () => {
    const r = parseState(
      JSON.stringify({ tab: "f1", f1: { writtenPc: 0, flute: "Ut" }, f2: { realPc: 5 } }),
    );
    expect(r.f1.noteMidi).toBe(67);
  });

  it("f2.realPc invalide → défaut 9", () => {
    const r = parseState(
      JSON.stringify({ tab: "f1", f1: { writtenPc: 0, flute: "Ut" }, f2: { realPc: 24 } }),
    );
    expect(r.f2.realPc).toBe(9);
  });
});
