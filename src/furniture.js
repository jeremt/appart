import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

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

// ---------- Bar en contreplaqué ----------

// Placage bouleau (fil horizontal, veinage doux, quelques « yeux ») et chant de contreplaqué
// (plis alternés clairs / foncés) pour les tranches visibles.
let plyMats = null;
function plywood() {
    if (plyMats) return plyMats;
    const S = 1024,
        SIZE = 1.2; // la texture couvre 1,2 x 1,2 m
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    let seed = 41;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.fillStyle = 'hsl(36, 40%, 77%)';
    g.fillRect(0, 0, S, S);
    // bandes de teinte (lés de placage)
    for (let y = 0; y < S; y += 60 + r() * 120) {
        g.fillStyle = `hsla(${32 + r() * 8}, 40%, ${70 + r() * 10}%, 0.35)`;
        g.fillRect(0, y, S, 40 + r() * 100);
    }
    // veinage : longues lignes ondulées dans le sens du fil
    for (let i = 0; i < 420; i++) {
        const y = r() * S,
            amp = 1 + r() * 4,
            ph = r() * 6;
        g.strokeStyle = `hsla(30, 35%, ${48 + r() * 18}%, ${0.08 + r() * 0.14})`;
        g.lineWidth = 0.6 + r() * 1.4;
        g.beginPath();
        for (let x = -10; x <= S + 10; x += 16) g.lineTo(x, y + Math.sin(x / (60 + amp * 20) + ph) * amp);
        g.stroke();
    }
    // petits nœuds typiques du bouleau
    for (let i = 0; i < 14; i++) {
        const x = r() * S,
            y = r() * S;
        g.fillStyle = 'rgba(110, 75, 45, 0.35)';
        g.beginPath();
        g.ellipse(x, y, 3 + r() * 4, 1.5 + r() * 1.5, 0, 0, Math.PI * 2);
        g.fill();
    }
    const veneerMap = new THREE.CanvasTexture(c);
    veneerMap.colorSpace = THREE.SRGBColorSpace;
    veneerMap.wrapS = veneerMap.wrapT = THREE.RepeatWrapping;
    veneerMap.repeat.set(1 / SIZE, 1 / SIZE);
    veneerMap.anisotropy = 8;

    // chant : 9 plis sur 18 mm, motif répété verticalement
    const e = document.createElement('canvas');
    e.width = 64;
    e.height = 256;
    const eg = e.getContext('2d');
    const plies = 9;
    for (let i = 0; i < plies; i++) {
        eg.fillStyle = i % 2 ? 'hsl(34, 38%, 62%)' : 'hsl(38, 42%, 82%)';
        eg.fillRect(0, (i * 256) / plies, 64, 256 / plies);
        eg.fillStyle = 'rgba(80, 55, 30, 0.35)';
        eg.fillRect(0, ((i + 1) * 256) / plies - 1.5, 64, 1.5);
    }
    const edgeMap = new THREE.CanvasTexture(e);
    edgeMap.colorSpace = THREE.SRGBColorSpace;

    plyMats = {
        veneer: new THREE.MeshStandardMaterial({map: veneerMap, roughness: 0.55}),
        edge: new THREE.MeshStandardMaterial({map: edgeMap, roughness: 0.7}),
    };
    return plyMats;
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

// Meuble bar : adossé au mur par son extrémité +x, arrondi à l'autre bout, habillé de contreplaqué bouleau,
// étagères ouvertes côté cuisine (-z) et plan de travail inox débordant.
function plywoodBar(w, d) {
    const g = new THREE.Group(),
        h = 105,
        top = 3,
        over = 2.5,
        R = 13,
        m = (v) => v / 100;
    const {veneer, edge} = plywood();
    const inox = new THREE.MeshStandardMaterial({color: 0xd2d5d8, metalness: 1, roughness: 0.3, envMap: MAT.chrome.envMap});
    const bw = w - over, // le caisson est en retrait du plan sauf côté mur
        bd = d - 2 * over,
        bx = -over / 2;
    const cav = {depth: 30, endLeft: R + 4, endRight: 3};
    const plinth = prism(g, barShape(m(bw - 2), m(bd - 2), m(R - 1)), 0, 6, std(0x5b5650, {roughness: 0.8}));
    plinth.position.x = m(bx);
    const body = prism(g, barShape(m(bw), m(bd), m(R), {depth: m(cav.depth), endLeft: m(cav.endLeft), endRight: m(cav.endRight)}), 6, h - top, veneer);
    body.position.x = m(bx);
    prism(g, barShape(m(w), m(d), m(R + 1)), h - top, h, inox);
    // niche : fond et étagères en contreplaqué, chants à plis visibles côté cuisine (-z)
    const xa = bx - bw / 2 + cav.endLeft,
        xb = bx + bw / 2 - cav.endRight,
        zBack = -bd / 2,
        zIn = -bd / 2 + cav.depth;
    B(g, xa, xb, 6, h - top, zIn - 1, zIn, veneer);
    for (const y of [6, 37, 68]) {
        B(g, xa, xb, y, y + 1.8, zBack + 0.2, zIn - 1, veneer);
        B(g, xa, xb, y, y + 1.8, zBack, zBack + 0.2, edge);
    }
    // chant à plis sous le plan inox, tout autour du caisson
    // (UV de l'extrusion en mètres : on étire le motif pour que les 9 plis tiennent sur 1,8 cm)
    const band = edge.clone();
    band.map = edge.map.clone();
    band.map.wrapS = band.map.wrapT = THREE.RepeatWrapping;
    band.map.repeat.set(20, 1 / 0.018);
    band.map.needsUpdate = true;
    prism(g, barShape(m(bw + 0.2), m(bd + 0.2), m(R + 0.1)), h - top - 1.8, h - top, band).position.x = m(bx);
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

// ---------- Grille murale de cuisine ----------

// Grille en fil inox fixée au mur (dos en -z) : ustensiles suspendus en haut,
// panier à épices au milieu, poêles et casseroles accrochées en bas.
function kitchenGrid(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    const steel = std(0x9ea3a8, {metalness: 0.9, roughness: 0.35, envMap: MAT.chrome.envMap});
    const wood = std(0xb88a5a, {roughness: 0.6});
    const y0 = 50,
        y1 = 200,
        zg = -hd + 2; // plan de la grille, 2 cm devant le mur

    // grille : fils fusionnés en un seul maillage
    const wires = [];
    const wire = (x1, x2, ya, yb, z1, z2) => {
        const geo = new THREE.BoxGeometry((x2 - x1) / 100, (yb - ya) / 100, (z2 - z1) / 100);
        geo.translate((x1 + x2) / 200, (ya + yb) / 200, (z1 + z2) / 200);
        wires.push(geo);
    };
    for (let x = -hw; x <= hw + 0.01; x += 5) wire(x - 0.2, x + 0.2, y0, y1, zg - 0.2, zg + 0.2);
    for (let y = y0; y <= y1 + 0.01; y += 5) wire(-hw, hw, y - 0.2, y + 0.2, zg + 0.2, zg + 0.6);
    for (const x of [-hw, hw]) wire(x - 0.5, x + 0.5, y0, y1, zg - 0.5, zg + 0.6);
    for (const y of [y0, y1]) wire(-hw, hw, y - 0.5, y + 0.5, zg - 0.5, zg + 0.6);
    for (const [x, y] of [[-hw + 4, y1 - 4], [hw - 4, y1 - 4], [-hw + 4, y0 + 4], [hw - 4, y0 + 4]]) wire(x - 1, x + 1, y - 1, y + 1, -hd, zg); // pattes de fixation
    const grid = new THREE.Mesh(mergeGeometries(wires), steel);
    grid.castShadow = grid.receiveShadow = true;
    g.add(grid);

    const hook = (x, y) => B(g, x - 0.25, x + 0.25, y - 3, y + 1, zg + 0.5, zg + 2.5, steel);

    // --- haut : ustensiles sur crochets en S ---
    const yh = y1 - 8;
    const tools = [
        (x) => {
            // pince
            const a = B(g, -0.6, 0.6, yh - 32, yh, zg + 2, zg + 2.6, steel);
            a.position.x = (x - 1.2) / 100;
            a.rotation.z = 0.06;
            const b = B(g, -0.6, 0.6, yh - 32, yh, zg + 2.7, zg + 3.3, steel);
            b.position.x = (x + 1.2) / 100;
            b.rotation.z = -0.06;
        },
        (x) => {
            // louche
            B(g, x - 0.6, x + 0.6, yh - 26, yh, zg + 2, zg + 2.6, steel);
            const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steel);
            bowl.material.side = THREE.DoubleSide;
            bowl.rotation.x = -Math.PI / 2;
            bowl.position.set(x / 100, (yh - 30) / 100, (zg + 3) / 100);
            bowl.castShadow = true;
            g.add(bowl);
        },
        (x) => {
            // fouet
            Cyl(g, 0.8, 0.8, 12, x, yh - 6, zg + 3, steel);
            for (let k = 0; k < 4; k++) {
                const loop = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.0015, 4, 20), steel);
                loop.scale.y = 2.6;
                loop.rotation.y = (k * Math.PI) / 4;
                loop.position.set(x / 100, (yh - 19) / 100, (zg + 3) / 100);
                g.add(loop);
            }
        },
        (x) => {
            // spatule ajourée, manche bois
            B(g, x - 0.9, x + 0.9, yh - 16, yh, zg + 2, zg + 3, wood);
            B(g, x - 0.4, x + 0.4, yh - 22, yh - 16, zg + 2.3, zg + 2.7, steel);
            B(g, x - 4, x + 4, yh - 33, yh - 22, zg + 2.3, zg + 2.7, steel);
        },
        (x) => {
            // écumoire
            B(g, x - 0.6, x + 0.6, yh - 24, yh, zg + 2, zg + 2.6, steel);
            const s = Cyl(g, 4.2, 4.2, 0.6, x, yh - 28, zg + 2.6, steel, true);
            s.scale.y = 1.25;
        },
        (x) => {
            // cuillère en bois
            B(g, x - 0.7, x + 0.7, yh - 24, yh, zg + 2, zg + 3, wood);
            const s = Cyl(g, 2.6, 2.6, 0.8, x, yh - 27, zg + 2.6, wood, true);
            s.scale.y = 1.5;
        },
        (x) => {
            // brosse
            B(g, x - 0.8, x + 0.8, yh - 14, yh, zg + 2, zg + 3, wood);
            B(g, x - 1.8, x + 1.8, yh - 22, yh - 14, zg + 1.8, zg + 3.6, wood);
            B(g, x - 1.5, x + 1.5, yh - 23, yh - 14, zg + 3.6, zg + 5.2, std(0x3b2a1c, {roughness: 1}));
        },
    ];
    tools.forEach((t, i) => {
        const x = -hw + 7 + (i * (w - 14)) / (tools.length - 1);
        hook(x, yh + 2);
        t(x);
    });

    // --- milieu : panier grillagé avec bocaux d'épices ---
    const yb = 122,
        bz1 = zg + 0.6,
        bz2 = zg + 11;
    B(g, -hw + 4, hw - 4, yb, yb + 0.6, bz1, bz2, steel);
    B(g, -hw + 4, hw - 4, yb + 7, yb + 7.6, bz2 - 0.6, bz2, steel);
    B(g, -hw + 4, hw - 4, yb + 3.5, yb + 4, bz2 - 0.6, bz2, steel);
    for (const x of [-hw + 4, hw - 4]) B(g, x - 0.3, x + 0.3, yb, yb + 8, bz1, bz2, steel);
    const spices = [0xc2571d, 0x8e2b1c, 0x7a5a2e, 0x5f7330, 0xd99a2b, 0x9b3a2a, 0x6a4e3a];
    spices.forEach((c, i) => {
        const x = -hw + 9 + i * ((w - 18) / (spices.length - 1));
        Cyl(g, 2.6, 2.6, 9, x, yb + 5.1, zg + 6, MAT.glass);
        Cyl(g, 2.4, 2.4, 7, x, yb + 4.2, zg + 6, std(c, {roughness: 0.9}));
        Cyl(g, 2.7, 2.7, 1.6, x, yb + 10.3, zg + 6, MAT.matteBlack);
    });

    // --- bas : poêles et casseroles inox à manches laiton, suspendues par le manche ---
    const inox = std(0xd4d7da, {metalness: 0.95, roughness: 0.22, envMap: MAT.chrome.envMap});
    const brass = std(0xc9a25a, {metalness: 0.9, roughness: 0.35, envMap: MAT.chrome.envMap});
    // cuve en révolution : fond plat, bords évasés (poêle) ou droits (casserole), ouverte vers +z
    const vessel = (r, depth, flare) => {
        const pts = [];
        const rb = r - flare;
        pts.push(new THREE.Vector2(0, 0));
        for (let i = 0; i <= 8; i++) {
            const t = i / 8;
            pts.push(new THREE.Vector2((rb + (r - rb) * Math.pow(t, 0.7)) / 100, (depth * t) / 100));
        }
        pts.push(new THREE.Vector2((r + 0.4) / 100, depth / 100)); // lèvre roulée
        const geo = new THREE.LatheGeometry(pts, 40);
        const m = new THREE.Mesh(geo, inox);
        m.material.side = THREE.DoubleSide;
        m.rotation.x = Math.PI / 2; // axe de révolution vers +z : intérieur face à la pièce
        m.castShadow = m.receiveShadow = true;
        return m;
    };
    // manche laiton effilé avec trou de suspension et deux rivets
    const handle = (p, len, z) => {
        const h = Cyl(p, 0.75, 1.15, len, 0, -len / 2, z, brass);
        h.castShadow = true;
        const eye = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.004, 8, 16), brass);
        eye.position.set(0, 0, z / 100);
        p.add(eye);
    };
    const yp = 114;
    const pan = (x, r, depth, tilt = 0) => {
        const p = new THREE.Group();
        const zb = zg + 2.5; // le fond touche presque la grille
        const body = vessel(r, depth, r * 0.22);
        body.position.set(0, -(r + 20) / 100, zb / 100);
        p.add(body);
        handle(p, 20, zb + depth * 0.7);
        for (const sx of [-1, 1]) {
            const rv = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), inox);
            rv.position.set((sx * 1.4) / 100, -(20.5) / 100, (zb + depth * 0.7) / 100);
            p.add(rv);
        }
        p.position.set(x / 100, yp / 100, 0);
        p.rotation.z = tilt;
        g.add(p);
        hook(x, yp + 2);
    };
    pan(-hw + 15, 14, 4.5, 0.04); // poêle 28 cm
    pan(-hw + 37, 12, 4, -0.03); // poêle 24 cm
    pan(hw - 13, 10, 3.5, 0.05); // poêle 20 cm

    // casserole et faitout dans le panier du bas
    const yc = y0 + 1;
    B(g, -hw + 4, hw - 4, yc, yc + 0.6, bz1, zg + 18, steel);
    B(g, -hw + 4, hw - 4, yc + 6, yc + 6.6, zg + 17.4, zg + 18, steel);
    const pot = (x, r, depth, withLid) => {
        const v = vessel(r, depth, 0.3);
        v.rotation.x = 0; // posée à plat, ouverture vers le haut
        v.position.set(x / 100, (yc + 0.6) / 100, (zg + 9) / 100);
        g.add(v);
        const hh = B(g, x + r - 1, x + r + 15, yc + depth - 2.2, yc + depth - 0.8, zg + 8.3, zg + 9.7, brass);
        hh.castShadow = true;
        if (withLid) {
            Cyl(g, r + 0.3, r + 0.3, 0.6, x, yc + depth + 1.2, zg + 9, inox);
            Cyl(g, 1.6, 2, 1.6, x, yc + depth + 2.3, zg + 9, brass);
        }
    };
    pot(-hw + 14, 9, 12, true); // casserole
    pot(hw - 26, 8, 10, false);
    return g;
}

