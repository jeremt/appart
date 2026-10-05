import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Chaque constructeur reçoit (largeur, profondeur) en cm et renvoie un Group :
// origine au centre de l'emprise au sol, face avant orientée vers +z.

const std = (color, o = {}) => new THREE.MeshStandardMaterial({color, roughness: 0.75, ...o});

export const MAT = {
    white: std(0xf1efea, {roughness: 0.6}),
    gloss: std(0xf8f8f6, {roughness: 0.25}),
    front: std(0xe8e3d8, {roughness: 0.45}),
    wood: std(0x7a5236),
    oak: std(0xc49a6c, {roughness: 0.6}),
    dark: std(0x2a2c30, {roughness: 0.5}),
    black: std(0x101113, {roughness: 0.15}),
    screen: std(0x05070a, {roughness: 0.08, metalness: 0.2}),
    metal: std(0xc9cdd2, {metalness: 0.85, roughness: 0.28}),
    steel: std(0xa3a8ae, {metalness: 0.7, roughness: 0.35}),
    fabric: std(0x5b6874, {roughness: 0.95}),
    cushion: std(0x7b8997, {roughness: 0.95}),
    ceramic: std(0xffffff, {roughness: 0.12}),
    counter: std(0xdcd6cb, {roughness: 0.35}),
    leaf: std(0x3f7a3c, {roughness: 0.8, flatShading: true}),
    leaf2: std(0x5a9a4a, {roughness: 0.8, flatShading: true}),
    pot: std(0xb8643c),
    mirror: std(0xd5dee6, {metalness: 0.9, roughness: 0.06}),
    leather: std(0x1b1b1d, {roughness: 0.38}),
    leatherSeat: std(0x232325, {roughness: 0.42}),
    beige: std(0xb39b82, {roughness: 0.95}),
    walnut: std(0x5a3d2b, {roughness: 0.55}),
    blackMetal: std(0x1d1e20, {roughness: 0.45, metalness: 0.5}),
    duvet: std(0x3b3d44, {roughness: 0.95}),
    linen: std(0xe9e7e2, {roughness: 0.9}),
    cardboard: std(0xb08a5a, {roughness: 0.9}),
    pink: std(0xc96b6b, {roughness: 0.6}),
    plastic: std(0xf4f4f2, {roughness: 0.35}),
    groove: std(0x9a9a98, {roughness: 0.6}),
    chrome: std(0xf2f2f2, {metalness: 1, roughness: 0.12}),
    matteBlack: std(0x151617, {roughness: 0.5, metalness: 0.3}),
    glass: new THREE.MeshPhysicalMaterial({
        color: 0xd8eef5,
        transparent: true,
        opacity: 0.25,
        roughness: 0.05,
        depthWrite: false,
    }),
};

function B(g, x1, x2, y1, y2, z1, z2, mat) {
    const m = new THREE.Mesh(
        new THREE.BoxGeometry((x2 - x1) / 100, (y2 - y1) / 100, (z2 - z1) / 100),
        mat,
    );
    m.position.set((x1 + x2) / 200, (y1 + y2) / 200, (z1 + z2) / 200);
    m.castShadow = mat !== MAT.glass;
    m.receiveShadow = true;
    g.add(m);
    return m;
}

// Cylindre centré en (x, y, z) ; `alongZ` le couche selon l'axe z (hublot, bouton…).
function Cyl(g, rTop, rBot, h, x, y, z, mat, alongZ = false) {
    const m = new THREE.Mesh(
        new THREE.CylinderGeometry(rTop / 100, rBot / 100, h / 100, 32),
        mat,
    );
    m.position.set(x / 100, y / 100, z / 100);
    if (alongZ) m.rotation.x = Math.PI / 2;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
}

function wardrobe(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 220;
    B(g, -hw, hw, 0, h, -hd, hd - 2, MAT.white);
    const n = w > 130 ? 3 : 2,
        dw = (w - 2) / n;
    for (let i = 0; i < n; i++) {
        const a = -hw + 1 + i * dw,
            b = a + dw - 0.6;
        B(g, a, b, 3, h - 2, hd - 2, hd, MAT.front);
        const hx = i % 2 === 0 ? b - 5 : a + 5;
        B(g, hx - 0.7, hx + 0.7, 95, 135, hd, hd + 2.5, MAT.metal);
    }
    return g;
}

function tvStand(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 45;
    B(g, -hw, hw, 6, h, -hd, hd, MAT.oak);
    B(g, -hw + 3, hw - 3, 0, 6, -hd + 3, hd - 3, MAT.dark);
    B(g, -hw + 3, -0.5, 10, h - 4, hd, hd + 0.8, MAT.wood);
    B(g, 0.5, hw - 3, 10, h - 4, hd, hd + 0.8, MAT.wood);
    const tw = Math.min(w * 0.85, 125),
        th = tw * 0.58;
    B(g, -15, 15, h, h + 1.5, -hd + 5, -hd + 21, MAT.dark);
    B(g, -3, 3, h + 1.5, h + 12, -hd + 8, -hd + 11, MAT.dark);
    B(g, -tw / 2, tw / 2, h + 8, h + 8 + th, -hd + 11, -hd + 14, MAT.dark);
    B(g, -tw / 2 + 1, tw / 2 - 1, h + 9, h + 7 + th, -hd + 14, -hd + 14.3, MAT.screen);
    return g;
}

function table(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 75;
    B(g, -hw, hw, h - 4, h, -hd, hd, MAT.oak);
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            const x = sx * (hw - 6),
                z = sz * (hd - 6);
            B(g, x - 2.5, x + 2.5, 0, h - 4, z - 2.5, z + 2.5, MAT.wood);
        }
    return g;
}

function chair(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        sh = 45;
    B(g, -hw + 1, hw - 1, sh - 4, sh, -hd + 2, hd - 1, MAT.oak);
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            const x = sx * (hw - 4),
                z = sz * (hd - 5);
            B(g, x - 1.5, x + 1.5, 0, sh - 4, z - 1.5, z + 1.5, MAT.wood);
        }
    for (const sx of [-1, 1]) B(g, sx * (hw - 4) - 1.5, sx * (hw - 4) + 1.5, sh, 90, -hd + 2, -hd + 5, MAT.wood);
    B(g, -hw + 2, hw - 2, 68, 88, -hd + 2, -hd + 4.5, MAT.oak);
    return g;
}

// Canapé d'angle : assise principale le long du bord gauche (face vers +x), méridienne en bas à droite.
function sofaL(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    const sd = 93, // profondeur assise principale (dossier compris)
        bt = 18, // épaisseur dossier
        cw = 100, // profondeur méridienne
        bh = 82,
        sh = 42,
        ah = 60;
    const X0 = -hw,
        Z0 = -hd,
        zA = Z0 + 18,
        zB = hd - cw;
    B(g, X0, X0 + bt, 0, bh, Z0, hd, MAT.fabric); // dossier
    B(g, X0 + bt, X0 + sd, 0, ah, Z0, zA, MAT.fabric); // accoudoir
    B(g, X0 + bt, X0 + sd, 0, 28, zA, hd, MAT.fabric); // socle
    B(g, X0 + sd, hw, 0, 28, zB, hd, MAT.fabric); // socle méridienne
    const n = 2,
        seg = (zB - zA) / n;
    for (let i = 0; i < n; i++) B(g, X0 + bt, X0 + sd, 28, sh, zA + i * seg + 0.5, zA + (i + 1) * seg - 0.5, MAT.cushion);
    B(g, X0 + bt, hw, 28, sh, zB + 0.5, hd, MAT.cushion);
    const backs = 3,
        bseg = (hd - zA) / backs;
    for (let i = 0; i < backs; i++) B(g, X0 + bt, X0 + bt + 14, sh, bh - 4, zA + i * bseg + 1, zA + (i + 1) * bseg - 1, MAT.cushion);
    return g;
}

