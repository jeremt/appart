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

// Coloris unis du canapé OMHU Teddy (velours côtelé) : teinte relevée sur les photos produit,
// `id` = variante Shopify (arceaux chromés) pour le lien « Voir le produit ».
const TEDDY_URL = 'https://omhucph.com/en-fr/products/teddy?variant=';
const teddyColors = [
    {code: '5769', name: 'Cream white', color: 0xf2e5de, id: 41248910082157},
    {code: '5768', name: 'Sand', color: 0xc6b3a3, id: 41248910114925},
    {code: '5779', name: 'Yellow', color: 0xf7c755, id: 41248910377069},
    {code: '5774', name: 'Mustard', color: 0xd08a16, id: 41248910409837},
    {code: '5780', name: 'Tangerine', color: 0xfca429, id: 41248910442605},
    {code: '5781', name: 'Orange', color: 0xcd6e2e, id: 41248910475373},
    {code: '5782', name: 'Rust', color: 0xa0503a, id: 41248910508141},
    {code: '5764', name: 'Rose', color: 0xcb9294, id: 41248910540909},
    {code: '5784', name: 'Blush', color: 0xe6bba9, id: 41248910639213},
    {code: '5763', name: 'Lavender', color: 0xcba7a3, id: 41248952942701},
    {code: '5793', name: 'Purple', color: 0xc6a1a7, id: 41248910606445},
    {code: '5772', name: 'Blue', color: 0x3c6691, id: 41248910180461},
    {code: '5770', name: 'Slate', color: 0xc1c0bb, id: 41248910671981},
    {code: '5771', name: 'Turquoise', color: 0x94cbcd, id: 41248910213229},
    {code: '5773', name: 'Emerald', color: 0x465040, id: 41248910245997},
    {code: '5776', name: 'Sage', color: 0x98a68f, id: 41248910278765},
    {code: '5778', name: 'Olive', color: 0xada976, id: 41248910344301},
    {code: '5777', name: 'Moss', color: 0x797859, id: 41248910311533},
    {code: '5765', name: 'Brown', color: 0x58463e, id: 41248910147693},
    {code: '5761', name: 'Charcoal', color: 0x959a9d, id: 41248910704749},
    {code: '5786', name: 'Black', color: 0x3b3b3b, id: 41248910737517},
    {code: 'C004', name: 'Candyfloss', color: 0xffdeff, id: 58193113809280},
    {code: 'C003', name: 'Pickle', color: 0x489e6b, id: 58193167679872},
    {code: 'C005', name: 'Hot pink', color: 0xe55697, id: 58193145332096},
    {code: 'C002', name: 'Slushie Blue', color: 0x048edc, id: 58193042145664},
].map((v) => ({...v, url: TEDDY_URL + v.id}));