// ---------- Lampadaire arc ----------

// Lampadaire arc : socle rond en marbre noir (centré sur l'emprise), mât inox brossé
// qui monte puis décrit un arc vers l'avant (+z) jusqu'à un abat-jour demi-sphère.
function arcLamp(w, d, reach = 140) {
    const g = new THREE.Group();
    const inox = std(0xb5b8bb, {metalness: 0.9, roughness: 0.38, envMap: MAT.chrome.envMap});
    const marble = std(0x161718, {roughness: 0.2});
    const r = Math.min(w, d) / 2;
    Cyl(g, r, r, 4, 0, 2, 0, marble);
    // mât : vertical jusqu'à 110 cm puis arc (courbe de Bézier) culminant vers 205 cm
    const m = (x, y, z) => new THREE.Vector3(x / 100, y / 100, z / 100);
    const curve = new THREE.CurvePath();
    curve.add(new THREE.LineCurve3(m(0, 4, 0), m(0, 110, 0)));
    curve.add(new THREE.CubicBezierCurve3(m(0, 110, 0), m(0, 205, 5), m(0, 225, reach * 0.45), m(0, 185, reach)));
    const pole = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.011, 10), inox);
    pole.castShadow = true;
    g.add(pole);
    Cyl(g, 1.6, 1.6, 4, 0, 108, 0, inox); // bague de réglage
    // abat-jour : demi-sphère ouverte vers le bas, intérieur blanc lumineux
    const shadeR = 0.19;
    const shade = new THREE.Mesh(new THREE.SphereGeometry(shadeR, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), inox);
    shade.position.set(0, 1.6, reach / 100);
    shade.castShadow = true;
    g.add(shade);
    const inner = new THREE.Mesh(
        new THREE.SphereGeometry(shadeR - 0.004, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xfff1d6, emissiveIntensity: 0.6, side: THREE.BackSide}),
    );
    inner.position.copy(shade.position);
    g.add(inner);
    Cyl(g, 1.2, 1.2, 25, 0, 172, reach, inox); // tige entre arc et abat-jour
    // lumière chaude vers le bas
    const light = new THREE.SpotLight(0xffd9a0, 6, 4, Math.PI / 3.2, 0.7, 1.5);
    light.position.set(0, 1.58, reach / 100);
    light.target.position.set(0, 0, reach / 100);
    g.add(light, light.target);
    return g;
}

