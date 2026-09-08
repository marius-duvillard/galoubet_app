import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Chemin relatif au DOCUMENT (résolu par le navigateur) : fonctionne à
    // la racine comme sous un sous-chemin (ex. GitHub Pages « /nom-repo »).
    // new URL("sw.js", BASE_URL) est un piège : BASE_URL est une référence
    // relative, or la base du constructeur URL doit être absolue (sinon
    // TypeError « Invalid base URL » au runtime).
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service worker non enregistré", err);
    });
  });
}
