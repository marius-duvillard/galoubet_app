// F2 « Quelle flûte ? » : tonalité réelle → meilleure configuration (galoubet + tonalité notée),
// avec étendue du morceau optionnelle qui filtre les configurations tenables à l'ambitus.
// Une configuration sélectionnée affiche sa lecture (notes lues) sur la portée.

import { useState } from "react";
import { formatNote, pickWithRange, writtenRange } from "../ambitus";
import type { PickResult, RangeCandidate } from "../ambitus";
import { bestConfigs, formatKey, intervalLabel } from "../transposition";
import type { Flute } from "../transposition";
import { FieldSection } from "../components/FieldSection";
import { KeyChipGrid } from "../components/KeyChipGrid";
import { RangeSelect } from "../components/RangeSelect";
import { Staff } from "../components/Staff";
import type { WrittenRange } from "../components/Staff";
import { ComfortBadge } from "../components/ComfortBadge";
import { ResultCard } from "../components/ResultCard";

interface QuelleFluteProps {
  realPc: number;
  onRealPc: (pc: number) => void;
  rangeLow?: number;
  rangeHigh?: number;
  onRange: (low?: number, high?: number) => void;
}

function rangeLineOf(candidate: RangeCandidate): string {
  return `Lecture : ${formatNote(candidate.writtenLow)} → ${formatNote(candidate.writtenHigh)}`;
}

function sonnerNote(flute: Flute): string {
  return `Sonner ${intervalLabel(flute)}.`;
}

interface OptionProps {
  option: RangeCandidate;
  selected: boolean;
  onSelect: () => void;
}

function RangeOption({ option, selected, onSelect }: OptionProps) {
  return (
    <li className="option">
      <div
        className={selected ? "option__row option__row--selected" : "option__row"}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        <div className="option__main">
          <p className="option__flute">Galoubet en {option.flute}</p>
          <p className="option__key">Noter en {formatKey(option.writtenPc)}</p>
          <p className="option__range">{rangeLineOf(option)}</p>
        </div>
        <ComfortBadge small label={option.label} />
        {!option.fitsRange && <ComfortBadge small label="hors ambitus" />}
      </div>
    </li>
  );
}

function RangeOptions({
  options,
  selected,
  onSelect,
}: {
  options: readonly RangeCandidate[];
  selected: Flute | null;
  onSelect: (flute: Flute) => void;
}) {
  if (options.length === 0) {
    return null;
  }
  return (
    <section className="field" aria-labelledby="f2-others">
      <h2 className="field__title" id="f2-others">
        Autres options
      </h2>
      <ul className="options">
        {options.map((option) => (
          <RangeOption
            key={option.flute}
            option={option}
            selected={selected === option.flute}
            onSelect={() => onSelect(option.flute)}
          />
        ))}
      </ul>
    </section>
  );
}

function RangeResults({
  pick,
  selected,
  onSelect,
}: {
  pick: PickResult;
  selected: Flute | null;
  onSelect: (flute: Flute) => void;
}) {
  const { candidates, primary, noneFits, fallback } = pick;

  if (primary !== null) {
    return (
      <>
        <ResultCard
          id="f2-primary"
          overline="Meilleure configuration"
          tonality={`Galoubet en ${primary.flute}`}
          keyLine={`Noter en ${formatKey(primary.writtenPc)}`}
          rangeLine={rangeLineOf(primary)}
          badgeLabel={primary.label}
          note={sonnerNote(primary.flute)}
          selected={selected === primary.flute}
          onSelect={() => onSelect(primary.flute)}
        />
        <RangeOptions options={candidates.slice(1)} selected={selected} onSelect={onSelect} />
      </>
    );
  }

  if (noneFits) {
    const [first, ...rest] = candidates;
    return (
      <>
        <p className="notice" role="alert">
          Aucune configuration ne couvre l'étendue du morceau.
        </p>
        <ResultCard
          id="f2-fallback"
          overline="Meilleure configuration"
          tonality={`Galoubet en ${first.flute}`}
          keyLine={`Noter en ${formatKey(first.writtenPc)}`}
          rangeLine={rangeLineOf(first)}
          badgeLabel={first.label}
          extraBadge="hors ambitus"
          note={sonnerNote(first.flute)}
          selected={selected === first.flute}
          onSelect={() => onSelect(first.flute)}
        />
        <RangeOptions options={rest} selected={selected} onSelect={onSelect} />
      </>
    );
  }

  if (fallback !== null) {
    return (
      <>
        <p className="notice" role="alert">
          Aucune configuration dans la plage 0–3 bémols.
        </p>
        <ResultCard
          id="f2-fallback"
          overline="Solution de repli"
          tonality={`Galoubet en ${fallback.flute}`}
          keyLine={`Noter en ${formatKey(fallback.writtenPc)}`}
          rangeLine={rangeLineOf(fallback)}
          badgeLabel={fallback.label}
          extraBadge={fallback.fitsRange ? undefined : "hors ambitus"}
          note={sonnerNote(fallback.flute)}
          fallback
          selected={selected === fallback.flute}
          onSelect={() => onSelect(fallback.flute)}
        />
      </>
    );
  }

  return (
    <p className="notice" role="alert">
      Aucune configuration disponible.
    </p>
  );
}