// ---------- Balcon : guirlande et plantes ----------

const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function foliage(g, x, y, z, r, mat, sy = 0.75) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(r / 100, 1), mat);
    f.position.set(x / 100, y / 100, z / 100);
    f.scale.y = sy;
    f.castShadow = f.receiveShadow = true;
    g.add(f);
    return f;
}

// Guirlande guinguette : câble en festons accroché à 2,35 m le long de l'axe x, ampoules globe.
// Les ampoules s'allument (et éclairent) en mode nuit.
function stringLights(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        H = 235,
        sag = 22,
        swags = 4;
    const hookY = (x) => {
        const t = ((x + hw) / w) * swags; // position dans les festons
        const u = t - Math.floor(t);
        return H - sag * (1 - (2 * u - 1) ** 2);
    };
    const pts = [];
    for (let i = 0; i <= 160; i++) {
        const x = -hw + (i / 160) * w;
        pts.push(new THREE.Vector3(x / 100, hookY(x) / 100, 0));
    }
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.002, 4), MAT.matteBlack);
    g.add(cable);
    for (let i = 0; i <= swags; i++) B(g, -hw + (i * w) / swags - 0.4, -hw + (i * w) / swags + 0.4, H - 1, H + 4, -0.5, 0.5, MAT.metal); // crochets
    // ampoules multicolores (couleurs en alternance), éteintes le jour, vives la nuit
    const palette = [0xff3b3b, 0xffc21a, 0x2fd36b, 0x2f8bff, 0xff7a1a, 0xd14bff];
    const bulbs = palette.map((c) => {
        const m = std(c, {roughness: 0.2, emissive: c, emissiveIntensity: 0.12, transparent: true, opacity: 0.9});
        m.userData.night = 1.1; // assez faible pour garder la couleur après tone mapping
        return m;
    });
    const n = Math.floor(w / 24);
    for (let i = 0; i < n; i++) {
        const x = -hw + 12 + i * ((w - 24) / (n - 1));
        const y = hookY(x);
        Cyl(g, 0.6, 0.6, 3, x, y - 1.5, 0, MAT.matteBlack);
        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), bulbs[i % bulbs.length]);
        globe.position.set(x / 100, (y - 5.5) / 100, 0);
        g.add(globe);
    }
    // quelques sources réelles réparties le long de la guirlande (nuit seulement)
    for (let i = 0; i < 4; i++) {
        const x = -hw + w * (0.125 + i * 0.25);
        const light = new THREE.PointLight([0xffb27a, 0xffd0f0, 0xc8e0ff, 0xfff0a0][i], 1.6, 4, 1.5);
        light.position.set(x / 100, (hookY(x) - 8) / 100, 0);
        light.userData.nightOnly = true;
        light.visible = false;
        g.add(light);
    }
    return g;
}

