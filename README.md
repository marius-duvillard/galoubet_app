# Galoubet Transposition

PWA de transposition pour galoubet-tambourin : elle calcule le son réel d'une
méthode et aide à choisir la bonne flûte pour un morceau.

## Fonctionnalités

Deux onglets, et une aide d'installation qui s'affiche au premier lancement.

- Les puces de tonalité affichent l'armure de la tonalité (ex. « 2♭ »).
- Le rappel de la transposition (intervalle notée → réelle) figure dans les
  deux onglets.

### Son réel

On choisit la tonalité notée de la méthode et le galoubet utilisé (Si, Si♭,
La, Sol ou Ut). L'application affiche la tonalité réellement jouée.

- Une portée affiche la note écrite (pleine) et sa sonnerie réelle (creuse) :
  la note se déplace au doigt ou au clavier (↑↓ degrés) dans l'ambitus, en
  suivant l'armure de la tonalité (posée sur la ligne du Si en Si♭ majeur,
  elle donne Si♭), **indépendamment de la tonalité** (les puces seules
  changent la tonalité). L'armure de la tonalité (notée puis réelle)
  accompagne chaque groupe de notes, dans sa couleur.

### Quelle flûte ?

On choisit la tonalité réelle du morceau. L'application propose la meilleure
configuration (flûte + tonalité notée) et les alternatives, classées par
confort de jeu, avec pour référence Si♭ majeur (2 bémols). Une configuration
hors plage est signalée explicitement.

- On peut saisir l'étendue du morceau en son réel (notes la plus grave et la
  plus aiguë, entre Do3 et Do6) : soit en touchant/déplaçant les notes sur la
  portée (souris ou tactile), soit via les sélecteurs (repli) ; les flûtes
  dont la lecture tient dans l'ambitus du galoubet sont proposées en premier.
- Une configuration dont la lecture ne tient qu'une octave plus bas (ou plus
  haut) porte le badge « octave plus bas » / « octave plus haut » (indigo) :
  la lecture affichée est alors la lecture décalée, et le morceau sonne une
  octave plus loin du son réel saisi. Le badge « hors ambitus » ne reste que
  pour une lecture qui ne tient à aucune octave.
- Quand aucune configuration ne tient, même à l'octave, le message le dit
  explicitement : « Aucune configuration ne couvre l'étendue du morceau,
  même à l'octave. ».
- En saisie d'étendue, la portée affiche aussi la lecture de la
  configuration sélectionnée (notes creuses à droite) : cliquer une carte
  ou une option change la lecture affichée.

## Conventions musicales

Règles exactes du moteur, codées dans `src/transposition.ts` et
`src/ambitus.ts`.

Un galoubet est nommé par la note qui sonne quand on lit Do. Le nom donne
l'intervalle notée → réelle, en demi-tons :

| Galoubet | Intervalle notée → réelle | Nom usuel              |
| -------- | ------------------------- | ---------------------- |
| Si       | -1 demi-ton               | 2de mineure plus bas   |
| Si♭      | -2 demi-tons              | 2de majeure plus bas   |
| La       | -3 demi-tons              | 3ce mineure plus bas   |
| Sol      | -5 demi-tons              | 4te juste plus bas     |
| Ut       | 0 (transposition nulle)   | à l'unisson            |

Règle d'écriture : note notée = note réelle − intervalle de la flûte.

Ambitus du galoubet, en lecture galoubet : de Mi♭4 (MIDI 63, première ligne
de la portée) à Si♭5 (MIDI 82, au-dessus de la portée), inclus. L'étendue du
morceau se saisit en son réel, note la plus grave et note la plus aiguë
choisies entre Do3 (MIDI 48) et Do6 (MIDI 84).

