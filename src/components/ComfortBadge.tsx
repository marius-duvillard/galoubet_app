// Badge de confort, teinte déduite du libellé produit par le moteur :
// « naturel » / « peu de demi-trous » → vert · « demi-trous poussés » → ambre · « hors plage » → rouge.

type BadgeTone = "ok" | "warn" | "danger";

function toneFor(label: string): BadgeTone {
  if (label === "demi-trous poussés") {
    return "warn";
  }
  if (label === "hors plage") {
    return "danger";
  }
  return "ok";
}

interface ComfortBadgeProps {
  label: string;
  small?: boolean;
}

export function ComfortBadge({ label, small = false }: ComfortBadgeProps) {
  const sizeClass = small ? "badge--sm " : "";
  return <span className={`badge ${sizeClass}badge--${toneFor(label)}`}>{label}</span>;
}
