# HexGL — notes projet

Voir aussi `docs/architecture.md` pour une exploration détaillée de l'état du code legacy.

## Tests de non-régression

Suite QUnit sans Node.js, dans `formation/tests/` (voir `formation/tests/README.md` pour le détail).

- Lancer : `formation/tests/ci-chrome.bat` (Windows) ou `bash HexGL/formation/tests/ci-chrome.sh` (Linux), depuis la racine du dépôt ou le dossier `formation/tests/`.
- Codes de retour : `0` = tous les tests passent, `1` = au moins un échec (voir `formation/tests/rapport_erreur.html`), `2` = exécution automatique impossible (Chrome/Edge introuvable, etc. — ouvrir `formation/tests/index.html` manuellement dans ce cas).
- Les tests couvrent uniquement des fonctions pures/DOM simple (`bkcore.Utils`, `bkcore.Timer`), sans dépendre de Three.js ni du rendu WebGL — ils peuvent donc tourner sans lancer le jeu.
- Avant tout refactoring touchant `bkcore.coffee/Utils.js` ou `bkcore.coffee/Timer.js`, relancer cette suite pour détecter une régression de comportement.

## Captures de référence

`formation/tests/captures/` contient des captures d'écran de référence du jeu avant refactoring :
- `01-ecran-accueil.jpg` — écran titre/menu (`index.html`, étape `#step-1`).
- `02-jeu-en-cours.jpg` — course en cours sur la piste Cityscape (HUD, compteur de tour, chrono).

Capturées en servant le dossier en HTTP local (ex. `python -m http.server` ou tout serveur statique équivalent — nécessaire pour que les assets/textures se chargent correctement) puis en naviguant le menu jusqu'en jeu. Le logo, les couleurs et les textes de l'écran d'accueil seront volontairement modifiés par un ticket de personnalisation (`formation/tickets/company-event.md`) : ces captures ne doivent pas être traitées comme une référence figée pour ces éléments, seulement pour le comportement du jeu (chargement, chrono, HUD, gameplay).
