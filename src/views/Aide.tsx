// Aide d'installation : dialogue ouvert au premier lancement (et ré-ouvrable
// depuis le « ? » de l'en-tête). Explique comment installer la PWA sur Android,
// iOS et ordinateur. La fermeture est l'événement qui pose `helpSeen`.

import { useEffect, useRef } from "react";

interface AideProps {
  onClose: () => void;
}

interface Marche {
  titre: string;
  navigateur: string;
  etapes: readonly string[];
}

const MARCHES: readonly Marche[] = [
  {
    titre: "Android",
    navigateur: "Chrome",
    etapes: [
      "Ouvre le menu ⋮ en haut à droite.",
      "Choisis « Installer l'application » (ou « Ajouter à l'écran d'accueil »).",
      "Confirme : l'application apparaît sur ton écran d'accueil.",
    ],
  },
  {
    titre: "iPhone · iPad",
    navigateur: "Safari",
    etapes: [
      "Touche le bouton Partager (le carré avec une flèche, sous la barre d'adresse).",
      "Choisis « Sur l'écran d'accueil ».",
      "Touche « Ajouter » : l'application apparaît sur ton écran d'accueil.",
    ],
  },
  {
    titre: "Ordinateur",
    navigateur: "Chrome",
    etapes: [
      "Repère l'icône d'installation à droite de la barre d'adresse.",
      "Sinon, menu ⋮ → « Installer l'application ».",
      "Le site s'ouvre dans sa propre fenêtre, avec son icône.",
    ],
  },
];

export function Aide({ onClose }: AideProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="aide" onClick={onClose}>
      <div
        className="aide__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aide-titre"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="aide__head">
          <h2 className="aide__title" id="aide-titre">
            Installer l'application
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="aide__close"
            onClick={onClose}
            aria-label="Fermer l'aide"
          >
            Fermer
          </button>
        </div>

        <p className="aide__intro">
          Une fois installée, l'application s'ouvre sans barre d'adresse et
          fonctionne hors connexion, en avion comme en campagne.
        </p>

        <div className="aide__marches">
          {MARCHES.map((marche) => (
            <section className="aide__marche" key={marche.titre}>
              <h3 className="aide__marche-titre">
                {marche.titre}
                <span className="aide__navigateur">{marche.navigateur}</span>
              </h3>
              <ol className="aide__etapes">
                {marche.etapes.map((etape) => (
                  <li key={etape} className="aide__etape">
                    {etape}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
