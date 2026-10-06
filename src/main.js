import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {PointerLockControls} from 'three/addons/controls/PointerLockControls.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {furnitureDefs, rooms, dimensions, walkable, spawn as spawnPoint, toWorld, toPlan} from './plan.js';
import {BUILDERS, MAT} from './furniture.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';

RectAreaLightUniformsLib.init(); // requis pour les rubans LED (RectAreaLight)
import {buildStructure, buildEnvironment, applyDoor} from './structure.js';
import {makeTextures} from './textures.js';
import {FloorReflection, HQPipeline, halton} from './render.js';

const $ = (s) => document.querySelector(s);
const viewport = $('#viewport');

// ---------- Rendu ----------
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
// tone mapping « Khronos PBR Neutral » : couleurs fidèles, hautes lumières moins brûlées qu'ACES
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 0.95;
viewport.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
viewport.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe2f1);
// contraste réduit : soleil moins dur, plus de lumière d'ambiance (ciel + environnement, voir plus bas)
const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x8a7a66, 0.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3e0, 1.7);
sun.position.set(6, 14, 8);
sun.castShadow = true;
// ombres douces : carte 2048 + gros rayon de filtrage = pénombre de ~15 cm
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 7;
sun.shadow.intensity = 0.85; // les ombres ne sont jamais totalement noires (lumière rebondie)
Object.assign(sun.shadow.camera, {left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50});
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun);

// environnement « pièce blanche » : éclairage d'ambiance diffus (lumière rebondie) et reflets
// doux sur tous les matériaux, en plus des chromes
const roomEnv = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
MAT.chrome.envMap = roomEnv;
scene.environment = roomEnv;
scene.environmentIntensity = 0.5;

const tex = makeTextures(renderer);
const structure = buildStructure(tex);
const env = buildEnvironment(tex);
scene.add(structure.group, structure.ceiling, env.group);

// ---------- Rendu haute qualité (option « HD ») ----------
renderer.shadowMap.autoUpdate = false; // carte d'ombre recalculée une seule fois par image (voir la boucle)
const floorRefl = new FloorReflection(renderer);
floorRefl.attach(tex.tileLight.material, {strength: 0.24, blur: 2.5});
floorRefl.attach(tex.tileDark.material, {strength: 0.3, blur: 2.5});
scene.traverse((o) => o.userData.floor && floorRefl.hidden.push(o));
floorRefl.shown.push(structure.ceiling, env.soffit);
const pipeline = new HQPipeline(renderer, scene);
const HQ_KEY = 'appart3d:hq';
let hq = true;
try {
    hq = localStorage.getItem(HQ_KEY) !== '0';
} catch {}
// toute modification visible relance l'accumulation progressive
function markDirty() {
    pipeline.reset();
}

// ---------- Meubles ----------
const furnRoot = new THREE.Group();
scene.add(furnRoot);

function resolve(def) {
    const rot = def.rot ?? 0;
    if (def.r) {
        const [x1, y1, x2, y2] = def.r;
        const quarter = Math.abs(rot) % 180 === 90;
        return {
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2,
            w: quarter ? y2 - y1 : x2 - x1,
            d: quarter ? x2 - x1 : y2 - y1,
            rot,
        };
    }
    return {x: def.c[0], y: def.c[1], w: def.size[0], d: def.size[1], rot};
}

const items = furnitureDefs.map((def) => {
    const {x, y, w, d, rot} = resolve(def);
    const group = BUILDERS[def.type](w, d);
    const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
    const item = {def, group, w, d, h: Math.round(size.y * 100), initial: {x, y, rot, deleted: false}};
    item.state = {...item.initial};
    group.userData.item = item;
    // modèle chargé en asynchrone : on recalcule hauteur, collisions et sélection une fois prêt
    group.userData.onLoad = () => {
        item.h = Math.round(new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3()).y * 100);
        collidersDirty = true;
        if (selected === item) updateSelection();
        scheduleReflections();
    };
    return item;
});

function applyState(item) {
    markDirty();
    const p = toWorld(item.state.x, item.state.y);
    item.group.position.set(p.x, (item.def.elev ?? 0) / 100, p.z); // `elev` : posé sur un meuble
    item.group.rotation.y = THREE.MathUtils.degToRad(item.state.rot);
    if (item.state.deleted) furnRoot.remove(item.group);
    else furnRoot.add(item.group);
}

