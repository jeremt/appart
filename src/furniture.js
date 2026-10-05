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

function kitchenBase(g, w, d) {
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
    B(g, -hw, hw, 87, 90, -hd, hd + 1, MAT.counter);
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
    kitchenBase(g, w, d);
    B(g, -24, 24, 90, 90.4, -hd + 9, hd - 7, MAT.steel);
    B(g, -21, 21, 90.4, 90.6, -hd + 12, hd - 10, MAT.dark);
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
    Cyl(g, 2.5, 2.5, 0.4, -hw + 18, 17.2, 0, MAT.steel);
    B(g, -9, 9, 72, 78, -hd - 1, -hd + 4, MAT.metal);
    B(g, -1.2, 1.2, 70, 72.5, -hd + 2, -hd + 12, MAT.metal);
    Cyl(g, 1.2, 1.2, 100, 30, 130, -hd + 2, MAT.metal);
    Cyl(g, 7, 7, 1.5, 30, 181, -hd + 10, MAT.metal).rotation.x = 0.3;
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
    B(g, -hw, hw, top - 4, top, -hd, hd, MAT.gloss);
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
    // vasque intégrée + mitigeur
    const cx = (x1 + hw) / 2;
    B(g, cx - 18, cx + 18, top, top + 0.3, -hd + 12, hd - 6, MAT.counter);
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

export const BUILDERS = {
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
