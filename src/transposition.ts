// Moteur de transposition pour galoubet (flûte à 3 trous).
// La flûte porte le nom de la note qui sonne quand on lit Do (C).
// Pure : aucune dépendance, aucun DOM.

const FLATS_OF = [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7];
const SHARPS_OF = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

export type Flute = "Si" | "Si♭" | "La" | "Sol" | "Ut";

/** Flûtes, du plus au moins courant (commonness 0..4). */
export const FLUTES: readonly Flute[] = ["Si", "Si♭", "La", "Sol", "Ut"];

/** Intervalle notée → réelle, en demi-tons. */
export const FLUTE_INTERVAL: Record<Flute, number> = {
  Si: -1,
  "Si♭": -2,
  La: -3,
  Sol: -5,
  Ut: 0,
};

export const FLUTE_COMMONNESS: Record<Flute, number> = {
  Si: 0,
  "Si♭": 1,
  La: 2,
  Sol: 3,
  Ut: 4,
};

export const CHIP_KEYS: readonly { pc: number; name: string }[] = [
  { pc: 0, name: "Do" },
  { pc: 1, name: "Do♯" },
  { pc: 2, name: "Ré" },
  { pc: 3, name: "Mi♭" },
  { pc: 4, name: "Mi" },
  { pc: 5, name: "Fa" },
  { pc: 6, name: "Fa♯" },
  { pc: 7, name: "Sol" },
  { pc: 8, name: "La♭" },
  { pc: 9, name: "La" },
  { pc: 10, name: "Si♭" },
  { pc: 11, name: "Si" },
];

export interface KeyInfo {
  pc: number;
  name: string;
  accidentalType: "none" | "sharp" | "flat";
  accidentals: number;
}

const KEY_INFO_TABLE: readonly KeyInfo[] = [
  { pc: 0, name: "Do", accidentalType: "none", accidentals: 0 },
  { pc: 1, name: "Do♯", accidentalType: "sharp", accidentals: 1 },
  { pc: 2, name: "Ré", accidentalType: "sharp", accidentals: 2 },
  { pc: 3, name: "Mi♭", accidentalType: "flat", accidentals: 3 },
  { pc: 4, name: "Mi", accidentalType: "sharp", accidentals: 4 },
  { pc: 5, name: "Fa", accidentalType: "flat", accidentals: 1 },
  { pc: 6, name: "Fa♯", accidentalType: "sharp", accidentals: 6 },
  { pc: 7, name: "Sol", accidentalType: "sharp", accidentals: 1 },
  { pc: 8, name: "La♭", accidentalType: "flat", accidentals: 4 },
  { pc: 9, name: "La", accidentalType: "sharp", accidentals: 3 },
  { pc: 10, name: "Si♭", accidentalType: "flat", accidentals: 2 },
  { pc: 11, name: "Si", accidentalType: "sharp", accidentals: 5 },
];

export interface Comfort {
  d: number;
  label: string;
  inRange: boolean;
}

export interface Candidate {
  flute: Flute;
  writtenPc: number;
  d: number;
  inRange: boolean;
  label: string;
}

function mod12(x: number): number {
  return ((x % 12) + 12) % 12;
}

/** Position (n° de bémol) du dièse/côté bémols du ton, indexée par classe de hauteur. */
export function flatsOf(pc: number): number {
  return FLATS_OF[mod12(pc)];
}

/** Position du côté dièses du ton, indexée par classe de hauteur. */
export function sharpsOf(pc: number): number {
  return SHARPS_OF[mod12(pc)];
}

/** Nombre d'accidentals du côté le plus court de l'armature. */
export function accidentalsOf(pc: number): number {
  return Math.min(sharpsOf(pc), flatsOf(pc));
}

export function keyInfo(pc: number): KeyInfo {
  return KEY_INFO_TABLE[mod12(pc)];
}

export function formatKey(pc: number): string {
  const info = keyInfo(pc);
  if (info.accidentalType === "none") {
    return "Do majeur";
  }
  const word = info.accidentalType === "sharp" ? "dièse" : "bémol";
  const n = info.accidentals;
  return `${info.name} majeur · ${n} ${word}${n > 1 ? "s" : ""}`;
}

/** Classe de hauteur réelle pour une note écrite d'une classe donnée, sur la flûte donnée. */
export function realTone(writtenPc: number, flute: Flute): number {
  return mod12(writtenPc + FLUTE_INTERVAL[flute]);
}

/** Classe de hauteur à écrire pour obtenir une classe de hauteur réelle donnée. */
export function writtenTone(realPc: number, flute: Flute): number {
  return mod12(realPc - FLUTE_INTERVAL[flute]);
}

/**
 * Confort d'une tonique notée : distance au « naturel » (2 bémols = ton du galoubet),
 * hors plage au-delà de 3 bémols.
 */
export function comfort(writtenPc: number): Comfort {
  const d = Math.abs(flatsOf(writtenPc) - 2);
  const inRange = flatsOf(writtenPc) <= 3;
  let label: string;
  if (d === 0) {
    label = "naturel";
  } else if (d === 1) {
    label = "peu de demi-trous";
  } else if (d === 2) {
    label = "demi-trous poussés";
  } else {
    label = "hors plage";
  }
  return { d, label, inRange };
}

/**
 * Configurations pour une tonique réelle : candidats en plage triés par
 * (d, commonness), sinon fallback hors plage minimisant
 * (|accidentalsOf(writtenPc) - 2|, commonness).
 */
export function bestConfigs(realPc: number): {
  candidates: Candidate[];
  primary: Candidate | null;
  fallback: Candidate | null;
} {
  const writtenPcOf = (flute: Flute): number => mod12(realPc - FLUTE_INTERVAL[flute]);
  const byComfort = (a: { d: number; flute: Flute }, b: { d: number; flute: Flute }): number =>
    a.d - b.d || FLUTE_COMMONNESS[a.flute] - FLUTE_COMMONNESS[b.flute];

  const candidates: Candidate[] = [];
  for (const flute of FLUTES) {
    const writtenPc = writtenPcOf(flute);
    const c = comfort(writtenPc);
    if (c.inRange) {
      candidates.push({ flute, writtenPc, d: c.d, inRange: true, label: c.label });
    }
  }
  candidates.sort(byComfort);
  if (candidates.length > 0) {
    return { candidates, primary: candidates[0], fallback: null };
  }

  const approximations = FLUTES.map((flute) => {
    const writtenPc = writtenPcOf(flute);
    return { flute, writtenPc, d: Math.abs(accidentalsOf(writtenPc) - 2) };
  });
  approximations.sort(byComfort);
  const best = approximations[0];
  const fallback: Candidate = {
    flute: best.flute,
    writtenPc: best.writtenPc,
    d: best.d,
    inRange: false,
    label: "hors plage",
  };
  return { candidates, primary: null, fallback };
}