const STORE = 'appart3d:berenice:v1';
function save() {
    try {
        // `init` mémorise la position d'origine : si elle change dans le code, l'ancienne sauvegarde est ignorée
        localStorage.setItem(
            STORE,
            JSON.stringify(Object.fromEntries(items.map((i) => [i.def.id, {...i.state, init: JSON.stringify(i.initial)}]))),
        );
    } catch {}
}
try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved)
        for (const i of items) {
            const st = saved[i.def.id];
            if (st && st.init === JSON.stringify(i.initial)) {
                const {init, ...rest} = st;
                i.state = {...i.state, ...rest};
            }
        }
} catch {}
items.forEach(applyState);

// ---------- Annulation ----------
const undoStack = [];
const snapshot = () => items.map((i) => ({...i.state}));
function commit(before) {
    undoStack.push(before);
    if (undoStack.length > 100) undoStack.shift();
    afterChange();
}
function afterChange() {
    save();
    collidersDirty = true;
    if (selected?.state.deleted) select(null);
    updateSelection();
    renderTrash();
    scheduleReflections();
}
function undo() {
    const s = undoStack.pop();
    if (!s) return;
    items.forEach((it, k) => {
        it.state = {...s[k]};
        applyState(it);
    });
    afterChange();
}
function change(fn) {
    const before = snapshot();
    fn();
    items.forEach(applyState);
    commit(before);
}

// ---------- Étiquettes & cotes ----------
const roomLabels = [];
const dimObjects = [];
const dimLines = new THREE.Group();
scene.add(dimLines);

function makeLabel(html, cls, x, y, h) {
    const el = document.createElement('div');
    el.className = cls;
    el.innerHTML = html;
    const o = new CSS2DObject(el);
    o.position.copy(toWorld(x, y, h));
    scene.add(o);
    return o;
}

for (const room of rooms) {
    const [x1, y1, x2, y2] = room.rects[0] ?? [];
    const [lx, ly] = room.label ?? [(x1 + x2) / 2, (y1 + y2) / 2];
    const area = room.area;
    roomLabels.push(
        makeLabel(
            `<b>${room.name}</b><span>${area.toFixed(2).replace('.', ',')} m²</span><span class="hsp">HSP 250 cm</span>`,
            'room-label' + (room.small ? ' small' : ''),
            lx,
            ly,
            10,
        ),
    );
}

const lineMat = new THREE.LineBasicMaterial({color: 0x1e293b, depthTest: false});
for (const [x1, y1, x2, y2] of dimensions) {
    const horiz = y1 === y2;
    const len = Math.round(horiz ? x2 - x1 : y2 - y1);
    const T = 8;
    const pts = [
        [x1, y1, x2, y2],
        horiz ? [x1, y1 - T, x1, y1 + T] : [x1 - T, y1, x1 + T, y1],
        horiz ? [x2, y2 - T, x2, y2 + T] : [x2 - T, y2, x2 + T, y2],
    ].flatMap(([a, b, c, d]) => [toWorld(a, b, 255), toWorld(c, d, 255)]);
    const seg = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
    seg.renderOrder = 10;
    dimLines.add(seg);
    dimObjects.push(
        makeLabel(`<span class="${horiz ? '' : 'v'}">${len} cm</span>`, 'dim-label', (x1 + x2) / 2, (y1 + y2) / 2, 255),
    );
}

// ---------- Caméras & contrôles ----------
const persp = new THREE.PerspectiveCamera(50, 1, 0.05, 300);
persp.position.set(7, 10, 11);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
ortho.position.set(0, 40, 0.001);
const fpsCam = new THREE.PerspectiveCamera(70, 1, 0.05, 300);

const orbit = new OrbitControls(persp, renderer.domElement);
orbit.enableDamping = true;
orbit.maxPolarAngle = Math.PI * 0.495;
orbit.minDistance = 1.5;
orbit.maxDistance = 45;

const planCtl = new OrbitControls(ortho, renderer.domElement);
planCtl.enableRotate = false;
planCtl.screenSpacePanning = true;
planCtl.mouseButtons = {LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN};
planCtl.touches = {ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN};
planCtl.minZoom = 0.4;
planCtl.maxZoom = 10;

const fps = new PointerLockControls(fpsCam, document.body);
let fpsSpawned = false;
function spawn() {
    fpsCam.position.copy(toWorld(spawnPoint.x, spawnPoint.y, 165));
    fpsCam.rotation.set(0, -Math.PI / 2, 0);
    fpsSpawned = true;
}

let mode = 'plan';
const showLabels = {plan: true, orbit: false};
const activeCam = () => (mode === 'plan' ? ortho : mode === 'orbit' ? persp : fpsCam);

