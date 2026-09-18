import { describe, expect, it } from "vitest";
import {
  STAFF_SPACING,
  accidentalSymbol,
  clampMidi,
  ledgerLinesFor,
  midiAccidental,
  midiToPosition,
  midiWithAccidental,
  midiWithAccidentalShift,
  positionToNaturalMidi,
  positionY,
  keySignatureOf,
  realTonicMidi,
  tonicInAmbitus,
} from "./staff";

// A) Positions repères (clef de Sol)
describe("midiToPosition", () => {
  it("ligne du bas = Mi4 (E4)", () => {
    expect(midiToPosition(64)).toBe(0);
  });
  it("Mi♭4 (première ligne, pc canonique Mi♭) = position 0", () => {
    expect(midiToPosition(63)).toBe(0);
  });
  it("Do4 = 1ʳᵉ ligne sous la portée (−2), Si♭3 = interligne sous la ligne (−3), La3 = −4", () => {
    expect(midiToPosition(60)).toBe(-2);
    expect(midiToPosition(58)).toBe(-3);
    expect(midiToPosition(57)).toBe(-4);
  });
  it("Fa4 (1ʳᵉ interligne) = 1, Sol4 (2ᵉ ligne) = 2, Si4 (3ˡ ligne) = 4", () => {
    expect(midiToPosition(65)).toBe(1);
    expect(midiToPosition(67)).toBe(2);
    expect(midiToPosition(71)).toBe(4);
  });
  it("ligne du haut Fa5 = 8, Do6 = 12", () => {
    expect(midiToPosition(77)).toBe(8);
    expect(midiToPosition(84)).toBe(12);
  });
  it("Si♭5 (haut de l'ambitus) = 11 (interligne au-dessus de la 1ʳᵉ ligne supplémentaire)", () => {
    expect(midiToPosition(82)).toBe(11);
  });
  it("Do3 (grave de la sélection) = −9", () => {
    expect(midiToPosition(48)).toBe(-9);
  });
  it("La4 (2ᵉ interligne) = 3", () => {
    expect(midiToPosition(69)).toBe(3);
  });
});

// B) Position → MIDI naturel
describe("positionToNaturalMidi", () => {
  it("0 → Mi4 (64)", () => {
    expect(positionToNaturalMidi(0)).toBe(64);
  });
  it("−2 → Do4 (60), −9 → Do3 (48)", () => {
    expect(positionToNaturalMidi(-2)).toBe(60);
    expect(positionToNaturalMidi(-9)).toBe(48);
  });
  it("12 → Do6 (84)", () => {
    expect(positionToNaturalMidi(12)).toBe(84);
  });
  it("round-trip : position → naturel → position = identité", () => {
    for (let position = -9; position <= 12; position += 1) {
      expect(midiToPosition(positionToNaturalMidi(position))).toBe(position);
    }
  });
});

// C) Altérations
describe("midiAccidental / accidentalSymbol", () => {
  it("Mi♭4 (63) = −1, Do♯4 (61) = +1, Mi4 (64) = 0", () => {
    expect(midiAccidental(63)).toBe(-1);
    expect(midiAccidental(61)).toBe(1);
    expect(midiAccidental(64)).toBe(0);
  });
  it("symboles : ♭ / ♯ / null", () => {
    expect(accidentalSymbol(63)).toBe("♭");
    expect(accidentalSymbol(61)).toBe("♯");
    expect(accidentalSymbol(64)).toBeNull();
  });
});

// D) Déplacement avec altération conservée
describe("midiWithAccidental", () => {
  it("Mi♭4 (63) → position 0 reste 63", () => {
    expect(midiWithAccidental(63, 0)).toBe(63);
  });
  it("Mi♭4 (63) → position 1 (Fa) = 64 (Fa♭ = hauteur Mi)", () => {
    expect(midiWithAccidental(63, 1)).toBe(64);
  });
  it("Do♯4 (61) → position 2 (Sol) = 68 (Sol♭ = La♭)", () => {
    expect(midiWithAccidental(61, 2)).toBe(68);
  });
  it("Mi4 (64) → position 12 = 84 (Do6)", () => {
    expect(midiWithAccidental(64, 12)).toBe(84);
  });
  it("clamp bas : Do3 (48) → position −10 = 48 (jamais sous RANGE_MIN)", () => {
    expect(midiWithAccidental(48, -10)).toBe(48);
  });
  it("clamp haut : Do6 (84) → position 13 = 84 (jamais au-dessus de RANGE_MAX)", () => {
    expect(midiWithAccidental(84, 13)).toBe(84);
  });
});

// E) Changement d'altération au clavier
describe("midiWithAccidentalShift", () => {
  it("Mi4 (64) −1 → Mi♭4 (63)", () => {
    expect(midiWithAccidentalShift(64, -1)).toBe(63);
  });
  it("Mi♭4 (63) +1 → Mi4 (64)", () => {
    expect(midiWithAccidentalShift(63, 1)).toBe(64);
  });
  it("Mi4 (64) +1 → Fa♯4 ? Non : Mi♯ = Fa (65) via pc canonique", () => {
    // Mi♯ n'est pas un nom canonique : clampé à +1, naturel+1 = 65 (Fa♯ canonique)
    expect(midiWithAccidentalShift(64, 1)).toBe(65);
  });
  it("Mi♭4 (63) −1 → ♭ clampé : naturel 64 + (−1) = 63", () => {
    expect(midiWithAccidentalShift(63, -1)).toBe(63);
  });
});

