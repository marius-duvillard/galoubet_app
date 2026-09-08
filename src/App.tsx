import { useEffect, useState } from "react";
import { loadState, saveState } from "./storage";
import type { AppState, Tab } from "./storage";
import { StaffMark } from "./components/StaffMark";
import { SonReel } from "./views/SonReel";
import { QuelleFlute } from "./views/QuelleFlute";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "f1", label: "Son réel" },
  { id: "f2", label: "Quelle flûte ?" },
];

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <main className="app">
      <header className="app-header">
        <StaffMark />
        <div>
          <h1>Galoubet</h1>
          <p>Transpositions galoubet · tambourin</p>
        </div>
      </header>

      <div className="tabs" role="group" aria-label="Choix de l’écran">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={state.tab === tab.id ? "tab tab--active" : "tab"}
            aria-pressed={state.tab === tab.id}
            onClick={() => setState((s) => ({ ...s, tab: tab.id }))}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state.tab === "f1" ? (
        <SonReel
          writtenPc={state.f1.writtenPc}
          flute={state.f1.flute}
          onWrittenPc={(writtenPc) =>
            setState((s) => ({ ...s, f1: { ...s.f1, writtenPc } }))
          }
          onFlute={(flute) => setState((s) => ({ ...s, f1: { ...s.f1, flute } }))}
        />
      ) : (
        <QuelleFlute
          realPc={state.f2.realPc}
          onRealPc={(realPc) => setState((s) => ({ ...s, f2: { realPc } }))}
        />
      )}
    </main>
  );
}
