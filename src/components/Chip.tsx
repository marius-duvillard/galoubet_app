// Puce de sélection : bouton réel, cible tactile ≥ 44 px, état via aria-pressed.

interface ChipProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function Chip({ label, selected, onSelect }: ChipProps) {
  return (
    <button
      type="button"
      className={selected ? "chip chip--selected" : "chip"}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}
