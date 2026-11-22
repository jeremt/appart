import * as THREE from 'three';
import {walls} from './plan.js';
import {rectWorld} from './structure.js';

// Murs coupés « façon Sims » en 3D libre : les murs entre la caméra et ce qu'on regarde sont rabaissés à CUT cm
// (ce qui est accroché dessus disparaît : fenêtres, portes, faïence, étagères, cadres…).
// - murs extérieurs (`out` dans plan.js) : coupés dès que leur face extérieure regarde la caméra ;
// - cloisons (sans face extérieure) : coupées quand elles se trouvent entre la caméra et le point visé par l'orbite ;
// - gaines techniques (blocs intérieurs de moins de GAINE cm collés à un mur extérieur) : coupées avec ce mur.
// Les parties masquées passent sur le calque SHADOW_LAYER : invisibles pour la caméra et les clics, mais elles
// projettent toujours leur ombre (la lumière reste celle d'un appartement fermé).

const CUT = 30; // hauteur des murs coupés (cm)
export const SHADOW_LAYER = 1;
const PAD = 0.5; // marge (m) autour d'une cloison pour le test caméra → point visé
const GAINE = 120; // longueur max (cm) d'un bloc intérieur traité comme une gaine

// direction de la face extérieure (index de face BoxGeometry : +x, -x, +y, -y, +z, -z ; y du plan = z du monde)
const OUT_DIR = {0: [1, 0], 1: [-1, 0], 4: [0, 1], 5: [0, -1]};

function wallInfo(w) {
    const rect = rectWorld(w.x1, w.y1, w.x2, w.y2);
    const center = new THREE.Vector3((rect.minX + rect.maxX) / 2, 0, (rect.minZ + rect.maxZ) / 2);
    const d = OUT_DIR[w.out];
    return {center, rect, out: d ? new THREE.Vector3(d[0], 0, d[1]) : null, short: Math.max(w.x2 - w.x1, w.y2 - w.y1) < GAINE};
}

const overlap = (r, box, pad) =>
    Math.max(0, Math.min(r.maxX + pad, box.max.x) - Math.max(r.minX - pad, box.min.x)) *
    Math.max(0, Math.min(r.maxZ + pad, box.max.z) - Math.max(r.minZ - pad, box.min.z));

// le segment (a → b), dans le plan, traverse-t-il le rectangle élargi de `pad` ? (Liang-Barsky)
function segHitsRect(ax, az, bx, bz, r, pad) {
    let t0 = 0,
        t1 = 1;
    const dx = bx - ax,
        dz = bz - az;
    for (const [p, q] of [
        [-dx, ax - (r.minX - pad)],
        [dx, r.maxX + pad - ax],
        [-dz, az - (r.minZ - pad)],
        [dz, r.maxZ + pad - az],
    ]) {
        if (p === 0) {
            if (q < 0) return false;
        } else {
            const t = q / p;
            if (p < 0) t0 = Math.max(t0, t);
            else t1 = Math.min(t1, t);
            if (t0 > t1) return false;
        }
    }
    return true;
}