// Équipements et meubles, relevés sur le plan et les photos.
// `r` = emprise [x1, y1, x2, y2], `rot` = orientation de la face avant
// (0 : vers le bas du plan, 90 : vers la droite, -90 : vers la gauche, 180 : vers le haut).
// `c` + `size` = centre + [largeur, profondeur] locales.
// `variants` = coloris au choix ({code, name, color, url}), `variant` = code par défaut.
export const furnitureDefs = [
    // Bain + WC
    {id: 'baignoire', type: 'bathtub', name: 'Baignoire', r: [42, BATH_TOP, 212, 101], rot: 0},
    {id: 'meuble-vasque', type: 'vanityWasher', name: 'Meuble vasque + lave-linge', r: [0, 104, 52, 226], rot: 90},
    {id: 'wc', type: 'toilet', name: 'WC', r: [56, 257, 121, 296], rot: 90},
    {id: 'colonne-sdb', type: 'bathColumn', name: 'Colonne de rangement', r: [180, 256, 215, 296], rot: -90},
    // Cuisine
    {id: 'evier', type: 'sink', name: 'Évier', r: [0, SPLIT_Y + INT, 63, 402], rot: 90},
    {id: 'plan-travail', type: 'counter', name: 'Plan de travail + micro-ondes encastré', r: [0, 402, 63, 464], rot: 90},
    {id: 'plaques', type: 'cooker', name: 'Plaques 2 feux + frigo top 85 x 55 x 58', r: [0, 464, 63, 523], rot: 90},
    {id: 'grille-cuisine', type: 'kitchenGrid', name: 'Grille murale ustensiles, poêle + wok de Buyer Carbone Plus 35 cm (5114.35)', r: [80, SPLIT_Y + INT, 150, SPLIT_Y + INT + 20], rot: 0},
    {id: 'bar', type: 'plywoodBar', name: 'Bar en contreplaqué + congélateur top Thomson THTTFZ5WH + casseroles', r: [151, SPLIT_Y + INT, 215, SPLIT_Y + INT + 145], rot: 90, url: 'https://www.darty.com/nav/achat/gros_electromenager/congelateur-armoire/congelateur_sous_plan/thomson_thttfz5wh.html'},
    // au mur au-dessus du plan de travail
    {id: 'barre-couteaux', type: 'knifeBar', name: 'Barre aimantée à couteaux', r: [0, 413, 4, 453], rot: 90, elev: 100},
    // Séjour
    {id: 'canape', type: 'teddy', name: 'Canapé OMHU Teddy', r: [325, SPLIT_Y + INT, 525, SPLIT_Y + INT + 100], rot: 0, variants: teddyColors, variant: '5782'},
    // lampadaire arc à droite du canapé, arc orienté vers la table basse
    {id: 'lampadaire', type: 'arcLamp', name: 'Lampadaire arc', c: [555, 345], size: [36, 36], rot: -45},
    {id: 'etageres-canape', type: 'sofaShelves', name: 'Étagères au-dessus du canapé', r: [330, SPLIT_Y + INT, 510, SPLIT_Y + INT + 22], rot: 0},
    {id: 'tapis', type: 'rug', name: 'Tapis laine 200 x 140', r: [320, 395, 520, 535], rot: 0},
    {id: 'table-basse', type: 'matikaTable', name: 'Table basse rehaussable Matika L120', r: [360, 435, 480, 515], rot: 0, url: 'https://www.maisonsdumonde.com/FR/fr/p/table-basse-rehaussable-en-bois-et-acier-noir-l120-matika-M22179481.htm'},
    {id: 'meuble-tv', type: 'tvUnit65', name: 'Meuble TV + TCL 65" (65P89L)', r: [350, 588, 530, 628], rot: 180},
    {id: 'colonne-salon', type: 'storageColumn', name: 'Colonne de rangement', r: [295, 593, 330, 628], rot: 180},
    {id: 'monstera', type: 'monstera', name: 'Monstera', r: [550, 559, 600, 609], rot: 0},
    {id: 'onewheel', type: 'onewheelStand', name: 'Onewheel sur support', r: [182, 598, 222, 628], rot: 180},
    // étagères au-dessus du Onewheel (dessus à 100 et 150 cm), entre l'étagère en grès et la gaine
    {id: 'etageres-electromenager', type: 'applianceShelves', name: 'Étagères électroménager', r: [181, 578, 227, 628], rot: 180},
    {id: 'airfryer', type: 'ninjaDoubleStack', name: 'Friteuse sans huile Ninja Double Stack XL (SL400EU)', c: [204, 604.5], size: [28, 47], rot: 180, elev: 100, url: 'https://www.darty.com/nav/achat/petit_electromenager/cuisson_quotidienne/friteuse/ninja_sl400eu.html'},
    {id: 'rice-cooker', type: 'riceCooker', name: 'Rice cooker', c: [204, 610], size: [26, 34], rot: 180, elev: 150},
    {id: 'etagere-gres', type: 'stonewareShelf', name: 'Étagère vaisselle en grès', r: [90, 606, 180, 628], rot: 180},
    {id: 'meuble-chaussures', type: 'shoeRack', name: 'Meuble à chaussures', r: [95, 598, 175, 628], rot: 180},
    // derrière la porte d'entrée, à droite du meuble à chaussures
    {id: 'porte-manteau', type: 'coatRack', name: 'Porte-manteau mural', r: [15, 613, 85, 628], rot: 180},
    {id: 'sac-chaussons', type: 'slipperBag', name: 'Sac à chaussons', r: [62, 610, 92, 628], rot: 180},
    // Chambre
    {id: 'lit', type: 'bed', name: 'Lit 160 x 200', r: [407, 2, 612, 164], rot: -90},
    {id: 'armoire', type: 'wardrobeGrid', name: 'Armoire', r: [BATH_X + INT, 30, 285, 140], rot: 90},
    {id: 'bureau', type: 'standingDesk', name: 'Bureau assis-debout 160 x 60', r: [370, SPLIT_Y - 60, 530, SPLIT_Y], rot: 180},
    // panneaux perforés au-dessus du bureau (bas à 128 cm)
    {id: 'skadis-1', type: 'skadisCamera', name: 'Panneau perforé IKEA SKÅDIS 76x56 (505.343.78) + Sony α6500', r: [374, SPLIT_Y - 20, 450, SPLIT_Y], rot: 180, elev: 128, url: 'https://www.ikea.com/fr/fr/p/skadis-panneau-perfore-noir-50534378/'},
    {id: 'skadis-2', type: 'skadisDrone', name: 'Panneau perforé IKEA SKÅDIS 76x56 (505.343.78) + DJI Mavic Air', r: [454, SPLIT_Y - 20, 530, SPLIT_Y], rot: 180, elev: 128, url: 'https://www.ikea.com/fr/fr/p/skadis-panneau-perfore-noir-50534378/'},
    // posés sur le bureau (plateau à 74 cm)
    {id: 'ecran', type: 'monitorArm', name: 'Écran 27" sur bras', r: [419, SPLIT_Y - 25, 481, SPLIT_Y - 5], rot: 180, elev: 74},
    {id: 'macbook', type: 'macbookPro', name: 'MacBook Pro 14"', c: [501, 272], size: [31.3, 22.1], rot: -165, elev: 74},
    {id: 'tabourets', type: 'kyrreStack', name: 'Tabourets IKEA KYRRE ×4 (604.169.25)', c: [330, 279], size: [42, 48], rot: 0, url: 'https://www.ikea.com/fr/fr/p/kyrre-tabouret-bouleau-60416925/'},
    {id: 'chevet', type: 'nightstand', name: 'Chevet', r: [290, 2, 326, 40], rot: 90},
    // Balcon
    {id: 'guirlande', type: 'stringLights', name: 'Guirlande guinguette', r: [771, 132, 777, 612], rot: 90},
    {id: 'olivier', type: 'oliveTree', name: 'Olivier en pot', c: [752, 590], size: [50, 50], rot: 0},
    {id: 'jardiniere-1', type: 'railPlanter', name: 'Jardinière de lavande', r: [758, 190, 778, 260], rot: -90, elev: 70},
    {id: 'jardiniere-2', type: 'railPlanter', name: 'Jardinière de lavande', r: [758, 300, 778, 370], rot: -90, elev: 70},
    {id: 'etagere-aromatiques', type: 'herbShelf', name: 'Étagère d\'aromatiques', r: [722, 130, 778, 165], rot: 0},
    {id: 'table-bistrot', type: 'bistroTableRound', name: 'Table bistrot', c: [695, 520], size: [60, 60], rot: 0},
    {id: 'chaise-bistrot-1', type: 'bistroChair', name: 'Chaise bistrot', c: [695, 470], size: [42, 46], rot: 0},
    {id: 'chaise-bistrot-2', type: 'bistroChair', name: 'Chaise bistrot', c: [695, 572], size: [42, 46], rot: 180},
];
