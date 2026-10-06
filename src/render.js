import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {TexturePass} from 'three/addons/postprocessing/TexturePass.js';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

// ---------- Reflet planaire du sol ----------
// La scène est rendue une fois par image depuis une caméra miroir (sous le plan du sol),
// dans une cible à mipmaps. Les matériaux de sol l'échantillonnent avec un niveau de flou
// (textureLod) et un fresnel : reflets nets en incidence rasante, discrets vus de dessus.

export class FloorReflection {
    constructor(renderer, {height = 0.003, resolution = 0.5} = {}) {
        this.renderer = renderer;
        this.height = height;
        this.resolution = resolution;
        this.enabled = false;
        this.target = new THREE.WebGLRenderTarget(1, 1, {
            type: THREE.HalfFloatType,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
        });
        this.camera = new THREE.PerspectiveCamera();
        this.uniforms = {
            uReflMap: {value: this.target.texture},
            uReflMatrix: {value: new THREE.Matrix4()},
        };
        this.hidden = []; // objets masqués pendant le rendu miroir (les sols eux-mêmes)
        this.shown = []; // objets forcés visibles (plafond : sinon le sol reflète le ciel)
        this.materials = [];
        // temporaires
        this._plane = new THREE.Plane();
        this._normal = new THREE.Vector3(0, 1, 0);
        this._pos = new THREE.Vector3();
        this._cam = new THREE.Vector3();
        this._rot = new THREE.Matrix4();
        this._look = new THREE.Vector3();
        this._view = new THREE.Vector3();
        this._target = new THREE.Vector3();
        this._clip = new THREE.Vector4();
        this._q = new THREE.Vector4();
    }

    setSize(w, h) {
        this.target.setSize(Math.max(1, Math.round(w * this.resolution)), Math.max(1, Math.round(h * this.resolution)));
    }

    // Branche le reflet sur un matériau standard : `strength` = intensité max, `blur` = niveau de mip.
    attach(material, {strength = 0.3, blur = 2.5} = {}) {
        const local = {uReflStrength: {value: 0}, uReflBlur: {value: blur}, base: strength};
        this.materials.push(local);
        material.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, this.uniforms, {uReflStrength: local.uReflStrength, uReflBlur: local.uReflBlur});
            shader.vertexShader =
                'uniform mat4 uReflMatrix;\nvarying vec4 vReflCoord;\n' +
                shader.vertexShader.replace(
                    '#include <project_vertex>',
                    '#include <project_vertex>\n\tvReflCoord = uReflMatrix * modelMatrix * vec4( transformed, 1.0 );',
                );
            shader.fragmentShader =
                'uniform sampler2D uReflMap;\nuniform float uReflStrength;\nuniform float uReflBlur;\nvarying vec4 vReflCoord;\n' +
                shader.fragmentShader.replace(
                    '#include <opaque_fragment>',
                    `if ( uReflStrength > 0.0 ) {
		vec2 ruv = vReflCoord.xy / vReflCoord.w;
		vec3 refl = textureLod( uReflMap, ruv, uReflBlur ).rgb;
		float ndv = clamp( dot( normalize( vViewPosition ), normal ), 0.0, 1.0 );
		float fres = pow( 1.0 - ndv, 4.0 );
		outgoingLight = mix( outgoingLight, refl, uReflStrength * mix( 0.15, 1.0, fres ) );
	}
	#include <opaque_fragment>`,
                );
        };
        material.customProgramCacheKey = () => 'floor-reflection';
        material.needsUpdate = true;
    }

    setEnabled(on) {
        this.enabled = on;
        for (const m of this.materials) m.uReflStrength.value = on ? m.base : 0;
    }

    // Adapté de three/addons/objects/Reflector.js (caméra miroir + plan de coupe oblique).
    update(scene, camera) {
        if (!this.enabled || !camera.isPerspectiveCamera) {
            for (const m of this.materials) m.uReflStrength.value = 0;
            return;
        }
        for (const m of this.materials) m.uReflStrength.value = m.base;
        const n = this._normal,
            pos = this._pos.set(0, this.height, 0),
            cam = this._cam.setFromMatrixPosition(camera.matrixWorld),
            view = this._view.subVectors(pos, cam);
        if (view.dot(n) > 0) return; // caméra sous le sol
        view.reflect(n).negate().add(pos);
        this._rot.extractRotation(camera.matrixWorld);
        this._look.set(0, 0, -1).applyMatrix4(this._rot).add(cam);
        this._target.subVectors(pos, this._look).reflect(n).negate().add(pos);

        const vc = this.camera;
        vc.position.copy(view);
        vc.up.set(0, 1, 0).applyMatrix4(this._rot).reflect(n);
        vc.lookAt(this._target);
        vc.far = camera.far;
        vc.updateMatrixWorld();
        vc.projectionMatrix.copy(camera.projectionMatrix);

        this.uniforms.uReflMatrix.value
            .set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
            .multiply(vc.projectionMatrix)
            .multiply(vc.matrixWorldInverse);

        // plan de coupe oblique : on ne garde que ce qui est au-dessus du sol
        this._plane.setFromNormalAndCoplanarPoint(n, pos).applyMatrix4(vc.matrixWorldInverse);
        const clip = this._clip.set(this._plane.normal.x, this._plane.normal.y, this._plane.normal.z, this._plane.constant);
        const pm = vc.projectionMatrix.elements,
            q = this._q;
        q.x = (Math.sign(clip.x) + pm[8]) / pm[0];
        q.y = (Math.sign(clip.y) + pm[9]) / pm[5];
        q.z = -1;
        q.w = (1 + pm[10]) / pm[14];
        clip.multiplyScalar(2 / clip.dot(q));
        pm[2] = clip.x;
        pm[6] = clip.y;
        pm[10] = clip.z + 1 - 0.003;
        pm[14] = clip.w;

        const r = this.renderer,
            prev = r.getRenderTarget();
        const vis = this.hidden.map((o) => o.visible),
            shownVis = this.shown.map((o) => o.visible);
        this.hidden.forEach((o) => (o.visible = false));
        this.shown.forEach((o) => (o.visible = true));
        r.setRenderTarget(this.target);
        r.clear();
        r.render(scene, vc);
        r.setRenderTarget(prev);
        this.hidden.forEach((o, i) => (o.visible = vis[i]));
        this.shown.forEach((o, i) => (o.visible = shownVis[i]));
    }
}