// Olivier en pot béton.
function oliveTree(w, d) {
    const g = new THREE.Group(),
        r = Math.min(w, d) / 2;
    const rnd = seeded(31);
    const concrete = std(0xa9a8a3, {roughness: 0.95});
    const bark = std(0x6b5a48, {roughness: 1});
    const leaves = new THREE.MeshStandardMaterial({color: 0x75876a, roughness: 0.8, flatShading: true});
    Cyl(g, r * 0.95, r * 0.75, 45, 0, 22.5, 0, concrete);
    Cyl(g, r * 0.85, r * 0.85, 1, 0, 44, 0, std(0x3a2a1e, {roughness: 1}));
    const m = (x, y, z) => new THREE.Vector3(x / 100, y / 100, z / 100);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([m(0, 44, 0), m(3, 80, 1), m(-2, 110, 2), m(1, 125, 0)]), 20, 0.022, 8), bark);
    trunk.castShadow = true;
    g.add(trunk);
    for (let i = 0; i < 11; i++) {
        const a = rnd() * Math.PI * 2,
            rr = 8 + rnd() * 18;
        foliage(g, Math.cos(a) * rr, 115 + rnd() * 50, Math.sin(a) * rr, 11 + rnd() * 7, leaves, 0.7);
    }
    return g;
}

// Jardinière accrochée au garde-corps (face avant +z vers le balcon) avec lavande.
function railPlanter(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    const rnd = seeded(7 + Math.round(w));
    const box = std(0x3b3d40, {roughness: 0.7});
    B(g, -hw, hw, 0, 17, -hd + 2, hd, box);
    B(g, -hw + 1, hw - 1, 15, 16, -hd + 3, hd - 1, std(0x3a2a1e, {roughness: 1}));
    for (const x of [-hw + 10, hw - 10]) {
        B(g, x - 1, x + 1, 10, 30, -hd, -hd + 2, MAT.matteBlack); // crochets sur la main courante
        B(g, x - 1, x + 1, 28, 30, -hd - 6, -hd, MAT.matteBlack);
    }
    const stem = std(0x7d8f63, {roughness: 0.8});
    const flower = std(0x8a6fc0, {roughness: 0.7});
    const base = new THREE.MeshStandardMaterial({color: 0x8fa07c, roughness: 0.85, flatShading: true});
    for (let i = 0; i < 4; i++) foliage(g, -hw + 9 + i * ((w - 18) / 3), 20, 1, 8, base, 0.6);
    for (let i = 0; i < 34; i++) {
        const x = -hw + 4 + rnd() * (w - 8),
            z = -hd + 5 + rnd() * (d - 9),
            h = 16 + rnd() * 14;
        const s = Cyl(g, 0.25, 0.3, h, x, 16 + h / 2, z, stem);
        s.rotation.z = (rnd() - 0.5) * 0.4;
        s.rotation.x = (rnd() - 0.5) * 0.4;
        const tip = Cyl(g, 0.9, 0.6, 5, 0, h / 2, 0, flower);
        g.remove(tip);
        s.add(tip);
        tip.position.set(0, (h / 2 + 1) / 100, 0);
    }
    return g;
}

// Petit pot d'aromatique en terre cuite : feuillage en touffes.
function herbPot(g, x, y, z, r, color, rnd) {
    const terracotta = std(0xb8613a, {roughness: 0.8});
    const mat = new THREE.MeshStandardMaterial({color, roughness: 0.8, flatShading: true});
    Cyl(g, r, r * 0.75, r * 1.6, x, y + r * 0.8, z, terracotta);
    Cyl(g, r + 0.6, r + 0.6, 2, x, y + r * 1.6 - 1, z, terracotta);
    for (let k = 0; k < 6; k++) foliage(g, x + (rnd() - 0.5) * r, y + r * 1.6 + 3 + rnd() * r * 0.8, z + (rnd() - 0.5) * r, r * 0.45 + rnd() * r * 0.3, mat, 0.9);
}

// Petite étagère d'angle en teck à deux niveaux, garnie d'aromatiques et d'un arrosoir.
function herbShelf(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 72;
    const rnd = seeded(23);
    const teak = std(0x9a6a43, {roughness: 0.7});
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
            const x = sx * (hw - 2),
                z = sz * (hd - 2);
            B(g, x - 2, x + 2, 0, h, z - 2, z + 2, teak);
        }
    // plateaux à lattes
    for (const y of [25, h - 3]) {
        const n = 5,
            sw = d / n;
        for (let i = 0; i < n; i++) B(g, -hw, hw, y, y + 2.5, -hd + i * sw + 0.4, -hd + (i + 1) * sw - 0.4, teak);
    }
    // basilic, romarin, thym, persil, menthe
    const top = h - 0.5;
    herbPot(g, -hw + 10, top, -2, 7.5, 0x4f8f3a, rnd);
    herbPot(g, 1, top, 2, 6.5, 0x50663f, rnd);
    herbPot(g, hw - 9, top, -3, 6, 0x6c7d4e, rnd);
    herbPot(g, -hw + 12, 27.5, 0, 7, 0x3f8a3c, rnd);
    herbPot(g, 6, 27.5, -2, 6.5, 0x5ea64a, rnd);
    // arrosoir en zinc au sol
    const zinc = std(0x9aa2a6, {metalness: 0.6, roughness: 0.4, envMap: MAT.chrome.envMap});
    Cyl(g, 7, 8, 18, hw - 9, 9, 4, zinc);
    const spout = Cyl(g, 0.8, 1.4, 20, hw - 9 + 9, 16, 4, zinc);
    spout.rotation.z = -0.9;
    return g;
}

