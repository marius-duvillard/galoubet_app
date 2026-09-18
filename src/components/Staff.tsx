// Portée d'étendue (clef de Sol) : deux notes (grave / aiguë) en son réel,
// déplaçables au pointeur (tactis + souris) et au clavier (flèches).
// Les sélecteurs <select> de RangeSelect restent le repli accessible.

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { formatNote } from "../ambitus";
import {
  STAFF_BOTTOM_Y,
  STAFF_SPACING,
  accidentalSymbol,
  ledgerLinesFor,
  midiToPosition,
  midiWithAccidental,
  midiWithAccidentalShift,
  positionY,
} from "../staff";

interface StaffProps {
  low?: number;
  high?: number;
  onChange: (low?: number, high?: number) => void;
}

// Géométrie du viewBox : y de −44 (marge haut) à 158 (label sous la note la plus grave).
const VIEW_X = 0;
const VIEW_Y = -44;
const VIEW_W = 260;
const VIEW_H = 202;

const POSITION_MIN = midiToPosition(48);
const POSITION_MAX = midiToPosition(84);

const LOW_X = 80;
const HIGH_X = 170;

// Clef de Sol domaine public (Wikimedia « Treble clef.svg »), transformée
// pour que la spirale s'enroule sur la 2ᵉ ligne (Sol4) et que la portée
// commence à x = 0 avec l'écart STAFF_SPACING.
const CLEF_SCALE = 16 / 2246.8;
const CLEF_TRANSFORM = `translate(${(-375.8 * CLEF_SCALE).toFixed(3)} ${(48 - 7776 * CLEF_SCALE).toFixed(3)}) scale(${CLEF_SCALE.toFixed(6)}) matrix(3.817349,0,0,3.808092,-3380.452,-23251.63)`;
const CLEF_PATH =
  "M 2002,7851 C 1941,7868 1886,7906 1835,7964 C 1784,8023 1759,8088 1759,8158 C 1759,8202 1774,8252 1803,8305 C 1832,8359 1876,8398 1933,8423 C 1952,8427 1961,8437 1961,8451 C 1961,8456 1954,8461 1937,8465 C 1846,8442 1771,8393 1713,8320 C 1655,8246 1625,8162 1623,8066 C 1626,7963 1657,7867 1716,7779 C 1776,7690 1853,7627 1947,7590 L 1878,7235 C 1724,7363 1599,7496 1502,7636 C 1405,7775 1355,7926 1351,8089 C 1353,8162 1368,8233 1396,8301 C 1424,8370 1466,8432 1522,8489 C 1635,8602 1782,8661 1961,8667 C 2022,8663 2087,8652 2157,8634 L 2002,7851 z M 2074,7841 L 2230,8610 C 2384,8548 2461,8413 2461,8207 C 2452,8138 2432,8076 2398,8021 C 2365,7965 2321,7921 2265,7889 C 2209,7857 2146,7841 2074,7841 z M 1869,6801 C 1902,6781 1940,6746 1981,6697 C 2022,6649 2062,6592 2100,6528 C 2139,6463 2170,6397 2193,6330 C 2216,6264 2227,6201 2227,6143 C 2227,6118 2225,6093 2220,6071 C 2216,6035 2205,6007 2186,5988 C 2167,5970 2143,5960 2113,5960 C 2053,5960 1999,5997 1951,6071 C 1914,6135 1883,6211 1861,6297 C 1838,6384 1825,6470 1823,6557 C 1828,6656 1844,6737 1869,6801 z M 1806,6859 C 1761,6697 1736,6532 1731,6364 C 1732,6256 1743,6155 1764,6061 C 1784,5967 1813,5886 1851,5816 C 1888,5746 1931,5693 1979,5657 C 2022,5625 2053,5608 2070,5608 C 2083,5608 2094,5613 2104,5622 C 2114,5631 2127,5646 2143,5666 C 2262,5835 2322,6039 2322,6277 C 2322,6390 2307,6500 2277,6610 C 2248,6719 2205,6823 2148,6920 C 2090,7018 2022,7103 1943,7176 L 2024,7570 C 2068,7565 2098,7561 2115,7561 C 2191,7561 2259,7577 2322,7609 C 2385,7641 2439,7684 2483,7739 C 2527,7793 2561,7855 2585,7925 C 2608,7995 2621,8068 2621,8144 C 2621,8262 2590,8370 2528,8467 C 2466,8564 2373,8635 2248,8681 C 2256,8730 2270,8801 2291,8892 C 2311,8984 2326,9057 2336,9111 C 2346,9165 2350,9217 2350,9268 C 2350,9347 2331,9417 2293,9479 C 2254,9541 2202,9589 2136,9623 C 2071,9657 1999,9674 1921,9674 C 1811,9674 1715,9643 1633,9582 C 1551,9520 1507,9437 1503,9331 C 1506,9284 1517,9240 1537,9198 C 1557,9156 1584,9122 1619,9096 C 1653,9069 1694,9055 1741,9052 C 1780,9052 1817,9063 1852,9084 C 1886,9106 1914,9135 1935,9172 C 1955,9209 1966,9250 1966,9294 C 1966,9353 1946,9403 1906,9444 C 1866,9485 1815,9506 1754,9506 L 1731,9506 C 1770,9566 1834,9597 1923,9597 C 1968,9597 2014,9587 2060,9569 C 2107,9550 2146,9525 2179,9493 C 2212,9461 2234,9427 2243,9391 C 2260,9350 2268,9293 2268,9222 C 2268,9174 2263,9126 2254,9078 C 2245,9031 2231,8968 2212,8890 C 2193,8813 2179,8753 2171,8712 C 2111,8727 2049,8735 1984,8735 C 1875,8735 1772,8713 1675,8668 C 1578,8623 1493,8561 1419,8481 C 1346,8401 1289,8311 1248,8209 C 1208,8108 1187,8002 1186,7892 C 1190,7790 1209,7692 1245,7600 C 1281,7507 1327,7419 1384,7337 C 1441,7255 1500,7180 1561,7113 C 1623,7047 1704,6962 1806,6859 z";

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

export function Staff({ low, high, onChange }: StaffProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<null | "low" | "high">(null);

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
      y: VIEW_Y + ((event.clientY - rect.top) / rect.height) * VIEW_H,
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
        viewBox={`${VIEW_X} ${VIEW_Y} ${VIEW_W} ${VIEW_H}`}
        role="group"
        aria-label="Étendue du morceau sur la portée"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <g className="staff__clef" transform={CLEF_TRANSFORM}>
          <path d={CLEF_PATH} fillRule="evenodd" />
        </g>
        {[0, 1, 2, 3, 4].map((line) => (
          <line key={line} className="staff__line" x1={0} x2={VIEW_W} y1={line * STAFF_SPACING} y2={line * STAFF_SPACING} />
        ))}
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
      </svg>
    </div>
  );
}