const MODES_HELP = 'Changer de vue à tout moment : <kbd>1</kbd> Plan · <kbd>2</kbd> 3D libre · <kbd>3</kbd> Visite · <kbd>N</kbd> jour / nuit';
const HELP = {
    plan: `<b>Plan 2D</b> — glisser : déplacer la vue · <kbd>Espace</kbd> + glisser : déplacer la vue même sur un meuble · molette : zoom<br>Clic sur un meuble : sélection · glisser : déplacer · <kbd>R</kbd> pivoter 90° (<kbd>⇧R</kbd> 15°) · <kbd>Suppr</kbd> supprimer · flèches : ajuster<br>Double-clic sur une porte : ouvrir / fermer<br>${MODES_HELP}`,
    orbit: `<b>3D libre</b> — clic gauche : tourner · <kbd>Espace</kbd> + glisser ou clic droit : déplacer la vue · molette : zoom<br>Glisser un meuble pour le déplacer · <kbd>R</kbd> pivoter · <kbd>Suppr</kbd> supprimer<br>Double-clic sur une porte : ouvrir / fermer<br>${MODES_HELP}`,
    fps: `<b>Visite</b> — <kbd>ZQSD</kbd>/<kbd>WASD</kbd> se déplacer · <kbd>Maj</kbd> courir · <kbd>E</kbd> ou clic : porte · <kbd>Échap</kbd> libérer la souris<br>${MODES_HELP}`,
};

function setMode(m) {
    markDirty();
    mode = m;
    orbit.enabled = m === 'orbit';
    planCtl.enabled = m === 'plan';
    structure.ceiling.visible = m === 'fps';
    fixtures.visible = m === 'fps';
    env.soffit.visible = m === 'fps';
    document.querySelectorAll('#modes button').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
    $('#opt-labels').disabled = m === 'fps';
    $('#opt-labels').checked = m !== 'fps' && showLabels[m];
    $('#help').innerHTML = HELP[m];
    if (m === 'fps') {
        select(null);
        if (!fpsSpawned) spawn();
        $('#fps-overlay').hidden = false;
    } else {
        if (fps.isLocked) fps.unlock();
        $('#fps-overlay').hidden = true;
        $('#crosshair').hidden = $('#hint').hidden = true;
    }
    updateLabelVisibility();
    setSpacePan(false);
    renderer.domElement.style.cursor = '';
}

// Espace maintenu : le clic gauche déplace la vue (main) au lieu de tourner / saisir un meuble.
let spacePan = false;
function setSpacePan(on) {
    on = on && mode !== 'fps';
    if (spacePan === on) return;
    spacePan = on;
    orbit.mouseButtons.LEFT = on ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
    renderer.domElement.style.cursor = on ? 'grab' : '';
}

$('#btn-help').addEventListener('click', () => {
    const help = $('#help');
    help.hidden = !help.hidden;
    $('#btn-help').classList.toggle('active', !help.hidden);
});

function updateLabelVisibility() {
    const on = mode !== 'fps' && showLabels[mode];
    roomLabels.forEach((o) => (o.visible = on));
    const dims = on && mode === 'plan';
    dimObjects.forEach((o) => (o.visible = dims));
    dimLines.visible = dims;
}

document.querySelectorAll('#modes button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('#opt-labels').addEventListener('change', (e) => {
    showLabels[mode] = e.target.checked;
    updateLabelVisibility();
});
let snap = true;
$('#opt-snap').addEventListener('change', (e) => (snap = e.target.checked));
$('#btn-undo').addEventListener('click', undo);
$('#btn-reset').addEventListener('click', () => {
    if (!confirm('Remettre tous les meubles à leur position d’origine ?')) return;
    change(() => items.forEach((i) => (i.state = {...i.initial})));
});

// ---------- Sélection ----------
let selected = null;
const selBox = new THREE.Box3Helper(new THREE.Box3(), 0xf59e0b);
selBox.material.depthTest = false;
selBox.renderOrder = 20;
selBox.visible = false;
scene.add(selBox);

function select(item) {
    selected = item;
    updateSelection();
}

function updateSelection() {
    markDirty();
    const panel = $('#panel');
    if (!selected) {
        selBox.visible = false;
        panel.hidden = true;
        return;
    }
    selected.group.updateMatrixWorld(true);
    selBox.box.setFromObject(selected.group);
    selBox.visible = true;
    panel.hidden = false;
    $('#p-name').textContent = selected.def.name;
    $('#p-dims').textContent = `${Math.round(selected.w)} × ${Math.round(selected.d)} × ${selected.h} cm`;
    // lien vers la fiche produit quand la référence est connue
    const link = $('#p-link');
    link.hidden = !selected.def.url;
    if (selected.def.url) link.href = selected.def.url;
    for (const [id, v] of [
        ['#p-x', selected.state.x],
        ['#p-y', selected.state.y],
        ['#p-rot', selected.state.rot],
    ]) {
        const input = $(id);
        if (document.activeElement !== input) input.value = Math.round(v * 10) / 10;
    }
}