L'étendue notée est testée dans [63, 82] avec un décalage d'octave facultatif,
essayé dans l'ordre 0, −12, +12 (le 0 est préféré à égalité) ; au plus un des
deux décalages ±12 peut tenir. Une étendue plus large que l'ambitus
(19 demi-tons) ne tient jamais, et il en va de même dans la bande où aucun
décalage ne sait la placer : notée grave ≤ 62 et notée aiguë ≥ 71.

Plage confortable : une tonique notée est confortable entre 0 et 3 bémols,
c'est-à-dire Do majeur (0), Fa majeur (1 bémol), Si♭ majeur (2 bémols) et
Mi♭ majeur (3 bémols).

Distance de confort : `d = |bémols - 2|`, distance à Si♭ majeur :

- `d = 0` : « naturel »
- `d = 1` : « peu de demi-trous »
- `d = 2` : « demi-trous poussés »
- `d >= 3` : « hors plage »

Tri des configurations : en saisie d'étendue, les candidats sont classés par
quatre clés, dans l'ordre (tient, tient à la hauteur réelle, distance d,
fréquence d'usage du galoubet : Si le plus courant, puis Si♭, La, Sol, Ut).
Sans étendue saisie, seules les deux dernières clés interviennent. Conséquence
du tri complet : un candidat qui tient à la hauteur réelle passe devant un
candidat qui ne tient qu'à l'octave, même avec un confort d moins bon.

Cas particulier : en Fa♯ majeur réel, aucune configuration ne tombe dans la
plage. L'application signale alors une solution de repli (galoubet en Si,
notation en Sol majeur, 1 dièse), marquée « hors plage ». Le mécanisme de
repli est inchangé avec l'étendue : la carte de repli porte elle aussi le
badge d'octave quand sa lecture tient à l'octave, mais elle ne devient jamais
la configuration principale.

Nommage des tonalités : nom de la tonique + nombre d'accidents, par exemple
« Si♭ majeur · 2 bémols ». Do majeur, seul sans accident, s'affiche « Do
majeur ».

## Démarrer

```bash
npm install        # dépendances
npm run dev        # serveur de développement (Vite)
npm run build      # typecheck + build de production dans dist/
npm run preview    # servir dist/ en local
npm test           # 228 tests vitest (moteur 92 · portée 51 · ambitus 56
                   # · stockage 26 · service worker 3)
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

## Déployer sur GitHub Pages

Le pipeline GitHub Actions est prêt (`.github/workflows/deploy.yml`) :
chaque tag `v*` déclenche le build, le déploiement sur GitHub Pages et une
release GitHub avec l'archive `dist.zip`. La version du tag s'affiche dans
le footer de l'application.

1. Créer un dépôt GitHub et y pousser le projet :

   ```bash
   git remote add origin git@github.com:TON_USER/galoubet_app.git
   git push -u origin main
   ```

2. Sur GitHub : **Settings → Pages → Build and deployment → Source :
   « GitHub Actions »** (une fois seulement).
3. Créer le premier tag et le pousser :

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. L'app est en ligne sur `https://TON_USER.github.io/galoubet_app/` et
   une release avec `dist.zip` apparaît dans l'onglet **Releases**.

Le service worker est « base-agnostic » : il fonctionne aussi bien à la
racine d'un domaine que sous le sous-chemin `user.github.io/nom-repo`.

### Domaine custom (optionnel)

Ajouter un fichier `CNAME` à la racine du dépôt contenant le domaine (ex.
`galoubet.mon-domaine.fr`), pousser, puis créer un nouveau tag. Le build
passe alors en base `/` et le CNAME est copié dans `dist/`. Côté DNS :
`CNAME galoubet.mon-domaine.fr → TON_USER.github.io`.

## Régénérer les icônes

Les PNG sont générés depuis les SVG sources avec rsvg-convert :

