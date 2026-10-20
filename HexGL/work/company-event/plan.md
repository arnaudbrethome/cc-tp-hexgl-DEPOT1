# Plan technique — Personnalisation événementielle ACME (écran d'accueil HexGL)

## Contexte

Le ticket `formation/tickets/company-event.md` et la spec `work/company-event/spec.md`
demandent d'habiller l'écran titre (`#step-1` dans `index.html`) aux couleurs ACME (logo,
palette, nom, message d'accueil) sans toucher au gameplay. Le code est un legacy statique
sans build (scripts chargés en `<script>` bruts, CSS monolithique `css/multi.css`, pas de
Node, pas de bundler). L'objectif de ce plan est de définir la plus petite modification
techniquement propre et réversible pour atteindre ce résultat, en s'appuyant sur
l'exploration du code existant (`index.html`, `css/multi.css`, `launch.coffee`/`launch.js`).

## État actuel et architecture concernée

- `index.html` (`#step-1`, lignes ~46-61) :
  - `#global` : fond plein écran (`css/bg.jpg` via CSS).
  - `#title` : `<div>` **vide**, logo/titre affiché uniquement via
    `background-image: url('title.png')` dans `css/multi.css` (pas de `<img>`).
  - `#menucontainer > #menu` : contient `#start` ("Start"), `#s-controlType`,
    `#s-quality`, `#s-hud`, `#s-godmode`, `#s-credits` — textes de ces derniers sont
    mutés dynamiquement par `launch.coffee`/`launch.js`.
  - `<head>` charge deux feuilles de style, dans l'ordre : `css/multi.css` puis
    `css/fonts.css` (police `BebasNeueRegular`, pas de dépendance webfont externe).
- `css/multi.css` : fichier CSS unique, sélecteurs `#id` en dur, **aucune variable CSS**,
  couleurs actuelles codées en dur (`#4190bb` menu, `#f66439` start/hover, fond blanc
  par défaut sur `html,body`). Styles clés : `#global`, `#title`, `#menucontainer`,
  `#menu`, `#menu div`, `#menu div:hover`, `#start`, `#start:hover`.
- `launch.coffee`/`launch.js` : ne lit **aucune** valeur CSS ni texte de `#title`/`#menu`
  pour son fonctionnement (confirmé). Seule dépendance : si WebGL est absent, le texte
  de `#start` est remplacé par du JS (`'WebGL is not supported!'`) — ce code n'est pas
  affecté par un changement de style/texte initial de `#start`.
- Le reste du moteur (`HexGL.js`, `Gameplay.js`, `ShipControls.js`, `tracks/Cityscape.js`,
  etc.) ne référence jamais `#step-1` : zéro couplage avec l'écran titre.
- Aucune dépendance Node/build : tout changement se fait en éditant directement
  HTML/CSS statiques.

## Approche technique

Tout le branding (couleurs + logo) est centralisé dans **un seul nouveau fichier CSS**,
`css/branding-acme.css`, chargé après `multi.css`/`fonts.css` dans `index.html`. Ce
fichier définit un bloc `:root { --acme-... }` en tête (le point de configuration
unique à éditer pour un futur événement) puis des règles qui surchargent les sélecteurs
existants (`#global`, `#title`, `#menu`, `#menu div`, `#start`, `#start:hover`) en
consommant ces variables. Comme ce fichier est chargé en dernier et cible les mêmes
sélecteurs `#id` (même spécificité), il gagne naturellement la cascade sans
`!important` et sans toucher à `multi.css`.

Le logo est appliqué en remplaçant uniquement la valeur de `background-image` de
`#title` par une variable CSS pointant vers `formation/identite/logo.png` (référencé
directement par chemin relatif, sans copie du fichier — une seule source de vérité pour
l'image, pas de duplication d'asset). Les propriétés `background-size: auto 50%` /
`no-repeat center top` de `multi.css` sont conservées telles quelles : `auto` sur un axe
garantit qu'aucune déformation n'est introduite.

Le nom de l'entreprise et le message d'accueil sont du **texte littéral et fixe** (défini
mot pour mot dans le ticket) : ils sont ajoutés comme deux petits éléments statiques dans
`index.html`, à l'intérieur du `<div id="title">` existant (qui définit déjà la zone/
position flottante du titre), stylés par `branding-acme.css`. Pas de JS de rendu de texte.

**Décision explicite : pas de JavaScript.** Une alternative envisagée était un objet de
config JS (`window.ACME_BRANDING = {...}`) + un petit script appliquant les valeurs au
DOM. Elle a été écartée : elle ajoute un fichier, un script, et un point de défaillance
(nécessiterait un try/catch pour ne pas bloquer `#start` si le script échoue) pour un
bénéfice non demandé (réutilisabilité multi-événements). La CSS seule couvre déjà le
besoin, est plus petite, et gère nativement le cas "logo introuvable" (une
`background-image` cassée reste silencieuse, le reste de la page continue de
fonctionner) — pas besoin de garde-fou supplémentaire.

## Fichiers et modules impactés

- **Nouveau** : `css/branding-acme.css` (variables de couleurs + logo, règles de
  surcharge, styles du bloc titre/sous-titre).
- **Modifié** : `index.html`
  - Ajout d'un `<link rel="stylesheet" href="css/branding-acme.css">` après les deux
    liens CSS existants.
  - Ajout de deux éléments statiques à l'intérieur de `<div id="title">` (titre +
    sous-titre du message d'accueil).
- **Non modifiés** : `css/multi.css`, `css/fonts.css`, `launch.coffee`/`launch.js`,
  tout `bkcore/**`, `bkcore.coffee/**`, pistes, HUD, tests QUnit.

## Structure des données de branding