// Couleur de la collection bistrot (vert sauge laqué).
const bistroColor = () => std(0x6f9483, {roughness: 0.45, metalness: 0.3});

// Tube droit entre deux points (cm), rayon r.
function rod(g, a, b, r, mat) {
    const A = new THREE.Vector3(...a).divideScalar(100),
        Bv = new THREE.Vector3(...b).divideScalar(100);
    const dir = Bv.clone().sub(A);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r / 100, r / 100, dir.length(), 10), mat);
    m.position.copy(A).add(Bv).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
}

// Table bistrot pliante : plateau rond en tôle laquée à rebord, pieds tubulaires en croix.
function bistroTableRound(w, d) {
    const g = new THREE.Group(),
        r = Math.min(w, d) / 2,
        h = 74;
    const lac = bistroColor();
    Cyl(g, r, r, 1, 0, h - 0.5, 0, lac);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r / 100, 0.01, 8, 48), lac);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = (h - 1.2) / 100;
    g.add(rim);
    // 4 pieds : partent sous le plateau près du centre et s'écartent jusqu'au sol
    const top = r * 0.3,
        foot = r * 0.62;
    for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + Math.PI / 4;
        const c = Math.cos(a),
            sn = Math.sin(a);
        rod(g, [c * top, h - 1, sn * top], [c * foot, 0, sn * foot], 0.9, lac);
    }
    // anneau de rigidité à mi-hauteur
    const ringY = 28,
        ringR = top + (foot - top) * (1 - ringY / (h - 1));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR / 100, 0.006, 6, 32), lac);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ringY / 100;
    g.add(ring);
    // déco : bougie et petit pot
    Cyl(g, 3.5, 3.5, 7, -8, h + 3.5, 4, std(0xf3efe6, {roughness: 0.9}));
    Cyl(g, 4.5, 3.5, 8, 9, h + 4, -6, std(0xb8613a, {roughness: 0.8}));
    foliage(g, 9, h + 11, -6, 5, new THREE.MeshStandardMaterial({color: 0x4f8f3a, roughness: 0.8, flatShading: true}));
    return g;
}

// Chaise bistrot pliante (face avant +z) : deux cadres latéraux tubulaires, assise à lattes
// transversales, dossier à deux lattes cintrées fixées sur les montants arrière inclinés.
function bistroChair(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        sh = 45, // hauteur d'assise
        top = 88; // haut du dossier
    const lac = bistroColor();
    const lacDS = new THREE.MeshStandardMaterial({color: 0x6f9483, roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide});
    const xs = hw - 2.5; // écartement des cadres
    // montant arrière incliné vers l'arrière : z(y) = zRear0 - lean * y / top
    const zRear0 = -hd + 9,
        lean = 8;
    const zRear = (y) => zRear0 - (lean * y) / top;
    const zFront = hd - 3;
    for (const sx of [-1, 1]) {
        const x = sx * xs;
        rod(g, [x, 0, zRear0], [x, top, zRear(top)], 0.9, lac); // pied arrière + montant de dossier
        rod(g, [x, 0, zFront], [x, sh - 1, zFront - 1], 0.9, lac); // pied avant
        rod(g, [x, sh - 1.5, zFront - 1], [x, sh - 1.5, zRear(sh)], 0.8, lac); // longeron d'assise
    }
    // entretoises basses avant / arrière
    rod(g, [-xs, 14, zFront - 0.3], [xs, 14, zFront - 0.3], 0.6, lac);
    rod(g, [-xs, 14, zRear(14)], [xs, 14, zRear(14)], 0.6, lac);
    // assise : lattes transversales (selon x), légèrement bombées
    const n = 6,
        z0 = zRear(sh) + 1.5,
        z1 = zFront + 0.5;
    for (let i = 0; i < n; i++) {
        const zc = z0 + ((i + 0.5) * (z1 - z0)) / n;
        const bump = Math.sin(((i + 0.5) / n) * Math.PI) * 0.6;
        B(g, -xs - 0.8, xs + 0.8, sh - 1 + bump, sh + 0.2 + bump, zc - 2.4, zc + 2.4, lac);
    }
    // dossier : deux lattes cintrées (creuses vers l'avant) passant par les montants
    const R = 32,
        half = Math.asin((xs + 0.6) / R);
    for (const y of [69, 81]) {
        const zp = zRear(y);
        const slat = new THREE.Mesh(new THREE.CylinderGeometry(R / 100, R / 100, 0.075, 28, 1, true, Math.PI - half, 2 * half), lacDS);
        // le centre de l'arc est devant : les extrémités tombent sur les montants (x = ±xs, z = zp)
        slat.position.set(0, y / 100, (zp + Math.sqrt(R * R - (xs + 0.6) ** 2)) / 100);
        slat.castShadow = true;
        g.add(slat);
    }
    return g;
}

// Trois pots d'aromatiques en terre cuite (basilic, romarin, thym).
function herbPots(w, d) {
    const g = new THREE.Group(),
        hw = w / 2;
    const rnd = seeded(11);
    const terracotta = std(0xb8613a, {roughness: 0.8});
    const greens = [0x4f8f3a, 0x50663f, 0x6c7d4e].map((c) => new THREE.MeshStandardMaterial({color: c, roughness: 0.8, flatShading: true}));
    greens.forEach((mat, i) => {
        const x = -hw + 10 + i * ((w - 20) / 2),
            r = 9 - i;
        Cyl(g, r, r * 0.75, 16, x, 8, 0, terracotta);
        Cyl(g, r + 0.6, r + 0.6, 2.5, x, 15.5, 0, terracotta);
        for (let k = 0; k < 6; k++) foliage(g, x + (rnd() - 0.5) * r, 20 + rnd() * 8, (rnd() - 0.5) * r, 4 + rnd() * 3, mat, 0.9);
    });
    return g;
}

// ---------- Étagères murales ----------

// Tablette flottante en chêne fixée au mur (dos en -z), à la hauteur y (cm).
function floatingShelf(g, w, d, y, mat = MAT.oak) {
    B(g, -w / 2, w / 2, y - 3, y, -d / 2, d / 2, mat);
}

