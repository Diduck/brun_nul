# MaBoîte : le bouton « Envoyer » qui s'enfuit

Petite page web humoristique : une fausse boîte mail avec un message de démission prêt à partir. Problème : le bouton **Envoyer** fuit le curseur, se moque de l'utilisateur et refuse d'être cliqué.

Aucune dépendance, aucun build : du HTML, du CSS et du JavaScript natifs.

---

## Sommaire

1. [Démarrage rapide](#démarrage-rapide)
2. [Structure du projet](#structure-du-projet)
3. [`index.html`](#indexhtml)
4. [`style.css`](#stylecss)
5. [`script.js`](#scriptjs)
6. [Personnalisation](#personnalisation)
7. [Limites connues](#limites-connues)

---

## Démarrage rapide

1. Placer les trois fichiers dans le même dossier.
2. Vérifier que la feuille de style s'appelle bien **`style.css`** (le fichier fourni s'appelait `style (1).css` et doit être renommé, car `index.html` charge `style.css`).
3. Ouvrir `index.html` dans un navigateur.

```text
projet/
├── index.html
├── style.css
└── script.js
```

---

## Structure du projet

| Fichier      | Rôle                                                                 |
|--------------|----------------------------------------------------------------------|
| `index.html` | Structure de la page : barre du haut, menu, liste de mails, fenêtre de rédaction |
| `style.css`  | Apparence façon webmail, fenêtre de rédaction fixée en bas à droite  |
| `script.js`  | Moteur physique qui fait fuir le bouton et affiche les moqueries      |

---

## `index.html`

La page est découpée en quatre zones :

| Zone                 | Élément / classe          | Description |
|----------------------|---------------------------|-------------|
| Barre du haut        | `header.topbar`           | Logo « MaBoîte », champ de recherche (désactivé), avatar |
| Menu latéral         | `aside.sidebar`           | Bouton « Nouveau message » (désactivé) et dossiers (Réception, Suivis, Envoyés, Brouillons, Corbeille) |
| Liste des messages   | `main.inbox`              | Quatre faux mails (Boss, RH, Compta) pour l'ambiance |
| Fenêtre de rédaction | `section.compose#compose` | Le message de démission à envoyer |

### La fenêtre de rédaction

- Les champs **À** (`boss@gmail.com`) et **Objet** (« Ma démission ») ainsi que le corps du message sont en lecture seule (`readonly`) : le message est déjà écrit.
- Le pied de fenêtre contient les deux éléments pilotés par le script :

| Id        | Élément  | Utilité |
|-----------|----------|---------|
| `sendBtn` | `button` | Le bouton qui s'enfuit |
| `hint`    | `span`   | Zone de texte où s'affichent les moqueries |

---

## `style.css`

Le fichier est organisé en sections commentées.

### Base

- `box-sizing: border-box` partout, marges remises à zéro.
- Le `body` occupe toute la hauteur de la fenêtre (`100vh`) avec `overflow: hidden` : **la page ne défile pas**, ce qui garantit que le bouton reste toujours dans l'écran.

### Mise en page

- `.layout` est un flex horizontal de hauteur `calc(100vh - 57px)` (57 px correspondant à la barre du haut).
- `.sidebar` fait 240 px de large ; l'entrée active est mise en évidence par `.active`.
- `.inbox` est un bloc blanc aux coins arrondis.

### Fenêtre de rédaction

- `.compose` est en `position: fixed`, ancrée en bas à droite (`right: 40px; bottom: 0`), 520 px de large au maximum.
- Le `textarea` fait 300 px de haut, sans redimensionnement.

### Le bouton `.send-btn`

Trois propriétés sont importantes pour l'effet :

| Propriété              | Raison |
|------------------------|--------|
| `position: relative`   | Nécessaire pour que `z-index` s'applique |
| `z-index: 1000`        | Le bouton passe **au-dessus** de tout le reste quand il s'enfuit |
| `will-change: transform` | Indique au navigateur que le bouton est animé en continu (animation plus fluide) |

### Responsive

Sous 700 px de large, le menu latéral est masqué et la liste de mails prend toute la largeur.

---

## `script.js`

### Principe

Le bouton est simulé comme un objet physique. À chaque image (`requestAnimationFrame`), la fonction `tick()` :

1. calcule la distance entre le curseur et le bord le plus proche du bouton ;
2. s'il est trop proche, **repousse** le bouton (force d'autant plus forte que le curseur est proche) ;
3. sinon, **ramène doucement** le bouton vers sa position d'origine (effet ressort) ;
4. applique les frottements et déplace le bouton ;
5. gère les **rebonds** sur les bords de l'écran ;
6. si le bouton est coincé contre un mur, le fait **glisser le long du mur** pour qu'il ne reste jamais piégé ;
7. applique la transformation CSS (translation + légère rotation).

Le déplacement passe uniquement par `transform`, donc la mise en page n'est jamais recalculée.

### Paramètres

| Constante  | Valeur | Effet |
|------------|--------|-------|
| `RADIUS`   | `160`  | Distance (px) à partir de laquelle le bouton a « peur » du curseur |
| `PUSH`     | `6`    | Force de répulsion |
| `FRICTION` | `0.86` | Amortissement de la vitesse (plus proche de 1 = plus glissant) |
| `SPRING`   | `0.004`| Force de rappel vers la position d'origine quand le curseur s'éloigne |
| `MARGIN`   | `10`   | Marge (px) entre le bouton et les bords de l'écran |
| `BOOST`    | `9`    | Accélération le long d'un mur quand le bouton est coincé |

### État interne

| Variable        | Signification |
|-----------------|---------------|
| `home`          | Rectangle d'origine du bouton (position au chargement) |
| `ox`, `oy`      | Décalage actuel par rapport à `home` |
| `vx`, `vy`      | Vitesse actuelle |
| `mx`, `my`      | Position du pointeur (`-9999` quand il est hors de la page) |
| `wasScared`     | `true` si le bouton fuyait à l'image précédente |
| `escapes`       | Nombre de fois où le bouton a pris peur |

### Fonctions

| Fonction | Rôle |
|----------|------|
| `taunt(text?)` | Affiche `text` dans `#hint`, ou une moquerie aléatoire de la liste `taunts` |
| `slideDir(btnPos, mousePos, screenSize)` | Donne le sens de fuite (`-1` ou `1`) sur un axe : à l'opposé du pointeur, ou vers le centre de l'écran si le pointeur est pile en face |
| `dash()` | Grosse impulsion (±40) pour s'éloigner, utilisée lors d'un clic ou d'un focus clavier |
| `tick()` | Boucle d'animation principale (voir ci-dessus) |

### Moqueries

Une moquerie aléatoire est affichée **une fois sur trois** où le bouton prend peur (`++escapes % 3 === 0`), uniquement au moment où il passe de « calme » à « effrayé », pour ne pas changer le texte à chaque image.

### Événements gérés

| Entrée | Écouteur | Comportement |
|--------|----------|--------------|
| Souris | `mousemove`, `mouseleave` | Met à jour la position du pointeur ; hors de la page, il est renvoyé très loin |
| Tactile | `touchstart`, `touchmove`, `touchend` | Le doigt joue le rôle du curseur |
| Clavier | `focus` sur le bouton | Le bouton perd aussitôt le focus (`blur()`), s'enfuit (`dash()`) et affiche « Le clavier ? Bien essayé » |
| Clic | `click` | `preventDefault()`, nouvelle impulsion et message « Presque ! Mais non. » |
| Redimensionnement | `resize` | Recalcule la position d'origine (`home`) en retirant le décalage courant |

---

## Personnalisation

- **Changer le message** : modifier le contenu du `textarea` et les champs dans `index.html`.
- **Changer le ton** : éditer le tableau `taunts` dans `script.js`.
- **Bouton plus facile à attraper** : réduire `RADIUS` ou `PUSH`, ou augmenter `FRICTION`.
- **Bouton plus nerveux** : augmenter `PUSH` et `BOOST`, ou baisser `FRICTION`.
- **Couleurs** : la teinte principale `#3b5bdb` est utilisée pour le logo, l'avatar et le bouton ; la teinte claire `#d3e0ff` pour les éléments actifs.

---

## Limites connues

- C'est une **blague** : rien n'est réellement envoyé, il n'y a aucun serveur.
- **Accessibilité** : le bouton est volontairement inutilisable au clavier et au tactile pour les besoins de la blague. À ne pas réutiliser tel quel dans un vrai formulaire.
- Les textes sont en français (`lang="fr"`) et les chaînes sont écrites directement dans les fichiers, sans système de traduction.
- `position: fixed` + `overflow: hidden` : sur de très petits écrans, la fenêtre de rédaction peut occuper presque tout l'espace.
