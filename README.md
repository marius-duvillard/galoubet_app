# Galoubet Transposition

PWA de transposition pour galoubet-tambourin : elle calcule le son réel d'une
méthode et aide à choisir la bonne flûte pour un morceau.

## Fonctionnalités

Deux onglets.

### Son réel

On choisit la tonalité notée de la méthode et le galoubet utilisé (Si, Si♭,
La, Sol ou Ut). L'application affiche la tonalité réellement jouée.

### Quelle flûte ?

On choisit la tonalité réelle du morceau. L'application propose la meilleure
configuration (flûte + tonalité notée) et les alternatives, classées par
confort de jeu, avec pour référence Si♭ majeur (2 bémols). Une configuration
hors plage est signalée explicitement.

## Conventions musicales

Règles exactes du moteur, codées dans `src/transposition.ts`.

Un galoubet est nommé par la note qui sonne quand on lit Do. Le nom donne
l'intervalle notée → réelle, en demi-tons :

| Galoubet | Intervalle notée → réelle |
| -------- | ------------------------- |
| Si       | -1 demi-ton               |
| Si♭      | -2 demi-tons              |
| La       | -3 demi-tons              |
| Sol      | -5 demi-tons              |
| Ut       | 0 (transposition nulle)   |

Plage confortable : une tonique notée est confortable entre 0 et 3 bémols,
c'est-à-dire Do majeur (0), Fa majeur (1 bémol), Si♭ majeur (2 bémols) et
Mi♭ majeur (3 bémols).

Distance de confort : `d = |bémols - 2|`, distance à Si♭ majeur :

- `d = 0` : « naturel »
- `d = 1` : « peu de demi-trous »
- `d = 2` : « demi-trous poussés »
- `d >= 3` : « hors plage »

Tri des configurations : les candidats sont classés par distance d, puis par
fréquence d'usage du galoubet (Si le plus courant, puis Si♭, La, Sol, Ut).

Cas particulier : en Fa♯ majeur réel, aucune configuration ne tombe dans la
plage. L'application signale alors une solution de repli (galoubet en Si,
notation en Sol majeur, 1 dièse), marquée « hors plage ».

Nommage des tonalités : nom de la tonique + nombre d'accidents, par exemple
« Si♭ majeur · 2 bémols ». Do majeur, seul sans accident, s'affiche « Do
majeur ».

## Démarrer

```bash
npm install        # dépendances
npm run dev        # serveur de développement (Vite)
npm run build      # typecheck + build de production dans dist/
npm run preview    # servir dist/ en local
npm test           # 73 tests vitest du moteur
npm run typecheck  # vérification TypeScript (tsc --noEmit)
```

## Installer la PWA sur son téléphone

1. Mettre en ligne `dist/` (résultat de `npm run build`) sur n'importe quel
   hébergeur statique, ou servir le dossier localement.
2. Ouvrir l'application sur le téléphone :
   - Android (Chrome) : menu → « Ajouter à l'écran d'accueil » ou
     « Installer l'application ».
   - iOS (Safari) : Partager → « Sur l'écran d'accueil ».
3. Dès la première visite, l'application fonctionne hors-ligne (les
   assets du build sont préchargés par le service worker à l'installation)
   (service worker).

## Régénérer les icônes

Les PNG sont générés depuis les SVG sources avec rsvg-convert :

```bash
rsvg-convert -w 192 -h 192 public/icons/icon.svg -o public/icons/icon-192.png
rsvg-convert -w 512 -h 512 public/icons/icon.svg -o public/icons/icon-512.png
rsvg-convert -w 512 -h 512 public/icons/icon-maskable.svg -o public/icons/icon-maskable-512.png
rsvg-convert -w 180 -h 180 public/icons/icon.svg -o public/apple-touch-icon.png
```

Après toute modification, changer la constante `CACHE` dans `public/sw.js`
(bump de version, par exemple `galoubet-v3`) pour forcer le rafraîchissement
du cache chez les utilisateurs installés.

## Architecture

- `src/transposition.ts` : moteur de transposition pur, sans dépendance et
  sans DOM. 100 % testé (73 tests vitest dans `src/transposition.test.ts`).
- `src/views/` (SonReel, QuelleFlute) et `src/components/` (grille de
  tonalités, puces de flûtes, badges de confort, cartes de résultat) :
  interface React 19.
- `src/storage.ts` : l'état (onglet actif, choix) est conservé dans
  localStorage sous une clé versionnée, avec repli sur les valeurs par
  défaut.
- `public/manifest.webmanifest` + `public/sw.js` : le service worker sert la
  navigation en network-first (nouvelle version dès que disponible, repli sur
  le cache en hors-ligne) et les assets statiques en cache-first.
- Icônes : SVG sources (`public/icons/icon.svg`, `icon-maskable.svg`) et PNG
  générés (voir « Régénérer les icônes »).

## Licence

À compléter.
