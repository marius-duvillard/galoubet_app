// Armure d'une tonalité, rendue après la clef dans le groupe qui la porte.
// Couleur : encre (armure de la tonalité réelle) ou accent (--written).

import { keySignatureOf, positionY } from "../staff";

const SIGNATURE_STEP_X = 9;

export function Signature({ pc, at, written = false }: { pc: number; at: number; written?: boolean }) {
  const accidentals = keySignatureOf(pc);
  if (accidentals.length === 0) {
    return null;
  }
  return (
    <g className={written ? "staff__signature staff__signature--written" : "staff__signature"} aria-hidden="true">
      {accidentals.map((acc, index) => (
        <text
          key={index}
          className="staff__accidental"
          x={at + index * SIGNATURE_STEP_X}
          y={positionY(acc.step) + 5}
        >
          {acc.symbol}
        </text>
      ))}
    </g>
  );
}
