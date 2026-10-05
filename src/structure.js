import * as THREE from 'three';
import {walls, openings, rooms, footprint, wallTiles, balcony, landing, H_WALL, IW, IH, toWorld} from './plan.js';
import {MAT} from './furniture.js';

const std = (color, roughness = 0.9) => new THREE.MeshStandardMaterial({color, roughness});

const M = {
    wall: std(0xf4f1eb, 0.92),
    wallTop: std(0x34363b, 0.8),
    wallOut: std(0xeeede8, 0.95),
    alu: std(0x25272a, 0.45),
    frame: std(0xfbfbfa, 0.5),
    leafIn: std(0xf6f4ef, 0.45),
    leafOut: std(0x3d4045, 0.5),
    slab: std(0xc9c4bb, 0.9),
    ceiling: std(0xfafafa, 0.95),
    trunk: std(0x6b4b32, 0.9),
    rail: new THREE.MeshStandardMaterial({color: 0x3a3f46, roughness: 0.4, metalness: 0.6}),
    frosted: new THREE.MeshPhysicalMaterial({color: 0xd6ebe4, roughness: 0.6, transparent: true, opacity: 0.72, depthWrite: false}),
    screen: new THREE.MeshStandardMaterial({color: 0xd9dde0, roughness: 0.6, transparent: true, opacity: 0.85}),
    crown: new THREE.MeshStandardMaterial({color: 0x4b7d3a, roughness: 0.85, flatShading: true}),
};

const yaw = (v) => Math.atan2(-v.z, v.x);

export const rectWorld = (x1, y1, x2, y2) => {
    const a = toWorld(x1, y1),
        b = toWorld(x2, y2);
    return {minX: a.x, maxX: b.x, minZ: a.z, maxZ: b.z};
};

function planBox(x1, y1, x2, y2, h0, h1, mat) {
    const m = new THREE.Mesh(
        new THREE.BoxGeometry((x2 - x1) / 100, (h1 - h0) / 100, (y2 - y1) / 100),
        mat,
    );
    const p = toWorld((x1 + x2) / 2, (y1 + y2) / 2, (h0 + h1) / 2);
    m.position.copy(p);
    m.castShadow = mat !== MAT.glass && mat !== M.frosted;
    m.receiveShadow = true;
    return m;
}

// Plan texturé avec UV ancrées dans le monde (raccord continu d'une pièce à l'autre).
export function texturedPlane(x1, y1, x2, y2, t, hcm = 0) {
    const w = (x2 - x1) / 100,
        d = (y2 - y1) / 100;
    const geo = new THREE.PlaneGeometry(w, d);
    geo.rotateX(-Math.PI / 2);
    const c = toWorld((x1 + x2) / 2, (y1 + y2) / 2, hcm);
    const pos = geo.attributes.position,
        uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++)
        uv.setXY(i, (c.x + pos.getX(i)) / t.size, -(c.z + pos.getZ(i)) / t.size);
    const mesh = new THREE.Mesh(geo, t.material);
    mesh.position.copy(c);
    mesh.receiveShadow = true;
    return mesh;
}

// Découpe un mur en morceaux autour des ouvertures (allège + linteau).
function wallPieces(w) {
    const horiz = w.x2 - w.x1 >= w.y2 - w.y1;
    const [a0, a1] = horiz ? [w.x1, w.x2] : [w.y1, w.y2];
    const ops = openings
        .filter((o) => o.x1 < w.x2 && o.x2 > w.x1 && o.y1 < w.y2 && o.y2 > w.y1)
        .map((o) => ({o, a: Math.max(a0, horiz ? o.x1 : o.y1), b: Math.min(a1, horiz ? o.x2 : o.y2)}))
        .sort((p, q) => p.a - q.a);
    const segs = [];
    let cur = a0;
    for (const {o, a, b} of ops) {
        if (a > cur) segs.push([cur, a, 0, H_WALL]);
        if (o.bottom > 0) segs.push([a, b, 0, o.bottom]);
        segs.push([a, b, o.top, H_WALL]);
        cur = b;
    }
    if (cur < a1) segs.push([cur, a1, 0, H_WALL]);
    return segs.map(([a, b, h0, h1]) =>
        horiz ? [a, w.y1, b, w.y2, h0, h1] : [w.x1, a, w.x2, b, h0, h1],
    );
}

// Helper : rectangle exprimé en (axe du mur, épaisseur) -> plan.
const along = (horiz) => (a1, a2, t1, t2, h0, h1, mat) =>
    horiz ? planBox(a1, t1, a2, t2, h0, h1, mat) : planBox(t1, a1, t2, a2, h0, h1, mat);

