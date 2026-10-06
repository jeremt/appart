---
name: add-furniture
description: Ajoute un nouveau meuble ou objet 3D dans l'appartement (Appart 3D) à partir d'une description, d'un lien de fiche produit ou d'une capture d'écran — recherche le produit et ses dimensions réelles, crée le builder three.js, le place dans le plan et renseigne le lien d'achat. Utiliser dès que l'utilisateur demande d'ajouter, remplacer ou modéliser un meuble, un objet ou une déco dans le projet.
---

# Ajouter un meuble à Appart 3D

L'objectif : un objet **aux dimensions réelles du produit**, fidèle visuellement, bien placé dans
l'appartement, et — quand le produit s'achète — avec **son lien d'achat visible dans l'app**
(bouton « Voir le produit ↗ » du panneau de sélection).

## 1. Identifier le produit

Selon ce que l'utilisateur fournit :

- **Lien de fiche produit** : ouvre-le (navigateur intégré de préférence : les sites marchands
  bloquent souvent les fetchs). Relève le nom exact, la référence, le prix, les **dimensions**
  (L × P × H, hauteur d'assise, diamètre…), les matériaux/couleurs, et regarde les photos.
  Sur les bannières cookies, choisis toujours l'option la plus restrictive (« Continuer sans
  accepter », « Refuser »).
- **Capture d'écran** : lis tout ce qui y figure (nom, marque, cotes). Si la marque/le modèle
  sont identifiables, **recherche toi-même la fiche produit** (WebSearch puis navigateur) pour
  récupérer les dimensions officielles et l'URL d'achat.
- **Description seule** (« un tabouret empilable ikea ») : **recherche le produit toi-même**
  sur le site du vendeur (pour IKEA : `https://www.ikea.com/fr/fr/search/?q=…`). Si le produit
  cité n'existe plus (ex. page qui redirige vers le catalogue), propose l'équivalent actuel et
  dis-le explicitement.
- Si l'utilisateur fournit lui-même des dimensions, **elles priment** sur la fiche.

