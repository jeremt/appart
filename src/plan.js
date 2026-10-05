import * as THREE from 'three';

// Plan « Clos Bérénice » — bâtiment B, appartement 28 (T2, 1er étage).
// Toutes les cotes sont en centimètres, plan remis à l'endroit (titre lisible) :
// origine = coin intérieur haut-gauche de la chambre, x vers la droite (vers le balcon), y vers le bas.
// Cotes du plan : 612 (largeur intérieure, entrée -> façade balcon) et 628 (profondeur intérieure).
// Le reste est relevé à l'échelle sur le plan (~1,5 px/cm) puis recalé sur ces deux cotes.

export const H_WALL = 250; // hauteur sous plafond
export const EXT = 20; // épaisseur des murs extérieurs
export const INT = 10; // épaisseur des cloisons
export const IW = 612;
export const IH = 628;

// Conversion plan (cm) -> monde three.js (m), appartement centré sur l'origine.
export const OX = IW / 200;
export const OZ = IH / 200;
export const toWorld = (x, y, h = 0) => new THREE.Vector3(x / 100 - OX, h / 100, y / 100 - OZ);
export const toPlan = (wx, wz) => ({x: (wx + OX) * 100, y: (wz + OZ) * 100});

// Repères (cm)
const BATH_X = 215; // cloison salle de bain | chambre : x 215 -> 225
const SPLIT_Y = 309; // cloison séjour | chambre et salle de bain | cuisine : y 309 -> 319
const BATH_TOP = 32; // le mur extérieur de la salle de bain est en retrait de 32 cm sur la chambre
const STEP_X = 195; // décroché du mur extérieur

// Murs : rectangles dans le plan. `out` = face extérieure (index de face BoxGeometry : +x, -x, +y, -y, +z, -z).
export const walls = [
    {x1: STEP_X, y1: -EXT, x2: IW, y2: 0, out: 5}, // nord, chambre
    {x1: STEP_X, y1: 0, x2: BATH_X, y2: BATH_TOP - EXT, out: 1}, // décroché
    {x1: -EXT, y1: BATH_TOP - EXT, x2: BATH_X, y2: BATH_TOP, out: 5}, // nord, salle de bain
    {x1: -EXT, y1: BATH_TOP, x2: 0, y2: IH, out: 1}, // ouest (palier, porte d'entrée)
    {x1: -EXT, y1: IH, x2: IW + EXT, y2: IH + EXT, out: 4}, // sud
    {x1: IW, y1: -EXT, x2: IW + EXT, y2: IH, out: 0}, // est, façade balcon
    {x1: BATH_X, y1: 0, x2: BATH_X + INT, y2: SPLIT_Y + INT}, // salle de bain | chambre
    {x1: 0, y1: SPLIT_Y, x2: BATH_X, y2: SPLIT_Y + INT}, // salle de bain | cuisine
    {x1: BATH_X + INT, y1: SPLIT_Y, x2: IW, y2: SPLIT_Y + INT}, // chambre | séjour
    {x1: 0, y1: BATH_TOP, x2: 35, y2: 94}, // gaine technique (angle baignoire)
    {x1: 0, y1: 228, x2: 56, y2: SPLIT_Y}, // placard + gaine (GCH / PL)
    {x1: 228, y1: 602, x2: 294, y2: IH}, // gaine technique logement (tableau électrique)
];