// ---------- Rendu haute qualité ----------
// Scène + GTAO (occlusion ambiante) → accumulation progressive → bloom (nuit) → tone mapping.
// Quand rien ne bouge, chaque image est rendue avec un léger décalage sous-pixel de la caméra et
// une position du soleil tirée dans un disque : la moyenne donne des ombres d'aire très douces
// et un anticrénelage propre. Au-delà de `maxSamples`, on arrête de calculer.

const ACCUM_SHADER = {
    uniforms: {tPrev: {value: null}, tCur: {value: null}, weight: {value: 1}},
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tPrev; uniform sampler2D tCur; uniform float weight; varying vec2 vUv;
		void main() { gl_FragColor = mix( texture2D( tPrev, vUv ), texture2D( tCur, vUv ), weight ); }`,
};

export const halton = (i, b) => {
    let f = 1,
        r = 0;
    while (i > 0) {
        f /= b;
        r += f * (i % b);
        i = Math.floor(i / b);
    }
    return r;
};

export class HQPipeline {
    constructor(renderer, scene, {maxSamples = 48} = {}) {
        this.renderer = renderer;
        this.scene = scene;
        this.maxSamples = maxSamples;
        this.samples = 0;
        const rt = () => new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType});

        this.main = new EffectComposer(renderer, rt());
        this.main.renderToScreen = false;
        this.renderPass = new RenderPass(scene, new THREE.PerspectiveCamera());
        this.gtao = new GTAOPass(scene, new THREE.PerspectiveCamera(), 1, 1);
        this.gtao.updateGtaoMaterial({radius: 0.3, distanceExponent: 1.5, thickness: 1, scale: 1.1, samples: 16});
        this.gtao.updatePdMaterial({lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16});
        this.gtao.blendIntensity = 0.85;
        this.main.addPass(this.renderPass);
        this.main.addPass(this.gtao);

        this.accum = [rt(), rt()];
        this.accumQuad = new FullScreenQuad(new THREE.ShaderMaterial(ACCUM_SHADER));

        this.display = new EffectComposer(renderer, rt());
        this.texturePass = new TexturePass(null);
        this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.4, 1.4); // seules les sources très lumineuses diffusent
        this.display.addPass(this.texturePass);
        this.display.addPass(this.bloom);
        this.display.addPass(new OutputPass());
    }

    setSize(w, h, pixelRatio) {
        for (const c of [this.main, this.display]) {
            c.setPixelRatio(pixelRatio);
            c.setSize(w, h);
        }
        for (const t of this.accum) t.setSize(Math.round(w * pixelRatio), Math.round(h * pixelRatio));
        this.size = [w, h];
        this.reset();
    }

    reset() {
        this.samples = 0;
    }

    get converged() {
        return this.samples >= this.maxSamples;
    }

    // `jitter(i)` applique les variations (soleil, lumières) pour l'échantillon i, `restore()` les annule.
    render(camera, {ao = true, bloom = false, jitter, restore, beforeScene} = {}) {
        if (this.converged) return false;
        const i = this.samples;
        const [w, h] = this.size;
        if (i > 0) {
            camera.setViewOffset(w, h, halton(i, 2) - 0.5, halton(i, 3) - 0.5, w, h);
            jitter?.(i);
        }
        beforeScene?.(camera);
        this.renderPass.camera = camera;
        this.gtao.camera = camera;
        this.gtao.enabled = ao && camera.isPerspectiveCamera;
        this.main.render();
        if (i > 0) {
            camera.clearViewOffset();
            restore?.();
        }

        // accumulation : moyenne glissante des échantillons
        const [prev, next] = i % 2 ? [this.accum[0], this.accum[1]] : [this.accum[1], this.accum[0]];
        const mat = this.accumQuad.material;
        mat.uniforms.tPrev.value = prev.texture;
        mat.uniforms.tCur.value = this.main.readBuffer.texture;
        mat.uniforms.weight.value = 1 / (i + 1);
        this.renderer.setRenderTarget(next);
        this.accumQuad.render(this.renderer);
        this.renderer.setRenderTarget(null);

        this.texturePass.map = next.texture;
        this.bloom.enabled = bloom;
        this.display.render();
        this.samples++;
        return true;
    }
}
