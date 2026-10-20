# Spécification — Personnalisation événementielle de l'écran d'accueil HexGL

## Contexte et objectif

ACME souhaite utiliser HexGL lors d'un événement d'entreprise. L'écran d'accueil du jeu
(`index.html`, étape `#step-1`) doit être adapté pour refléter l'identité visuelle ACME
(logo, couleurs, nom, message d'accueil), afin que les participants de l'événement
reconnaissent immédiatement la marque au lancement du jeu.

Le jeu lui-même (physique, contrôles, pistes, HUD en course) ne fait pas partie du
périmètre : seul l'écran d'accueil est concerné.

Source de vérité du besoin : `formation/tickets/company-event.md`.
Contrainte d'identité visuelle : `formation/identite/charte_graphique_acme.pdf` et
`formation/identite/logo.png`.

## Exigences fonctionnelles

1. **Logo ACME** affiché sur l'écran d'accueil (`#step-1`), à partir du fichier
   `formation/identite/logo.png`, sans déformation (ratio conservé).
2. **Couleurs de la charte** appliquées à l'écran d'accueil :
   - Fond principal sombre (`#08090D`).
   - Accents en violet (`#7628FF`), bleu électrique (`#315BFF`) et/ou cyan (`#00C4E8`),
     dégradé événementiel autorisé (`#7628FF → #315BFF`).
   - Texte en blanc (`#FFFFFF`) ou gris clair (`#E6E8EE`) pour rester lisible sur fond sombre.
3. **Nom de l'entreprise** ("ACME") visible sur l'écran d'accueil.
4. **Message d'accueil** affiché : *"Bienvenue au ACME Racing Challenge"*, accompagné de
   son sous-texte *"Une expérience événementielle aux couleurs de la marque."*

## Comportements attendus

- Au chargement de `index.html`, l'écran titre (`#step-1`) présente l'identité ACME
  (logo, message, couleurs) avant toute interaction utilisateur.
- Le bouton de lancement de partie reste pleinement fonctionnel et déclenche le même
  enchaînement d'écrans qu'actuellement (aide selon le contrôle → chargement → jeu).
- Une fois la partie lancée (`#step-2` à `#step-5`, HUD, fin de course), le comportement
  et l'apparence du jeu restent strictement identiques à l'état actuel (gameplay inchangé,
  comme demandé par le ticket).
- Le jeu reste jouable hors-ligne/en local via un serveur statique, sans dépendance
  réseau supplémentaire introduite par la personnalisation.

## Contraintes

- **Gameplay inchangé** : aucune modification de la physique du vaisseau, des contrôles,
  des pistes, de la logique de course ou du HUD en jeu.
- **Logo non déformé, non recoloré** : utiliser le fichier `logo.png` fourni tel quel,
  avec une zone de respiration autour, sans ombre ni contour ajoutés.
- **Pas de nouvelle dépendance webfont** introduite uniquement pour le rebranding ; en
  intégration sur le code existant, conserver la typographie actuelle si elle reste
  lisible et cohérente avec la charte.
- **Sobriété** : éviter les effets additionnels complexes, l'objectif est une intégration
  sobre et maintenable, cohérente avec le reste du menu (pas de surcharge visuelle).
- **Pas de gris moyen dominant** en fond (fond sombre ou très clair uniquement, selon
  la charte).

## Décisions de conception déjà imposées

- Palette imposée : noir profond `#08090D` (fond), violet `#7628FF`, bleu électrique
  `#315BFF`, cyan `#00C4E8` (accents), blanc `#FFFFFF` et gris clair `#E6E8EE` (texte).
- Dégradé événementiel autorisé : `#7628FF → #315BFF`.
- Message d'accueil imposé mot pour mot : "Bienvenue au ACME Racing Challenge".
- Logo utilisé tel que fourni dans `formation/identite/logo.png`, sans transformation
  de couleur.

## Cas limites et gestion des erreurs

- Si `formation/identite/logo.png` est introuvable ou ne charge pas, l'écran d'accueil
  doit rester utilisable (le bouton de démarrage doit continuer à fonctionner) : le logo
  ne doit pas être un point de blocage du chargement du menu.
- Le rendu doit rester correct sur les tailles d'écran déjà supportées par le menu actuel
  (pas de régression de lisibilité du bouton "Start" ni du message).
- Les autres écrans intermédiaires du menu (choix du contrôle, écran d'aide, crédits)
  ne sont pas tenus de reprendre l'identité ACME dans le cadre de ce ticket, tant que le
  jeu et son gameplay restent inchangés ; leur personnalisation éventuelle est hors
  périmètre (voir ci-dessous).

## Hors périmètre

- Toute modification du gameplay : physique, contrôles, pistes, détection de collision,
  HUD en course, musique/sons.
- La personnalisation des écrans autres que l'écran d'accueil titre (`#step-1`) :
  écran d'aide par type de contrôle, écran de score/fin de course, crédits.
- L'introduction d'une nouvelle police web (contrainte explicite de la charte).
- Le "haute résolution" des textures de jeu, le classement en ligne ("ladder"), ou tout
  autre sujet déjà identifié comme dette technique dans `docs/architecture.md` et non
  lié à ce ticket.

## Critères d'acceptation

1. En ouvrant `index.html` (servi en HTTP local), l'écran d'accueil affiche le logo
   ACME non déformé, le nom "ACME" et le message "Bienvenue au ACME Racing Challenge".
2. Le fond de l'écran d'accueil est sombre et les couleurs d'accent utilisées
   (boutons, éléments de mise en valeur) appartiennent à la palette ACME (violet, bleu
   électrique, cyan) ou au dégradé événementiel.
3. Le texte reste lisible (contraste suffisant sur fond sombre).
4. Le clic sur le bouton de démarrage lance la partie exactement comme avant la
   personnalisation (même enchaînement d'écrans, mêmes contrôles disponibles).
5. Une partie jouée du début à la fin (compte à rebours, course, HUD, fin de course)
   est identique en comportement à l'état précédent le ticket — vérifiable par
   comparaison avec `formation/tests/captures/02-jeu-en-cours.jpg`.
6. La suite de tests `formation/tests/ci-chrome.bat` / `ci-chrome.sh` passe toujours
   (code retour `0`), confirmant l'absence de régression sur les fonctions couvertes.
