import * as THREE from 'three';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';

// Outil de mesure « façon Mesures de l'iPhone » : un point A, un point B, la distance s'affiche.
// - en Plan 2D : distance horizontale (au sol), points arrondis au centimètre ;
// - en 3D libre / visite : distance réelle entre les deux points touchés (murs, meubles, sol…),
//   avec le détail horizontal / vertical quand le segment est incliné.
// Les mesures restent affichées (dans toutes les vues) jusqu'à ce qu'on les efface.

const COLOR = 0xf59e0b;
const SNAP_PX = 14; // aimantation sur les extrémités des mesures existantes (pixels écran)
const FLAT_Y = 0.005; // hauteur des mesures prises en plan (au ras du sol)

const fmt = (cm) => `${Math.round(cm)} cm`;

function cssObject(className, html = '') {
    const el = document.createElement('div');
    el.className = className;
    el.innerHTML = html;
    return new CSS2DObject(el);
}

export function createMeasureTool({scene, onChange}) {
    const group = new THREE.Group();
    scene.add(group);

    const solid = new LineMaterial({color: COLOR, linewidth: 3, depthTest: false, transparent: true});
    const dashed = new LineMaterial({
        color: COLOR,
        linewidth: 2.5,
        depthTest: false,
        transparent: true,
        dashed: true,
        dashSize: 0.06,
        gapSize: 0.04,
    });
    const mats = [solid, dashed];

    function makeLine(mat) {
        const line = new Line2(new LineGeometry().setPositions([0, 0, 0, 0, 0, 0]), mat);
        line.renderOrder = 30;
        line.frustumCulled = false;
        return line;
    }
    function setLine(line, a, b) {
        line.geometry.setPositions([a.x, a.y, a.z, b.x, b.y, b.z]);
        if (line.material.dashed) line.computeLineDistances();
    }

    function labelHtml(a, b, flat, removable) {
        const d = a.distanceTo(b) * 100;
        let html = `<b>${fmt(d)}</b>`;
        if (!flat) {
            const v = Math.abs(b.y - a.y) * 100,
                h = Math.hypot(b.x - a.x, b.z - a.z) * 100;
            if (v >= 2 && h >= 2) html += `<small>↔ ${fmt(h)} · ↕ ${fmt(v)}</small>`;
        }
        if (removable) html += `<button class="m-del" title="Supprimer cette mesure" aria-label="Supprimer">×</button>`;
        return html;
    }

    const measures = []; // {a, b, flat, line, dots, label}
    let pending = null; // {a, flat, dot}
    let active = false;

    // aperçu : point survolé + segment pointillé depuis A
    const hoverDot = cssObject('m-dot m-hover');
    const previewLine = makeLine(dashed);
    const previewLabel = cssObject('m-label live');
    hoverDot.visible = previewLine.visible = previewLabel.visible = false;
    group.add(hoverDot, previewLine, previewLabel);

    function addMeasure(a, b, flat) {
        const line = makeLine(solid);
        setLine(line, a, b);
        const dots = [a, b].map((p) => {
            const d = cssObject('m-dot');
            d.position.copy(p);
            return d;
        });
        const label = cssObject('m-label', labelHtml(a, b, flat, true));
        label.position.copy(a).lerp(b, 0.5);
        const m = {a, b, flat, line, dots, label};
        label.element.querySelector('.m-del').addEventListener('click', (e) => {
            e.stopPropagation();
            remove(m);
        });
        label.element.addEventListener('pointerdown', (e) => e.stopPropagation());
        group.add(line, ...dots, label);
        measures.push(m);
    }

    function remove(m) {
        const k = measures.indexOf(m);
        if (k < 0) return;
        measures.splice(k, 1);
        group.remove(m.line, ...m.dots, m.label); // retire aussi les éléments HTML
        m.line.geometry.dispose();
        onChange();
    }

    function clearPending() {
        if (!pending) return;
        group.remove(pending.dot);
        pending = null;
        previewLine.visible = previewLabel.visible = false;
    }

    // contraintes appliquées au point visé : aimantation puis axe (Maj)
    function constrain(p, {flat, axis, cam, size}) {
        p = p.clone();
        if (flat) {
            p.x = Math.round(p.x * 100) / 100;
            p.z = Math.round(p.z * 100) / 100;
            p.y = FLAT_Y;
        }
        // aimantation sur les extrémités existantes (et sur A)
        if (cam && size) {
            const toScreen = (v) => {
                const s = v.clone().project(cam);
                return [(s.x * size.w) / 2, (s.y * size.h) / 2, s.z];
            };
            const [px, py] = toScreen(p);
            let best = SNAP_PX;
            const ends = measures.flatMap((m) => [m.a, m.b]);
            if (pending) ends.push(pending.a);
            for (const e of ends) {
                const [ex, ey, ez] = toScreen(e);
                if (ez > 1) continue; // derrière la caméra
                const d = Math.hypot(ex - px, ey - py);
                if (d < best) {
                    best = d;
                    p.copy(e);
                    if (flat) p.y = FLAT_Y;
                }
            }
        }
        // Maj : segment contraint sur l'axe dominant (horizontal X / Z ou vertical)
        if (axis && pending) {
            const a = pending.a,
                d = p.clone().sub(a);
            const ax = Math.abs(d.x),
                ay = flat ? 0 : Math.abs(d.y),
                az = Math.abs(d.z);
            if (ax >= ay && ax >= az) p.set(p.x, a.y, a.z);
            else if (az >= ay) p.set(a.x, a.y, p.z);
            else p.set(a.x, p.y, a.z);
        }
        return p;
    }

    return {
        group,
        get active() {
            return active;
        },
        get count() {
            return measures.length;
        },
        get pending() {
            return !!pending;
        },
        setActive(on) {
            active = on;
            if (!on) {
                clearPending();
                hoverDot.visible = false;
            }
            onChange();
        },
        // point survolé (null = rien sous le curseur)
        hover(p, opts) {
            if (!p) {
                if (!hoverDot.visible && !previewLine.visible) return null;
                hoverDot.visible = previewLine.visible = previewLabel.visible = false;
                onChange();
                return null;
            }
            const flat = pending ? pending.flat : opts.flat;
            p = constrain(p, {...opts, flat});
            hoverDot.position.copy(p);
            hoverDot.visible = true;
            if (pending) {
                setLine(previewLine, pending.a, p);
                previewLabel.element.innerHTML = labelHtml(pending.a, p, flat, false);
                previewLabel.position.copy(pending.a).lerp(p, 0.5);
                previewLine.visible = previewLabel.visible = true;
            }
            onChange();
            return p;
        },
        // clic : pose A, puis B (la mesure est alors figée)
        click(p, opts) {
            if (!p) return;
            const flat = pending ? pending.flat : opts.flat;
            p = constrain(p, {...opts, flat});
            if (!pending) {
                const dot = cssObject('m-dot');
                dot.position.copy(p);
                group.add(dot);
                pending = {a: p, flat, dot};
            } else {
                if (p.distanceTo(pending.a) > 0.002) addMeasure(pending.a, p, flat);
                clearPending();
            }
            onChange();
        },
        // Échap : annule le point A en cours ; renvoie false s'il n'y avait rien à annuler
        cancel() {
            if (!pending) return false;
            clearPending();
            onChange();
            return true;
        },
        undoLast() {
            if (pending) return this.cancel();
            const m = measures.at(-1);
            if (m) remove(m);
            return !!m;
        },
        clear() {
            clearPending();
            for (const m of [...measures]) remove(m);
            onChange();
        },
        setResolution(w, h) {
            for (const m of mats) m.resolution.set(w, h);
        },
    };
}
