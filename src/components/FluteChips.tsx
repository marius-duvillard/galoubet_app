// Rangée des 5 galoubets, étiquettes « en Si »… issues du moteur (FLUTES).

import { FLUTES } from "../transposition";
import type { Flute } from "../transposition";
import { Chip } from "./Chip";

const FLUTE_LABEL: Record<Flute, string> = {
  Si: "en Si",
  "Si♭": "en Si♭",
  La: "en La",
  Sol: "en Sol",
  Ut: "en Ut",
};

interface FluteChipsProps {
  value: Flute;
  onChange: (flute: Flute) => void;
}

export function FluteChips({ value, onChange }: FluteChipsProps) {
  return (
    <div className="chips chips--flutes" role="group" aria-label="Choix du galoubet">
      {FLUTES.map((f) => (
        <Chip key={f} label={FLUTE_LABEL[f]} selected={value === f} onSelect={() => onChange(f)} />
      ))}
    </div>
  );
}