// Ouvertures. Les portes ont `leaves` (charnière côté 'start' ou 'end' de l'ouverture)
// et `swing` (+1 / -1 : sens d'ouverture le long de l'axe perpendiculaire au mur).
export const openings = [
    {id: 'entree', kind: 'door', name: "Porte d'entrée", x1: -EXT, y1: 536, x2: 0, y2: 616, top: 215, leaves: ['end'], swing: 1, open: false, exterior: true},
    {id: 'pf-sejour', kind: 'door', name: 'Porte-fenêtre séjour', x1: IW, y1: 328, x2: IW + EXT, y2: 419, top: 215, leaves: ['start'], swing: -1, open: false, style: 'glass'},
    {id: 'fixe-sejour', kind: 'window', x1: IW, y1: 419, x2: IW + EXT, y2: 581, bottom: 0, top: 215},
    {id: 'pf-chambre', kind: 'door', name: 'Porte-fenêtre chambre', x1: IW, y1: 156, x2: IW + EXT, y2: 243, top: 215, leaves: ['end'], swing: -1, open: false, style: 'glass'},
    {id: 'p-chambre', kind: 'door', name: 'Porte chambre', x1: BATH_X + INT, y1: SPLIT_Y, x2: 307, y2: SPLIT_Y + INT, top: 205, leaves: ['start'], swing: -1, open: true},
    {id: 'p-sdb', kind: 'door', name: 'Porte salle de bain', x1: BATH_X, y1: 143, x2: BATH_X + INT, y2: 224, top: 205, leaves: ['start'], swing: 1, open: true, style: 'frosted'},
];

// Pièces : `area` = surface indiquée sur le plan.
export const rooms = [
    {name: 'Séjour + Cuisine', rects: [[0, SPLIT_Y + INT, IW, IH]], floor: 'tileLight', area: 18.6, label: [400, 470]},
    {name: 'Chambre', rects: [[BATH_X + INT, 0, IW, SPLIT_Y], [BATH_X + INT, SPLIT_Y, 307, SPLIT_Y + INT]], floor: 'tileDark', area: 12.0},
    {name: 'Bain + WC', rects: [[0, BATH_TOP, BATH_X, SPLIT_Y], [BATH_X, 143, BATH_X + INT, 224]], floor: 'tileDark', area: 5.85, label: [130, 185], small: true},
    {name: 'Balcon', rects: [], floor: 'deck', area: 7.0, label: [708, 380], small: true},
];

// Dalle sous l'appartement (emprise extérieure, avec le décroché).
export const footprint = [
    [STEP_X, -EXT, IW + EXT, IH + EXT],
    [-EXT, BATH_TOP - EXT, STEP_X, IH + EXT],
];

// Extérieur : balcon (côté façade) et palier (devant la porte d'entrée).
export const balcony = {x1: IW + EXT, y1: 124, x2: IW + EXT + 152, y2: 623};
export const landing = {x1: -260, y1: 420, x2: -EXT, y2: 720};

// Zones où l'on peut marcher en visite (les murs gèrent le reste).
export const walkable = [
    [-EXT, -EXT, IW + EXT, IH + EXT],
    [IW, balcony.y1 + 25, balcony.x2 - 25, balcony.y2 - 25],
    [landing.x1 + 20, landing.y1 + 20, 0, landing.y2 - 20],
];

export const spawn = {x: -150, y: 576};

// Lignes de cote affichées en vue plan : [x1, y1, x2, y2] (horizontales ou verticales).
export const dimensions = [
    [0, -55, IW, -55], // 612
    [-60, 0, -60, IH], // 628
    [BATH_X + INT, 28, IW, 28],
    [585, 0, 585, SPLIT_Y],
    [0, 600, IW, 600],
    [560, SPLIT_Y + INT, 560, IH],
    [0, 110, BATH_X, 110],
    [190, BATH_TOP, 190, SPLIT_Y],
    [balcony.x1, balcony.y2 + 35, balcony.x2, balcony.y2 + 35],
    [balcony.x2 + 35, balcony.y1, balcony.x2 + 35, balcony.y2],
];

// Faïence murale autour de la baignoire : [x1, y1, x2, y2, h0, h1] (plaques de 1 cm).
export const wallTiles = [
    [35, BATH_TOP, BATH_X, BATH_TOP + 1, 0, 210],
    [BATH_X - 1, BATH_TOP + 1, BATH_X, 101, 0, 210],
    [35, BATH_TOP + 1, 36, 94, 0, 210],
];