function ComfortResults({ realPc }: { realPc: number }) {
  const { candidates, primary, fallback } = bestConfigs(realPc);
  const others = primary !== null ? candidates.slice(1) : [];

  if (primary !== null) {
    return (
      <>
        <ResultCard
          id="f2-primary"
          overline="Meilleure configuration"
          tonality={`Galoubet en ${primary.flute}`}
          keyLine={`Noter en ${formatKey(primary.writtenPc)}`}
          badgeLabel={primary.label}
          note={sonnerNote(primary.flute)}
        />
        {others.length > 0 && (
          <section className="field" aria-labelledby="f2-others">
            <h2 className="field__title" id="f2-others">
              Autres options
            </h2>
            <ul className="options">
              {others.map((option) => (
                <li key={option.flute} className="option">
                  <div className="option__main">
                    <p className="option__flute">Galoubet en {option.flute}</p>
                    <p className="option__key">Noter en {formatKey(option.writtenPc)}</p>
                  </div>
                  <ComfortBadge small label={option.label} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </>
    );
  }

  if (fallback !== null) {
    return (
      <>
        <p className="notice" role="alert">
          Aucune configuration dans la plage 0–3 bémols.
        </p>
        <ResultCard
          id="f2-fallback"
          overline="Solution de repli"
          tonality={`Galoubet en ${fallback.flute}`}
          keyLine={`Noter en ${formatKey(fallback.writtenPc)}`}
          badgeLabel={fallback.label}
          note={`Sonner ${intervalLabel(fallback.flute)}. Demi-trous excessifs.`}
          fallback
        />
      </>
    );
  }

  return (
    <p className="notice" role="alert">
      Aucune configuration disponible.
    </p>
  );
}

export function QuelleFlute({
  realPc,
  onRealPc,
  rangeLow,
  rangeHigh,
  onRange,
}: QuelleFluteProps) {
  const [selectedFlute, setSelectedFlute] = useState<Flute | null>(null);
  const rangeSet = rangeLow !== undefined && rangeHigh !== undefined;
  const pick = rangeSet ? pickWithRange(realPc, rangeLow, rangeHigh) : null;
  const selected =
    pick === null
      ? null
      : (pick.candidates.find((candidate) => candidate.flute === selectedFlute)?.flute ??
        pick.primary?.flute ??
        pick.candidates[0]?.flute ??
        null);
  const written: WrittenRange | null =
    rangeSet && selected !== null
      ? { ...writtenRange(rangeLow, rangeHigh, selected), flute: selected }
      : null;

  return (
    <div className="view">
      <FieldSection id="f2-real" title="Tonalité réelle">
        <KeyChipGrid ariaLabel="Tonalité réelle" value={realPc} onChange={onRealPc} />
      </FieldSection>

      <FieldSection id="f2-range" title="Étendue du morceau (son réel)">
        <Staff low={rangeLow} high={rangeHigh} onChange={onRange} written={written} />
        <RangeSelect low={rangeLow} high={rangeHigh} onChange={onRange} />
      </FieldSection>

      {pick !== null ? (
        <RangeResults pick={pick} selected={selected} onSelect={setSelectedFlute} />
      ) : (
        <ComfortResults realPc={realPc} />
      )}
    </div>
  );
}