// ---------- Collisions meubles / murs ----------
// Emprise au sol d'un meuble (rectangle déclaré, tourné) contre les morceaux de mur pleins.
// Les ouvertures de portes restent franchissables pour passer d'une pièce à l'autre.
const WALL_TOL = 1; // cm de chevauchement toléré (meubles posés pile contre un mur)
const wallRects = structure.colliders.map((c) => {
    const a = toPlan(c.minX, c.minZ),
        b = toPlan(c.maxX, c.maxZ);
    return {x1: a.x, y1: a.y, x2: b.x, y2: b.y};
});

function halfExtents(item, rot) {
    const r = THREE.MathUtils.degToRad(rot),
        c = Math.abs(Math.cos(r)),
        s = Math.abs(Math.sin(r));
    return {hx: (item.w * c + item.d * s) / 2, hy: (item.w * s + item.d * c) / 2};
}

function fits(item, st) {
    const {hx, hy} = halfExtents(item, st.rot);
    const t = WALL_TOL;
    return !wallRects.some(
        (w) => st.x - hx + t < w.x2 && st.x + hx - t > w.x1 && st.y - hy + t < w.y2 && st.y + hy - t > w.y1,
    );
}

// Déplace le long d'un axe en s'arrêtant au contact du premier mur rencontré (pas d'effet tunnel).
function moveAxis(item, st, axis, target) {
    const {hx, hy} = halfExtents(item, st.rot);
    const t = WALL_TOL;
    const [pos, h, o, ho] = axis === 'x' ? [st.x, hx, st.y, hy] : [st.y, hy, st.x, hx];
    const delta = target - pos;
    if (!delta) return pos;
    let limit = target;
    for (const w of wallRects) {
        const [a1, a2, b1, b2] = axis === 'x' ? [w.x1, w.x2, w.y1, w.y2] : [w.y1, w.y2, w.x1, w.x2];
        if (!(o - ho + t < b2 && o + ho - t > b1)) continue; // mur hors de la bande parcourue
        if (delta > 0 && a1 >= pos + h - t) limit = Math.min(limit, a1 - h);
        if (delta < 0 && a2 <= pos - h + t) limit = Math.max(limit, a2 + h);
    }
    return delta > 0 ? Math.max(pos, limit) : Math.min(pos, limit);
}

// Applique une modification seulement si le meuble ne se retrouve pas dans un mur
// (sauf s'il y était déjà, pour ne jamais le bloquer).
function tryChange(item, patch) {
    const next = {...item.state, ...patch};
    if (!fits(item, next) && fits(item, item.state)) {
        flashBlocked();
        return false;
    }
    change(() => Object.assign(item.state, patch));
    return true;
}

let flashTimer;
function flashBlocked() {
    markDirty();
    selBox.material.color.set(0xef4444);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => selBox.material.color.set(0xf59e0b), 350);
}

const rotate = (deg) =>
    selected && tryChange(selected, {rot: (((selected.state.rot + deg + 180) % 360) + 360) % 360 - 180});
const nudge = (dx, dy) => {
    if (!selected) return;
    const st = selected.state;
    const x = moveAxis(selected, st, 'x', st.x + dx);
    const y = moveAxis(selected, {...st, x}, 'y', st.y + dy);
    if (x === st.x && y === st.y) return flashBlocked();
    change(() => Object.assign(st, {x, y}));
};
const removeSelected = () => selected && change(() => (selected.state.deleted = true));

$('#p-rotl').addEventListener('click', () => rotate(-90));
$('#p-rotr').addEventListener('click', () => rotate(90));
$('#p-del').addEventListener('click', removeSelected);
for (const [id, key] of [
    ['#p-x', 'x'],
    ['#p-y', 'y'],
    ['#p-rot', 'rot'],
])
    $(id).addEventListener('change', (e) => {
        const v = parseFloat(e.target.value);
        if (selected && Number.isFinite(v) && !tryChange(selected, {[key]: v})) updateSelection();
    });

function renderTrash() {
    const deleted = items.filter((i) => i.state.deleted);
    $('#trash').hidden = deleted.length === 0;
    const ul = $('#trash-list');
    ul.replaceChildren(
        ...deleted.map((i) => {
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.textContent = 'Restaurer';
            b.onclick = () => change(() => (i.state.deleted = false));
            li.append(i.def.name, b);
            return li;
        }),
    );
}

// ---------- Interaction souris (plan & 3D libre) ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function setNdc(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, activeCam());
}