// Équipements et meubles, relevés sur le plan et les photos.
// `r` = emprise [x1, y1, x2, y2], `rot` = orientation de la face avant
// (0 : vers le bas du plan, 90 : vers la droite, -90 : vers la gauche, 180 : vers le haut).
// `c` + `size` = centre + [largeur, profondeur] locales.
export const furnitureDefs = [
    // Bain + WC
    {id: 'baignoire', type: 'bathtub', name: 'Baignoire', r: [42, BATH_TOP, 212, 101], rot: 0},
    {id: 'meuble-vasque', type: 'vanityWasher', name: 'Meuble vasque + lave-linge', r: [0, 104, 52, 226], rot: 90},
    {id: 'wc', type: 'toilet', name: 'WC', r: [56, 257, 121, 296], rot: 90},
    // Cuisine
    {id: 'evier', type: 'sink', name: 'Évier', r: [0, SPLIT_Y + INT, 63, 402], rot: 90},
    {id: 'plan-travail', type: 'counter', name: 'Plan de travail', r: [0, 402, 63, 464], rot: 90},
    {id: 'plaques', type: 'cooker', name: 'Plaques de cuisson', r: [0, 464, 63, 503], rot: 90},
    {id: 'bar', type: 'zelligeBar', name: 'Bar en zellige', r: [140, SPLIT_Y + INT, 190, SPLIT_Y + INT + 125], rot: 90},
    // Séjour
    {id: 'canape', type: 'teddy', name: 'Canapé OMHU Teddy', r: [400, SPLIT_Y + INT, 600, SPLIT_Y + INT + 100], rot: 0},
    {id: 'affiche', type: 'poster', name: 'Affiche', r: [415, SPLIT_Y + INT, 470, 322], rot: 0},
    {id: 'tapis', type: 'rug', name: 'Tapis laine 200 x 140', r: [400, 405, 600, 545], rot: 0},
    {id: 'table-basse', type: 'coffeeTable', name: 'Table basse', r: [448, 448, 553, 503], rot: 0},
    {id: 'meuble-tv', type: 'tvUnit65', name: 'Meuble TV + TCL 65" (65P89L)', r: [410, 588, 590, 628], rot: 180},
    {id: 'plante-haute', type: 'plantTall', name: 'Dracaena', r: [305, 582, 350, 627], rot: 0},
    {id: 'monstera', type: 'monstera', name: 'Monstera', r: [355, 540, 405, 590], rot: 0},
    {id: 'onewheel', type: 'onewheelStand', name: 'Onewheel sur support', r: [182, 598, 222, 628], rot: 180},
    {id: 'meuble-chaussures', type: 'shoeRack', name: 'Meuble à chaussures', r: [95, 598, 175, 628], rot: 180},
    // Chambre
    {id: 'lit', type: 'bed', name: 'Lit 160 x 200', r: [330, 2, 535, 164], rot: 90},
    {id: 'armoire', type: 'wardrobeGrid', name: 'Armoire', r: [BATH_X + INT, 30, 285, 140], rot: 90},
    {id: 'bureau', type: 'standingDesk', name: 'Bureau assis-debout 160 x 70', r: [320, SPLIT_Y - 70, 480, SPLIT_Y], rot: 180},
    // posés sur le bureau (plateau à 74 cm)
    {id: 'ecran', type: 'monitor27', name: 'Écran 27"', r: [369, SPLIT_Y - 22, 431, SPLIT_Y - 2], rot: 180, elev: 74},
    {id: 'macbook', type: 'macbookPro', name: 'MacBook Pro 14"', r: [438, SPLIT_Y - 60, 469.3, SPLIT_Y - 37.9], rot: 180, elev: 74},
    {id: 'chevet', type: 'nightstand', name: 'Chevet', r: [290, 2, 326, 40], rot: 90},
    // Balcon
    {id: 'table-balcon', type: 'bistroTable', name: 'Table de balcon', c: [735, 545], size: [70, 70], rot: 0},
    {id: 'chaise-balcon', type: 'chairScandi', name: 'Chaise', c: [680, 540], size: [46, 50], rot: 90},
];
