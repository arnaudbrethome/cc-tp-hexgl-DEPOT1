# HexGL — État actuel du projet

> Document généré par exploration en lecture seule. Décrit l'état existant du code, sans proposition de correction ni refactoring.

## 1. Stack et points d'entrée

- **Langage/runtime** : JavaScript ES5 "vanilla" exécuté directement dans le navigateur (pas de bundler, pas de `package.json`, pas de Node.js). Une partie du code source historique est écrite en **CoffeeScript** (`bkcore.coffee/*.coffee`) et livrée déjà compilée en `.js` à côté de chaque fichier source.
- **Moteur 3D** : [Three.js](https://threejs.org) vendoré dans `libs/` — deux versions sont présentes (`Three.dev.js` et `Three.r53.js`), mais `index.html` ne charge que `libs/Three.dev.js`. `Three.r53.js` n'est référencé nulle part (fichier mort).
- **Rendu** : WebGL via `THREE.WebGLRenderer`, post-processing via `libs/postprocessing/*` (EffectComposer, BloomPass, ShaderPass…) et des shaders maison dans `bkcore/threejs/Shaders.js`.
- **Audio** : Web Audio API (`AudioContext`) avec repli `<audio>` pour les navigateurs plus anciens (`bkcore/Audio.js`).
- **Pas de framework UI** : le menu et le HUD sont des manipulations DOM directes (`document.getElementById`) et un `<canvas>` 2D pour le HUD.
- **Branding événementiel** : `index.html` charge une 3ᵉ feuille de style, `css/branding-acme.css`, après `css/multi.css`/`css/fonts.css`. Elle surcharge par cascade (mêmes sélecteurs `#id`, chargée en dernier, sans `!important`) les couleurs et le logo de l'écran titre, sans jamais modifier `css/multi.css` — voir §3 (Assets) pour le détail du mécanisme.
- **Points d'entrée HTML** :
  - `index.html` — point d'entrée principal (orchestré par `launch.js`), charge toute la chaîne de scripts dans l'ordre et démarre le jeu.
  - `bkcore.coffee/tests.html` — page de test isolée pour les contrôleurs CoffeeScript (Gamepad/Orientation/Touch), indépendante du jeu complet.
  - `formation/tests/index.html` — suite de tests QUnit ajoutée pour la formation (voir section 5).
  - `manifest.webapp` référence un `launch_path` vers `index-mobile.html`, **fichier absent du dépôt** (artefact mort, probablement issu de l'ancien portage Firefox OS — voir `package.webapp`).
- **Hébergement** : site statique, pas de backend. `README.md` indique `python -m SimpleHTTPServer` pour servir les fichiers en local (CORS/texture loading oblige). Note : c'est une commande Python 2, qui échoue sur une installation Python 3 récente ; utiliser `python -m http.server` à la place (vérifié fonctionnel).

## 2. Flux principal de lancement

1. `index.html` affiche l'écran titre (`#step-1`) et charge en série ~25 scripts (libs Three.js/postprocessing, contrôleurs, utilitaires `bkcore.coffee`, modules `bkcore/threejs/*`, modules de jeu `bkcore/hexgl/*`, puis la piste `Cityscape.js`, puis `HexGL.js`, et enfin `launch.js`). L'ordre de chargement est important : les scripts ne sont pas des modules, tout repose sur des globals (`bkcore`, `THREE`) initialisés dans cet ordre précis.
2. `launch.js` (compilé depuis `launch.coffee`) :
   - lit les paramètres d'URL (`bkcore.Utils.getURLParameter`) et un état de menu local (contrôles / qualité / HUD / godmode) ;
   - gère les clics sur le menu (`#start`, `#s-controlType`, `#s-quality`, `#s-hud`, `#s-godmode`, `#s-credits`) ;
   - vérifie la présence de WebGL (`hasWebGL()`) avant d'autoriser le lancement ;
   - au clic sur "Start" → écran d'aide selon le type de contrôle (`#step-2`) → au clic suivant, appelle `init(controlType, quality, hud, godmode)`.
3. `init()` instancie `bkcore.hexgl.HexGL` (le "jeu" lui-même) avec les conteneurs DOM, la qualité graphique, la difficulté (figée à `0`), le type de contrôle et la piste (`'Cityscape'`, seule piste existante).
4. `HexGL.load()` délègue au module de piste (`bkcore.hexgl.tracks.Cityscape.load`), qui utilise `bkcore.threejs.Loader` pour précharger textures, textures cube (skybox), géométries, cartes d'analyse (collision/hauteur), images HUD et sons, avec callbacks `onLoad` / `onError` / `onProgress` qui pilotent la barre de progression (`#progressbar`).
5. Une fois chargé : `hexGL.init()` construit le HUD, les matériaux et scènes de la piste, puis le compositeur de rendu (`initGameComposer`), affiche `#step-4` (le canvas de jeu) et appelle `hexGL.start()`.
6. `hexGL.start()` lance la boucle `requestAnimationFrame` (`raf()` → `update()`) et initialise le gameplay (`initGameplay()` → instancie `bkcore.hexgl.Gameplay`, démarre musique/vent).
7. Chaque frame, `HexGL.update()` appelle `gameplay.update()` (machine à états : compte à rebours → course → fin) puis `manager.renderCurrent()` (rendu via `RenderManager`/`EffectComposer`).
8. En fin de course, `gameplay.onFinish` → `HexGL.displayScore()` : calcule les temps, enregistre un record local (`localStorage`), tente de mettre à jour un "ladder" (classement) en ligne, et affiche l'écran de résultats (`#step-5` ou `#finish`).
9. Touche Échap à tout moment → `HexGL.reset()` relance une course sur la piste courante.

## 3. Principaux modules, fichiers et assets

### Logique de jeu (`bkcore/hexgl/`)
| Fichier | Rôle |
|---|---|
| `HexGL.js` (446 l.) | Orchestrateur principal : init renderer, HUD, gameplay, compositeur post-processing, écran de score, réglages de difficulté (`tweakShipControls`). |
| `Gameplay.js` (230 l.) | Machine à états de course (compte à rebours, tours, checkpoints, victoire/destruction), modes `timeattack` / `survival` (non implémenté) / `replay`. Détection de checkpoint par lecture de pixel sur une texture d'analyse (`checkPoint()`). |
| `ShipControls.js` (806 l.) | Le plus gros module : physique du vaisseau (poussée, drift, collisions, hauteur par heightmap, inclinaison, bouclier, destruction), lecture des entrées clavier/tactile/gamepad/orientation. |
| `ShipEffects.js` (186 l.) | Effets visuels du vaisseau (traînées, particules de boost/collision). |
| `CameraChase.js` (72 l.) | Caméra à la poursuite du vaisseau (mode `CHASE`) ou en orbite (mode `ORBIT`, utilisé en replay). |
| `HUD.js` (269 l.) | Rendu 2D canvas du tableau de bord (vitesse, bouclier, temps, messages). |
| `RaceData.js` (98 l.) | Enregistrement/relecture de la position du vaisseau dans le temps (pour les replays), import/export JSON. |
| `Ladder.js` (51 l.) | Classement en ligne (chargement via XHR, affichage). |
| `tracks/Cityscape.js` (521 l.) | Unique piste du jeu : définit spawn, checkpoints, et déclare la liste exhaustive des assets à charger (textures, géométries, sons, skybox) selon le niveau de qualité, puis construit matériaux et scènes. |

### Moteur / infrastructure (`bkcore/threejs/`, `bkcore/`)
| Fichier | Rôle |
|---|---|
| `Loader.js` (259 l.) | Préchargement générique (textures, cubemaps, géométries JSON, sons, images, "analysers") avec suivi de progression. |
| `Preloader.js` (150 l.) | Préchargement/écran de chargement alternatif (non branché dans `index.html` — voir §4). |
| `RenderManager.js` (131 l.) | Gestion de multiples scènes/caméras nommées ("game", "sky") et rendu de la scène courante. |
| `Particles.js` (190 l.) | Système de particules Three.js. |
| `Shaders.js` (949 l.) | Bibliothèque de shaders GLSL maison (vignette hexagonale, normal mapping, etc.). |
| `Audio.js` (141 l.) | Wrapper Web Audio API (chargement, lecture, volume, spatialisation via `PannerNode`). |

### Utilitaires historiques CoffeeScript (`bkcore.coffee/`)
- `Utils.js/.coffee` — helpers génériques (classe CSS, paramètres URL, requêtes XHR, détection tactile, matériaux normal-map). **Ce fichier est testé par la suite QUnit de formation.**
- `Timer.js/.coffee`, `ImageData.js/.coffee` — chronométrage et lecture de pixels (utilisé pour la détection de collision/hauteur).
- `controllers/` — `TouchController`, `OrientationController` (gyroscope mobile), `GamepadController` : abstractions d'entrée alternatives au clavier.
- `threejs/Particles.coffee/.js` — **doublon** d'un module existant aussi dans `bkcore/threejs/Particles.js` (deux implémentations distinctes du même nom, non partagées).

### Assets
- `geometries/` — modèles 3D exportés au format JSON Three.js (vaisseau Feisar, piste Cityscape, booster, bonus).
- `textures/` et `textures.full/` — deux jeux de textures identiques en structure, l'un basse résolution (utilisé par défaut) et l'autre haute résolution ; le `README.md` indique qu'il faut **échanger manuellement les deux dossiers** pour activer la haute résolution (pas de sélection automatique par la qualité graphique). Plusieurs fichiers texture ont des doublons suspects (`cloud - Copie.png`, `spark - Copie.png`).
- `audio/` — pistes `.ogg` (musique, vent, boost, crash, destruction).
- `css/` — polices (`BebasNeue`), styles du menu/HUD, images d'aide par type de contrôle. `css/multi.css` reste la feuille de style legacy (non modifiée) ; `css/branding-acme.css` (ajouté pour le ticket `company-event`) surcharge par cascade les couleurs et le logo de l'écran titre via un bloc `:root { --acme-* }` unique — point de configuration à éditer pour un futur rebranding événementiel.
- `formation/identite/logo.png` — logo ACME, référencé directement (chemin relatif, sans copie) par `css/branding-acme.css` via `background-image: var(--acme-logo)`. `formation/identite/charte_graphique_acme.pdf` reste la référence de palette/contraintes visuelles pour tout futur événement.

## 4. Dépendances et zones legacy à risque

- **Aucun gestionnaire de dépendances** : toutes les libs tierces (Three.js, LeapMotion, DAT.GUI, Stats.js) sont vendorées en `libs/`, figées à des versions anciennes (ex. Three.js pré-r54, API aujourd'hui dépréciée : `mat.n44`, `.subSelf()`, `.lerpSelf()`, `.addSelf()` n'existent plus dans les versions modernes de Three.js).
- **Double chaîne de build fantôme** : le code "source" CoffeeScript (`bkcore.coffee/*.coffee`) coexiste avec son `.js` compilé versionné en dur ; rien ne garantit que le `.js` chargé en prod est à jour par rapport au `.coffee` à côté (aucun script de build dans le dépôt).
- **Duplication de modules** : `bkcore/threejs/Particles.js` et `bkcore.coffee/threejs/Particles.coffee/.js` sont deux implémentations séparées ; `bkcore/threejs/Preloader.js` existe mais n'est chargé par aucune page HTML du dépôt.
- **Artefacts de portage mobile morts** : `manifest.webapp` pointe vers `index-mobile.html` (absent), `package.webapp`/`package.zip` et `cache.appcache` référencent un packaging Firefox OS (v1.0.1-ffos, daté 2013) obsolète.
- **Pas de tests automatisés d'origine** : avant l'ajout de `formation/tests/`, le projet n'avait aucun test (confirmé par l'absence de tout framework de test dans `libs/` en dehors de `Stats.js`, qui est un moniteur FPS, pas un test).
- **Pas de linter/formatter** ni de configuration d'éditeur ; style de code hétérogène entre fichiers `bkcore.coffee` (généré, commenté JSDoc-like) et `bkcore` (commentaires d'en-tête uniformes mais aucun typage/validation).
- **Stockage de scores non sécurisé** : les meilleurs temps sont stockés en clair dans `localStorage` (`score-<track>-<mode>`), trivialement modifiables côté client ; le "ladder" en ligne (`Ladder.js`) dépend d'un `callback` HTTP dont l'URL n'est pas visible dans ce dépôt ("Undisclosed" en commentaire dans `HexGL.js:252`).
- **Couplage fort au DOM global** : quasiment tous les modules font des `document.getElementById(...)` directs avec des IDs en dur (`finish`, `finish-state`, etc.), ce qui rend le code fragile à toute modification de `index.html`. Le ticket de personnalisation événementielle (`formation/tickets/company-event.md`) a été implémenté sans toucher à cette logique : seuls deux éléments de texte statiques ont été ajoutés dans `#title` (IDs existants inchangés), donc aucun risque de régression sur les `document.getElementById` legacy.
- **`css/multi.css:161-163` — `#start:hover { color: #f8854b !important; }`** : ce `!important` empêche toute surcharge de la couleur de survol du bouton Start par un fichier CSS chargé après `multi.css`, même avec le même sélecteur en dernière position de cascade. L'échec est silencieux (aucune erreur, la couleur legacy reste appliquée). Constaté avec `css/branding-acme.css` (ticket `company-event`), où le survol de `#start` reste orange legacy au lieu du bleu ACME attendu — un futur correctif devra soit ajouter `!important` à son tour (avec commentaire expliquant pourquoi), soit retirer le `!important` legacy dans `multi.css`.
- **Piège CSS (position absolue + marges en `%`)** : sur un élément `position: absolute`, les `%` de `top`/`left`/`right`/`bottom` se calculent par rapport à la hauteur/largeur du bloc conteneur, mais les `%` de `margin` (y compris `margin-top`) se calculent **toujours** par rapport à la largeur du conteneur, jamais sa hauteur. Rencontré en positionnant le message d'accueil ACME sous le logo dans `#title` (`css/branding-acme.css`) ; résolu en utilisant `top`/`left`/`right` plutôt que `margin` en `%`.
- **Compatibilité navigateur datée** : `bkcore.coffee/Utils.js` contient encore un repli `ActiveXObject` pour IE pré-XHR natif.

