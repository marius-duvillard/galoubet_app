// Carte de résultat : portée décorative (motif de partition), tonalité en serif
// grande, badge de confort, ligne d'explication optionnelle.

import { ComfortBadge } from "./ComfortBadge";

interface ResultCardProps {
  id: string;
  overline: string;
  tonality: string;
  keyLine?: string;
  badgeLabel: string;
  note?: string;
  fallback?: boolean;
}

export function ResultCard({
  id,
  overline,
  tonality,
  keyLine,
  badgeLabel,
  note,
  fallback = false,
}: ResultCardProps) {
  return (
    <section className={fallback ? "result result--fallback" : "result"} aria-labelledby={id}>
      <div className="result__staff" aria-hidden="true" />
      <h2 className="result__overline" id={id}>
        {overline}
      </h2>
      <p className="result__tonality">{tonality}</p>
      {keyLine !== undefined && <p className="result__keyline">{keyLine}</p>}
      <div className="result__badge">
        <ComfortBadge label={badgeLabel} />
      </div>
      {note !== undefined && <p className="result__note">{note}</p>}
    </section>
  );
}
