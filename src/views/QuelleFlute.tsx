// F2 « Quelle flûte ? » : tonalité réelle → meilleure configuration (galoubet + tonalité notée),
// avec étendue du morceau optionnelle qui filtre les configurations tenables à l'ambitus.

import { formatNote, pickWithRange } from "../ambitus";
import type { RangeCandidate } from "../ambitus";
import { bestConfigs, formatKey, intervalLabel } from "../transposition";
import type { Flute } from "../transposition";
import { FieldSection } from "../components/FieldSection";
import { KeyChipGrid } from "../components/KeyChipGrid";
import { RangeSelect } from "../components/RangeSelect";
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

function RangeOptions({ options }: { options: readonly RangeCandidate[] }) {
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
          <li key={option.flute} className="option">
            <div className="option__main">
              <p className="option__flute">Galoubet en {option.flute}</p>
              <p className="option__key">Noter en {formatKey(option.writtenPc)}</p>
              <p className="option__range">{rangeLineOf(option)}</p>
            </div>
            <ComfortBadge small label={option.label} />
            {!option.fitsRange && <ComfortBadge small label="hors ambitus" />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RangeResults({
  realPc,
  low,
  high,
}: {
  realPc: number;
  low: number;
  high: number;
}) {
  const { candidates, primary, noneFits, fallback } = pickWithRange(realPc, low, high);

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
        />
        <RangeOptions options={candidates.slice(1)} />
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
        />
        <RangeOptions options={rest} />
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
          note="Demi-trous excessifs."
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
  const rangeSet = rangeLow !== undefined && rangeHigh !== undefined;

  return (
    <div className="view">
      <FieldSection id="f2-real" title="Tonalité réelle">
        <KeyChipGrid ariaLabel="Tonalité réelle" value={realPc} onChange={onRealPc} />
      </FieldSection>

      <FieldSection id="f2-range" title="Étendue du morceau (son réel)">
        <RangeSelect low={rangeLow} high={rangeHigh} onChange={onRange} />
      </FieldSection>

      {rangeSet ? (
        <RangeResults realPc={realPc} low={rangeLow} high={rangeHigh} />
      ) : (
        <ComfortResults realPc={realPc} />
      )}
    </div>
  );
}