function buildLeaf(L, H, style, ext, door) {
    const g = new THREE.Group();
    const add = (x1, x2, y1, y2, z1, z2, mat) => {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry((x2 - x1) / 100, (y2 - y1) / 100, (z2 - z1) / 100),
            mat,
        );
        m.position.set((x1 + x2) / 200, (y1 + y2) / 200, (z1 + z2) / 200);
        m.castShadow = mat !== MAT.glass;
        m.receiveShadow = true;
        g.add(m);
    };
    if (style === 'glass' || style === 'frosted') {
        add(0, 6, 0, H, -2.5, 2.5, M.alu);
        add(L - 6, L, 0, H, -2.5, 2.5, M.alu);
        add(6, L - 6, 0, 10, -2.5, 2.5, M.alu);
        add(6, L - 6, H - 6, H, -2.5, 2.5, M.alu);
        add(6, L - 6, 10, H - 6, -0.6, 0.6, style === 'frosted' ? M.frosted : MAT.glass);
    } else {
        add(0, L, 0, H, -2, 2, ext ? M.leafOut : M.leafIn);
    }
    for (const s of [-1, 1]) {
        add(L - 9, L - 5, 92, 112, s > 0 ? 2 : -3, s > 0 ? 3 : -2, MAT.metal);
        add(L - 16, L - 5, 103, 105, s > 0 ? 3 : -5.5, s > 0 ? 5.5 : -3, MAT.metal);
    }
    g.traverse((m) => m.isMesh && (m.userData.door = door));
    return g;
}

function buildDoor(o, group, doors, doorMeshes) {
    const horiz = o.x2 - o.x1 > o.y2 - o.y1;
    const [a1, a2] = horiz ? [o.x1, o.x2] : [o.y1, o.y2];
    const [t1, t2] = horiz ? [o.y1, o.y2] : [o.x1, o.x2];
    const mid = (t1 + t2) / 2;
    const R = along(horiz);
    const J = 4;
    const fm = o.style === 'glass' || o.style === 'frosted' ? M.alu : o.exterior ? M.leafOut : M.frame;
    group.add(R(a1, a1 + J, t1 - 1, t2 + 1, 0, o.top, fm));
    group.add(R(a2 - J, a2, t1 - 1, t2 + 1, 0, o.top, fm));
    group.add(R(a1, a2, t1 - 1, t2 + 1, o.top - J, o.top, fm));

    const door = {
        def: o,
        t: o.open ? 1 : 0,
        target: o.open ? 1 : 0,
        leaves: [],
        rect: rectWorld(o.x1, o.y1, o.x2, o.y2),
    };
    const n = o.leaves.length;
    const len = (a2 - a1 - 2 * J) / n - 3;
    const axis = horiz ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const normal = horiz ? new THREE.Vector3(0, 0, o.swing) : new THREE.Vector3(o.swing, 0, 0);
    for (const side of o.leaves) {
        const start = side === 'start';
        const ha = start ? a1 + J + 2.5 : a2 - J - 2.5;
        const pivot = new THREE.Group();
        pivot.position.copy(horiz ? toWorld(ha, mid) : toWorld(mid, ha));
        const leaf = buildLeaf(len, o.top - J - 0.5, o.style, o.exterior, door);
        leaf.traverse((m) => m.isMesh && doorMeshes.push(m));
        pivot.add(leaf);
        group.add(pivot);
        const closed = yaw(start ? axis : axis.clone().negate());
        let delta = yaw(normal) - closed;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        door.leaves.push({pivot, closed, delta});
    }
    applyDoor(door);
    doors.push(door);
}

export function applyDoor(door) {
    const t = door.t;
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    for (const l of door.leaves) l.pivot.rotation.y = l.closed + l.delta * e;
}

function buildWindow(o, group) {
    const horiz = o.x2 - o.x1 > o.y2 - o.y1;
    const [a1, a2] = horiz ? [o.x1, o.x2] : [o.y1, o.y2];
    const [t1, t2] = horiz ? [o.y1, o.y2] : [o.x1, o.x2];
    const mid = (t1 + t2) / 2;
    const R = along(horiz);
    const F = 6,
        D = 7;
    const m1 = mid - D / 2,
        m2 = mid + D / 2;
    group.add(R(a1, a1 + F, m1, m2, o.bottom, o.top, M.alu));
    group.add(R(a2 - F, a2, m1, m2, o.bottom, o.top, M.alu));
    group.add(R(a1, a2, m1, m2, o.bottom, o.bottom + F, M.alu));
    group.add(R(a1, a2, m1, m2, o.top - F, o.top, M.alu));
    if (a2 - a1 > 70) {
        const c = (a1 + a2) / 2;
        group.add(R(c - 2.5, c + 2.5, m1, m2, o.bottom + F, o.top - F, M.alu));
    }
    group.add(R(a1 + F, a2 - F, mid - 0.5, mid + 0.5, o.bottom + F, o.top - F, MAT.glass));
    group.add(R(a1 - 3, a2 + 3, t1 - 3, t2 + 3, o.bottom - 3, o.bottom, M.alu));
}

