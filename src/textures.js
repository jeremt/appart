import * as THREE from 'three';

function rng(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function canvasTexture(size, draw, aniso) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    return t;
}

// Lames de bois horizontales, raccordables sur les bords.
function planks(g, s, rows, seed, hue, light, sat) {
    const r = rng(seed);
    const rh = s / rows;
    for (let row = 0; row < rows; row++) {
        const off = r() * s;
        let x = 0;
        while (x < s) {
            const len = Math.min(s * (0.3 + r() * 0.4), s - x);
            const color = `hsl(${hue + r() * 6}, ${sat + r() * 10}%, ${light + r() * 12}%)`;
            for (const ox of [-s, 0, s]) {
                const X = ((x + off) % s) + ox;
                {
                    g.fillStyle = color;
                    g.fillRect(X, row * rh, len, rh);
                    g.strokeStyle = 'rgba(50,30,10,0.09)';
                    g.lineWidth = 1;
                    for (let k = 0; k < 6; k++) {
                        const yy = row * rh + 3 + ((k * 37 + seed * 13 + row * 7) % (rh - 6));
                        g.beginPath();
                        g.moveTo(X, yy);
                        g.bezierCurveTo(X + len * 0.3, yy - 2, X + len * 0.6, yy + 2, X + len, yy);
                        g.stroke();
                    }
                    g.strokeStyle = 'rgba(40,22,8,0.45)';
                    g.lineWidth = 2;
                    g.strokeRect(X + 1, row * rh + 1, len - 2, rh - 2);
                }
            }
            x += len;
        }
    }
}

// Carrelage : `cols` x `rows` carreaux, teinte de base [h, s, l] avec légère variation.
function tileGrid(g, s, cols, rows, [h, sat, l], grout, seed, joint = 2) {
    const r = rng(seed);
    g.fillStyle = grout;
    g.fillRect(0, 0, s, s);
    const tw = s / cols,
        th = s / rows;
    for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
            const x = i * tw + joint / 2,
                y = j * th + joint / 2;
            g.fillStyle = `hsl(${h}, ${sat}%, ${l + (r() - 0.5) * 3}%)`;
            g.fillRect(x, y, tw - joint, th - joint);
            // léger nuage pour casser l'aspect uniforme
            for (let k = 0; k < 40; k++) {
                g.fillStyle = `hsla(${h}, ${sat}%, ${l + (r() - 0.5) * 8}%, 0.08)`;
                g.beginPath();
                g.arc(x + r() * tw, y + r() * th, 6 + r() * 20, 0, Math.PI * 2);
                g.fill();
            }
        }
}

export function makeTextures(renderer) {
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const mk = (tex, size, roughness = 0.7) => ({
        tex,
        size,
        material: new THREE.MeshStandardMaterial({map: tex, roughness}),
    });

    const parquet = canvasTexture(1024, (g, s) => planks(g, s, 10, 3, 30, 44, 38), aniso);

    const tiles = canvasTexture(
        512,
        (g, s) => {
            const r = rng(11);
            const n = 4,
                t = s / n;
            g.fillStyle = '#b8b2a8';
            g.fillRect(0, 0, s, s);
            for (let i = 0; i < n; i++)
                for (let j = 0; j < n; j++) {
                    const l = 86 + r() * 4;
                    g.fillStyle = `hsl(35, 8%, ${l}%)`;
                    g.fillRect(i * t + 2, j * t + 2, t - 4, t - 4);
                }
        },
        aniso,
    );

    const grass = canvasTexture(
        512,
        (g, s) => {
            const r = rng(5);
            g.fillStyle = '#5f8c3c';
            g.fillRect(0, 0, s, s);
            for (let i = 0; i < 9000; i++) {
                const x = r() * s,
                    y = r() * s;
                g.strokeStyle = `hsla(${85 + r() * 30}, ${35 + r() * 25}%, ${28 + r() * 22}%, 0.8)`;
                g.lineWidth = 1 + r();
                g.beginPath();
                g.moveTo(x, y);
                g.lineTo(x + (r() - 0.5) * 4, y - 3 - r() * 6);
                g.stroke();
            }
        },
        aniso,
    );

    const paving = canvasTexture(
        512,
        (g, s) => {
            const r = rng(21);
            const n = 3,
                t = s / n;
            g.fillStyle = '#8f8a82';
            g.fillRect(0, 0, s, s);
            for (let j = 0; j < n; j++)
                for (let i = -1; i < n; i++) {
                    const x = i * t + (j % 2 ? t / 2 : 0);
                    g.fillStyle = `hsl(38, ${8 + r() * 6}%, ${68 + r() * 10}%)`;
                    g.fillRect(x + 3, j * t + 3, t - 6, t - 6);
                }
        },
        aniso,
    );

    // lames de terrasse rainurées, d'un seul tenant sur toute la profondeur du balcon
    const deck = canvasTexture(
        1024,
        (g, s) => {
            const r = rng(9);
            const rows = 8,
                rh = s / rows,
                gap = 7;
            g.fillStyle = '#1e1b19';
            g.fillRect(0, 0, s, s);
            for (let i = 0; i < rows; i++) {
                const y = i * rh + gap / 2,
                    h = rh - gap;
                g.fillStyle = `hsl(${24 + r() * 6}, ${8 + r() * 5}%, ${30 + r() * 7}%)`;
                g.fillRect(0, y, s, h);
                // rainures longitudinales des lames antidérapantes
                for (let k = 1; k < 9; k++) {
                    g.fillStyle = 'rgba(0,0,0,0.16)';
                    g.fillRect(0, y + (k * h) / 9 - 1, s, 2);
                }
                // usure / salissures
                for (let k = 0; k < 60; k++) {
                    g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},0.05)`;
                    g.fillRect(r() * s, y + r() * h, 40 + r() * 200, 2 + r() * 4);
                }
            }
        },
        aniso,
    );
    // séjour : grands carreaux 60x60 gris clair
    const tileLight = canvasTexture(1024, (g, s) => tileGrid(g, s, 2, 2, [38, 5, 70], '#9d9992', 31), aniso);
    // chambre, salle de bain, palier : carreaux 60x60 anthracite
    const tileDark = canvasTexture(1024, (g, s) => tileGrid(g, s, 2, 2, [210, 3, 33], '#2c2d2f', 41), aniso);
    // faïence autour de la baignoire : 30x60 grège
    const wallTile = canvasTexture(1024, (g, s) => tileGrid(g, s, 2, 4, [35, 9, 58], '#8d877e', 51), aniso);

    const out = {
        parquet: mk(parquet, 1.6, 0.55),
        tiles: mk(tiles, 1.2, 0.35),
        grass: mk(grass, 2.5, 0.95),
        paving: mk(paving, 1.2, 0.9),
        deck: mk(deck, 1.2, 0.85),
        tileLight: mk(tileLight, 1.2, 0.3),
        tileDark: mk(tileDark, 1.2, 0.35),
        wallTile: mk(wallTile, 1.2, 0.3),
    };
    // carrelage du séjour : teinte légèrement assombrie pour ne pas paraître blanc sous le soleil
    out.tileLight.material.color.setScalar(0.58);
    return out;
}