function pickRay() {
    const hit = raycaster.intersectObjects([furnRoot, structure.group], true)[0];
    if (!hit) return {};
    let o = hit.object;
    if (o.userData.door) return {door: o.userData.door, distance: hit.distance};
    while (o && !o.userData.item) o = o.parent;
    return {item: o?.userData.item, distance: hit.distance};
}

function planeHit(e) {
    setNdc(e);
    return raycaster.ray.intersectPlane(floorPlane, new THREE.Vector3());
}

let drag = null;
let down = null;

viewport.addEventListener(
    'pointerdown',
    (e) => {
        if (mode === 'fps' || e.button !== 0 || e.target !== renderer.domElement) return;
        if (spacePan) {
            renderer.domElement.style.cursor = 'grabbing';
            return;
        }
        down = {x: e.clientX, y: e.clientY};
        setNdc(e);
        const {item} = pickRay();
        if (!item) return;
        // on bloque OrbitControls pendant le déplacement du meuble
        e.stopPropagation();
        select(item);
        const p = planeHit(e);
        if (p) drag = {item, before: snapshot(), moved: false, off: item.group.position.clone().sub(p)};
        renderer.domElement.style.cursor = 'grabbing';
    },
    {capture: true},
);

window.addEventListener('pointermove', (e) => {
    if (drag) {
        const p = planeHit(e);
        if (!p) return;
        p.add(drag.off);
        let {x, y} = toPlan(p.x, p.z);
        const step = snap ? 5 : 1;
        x = Math.round(x / step) * step;
        y = Math.round(y / step) * step;
        const s = drag.item.state;
        // glisse le long des murs au lieu de les traverser
        if (fits(drag.item, s)) {
            x = moveAxis(drag.item, s, 'x', x);
            y = moveAxis(drag.item, {...s, x}, 'y', y);
        }
        if (x !== s.x || y !== s.y) {
            s.x = x;
            s.y = y;
            applyState(drag.item);
            drag.moved = true;
            updateSelection();
        }
        return;
    }
    if (mode !== 'fps' && !spacePan && e.target === renderer.domElement && e.buttons === 0) {
        setNdc(e);
        const {item, door} = pickRay();
        renderer.domElement.style.cursor = item ? 'grab' : door ? 'pointer' : '';
    }
});

window.addEventListener('pointerup', (e) => {
    if (spacePan) renderer.domElement.style.cursor = 'grab';
    if (drag) {
        if (drag.moved) commit(drag.before);
        drag = null;
        down = null;
        renderer.domElement.style.cursor = 'grab';
        return;
    }
    if (down && mode !== 'fps' && e.target === renderer.domElement && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 4)
        select(null);
    down = null;
});

renderer.domElement.addEventListener('dblclick', (e) => {
    if (mode === 'fps') return;
    setNdc(e);
    const {door} = pickRay();
    if (door) toggleDoor(door);
});

function toggleDoor(door) {
    door.target = door.target > 0.5 ? 0 : 1;
}

// ---------- Clavier ----------
const keys = new Set();
window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    keys.add(e.code);
    const k = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && k === 'z') {
        e.preventDefault();
        undo();
        return;
    }
    const modeKey = {Digit1: 'plan', Digit2: 'orbit', Digit3: 'fps', Numpad1: 'plan', Numpad2: 'orbit', Numpad3: 'fps'}[e.code];
    if (modeKey && !e.metaKey && !e.ctrlKey) {
        if (modeKey !== mode) setMode(modeKey);
        return;
    }
    if (e.code === 'Space' && mode !== 'fps') {
        e.preventDefault();
        setSpacePan(true);
        return;
    }
    if (mode === 'fps') {
        if (e.code === 'KeyE') interact();
        if (e.code === 'KeyN') setNight(!night);
        return;
    }
    if (e.code === 'KeyN' && !e.metaKey && !e.ctrlKey) return setNight(!night);
    if (!selected) return;
    const step = e.shiftKey ? 10 : 1;
    switch (true) {
        case e.key === 'Delete' || e.key === 'Backspace':
            e.preventDefault();
            removeSelected();
            break;
        case k === 'r':
            rotate(e.shiftKey ? 15 : 90);
            break;
        case e.key === 'Escape':
            select(null);
            break;
        case e.key === 'ArrowLeft':
            e.preventDefault();
            nudge(-step, 0);
            break;
        case e.key === 'ArrowRight':
            e.preventDefault();
            nudge(step, 0);
            break;
        case e.key === 'ArrowUp':
            e.preventDefault();
            nudge(0, -step);
            break;
        case e.key === 'ArrowDown':
            e.preventDefault();
            nudge(0, step);
            break;
    }
});
window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    if (e.code === 'Space') setSpacePan(false);
});
window.addEventListener('blur', () => {
    keys.clear();
    setSpacePan(false);
});