// Rangée de livres posés sur une tablette, de x0 à x1 (cm) ; renvoie la position x atteinte.
function books(g, x0, x1, y, zBack, rnd) {
    const colors = [0xb5563a, 0x2f3e5c, 0xd9a43a, 0x7c8f6b, 0xe8e0cf, 0x1d1d1f, 0x9b3d4f, 0x5d7f95, 0xc9b79c];
    let x = x0;
    while (x < x1 - 2) {
        const bw = 1.8 + rnd() * 2.8,
            bh = 17 + rnd() * 9,
            bd = 14 + rnd() * 5;
        if (x + bw > x1) break;
        const c = colors[Math.floor(rnd() * colors.length)];
        B(g, x, x + bw, y, y + bh, zBack, zBack + bd, std(c, {roughness: 0.8}));
        x += bw + 0.15;
    }
    return x;
}

// Plante tombante (pothos) : pot blanc, lianes qui débordent de la tablette et retombent.
function trailingPlant(g, x, y, zFront, rnd) {
    Cyl(g, 7, 5.5, 11, x, y + 5.5, zFront - 9, std(0xf1eee8, {roughness: 0.35}));
    const leafGeo = new THREE.SphereGeometry(0.022, 8, 6);
    leafGeo.scale(1, 0.25, 1.25);
    const leaves = [];
    const vines = 7;
    for (let v = 0; v < vines; v++) {
        const a = (v / vines) * Math.PI - Math.PI * 0.05 + rnd() * 0.2; // vers l'avant (+z)
        const spread = (Math.cos(a) * 14) / 100;
        const drop = 25 + rnd() * 45;
        const m = (px, py, pz) => new THREE.Vector3(px, py, pz);
        const pts = [
            m(x / 100, (y + 11) / 100, (zFront - 9) / 100),
            m(x / 100 + spread * 0.6, (y + 13) / 100, (zFront - 2) / 100),
            m(x / 100 + spread, (y + 4) / 100, (zFront + 3) / 100),
            m(x / 100 + spread * 1.2, (y - drop * 0.5) / 100, (zFront + 4) / 100),
            m(x / 100 + spread * 1.1 + (rnd() - 0.5) * 0.06, (y - drop) / 100, (zFront + 3) / 100),
        ];
        const curve = new THREE.CatmullRomCurve3(pts);
        const vine = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.0025, 4), std(0x5f7d3a));
        g.add(vine);
        const n = 10 + Math.floor(drop / 6);
        for (let i = 1; i <= n; i++) {
            const p = curve.getPoint(i / (n + 1));
            const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 1.2 - 0.6, rnd() * Math.PI * 2, rnd() * 0.8 - 0.4));
            const s = 0.7 + rnd() * 0.6;
            leaves.push(new THREE.Matrix4().compose(p, q, new THREE.Vector3(s, s, s)));
        }
    }
    const inst = new THREE.InstancedMesh(leafGeo, std(0x4c8a35, {roughness: 0.5}), leaves.length);
    leaves.forEach((mtx, i) => inst.setMatrixAt(i, mtx));
    inst.castShadow = true;
    g.add(inst);
}

// Petite lampe champignon colorée, allumée la nuit.
function mushroomLamp(g, x, y, z, color) {
    const lac = std(color, {roughness: 0.3});
    Cyl(g, 5, 5.5, 1.2, x, y + 0.6, z, lac);
    Cyl(g, 0.9, 1.2, 14, x, y + 8, z, lac);
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), lac);
    shade.position.set(x / 100, (y + 14) / 100, z / 100);
    shade.castShadow = true;
    g.add(shade);
    const glow = std(0xfff1d8, {emissive: 0xffd9a0, emissiveIntensity: 0.25, side: THREE.BackSide});
    glow.userData.night = 2;
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.082, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), glow);
    inner.position.copy(shade.position);
    g.add(inner);
    const light = new THREE.PointLight(0xffc98a, 1.2, 2.5, 1.6);
    light.position.set(x / 100, (y + 12) / 100, z / 100);
    light.userData.nightOnly = true;
    light.visible = false;
    g.add(light);
}

// Deux tablettes au-dessus du canapé : livres, lampe champignon, pothos.
function sofaShelves(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2;
    const rnd = seeded(91);
    const yA = 112,
        yB = 152;
    floatingShelf(g, w, d, yA);
    floatingShelf(g, w, d, yB);
    // tablette basse : livres à gauche, pile couchée, pothos à droite
    let x = books(g, -hw + 4, -hw + 70, yA, -hd + 2, rnd);
    for (let i = 0; i < 4; i++) B(g, x + 4, x + 26 - i * 1.5, yA + i * 3.2, yA + (i + 1) * 3.2 - 0.2, -hd + 3, -hd + 19 - i, std([0xe8e0cf, 0x2f3e5c, 0xb5563a, 0x7c8f6b][i], {roughness: 0.8}));
    trailingPlant(g, hw - 22, yA, hd, rnd);
    // tablette haute : lampe colorée à gauche, livres, vase
    mushroomLamp(g, -hw + 16, yB, -2, 0xe8692e);
    books(g, -hw + 40, hw - 30, yB, -hd + 2, rnd);
    Cyl(g, 4, 3, 16, hw - 14, yB + 8, -1, std(0x3a3d41, {roughness: 0.5}));
    return g;
}

// Grès émaillé moucheté (beige ou noir) : texture de petites taches.
const speckleMats = {};
function stoneware(kind) {
    if (speckleMats[kind]) return speckleMats[kind];
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = kind === 'black' ? '#1f1e1d' : '#d8ccb6';
    g.fillRect(0, 0, 256, 256);
    let seed = kind === 'black' ? 3 : 9;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 900; i++) {
        g.fillStyle = kind === 'black' ? `rgba(200,190,170,${0.15 + r() * 0.3})` : `rgba(70,50,35,${0.25 + r() * 0.5})`;
        g.beginPath();
        g.arc(r() * 256, r() * 256, 0.4 + r() * 1.3, 0, Math.PI * 2);
        g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    speckleMats[kind] = new THREE.MeshStandardMaterial({map: t, roughness: kind === 'black' ? 0.55 : 0.4, side: THREE.DoubleSide});
    return speckleMats[kind];
}

// Bol en révolution (rayon r, hauteur h) posé en (x, y, z).
function bowl(g, x, y, z, r, h, mat) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        pts.push(new THREE.Vector2((r * 0.45 + r * 0.55 * Math.sin((t * Math.PI) / 2)) / 100, (h * t) / 100));
    }
    const m = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), ...pts], 28), mat);
    m.position.set(x / 100, y / 100, z / 100);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
}

// Pile d'assiettes à bord relevé.
function plates(g, x, y, z, r, n, mat) {
    for (let i = 0; i < n; i++) {
        const pts = [new THREE.Vector2(0, 0), new THREE.Vector2((r * 0.7) / 100, 0), new THREE.Vector2(r / 100, 0.012), new THREE.Vector2(r / 100, 0.016)];
        const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), mat);
        m.position.set(x / 100, (y + i * 1.6) / 100, z / 100);
        m.castShadow = m.receiveShadow = true;
        g.add(m);
    }
}