export function buildStructure(tex) {
    const group = new THREE.Group();
    const colliders = [],
        doors = [],
        doorMeshes = [];

    for (const [x1, y1, x2, y2] of footprint) group.add(planBox(x1, y1, x2, y2, -12, 0, M.slab));
    for (const room of rooms)
        for (const [x1, y1, x2, y2] of room.rects)
            group.add(texturedPlane(x1, y1, x2, y2, tex[room.floor], 0.3));

    for (const w of walls) {
        const mats = Array(6).fill(M.wall);
        mats[2] = M.wallTop;
        if (w.out != null) mats[w.out] = M.wallOut;
        for (const [x1, y1, x2, y2, h0, h1] of wallPieces(w)) {
            group.add(planBox(x1, y1, x2, y2, h0, h1, mats));
            if (h0 === 0) colliders.push(rectWorld(x1, y1, x2, y2));
        }
    }

    // faïence murale (UV recalées sur la taille de chaque plaque)
    for (const [x1, y1, x2, y2, h0, h1] of wallTiles) {
        const t = tex.wallTile;
        const map = t.tex.clone();
        map.needsUpdate = true;
        map.repeat.set(Math.max(x2 - x1, y2 - y1) / 100 / t.size, (h1 - h0) / 100 / t.size);
        group.add(planBox(x1, y1, x2, y2, h0, h1, new THREE.MeshStandardMaterial({map, roughness: 0.3})));
    }

    for (const o of openings) {
        if (o.kind === 'door') buildDoor(o, group, doors, doorMeshes);
        else buildWindow(o, group);
    }

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(IW / 100, IH / 100), M.ceiling);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.copy(toWorld(IW / 2, IH / 2, H_WALL - 0.1));
    ceiling.visible = false;

    return {group, colliders, doors, doorMeshes, ceiling};
}

const FLOOR_LEVEL = 280; // 1er étage : le terrain est 2,80 m sous le plancher

export function buildEnvironment(tex) {
    const group = new THREE.Group();
    const add = (m) => group.add(m);

    add(texturedPlane(-2500, -2500, 3200, 3200, tex.grass, -FLOOR_LEVEL));
    // volume du bâtiment sous l'appartement et sous le palier
    for (const [x1, y1, x2, y2] of footprint) add(planBox(x1, y1, x2, y2, -FLOOR_LEVEL, -12, M.wallOut));
    add(planBox(landing.x1, landing.y1, landing.x2, landing.y2, -FLOOR_LEVEL, 0, M.wallOut));
    add(texturedPlane(landing.x1, landing.y1, landing.x2, landing.y2, tex.tileDark, 0.3));

    // balcon : dalle, platelage, garde-corps, pare-vue
    const b = balcony;
    add(planBox(b.x1 - 20, b.y1, b.x2, b.y2, -18, 0, M.slab));
    add(texturedPlane(b.x1 - 20, b.y1, b.x2, b.y2, tex.deck, 0.3));
    // garde-corps : cadre noir + panneaux de verre dépoli, comme sur les photos
    const railH = 100;
    const rail = (x1, y1, x2, y2) => {
        const horiz = x2 - x1 > y2 - y1;
        const [a1, a2] = horiz ? [x1, x2] : [y1, y2];
        const mid = horiz ? (y1 + y2) / 2 : (x1 + x2) / 2;
        const R = along(horiz);
        add(R(a1, a2, mid - 2.5, mid + 2.5, railH - 4, railH, M.rail));
        add(R(a1, a2, mid - 1, mid + 1, 4, 7, M.rail));
        const n = Math.max(1, Math.round((a2 - a1) / 125));
        const step = (a2 - a1) / n;
        for (let i = 0; i <= n; i++) {
            const c = a1 + i * step;
            add(R(Math.max(a1, c - 2), Math.min(a2, c + 2), mid - 2, mid + 2, 0, railH - 4, M.rail));
        }
        add(R(a1, a2, mid - 0.4, mid + 0.4, 10, railH - 8, M.frosted));
        for (const y of [30, 52, 74]) add(R(a1, a2, mid - 0.8, mid + 0.8, y, y + 1.2, M.rail));
    };
    rail(b.x2 - 4, b.y1, b.x2, b.y2);
    rail(b.x1, b.y1, b.x2 - 4, b.y1 + 4);
    add(planBox(b.x1, b.y2 - 3, b.x2, b.y2, 0, 200, M.frosted)); // pare-vue
    add(planBox(b.x1, b.y2 - 4, b.x2, b.y2, 196, 200, M.rail));

    // sous-face du balcon de l'étage au-dessus (visible en visite seulement)
    const soffit = planBox(b.x1, b.y1, b.x2, b.y2, 270, 290, M.wallOut);
    soffit.castShadow = false;
    soffit.visible = false;
    add(soffit);

    for (const [x, y, s] of [
        [-450, -350, 1.7],
        [1250, -250, 1.9],
        [-520, 1050, 1.6],
        [1200, 1000, 1.8],
        [350, 1300, 1.5],
    ]) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 2.4 * s, 10), M.trunk);
        trunk.position.y = 1.2 * s;
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 * s, 1), M.crown);
        crown.position.y = 3 * s;
        crown.scale.y = 1.2;
        for (const m of [trunk, crown]) {
            m.castShadow = m.receiveShadow = true;
            tree.add(m);
        }
        tree.position.copy(toWorld(x, y, -FLOOR_LEVEL));
        group.add(tree);
    }
    return {group, soffit};
}