export function createCutaway({structure, items, scene}) {
    const info = walls.map(wallInfo);
    // gaines : murs extérieurs qu'elles touchent
    const touching = (a, b) => a.minX <= b.maxX + 0.02 && b.minX <= a.maxX + 0.02 && a.minZ <= b.maxZ + 0.02 && b.minZ <= a.maxZ + 0.02;
    for (const w of info) w.hosts = !w.out && w.short ? info.filter((e) => e.out && touching(w.rect, e.rect)) : [];
    // chaque mur : ses morceaux et accessoires (`parts`, rabaissés ou masqués) et les meubles qui y sont fixés
    const groups = info.map(() => ({parts: [], hide: [], items: []}));
    const box = new THREE.Box3();
    // distance (m) du centre d'une boîte au rectangle d'un mur, dans le plan
    const center = new THREE.Vector3();
    const dist = (r, bx) => {
        bx.getCenter(center);
        return Math.hypot(Math.max(r.minX - center.x, 0, center.x - r.maxX), Math.max(r.minZ - center.z, 0, center.z - r.maxZ));
    };

    // morceau rabaissé : une copie basse partage géométrie et matériaux, l'original part sur le calque des ombres
    function addPart(g, mesh) {
        box.setFromObject(mesh);
        const h0 = box.min.y * 100,
            h1 = box.max.y * 100;
        if (h0 >= CUT - 0.5) return g.hide.push(mesh);
        if (h1 <= CUT + 0.5) return; // déjà sous la coupe (plinthes…)
        const stub = new THREE.Mesh(mesh.geometry, mesh.material);
        stub.position.copy(mesh.position);
        stub.quaternion.copy(mesh.quaternion);
        stub.scale.copy(mesh.scale);
        stub.scale.y *= (CUT - h0) / (h1 - h0);
        stub.position.y += ((CUT - h0) / 2 - (h1 - h0) / 2) / 100;
        stub.castShadow = false;
        stub.receiveShadow = true;
        stub.visible = false;
        mesh.parent.add(stub);
        g.parts.push({mesh, stub});
    }

    structure.group.updateMatrixWorld(true);
    const doorMeshes = new Set(structure.doorMeshes);
    const meshes = [];
    structure.group.traverse((o) => o.isMesh && meshes.push(o)); // liste figée : les copies basses s'ajoutent au groupe
    meshes.forEach((o) => {
        if (doorMeshes.has(o) || o.userData.floor) return;
        if (o.userData.wall != null) return addPart(groups[o.userData.wall], o);
        box.setFromObject(o);
        if (box.max.y <= 0.005) return; // dalle
        // accessoire : rattaché au mur qu'il touche le plus (fenêtres, encadrements, faïence, crédence…)
        let best = -1,
            bestArea = 0;
        info.forEach((w, i) => {
            const a = overlap(w.rect, box, 0.03);
            if (a > bestArea) [best, bestArea] = [i, a];
        });
        if (best >= 0) addPart(groups[best], o);
    });
    // portes : vantaux masqués avec le mur qui porte l'ouverture
    for (const d of structure.doors) {
        const cx = (d.rect.minX + d.rect.maxX) / 2,
            cz = (d.rect.minZ + d.rect.maxZ) / 2;
        const i = info.findIndex((w) => cx >= w.rect.minX - 0.01 && cx <= w.rect.maxX + 0.01 && cz >= w.rect.minZ - 0.01 && cz <= w.rect.maxZ + 0.01);
        if (i >= 0) d.leaves.forEach((l) => l.pivot.traverse((o) => o.isMesh && groups[i].hide.push(o)));
    }

    // toutes les ombres voient aussi le calque des parties masquées
    scene.traverse((o) => o.isLight && o.shadow && o.shadow.camera.layers.enable(SHADOW_LAYER));

    const cut = info.map(() => false);
    const setLayer = (o, on) => (on ? o.layers.set(SHADOW_LAYER) : o.layers.set(0));
    function apply(i, on) {
        const g = groups[i];
        for (const {mesh, stub} of g.parts) {
            setLayer(mesh, on);
            stub.visible = on;
        }
        for (const m of g.hide) setLayer(m, on);
        for (const m of g.items) setLayer(m, on);
    }

    const BAND = 0.35; // profondeur (m) de la bande le long d'un mur où l'on cherche ce qui y est fixé

    // meubles fixés au mur (`wall: true` dans plan.js) : chaque pièce suit le mur le plus proche parmi ceux que le
    // meuble longe vraiment (≥ 60 cm dans la bande) — un meuble d'angle ne suit pas le mur qu'il touche du bout.
    // Recalculé quand les meubles bougent.
    let itemsKey = '';
    function assignItems() {
        const key = items.map((it) => JSON.stringify(it.state)).join('|');
        if (key === itemsKey) return false;
        itemsKey = key;
        for (const g of groups) {
            g.items.forEach((m) => setLayer(m, false));
            g.items = [];
        }
        for (const it of items) {
            if (!it.def.wall || it.state.deleted) continue;
            it.group.updateMatrixWorld(true);
            const parts = [];
            it.group.traverse((o) => o.isMesh && parts.push({o, b: new THREE.Box3().setFromObject(o)}));
            const near = (i, b) => overlap(info[i].rect, b, BAND) > 0;
            let valid = info
                .map((w, i) => {
                    const horiz = w.rect.maxX - w.rect.minX >= w.rect.maxZ - w.rect.minZ;
                    let lo = Infinity,
                        hi = -Infinity;
                    for (const {b} of parts)
                        if (near(i, b)) {
                            lo = Math.min(lo, horiz ? b.min.x : b.min.z);
                            hi = Math.max(hi, horiz ? b.max.x : b.max.z);
                        }
                    return hi - lo >= 0.6 ? i : -1;
                })
                .filter((i) => i >= 0);
            if (!valid.length) valid = info.map((_, i) => i); // petit objet (barre à couteaux…) : le mur le plus proche
            for (const {o, b} of parts) {
                let best = -1;
                for (const i of valid) if (best < 0 || dist(info[i].rect, b) < dist(info[best].rect, b)) best = i;
                if (best < 0 || dist(info[best].rect, b) > 0.6) continue;
                groups[best].items.push(o);
                if (cut[best]) setLayer(o, true);
            }
        }
        return true;
    }

    const tmp = new THREE.Vector3();
    // À appeler à chaque image avec la caméra et le point visé par l'orbite ; `camera` = null pour tout remettre
    // debout. Renvoie true si quelque chose a changé.
    const facing = (w, camera) => tmp.subVectors(camera.position, w.center).setY(0).dot(w.out) > 0;
    function update(camera, target) {
        let changed = camera ? assignItems() : false;
        info.forEach((w, i) => {
            let on = false;
            if (camera)
                on = w.out
                    ? facing(w, camera)
                    : w.hosts.some((e) => facing(e, camera)) ||
                      segHitsRect(camera.position.x, camera.position.z, target.x, target.z, w.rect, PAD);
            if (on !== cut[i]) {
                cut[i] = on;
                apply(i, on);
                changed = true;
            }
        });
        return changed;
    }

    return {update};
}
