// F1 « Son réel » : tonalité notée + galoubet → tonalité réelle jouée.

import { comfort, formatKey, realTone } from "../transposition";
import type { Flute } from "../transposition";
import { FieldSection } from "../components/FieldSection";
import { KeyChipGrid } from "../components/KeyChipGrid";
import { FluteChips } from "../components/FluteChips";
import { ResultCard } from "../components/ResultCard";

interface SonReelProps {
  writtenPc: number;
  flute: Flute;
  onWrittenPc: (pc: number) => void;
  onFlute: (flute: Flute) => void;
}

export function SonReel({ writtenPc, flute, onWrittenPc, onFlute }: SonReelProps) {
  const realPc = realTone(writtenPc, flute);
  const realKey = formatKey(realPc);
  const writtenKey = formatKey(writtenPc);
  const writtenComfort = comfort(writtenPc);

  return (
    <div className="view">
      <FieldSection id="f1-written" title="Tonalité notée">
        <KeyChipGrid ariaLabel="Tonalité notée" value={writtenPc} onChange={onWrittenPc} />
      </FieldSection>

      <FieldSection id="f1-flute" title="Votre galoubet">
        <FluteChips value={flute} onChange={onFlute} />
      </FieldSection>

      <ResultCard
        id="f1-result"
        overline="Tonalité réelle jouée"
        tonality={realKey}
        badgeLabel={writtenComfort.label}
        note={`Vous lisez en ${writtenKey}, vous sonnez en ${realKey}.`}
      />
    </div>
  );
}
