// Portée d'étendue (clef de Sol) : deux notes (grave / aiguë) en son réel,
// déplaçables au pointeur (tactis + souris) et au clavier (flèches).
// Chaque groupe (réel / lu) porte son armure, dans sa couleur.
// Les sélecteurs <select> de RangeSelect restent le repli accessible.

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { formatNote } from "../ambitus";
import {
  CLEF_PATH,
  CLEF_TRANSFORM,
  STAFF_BOTTOM_Y,
  STAFF_SPACING,
  accidentalNotation,
  keySignatureOf,
  ledgerLinesFor,
  midiToPosition,
  midiWithKeySignature,
  positionY,
  staffLayout,
} from "../staff";
import { Signature } from "./Signature";

export interface WrittenRange {
  low: number;
  high: number;
  flute: string;
}

interface StaffProps {
  low?: number;
  high?: number;
  onChange: (low?: number, high?: number) => void;
  written?: WrittenRange | null;
  signaturePc?: number | null;
  writtenSignaturePc?: number | null;
}

// Géométrie du viewBox : y de −44 (marge haut) à 158 (label sous la note la plus grave).
// x : clef, puis groupe 1 (armure + notes réelles pleines), groupe 2 (armure + notes lues creuses).
const VIEW_X = 0;
const VIEW_Y = -44;
const VIEW_H = 202;

const POSITION_MIN = midiToPosition(48);
const POSITION_MAX = midiToPosition(84);

function capturePointer(event: PointerEvent<SVGSVGElement>): void {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // pointeur inactif : le drag marche aussi sans capture
  }
}

function Note({
  midi,
  x,
  keyPc,
  ariaLabel,
  onStep,
}: {
  midi: number;
  x: number;
  keyPc: number | null;
  ariaLabel: string;
  onStep: (delta: number) => void;
}) {
  const position = midiToPosition(midi);
  const y = positionY(position);
  const acc = accidentalNotation(midi, keyPc);
  const stemUp = position < 4;
  const stemX = stemUp ? x + 5.3 : x - 5.3;
  const stemY1 = stemUp ? y - 2.4 : y + 2.4;
  const stemY2 = stemUp ? y - 56 : y + 56;
  const keyDown = (event: KeyboardEvent<SVGGElement>): void => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onStep(event.key === "ArrowUp" ? 1 : -1);
    }
  };
  return (
    <g
      className="staff__note"
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={POSITION_MIN}
      aria-valuenow={position}
      aria-valuemax={POSITION_MAX}
      aria-valuetext={formatNote(midi)}
      onKeyDown={keyDown}
    >
      {ledgerLinesFor(position).map((line) => (
        <line
          key={line}
          className="staff__ledger"
          x1={x - 15}
          x2={x + 15}
          y1={positionY(line)}
          y2={positionY(line)}
        />
      ))}
      {acc !== null && (
        <text className="staff__accidental" x={x - 17} y={y + 5}>
          {acc}
        </text>
      )}
      <ellipse className="staff__head" cx={x} cy={y} rx={5.6} ry={4} transform={`rotate(-15 ${x} ${y})`} />
      <line className="staff__stem" x1={stemX} y1={stemY1} x2={stemX} y2={stemY2} />
      <text className="staff__label" x={x + 16} y={y + 4}>
        {formatNote(midi)}
      </text>
    </g>
  );
}

function WrittenNote({ midi, x, keyPc }: { midi: number; x: number; keyPc: number | null }) {
  const position = midiToPosition(midi);
  const y = positionY(position);
  const acc = accidentalNotation(midi, keyPc);
  const stemUp = position < 4;
  const stemX = stemUp ? x + 5.3 : x - 5.3;
  const stemY1 = stemUp ? y - 2.4 : y + 2.4;
  const stemY2 = stemUp ? y - 56 : y + 56;
  return (
    <g className="staff__written">
      {ledgerLinesFor(position).map((line) => (
        <line
          key={line}
          className="staff__ledger"
          x1={x - 15}
          x2={x + 15}
          y1={positionY(line)}
          y2={positionY(line)}
        />
      ))}
      {acc !== null && (
        <text className="staff__accidental" x={x - 17} y={y + 5}>
          {acc}
        </text>
      )}
      <ellipse className="staff__head" cx={x} cy={y} rx={5.6} ry={4} transform={`rotate(-15 ${x} ${y})`} />
      <line className="staff__stem" x1={stemX} y1={stemY1} x2={stemX} y2={stemY2} />
      <text className="staff__label" x={x + 16} y={y + 4}>
        {formatNote(midi)}
      </text>
    </g>
  );
}