function kitchenBase(g, w, d, hole) {
    const hw = w / 2,
        hd = d / 2;
    B(g, -hw, hw, 0, 9, -hd, hd - 6, MAT.dark);
    B(g, -hw, hw, 9, 87, -hd, hd - 2, MAT.white);
    const n = Math.max(1, Math.round(w / 55)),
        dw = w / n;
    for (let i = 0; i < n; i++) {
        const a = -hw + i * dw + 0.3,
            b = a + dw - 0.6;
        B(g, a, b, 10, 86, hd - 2, hd, MAT.front);
        B(g, a + 6, b - 6, 80, 81.5, hd, hd + 2, MAT.metal);
    }
    if (hole) holedTop(g, -hw, hw, -hd, hd + 1, 87, 90, hole, MAT.counter);
    else B(g, -hw, hw, 87, 90, -hd, hd + 1, MAT.counter);
}

function wallCabinets(g, w, d) {
    const hw = w / 2,
        hd = d / 2;
    B(g, -hw, hw, 150, 215, -hd, -hd + 33, MAT.white);
    const n = Math.max(1, Math.round(w / 50)),
        dw = w / n;
    for (let i = 0; i < n; i++) {
        const a = -hw + i * dw + 0.3,
            b = a + dw - 0.6;
        B(g, a, b, 151, 214, -hd + 33, -hd + 35, MAT.front);
        B(g, a + 6, b - 6, 153, 154.5, -hd + 35, -hd + 37, MAT.metal);
    }
}

function counter(w, d) {
    const g = new THREE.Group();
    kitchenBase(g, w, d);
    wallCabinets(g, w, d);
    return g;
}

function sink(w, d) {
    const g = new THREE.Group(),
        hd = d / 2;
    // cuve inox encastrée de 18 cm de profondeur
    const hole = {cx: 0, cz: 3, w: 44, d: hd * 2 - 22, r: 3};
    kitchenBase(g, w, d, hole);
    basin(g, hole, 90, 18, MAT.steel);
    Cyl(g, 1.4, 1.4, 28, 0, 104, -hd + 5, MAT.metal);
    B(g, -1.2, 1.2, 115, 118, -hd + 5, -hd + 22, MAT.metal);
    wallCabinets(g, w, d);
    return g;
}

function cooker(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    B(g, -hw, hw, 0, 88, -hd, hd - 1, MAT.steel);
    B(g, -hw, hw, 88, 90, -hd, hd, MAT.black);
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            Cyl(g, 8, 8, 0.4, (sx * w) / 4, 90.2, (sz * d) / 4.5, MAT.steel);
            Cyl(g, 6, 6, 0.6, (sx * w) / 4, 90.3, (sz * d) / 4.5, MAT.dark);
        }
    B(g, -hw + 3, hw - 3, 12, 68, hd - 1, hd + 0.3, MAT.black);
    B(g, -hw + 7, hw - 7, 71, 73, hd + 0.3, hd + 3.5, MAT.metal);
    for (let i = 0; i < 4; i++) Cyl(g, 1.8, 1.8, 2, -hw + 10 + i * ((w - 20) / 3), 80, hd + 0.5, MAT.dark, true);
    // hotte
    B(g, -hw, hw, 165, 178, -hd, -hd + 50, MAT.steel);
    B(g, -12, 12, 178, 250, -hd, -hd + 25, MAT.steel);
    return g;
}

function fridge(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 185;
    B(g, -hw, hw, 0, h, -hd, hd - 2, MAT.gloss);
    B(g, -hw + 0.5, hw - 0.5, 2, 61.5, hd - 2, hd, MAT.gloss);
    B(g, -hw + 0.5, hw - 0.5, 62.5, h - 1, hd - 2, hd, MAT.gloss);
    B(g, -hw + 0.5, hw - 0.5, 61.5, 62.5, hd - 2.2, hd - 1, MAT.dark);
    B(g, hw - 6, hw - 4, 66, 96, hd, hd + 3.5, MAT.metal);
    B(g, hw - 6, hw - 4, 30, 58, hd, hd + 3.5, MAT.metal);
    return g;
}

function washer(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    B(g, -hw, hw, 0, 85, -hd, hd, MAT.gloss);
    B(g, -hw + 2, hw - 2, 74, 82, hd, hd + 0.4, MAT.front);
    Cyl(g, 3, 3, 2, hw - 12, 78, hd + 1, MAT.metal, true);
    Cyl(g, 16, 16, 3, 0, 42, hd + 1.5, MAT.steel, true);
    Cyl(g, 12, 12, 3.4, 0, 42, hd + 1.7, MAT.black, true);
    return g;
}

function toilet(w, d) {
    const g = new THREE.Group(),
        hd = d / 2;
    B(g, -18, 18, 38, 78, -hd, -hd + 17, MAT.ceramic);
    B(g, -4, 4, 78, 79, -hd + 6, -hd + 11, MAT.metal);
    Cyl(g, 18, 13, 38, 0, 19, hd - 25, MAT.ceramic).scale.z = 1.3;
    Cyl(g, 18, 18, 2.5, 0, 39.3, hd - 25, MAT.gloss).scale.z = 1.3;
    return g;
}

function bathtub(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        t = 7,
        h = 56;
    B(g, -hw, hw, 0, 14, -hd, hd, MAT.ceramic);
    B(g, -hw + t, hw - t, 14, 17, -hd + t, hd - t, MAT.gloss);
    B(g, -hw, hw, 14, h, -hd, -hd + t, MAT.ceramic);
    B(g, -hw, hw, 14, h, hd - t, hd, MAT.ceramic);
    B(g, -hw, -hw + t, 14, h, -hd + t, hd - t, MAT.ceramic);
    B(g, hw - t, hw, 14, h, -hd + t, hd - t, MAT.ceramic);
    Cyl(g, 2.5, 2.5, 0.4, hw - 18, 17.2, 0, MAT.steel);

    // colonne de douche noire mat, fixée sur le mur d'extrémité (+x, mur de la chambre)
    const blk = MAT.matteBlack,
        wx = hw + 3; // face du mur derrière l'extrémité de la baignoire
    B(g, wx - 2.5, wx, 100, 206, -1.2, 1.2, blk);
    B(g, wx - 30, wx, 204, 206, -1, 1, blk);
    Cyl(g, 12, 12, 1.5, wx - 30, 202.5, 0, blk);
    Cyl(g, 2.6, 2.6, 30, wx - 2, 100, 0, blk, true);
    Cyl(g, 3.2, 3.2, 3, wx - 2, 100, -15, blk, true);
    Cyl(g, 3.2, 3.2, 3, wx - 2, 100, 15, blk, true);
    Cyl(g, 1.2, 1.4, 18, wx - 4, 150, 2, blk);
    Cyl(g, 4, 2, 5, wx - 4, 161, 2, blk);
    B(g, wx - 3, wx, 162, 166, 0, 4, blk);

    // pare-baignoire verrière : cadre noir 85 x 140 cm sur le rebord avant, côté mur (+x)
    const s1 = hw,
        s0 = hw - 85,
        zs = hd - 3.5,
        y0 = h,
        y1 = h + 140,
        f = 2.2;
    const frame = (x1, x2, ya, yb) => B(g, x1, x2, ya, yb, zs - 1, zs + 1, blk);
    frame(s0, s0 + f, y0, y1);
    frame(s1 - f, s1, y0, y1);
    frame(s0, s1, y1 - f, y1);
    frame(s0, s1, y0, y0 + f);
    const mid = s0 + 85 * 0.55;
    frame(mid - f / 2, mid + f / 2, y0, y1);
    B(g, s0 + f, s1 - f, y0 + f, y1 - f, zs - 0.4, zs + 0.4, MAT.glass);
    // porte-serviette côté extérieur
    B(g, s0 + 2, mid - 2, y0 + 80, y0 + 82.5, zs + 5, zs + 7.5, blk);
    for (const x of [s0 + 3, mid - 3]) B(g, x - 1, x + 1, y0 + 80, y0 + 82.5, zs + 1, zs + 5, blk);
    return g;
}