// Étagère murale de l'entrée : grès beige et noir (assiettes, bols, tasses).
function stonewareShelf(w, d) {
    const g = new THREE.Group(),
        hw = w / 2;
    const y = 150;
    floatingShelf(g, w, d, y);
    const beige = stoneware('beige'),
        black = stoneware('black');
    plates(g, -hw + 13, y, -1, 11, 5, beige);
    plates(g, -hw + 13, y + 8, -1, 9, 3, black);
    bowl(g, -hw + 36, y, 0, 7, 6, black);
    bowl(g, -hw + 36, y + 3.2, 0, 7, 6, beige);
    bowl(g, -hw + 36, y + 6.4, 0, 7, 6, black);
    bowl(g, hw - 30, y, -1, 8, 7, beige);
    bowl(g, hw - 30, y + 3.6, -1, 8, 7, beige);
    for (const [x, mat] of [[hw - 13, black], [hw - 7, beige]]) {
        Cyl(g, 3.6, 3.2, 8.5, x, y + 4.25, 3, mat);
    }
    return g;
}

// ---------- Colonnes de rangement ----------

// Lampe en papier type Akari : lanterne ovoïde nervurée sur un pied métal, s'allume la nuit.
function paperLamp(g, x, y, z, r = 9, h = 24) {
    const paper = std(0xf6f1e6, {roughness: 0.9, emissive: 0xffe4b8, emissiveIntensity: 0.06, side: THREE.DoubleSide});
    paper.userData.night = 1.6;
    const pts = [];
    for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        pts.push(new THREE.Vector2((r * Math.sin(Math.PI * (0.08 + t * 0.84))) / 100, (h * t) / 100));
    }
    const shade = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), paper);
    shade.position.set(x / 100, (y + 3) / 100, z / 100);
    g.add(shade);
    for (let i = 1; i < 8; i++) {
        const t = i / 8;
        const rr = r * Math.sin(Math.PI * (0.08 + t * 0.84));
        const rib = new THREE.Mesh(new THREE.TorusGeometry(rr / 100, 0.0015, 4, 32), std(0xe6dccb));
        rib.rotation.x = Math.PI / 2;
        rib.position.set(x / 100, (y + 3 + h * t) / 100, z / 100);
        g.add(rib);
    }
    for (const a of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) rod(g, [x, y, z], [x + Math.cos(a) * 5, y + 3, z + Math.sin(a) * 5], 0.25, MAT.matteBlack);
    const light = new THREE.PointLight(0xffd29a, 1, 2.2, 1.6);
    light.position.set(x / 100, (y + 3 + h / 2) / 100, z / 100);
    light.userData.nightOnly = true;
    light.visible = false;
    g.add(light);
}

// Boîte de rangement (tissu ou kraft) avec poignée découpée en façade (+z).
function storageBox(g, x0, x1, y, z0, z1, h, color) {
    B(g, x0, x1, y, y + h, z0, z1, std(color, {roughness: 0.95}));
    B(g, (x0 + x1) / 2 - 4, (x0 + x1) / 2 + 4, y + h - 7, y + h - 4.5, z1, z1 + 0.2, MAT.dark);
}

// Colonne ouverte chêne / métal noir : boîtes en bas, plante au milieu, lampe en papier en haut.
function storageColumn(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 180;
    for (const sx of [-1, 1])
        for (const sz of [-1, 1]) B(g, sx * hw - (sx > 0 ? 2 : 0), sx * hw + (sx < 0 ? 2 : 0), 0, h, sz * hd - (sz > 0 ? 2 : 0), sz * hd + (sz < 0 ? 2 : 0), MAT.blackMetal);
    const levels = [4, 40, 76, 112, 148, h - 2];
    for (const y of levels) B(g, -hw + 0.5, hw - 0.5, y, y + 2, -hd + 0.5, hd - 0.5, MAT.oak);
    B(g, -hw + 2, hw - 2, levels[0] + 2, h - 2, -hd, -hd + 0.6, MAT.oak); // fond
    // boîtes de rangement (lin beige et kraft)
    storageBox(g, -hw + 2.5, hw - 2.5, 6, -hd + 2, hd - 3, 27, 0xcdbfa6);
    storageBox(g, -hw + 2.5, hw - 2.5, 42, -hd + 2, hd - 3, 27, 0xa37a50);
    // plante au milieu
    const rnd = seeded(57);
    herbPot(g, 0, 78, 0, 8, 0x3f7f3a, rnd);
    // lampe en papier
    paperLamp(g, 0, 114, 0, 10, 26);
    // dessus : deux livres et une petite boîte
    B(g, -hw + 3, -hw + 20, h, h + 3, -hd + 4, hd - 6, std(0x2f3e5c, {roughness: 0.8}));
    B(g, -hw + 4, -hw + 19, h + 3, h + 5.5, -hd + 5, hd - 7, std(0xe8e0cf, {roughness: 0.8}));
    return g;
}

// Colonne de salle de bain blanche : porte en bas, niches ouvertes avec serviettes et papier.
function bathColumn(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 180;
    const white = MAT.gloss;
    B(g, -hw, hw, 0, h, -hd, -hd + 1.5, white); // fond
    for (const sx of [-1, 1]) B(g, sx > 0 ? hw - 1.8 : -hw, sx > 0 ? hw : -hw + 1.8, 0, h, -hd, hd, white); // côtés
    for (const y of [8, 82, 118, 152, h - 2]) B(g, -hw, hw, y - 1.8, y, -hd, hd, white);
    B(g, -hw, hw, 0, 8, -hd + 2, hd - 2, MAT.dark); // socle
    B(g, -hw + 0.3, hw - 0.3, 8.3, 80, hd - 1.8, hd, white); // porte
    B(g, hw - 5, hw - 3.5, 55, 75, hd, hd + 1.5, MAT.metal);
    // serviettes roulées (deux niveaux)
    const towel = [0xe9e3d6, 0xb9a88e, 0xe9e3d6];
    for (let i = 0; i < 3; i++) {
        const x = -hw + 7 + i * ((w - 14) / 2);
        Cyl(g, 5.5, 5.5, d - 6, x, 82 + 5.5, 1, std(towel[i], {roughness: 1}), true);
    }
    B(g, -hw + 3, hw - 3, 118, 128, -hd + 3, hd - 4, std(0xb9a88e, {roughness: 1})); // serviettes pliées
    B(g, -hw + 4, hw - 4, 128, 136, -hd + 4, hd - 5, std(0xe9e3d6, {roughness: 1}));
    // rouleaux de papier toilette
    for (const [x, y] of [[-8, 152], [4, 152], [-2, 162]]) Cyl(g, 5.5, 5.5, 10, x, y + 5, 0, std(0xfbfbf8, {roughness: 1}));
    return g;
}