export function Staff({
  low,
  high,
  onChange,
  written = null,
  signaturePc = null,
  writtenSignaturePc = null,
}: StaffProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<null | "low" | "high">(null);

  const { group1, group2, viewWidth } = staffLayout(
    signaturePc === null ? 0 : keySignatureOf(signaturePc).length,
    writtenSignaturePc === null ? 0 : keySignatureOf(writtenSignaturePc).length,
    2,
  );

  // la lecture d'une flûte peut dépasser la portée (ex. Sol : +5) : on étend
  // la viewBox vers le haut pour que la note creuse reste visible
  const writtenTop =
    written === null
      ? VIEW_Y
      : Math.min(
          positionY(midiToPosition(written.low)),
          positionY(midiToPosition(written.high)),
        ) - 12;
  const viewTop = Math.min(VIEW_Y, writtenTop);
  const viewHeight = VIEW_H + (VIEW_Y - viewTop);

  const moveLow = (midi: number): void => {
    if (high === undefined) onChange(midi, undefined);
    else onChange(midi, Math.max(midi, high));
  };
  const moveHigh = (midi: number): void => {
    if (low === undefined) onChange(undefined, midi);
    else onChange(Math.min(low, midi), midi);
  };

  const viewBoxFromEvent = (event: PointerEvent<SVGSVGElement>): { x: number; y: number } => {
    const svg = svgRef.current;
    if (svg === null) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * viewWidth,
      y: viewTop + ((event.clientY - rect.top) / rect.height) * viewHeight,
    };
  };

  const positionFromEvent = (event: PointerEvent<SVGSVGElement>): number => {
    const { y } = viewBoxFromEvent(event);
    const raw = Math.round((STAFF_BOTTOM_Y - y) / (STAFF_SPACING / 2));
    return Math.max(POSITION_MIN, Math.min(POSITION_MAX, raw));
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>): void => {
    const position = positionFromEvent(event);
    if (low === undefined && high === undefined) {
      // un tap pose les deux notes sur la même position
      const midi = midiWithKeySignature(position, signaturePc);
      onChange(midi, midi);
      setDrag("high");
      capturePointer(event);
      return;
    }
    const { x } = viewBoxFromEvent(event);
    if (written !== null && x > (group1.endX + group2.signatureX) / 2) return;
    const target =
      low !== undefined && high !== undefined
        ? Math.abs(x - group1.note1X) <= Math.abs(x - group1.note2X!)
          ? "low"
          : "high"
        : low !== undefined
          ? "low"
          : "high";
    setDrag(target);
    const moved = midiWithKeySignature(position, signaturePc);
    if (target === "low") moveLow(moved);
    else moveHigh(moved);
    capturePointer(event);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>): void => {
    if (drag === null) return;
    const position = positionFromEvent(event);
    const moved = midiWithKeySignature(position, signaturePc);
    if (drag === "low") moveLow(moved);
    else moveHigh(moved);
  };

  const endDrag = (): void => {
    setDrag(null);
  };

  return (
    <div className="staff">
      <svg
        ref={svgRef}
        className="staff__svg"
        viewBox={`${VIEW_X} ${viewTop} ${viewWidth} ${viewHeight}`}
        role="group"
        aria-label="Étendue du morceau sur la portée"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {[0, 1, 2, 3, 4].map((line) => (
          <line key={line} className="staff__line" x1={0} x2={viewWidth} y1={line * STAFF_SPACING} y2={line * STAFF_SPACING} />
        ))}
        <g className="staff__clef" transform={CLEF_TRANSFORM}>
          <path d={CLEF_PATH} fillRule="evenodd" />
        </g>
        {signaturePc !== null && <Signature pc={signaturePc} at={group1.signatureX} />}
        {low !== undefined && (
          <Note
            midi={low}
            x={group1.note1X}
            keyPc={signaturePc}
            ariaLabel="Note la plus grave"
            onStep={(d) => moveLow(midiWithKeySignature(midiToPosition(low) + d, signaturePc))}
          />
        )}
        {high !== undefined && (
          <Note
            midi={high}
            x={group1.note2X!}
            keyPc={signaturePc}
            ariaLabel="Note la plus aiguë"
            onStep={(d) => moveHigh(midiWithKeySignature(midiToPosition(high) + d, signaturePc))}
          />
        )}
        {low === undefined && high === undefined && (
          <g className="staff__ghost">
            <ellipse cx={group1.note1X} cy={positionY(2)} rx={5.6} ry={4} />
            <text className="staff__hint" x={viewWidth / 2} y={120}>
              Touchez la portée pour poser l’étendue
            </text>
          </g>
        )}
        {written !== null && (
          <g role="img" aria-label={`Notes lues par le galoubet en ${written.flute} : ${formatNote(written.low)} → ${formatNote(written.high)}`}>
            {writtenSignaturePc !== null && <Signature pc={writtenSignaturePc} at={group2.signatureX} written />}
            <WrittenNote midi={written.low} x={group2.note1X} keyPc={writtenSignaturePc} />
            <WrittenNote midi={written.high} x={group2.note2X!} keyPc={writtenSignaturePc} />
          </g>
        )}
      </svg>
      {written !== null && (
        <p className="staff__legend">
          <span className="staff__legend-dot staff__legend-dot--real" aria-hidden="true" />
          Son réel
          <span className="staff__legend-dot staff__legend-dot--written" aria-hidden="true" />
          Lu — galoubet en {written.flute}
        </p>
      )}
    </div>
  );
}