function vanity(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    B(g, -hw, hw, 20, 80, -hd, hd - 1, MAT.wood);
    B(g, -hw + 1, hw - 1, 22, 78, hd - 1, hd, MAT.oak);
    B(g, -15, 15, 70, 71.5, hd, hd + 2, MAT.metal);
    B(g, -hw, hw, 80, 83, -hd, hd, MAT.ceramic);
    Cyl(g, 18, 15, 12, 0, 89, 3, MAT.ceramic);
    Cyl(g, 15.5, 15.5, 0.4, 0, 95.1, 3, MAT.steel);
    Cyl(g, 1.3, 1.3, 18, 0, 92, -hd + 6, MAT.metal);
    B(g, -1, 1, 99, 101, -hd + 6, -hd + 15, MAT.metal);
    B(g, -hw + 5, hw - 5, 105, 170, -hd, -hd + 1.5, MAT.mirror);
    return g;
}

function shower(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    B(g, -hw, hw, 0, 6, -hd, hd, MAT.ceramic);
    Cyl(g, 5, 5, 0.4, 0, 6.2, 0, MAT.steel);
    B(g, hw - 1, hw, 6, 200, -hd, hd - 30, MAT.glass);
    B(g, hw - 1.5, hw + 0.5, 198, 200, -hd, hd - 30, MAT.metal);
    Cyl(g, 1.5, 1.5, 110, 0, 150, -hd + 3, MAT.metal);
    B(g, -1, 1, 203, 205, -hd + 3, -hd + 28, MAT.metal);
    Cyl(g, 11, 11, 1.5, 0, 202, -hd + 28, MAT.metal);
    B(g, -8, 8, 100, 106, -hd, -hd + 5, MAT.metal);
    return g;
}

function radiator(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    const n = Math.max(3, Math.round(w / 5)),
        step = w / n;
    for (let i = 0; i < n; i++) {
        const x = -hw + step * (i + 0.5);
        B(g, x - step * 0.35, x + step * 0.35, 12, 72, -hd + 2, hd, MAT.gloss);
    }
    B(g, -hw, hw, 16, 19, -hd + 3, hd - 3, MAT.gloss);
    B(g, -hw, hw, 65, 68, -hd + 3, hd - 3, MAT.gloss);
    return g;
}

function buffet(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            const x = sx * (hw - 5),
                z = sz * (hd - 5);
            B(g, x - 1.5, x + 1.5, 0, 15, z - 1.5, z + 1.5, MAT.dark);
        }
    B(g, -hw, hw, 15, 80, -hd, hd - 1, MAT.wood);
    const n = 3,
        dw = (w - 2) / n;
    for (let i = 0; i < n; i++) {
        const a = -hw + 1 + i * dw,
            b = a + dw - 0.6;
        B(g, a, b, 17, 78, hd - 1, hd, MAT.oak);
        B(g, (a + b) / 2 - 6, (a + b) / 2 + 6, 70, 71.5, hd, hd + 2, MAT.dark);
    }
    Cyl(g, 5, 7, 22, -hw + 25, 91, 0, MAT.ceramic);
    B(g, hw - 45, hw - 20, 80, 84, -8, 8, MAT.dark);
    B(g, hw - 43, hw - 22, 84, 87, -7, 7, MAT.oak);
    return g;
}

function plant(w, d) {
    const g = new THREE.Group(),
        rr = Math.min(w, d) / 2;
    Cyl(g, rr * 0.6, rr * 0.45, 32, 0, 16, 0, MAT.pot);
    Cyl(g, rr * 0.55, rr * 0.55, 1, 0, 31.5, 0, MAT.dark);
    const f1 = new THREE.Mesh(new THREE.IcosahedronGeometry((rr * 0.95) / 100, 1), MAT.leaf);
    f1.position.y = (32 + rr * 1.1) / 100;
    f1.scale.y = 1.4;
    const f2 = new THREE.Mesh(new THREE.IcosahedronGeometry((rr * 0.6) / 100, 1), MAT.leaf2);
    f2.position.set(rr * 0.003, (32 + rr * 2.1) / 100, -rr * 0.002);
    for (const f of [f1, f2]) {
        f.castShadow = f.receiveShadow = true;
        g.add(f);
    }
    return g;
}


// ---------- Meubles relevés sur les photos ----------

function sofa(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        arm = 16;
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) Cyl(g, 1.6, 1.6, 10, sx * (hw - 8), 5, sz * (hd - 8), MAT.metal);
    B(g, -hw, hw, 10, 38, -hd, hd, MAT.leather);
    B(g, -hw, -hw + arm, 38, 62, -hd, hd, MAT.leather);
    B(g, hw - arm, hw, 38, 62, -hd, hd, MAT.leather);
    B(g, -hw + arm, hw - arm, 38, 78, -hd, -hd + 20, MAT.leather);
    const sw = (w - 2 * arm) / 2;
    for (let i = 0; i < 2; i++) {
        const a = -hw + arm + i * sw;
        B(g, a + 0.5, a + sw - 0.5, 38, 47, -hd + 20, hd - 1, MAT.leatherSeat);
        B(g, a + 0.5, a + sw - 0.5, 47, 76, -hd + 20, -hd + 30, MAT.leatherSeat);
        // têtières réglables
        B(g, a + 4, a + sw - 4, 78, 92, -hd + 4, -hd + 22, MAT.leather);
    }
    const c = B(g, hw - arm - 48, hw - arm - 6, 47, 85, -hd + 30, -hd + 42, MAT.beige);
    c.rotation.x = -0.25;
    return g;
}

function coffeeTable(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 45;
    B(g, -hw, hw, h - 3, h, -hd, hd, MAT.walnut);
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            const x = sx * (hw - 2),
                z = sz * (hd - 2);
            B(g, x - 1.5, x + 1.5, 0, h - 3, z - 1.5, z + 1.5, MAT.blackMetal);
        }
    B(g, -hw + 2, hw - 2, 12, 13, -hd + 2, hd - 2, MAT.blackMetal);
    B(g, -hw + 2, hw - 2, h - 6, h - 3, -hd + 1, -hd + 3, MAT.blackMetal);
    B(g, -hw + 2, hw - 2, h - 6, h - 3, hd - 3, hd - 1, MAT.blackMetal);
    Cyl(g, 4, 4, 9, -8, h + 4.5, 4, MAT.linen);
    return g;
}

function shelfIndustrial(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 155;
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            const x = sx * (hw - 1.5),
                z = sz * (hd - 1.5);
            B(g, x - 1.5, x + 1.5, 0, h, z - 1.5, z + 1.5, MAT.blackMetal);
        }
    const levels = [8, 42, 76, 110, h - 2];
    for (const y of levels) B(g, -hw + 1, hw - 1, y, y + 2, -hd + 1, hd - 1, MAT.oak);
    // contenu : boîtes à chaussures, livres, enceinte
    B(g, -hw + 6, -hw + 40, 10, 24, -hd + 4, hd - 4, MAT.dark);
    B(g, -hw + 6, -hw + 40, 24, 36, -hd + 4, hd - 4, MAT.cardboard);
    B(g, 0, hw - 6, 44, 62, -hd + 3, hd - 3, MAT.dark);
    B(g, -hw + 6, -10, 44, 54, -hd + 6, hd - 6, MAT.gloss);
    B(g, -5, hw - 4, 78, 104, -hd + 2, hd - 2, MAT.dark);
    B(g, -hw + 5, -hw + 30, 78, 98, -hd + 6, hd - 10, MAT.screen);
    B(g, -hw + 6, -hw + 36, 112, 128, -hd + 4, hd - 4, MAT.dark);
    for (let i = 0; i < 5; i++) B(g, 5 + i * 3, 7.5 + i * 3, h, h + 22 - (i % 2) * 4, -8, 8, i % 2 ? MAT.linen : MAT.fabric);
    // lampe à bras posée sur le dessus
    Cyl(g, 7, 8, 2, hw - 18, h + 1, 0, MAT.blackMetal);
    Cyl(g, 1, 1, 70, hw - 18, h + 36, 0, MAT.blackMetal);
    Cyl(g, 10, 6, 14, hw - 18, h + 74, 8, MAT.blackMetal).rotation.x = 1.1;
    return g;
}

