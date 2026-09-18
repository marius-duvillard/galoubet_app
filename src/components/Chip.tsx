// Puce de sélection : bouton réel, cible tactile ≥ 44 px, état via aria-pressed.

interface ChipProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  sublabel?: string;
}

export function Chip({ label, selected, onSelect, sublabel }: ChipProps) {
  return (
    <button
      type="button"
      className={selected ? "chip chip--selected" : "chip"}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {sublabel === undefined ? (
        label
      ) : (
        <>
          <span className="chip__label">{label}</span>
          <span className="chip__sub">{sublabel}</span>
        </>
      )}
    </button>
  );
}
