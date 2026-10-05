import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {PointerLockControls} from 'three/addons/controls/PointerLockControls.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {furnitureDefs, rooms, dimensions, walkable, spawn as spawnPoint, toWorld, toPlan} from './plan.js';
import {BUILDERS, MAT} from './furniture.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildStructure, buildEnvironment, applyDoor} from './structure.js';
import {makeTextures} from './textures.js';

const $ = (s) => document.querySelector(s);
const viewport = $('#viewport');

// ---------- Rendu ----------
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
viewport.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
viewport.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe2f1);
scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x7a6a55, 1.1));
const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
sun.position.set(6, 14, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, {left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50});
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun);

// environnement réfléchi pour les chromes (uniquement sur ce matériau)
MAT.chrome.envMap = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

const tex = makeTextures(renderer);
const structure = buildStructure(tex);
const env = buildEnvironment(tex);
scene.add(structure.group, structure.ceiling, env.group);

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
    };
    return item;
});

function applyState(item) {
    const p = toWorld(item.state.x, item.state.y);
    item.group.position.set(p.x, 0, p.z);
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

const MODES_HELP = 'Changer de vue à tout moment : <kbd>1</kbd> Plan · <kbd>2</kbd> 3D libre · <kbd>3</kbd> Visite';
const HELP = {
    plan: `<b>Plan 2D</b> — glisser : déplacer la vue · <kbd>Espace</kbd> + glisser : déplacer la vue même sur un meuble · molette : zoom<br>Clic sur un meuble : sélection · glisser : déplacer · <kbd>R</kbd> pivoter 90° (<kbd>⇧R</kbd> 15°) · <kbd>Suppr</kbd> supprimer · flèches : ajuster<br>Double-clic sur une porte : ouvrir / fermer<br>${MODES_HELP}`,
    orbit: `<b>3D libre</b> — clic gauche : tourner · <kbd>Espace</kbd> + glisser ou clic droit : déplacer la vue · molette : zoom<br>Glisser un meuble pour le déplacer · <kbd>R</kbd> pivoter · <kbd>Suppr</kbd> supprimer<br>Double-clic sur une porte : ouvrir / fermer<br>${MODES_HELP}`,
    fps: `<b>Visite</b> — <kbd>ZQSD</kbd>/<kbd>WASD</kbd> se déplacer · <kbd>Maj</kbd> courir · <kbd>E</kbd> ou clic : porte · <kbd>Échap</kbd> libérer la souris<br>${MODES_HELP}`,
};

function setMode(m) {
    mode = m;
    orbit.enabled = m === 'orbit';
    planCtl.enabled = m === 'plan';
    structure.ceiling.visible = m === 'fps';
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
    for (const [id, v] of [
        ['#p-x', selected.state.x],
        ['#p-y', selected.state.y],
        ['#p-rot', selected.state.rot],
    ]) {
        const input = $(id);
        if (document.activeElement !== input) input.value = Math.round(v * 10) / 10;
    }
}

const rotate = (deg) =>
    selected && change(() => (selected.state.rot = (((selected.state.rot + deg + 180) % 360) + 360) % 360 - 180));
const nudge = (dx, dy) =>
    selected &&
    change(() => {
        selected.state.x += dx;
        selected.state.y += dy;
    });
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
        if (selected && Number.isFinite(v)) change(() => (selected.state[key] = v));
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
        return;
    }
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
}
window.addEventListener('resize', resize);
resize();
renderTrash();
setMode('plan');

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    for (const d of structure.doors)
        if (d.t !== d.target) {
            d.t = THREE.MathUtils.clamp(d.t + Math.sign(d.target - d.t) * dt * 1.8, 0, 1);
            applyDoor(d);
        }
    if (mode === 'fps') {
        updateFps(dt);
        updateHint();
    } else if (mode === 'orbit') orbit.update();
    const cam = activeCam();
    renderer.render(scene, cam);
    labelRenderer.render(scene, cam);
});