Ne fabrique jamais une URL ni une référence : un lien n'est ajouté que s'il a été vérifié
(la page s'ouvre et correspond au produit).

## 2. Poser des questions quand c'est flou

Utilise `AskUserQuestion` **avant de coder** si un point change le résultat, notamment :

- plusieurs produits/variantes possibles (couleur, taille, finition) et rien ne permet de trancher ;
- l'emplacement n'est pas précisé ou plusieurs endroits sont plausibles (« à côté du bureau » :
  à gauche ou à droite ?) ;
- le meuble ne rentre pas à l'endroit demandé (mur, porte, autre meuble) ;
- il faut remplacer ou supprimer un meuble existant ;
- une cote demandée est ambiguë (« largeur » = longueur ou profondeur ?).

Pour les détails sans enjeu (petite déco, teinte exacte non visible), choisis une valeur
raisonnable et signale-la dans le compte-rendu.

## 3. Conventions du projet (à respecter strictement)

Fichiers : `src/plan.js` (données : murs, ouvertures, `furnitureDefs`), `src/furniture.js`
(constructeurs 3D et `BUILDERS`), `src/main.js` (app), `src/structure.js`, `src/render.js`.

### Unités et repère

- **Tout est en centimètres** dans `plan.js` et dans les builders (les helpers convertissent en m).
- Repère du plan : origine au coin intérieur haut-gauche de la chambre, **x vers la droite
  (balcon), y vers le bas**. Intérieur : x 0 → 612, y 0 → 628. Cloison séjour/chambre à
  y 309 → 319, salle de bain x 0 → 215, cuisine le long du mur x = 0, balcon x 632 → 784.
- Hauteur sous plafond : 250 cm.

### Déclaration dans `furnitureDefs` (`src/plan.js`)

```js
{
    id: 'mon-meuble',              // unique, kebab-case
    type: 'monBuilder',            // clé de BUILDERS
    name: 'Nom lisible (réf.)',    // affiché dans le panneau, inclure marque + référence
    r: [x1, y1, x2, y2],           // emprise au sol dans le plan (cm)
    // ou: c: [cx, cy], size: [largeur, profondeur]  (dimensions *locales*)
    rot: 0,                        // face avant : 0 → bas du plan (+y), 90 → droite (+x),
                                   //             -90 → gauche (-x), 180 → haut (-y)
    elev: 0,                       // optionnel : posé à cette hauteur (cm), ex. 74 sur le bureau
    url: 'https://…',              // OBLIGATOIRE si le produit s'achète et que le lien est vérifié
},
```

- Avec `r` et `rot` = ±90, largeur et profondeur locales sont échangées automatiquement.
- L'emprise (`r` ou `size`) doit correspondre **aux dimensions réelles du produit**.
- Placer l'entrée dans la section de la bonne pièce (commentaires `// Séjour`, `// Chambre`…).
- Modifier la position par défaut d'un meuble existant invalide automatiquement sa position
  sauvegardée dans le navigateur (champ `init`), c'est voulu.

### Builder (`src/furniture.js`)

- Signature `function monBuilder(w, d) { … return g; }` : `w`, `d` = dimensions locales en cm,
  origine **au centre de l'emprise, au sol**, **face avant vers +z**, dos vers -z (contre le mur).
- L'ajouter à `export const BUILDERS = { … }`.
- Helpers disponibles (tous en cm) :
  - `B(g, x1, x2, y1, y2, z1, z2, mat)` boîte ; `RB(...)` + rayon : boîte arrondie (textiles, coussins) ;
  - `Cyl(g, rTop, rBot, h, x, y, z, mat, alongZ)` cylindre centré ;
  - `rod(g, [x,y,z], [x,y,z], r, mat)` tube entre deux points ; `beam(g, p, q, a, b, mat)` tube carré ;
  - `prism(g, shape, y0, y1, mat)` extrusion verticale d'une `THREE.Shape` (en mètres) ;
  - `foliage(...)`, `herbPot(...)`, `books(...)`, `trailingPlant(...)`, `plywood()`, `stoneware(kind)`…
  - matériaux partagés : `MAT.oak`, `MAT.walnut`, `MAT.white`, `MAT.metal`, `MAT.matteBlack`,
    `MAT.glass`, `MAT.chrome` (avec `envMap`), etc. ; `std(color, opts)` pour un matériau ponctuel.
- **Construire avec des points explicites** (`rod`, `beam`) plutôt que des rotations « à l'œil » :
  c'est ce qui évite les pieds/montants cassés vus sous d'autres angles.
- Métal : passer `envMap: MAT.chrome.envMap`, sinon il apparaît noir.
- Lumières (lampes, LED) : `light.userData.nightOnly = true; light.visible = false;` et pour un
  émissif `material.userData.night = <intensité>` avec une petite valeur de jour (> 0) — le mode
  nuit les allume.
- Modèle 3D officiel : si le site fournit un `.glb` (ex. Shopify `cdn.shopify.com/3d/models/…`),
  le télécharger dans `public/models/`, le compresser
  (`npx @gltf-transform/cli resize … --width 1024` puis `webp`) et utiliser `gltfModel(url, w, d,
  {backNode, dress})` qui le met exactement aux dimensions. Prévenir l'utilisateur que le modèle
  appartient à la marque (le dépôt est public).

## 4. Placement

- Le meuble doit tenir **dans les murs** (`fits()` de `main.js`) et ne pas bloquer une porte
  (vérifier le débattement des vantaux dans `openings`), ni chevaucher un meuble existant sauf
  si c'est voulu (objets posés dessus via `elev`).
- Respecter les distances d'usage (passage ≥ 60 cm devant un meuble, place pour s'asseoir…).

## 5. Vérifier

1. `pnpm build` (lance aussi `pnpm check` : chaque type de `BUILDERS` doit être défini).
2. Lancer `pnpm dev` si besoin (port 5173 par défaut) et ouvrir l'app dans le navigateur intégré.
3. Contrôler sans erreur console, puis visuellement **sous plusieurs angles** (face, profil,
   dessus) avec le hook de dev :
   ```js
   const A = window.__appart;
   A.setMode('orbit');
   A.orbit.target.copy(A.toWorld(x, y, hauteurCible));
   A.persp.position.copy(A.toWorld(xCam, yCam, hCam));
   A.orbit.update();
   ```
   puis `A.items.filter(i => !A.fits(i, i.state)).map(i => i.def.id)` doit renvoyer `[]`.
4. Si le meuble a un lien : le sélectionner et vérifier que « Voir le produit ↗ » pointe bien
   vers la fiche.
5. En mode nuit (`N`) si l'objet éclaire.

## 6. Compte-rendu

Résumer en français : produit retenu (nom, référence, prix, lien), dimensions utilisées et leur
source, emplacement choisi, hypothèses prises, et ce qui n'a pas pu être vérifié.
Ne pas committer sauf demande explicite.
