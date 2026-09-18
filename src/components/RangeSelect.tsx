// Double sélecteur d'étendue (grave / aiguë) en notes MIDI. Contrôlé :
// les deux listes sont vides (« — ») tant que l'étendue n'est pas posée.
// Règles : « — » sur n'importe quelle liste efface toute l'étendue ;
// si les deux sont posées et que la nouvelle note enfreint low ≤ high,
// les deux sont recalées sur la nouvelle note (low = high).

import { RANGE_MAX, RANGE_MIN, formatNote } from "../ambitus";

interface RangeSelectProps {
  low?: number;
  high?: number;
  onChange: (low?: number, high?: number) => void;
}

const MIDI_OPTIONS: readonly number[] = Array.from(
  { length: RANGE_MAX - RANGE_MIN + 1 },
  (_unused, index) => RANGE_MIN + index,
);

interface RangePickerProps {
  id: string;
  label: string;
  value: number | undefined;
  onPick: (value: number | undefined) => void;
}

function RangePicker({ id, label, value, onPick }: RangePickerProps) {
  return (
    <div className="range__field">
      <label className="range__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="range__select"
        value={value === undefined ? "" : String(value)}
        onChange={(event) => {
          const raw = event.target.value;
          onPick(raw === "" ? undefined : Number(raw));
        }}
      >
        <option value="">—</option>
        {MIDI_OPTIONS.map((midi) => (
          <option key={midi} value={String(midi)}>
            {formatNote(midi)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RangeSelect({ low, high, onChange }: RangeSelectProps) {
  const pickLow = (value: number | undefined): void => {
    if (value === undefined) {
      onChange(undefined, undefined);
    } else if (high === undefined) {
      onChange(value, undefined);
    } else {
      onChange(value, Math.max(value, high));
    }
  };

  const pickHigh = (value: number | undefined): void => {
    if (value === undefined) {
      onChange(undefined, undefined);
    } else if (low === undefined) {
      onChange(undefined, value);
    } else {
      onChange(Math.min(low, value), value);
    }
  };

  return (
    <div className="range">
      <RangePicker id="f2-range-low" label="Note la plus grave" value={low} onPick={pickLow} />
      <RangePicker id="f2-range-high" label="Note la plus aiguë" value={high} onPick={pickHigh} />
    </div>
  );
}
