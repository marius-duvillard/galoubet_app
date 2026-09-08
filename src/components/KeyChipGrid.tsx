// Grille des 12 toniques (4×3), étiquettes issues du moteur (CHIP_KEYS).

import { CHIP_KEYS } from "../transposition";
import { Chip } from "./Chip";

interface KeyChipGridProps {
  ariaLabel: string;
  value: number;
  onChange: (pc: number) => void;
}

export function KeyChipGrid({ ariaLabel, value, onChange }: KeyChipGridProps) {
  return (
    <div className="chips chips--keys" role="group" aria-label={ariaLabel}>
      {CHIP_KEYS.map((k) => (
        <Chip
          key={k.pc}
          label={k.name}
          selected={value === k.pc}
          onSelect={() => onChange(k.pc)}
        />
      ))}
    </div>
  );
}