function plantGeneric(w, d, potMat, potH, stems) {
    const g = new THREE.Group(),
        rr = Math.min(w, d) / 2;
    Cyl(g, rr * 0.8, rr * 0.62, potH, 0, potH / 2, 0, potMat);
    Cyl(g, rr * 0.74, rr * 0.74, 1, 0, potH - 1, 0, MAT.dark);
    for (const [x, z, h, s] of stems) {
        Cyl(g, 1.3, 1.8, h, x, potH + h / 2, z, MAT.wood);
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(s / 100, 0), MAT.leaf);
        f.position.set(x / 100, (potH + h + s * 0.5) / 100, z / 100);
        f.scale.set(1.3, 0.8, 1.3);
        f.rotation.y = x;
        f.castShadow = f.receiveShadow = true;
        g.add(f);
    }
    return g;
}

const plantTall = (w, d) =>
    plantGeneric(w, d, MAT.pink, 32, [
        [0, 0, 105, 26],
        [6, 4, 75, 22],
        [-6, -3, 50, 20],
    ]);
const plantSmall = (w, d) =>
    plantGeneric(w, d, MAT.dark, 36, [
        [0, 0, 18, 22],
        [5, -4, 8, 16],
    ]);

function shoeRack(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 95;
    B(g, -hw, hw, 0, h, -hd, hd - 1, MAT.dark);
    B(g, -hw - 0.5, hw + 0.5, h, h + 2, -hd, hd + 0.5, MAT.walnut);
    for (let i = 0; i < 3; i++) {
        const y = 4 + i * 30;
        B(g, -hw + 2, hw - 2, y, y + 28, hd - 1, hd + 0.5, MAT.black);
        B(g, -6, 6, y + 24, y + 25.5, hd + 0.5, hd + 2, MAT.metal);
    }
    return g;
}

function poster(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    B(g, -hw, hw, 125, 225, -hd, hd, MAT.black);
    B(g, -hw + 4, hw - 4, 135, 215, hd - 0.4, hd + 0.2, MAT.fabric);
    B(g, -6, 6, 150, 200, hd, hd + 0.4, MAT.linen);
    return g;
}