// ---------- Visite (FPS) ----------
const PLAYER_R = 0.22;
let furnColliders = [];
let collidersDirty = true;

function rebuildFurnColliders() {
    furnColliders = [];
    const b = new THREE.Box3();
    furnRoot.updateMatrixWorld(true);
    furnRoot.traverse((o) => {
        if (!o.isMesh) return;
        b.setFromObject(o);
        if (b.max.y < 0.2) return;
        furnColliders.push({minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z});
    });
    collidersDirty = false;
}

const walkZones = walkable.map(([x1, y1, x2, y2]) => {
    const a = toWorld(x1, y1),
        b = toWorld(x2, y2);
    return {minX: a.x, maxX: b.x, minZ: a.z, maxZ: b.z};
});

function blocked(x, z) {
    if (!walkZones.some((r) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ)) return true;
    const hit = (r) => {
        const cx = Math.max(r.minX, Math.min(x, r.maxX));
        const cz = Math.max(r.minZ, Math.min(z, r.maxZ));
        return (x - cx) ** 2 + (z - cz) ** 2 < PLAYER_R ** 2;
    };
    return (
        structure.colliders.some(hit) ||
        furnColliders.some(hit) ||
        structure.doors.some((d) => d.t < 0.95 && hit(d.rect))
    );
}

const fwd = new THREE.Vector3(),
    right = new THREE.Vector3(),
    move = new THREE.Vector3();

function updateFps(dt) {
    if (!fps.isLocked) return;
    if (collidersDirty) rebuildFurnColliders();
    const has = (...c) => c.some((k) => keys.has(k));
    const f = (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0);
    const s = (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0);
    if (!f && !s) return;
    const speed = has('ShiftLeft', 'ShiftRight') ? 3.2 : 1.6;
    fpsCam.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    right.set(-fwd.z, 0, fwd.x);
    move.copy(fwd).multiplyScalar(f).addScaledVector(right, s).normalize().multiplyScalar(speed * dt);
    const p = fpsCam.position;
    const stuck = blocked(p.x, p.z);
    if (stuck || !blocked(p.x + move.x, p.z)) p.x += move.x;
    if (stuck || !blocked(p.x, p.z + move.z)) p.z += move.z;
}

function aimedDoor() {
    raycaster.setFromCamera(ndc.set(0, 0), fpsCam);
    const {door, distance} = pickRay();
    return door && distance < 2.5 ? door : null;
}

function interact() {
    if (!fps.isLocked) return;
    const d = aimedDoor();
    if (d) toggleDoor(d);
}

let hintTick = 0;
function updateHint() {
    if (++hintTick % 6) return;
    const d = fps.isLocked && aimedDoor();
    const hint = $('#hint');
    hint.hidden = !d;
    if (d) hint.innerHTML = `<kbd>E</kbd> ${d.target > 0.5 ? 'Fermer' : 'Ouvrir'} — ${d.def.name}`;
}

$('#fps-start').addEventListener('click', () => fps.lock());
$('#fps-respawn').addEventListener('click', (e) => {
    e.stopPropagation();
    spawn();
});
fps.addEventListener('lock', () => {
    $('#fps-overlay').hidden = true;
    $('#crosshair').hidden = false;
});
fps.addEventListener('unlock', () => {
    keys.clear();
    $('#crosshair').hidden = $('#hint').hidden = true;
    if (mode === 'fps') $('#fps-overlay').hidden = false;
});
document.addEventListener('mousedown', (e) => {
    if (mode === 'fps' && fps.isLocked && e.button === 0) interact();
});

// ---------- Reflets du carrelage ----------
// Une sonde cubique par zone capture la pièce (plafond compris) ; PMREM la floute selon la rugosité
// du carrelage, ce qui donne un reflet léger et diffus des murs, meubles et baies.
const pmrem = new THREE.PMREMGenerator(renderer);
const probes = [
    {pos: toWorld(306, 470, 120), mat: tex.tileLight.material, intensity: 0.3, roughness: 0.28, floor: true},
    {pos: toWorld(420, 160, 120), mat: tex.tileDark.material, intensity: 0.6, roughness: 0.26, floor: true},
    // miroir de la salle de bain : sonde au centre de la pièce
    {pos: toWorld(130, 170, 150), mat: MAT.mirror, intensity: 1, roughness: 0.04},
].map((p) => ({...p, cam: new THREE.CubeCamera(0.05, 40, new THREE.WebGLCubeRenderTarget(256, {type: THREE.HalfFloatType}))}));

