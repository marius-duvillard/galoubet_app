// Carte de résultat : portée décorative (motif de partition), tonalité en serif
// grande, badge de confort, ligne d'explication optionnelle.

import type { KeyboardEvent } from "react";
import { ComfortBadge } from "./ComfortBadge";

interface ResultCardProps {
  id: string;
  overline: string;
  tonality: string;
  keyLine?: string;
  rangeLine?: string;
  badgeLabel: string;
  extraBadge?: string;
  note?: string;
  fallback?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function ResultCard({
  id,
  overline,
  tonality,
  keyLine,
  rangeLine,
  badgeLabel,
  extraBadge,
  note,
  fallback = false,
  selected = false,
  onSelect,
}: ResultCardProps) {
  const interactive = onSelect !== undefined;
  const classNames = [
    "result",
    fallback ? "result--fallback" : "",
    selected ? "result--selected" : "",
    interactive ? "result--selectable" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const keyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (onSelect !== undefined && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onSelect();
    }
  };
  return (
    <section
      className={classNames}
      aria-labelledby={id}
      {...(interactive
        ? { role: "button", tabIndex: 0, "aria-pressed": selected, onClick: onSelect, onKeyDown: keyDown }
        : {})}
    >
      <div className="result__staff" aria-hidden="true" />
      <h2 className="result__overline" id={id}>
        {overline}
      </h2>
      <p className="result__tonality">{tonality}</p>
      {keyLine !== undefined && <p className="result__keyline">{keyLine}</p>}
      {rangeLine !== undefined && <p className="result__rangeline">{rangeLine}</p>}
      <div className="result__badge">
        <ComfortBadge label={badgeLabel} />
        {extraBadge !== undefined && <ComfortBadge small label={extraBadge} />}
      </div>
      {note !== undefined && <p className="result__note">{note}</p>}
    </section>
  );
}