// Gaze de coton beige : texture froissée (couleur + relief) partagée par le linge de lit.
let gauzeMats = null;
function gauze() {
    if (gauzeMats) return gauzeMats;
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.fillStyle = '#808080';
    g.fillRect(0, 0, S, S);
    let seed = 5;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // plis : longues traînées douces claires / sombres
    for (let i = 0; i < 900; i++) {
        const x = r() * S,
            y = r() * S,
            len = 20 + r() * 90,
            a = (r() - 0.5) * 1.2 + (r() < 0.5 ? 0 : Math.PI / 2);
        g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.05 + r() * 0.1})`;
        g.lineWidth = 1 + r() * 4;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (r() - 0.5) * 20, y + Math.sin(a) * len * 0.5 + (r() - 0.5) * 20, x + Math.cos(a) * len, y + Math.sin(a) * len);
        g.stroke();
    }
    // trame fine du tissage
    for (let y = 0; y < S; y += 3) {
        g.fillStyle = 'rgba(0,0,0,0.04)';
        g.fillRect(0, y, S, 1);
    }
    const bump = new THREE.CanvasTexture(c);
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(3, 3);
    const mk = (color) => std(color, {roughness: 1, bumpMap: bump, bumpScale: 2.5});
    gauzeMats = {duvet: mk(0xcdbb9f), pillow: mk(0xd8c9b1), sheet: mk(0xd3c3a9)};
    return gauzeMats;
}

// Lit : tête de lit vers -z.
function bed(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) B(g, sx * (hw - 6) - 2, sx * (hw - 6) + 2, 0, 10, sz * (hd - 6) - 2, sz * (hd - 6) + 2, MAT.metal);
    const {duvet, pillow, sheet} = gauze();
    B(g, -hw, hw, 10, 32, -hd, hd, MAT.dark);
    B(g, -hw + 1, hw - 1, 32, 50, -hd + 1, hd - 1, sheet);
    B(g, -hw - 2, hw + 2, 24, 55, -hd + 45, hd + 2, duvet);
    B(g, -hw + 2, hw - 2, 55, 56.5, -hd + 45, -hd + 70, duvet); // retour de couette replié
    B(g, -hw + 7, -3, 50, 64, -hd + 6, -hd + 42, pillow);
    B(g, 3, hw - 7, 50, 64, -hd + 6, -hd + 42, pillow);
    return g;
}

// Armoire blanche à façade quadrillée (portes sans poignées, rainures grises).
function wardrobeGrid(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 200;
    B(g, -hw, hw, 0, h, -hd, hd - 1, MAT.plastic);
    B(g, -hw + 1, hw - 1, 2, h - 1, hd - 1, hd, MAT.plastic);
    const line = (x1, x2, y1, y2) => B(g, x1, x2, y1, y2, hd, hd + 0.3, MAT.groove);
    line(-0.4, 0.4, 2, h - 1);
    for (const y of [40, 70, 100, 140]) line(-hw + 1, 0, y - 0.4, y + 0.4);
    line(-hw / 2 - 0.4, -hw / 2 + 0.4, 40, 100);
    line(0, hw - 1, 40 - 0.4, 40 + 0.4);
    B(g, -hw + 8, hw - 20, h, h + 25, -hd + 8, hd - 8, MAT.cardboard);
    return g;
}

function nightstand(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 48;
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            const x = sx * (hw - 1),
                z = sz * (hd - 1);
            B(g, x - 1, x + 1, 0, h, z - 1, z + 1, MAT.blackMetal);
        }
    for (const y of [10, h - 2]) B(g, -hw + 1, hw - 1, y, y + 1.5, -hd + 1, hd - 1, MAT.blackMetal);
    return g;
}

// Chaise scandinave : coque blanche, pieds bois.
function chairScandi(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            const leg = Cyl(g, 1.6, 1.2, 46, sx * (hw - 9), 22, sz * (hd - 12), MAT.oak);
            leg.rotation.z = sx * 0.12;
            leg.rotation.x = -sz * 0.12;
        }
    B(g, -hw + 7, hw - 7, 32, 35, -hd + 10, hd - 10, MAT.oak);
    B(g, -hw + 3, hw - 3, 44, 48, -hd + 5, hd - 3, MAT.plastic);
    const back = B(g, -hw + 3, hw - 3, 48, 84, -hd + 3, -hd + 6, MAT.plastic);
    back.rotation.x = -0.12;
    B(g, -hw + 3, -hw + 6, 48, 62, -hd + 5, hd - 10, MAT.plastic);
    B(g, hw - 6, hw - 3, 48, 62, -hd + 5, hd - 10, MAT.plastic);
    return g;
}

function bistroTable(w, d) {
    const g = new THREE.Group(),
        r = Math.min(w, d) / 2;
    Cyl(g, r, r, 2, 0, 72, 0, MAT.steel);
    Cyl(g, 2, 2, 70, 0, 36, 0, MAT.steel);
    Cyl(g, 22, 24, 2, 0, 1, 0, MAT.steel);
    return g;
}

// Meuble vasque long avec lave-linge sous le plan (côté -x) et grand miroir.
function vanityWasher(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        top = 88,
        ww = 60;
    const cx = (-hw + 1 + ww - 2 + hw) / 2;
    const hole = {cx, cz: 3, w: 40, d: d - 20, r: 9};
    holedTop(g, -hw, hw, -hd, hd, top - 4, top, hole, MAT.gloss);
    basin(g, hole, top, 14, MAT.ceramic);
    // lave-linge
    const x0 = -hw + 1,
        x1 = x0 + ww - 2;
    B(g, x0, x1, 0, 84, -hd + 2, hd - 4, MAT.gloss);
    Cyl(g, 15, 15, 3, (x0 + x1) / 2, 42, hd - 2.5, MAT.steel, true);
    Cyl(g, 11, 11, 3.4, (x0 + x1) / 2, 42, hd - 2.2, MAT.black, true);
    B(g, x0 + 2, x1 - 2, 74, 82, hd - 4, hd - 3.6, MAT.front);
    // caisson à tiroirs suspendu
    B(g, x1 + 1, hw, 30, top - 4, -hd, hd - 1, MAT.gloss);
    for (const y of [32, 50, 68]) B(g, x1 + 1.5, hw - 0.5, y, y + 16.5, hd - 1, hd, MAT.plastic);
    // mitigeur
    Cyl(g, 1.3, 1.3, 16, cx, top + 8, -hd + 6, MAT.metal);
    B(g, cx - 1, cx + 1, top + 14, top + 16, -hd + 6, -hd + 15, MAT.metal);
    // miroir
    B(g, -hw + 2, hw - 2, 105, 185, -hd, -hd + 1, MAT.mirror);
    return g;
}

// ---------- Modèles 3D externes ----------

const gltfLoader = new GLTFLoader();

// Charge un .glb dans un groupe, le tourne pour que l'élément `backNode` soit à l'arrière (-z),
// puis le met exactement aux dimensions w x d (cm) au sol. `dress(mesh)` adapte les matériaux.
function gltfModel(url, w, d, {backNode, dress}) {
    const g = new THREE.Group();
    gltfLoader.load(url, (gltf) => {
        const inner = gltf.scene;
        inner.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(inner);
        const center = box.getCenter(new THREE.Vector3());
        const back = new THREE.Box3().setFromObject(inner.getObjectByName(backNode)).getCenter(new THREE.Vector3()).sub(center);
        const wrap = new THREE.Group();
        wrap.add(inner);
        let best = 0,
            bestZ = Infinity;
        for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
            const z = -back.x * Math.sin(a) + back.z * Math.cos(a);
            if (z < bestZ) [best, bestZ] = [a, z];
        }
        wrap.rotation.y = best;
        wrap.updateMatrixWorld(true);
        const b2 = new THREE.Box3().setFromObject(wrap);
        const size = b2.getSize(new THREE.Vector3());
        const sx = w / 100 / size.x,
            sz = d / 100 / size.z;
        const outer = new THREE.Group();
        outer.add(wrap);
        outer.scale.set(sx, (sx + sz) / 2, sz);
        const c = b2.getCenter(new THREE.Vector3());
        wrap.position.set(-c.x, -b2.min.y, -c.z);
        inner.traverse((m) => {
            if (!m.isMesh) return;
            m.castShadow = m.receiveShadow = true;
            dress?.(m);
        });
        g.add(outer);
        g.userData.onLoad?.();
    });
    return g;
}

// Canapé OMHU Teddy (modèle officiel), velours côtelé rouille et arceaux chromés.
let teddyFabric = null;
function teddy(w, d) {
    return gltfModel('/models/teddy.glb', w, d, {
        backNode: 'Handle_Back_Mesh',
        dress(m) {
            if (m.material.name === 'Metal_Material' || m.material.name === 'Paint_Material') {
                m.material = MAT.chrome;
                return;
            }
            if (m.material.name === 'Fabric_Material' && !teddyFabric) {
                teddyFabric = m.material.clone();
                teddyFabric.color.set(0xa0503a);
                teddyFabric.emissive.set(0x000000);
                teddyFabric.emissiveMap = null;
                teddyFabric.roughness = 1;
                teddyFabric.metalness = 0;
                teddyFabric.metalnessMap = teddyFabric.roughnessMap = null;
            }
            // tissu, coussin « zèbre » du configurateur et dessous : même velours rouille
            if (!teddyFabric) teddyFabric = new THREE.MeshStandardMaterial({color: 0xa0503a, roughness: 1});
            m.material = teddyFabric;
        },
    });
}

// ---------- Bar en zellige ----------

// Texture zellige : baguettes vernissées vertes verticales (~4 x 20 cm), rangs décalés,
// joints vert foncé. La même trame sert de bump map pour le relief des joints.
let zelligeMaps = null;
function zellige() {
    if (zelligeMaps) return zelligeMaps;
    const S = 1024,
        SIZE = 0.6; // la texture couvre 60 x 60 cm
    const px = S / (SIZE * 100); // pixels par cm
    const color = document.createElement('canvas'),
        bump = document.createElement('canvas');
    color.width = color.height = bump.width = bump.height = S;
    const g = color.getContext('2d'),
        b = bump.getContext('2d');
    g.fillStyle = '#3f4a2c';
    g.fillRect(0, 0, S, S);
    b.fillStyle = '#000';
    b.fillRect(0, 0, S, S);
    let seed = 17;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const rowH = 20 * px,
        joint = 0.35 * px;
    for (let row = 0; row < S / rowH; row++) {
        let x = -r() * 4 * px;
        while (x < S) {
            const tw = (3.6 + r() * 0.8) * px;
            const y = row * rowH;
            const h = 88 + r() * 14,
                sat = 28 + r() * 22,
                l = 48 + r() * 20;
            const grad = g.createLinearGradient(x, y, x + tw, y);
            grad.addColorStop(0, `hsl(${h}, ${sat}%, ${l - 10}%)`);
            grad.addColorStop(0.35 + r() * 0.3, `hsl(${h}, ${sat - 8}%, ${l + 8}%)`);
            grad.addColorStop(1, `hsl(${h}, ${sat}%, ${l - 6}%)`);
            g.fillStyle = grad;
            g.fillRect(x + joint, y + joint, tw - 2 * joint, rowH - 2 * joint);
            // nuances verticales de l'émail
            for (let k = 0; k < 6; k++) {
                g.fillStyle = `hsla(${h}, ${sat}%, ${l + (r() - 0.5) * 30}%, 0.25)`;
                g.fillRect(x + joint + r() * tw * 0.6, y + joint + r() * rowH * 0.5, 1 + r() * tw * 0.3, rowH * (0.3 + r() * 0.6));
            }
            b.fillStyle = `rgb(${200 + r() * 55 | 0},${200 + r() * 55 | 0},${200 + r() * 55 | 0})`;
            b.fillRect(x + joint, y + joint, tw - 2 * joint, rowH - 2 * joint);
            x += tw;
        }
    }
    const mk = (c, srgb) => {
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1 / SIZE, 1 / SIZE);
        t.anisotropy = 8;
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        return t;
    };
    zelligeMaps = {map: mk(color, true), bumpMap: mk(bump, false)};
    return zelligeMaps;
}

// Contour (en m) arrondi seulement côté -x (le côté +x vient contre le mur).
// `cavity` = {depth, endLeft, endRight} : niche ouverte côté +y du contour (= arrière -z du meuble).
function barShape(w, d, rad, cavity) {
    const s = new THREE.Shape(),
        x0 = -w / 2,
        x1 = w / 2,
        y0 = -d / 2,
        y1 = d / 2;
    s.moveTo(x0 + rad, y0);
    s.lineTo(x1, y0);
    s.lineTo(x1, y1);
    if (cavity) {
        const cy = y1 - cavity.depth;
        s.lineTo(x1 - cavity.endRight, y1);
        s.lineTo(x1 - cavity.endRight, cy);
        s.lineTo(x0 + cavity.endLeft, cy);
        s.lineTo(x0 + cavity.endLeft, y1);
    }
    s.lineTo(x0 + rad, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - rad);
    s.lineTo(x0, y0 + rad);
    s.quadraticCurveTo(x0, y0, x0 + rad, y0);
    return s;
}

// Extrude un contour vertical entre y0 et y1 (cm).
function prism(g, shape, y0, y1, mat) {
    const geo = new THREE.ExtrudeGeometry(shape, {depth: (y1 - y0) / 100, bevelEnabled: false, curveSegments: 10});
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y0 / 100;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
}

// Meuble bar : adossé au mur par son extrémité +x, arrondi à l'autre bout, habillé de zellige vert,
// étagères ouvertes côté cuisine (-z) et plan de travail inox débordant.
function zelligeBar(w, d) {
    const g = new THREE.Group(),
        h = 105,
        top = 3,
        over = 2.5,
        R = 13,
        m = (v) => v / 100;
    const {map, bumpMap} = zellige();
    const tile = new THREE.MeshStandardMaterial({map, bumpMap, bumpScale: 1.5, roughness: 0.22});
    const inox = new THREE.MeshStandardMaterial({color: 0xd2d5d8, metalness: 1, roughness: 0.3, envMap: MAT.chrome.envMap});
    const bw = w - over, // le caisson est en retrait du plan sauf côté mur
        bd = d - 2 * over,
        bx = -over / 2;
    const cav = {depth: 30, endLeft: R + 4, endRight: 3};
    const plinth = prism(g, barShape(m(bw - 2), m(bd - 2), m(R - 1)), 0, 6, std(0xb9cdb8, {roughness: 0.6}));
    plinth.position.x = m(bx);
    const body = prism(g, barShape(m(bw), m(bd), m(R), {depth: m(cav.depth), endLeft: m(cav.endLeft), endRight: m(cav.endRight)}), 6, h - top, tile);
    body.position.x = m(bx);
    prism(g, barShape(m(w), m(d), m(R + 1)), h - top, h, inox);
    // niche : fond et étagères en chêne
    const xa = bx - bw / 2 + cav.endLeft,
        xb = bx + bw / 2 - cav.endRight,
        zBack = -bd / 2,
        zIn = -bd / 2 + cav.depth;
    B(g, xa, xb, 6, h - top, zIn - 1, zIn, MAT.oak);
    for (const y of [6, 37, 68]) B(g, xa, xb, y, y + 2, zBack + 1, zIn - 1, MAT.oak);
    return g;
}

// ---------- Meuble TV + TCL 65P89L ----------

// Meuble TV bas (noyer, pieds métal noir) avec le téléviseur TCL QD-Mini LED 65" posé dessus.
// Dimensions TV avec pied : 144,4 x 89,3 x 29,5 cm (fiche produit), pieds en V près des bords.
function tvUnit65(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 45;
    // meuble
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            const x = sx * (hw - 8),
                z = sz * (hd - 6);
            B(g, x - 1.5, x + 1.5, 0, 12, z - 1.5, z + 1.5, MAT.blackMetal);
        }
    B(g, -hw, hw, 12, h, -hd, hd - 1, MAT.walnut);
    const n = 3,
        dw = (w - 2) / n;
    for (let i = 0; i < n; i++) {
        const a = -hw + 1 + i * dw,
            b = a + dw - 0.6;
        B(g, a, b, 14, h - 2, hd - 1, hd, i === 1 ? MAT.dark : MAT.walnut);
    }
    // TV : dalle 144,4 x 83,5, pieds en V de 5,8 cm de haut et 29,5 cm de profondeur
    const TW = 144.4,
        TH = 83.5,
        foot = 89.3 - TH,
        zc = -hd + 16,
        y0 = h + foot;
    for (const sx of [-1, 1]) {
        const x = sx * (TW / 2 - 14);
        for (const a of [0.55, -0.55]) {
            const leg = B(g, -1.2, 1.2, h, h + 1.5, -15, 15, MAT.dark);
            leg.position.x = x / 100;
            leg.position.z = zc / 100;
            leg.rotation.y = sx * a;
        }
        B(g, x - 2, x + 2, h, y0 + 6, zc - 1.5, zc + 1.5, MAT.dark);
    }
    B(g, -TW / 2, TW / 2, y0, y0 + TH, zc - 1.2, zc + 1.2, MAT.dark); // dalle
    B(g, -TW / 2 + 20, TW / 2 - 20, y0 + 10, y0 + TH - 10, zc - 4, zc - 1.2, MAT.dark); // dos (électronique)
    B(g, -TW / 2 + 0.6, TW / 2 - 0.6, y0 + 2, y0 + TH - 0.6, zc + 1.2, zc + 1.4, MAT.screen); // écran
    B(g, -9, 9, y0 - 0.8, y0 + 1.6, zc + 0.6, zc + 1.6, MAT.steel); // module sous l'écran
    return g;
}

// ---------- Vasques creusées ----------

const rrect = (P, cx, cy, w, h, r) => {
    const p = new P(),
        x = cx - w / 2,
        y = cy - h / 2;
    p.moveTo(x + r, y);
    p.lineTo(x + w - r, y);
    p.quadraticCurveTo(x + w, y, x + w, y + r);
    p.lineTo(x + w, y + h - r);
    p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    p.lineTo(x + r, y + h);
    p.quadraticCurveTo(x, y + h, x, y + h - r);
    p.lineTo(x, y + r);
    p.quadraticCurveTo(x, y, x + r, y);
    return p;
};
const cm = (v) => v / 100;

// Plan percé : rectangle [x1, x2] x [z1, z2] (cm) d'épaisseur y0 -> y1, trou arrondi `hole`.
function holedTop(g, x1, x2, z1, z2, y0, y1, hole, mat) {
    // contour dans le repère de la forme : sy = -z
    const s = rrect(THREE.Shape, cm((x1 + x2) / 2), cm(-(z1 + z2) / 2), cm(x2 - x1), cm(z2 - z1), 0);
    s.holes.push(rrect(THREE.Path, cm(hole.cx), cm(-hole.cz), cm(hole.w), cm(hole.d), cm(hole.r)));
    return prism(g, s, y0, y1, mat);
}

// Cuve sous le trou : parois de 1,2 cm, fond et bonde.
function basin(g, hole, yTop, depth, mat) {
    const t = 1.2;
    const ring = rrect(THREE.Shape, cm(hole.cx), cm(-hole.cz), cm(hole.w + 2 * t), cm(hole.d + 2 * t), cm(hole.r + t));
    ring.holes.push(rrect(THREE.Path, cm(hole.cx), cm(-hole.cz), cm(hole.w), cm(hole.d), cm(hole.r)));
    prism(g, ring, yTop - depth, yTop - 0.05, mat);
    prism(g, rrect(THREE.Shape, cm(hole.cx), cm(-hole.cz), cm(hole.w), cm(hole.d), cm(hole.r)), yTop - depth - t, yTop - depth, mat);
    Cyl(g, 2.2, 2.2, 0.3, hole.cx, yTop - depth + 0.15, hole.cz, MAT.metal);
    Cyl(g, 1.2, 1.2, 0.4, hole.cx, yTop - depth + 0.25, hole.cz, MAT.dark);
}

// ---------- Monstera ----------

// Feuille de monstera : cœur pointu percé de fenêtres allongées, creusée et retombante.
// Repère local : base en (0, 0), pointe en (0, L) sur l'axe y, face vers +z.
function monsteraLeaf(L, W, rnd) {
    const half = [
        [0, 0.1],
        [0.17, 0],
        [0.35, 0.05],
        [0.47, 0.2],
        [0.5, 0.4],
        [0.47, 0.6],
        [0.37, 0.79],
        [0.21, 0.92],
        [0, 1],
    ];
    const s = new THREE.Shape();
    const pts = [...half.map(([x, y]) => [x, y]), ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
    pts.forEach(([x, y], i) => (i ? s.lineTo(x * W, y * L) : s.moveTo(x * W, y * L)));
    // fenêtres : fentes partant près de la nervure vers le bord, de chaque côté
    const n = 3 + Math.floor(rnd() * 2);
    for (const side of [-1, 1])
        for (let i = 0; i < n; i++) {
            const y0 = 0.2 + (i * 0.6) / n + rnd() * 0.04;
            const x0 = 0.07 + rnd() * 0.04,
                x1 = 0.36 + rnd() * 0.07;
            const y1 = y0 + 0.08 + rnd() * 0.05,
                hw = 0.018 + rnd() * 0.01;
            const h = new THREE.Path();
            h.moveTo(side * x0 * W, (y0 - hw) * L);
            h.lineTo(side * x1 * W, (y1 - hw) * L);
            h.lineTo(side * (x1 + 0.02) * W, y1 * L);
            h.lineTo(side * x1 * W, (y1 + hw) * L);
            h.lineTo(side * x0 * W, (y0 + hw) * L);
            if (side > 0) h.closePath();
            s.holes.push(side > 0 ? h : new THREE.Path(h.getPoints().reverse()));
        }
    const geo = new THREE.ShapeGeometry(s, 6);
    // courbure : creusée de part et d'autre de la nervure + pointe qui retombe
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) / W,
            y = p.getY(i) / L;
        p.setZ(i, (x * x * 0.35 * W - y * y * 0.28 * L) * 0.6);
    }
    geo.computeVertexNormals();
    return geo;
}

function monstera(w, d) {
    const g = new THREE.Group();
    let seed = 2024;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const terracotta = std(0xc4552b, {roughness: 0.55});
    const leafMat = new THREE.MeshStandardMaterial({color: 0x245f29, roughness: 0.55, side: THREE.DoubleSide});
    const stemMat = std(0x6f9a3e, {roughness: 0.6});
    const potH = 30;
    Cyl(g, 16, 12, potH, 0, potH / 2, 0, terracotta);
    Cyl(g, 16.6, 16.6, 2, 0, potH - 1, 0, terracotta);
    Cyl(g, 15.2, 15.2, 1, 0, potH - 2, 0, std(0x3a2a1e, {roughness: 1}));

    const up = new THREE.Vector3(0, 1, 0);
    const count = 17;
    for (let i = 0; i < count; i++) {
        const phi = i * 2.39996 + rnd() * 0.4; // angle d'or : feuilles bien réparties
        const young = i >= count - 3;
        const h = young ? 45 + rnd() * 20 : 50 + rnd() * 55;
        const r = young ? 6 + rnd() * 8 : 12 + rnd() * 22;
        const base = new THREE.Vector3((Math.cos(phi) * 3) / 100, (potH - 2) / 100, (Math.sin(phi) * 3) / 100);
        const end = new THREE.Vector3((Math.cos(phi) * r) / 100, (potH + h) / 100, (Math.sin(phi) * r) / 100);
        const mid = new THREE.Vector3((Math.cos(phi) * r * 0.35) / 100, (potH + h * 0.65) / 100, (Math.sin(phi) * r * 0.35) / 100);
        const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([base, mid, end]), 12, 0.0075, 6), stemMat);
        stem.castShadow = true;
        g.add(stem);

        const L = young ? 20 + rnd() * 8 : 36 + rnd() * 18;
        const leaf = new THREE.Mesh(monsteraLeaf(L / 100, (L * (0.85 + rnd() * 0.1)) / 100, rnd), leafMat);
        // orientation : la feuille part vers l'extérieur, légèrement inclinée vers le bas, face au ciel
        const tilt = young ? -0.3 + rnd() * 0.3 : 0.1 + rnd() * 0.45;
        const dir = new THREE.Vector3(Math.cos(phi) * Math.cos(tilt), -Math.sin(tilt), Math.sin(phi) * Math.cos(tilt)).normalize();
        const xAxis = new THREE.Vector3().crossVectors(up, dir).normalize();
        const zAxis = new THREE.Vector3().crossVectors(xAxis, dir).normalize();
        if (zAxis.y < 0) zAxis.negate(), xAxis.negate();
        leaf.matrixAutoUpdate = false;
        leaf.matrix.makeBasis(xAxis, dir, zAxis).setPosition(end);
        leaf.castShadow = leaf.receiveShadow = true;
        g.add(leaf);
        // nervure centrale plus claire
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.004, (L * 0.9) / 100, 0.003), stemMat);
        rib.position.set(0, (L * 0.45) / 100, 0.002);
        leaf.add(rib);
    }
    // taille proportionnelle à l'emprise (70 cm = grande plante)
    g.scale.setScalar(Math.min(w, d) / 70);
    return g;
}

// ---------- Onewheel sur son support ----------

// Onewheel rangé debout (nez en haut) dans un support métal noir.
// Planche ~70 x 23 cm, roue de 29 cm de diamètre et 15 cm de large au centre, essieu selon x.
function onewheelStand(w, d) {
    const g = new THREE.Group();
    const rail = std(0x6a6f77, {roughness: 0.35, metalness: 0.7, envMap: MAT.chrome.envMap});
    const grip = std(0x111112, {roughness: 0.95});
    const rubber = std(0x161616, {roughness: 0.85});
    const hub = std(0xc4c8cc, {roughness: 0.3, metalness: 0.85, envMap: MAT.chrome.envMap});
    const blk = MAT.matteBlack;

    // support : socle, berceau et montants qui enserrent les rails
    B(g, -18, 18, 0, 2, -14, 14, blk);
    B(g, -14, 14, 2, 10, -7.5, -6, blk);
    B(g, -14, 14, 2, 10, 6, 7.5, blk);
    for (const sx of [-1, 1]) B(g, sx * 13, sx * 15, 2, 46, -3, 3, blk);

    // planche : rails latéraux, plateaux, patins, boîtiers batterie / contrôleur sous le deck
    const y0 = 4,
        y1 = 74,
        yc = (y0 + y1) / 2;
    for (const sx of [-1, 1]) B(g, sx * 10, sx * 12.5, y0, y1, -2.5, 2.5, rail);
    B(g, -10, 10, y0, yc - 10, -1.5, 1.5, rail);
    B(g, -10, 10, yc + 10, y1, -1.5, 1.5, rail);
    B(g, -10, 10, y0 + 2, yc - 11, 1.5, 3, grip); // patin arrière
    B(g, -10, 10, yc + 11, y1 - 2, 1.5, 3, grip); // patin avant (capteur)
    B(g, -9, 9, y0 + 4, yc - 12, -5, -1.5, rail);
    B(g, -9, 9, yc + 12, y1 - 4, -5, -1.5, rail);
    B(g, -11.5, 11.5, y0 - 2, y0, -3, 3, rubber); // pare-chocs
    B(g, -11.5, 11.5, y1, y1 + 2, -3, 3, rubber);
    // phares : blanc à l'avant (en haut), rouge à l'arrière
    B(g, -6, 6, y1 + 0.5, y1 + 2.3, 1, 3.2, std(0xffffff, {emissive: 0xffffff, emissiveIntensity: 1.2}));
    B(g, -6, 6, y0 - 2.3, y0 - 0.5, 1, 3.2, std(0xff2a1a, {emissive: 0xff2a1a, emissiveIntensity: 0.9}));

    // roue : pneu, moyeu, garde-boue au-dessus du deck
    Cyl(g, 14.5, 14.5, 15, 0, yc, 0, rubber).rotation.z = Math.PI / 2;
    Cyl(g, 15.2, 15.2, 9, 0, yc, 0, rubber).rotation.z = Math.PI / 2;
    Cyl(g, 8.5, 8.5, 16, 0, yc, 0, hub).rotation.z = Math.PI / 2;
    const fender = new THREE.Mesh(
        new THREE.CylinderGeometry(0.168, 0.168, 0.14, 28, 1, true, -Math.PI / 2, Math.PI),
        new THREE.MeshStandardMaterial({color: 0x151515, roughness: 0.6, side: THREE.DoubleSide}),
    );
    fender.rotation.z = Math.PI / 2;
    fender.position.y = yc / 100;
    fender.castShadow = true;
    g.add(fender);
    return g;
}

// ---------- Bureau assis-debout ----------

// Plateau w x d (160 x 80), piètement noir à deux colonnes télescopiques, pieds en T.
// Réglé en position assise (plateau à 74 cm) ; `h` permet de le monter.
function standingDesk(w, d, h = 74) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        t = 2.5;
    const frame = std(0x1b1c1e, {roughness: 0.45, metalness: 0.4});
    B(g, -hw, hw, h - t, h, -hd, hd, MAT.oak); // plateau
    const lx = hw - 18; // colonnes en retrait des bords
    for (const sx of [-1, 1]) {
        const x = sx * lx;
        B(g, x - 3.5, x + 3.5, 0, 3, -hd + 6, hd - 6, frame); // pied
        for (const z of [-hd + 6, hd - 6]) B(g, x - 3.5, x + 3.5, -0.5, 0, z - 2, z + 2, frame); // patins
        B(g, x - 3.5, x + 3.5, 3, 45, -2.5, 2.5, frame); // colonne basse
        B(g, x - 3, x + 3, 45, h - t - 3, -2, 2, frame); // colonne haute
        B(g, x - 3.5, x + 3.5, h - t - 3, h - t, -hd + 10, hd - 10, frame); // bras sous plateau
    }
    B(g, -lx, lx, h - t - 6, h - t - 1, -3, 3, frame); // traverse moteur
    B(g, hw - 30, hw - 18, h - t - 2.5, h - t, hd - 6, hd - 1, frame); // boîtier de commande
    return g;
}

// ---------- Bureau : MacBook Pro + écran ----------

const screenOn = () =>
    std(0x16223a, {roughness: 0.15, emissive: 0x2c4778, emissiveIntensity: 0.55});

// MacBook Pro 14" (31,3 x 22,1 x 1,55 cm), ouvert, écran vers l'arrière, clavier côté +z.
function macbookPro(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        t = 1.55;
    const alu = std(0x3a3b3f, {roughness: 0.35, metalness: 0.7, envMap: MAT.chrome.envMap});
    B(g, -hw, hw, 0, t, -hd, hd, alu);
    B(g, -hw + 2, hw - 2, t, t + 0.05, -hd + 2.5, -hd + 12, MAT.black); // clavier
    B(g, -6.5, 6.5, t, t + 0.05, hd - 9.5, hd - 1.5, std(0x47484c, {roughness: 0.25})); // trackpad
    const lid = new THREE.Group();
    lid.position.set(0, t / 100, -hd / 100);
    lid.rotation.x = -0.3; // ouvert à ~105°
    B(lid, -hw, hw, 0, d - 0.5, -0.6, 0, alu);
    B(lid, -hw + 0.6, hw - 0.6, 0.6, d - 1.1, 0, 0.05, MAT.black);
    B(lid, -hw + 1.2, hw - 1.2, 1.4, d - 1.6, 0.05, 0.1, screenOn());
    g.add(lid);
    return g;
}

// Écran 27" (panneau 61,4 x 36,3 cm) sur pied aluminium, dalle vers +z.
function monitor27(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    const alu = std(0xb9bcc0, {roughness: 0.3, metalness: 0.8, envMap: MAT.chrome.envMap});
    B(g, -11, 11, 0, 1, -hd, -hd + 18, alu); // pied
    B(g, -3.5, 3.5, 1, 30, -hd + 2, -hd + 4.5, alu); // bras
    B(g, -hw, hw, 9, 9 + 36.3, -hd + 4.5, -hd + 7, MAT.dark); // dos + cadre
    B(g, -hw + 0.8, hw - 0.8, 9.8, 8.2 + 36.3, -hd + 7, -hd + 7.1, screenOn());
    return g;
}

// ---------- Tapis tissé en laine ----------

// Tissage plat à grosses mailles : rangs de boucles crème chinées de gris, liseré uni sur les bords.
let rugMaps = null;
function rugWeave() {
    if (rugMaps) return rugMaps;
    const S = 512; // 512 px = 40 cm
    const color = document.createElement('canvas'),
        bump = document.createElement('canvas');
    color.width = color.height = bump.width = bump.height = S;
    const g = color.getContext('2d'),
        b = bump.getContext('2d');
    g.fillStyle = '#c9c1b2';
    g.fillRect(0, 0, S, S);
    b.fillStyle = '#202020';
    b.fillRect(0, 0, S, S);
    let seed = 77;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const rowH = 8,
        loopW = 6.4;
    for (let y = 0; y < S; y += rowH) {
        const shift = (y / rowH) % 2 ? loopW / 2 : 0;
        for (let x = -loopW; x < S + loopW; x += loopW) {
            const t = r();
            // crème dominant, chiné de gris clair et de rares fils foncés
            const l = t < 0.03 ? 52 + r() * 10 : t < 0.17 ? 74 + r() * 8 : 87 + r() * 5;
            g.fillStyle = `hsl(${38 + r() * 6}, ${t < 0.17 ? 5 : 22}%, ${l}%)`;
            g.beginPath();
            g.ellipse(x + shift, y + rowH / 2, loopW * 0.48, rowH * 0.5, 0, 0, Math.PI * 2);
            g.fill();
            const v = 170 + r() * 85;
            b.fillStyle = `rgb(${v},${v},${v})`;
            b.beginPath();
            b.ellipse(x + shift, y + rowH / 2, loopW * 0.42, rowH * 0.42, 0, 0, Math.PI * 2);
            b.fill();
        }
    }
    const mk = (c, srgb) => {
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 8;
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        return t;
    };
    rugMaps = {map: mk(color, true), bumpMap: mk(bump, false)};
    return rugMaps;
}

function rug(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 1.2,
        border = 4;
    const {map, bumpMap} = rugWeave();
    const tile = 40; // cm couverts par la texture
    const weave = (rw, rd) => {
        const m = map.clone(),
            bm = bumpMap.clone();
        for (const t of [m, bm]) {
            t.needsUpdate = true;
            t.repeat.set(rw / tile, rd / tile);
        }
        return new THREE.MeshStandardMaterial({map: m, bumpMap: bm, bumpScale: 3, roughness: 1});
    };
    const body = B(g, -hw + border, hw - border, 0, h, -hd + border, hd - border, weave(w - 2 * border, d - 2 * border));
    body.castShadow = false;
    // liseré tressé un ton plus clair
    const edge = std(0xe2dccf, {roughness: 1});
    for (const [x1, x2, z1, z2] of [
        [-hw, hw, -hd, -hd + border],
        [-hw, hw, hd - border, hd],
        [-hw, -hw + border, -hd + border, hd - border],
        [hw - border, hw, -hd + border, hd - border],
    ])
        B(g, x1, x2, 0, h * 0.9, z1, z2, edge).castShadow = false;
    return g;
}

export const BUILDERS = {
    rug,
    macbookPro,
    monitor27,
    standingDesk,
    onewheelStand,
    monstera,
    tvUnit65,
    zelligeBar,
    teddy,
    sofa,
    coffeeTable,
    shelfIndustrial,
    plantTall,
    plantSmall,
    shoeRack,
    poster,
    bed,
    wardrobeGrid,
    nightstand,
    chairScandi,
    bistroTable,
    vanityWasher,
    wardrobe,
    tvStand,
    table,
    chair,
    sofaL,
    counter,
    sink,
    cooker,
    fridge,
    washer,
    toilet,
    vanity,
    bathtub,
    shower,
    radiator,
    buffet,
    plant,
};
