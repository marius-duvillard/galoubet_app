// Portée de tonique (F1) : la note écrite (pleine, déplaçable) et sa
// sonnerie réelle (creuse) côte à côte. Le déplacement de la note écrite
// change la tonalité notée ; la tonalité réelle suit.

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { formatNote } from "../ambitus";
import { FLUTE_INTERVAL } from "../transposition";
import type { Flute } from "../transposition";
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
  realTonicMidi,
  tonicInAmbitus,
} from "../staff";

interface KeyStaffProps {
  writtenPc: number;
  flute: Flute;
  onWrittenPc: (pc: number) => void;
}

const VIEW_X = 0;
const VIEW_Y = -44;
const VIEW_W = 400;
const VIEW_H = 202;

const SIGNATURE_X = 50;
const SIGNATURE_STEP_X = 9;
const WRITTEN_X = 135;
const REAL_X = 260;

const AMBITUS_LOW = 63;
const AMBITUS_HIGH = 82;

function clampAmbitus(midi: number): number {
  return Math.min(AMBITUS_HIGH, Math.max(AMBITUS_LOW, midi));
}

function NoteShape({
  midi,
  x,
  hollow,
}: {
  midi: number;
  x: number;
  hollow: boolean;
}) {
  const position = midiToPosition(midi);
  const y = positionY(position);
  const acc = accidentalSymbol(midi);
  const stemUp = position < 4;
  const stemX = stemUp ? x + 5.3 : x - 5.3;
  const stemY1 = stemUp ? y - 2.4 : y + 2.4;
  const stemY2 = stemUp ? y - 56 : y + 56;
  return (
    <g className={hollow ? "staff__written" : undefined}>
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

export function KeyStaff({ writtenPc, flute, onWrittenPc }: KeyStaffProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);

  const writtenMidi = tonicInAmbitus(writtenPc);
  const realMidi = realTonicMidi(writtenMidi, FLUTE_INTERVAL[flute]);

  const positionFromEvent = (event: PointerEvent<SVGSVGElement>): number => {
    const svg = svgRef.current;
    if (svg === null) return 0;
    const rect = svg.getBoundingClientRect();
    const vbY = VIEW_Y + ((event.clientY - rect.top) / rect.height) * VIEW_H;
    const raw = Math.round((STAFF_BOTTOM_Y - vbY) / (STAFF_SPACING / 2));
    return Math.max(midiToPosition(AMBITUS_LOW), Math.min(midiToPosition(AMBITUS_HIGH), raw));
  };

  const moveTo = (position: number): void => {
    const moved = clampAmbitus(midiWithAccidental(writtenMidi, position));
    onWrittenPc(((moved % 12) + 12) % 12);
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>): void => {
    const svg = svgRef.current;
    if (svg === null) return;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * VIEW_W;
    if (x > (WRITTEN_X + REAL_X) / 2) return;
    setDragging(true);
    moveTo(positionFromEvent(event));
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // pointeur inactif : le drag marche aussi sans capture
    }
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>): void => {
    if (dragging) moveTo(positionFromEvent(event));
  };

  const endDrag = (): void => {
    setDragging(false);
  };

  const keyDown = (event: KeyboardEvent<SVGGElement>): void => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      moveTo(midiToPosition(writtenMidi) + (event.key === "ArrowUp" ? 1 : -1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const shifted = clampAmbitus(
        midiWithAccidentalShift(writtenMidi, event.key === "ArrowRight" ? 1 : -1),
      );
      onWrittenPc(((shifted % 12) + 12) % 12);
    }
  };

  return (
    <div className="staff">
      <svg
        ref={svgRef}
        className="staff__svg"
        viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
        role="group"
        aria-label="Tonalité sur la portée"
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
        <g className="staff__signature" aria-hidden="true">
          {keySignatureOf(writtenPc).map((acc, index) => (
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
        <g
          className="staff__note"
          role="slider"
          tabIndex={0}
          aria-label="Note écrite (tonique lue)"
          aria-valuemin={midiToPosition(AMBITUS_LOW)}
          aria-valuenow={midiToPosition(writtenMidi)}
          aria-valuemax={midiToPosition(AMBITUS_HIGH)}
          aria-valuetext={formatNote(writtenMidi)}
          onKeyDown={keyDown}
        >
          <NoteShape midi={writtenMidi} x={WRITTEN_X} hollow={false} />
        </g>
        <g role="img" aria-label={`Son réel : ${formatNote(realMidi)}`}>
          <NoteShape midi={realMidi} x={REAL_X} hollow />
        </g>
      </svg>
      <p className="staff__legend">
        <span className="staff__legend-dot staff__legend-dot--real" aria-hidden="true" />
        Lu — galoubet en {flute}
        <span className="staff__legend-dot staff__legend-dot--written" aria-hidden="true" />
        Son réel
      </p>
    </div>
  );
}