## 5. Fonctions/modules testables automatiquement

La suite QUnit ajoutée en formation (`formation/tests/`) ne teste actuellement que `bkcore.coffee/Utils.js`, chargé seul (sans dépendre de Three.js ni du reste du jeu) :
- `Utils.updateClass(id, cssclass, active)` — ajout/suppression de classe CSS.
- `Utils.getOffsetTop(obj)` — calcul récursif d'offset DOM (le test utilise un objet simulé, sans DOM réel).
- `Utils.getURLParameter(name)` — lecture de paramètres d'URL (test dépendant du paramètre `hexgl_poc` injecté par `index.html` de la suite de tests elle-même).

Infrastructure de test : `formation/tests/index.html` + `browser-tests.js` + `vendor/qunit-2.26.0.{js,css}` en local (pas de CDN, pas de Node). Exécution headless via `ci-chrome.bat` (Windows) / `ci-chrome.sh` (Linux), qui pilotent Chrome/Chromium/Edge et lisent l'état final via les attributs `data-test-status` / `data-test-count` / `data-test-failures` posés sur `<html>` par le callback `QUnit.done`. Codes de sortie documentés : `0` succès, `1` échec d'assertion, `2` exécution impossible.

D'autres fonctions du projet sont structurellement testables sans DOM ni WebGL, car ce sont des fonctions pures ou quasi-pures manipulant des nombres/structures simples :
- `bkcore.Timer.msToTimeString` / `msToTime` (conversion de millisecondes en minutes/secondes/ms affichées, utilisée par `HexGL.displayScore` et `Ladder.displayLadder`).
- `bkcore.hexgl.RaceData.tick` / `export` / `import` (sérialisation de trajectoire, logique indépendante du rendu).
- `bkcore.hexgl.Gameplay.checkPoint` (logique de détection, mais dépend de `this.analyser`/`this.shipControls`, nécessiterait des doubles de test).
- `bkcore.Utils.getURLParameter` et `isTouchDevice` (déjà partiellement couvertes).