function captureReflections() {
    const saved = [selBox.visible, dimLines.visible, structure.ceiling.visible, env.soffit.visible];
    floorRefl.setEnabled(false); // pas de reflet planaire dans les sondes
    selBox.visible = dimLines.visible = false;
    structure.ceiling.visible = env.soffit.visible = true;
    for (const p of probes) p.mat.envMap = null;
    for (const p of probes) {
        p.cam.position.copy(p.pos);
        scene.add(p.cam);
        p.cam.update(renderer, scene);
        scene.remove(p.cam);
        p.env?.dispose();
        p.env = pmrem.fromCubemap(p.cam.renderTarget.texture);
    }
    for (const p of probes) {
        // en HD le reflet planaire prend le relais : la sonde ne garde qu'un léger lustre
        const k = hq && p.floor ? 0.35 : 1;
        Object.assign(p.mat, {envMap: p.env.texture, envMapIntensity: p.intensity * k, roughness: p.roughness});
        p.mat.needsUpdate = true;
    }
    [selBox.visible, dimLines.visible, structure.ceiling.visible, env.soffit.visible] = saved;
    floorRefl.setEnabled(hq);
    markDirty();
}
let reflTimer;
function scheduleReflections() {
    clearTimeout(reflTimer);
    reflTimer = setTimeout(captureReflections, 300);
}
scheduleReflections();

// ---------- Mode nuit ----------
// Lune bleutée à la place du soleil, ciel sombre, plafonniers à lumière chaude (avec ombres
// pour que la lumière ne traverse pas les cloisons), écrans et lampadaire plus présents.
let night = false;
const DAY = {
    bg: scene.background.clone(),
    exposure: renderer.toneMappingExposure,
    sun: [sun.color.clone(), sun.intensity, sun.position.clone()],
    hemi: [hemi.color.clone(), hemi.groundColor.clone(), hemi.intensity],
};
const interiorLights = new THREE.Group();
interiorLights.visible = false;
scene.add(interiorLights);
// plafonniers : disques lumineux visibles seulement en visite (comme le plafond)
const fixtures = new THREE.Group();
fixtures.visible = false;
scene.add(fixtures);
const fixtureMat = new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xfff0d8, emissiveIntensity: 0});

function ceilingLight(x, y, intensity, {shadow = true, h = 242, angle = Math.PI / 2.6} = {}) {
    const p = toWorld(x, y, h);
    const spot = new THREE.SpotLight(0xffe0b5, intensity, 8, angle, 1, 1.4);
    spot.position.copy(p);
    spot.target.position.set(p.x, 0, p.z);
    if (shadow) {
        spot.castShadow = true;
        spot.shadow.mapSize.set(1024, 1024);
        spot.shadow.radius = 4;
        spot.shadow.bias = -0.0004;
        Object.assign(spot.shadow.camera, {near: 0.1, far: 6});
    }
    interiorLights.add(spot, spot.target);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 24), fixtureMat);
    disc.position.copy(toWorld(x, y, 248));
    fixtures.add(disc);
}
ceilingLight(306, 473, 22); // séjour
ceilingLight(90, 420, 10); // cuisine
ceilingLight(418, 155, 18); // chambre
ceilingLight(108, 170, 14); // salle de bain
ceilingLight(-140, 570, 8, {shadow: false}); // palier
ceilingLight(708, 375, 6, {shadow: false, h: 265, angle: Math.PI / 2.4}); // applique du balcon

function setNight(on) {
    markDirty();
    night = on;
    $('#btn-night').classList.toggle('active', on);
    $('#btn-night').textContent = on ? '☀ Jour' : '☾ Nuit';
    scene.background.set(on ? 0x0a1020 : DAY.bg);
    renderer.toneMappingExposure = on ? 1.25 : DAY.exposure;
    if (on) {
        sun.color.set(0x9db4e8);
        sun.intensity = 0.18;
        sun.position.set(-7, 12, -5);
        hemi.color.set(0x2c3a63);
        hemi.groundColor.set(0x14110e);
        hemi.intensity = 0.25;
        scene.environmentIntensity = 0.04;
    } else {
        scene.environmentIntensity = 0.5;
        sun.color.copy(DAY.sun[0]);
        sun.intensity = DAY.sun[1];
        sun.position.copy(DAY.sun[2]);
        hemi.color.copy(DAY.hemi[0]);
        hemi.groundColor.copy(DAY.hemi[1]);
        hemi.intensity = DAY.hemi[2];
    }
    interiorLights.visible = on;
    fixtureMat.emissiveIntensity = on ? 2.5 : 0;
    // lampes et écrans des meubles : plus intenses la nuit
    furnRoot.traverse((o) => {
        if (o.userData.nightOnly) o.visible = on; // ex. ampoules de la guirlande
        else if (o.isSpotLight || o.isPointLight) {
            o.userData.dayIntensity ??= o.intensity;
            o.intensity = o.userData.dayIntensity * (on ? 1.8 : 1);
        }
        if (o.isMesh && o.material.emissiveIntensity > 0) {
            const mat = o.material;
            mat.userData.dayEmissive ??= mat.emissiveIntensity;
            mat.emissiveIntensity = on ? (mat.userData.night ?? mat.userData.dayEmissive * 2) : mat.userData.dayEmissive;
        }
    });
    scheduleReflections();
}
$('#btn-night').addEventListener('click', () => setNight(!night));

