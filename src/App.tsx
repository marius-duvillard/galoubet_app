import { useEffect, useState } from "react";
import { loadState, saveState } from "./storage";
import type { AppState, Tab } from "./storage";
import { StaffMark } from "./components/StaffMark";
import { SonReel } from "./views/SonReel";
import { QuelleFlute } from "./views/QuelleFlute";
import { Aide } from "./views/Aide";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "f1", label: "Son réel" },
  { id: "f2", label: "Quelle flûte ?" },
];

// Injectée par le pipeline GitHub Actions à chaque release (VITE_APP_VERSION).
const VERSION: string = import.meta.env.VITE_APP_VERSION ?? "dev";

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  // Ouverte au premier lancement (helpSeen faux) ; le « ? » de l'en-tête la
  // rouvre sans toucher à helpSeen, qui ne porte que le premier fermage.
  const [aideOuverte, setAideOuverte] = useState<boolean>(() => !state.helpSeen);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const fermeAide = (): void => {
    setAideOuverte(false);
    setState((s) => (s.helpSeen ? s : { ...s, helpSeen: true }));
  };

  return (
    <main className="app">
      <header className="app-header">
        <StaffMark />
        <div>
          <h1>Galoubet</h1>
          <p>Transpositions galoubet · tambourin</p>
        </div>
        <button
          type="button"
          className="app-header__aide"
          onClick={() => setAideOuverte(true)}
          aria-label="Aide : installer l'application"
        >
          ?
        </button>
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
          noteMidi={state.f1.noteMidi}
          onWrittenPc={(writtenPc) =>
            setState((s) => ({ ...s, f1: { ...s.f1, writtenPc } }))
          }
          onFlute={(flute) => setState((s) => ({ ...s, f1: { ...s.f1, flute } }))}
          onNoteMidi={(noteMidi) =>
            setState((s) => ({ ...s, f1: { ...s.f1, noteMidi } }))
          }
        />
      ) : (
        <QuelleFlute
          realPc={state.f2.realPc}
          onRealPc={(realPc) => setState((s) => ({ ...s, f2: { ...s.f2, realPc } }))}
          rangeLow={state.f2.rangeLow}
          rangeHigh={state.f2.rangeHigh}
          onRange={(rangeLow, rangeHigh) =>
            setState((s) => ({ ...s, f2: { ...s.f2, rangeLow, rangeHigh } }))
          }
        />
      )}

      <footer className="app-footer">v{VERSION}</footer>

      {aideOuverte && <Aide onClose={fermeAide} />}
    </main>
  );
}
