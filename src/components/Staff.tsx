// Portée d'étendue (clef de Sol) : deux notes (grave / aiguë) en son réel,
// déplaçables au pointeur (tactis + souris) et au clavier (flèches).
// Les sélecteurs <select> de RangeSelect restent le repli accessible.

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { formatNote } from "../ambitus";
import {
  CLEF_PATH,
  CLEF_TRANSFORM,
  STAFF_BOTTOM_Y,
  STAFF_SPACING,
  accidentalSymbol,
  keySignatureOf,
  ledgerLinesFor,
  midiToPosition,
  midiWithAccidental,
  midiWithAccidentalShift,
  positionY,
} from "../staff";

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
}

// Géométrie du viewBox : y de −44 (marge haut) à 158 (label sous la note la plus grave).
// x 0…400 : armure après la clef, notes réelles (pleines) à gauche, notes lues (creuses) à droite.
const VIEW_X = 0;
const VIEW_Y = -44;
const VIEW_W = 400;
const VIEW_H = 202;

const POSITION_MIN = midiToPosition(48);
const POSITION_MAX = midiToPosition(84);

const SIGNATURE_X = 50;
const SIGNATURE_STEP_X = 9;
const LOW_X = 115;
const HIGH_X = 190;
const WRITTEN_LOW_X = 260;
const WRITTEN_HIGH_X = 330;

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
  ariaLabel,
  onMove,
  onAccidental,
}: {
  midi: number;
  x: number;
  ariaLabel: string;
  onMove: (midi: number) => void;
  onAccidental: (delta: number) => void;
}) {
  const position = midiToPosition(midi);
  const y = positionY(position);
  const acc = accidentalSymbol(midi);
  const stemUp = position < 4;
  const stemX = stemUp ? x + 5.3 : x - 5.3;
  const stemY1 = stemUp ? y - 2.4 : y + 2.4;
  const stemY2 = stemUp ? y - 56 : y + 56;
  const keyDown = (event: KeyboardEvent<SVGGElement>): void => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onMove(midiWithAccidental(midi, position + (event.key === "ArrowUp" ? 1 : -1)));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      onAccidental(event.key === "ArrowRight" ? 1 : -1);
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

function WrittenNote({ midi, x }: { midi: number; x: number }) {
  const position = midiToPosition(midi);
  const y = positionY(position);
  const acc = accidentalSymbol(midi);
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

function Signature({ pc }: { pc: number }) {
  const accidentals = keySignatureOf(pc);
  if (accidentals.length === 0) {
    return null;
  }
  return (
    <g className="staff__signature" aria-hidden="true">
      {accidentals.map((acc, index) => (
        <text
          key={index}
          className="staff__accidental"
          x={SIGNATURE_X + index * SIGNATURE_STEP_X}
          y={positionY(acc.step) + 5}
        >
          {acc.symbol}
        </text>
      ))}
    </g>
  );
}

export function Staff({ low, high, onChange, written = null, signaturePc = null }: StaffProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<null | "low" | "high">(null);

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
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
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
      const midi = midiWithAccidental(64, position);
      onChange(midi, midi);
      setDrag("high");
      capturePointer(event);
      return;
    }
    const { x } = viewBoxFromEvent(event);
    if (written !== null && x > (HIGH_X + WRITTEN_LOW_X) / 2) return;
    const target =
      low !== undefined && high !== undefined
        ? Math.abs(x - LOW_X) <= Math.abs(x - HIGH_X)
          ? "low"
          : "high"
        : low !== undefined
          ? "low"
          : "high";
    setDrag(target);
    const midi = target === "low" ? (low as number) : (high as number);
    const moved = midiWithAccidental(midi, position);
    if (target === "low") moveLow(moved);
    else moveHigh(moved);
    capturePointer(event);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>): void => {
    if (drag === null) return;
    const position = positionFromEvent(event);
    const midi = drag === "low" ? (low as number) : (high as number);
    const moved = midiWithAccidental(midi, position);
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
        viewBox={`${VIEW_X} ${viewTop} ${VIEW_W} ${viewHeight}`}
        role="group"
        aria-label="Étendue du morceau sur la portée"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {[0, 1, 2, 3, 4].map((line) => (
          <line key={line} className="staff__line" x1={0} x2={VIEW_W} y1={line * STAFF_SPACING} y2={line * STAFF_SPACING} />
        ))}
        <g className="staff__clef" transform={CLEF_TRANSFORM}>
          <path d={CLEF_PATH} fillRule="evenodd" />
        </g>
        {signaturePc !== null && <Signature pc={signaturePc} />}
        {low !== undefined && (
          <Note midi={low} x={LOW_X} ariaLabel="Note la plus grave" onMove={moveLow} onAccidental={(d) => moveLow(midiWithAccidentalShift(low, d))} />
        )}
        {high !== undefined && (
          <Note midi={high} x={HIGH_X} ariaLabel="Note la plus aiguë" onMove={moveHigh} onAccidental={(d) => moveHigh(midiWithAccidentalShift(high, d))} />
        )}
        {low === undefined && high === undefined && (
          <g className="staff__ghost">
            <ellipse cx={LOW_X} cy={positionY(2)} rx={5.6} ry={4} />
            <text className="staff__hint" x={VIEW_W / 2} y={120}>
              Touchez la portée pour poser l’étendue
            </text>
          </g>
        )}
        {written !== null && (
          <g role="img" aria-label={`Notes lues par le galoubet en ${written.flute} : ${formatNote(written.low)} → ${formatNote(written.high)}`}>
            <WrittenNote midi={written.low} x={WRITTEN_LOW_X} />
            <WrittenNote midi={written.high} x={WRITTEN_HIGH_X} />
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