// F) Lignes supplémentaires
describe("ledgerLinesFor", () => {
  it("position dans la portée : aucune", () => {
    expect(ledgerLinesFor(0)).toEqual([]);
    expect(ledgerLinesFor(8)).toEqual([]);
    expect(ledgerLinesFor(9)).toEqual([]);
  });
  it("Do4 (−2) : la 1ʳᵉ ligne sous la portée", () => {
    expect(ledgerLinesFor(-2)).toEqual([-2]);
  });
  it("Do3 (−9) : 4 lignes (−2, −4, −6, −8)", () => {
    expect(ledgerLinesFor(-9)).toEqual([-2, -4, -6, -8]);
  });
  it("Do6 (12) : 2 lignes (10, 12)", () => {
    expect(ledgerLinesFor(12)).toEqual([10, 12]);
  });
  it("Si♭5 (11) : la 1ʳᵉ ligne seulement (10)", () => {
    expect(ledgerLinesFor(11)).toEqual([10]);
  });
  it("La3 (−4) : deux lignes", () => {
    expect(ledgerLinesFor(-4)).toEqual([-2, -4]);
  });
});

// G) Tonique de tonalité sur la portée (F1)
describe("tonicInAmbitus / realTonicMidi", () => {
  it("Mi♭ (pc 3) = 63, la première ligne de l'ambitus", () => {
    expect(tonicInAmbitus(3)).toBe(63);
  });
  it("Do (pc 0) = 72 (Do5), Si♭ (pc 10) = 70 (Si♭4)", () => {
    expect(tonicInAmbitus(0)).toBe(72);
    expect(tonicInAmbitus(10)).toBe(70);
  });
  it("les 12 toniques tombent dans l'ambitus [63, 82] et gardent leur pc", () => {
    for (let pc = 0; pc < 12; pc += 1) {
      const midi = tonicInAmbitus(pc);
      expect(midi).toBeGreaterThanOrEqual(63);
      expect(midi).toBeLessThanOrEqual(82);
      expect(midi % 12).toBe(pc);
    }
  });
  it("realTonicMidi : Si♭ flute (−2) appliquée à Do5 (72) = 70 (Si♭4)", () => {
    expect(realTonicMidi(72, -2)).toBe(70);
  });
  it("realTonicMidi : Sol flute (−5) appliquée à Do5 (72) = 67 (Sol4)", () => {
    expect(realTonicMidi(72, -5)).toBe(67);
  });
});

// H) Armure (clef de Sol)
describe("keySignatureOf", () => {
  it("Do : aucune armure", () => {
    expect(keySignatureOf(0)).toEqual([]);
  });
  it("Fa (pc 5) : 1 bémol à la 3ᵉ ligne (Si4, position 4)", () => {
    expect(keySignatureOf(5)).toEqual([{ symbol: "♭", step: 4 }]);
  });
  it("Si♭ (pc 10) : 2 bémols Si4 puis Mi5", () => {
    expect(keySignatureOf(10)).toEqual([
      { symbol: "♭", step: 4 },
      { symbol: "♭", step: 7 },
    ]);
  });
  it("Mi♭ (pc 3) : 3 bémols Si4, Mi5, La4", () => {
    expect(keySignatureOf(3)).toEqual([
      { symbol: "♭", step: 4 },
      { symbol: "♭", step: 7 },
      { symbol: "♭", step: 3 },
    ]);
  });
  it("Sol (pc 7) : 1 dièse en haut de la portée (Fa5, position 8)", () => {
    expect(keySignatureOf(7)).toEqual([{ symbol: "♯", step: 8 }]);
  });
  it("Ré (pc 2) : 2 dièses Fa5 puis Do5", () => {
    expect(keySignatureOf(2)).toEqual([
      { symbol: "♯", step: 8 },
      { symbol: "♯", step: 5 },
    ]);
  });
  it("La (pc 9) : 3 dièses Fa5, Do5, Sol5", () => {
    expect(keySignatureOf(9)).toEqual([
      { symbol: "♯", step: 8 },
      { symbol: "♯", step: 5 },
      { symbol: "♯", step: 9 },
    ]);
  });
  it("Do♯ (pc 1) : 7 dièses (toute la portée)", () => {
    expect(keySignatureOf(1)).toHaveLength(7);
  });
});

// I) Géométrie
describe("positionY / clampMidi", () => {
  it("position 0 → y = 64 (ligne du bas), position 8 → y = 0 (ligne du haut)", () => {
    expect(positionY(0)).toBe(64);
    expect(positionY(8)).toBe(0);
  });
  it("un cran de position = demi-écart de portée", () => {
    expect(positionY(0) - positionY(1)).toBe(STAFF_SPACING / 2);
  });
  it("clampMidi borne l'étendue de sélection", () => {
    expect(clampMidi(40)).toBe(48);
    expect(clampMidi(90)).toBe(84);
    expect(clampMidi(60)).toBe(60);
  });
});
