// F2 « Quelle flûte ? » : tonalité réelle → meilleure configuration (galoubet + tonalité notée).

import { bestConfigs, formatKey } from "../transposition";
import { FieldSection } from "../components/FieldSection";
import { KeyChipGrid } from "../components/KeyChipGrid";
import { ComfortBadge } from "../components/ComfortBadge";
import { ResultCard } from "../components/ResultCard";

interface QuelleFluteProps {
  realPc: number;
  onRealPc: (pc: number) => void;
}

export function QuelleFlute({ realPc, onRealPc }: QuelleFluteProps) {
  const { candidates, primary, fallback } = bestConfigs(realPc);
  const others = primary !== null ? candidates.slice(1) : [];

  return (
    <div className="view">
      <FieldSection id="f2-real" title="Tonalité réelle">
        <KeyChipGrid ariaLabel="Tonalité réelle" value={realPc} onChange={onRealPc} />
      </FieldSection>

      {primary !== null ? (
        <>
          <ResultCard
            id="f2-primary"
            overline="Meilleure configuration"
            tonality={`Galoubet en ${primary.flute}`}
            keyLine={`Noter en ${formatKey(primary.writtenPc)}`}
            badgeLabel={primary.label}
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
      ) : fallback !== null ? (
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
      ) : (
        <p className="notice" role="alert">
          Aucune configuration disponible.
        </p>
      )}
    </div>
  );
}