Tout tient dans le bloc `:root` en tête de `css/branding-acme.css` (seul endroit à
éditer pour rebrander) :

```css
:root {
  --acme-bg: #08090D;
  --acme-accent-violet: #7628FF;
  --acme-accent-blue: #315BFF;
  --acme-accent-cyan: #00C4E8;
  --acme-text: #FFFFFF;
  --acme-text-muted: #E6E8EE;
  --acme-logo: url('../formation/identite/logo.png');
}
```

Le texte du message d'accueil ("Bienvenue au ACME Racing Challenge" + sous-texte) reste
en HTML littéral dans `index.html` (contenu, pas configuration de style), regroupé en un
seul endroit clairement identifiable (à l'intérieur de `#title`) pour rester facile à
retrouver/modifier.

## Décisions techniques principales

1. Surcharge CSS pure, aucun nouveau sélecteur en conflit de spécificité avec
   `multi.css` — pas de `!important`.
2. Logo référencé à son emplacement d'origine (`formation/identite/logo.png`), pas
   copié dans `css/` — une seule source de vérité, évite la dette de duplication déjà
   relevée dans `docs/architecture.md`.
3. `background-size: auto 50%` conservé pour ne jamais déformer le logo.
4. Pas de nouvelle police web (contrainte de la charte) : `BebasNeueRegular` existante
   réutilisée pour le titre/sous-titre ACME.
5. Aucun fichier JS ajouté ni modifié : zéro risque sur l'ordre de chargement des
   scripts globaux (`bkcore`, `THREE`) dont dépend tout le moteur.

## Risques et compatibilité

- **Risque faible** : variables CSS (`var()`) nécessitent un navigateur récent — déjà
  supposé puisque le jeu requiert WebGL (vérifié par `launch.coffee`), donc aucun
  navigateur cible ne poserait problème.
- **Risque faible** : positionnement du nouveau bloc titre/sous-titre à l'intérieur de
  `#title` (zone `top:5%; bottom:5%` déjà flottante) — à valider visuellement pour
  éviter un chevauchement avec le logo ou le menu ; ajustable uniquement via
  `branding-acme.css` (pas de changement structurel si retouche nécessaire).
- **Aucun risque gameplay** : confirmé qu'aucun code JS ne lit les styles ou textes de
  `#title`/`#menu`/`#global`, à l'exception du remplacement conditionnel du texte de
  `#start` en cas d'absence de WebGL (non affecté par ce changement).
- **Réversibilité** : supprimer le `<link>` + le fichier `branding-acme.css` + les deux
  éléments HTML ajoutés restaure l'état exact d'avant, sans toucher `multi.css`.

## Stratégie de tests et de vérification

Après **chaque** étape ci-dessous (aucun commit avant validation finale) :

1. Servir le dossier en local avec `python -m http.server` (Python 3, exécuté depuis
   la racine `HexGL`) — ou `php -S localhost:8000` si Python indisponible — puis ouvrir
   `index.html` dans Chrome.
2. Vérifier l'absence d'erreurs console (404 sur le logo, CSS invalide).
3. Comparer visuellement l'écran titre à `formation/tests/captures/01-ecran-accueil.jpg`
   (pour les étapes qui ne doivent rien changer visuellement) et à l'intention de la
   charte (page 4 du PDF) pour les étapes qui appliquent le branding.
4. Cliquer sur "Start" et dérouler une partie complète (aide contrôle → chargement →
   course → fin) pour confirmer l'absence de régression gameplay/HUD, en comparant à
   `formation/tests/captures/02-jeu-en-cours.jpg`.
5. Relancer la suite QUnit existante : `formation/tests/ci-chrome.bat` (Windows) —
   attendre un code retour `0`.
6. En fin d'implémentation, revérifier un par un les critères d'acceptation de
   `work/company-event/spec.md`.

## Plan d'implémentation (étapes)

1. **Créer `css/branding-acme.css` (squelette neutre) et le lier dans `index.html`.**
   Déclarer le bloc `:root` avec les variables ACME, mais faire pointer les règles de
   surcharge vers les **couleurs actuelles** (`#4190bb`, `#f66439`, etc.) comme valeurs
   de repli le temps de valider le câblage.
   *Vérification* : la page reste pixel-identique à `01-ecran-accueil.jpg` ; aucune
   erreur console ; `ci-chrome.bat` toujours vert.

2. **Basculer les variables sur la palette ACME** (fond `--acme-bg`, accents violet/
   bleu/cyan sur `#menu`, `#start`, `#start:hover`).
   *Vérification* : fond sombre, accents ACME visibles, bouton Start toujours cliquable
   et lisible ; comparaison avec l'intention de la charte (page 4 du PDF).

3. **Basculer le logo** : remplacer `background-image` de `#title` par
   `var(--acme-logo)` pointant vers `formation/identite/logo.png`.
   *Vérification* : logo ACME visible, non déformé, zone de respiration correcte ;
   si le fichier est temporairement renommé pour tester le cas limite, la page et le
   bouton Start restent fonctionnels.

4. **Ajouter le message d'accueil** : deux éléments statiques dans `#title`
   ("Bienvenue au ACME Racing Challenge" + sous-texte), stylés dans
   `branding-acme.css` (taille, couleur `--acme-text`/`--acme-text-muted`, position).
   *Vérification* : texte lisible, bien positionné sous le logo, n'empiète pas sur le
   menu ; partie complète rejouée pour confirmer le gameplay inchangé.

5. **Passe finale** : revue des 6 critères d'acceptation de la spec un par un,
   dernière exécution de `ci-chrome.bat`/`.sh`, nettoyage visuel si besoin (pas de
   nouveau fichier). Le commit est laissé à l'utilisateur après validation.