// ---------- Table basse rehaussable Matika (Maisons du Monde) ----------

// Tube rectangulaire (section a x b cm) entre deux points (cm), orienté pour que b soit horizontal.
function beam(g, p, q, a, b, mat) {
    const A = new THREE.Vector3(...p).divideScalar(100),
        Q = new THREE.Vector3(...q).divideScalar(100);
    const dir = Q.clone().sub(A);
    const m = new THREE.Mesh(new THREE.BoxGeometry(b / 100, dir.length(), a / 100), mat);
    m.position.copy(A).add(Q).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
}

// Matika L120 : plateau bois massif clair 120 x 80, piètement ciseaux en acier noir.
// Dimensions fiche produit en position basse : 120 x 80 x 49 cm.
function matikaTable(w, d) {
    const g = new THREE.Group(),
        hw = w / 2,
        hd = d / 2,
        h = 49,
        t = 4; // épaisseur du plateau
    const wood = plywood().veneer.clone();
    wood.color.set(0xf2d9b4);
    wood.roughness = 0.6;
    B(g, -hw, hw, h - t, h, -hd, hd, wood);
    const steel = std(0x1c1d1f, {roughness: 0.5, metalness: 0.4});
    // deux ciseaux parallèles (avant / arrière) dans le sens de la longueur
    const fx = hw - 22, // demi-écartement des pieds au sol
        tx = hw - 34, // demi-écartement sous le plateau
        yTop = h - t - 2.5;
    for (const z of [-hd + 16, hd - 16]) {
        beam(g, [-fx, 2.5, z], [tx, yTop, z], 4, 2.2, steel); // branche montante →
        beam(g, [fx, 2.5, z + (z > 0 ? -3 : 3)], [-tx, yTop, z + (z > 0 ? -3 : 3)], 4, 2.2, steel); // ← décalée
        B(g, -fx - 3, fx + 3, 0, 3, z - 2, z + 2, steel); // patin au sol
        B(g, -tx - 3, tx + 3, yTop, yTop + 2.5, z - 2, z + 2, steel); // rail sous plateau
        Cyl(g, 2.2, 2.2, 1.6, fx + 3, 2.2, z, MAT.dark, true); // roulette
    }
    // traverses entre les deux ciseaux
    beam(g, [-fx, 1.5, -hd + 16], [-fx, 1.5, hd - 16], 3, 3, steel);
    beam(g, [0, yTop / 2 + 1.5, -hd + 16], [0, yTop / 2 + 1.5, hd - 16], 2.5, 2.5, steel);
    // déco : photophore en verre ambré
    Cyl(g, 5, 5, 11, 12, h + 5.5, -6, std(0xd9b54a, {roughness: 0.1, transparent: true, opacity: 0.75}));
    return g;
}

// ---------- Tabourets empilables IKEA KYRRE (604.169.25) ----------

// KYRRE : assise triangulaire arrondie en contreplaqué bouleau (34 x 35 cm), 3 pieds en bois
// cintré qui partent des angles ; 42 x 48 x 45 cm au sol (fiche IKEA). Empilés en tournant
// chaque tabouret de 60° : les pieds du tabouret du dessus passent au droit des côtés de celui du dessous.
const KYRRE_R0 = 17.5; // rayon moyen de l'assise (cm)
const kyrreRadius = (theta) => KYRRE_R0 * (1 + 0.18 * Math.cos(3 * theta));

function kyrreStool(rotation) {
    const g = new THREE.Group();
    const {veneer, edge} = plywood();
    // assise : contour triangulaire arrondi, chant à plis visible
    const s = new THREE.Shape();
    const N = 72;
    for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2;
        const r = kyrreRadius(t) / 100;
        // repère de la forme : x = x monde, y = -z monde
        const x = Math.sin(t) * r,
            y = -Math.cos(t) * r;
        i ? s.lineTo(x, y) : s.moveTo(x, y);
    }
    const band = edge.clone();
    band.map = edge.map.clone();
    band.map.wrapS = band.map.wrapT = THREE.RepeatWrapping;
    band.map.repeat.set(6, 1 / 0.02);
    band.map.needsUpdate = true;
    const seatGeo = new THREE.ExtrudeGeometry(s, {depth: 0.02, bevelEnabled: false, curveSegments: 1});
    seatGeo.rotateX(-Math.PI / 2);
    const seat = new THREE.Mesh(seatGeo, [veneer, band]);
    seat.position.y = 0.43;
    seat.castShadow = seat.receiveShadow = true;
    g.add(seat);

    // pieds : lame de contreplaqué 4,5 x 1,8 cm, horizontale sous l'assise puis cintrée vers le sol
    const strip = new THREE.Shape();
    strip.moveTo(-0.009, -0.0225);
    strip.lineTo(0.009, -0.0225);
    strip.lineTo(0.009, 0.0225);
    strip.lineTo(-0.009, 0.0225);
    strip.closePath();
    for (let k = 0; k < 3; k++) {
        const t = (k * Math.PI * 2) / 3; // angles de l'assise
        const dir = (r, y) => new THREE.Vector3((Math.sin(t) * r) / 100, y / 100, (Math.cos(t) * r) / 100);
        const path = new THREE.CatmullRomCurve3([dir(9, 42.1), dir(15, 42.1), dir(19.2, 40.8), dir(20.6, 37), dir(22.6, 18), dir(24.2, 0.5)]);
        const leg = new THREE.Mesh(new THREE.ExtrudeGeometry(strip, {steps: 40, bevelEnabled: false, extrudePath: path}), veneer);
        leg.castShadow = leg.receiveShadow = true;
        g.add(leg);
    }
    g.rotation.y = rotation;
    return g;
}

// Pile de n tabourets KYRRE (5 cm de décalage vertical par tabouret, rotation alternée de 60°).
function kyrreStack(w, d, n = 4) {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
        const st = kyrreStool(i % 2 ? Math.PI / 3 : 0);
        st.position.y = (i * 5) / 100;
        g.add(st);
    }
    return g;
}

export const BUILDERS = {
    kyrreStack,
    matikaTable,
    storageColumn,
    bathColumn,
    sofaShelves,
    stonewareShelf,
    herbShelf,
    bistroTableRound,
    bistroChair,
    stringLights,
    oliveTree,
    railPlanter,
    herbPots,
    arcLamp,
    kitchenGrid,
    rug,
    macbookPro,
    monitor27,
    standingDesk,
    onewheelStand,
    monstera,
    tvUnit65,
    plywoodBar,
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