// ---------- Boucle ----------
function resize() {
    const w = viewport.clientWidth,
        h = viewport.clientHeight;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    for (const c of [persp, fpsCam]) {
        c.aspect = w / h;
        c.updateProjectionMatrix();
    }
    const aspect = w / h;
    const vh = Math.max(9, 12.5 / aspect);
    Object.assign(ortho, {left: (-vh * aspect) / 2, right: (vh * aspect) / 2, top: vh / 2, bottom: -vh / 2});
    ortho.updateProjectionMatrix();
    const pr = renderer.getPixelRatio();
    floorRefl.setSize(w * pr, h * pr);
    pipeline.setSize(w, h, pr);
}
window.addEventListener('resize', resize);

// ---------- Bascule HD ----------
function setHQ(on) {
    hq = on;
    try {
        localStorage.setItem(HQ_KEY, on ? '1' : '0');
    } catch {}
    $('#btn-hq').classList.toggle('active', on);
    floorRefl.setEnabled(on);
    scheduleReflections(); // ajuste l'intensité des sondes du sol
    markDirty();
}
$('#btn-hq').addEventListener('click', () => setHQ(!hq));
setHQ(hq);

// Variations d'un échantillon d'accumulation : soleil (lune) dans un disque et plafonniers
// légèrement déplacés → ombres d'aire douces une fois moyennées.
const sunBase = new THREE.Vector3();
const lightBases = new Map();
const tmpU = new THREE.Vector3(),
    tmpV = new THREE.Vector3();
function jitterLights(i) {
    sunBase.copy(sun.position);
    const dir = sun.position.clone().normalize();
    tmpU.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    tmpV.crossVectors(dir, tmpU).normalize();
    const a = halton(i, 5) * Math.PI * 2,
        r = Math.sqrt(halton(i, 7)) * 2.4; // grand disque : pénombres larges et réalistes
    sun.position.addScaledVector(tmpU, Math.cos(a) * r).addScaledVector(tmpV, Math.sin(a) * r);
    sun.shadow.radius = 1;
    if (night)
        interiorLights.traverse((l) => {
            if (!l.isSpotLight) return;
            if (!lightBases.has(l)) lightBases.set(l, l.position.clone());
            l.position.copy(lightBases.get(l)).add(new THREE.Vector3(Math.cos(a) * r * 0.08, 0, Math.sin(a) * r * 0.08));
        });
}
function restoreLights() {
    sun.position.copy(sunBase);
    sun.shadow.radius = 7;
    for (const [l, p] of lightBases) l.position.copy(p);
}
resize();
renderTrash();
setMode('plan');

const clock = new THREE.Clock();
let lastCamSig = '';
renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    for (const d of structure.doors)
        if (d.t !== d.target) {
            d.t = THREE.MathUtils.clamp(d.t + Math.sign(d.target - d.t) * dt * 1.8, 0, 1);
            applyDoor(d);
            markDirty();
        }
    if (mode === 'fps') {
        updateFps(dt);
        updateHint();
    } else if (mode === 'orbit') orbit.update();
    const cam = activeCam();
    renderer.shadowMap.needsUpdate = true;
    if (hq) {
        // relance l'accumulation dès que la caméra bouge
        cam.updateMatrixWorld();
        const sig = cam.matrixWorld.elements.join() + cam.projectionMatrix.elements.join();
        if (sig !== lastCamSig) {
            lastCamSig = sig;
            pipeline.reset();
        }
        pipeline.render(cam, {
            ao: mode !== 'plan',
            bloom: night,
            jitter: jitterLights,
            restore: restoreLights,
            beforeScene: (c) => floorRefl.update(scene, c),
        });
    } else renderer.render(scene, cam);
    labelRenderer.render(scene, cam);
});

// accès debug en développement (positionner la caméra depuis la console)
if (import.meta.env.DEV) window.__appart = {persp, orbit, fpsCam, setMode, toWorld, items, fits, moveAxis, tex, renderer, scene, floorRefl, pipeline};