À l'inverse, la quasi-totalité de `ShipControls.js`, `CameraChase.js`, `HUD.js`, `RenderManager.js`, `Loader.js` et des modules de piste est fortement couplée à `THREE.*`, au `requestAnimationFrame`, au canvas WebGL ou au DOM, et n'est pas testable unitairement sans un environnement de simulation 3D ou un gros travail de mocking.

## 6. Bugs, dettes ou anomalies remarquables

- **`HexGL.js:228`** — `JSON.Stringify(...)` (majuscule) au lieu de `JSON.stringify`. `JSON.Stringify` n'existe pas sur l'objet `JSON` global : cette ligne lève une `TypeError` à l'exécution, donc l'export du replay (`localStorage['race-'+t+'-replay']`) à l'établissement d'un nouveau record local échoue silencieusement (l'erreur n'est pas catchée à cet endroit).
- **`Ladder.js:20`** — écrit dans `bkcore.Ladder.global` alors que le namespace déclaré est `bkcore.hexgl.Ladder` (`bkcore.hexgl.Ladder.global` déclaré en tête de fichier). Résultat : `bkcore.hexgl.Ladder.global` ne sera jamais rempli par `load()`, et `HexGL.js` (`bkcore.hexgl.Ladder.global[t][d]`) lira systématiquement `undefined` → risque de `TypeError` non géré dans `displayScore()` si ce chemin est atteint.
- **`Ladder.js:17`** — `bkcore.Utils.request("nothing", false, ...)` : l'URL en dur `"nothing"` suggère un stub/mock jamais remplacé par une vraie URL de service.
- **`Ladder.js:36`** — `!bkcore.Ladder.global[track][mode] == undefined` : erreur de précédence d'opérateurs (`!x == undefined` s'évalue comme `(!x) == undefined`, toujours `false`), la condition ne fait donc pas ce que son intention suggère (garde contre un ladder non défini).
- **`manifest.webapp`** référence `index-mobile.html`, fichier inexistant dans le dépôt : toute installation en "webapp" packagée casserait au lancement.
- **Texture haute résolution non activable dynamiquement** : malgré un paramètre `quality` à 4 niveaux dans l'UI, le passage en textures haute définition nécessite une opération manuelle (échange de dossiers), documentée uniquement dans le `README.md`.
- **Mode `survival` déclaré mais non implémenté** : `Gameplay.js` référence `this.modes.survival` dans la liste des modes valides mais ne lui assigne jamais de fonction (`null`) ; si sélectionné, `this.modes[this.mode].call(this)` lèverait une erreur ("not a function").
- **Fichiers dupliqués d'assets** : `cloud - Copie.png`, `spark - Copie.png` dans `textures/particles/` et `textures.full/particles/` (copies Windows non nettoyées, probablement inutilisées).
- **Mélange CoffeeScript source / JS compilé versionnés ensemble**, sans script de build dans le dépôt pour regénérer les `.js` à partir des `.coffee` si on les modifie.
- **Support LeapMotion implémenté directement dans `ShipControls.js`** (lignes ~174-209, 380-510), contrairement à Touch/Orientation/Gamepad qui sont des modules dédiés dans `bkcore.coffee/controllers/` — incohérence d'architecture (un module métier qui connaît directement la lib tierce `Leap.Controller` au lieu de passer par l'abstraction `controllers/`), bien que l'option "LEAP MOTION CONTROLLER" soit sélectionnable depuis le menu (`launch.js:49`).
- **Pas de gestion d'erreur réseau robuste** dans `Loader.js`/`Audio.js` au-delà de `console.error` : un asset manquant bloque silencieusement la progression sans retry ni message utilisateur actionnable au-delà du callback `onError`.