```bash
rsvg-convert -w 192 -h 192 public/icons/icon.svg -o public/icons/icon-192.png
rsvg-convert -w 512 -h 512 public/icons/icon.svg -o public/icons/icon-512.png
rsvg-convert -w 512 -h 512 public/icons/icon-maskable.svg -o public/icons/icon-maskable-512.png
rsvg-convert -w 180 -h 180 public/icons/icon.svg -o public/apple-touch-icon.png
```

Après toute modification, changer la constante `CACHE` dans `public/sw.js`
(bump de version, par exemple `galoubet-v8` → `galoubet-v9`) pour forcer le
rafraîchissement du cache chez les utilisateurs installés.

## Architecture

- `src/transposition.ts` : moteur de transposition pur, sans dépendance et
  sans DOM. 100 % testé (tests dans `src/transposition.test.ts`).
- `src/ambitus.ts` : module pur de l'ambitus du galoubet (`formatNote`,
  `writtenRange`, `fitsAmbitus`, `octaveShiftToFit`, `octaveLabel`,
  `type OctaveShift`, `pickWithRange`), sans DOM, dépend uniquement de
  `src/transposition.ts`.
- `src/staff.ts` : géométrie de la portée, pure et sans DOM. Fait la
  correspondance MIDI ↔ position verticale (`midiToPosition`,
  `positionToNaturalMidi`, `positionY`), les lignes supplémentaires
  (`ledgerLinesFor`), les altérations et leur interaction avec l'armure
  (`keySignatureAccidental`, `midiWithKeySignature`,
  `accidentalNotation`, `keySignatureOf`) — l'armure tient lieu
  d'altération — et le layout groupé par groupe de notes (`staffLayout`,
  `staffGroupLayout`, `StaffGroup`).
- `src/sw.test.ts` : tests du service worker (harness `node:vm` exécutant le
  vrai `public/sw.js`), y compris le cas sous-chemin GitHub Pages.
- `src/views/Aide.tsx` : dialogue d'installation (rôle `dialog`, `aria-modal`,
  Échap et clic sur le fond le ferment). Ouvert au premier lancement, rouvrable
  par le « ? » de l'en-tête ; il couvre Android (Chrome), iPhone/iPad (Safari)
  et ordinateur (Chrome), et rappelle qu'une fois installée l'app marche hors
  connexion.
- `src/views/` (SonReel, QuelleFlute) et `src/components/` : interface
  React 19. La portée est rendue en SVG par `Staff.tsx`, `StaffMark.tsx`,
  `KeyStaff.tsx` et `Signature.tsx` (armure par groupe, dans la couleur du
  groupe), à partir de la géométrie de `src/staff.ts`. Le reste de
  l'interface : `KeyChipGrid` (grille de tonalités), `FluteChips` (puces de
  flûtes), `RangeSelect` (sélecteur d'étendue), `ComfortBadge` (badges de
  confort), `ResultCard` (cartes de résultat), `FieldSection` et `Chip`
  (conteneurs).
- `src/storage.ts` : l'état (onglet actif, choix, `helpSeen`) est conservé dans
  localStorage sous une clé versionnée, avec repli sur les valeurs par
  défaut. `helpSeen` ne retient que `true` strict : un payload v1 sans la clé
  remet l'aide en avant au lieu de la faire croire vue. L'étendue du morceau (f2.rangeLow / f2.rangeHigh) et la note
  écrite de la portée (f1.noteMidi) partagent la même clé v1, avec parse
  tolérant (bornes invalides abandonnées ensemble).
- `public/manifest.webmanifest` + `public/sw.js` : le service worker sert la
  navigation en network-first (nouvelle version dès que disponible, repli sur
  le cache en hors-ligne) et les assets statiques en cache-first. Tous les
  chemins sont relatifs à l'emplacement du worker : l'app fonctionne à la
  racine comme sous un sous-chemin (GitHub Pages).
- Icônes : SVG sources (`public/icons/icon.svg`, `icon-maskable.svg`) et PNG
  générés (voir « Régénérer les icônes »).

## Licence

À compléter.
