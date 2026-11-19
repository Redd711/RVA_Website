// The voxel Philippines: one scene that is the Overview hero (a flyover at golden hour) and,
// as you scroll, the woven map (the land re-weaves into three cloths, one per island group).
// Deterministic: everything moves from the time t passed in, so HyperFrames can render it.
import { THREE, Vox, meshVox, rng, hash3 } from './voxel-kit.js';
import * as M from './models.js';
import { WORLD } from './world-data.js';
import { PLACES, REGIONS, LANDMARKS, SCROLL, HERO, PAN_END } from './places.js';

const LH = 0.55;          // world units per terrain level (255 m of real height, exaggerated)
const VS = 0.12;          // world units per prop voxel
const SEA_Y = 0.16;
const BASE_Y = -0.9;
const W = WORLD.w, H = WORLD.h;
const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);

const CLOTH = {
  1: [0xb4573b, 0xc96c4d, 0xdc8f6d],
  2: [0xd09c47, 0xdfb35f, 0xecca88],
  3: [0x4a9183, 0x62a698, 0x86bfb1],
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const backOut = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

// light through moving water: thin bright lines where ripples focus the sun
const CAUSTIC = `
  float caustic(vec2 p, float t) {
    vec2 q = p; float c = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      q = p + vec2(cos(t * 0.7 + q.y * 1.3 + fi), sin(t * 0.9 - q.x * 1.1 + fi));
      c += abs(sin(q.x * 2.0) * sin(q.y * 2.0));
    }
    return pow(clamp(1.0 - c / 3.0, 0.0, 1.0), 6.0) * 3.0;
  }`;
// the swell that washes the letters
const WATER_H = `
  float waterH(vec2 p, float t, float sea) {
    return sea + 0.13 * sin(p.x * 0.8 + t * 1.5) + 0.09 * sin(p.y * 1.1 - t * 1.2) + 0.05 * sin((p.x - p.y) * 1.9 + t * 2.4);
  }`;

export const toWorld = (lon, lat, y = 0) => new V3((lon - WORLD.lon0) / WORLD.cell, y, (WORLD.lat0 - lat) / WORLD.cell);

// ------------------------------------------------------------------ grid
const grid = (() => {
  const bin = atob(WORLD.data);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
})();
const inGrid = (c, r) => c >= 0 && r >= 0 && c < W && r < H;
const cell = (c, r) => (inGrid(c, r) ? grid[r * W + c] : 0);
// level the ground under each village so its houses and dancers stand on one plaza
for (const p of [...PLACES, { lon: LANDMARKS.manila.lon, lat: LANDMARKS.manila.lat }]) {
  const c0 = Math.floor((p.lon - WORLD.lon0) / WORLD.cell), r0 = Math.floor((WORLD.lat0 - p.lat) / WORLD.cell);
  const centre = cell(c0, r0);
  if (!(centre & 0x80)) continue;
  for (let r = r0 - 3; r <= r0 + 3; r++) for (let c = c0 - 3; c <= c0 + 3; c++) {
    const b = cell(c, r);
    if (!(b & 0x80) || (b & 0x10) || Math.hypot(c - c0, r - r0) > 2.6) continue;
    grid[r * W + c] = (b & 0xf0) | (centre & 0x0f);
  }
}
const isLand = (c, r) => (cell(c, r) & 0x80) !== 0;
const levelAt = (c, r) => (isLand(c, r) ? cell(c, r) & 0x0f : 0);
export const regionAt = (c, r) => (isLand(c, r) ? (cell(c, r) >> 5) & 3 : 0);
const isLake = (c, r) => isLand(c, r) && (cell(c, r) & 0x10) !== 0;
const topY = (c, r) => (isLand(c, r) ? levelAt(c, r) * LH - (isLake(c, r) ? 0.18 : 0) : SEA_Y);
export const groundY = (x, z) => topY(Math.floor(x), Math.floor(z));

// ------------------------------------------------------------------ shared shader patch
const shared = {
  uWeave: { value: 0 },
  uMask: { value: new V3(1, 1, 1) },
  uTime: { value: 0 },
  uLH: { value: LH },
};

function patch(mat, { cloth = false, shrink = false, strata = false, fade = false } = {}) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, shared);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aRegion;
        ${cloth ? 'attribute vec3 aCloth; varying vec3 vCloth;' : ''}
        uniform float uWeave; uniform vec3 uMask; uniform float uTime;
        varying float vDim; varying float vWeave; varying vec3 vWP; varying float vSide;
        float weaveAt(float z) { return smoothstep(0.0, 1.0, uWeave * 1.6 - (z / ${H.toFixed(1)}) * 0.6); }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 iOrigin = vec3(0.0);
        #ifdef USE_INSTANCING
          iOrigin = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif
        vWeave = weaveAt(iOrigin.z);
        float act = aRegion < 0.5 ? 1.0 : aRegion < 1.5 ? uMask.x : aRegion < 2.5 ? uMask.y : uMask.z;
        vDim = 1.0 - act;
        vSide = 1.0 - abs(objectNormal.y);
        ${cloth ? 'vCloth = aCloth;' : ''}
        ${shrink ? 'transformed *= max(0.0, 1.0 - vWeave * 1.15);' : ''}
        ${fade ? 'transformed *= max(0.0, 1.0 - uWeave * 1.4);' : ''}`)
      .replace('#include <project_vertex>', `
        vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition.y -= vDim * 0.55;
        vWP = mvPosition.xyz;
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uLH;
        varying float vDim; varying float vWeave; varying vec3 vWP; varying float vSide;
        ${cloth ? 'varying vec3 vCloth;' : ''}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        ${cloth ? `
          float over = mod(floor(vWP.x) + floor(vWP.z), 2.0);
          float thread = over > 0.5 ? step(0.5, fract(vWP.x * 3.0)) : step(0.5, fract(vWP.z * 3.0));
          vec3 cl = vCloth * mix(1.0, 0.84, thread * (1.0 - vSide));
          diffuseColor.rgb = mix(diffuseColor.rgb, cl, vWeave);` : ''}
        ${strata ? `
          float band = step(0.86, fract(vWP.y / uLH + 0.02));
          diffuseColor.rgb *= 1.0 - 0.14 * band * vSide;` : ''}
        float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * vec3(0.6, 0.64, 0.76), vDim * 0.85);`);
  };
  mat.customProgramCacheKey = () => `vox${+cloth}${+shrink}${+strata}${+fade}`;
  return mat;
}

// ------------------------------------------------------------------ world
export async function createWorld(canvas, opts = {}) {
  const small = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
  let dprCap = opts.maxDpr ?? (small ? 1.5 : 1.75);
  renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  const fogCol = new THREE.Color(0xd9b98f);
  scene.fog = new THREE.Fog(fogCol, 60, 220);
  const cam = new THREE.PerspectiveCamera(42, 1, 0.3, 3000);

  // light: a low golden sun from the south-west and an indigo sky fill
  const hemi = new THREE.HemisphereLight(0xc4d3ee, 0x6b5236, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd6a0, 2.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const SUN_OFFSET = new V3(-0.55, 0.62, 0.55).normalize().multiplyScalar(160);

  // ---------------------------------------------------------------- sky
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color(0x1b2742) }, uMid: { value: new THREE.Color(0x46557a) }, uHorizon: { value: new THREE.Color(0xe7c18f) }, uSun: { value: new V3() } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position,1.0)).xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uTop, uMid, uHorizon, uSun; varying vec3 vDir;
      void main(){ float h = vDir.y;
        vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h)); c = mix(c, uTop, smoothstep(0.18, 0.6, h));
        float s = max(dot(normalize(vDir), normalize(uSun)), 0.0);
        c += vec3(1.0, 0.82, 0.55) * (pow(s, 220.0) * 1.2 + pow(s, 8.0) * 0.18);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // ---------------------------------------------------------------- sea
  const depthData = new Uint8Array(W * H * 4);
  {
    const dist = new Int16Array(W * H).fill(99);
    const q = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (isLand(c, r)) { dist[r * W + c] = 0; q.push(c, r); }
    for (let i = 0; i < q.length; i += 2) {
      const c = q[i], r = q[i + 1], d = dist[r * W + c];
      if (d >= 6) continue;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (inGrid(nc, nr) && dist[nr * W + nc] > d + 1) { dist[nr * W + nc] = d + 1; q.push(nc, nr); }
      }
    }
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const i = (r * W + c) * 4, b = cell(c, r);
      depthData[i] = isLand(c, r) ? 0 : Math.min(255, (b & 7) * 36);
      depthData[i + 1] = Math.round(Math.max(0, 1 - dist[r * W + c] / 6) * 255);
      depthData[i + 3] = 255;
    }
  }
  const depthTex = new THREE.DataTexture(depthData, W, H, THREE.RGBAFormat);
  depthTex.magFilter = THREE.LinearFilter; depthTex.minFilter = THREE.LinearFilter;
  depthTex.needsUpdate = true;
  const seaUniforms = {
    uDepth: { value: depthTex }, uTime: shared.uTime, uWeave: shared.uWeave,
    uGrid: { value: new THREE.Vector2(W, H) },
    uShallow: { value: new THREE.Color(0x8ccfc0) }, uMid: { value: new THREE.Color(0x4a92ab) },
    uDeep: { value: new THREE.Color(0x30588a) }, uNight: { value: new THREE.Color(0x1c2945) },
    uSun: { value: new V3() },
    uFogColor: { value: fogCol }, uFogNear: { value: 60 }, uFogFar: { value: 220 },
    uTextC: { value: new THREE.Vector2(-9999, -9999) }, uTextDir: { value: new THREE.Vector2(1, 0) },
    uTextHalf: { value: new THREE.Vector2(1, 1) }, uClear: { value: 0 },
  };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(W + 1600, H + 1600, 1, 1), new THREE.ShaderMaterial({
    uniforms: seaUniforms, transparent: true,
    vertexShader: 'varying vec3 vWP; varying float vDist; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz; vec4 mv = viewMatrix * wp; vDist = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform sampler2D uDepth; uniform float uTime, uWeave, uFogNear, uFogFar; uniform vec2 uGrid;
      uniform vec3 uShallow, uMid, uDeep, uNight, uFogColor, uSun; varying vec3 vWP; varying float vDist;
      uniform vec2 uTextC, uTextDir, uTextHalf; uniform float uClear;
      void main(){
        vec2 uv = vWP.xz / uGrid;
        float inside = step(0.0, uv.x) * step(0.0, uv.y) * step(uv.x, 1.0) * step(uv.y, 1.0);
        vec4 dc = texture2D(uDepth, (floor(vWP.xz) + 0.5) / uGrid);
        vec4 ds = texture2D(uDepth, uv);
        float edge = smoothstep(0.0, 0.07, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
        float depth = mix(1.0, dc.r * 255.0 / 252.0, inside * edge);
        float shore = ds.g * inside;
        vec3 col = mix(uShallow, uMid, smoothstep(0.0, 0.32, depth));
        col = mix(col, uDeep, smoothstep(0.3, 0.8, depth));
        float sw = sin(vWP.x * 0.55 + uTime * 0.5) * sin(vWP.z * 0.42 - uTime * 0.35);
        col *= 1.0 + 0.04 * sw;
        float ring = smoothstep(0.8, 1.0, sin(shore * 19.0 - uTime * 1.4)) * smoothstep(0.2, 0.62, shore);
        col = mix(col, vec3(0.94, 0.91, 0.85), ring * 0.32 + smoothstep(0.78, 0.97, shore) * 0.28);
        // the low sun's path on the water, broken by the swell
        vec3 V = normalize(cameraPosition - vWP);
        vec3 N = normalize(vec3(sin(vWP.x * 1.7 + uTime * 0.9) * 0.08, 1.0, sin(vWP.z * 1.3 - uTime * 0.7) * 0.08));
        float g = pow(max(dot(reflect(-V, N), normalize(uSun)), 0.0), 60.0);
        col += vec3(1.0, 0.82, 0.55) * g * 0.9 * (1.0 - uWeave);
        col = mix(col, mix(uNight, col, 0.22), uWeave * 0.85);
        // around the submerged letters: clearer water, and surf lapping at them
        vec2 rel = vWP.xz - uTextC;
        vec2 loc = vec2(dot(rel, uTextDir), dot(rel, vec2(-uTextDir.y, uTextDir.x)));
        vec2 bq = abs(loc) - uTextHalf;
        float sd = length(max(bq, 0.0)) + min(max(bq.x, bq.y), 0.0);
        float near = (1.0 - smoothstep(0.0, 5.0, sd)) * uClear;
        float lap = smoothstep(0.7, 1.0, sin(sd * 6.0 - uTime * 2.4)) * (1.0 - smoothstep(0.0, 2.5, sd));
        col = mix(col, vec3(0.96, 0.94, 0.89), lap * 0.12 * smoothstep(0.3, 1.0, sd) * uClear);
        float f = smoothstep(uFogNear, uFogFar, vDist);
        gl_FragColor = vec4(mix(col, uFogColor, f), mix(1.0, 0.42, near));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(W / 2, SEA_Y, H / 2);
  scene.add(sea);

  // ---------------------------------------------------------------- terrain
  const col = new THREE.Color();
  const m4 = new THREE.Matrix4();
  const landCells = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (isLand(c, r)) landCells.push([c, r]);
  const terrainGeo = new THREE.BoxGeometry(1, 1, 1);
  terrainGeo.translate(0, 0.5, 0);
  const terrainMat = patch(new THREE.MeshLambertMaterial(), { cloth: true, strata: true });
  const terrain = new THREE.InstancedMesh(terrainGeo, terrainMat, landCells.length);
  const aCloth = new Float32Array(landCells.length * 3), aRegionT = new Float32Array(landCells.length);
  const pick = (arr, s) => arr[Math.floor(s * arr.length) % arr.length];
  landCells.forEach(([c, r], i) => {
    const lv = levelAt(c, r), reg = regionAt(c, r), lake = isLake(c, r);
    const coastal = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => !isLand(c + dc, r + dr));
    const n = hash3(c, r, 7);
    const lat = WORLD.lat0 - (r + 0.5) * WORLD.cell;
    let hex;
    if (lake) hex = 0x6aa6b6;
    else if (lv === 1 && coastal) hex = n > 0.5 ? 0xe6d4a6 : 0xdccb98;
    else if (lv <= 2) hex = n > 0.72 ? 0xc9c06a : pick([0xa3c06a, 0x95b45e, 0xb1c877, 0x8fae58], n);
    else if (lv <= 4) hex = pick([0x6e9a54, 0x5f8b4c, 0x76a35a], n);
    else if (lv <= 6) hex = lat > 15.5 && reg === 1 ? pick([0x4f7a52, 0x58835a], n) : pick([0x4f7a45, 0x5a8550, 0x47703f], n);
    else if (lv <= 8) hex = pick([0x7d7a62, 0x6f6b58, 0x5d7a4a], n);
    else hex = pick([0x9a9283, 0x8c8478, 0xa8a092], n);
    const top = topY(c, r);
    m4.makeScale(1, top - BASE_Y, 1).setPosition(c + 0.5, BASE_Y, r + 0.5);
    terrain.setMatrixAt(i, m4);
    terrain.setColorAt(i, col.setHex(hex));
    const cl = lake ? 0x335a73 : CLOTH[reg][[0, 1, 2, 1][(c + 2 * r) % 4]];
    col.setHex(cl);
    aCloth[i * 3] = col.r; aCloth[i * 3 + 1] = col.g; aCloth[i * 3 + 2] = col.b;
    aRegionT[i] = reg;
  });
  terrainGeo.setAttribute('aCloth', new THREE.InstancedBufferAttribute(aCloth, 3));
  terrainGeo.setAttribute('aRegion', new THREE.InstancedBufferAttribute(aRegionT, 1));
  terrain.castShadow = true;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // ---------------------------------------------------------------- props
  const propMat = patch(new THREE.MeshLambertMaterial({ vertexColors: true }));
  const treeMat = patch(new THREE.MeshLambertMaterial({ vertexColors: true }), { shrink: true });
  const cloudMat = patch(new THREE.MeshLambertMaterial({ vertexColors: true }), { fade: true });
  const geoCache = new Map();
  const geo = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, meshVox(make(), { size: VS })); return geoCache.get(key); };
  const statics = new Map();   // key -> { make, mat, list: [{x,y,z,rot,s,region}] }
  const put = (key, make, x, z, o = {}) => {
    if (!statics.has(key)) statics.set(key, { make, mat: o.mat ?? propMat, list: [] });
    statics.get(key).list.push({ x, y: o.y ?? groundY(x, z), z, rot: o.rot ?? 0, s: o.s ?? 1, region: o.region ?? regionAt(Math.floor(x), Math.floor(z)) });
  };
  const actors = [];
  // where the actors that make a sound are, each frame (the page's sound follows them)
  const tracked = { calesa: new V3(), jeepney: new V3(), eagle: new V3() };
  const dummy = new THREE.Object3D();
  // an actor: count instances of one model, moved every frame by fn(i, t, dummy)
  const actor = (key, make, count, region, fn, mat = propMat) => {
    const g = geo(key, make).clone();
    const regions = new Float32Array(count).fill(region);
    g.setAttribute('aRegion', new THREE.InstancedBufferAttribute(regions, 1));
    const mesh = new THREE.InstancedMesh(g, mat, count);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    const a = { mesh, count, fn, regions };
    actors.push(a);
    return a;
  };
  // two poses that swap on the beat: arms down, arms up
  const dancers = (key, costume, count, region, place, fn, seed = 1) => {
    const A = actor(key + 'A', () => M.person({ ...costume(seed), arms: 'down' }), count, region, (i, t, o) => { fn(i, t, o); if (o.userData.pose) o.scale.setScalar(0); });
    const B = actor(key + 'B', () => M.person({ ...costume(seed), arms: 'up' }), count, region, (i, t, o) => { fn(i, t, o); if (!o.userData.pose) o.scale.setScalar(0); });
    return [A, B];
  };
  const at = (lon, lat) => toWorld(lon, lat);
  const R = rng(20261123);

  // trees: palms by the coast, broadleaf inland, Benguet pines in the Cordillera
  const treeList = { palm: [], round: [], pine: [] };
  const vignetteSpots = [...PLACES.map((p) => at(p.lon, p.lat)), at(LANDMARKS.manila.lon, LANDMARKS.manila.lat)];
  for (const [c, r] of landCells) {
    if (isLake(c, r)) continue;
    const lv = levelAt(c, r), lat = WORLD.lat0 - (r + 0.5) * WORLD.cell;
    const coastal = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => !isLand(c + dc, r + dr));
    for (let k = 0; k < 2; k++) {
      const h = hash3(c, r, 31 + k);
      let type = null;
      if (lv <= 2) type = coastal ? (h > 0.55 ? 'palm' : null) : h > 0.8 ? 'round' : h > 0.7 ? 'palm' : null;
      else if (lv <= 6) type = lat > 15.5 && lv >= 4 && regionAt(c, r) === 1 ? (h > 0.5 ? 'pine' : null) : h > 0.5 ? 'round' : null;
      else if (lv <= 8) type = h > 0.7 ? (lat > 15.5 ? 'pine' : 'round') : null;
      if (!type || (small && k)) continue;
      const x = c + 0.15 + hash3(c, r, 41 + k) * 0.7, z = r + 0.15 + hash3(c, r, 51 + k) * 0.7;
      if (vignetteSpots.some((v) => Math.hypot(v.x - x, v.z - z) < 2.8)) continue;
      treeList[type].push({ x, z, y: topY(c, r), rot: h * 6.28, s: 0.75 + hash3(c, r, 61 + k) * 0.35, region: regionAt(c, r) });
    }
  }
  for (const [type, list] of Object.entries(treeList)) {
    const make = type === 'palm' ? () => M.palm(3) : type === 'pine' ? () => M.pine(2) : () => M.roundTree(4);
    for (const t of list) put('tree-' + type, make, t.x, t.z, { y: t.y, rot: t.rot, s: t.s, region: t.region, mat: treeMat });
  }

  // villages: nipa huts scattered over the lowlands, away from the vignettes
  for (const [c, r] of landCells) {
    const lv = levelAt(c, r);
    if (lv > 3 || isLake(c, r) || hash3(c, r, 77) > 0.022) continue;
    const x = c + 0.5, z = r + 0.5;
    if (vignetteSpots.some((v) => Math.hypot(v.x - x, v.z - z) < 3)) continue;
    put('nipa', () => M.nipaHut(2), x, z, { rot: hash3(c, r, 78) * 6.28 });
  }

  // ---------------------------------------------------------------- vignettes
  const P = Object.fromEntries(PLACES.map((p) => [p.id, at(p.lon, p.lat)]));
  const L = Object.fromEntries(Object.entries(LANDMARKS).map(([k, v]) => [k, at(v.lon, v.lat)]));

  // Vigan: Calle Crisologo, a calesa, strollers, burnay jars
  {
    const v = P.vigan;
    for (let k = 0; k < 4; k++) put('bnb' + (k % 2), () => M.bahayNaBato(k % 2), v.x - 2.1 + k * 1.4, v.z - 0.6, { region: 1 });
    for (let k = 0; k < 3; k++) put('bnb-back' + k, () => M.bahayNaBato(k + 2), v.x - 1.4 + k * 1.4, v.z + 2.2, { rot: Math.PI, region: 1 });
    for (let k = 0; k < 4; k++) put('burnay', () => M.jar(false), v.x + 2.6 + (k % 2) * 0.55, v.z + 0.6 + Math.floor(k / 2) * 0.55, { s: 0.45, region: 1 });
    actor('calesa', M.calesa, 1, 1, (i, t, o) => {
      const s = Math.sin(t * 0.18);
      o.position.set(v.x + s * 2.6, groundY(v.x, v.z + 0.85), v.z + 0.85);
      o.rotation.y = Math.cos(t * 0.18) > 0 ? Math.PI / 2 : -Math.PI / 2;
    }).track = tracked.calesa;
    const strollers = [M.COSTUMES.barong, M.COSTUMES.saya];
    strollers.forEach((cos, k) => actor('vigan-p' + k, () => M.person(cos(10 + k)), 1, 1, (i, t, o) => {
      const s = Math.sin(t * 0.12 + k * 2);
      o.position.set(v.x + s * 1.9, groundY(v.x, v.z) + Math.abs(Math.sin(t * 5 + k)) * 0.03, v.z + 0.3 + k * 0.25);
      o.rotation.y = Math.cos(t * 0.12 + k * 2) > 0 ? Math.PI / 2 : -Math.PI / 2;
    }));
  }

  // Banaue: the terraces, Ifugao houses, farmers and a carabao
  {
    const v = P.banaue;
    const y = groundY(v.x, v.z);
    put('terraces', M.terraces, v.x, v.z, { y: y - 0.2, region: 1 });
    put('ifugao', M.ifugaoHut, v.x - 1.6, v.z - 1.4, { y: y + 1.0, region: 1 });
    put('ifugao', M.ifugaoHut, v.x + 1.4, v.z - 1.6, { y: y + 1.1, region: 1, rot: 0.6 });
    actor('ifugao-farmer', () => M.person(M.COSTUMES.ifugaoMan(3)), 1, 1, (i, t, o) => {
      const a = t * 0.2;
      o.position.set(v.x + Math.cos(a) * 1.1, y + 0.62, v.z + Math.sin(a) * 0.5 - 0.2);
      o.rotation.y = -a;
    });
    actor('ifugao-woman', () => M.person(M.COSTUMES.ifugaoWoman(4)), 1, 1, (i, t, o) => {
      const a = -t * 0.16 + 2;
      o.position.set(v.x + Math.cos(a) * 0.7, y + 0.45, v.z + Math.sin(a) * 0.3 - 0.4);
      o.rotation.y = a + Math.PI;
    });
    actor('carabao-b', M.carabao, 1, 1, (i, t, o) => {
      const s = Math.sin(t * 0.08);
      o.position.set(v.x + 2.4 + s * 0.6, groundY(v.x + 2.4, v.z + 1.4), v.z + 1.4);
      o.rotation.y = Math.cos(t * 0.08) > 0 ? Math.PI / 2 : -Math.PI / 2;
      o.position.y += Math.abs(Math.sin(t * 3)) * 0.02;
    });
  }

  // Lucban: houses dressed for Pahiyas and a procession
  {
    const v = P.lucban;
    for (let k = 0; k < 4; k++) put('pahiyas' + k, () => M.pahiyasHouse(k + 1), v.x - 2.2 + k * 1.5, v.z - 0.7, { region: 1 });
    for (let k = 0; k < 3; k++) put('pahiyas-back' + k, () => M.pahiyasHouse(k + 6), v.x - 1.4 + k * 1.5, v.z + 2.1, { rot: Math.PI, region: 1 });
    const route = (t, k) => { const u = ((t * 0.03 + k * 0.07) % 1 + 1) % 1; return { x: v.x - 3 + u * 6, ang: Math.PI / 2 }; };
    actor('carroza', () => carroza(), 1, 1, (i, t, o) => { const p = route(t, 0); o.position.set(p.x, groundY(p.x, v.z + 0.8), v.z + 0.8); o.rotation.y = p.ang; });
    for (let k = 1; k <= 5; k++) actor('reveler' + k, () => M.person(M.COSTUMES.reveler(k)), 1, 1, (i, t, o) => {
      const p = route(t, -k * 0.55);
      o.position.set(p.x, groundY(p.x, v.z + 0.8) + Math.abs(Math.sin(t * 4 + k)) * 0.04, v.z + 0.65 + (k % 2) * 0.35);
      o.rotation.y = p.ang;
    });
  }

  // Manila: a jeepney on its route
  {
    const v = L.manila;
    actor('jeepney', M.jeepney, 1, 1, (i, t, o) => {
      const s = Math.sin(t * 0.22);
      o.position.set(v.x + 0.6, groundY(v.x + 0.6, v.z + s * 1.8), v.z + s * 1.8);
      o.rotation.y = Math.cos(t * 0.22) > 0 ? 0 : Math.PI;
    }).track = tracked.jeepney;
    for (let k = 0; k < 3; k++) put('manila-hut' + k, () => M.bahayNaBato(20 + k), v.x - 0.8, v.z - 1.2 + k * 1.3, { rot: Math.PI / 2, region: 1 });
  }

  // Mayon and its plume
  {
    const v = L.mayon;
    const y = groundY(v.x, v.z) - 0.3;
    put('mayon', M.mayon, v.x, v.z, { y, region: 1, s: 1.35 });
    const peak = y + 31 * VS * 1.35;
    actor('puff', M.puff, 9, 1, (i, t, o) => {
      const life = 9, age = ((t + i * (life / 9)) % life) / life;
      o.position.set(v.x + age * 2.6 + Math.sin(i * 7) * 0.2, peak + age * 4.5, v.z - age * 1.2);
      o.scale.setScalar((0.6 + age * 2.4) * (age < 0.85 ? 1 : (1 - age) / 0.15));
      o.rotation.set(i, age * 2, 0);
    }, cloudMat);
  }

  // Tabon: the Manunggul jar by the caves
  {
    const v = P.tabon;
    put('manunggul', () => M.jar(true), v.x + 0.3, v.z, { s: 1.5, region: 1 });
  }

  // Kalibo: Ati-Atihan dancers and drummers
  {
    const v = P.kalibo;
    for (let k = 0; k < 3; k++) put('kalibo-hut' + k, () => M.nipaHut(5 + k), v.x - 1.8 + k * 1.6, v.z - 1.4, { region: 2 });
    dancers('ati', M.COSTUMES.ati, 6, 2, v, (i, t, o) => {
      const u = ((t * 0.035 + i * 0.09) % 1);
      const x = v.x - 2.6 + u * 5.2;
      o.position.set(x, groundY(x, v.z) + Math.abs(Math.sin(t * 5 + i)) * 0.09, v.z + 0.4 + (i % 2) * 0.45);
      o.rotation.y = Math.PI / 2 + Math.sin(t * 2 + i) * 0.6;
      o.scale.setScalar(1);
      o.userData.pose = Math.floor(t * 2.4 + i * 0.5) % 2;
    }, 21);
    actor('ati-drum', () => M.person(M.COSTUMES.atiDrum(30)), 2, 2, (i, t, o) => {
      const u = ((t * 0.035 - 0.12 - i * 0.07) % 1 + 1) % 1;
      const x = v.x - 2.6 + u * 5.2;
      o.position.set(x, groundY(x, v.z) + Math.abs(Math.sin(t * 6 + i)) * 0.05, v.z + 0.6);
      o.rotation.y = Math.PI / 2;
    });
  }

  // Cebu: a church and a ring of Sinulog dancers around the Santo Niño
  {
    const v = P.cebu;
    put('church', M.church, v.x - 0.2, v.z - 1.6, { region: 2 });
    const y = groundY(v.x, v.z);
    actor('sinulog-lead', () => M.person({ ...M.COSTUMES.sinulogLead(7), arms: 'up' }), 1, 2, (i, t, o) => {
      o.position.set(v.x, y + Math.abs(Math.sin(t * 2.2)) * 0.06, v.z + 0.6);
      o.rotation.y = Math.sin(t * 0.7) * 0.9;
    });
    dancers('sinulog', M.COSTUMES.sinulog, 8, 2, v, (i, t, o) => {
      const a = (i / 8) * Math.PI * 2 + t * 0.22;
      o.position.set(v.x + Math.cos(a) * 1.05, y + Math.abs(Math.sin(t * 4.4 + i)) * 0.08, v.z + 0.6 + Math.sin(a) * 0.75);
      o.rotation.y = -a + Math.PI / 2 + Math.sin(t * 2.2) * 0.4;
      o.scale.setScalar(1);
      o.userData.pose = Math.floor(t * 2.2 + (i % 2) * 0.5) % 2;
    }, 31);
  }

  // Bohol: the Chocolate Hills
  {
    const v = L.bohol;
    for (let k = 0; k < 18; k++) {
      const x = v.x + (hash3(k, 1, 5) - 0.5) * 3.2, z = v.z + (hash3(k, 2, 5) - 0.5) * 2.4;
      if (!isLand(Math.floor(x), Math.floor(z))) continue;
      put('choco' + (k % 3), () => M.chocolateHill(k % 3 + 1), x, z, { region: 2, s: 0.7 + hash3(k, 3, 5) * 0.35 });
    }
  }

  // Lake Lanao: a torogan and a kulintang player
  {
    const v = P.lanao;
    put('torogan', M.torogan, v.x - 0.4, v.z - 0.9, { region: 3 });
    put('kulintang', M.kulintang, v.x + 0.2, v.z + 0.7, { region: 3, s: 0.85 });
    put('kulintang-player', () => M.personSitting(M.COSTUMES.maranao(9)), v.x + 0.2, v.z + 1.3, { region: 3, rot: Math.PI });
    actor('maranao-walk', () => M.person(M.COSTUMES.maranao(12)), 2, 3, (i, t, o) => {
      const s = Math.sin(t * 0.14 + i * 3);
      o.position.set(v.x - 1.6 + s * 1.2, groundY(v.x - 1.6, v.z + 0.9) + Math.abs(Math.sin(t * 5 + i)) * 0.03, v.z + 0.9 + i * 0.4);
      o.rotation.y = Math.cos(t * 0.14 + i * 3) > 0 ? Math.PI / 2 : -Math.PI / 2;
    });
  }

  // Davao: Kadayawan street dancers, and the Philippine eagle over Mount Apo
  {
    const v = P.davao;
    dancers('kadayawan', M.COSTUMES.kadayawan, 8, 3, v, (i, t, o) => {
      const row = Math.floor(i / 4), k = i % 4;
      const x = v.x - 1.2 + k * 0.8 + Math.sin(t * 1.6 + row) * 0.25;
      o.position.set(x, groundY(x, v.z) + Math.abs(Math.sin(t * 4 + i)) * 0.08, v.z + row * 0.8);
      o.rotation.y = Math.sin(t * 1.6 + row) * 0.5;
      o.scale.setScalar(1);
      o.userData.pose = Math.floor(t * 2 + row * 0.5) % 2;
    }, 41);
    for (let k = 0; k < 3; k++) put('davao-hut' + k, () => M.nipaHut(9 + k), v.x - 1.5 + k * 1.5, v.z - 1.6, { region: 3 });
    const apo = L.apo;
    const ay = groundY(apo.x, apo.z);
    actor('eagle', () => M.eagle(0), 1, 3, (i, t, o) => {
      const a = t * 0.35;
      o.position.set(apo.x + Math.cos(a) * 4, ay + 5 + Math.sin(t * 0.8) * 0.4, apo.z + Math.sin(a) * 3);
      o.rotation.set(0, -a, 0.35);
      o.scale.setScalar(1.5);
    }).track = tracked.eagle;
  }

  // Lake Sebu: a T'boli house, a weaver at her loom, women by the lake
  {
    const v = P.lakesebu;
    put('longhouse', M.longhouse, v.x - 0.8, v.z - 1, { region: 3 });
    put('pond', pond, v.x + 1.3, v.z + 0.2, { region: 3, y: groundY(v.x, v.z) - 0.02 });
    put('loom', M.loomWithCloth, v.x - 0.2, v.z + 0.5, { region: 3, rot: Math.PI });
    put('weaver', () => M.personSitting(M.COSTUMES.tboli(5)), v.x - 0.2, v.z + 1.0, { region: 3, rot: Math.PI });
    actor('tboli-walk', () => M.person(M.COSTUMES.tboli(14)), 2, 3, (i, t, o) => {
      const a = t * 0.17 + i * Math.PI;
      o.position.set(v.x + 1.3 + Math.cos(a) * 1.1, groundY(v.x, v.z) + Math.abs(Math.sin(t * 5 + i)) * 0.03, v.z + 0.2 + Math.sin(a) * 0.9);
      o.rotation.y = -a;
    });
  }

  // the seas: vintas off Zamboanga, a whale shark off Donsol, bancas along the coasts
  {
    const z = L.zamboanga;
    const sails = [[C().red, C().yellow, C().green, C().blue, C().white], [C().teal, C().yellow, C().red, C().white], [C().blue, C().red, C().yellow, C().green]];
    sails.forEach((s, k) => actor('vinta' + k, () => M.vinta(s), 1, 3, (i, t, o) => {
      const a = t * 0.09 + k * 2.1;
      o.position.set(z.x + Math.cos(a) * (2.2 + k * 0.6), SEA_Y - 0.02 + Math.sin(t * 1.3 + k) * 0.03, z.z + 1.6 + Math.sin(a) * 1.4);
      o.rotation.set(Math.sin(t * 1.1 + k) * 0.05, -a, Math.sin(t * 0.9 + k) * 0.06);
    }));
    const d = L.donsol;
    actor('whaleshark', M.whaleShark, 1, 1, (i, t, o) => {
      const a = t * 0.07;
      o.position.set(d.x + Math.cos(a) * 2.2, SEA_Y - 0.36, d.z + Math.sin(a) * 1.6);
      o.rotation.y = -a;
    });
    // bancas: anchored in shallow water near the coast, each drifting on its own circle
    const spots = [];
    for (let r = 2; r < H - 2; r += 3) for (let c = 2; c < W - 2; c += 3) {
      const i = (r * W + c) * 4;
      if (!isLand(c, r) && depthData[i + 1] > 150 && hash3(c, r, 91) > 0.82) spots.push([c + 0.5, r + 0.5]);
    }
    const n = Math.min(spots.length, small ? 18 : 34);
    actor('banca', () => M.banca(), n, 0, (i, t, o) => {
      const [x, zz] = spots[Math.floor(i * spots.length / n)];
      const a = t * 0.05 + i * 1.7;
      o.position.set(x + Math.cos(a) * 0.9, SEA_Y - 0.03 + Math.sin(t * 1.4 + i) * 0.025, zz + Math.sin(a) * 0.9);
      o.rotation.set(Math.sin(t + i) * 0.04, -a, 0);
    });
  }

  // birds over the islands, clouds that drift and clear away when the map weaves
  {
    const centres = [P.banaue, P.lucban, P.cebu, P.davao, L.bohol, P.kalibo].map((v) => v.clone());
    actor('birds', M.bird, centres.length * 5, 0, (i, t, o) => {
      const f = Math.floor(i / 5), k = i % 5, cc = centres[f];
      const a = t * 0.3 + f;
      o.position.set(cc.x + Math.cos(a) * 3.5 + (k % 3) * 0.35, 6 + f % 3 + Math.sin(t * 2 + k) * 0.1, cc.z + Math.sin(a) * 2.5 + Math.floor(k / 3) * 0.35);
      o.rotation.set(0, -a, 0);
      o.scale.set(1.4, 1.4 * (0.6 + Math.abs(Math.sin(t * 7 + k)) * 0.6), 1.4);
    }, cloudMat);
    const cl = actor('clouds', () => M.cloud(5), 16, 0, (i, t, o) => {
      const span = W + 60;
      const x = ((hash3(i, 1, 3) * span + t * 0.35) % span) - 30;
      o.position.set(x, 21 + hash3(i, 2, 3) * 6, hash3(i, 3, 3) * (H - 10) + 5);
      o.scale.setScalar(2.2 + hash3(i, 4, 3) * 1.6);
      o.rotation.y = hash3(i, 5, 3) * 3;
    }, cloudMat);
    cl.mesh.castShadow = true;
  }

  // build every static batch into one instanced mesh per model
  for (const [key, b] of statics) {
    const g = geo(key, b.make).clone();
    const regions = new Float32Array(b.list.length);
    const mesh = new THREE.InstancedMesh(g, b.mat, b.list.length);
    b.list.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(0, p.rot, 0); dummy.scale.setScalar(p.s);
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); regions[i] = p.region;
    });
    g.setAttribute('aRegion', new THREE.InstancedBufferAttribute(regions, 1));
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }

  // ---------------------------------------------------------------- camera rig
  // The journey: from the first frame by Vigan the camera swings round to face down the archipelago,
  // then flies in a straight line to Mindanao's south coast, behind and above the ground it looks at.
  const panA = at(HERO.lon, HERO.lat), panB = at(PAN_END[0], PAN_END[1]);
  const panDir = new V3(panB.x - panA.x, 0, panB.z - panA.z);
  const PAN_LEN = panDir.length();
  panDir.normalize();
  const panSide = new V3(-panDir.z, 0, panDir.x);
  const heroB = THREE.MathUtils.degToRad(HERO.bearing);
  const heroDir = new V3(Math.sin(heroB), 0, -Math.cos(heroB)), heroSide = new V3(-heroDir.z, 0, heroDir.x);
  const yaw0 = Math.atan2(heroDir.z, heroDir.x);
  const turn = Math.atan2(Math.sin(Math.atan2(panDir.z, panDir.x) - yaw0), Math.cos(Math.atan2(panDir.z, panDir.x) - yaw0));
  // the first frame's camera height, as it has always been
  const heroCam = panA.clone().addScaledVector(heroDir, -15).addScaledVector(heroSide, 5);
  const HERO_Y = Math.max(Math.max(HERO.y, 1.5) + 7.2, groundY(heroCam.x, heroCam.z) + 3.5);
  // flying height along the line: 9.5 over the ground ahead, 4.5 clear of the ground below, smoothed so it never bobs
  const PROF0 = -20, profN = Math.ceil(PAN_LEN + 30) + 1;
  const groundMax = (x, z) => { let m = SEA_Y; for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) m = Math.max(m, groundY(x + dx, z + dz)); return m; };
  const flyRaw = new Float32Array(profN), aimRaw = new Float32Array(profN);
  for (let i = 0; i < profN; i++) {
    const fx = panA.x + panDir.x * (PROF0 + i), fz = panA.z + panDir.z * (PROF0 + i);
    const g = groundMax(fx, fz);
    flyRaw[i] = Math.max(Math.max(g, 1.5) + 9.5, groundMax(fx - panDir.x * 15 + panSide.x * 5, fz - panDir.z * 15 + panSide.z * 5) + 4.5);
    aimRaw[i] = g + 0.5;
  }
  const blur = (a) => a.map((_, i) => { let s = 0; for (let k = -8; k <= 8; k++) s += a[Math.min(profN - 1, Math.max(0, i + k))]; return s / 17; });
  const flyY = blur(blur(flyRaw)), aimY = blur(blur(aimRaw));
  const profile = (a, s) => { const x = Math.min(profN - 1.001, Math.max(0, s - PROF0)), i = Math.floor(x); return a[i] + (a[i + 1] - a[i]) * (x - i); };
  // the share of the journey spent swinging round, and where the flight starts within it
  const J_TURN = 0.075, J_GO = 0.03;
  // distance along the line at journey fraction j: easing in and out, steady in between
  const travel = (j) => {
    const x = clamp01((j - J_GO) / (1 - J_GO)), k = 0.08;
    return (PAN_LEN * (x < k ? (x * x) / (2 * k) : x > 1 - k ? 1 - k - ((1 - x) * (1 - x)) / (2 * k) : x - k / 2)) / (1 - k);
  };
  const land = { min: new V3(Infinity, 0, Infinity), max: new V3(-Infinity, 4, -Infinity) };
  const regionBox = { 1: null, 2: null, 3: null };
  for (const [c, r] of landCells) {
    land.min.x = Math.min(land.min.x, c); land.min.z = Math.min(land.min.z, r);
    land.max.x = Math.max(land.max.x, c + 1); land.max.z = Math.max(land.max.z, r + 1);
    const g = regionAt(c, r);
    const b = regionBox[g] ?? (regionBox[g] = { min: new V3(c, 0, r), max: new V3(c + 1, 4, r + 1) });
    b.min.x = Math.min(b.min.x, c); b.min.z = Math.min(b.min.z, r); b.max.x = Math.max(b.max.x, c + 1); b.max.z = Math.max(b.max.z, r + 1);
  }

  const state = {
    w: 1, h: 1, t: 0, progress: 0, weave: 0, land: 1, inset: 0, insetTarget: 0, insetY: 0, insetYTarget: 0,
    mode: 'overview', region: 0, place: null, hover: null, det: false, started: false,
    j: 0, pe: 0, lastP: 0, s: 0, sink: 0,
    mask: new V3(1, 1, 1), flight: null, streak: 0,
  };

  const pose =(pos, target, fov) => ({ pos: pos.clone(), target: target.clone(), fov });
  let mapPose = null;     // where the map camera rests (overview, region or place)
  let mapCur = null;      // where it is now, which flights move toward mapPose

  const fitCam = new THREE.PerspectiveCamera();
  const corner = new V3();
  function fit(box, pitchDeg, yawDeg = 0, fov = 38) {
    const centre = box.min.clone().add(box.max).multiplyScalar(0.5);
    const p = THREE.MathUtils.degToRad(pitchDeg), y = THREE.MathUtils.degToRad(yawDeg);
    const dir = new V3(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p));
    fitCam.fov = fov; fitCam.aspect = state.w / state.h; fitCam.near = 0.5; fitCam.far = 5000; fitCam.updateProjectionMatrix();
    const xLim = 0.9 - (state.insetTarget * 2) / state.w, yLim = 0.84 - (state.insetYTarget * 2) / state.h;
    let lo = 5, hi = 3000;
    for (let i = 0; i < 24; i++) {
      const d = (lo + hi) / 2;
      fitCam.position.copy(centre).addScaledVector(dir, d);
      fitCam.lookAt(centre); fitCam.updateMatrixWorld();
      let ok = true;
      for (let k = 0; k < 8 && ok; k++) {
        corner.set(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z).project(fitCam);
        if (Math.abs(corner.x) > xLim || Math.abs(corner.y) > yLim) ok = false;
      }
      if (ok) hi = d; else lo = d;
    }
    return pose(centre.clone().addScaledVector(dir, hi), centre, fov);
  }
  const overviewPose = () => fit(land, 64, 0, 38);
  const regionPose = (r) => fit(regionBox[r], 58, r === 2 ? 8 : 0, 38);
  // landed on a place, a drag turns the camera around it on the same radius, always looking at it; a flick
  // keeps it turning for a moment and the view eases after the pointer, as on the story stages
  const orbit = { yaw: 0, yawGoal: 0, tilt: 0, tiltGoal: 0, spin: 0, dragging: false };
  function placePose(id) {
    const p = PLACES.find((q) => q.id === id), v = P[id];
    const target = new V3(v.x, groundY(v.x, v.z) + 0.6, v.z + 0.3);
    const d = p.view.dist * 1.45, h = p.view.height * 1.45, r = Math.hypot(d, h), own = id === state.place;
    const yaw = THREE.MathUtils.degToRad(p.view.yaw) + (own ? orbit.yaw : 0);
    const el = THREE.MathUtils.clamp(Math.atan2(h, d) + (own ? orbit.tilt : 0), 0.22, 1.25);
    const pos = target.clone().add(new V3(Math.sin(yaw) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(yaw) * Math.cos(el) * r));
    pos.y = Math.max(pos.y, groundMax(pos.x, pos.z) + 1.5);   // never inside a hill on the far side
    return pose(pos, target, 36);
  }

  function flyTo(dest, dur = 1.9) {
    if (!mapCur) mapCur = pose(dest.pos, dest.target, dest.fov);
    mapPose = dest;
    const from = pose(mapCur.pos, mapCur.target, mapCur.fov);
    const lift = from.pos.distanceTo(dest.pos) * 0.32;
    const mid = from.pos.clone().lerp(dest.pos, 0.5);
    mid.y += lift;
    const side = new V3().subVectors(dest.target, from.target).cross(UP);
    if (side.lengthSq() > 1e-6) mid.add(side.normalize().multiplyScalar(lift * 0.45));
    state.flight = { from, to: dest, mid, t0: state.t, dur };
  }

  const flyPos = new V3(), flyTarget = new V3(), head = new V3(), side = new V3();
  // the journey camera: b is how far it has swung from the first frame's view to face down the line,
  // along how far its ground point has flown down the line; it sits behind, right of and above that point
  function flyPose(b, along) {
    const yaw = yaw0 + turn * b;
    head.set(Math.cos(yaw), 0, Math.sin(yaw));
    side.set(-head.z, 0, head.x);
    const fx = panA.x + panDir.x * along, fz = panA.z + panDir.z * along;
    flyPos.set(fx - head.x * 15 + side.x * 5, lerp(HERO_Y, profile(flyY, along), b), fz - head.z * 15 + side.z * 5);
    const ahead = lerp(10, 5, b);
    flyTarget.set(fx + head.x * ahead, lerp(Math.max(HERO.y, SEA_Y) + 0.5, profile(aimY, along), b), fz + head.z * ahead);
  }

  // ---------------------------------------------------------------- the submerged words
  // "Pearl of the Orient Seas." as a voxel object standing in the sea ahead of the first frame, its
  // last line half under water: the swell washes a waterline across it, light ripples on what is below.
  const TVS = 0.2;
  const pearl = new THREE.Group();
  scene.add(pearl);
  const pearlMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  pearlMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shared.uTime;
    sh.uniforms.uSeaY = { value: SEA_Y };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPt; varying vec3 vNW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPt = (modelMatrix * vec4(transformed, 1.0)).xyz; vNW = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTime, uSeaY; varying vec3 vWPt; varying vec3 vNW;
        ${CAUSTIC}
        ${WATER_H}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float d = waterH(vWPt.xz, uTime, uSeaY) - vWPt.y;
        float under = smoothstep(-0.03, 0.06, d);
        // pearl: a soft sheen that shifts with the angle of view and the light
        vec3 V = normalize(cameraPosition - vWPt);
        float fr = pow(1.0 - max(dot(normalize(vNW), V), 0.0), 2.0);
        vec3 iri = 0.5 + 0.5 * cos(6.2831 * (fr * 0.8 + vWPt.y * 0.04 + uTime * 0.04 + vec3(0.0, 0.33, 0.67)));
        diffuseColor.rgb *= mix(vec3(1.0), 0.86 + 0.28 * iri, 0.6 * (1.0 - under));
        // below the surface: tinted by depth, with caustic light
        float dep = clamp(d / 3.5, 0.0, 1.0);
        vec3 wcol = mix(vec3(0.6, 0.86, 0.84), vec3(0.18, 0.38, 0.56), dep);
        float ca = caustic(vWPt.xz * 0.9 + vec2(vWPt.y * 0.4), uTime);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * wcol + vec3(0.9, 0.97, 1.0) * ca * 0.35 * (1.0 - dep), under);
        // the foam line where the swell meets the letters
        float foam = 1.0 - smoothstep(0.0, 0.11, abs(d));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.96, 0.92), foam * 0.85);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * mix(0.55, 0.2, under);`);
  };
  pearlMat.customProgramCacheKey = () => 'pearl';

  // a sandy floor under the clear water around the letters
  const seabed = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uFogColor: seaUniforms.uFogColor, uFogNear: seaUniforms.uFogNear, uFogFar: seaUniforms.uFogFar },
    vertexShader: 'varying vec3 vWP; varying float vDist; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz; vec4 mv = viewMatrix * wp; vDist = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uTime, uFogNear, uFogFar; uniform vec3 uFogColor; varying vec3 vWP; varying float vDist;
      ${CAUSTIC}
      void main(){
        float ca = caustic(vWP.xz * 0.7, uTime);
        vec3 c = mix(vec3(0.11, 0.24, 0.4), vec3(0.18, 0.34, 0.48), 0.5 + 0.5 * sin(vWP.x * 0.3) * sin(vWP.z * 0.25));
        c += vec3(0.7, 0.85, 0.95) * ca * 0.16;
        gl_FragColor = vec4(mix(c, uFogColor, smoothstep(uFogNear, uFogFar, vDist)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  seabed.rotation.x = -Math.PI / 2;
  const seabedPivot = new THREE.Group();
  seabedPivot.add(seabed);
  scene.add(seabedPivot);

  let pearlMesh = null, pearlInfo = null, pearlLayout = '', pearlReady = false;
  const pearlBase = new V3();
  async function rasterLines(lines) {
    const font = '600 56px "Cormorant Garamond", "EB Garamond", Georgia, serif';
    if (document.fonts?.load) await Promise.race([document.fonts.load(font).catch(() => {}), new Promise((r) => setTimeout(r, 2500))]);
    const c = document.createElement('canvas');
    const g = c.getContext('2d', { willReadFrequently: true });
    g.font = font;
    const lineH = 58, top = 46;
    const Wc = Math.ceil(Math.max(...lines.map((l) => g.measureText(l).width))) + 8, Hc = lineH * lines.length + 16;
    c.width = Wc; c.height = Hc;
    g.font = font; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    lines.forEach((l, i) => g.fillText(l, Wc / 2, top + i * lineH));
    const data = g.getImageData(0, 0, Wc, Hc).data;
    const v = new Vox();
    for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) {
      if (data[(y * Wc + x) * 4 + 3] < 120) continue;
      for (let z = 0; z < 5; z++) v.set(x, Hc - y, z, 0xf1ebe0);
    }
    const b = v.bounds();
    const baseline = Hc - (top + (lines.length - 1) * lineH);
    // the water cuts the last line a little under half way up its capitals
    return { v, waterRow: baseline + 16 - b.y0, wUnits: (b.x1 - b.x0 + 1) * TVS, hUnits: (b.y1 - b.y0 + 1) * TVS };
  }
  async function placePearl() {
    const aspect = state.w / state.h;
    const layout = aspect >= 1.1 ? 'wide' : 'tall';
    if (layout !== pearlLayout) {
      pearlLayout = layout;
      const r = await rasterLines(layout === 'wide' ? ['Pearl of the', 'Orient Seas.'] : ['Pearl of', 'the Orient', 'Seas.']);
      if (pearlMesh) { pearl.remove(pearlMesh); pearlMesh.geometry.dispose(); }
      pearlMesh = new THREE.Mesh(meshVox(r.v, { size: TVS, jitter: 0.035 }), pearlMat);
      pearl.add(pearlMesh);
      pearlInfo = r;
    }
    // stand the words in open water ahead of the first frame, as wide as most of the view
    flyPose(0, 0);
    const fwd = new V3().subVectors(flyTarget, flyPos); fwd.y = 0; fwd.normalize();
    const along = new V3(-fwd.z, 0, fwd.x);
    const tanF = Math.tan(THREE.MathUtils.degToRad(21));
    const fitScale = (d) => Math.min(1, (0.34 * 2 * d * tanF) / pearlInfo.hUnits, (0.8 * 2 * d * tanF * aspect) / pearlInfo.wUnits);
    fitCam.fov = 42; fitCam.aspect = aspect; fitCam.near = 0.3; fitCam.far = 3000; fitCam.updateProjectionMatrix();
    fitCam.position.copy(flyPos); fitCam.lookAt(flyTarget); fitCam.updateMatrixWorld();
    let pick = null, best = Infinity;
    for (let d = 26; d <= 95; d += 0.5) {
      const scale = fitScale(d), half = (pearlInfo.wUnits * scale) / 2 + 1.5;
      const c = flyPos.clone().addScaledVector(fwd, d);
      let clear = true;
      for (let k = -half; k <= half && clear; k += 0.5) for (const o of [-1.2, 0, 1.2]) {
        if (isLand(Math.floor(c.x + along.x * k + fwd.x * o), Math.floor(c.z + along.z * k + fwd.z * o))) { clear = false; break; }
      }
      if (!clear) continue;
      const yFrac = 0.5 - new V3(c.x, SEA_Y, c.z).project(fitCam).y * 0.5;
      const miss = Math.abs(yFrac - (aspect >= 1.1 ? 0.5 : 0.54));
      if (miss < best) { best = miss; pick = { c, scale }; }
    }
    pick ??= { c: flyPos.clone().addScaledVector(fwd, 55), scale: fitScale(55) };
    const sc = pick.scale;
    pearl.position.set(pick.c.x, 0, pick.c.z);
    pearl.rotation.set(0, Math.atan2(-fwd.x, -fwd.z), 0);
    pearl.scale.setScalar(sc);
    pearlBase.set(pick.c.x, SEA_Y - pearlInfo.waterRow * TVS * sc, pick.c.z);
    seaUniforms.uTextC.value.set(pick.c.x, pick.c.z);
    seaUniforms.uTextDir.value.set(along.x, along.z);
    seaUniforms.uTextHalf.value.set((pearlInfo.wUnits * sc) / 2, 0.5 * sc + 0.1);
    seabedPivot.position.set(pick.c.x, SEA_Y - 4.5, pick.c.z);
    seabedPivot.rotation.y = pearl.rotation.y;
    // large enough that a low view through the clear water always lands on it, never on the sky
    seabed.scale.set(pearlInfo.wUnits * sc + 90, 160, 1);
  }
  // the words sink out of sight as the journey begins
  function updatePearl(t, p) {
    if (!pearlInfo) return;
    const sink = smooth(0.004, SCROLL.journeyStart + 0.025, p);
    state.sink = sink;
    const bob = Math.sin(t * 0.8) * 0.07;
    pearl.position.y = pearlBase.y - sink * (pearlInfo.hUnits * pearl.scale.x + 3) + bob;
    pearl.rotation.z = Math.sin(t * 0.6) * 0.006;
    const on = sink < 0.999;
    pearl.visible = on;
    seabedPivot.visible = on;
    seaUniforms.uClear.value = on ? 1 - sink : 0;
  }

  // ---------------------------------------------------------------- explore marks
  // a voxel exclamation mark over every place you can open: it pops when the flying camera comes near
  // and the place is in view, folds away once the camera is well past, and on the map it is what you click
  const MARK_H = 16 * VS;
  const markMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  markMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.45;');
  };
  markMat.customProgramCacheKey = () => 'mark';
  const marks = new THREE.InstancedMesh(meshVox(M.exclaim(), { size: VS, jitter: 0.02 }), markMat, PLACES.length);
  marks.castShadow = true;
  marks.frustumCulled = false;
  marks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  PLACES.forEach((pl, i) => marks.setColorAt(i, col.set(REGIONS[pl.region].cloth)));
  scene.add(marks);
  const markState = PLACES.map((pl) => ({ on: false, near: false, t0: -99, rk: 1, hk: 1, scale: 0, base: new V3(P[pl.id].x, groundY(P[pl.id].x, P[pl.id].z) + 2.5, P[pl.id].z) }));
  const NEAR_IN = 38, NEAR_OUT = 44;   // world units from the camera
  const ndc = new V3();
  function updateMarks(t, dt, p, s) {
    const tanF = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    PLACES.forEach((pl, i) => {
      const ms = markState[i];
      const dist = cam.position.distanceTo(ms.base);
      // near: on the journey, by distance (and in view when it first pops); the zoom out keeps what is up
      if (p < SCROLL.journeyStart) ms.near = false;
      else if (s < 0.02 || state.det) {
        ndc.copy(ms.base).project(cam);
        const seen = ndc.z < 1 && Math.abs(ndc.x) < 0.95 && Math.abs(ndc.y) < 0.95;
        ms.near = s < 0.02 && (state.det ? dist < NEAR_IN && seen : ms.near ? dist < NEAR_OUT : dist < NEAR_IN && seen);
      }
      const late = s > 0.25 + i * 0.045;
      const want = ms.near || late;
      if (want !== ms.on) { ms.on = want; ms.t0 = t; }
      let pop;
      if (state.det) pop = want ? backOut(clamp01(ms.near ? (NEAR_IN - dist) / 4 : (s - 0.25 - i * 0.045) / 0.06)) : 0;
      else pop = want ? backOut(clamp01((t - ms.t0) / 0.55)) : Math.max(0, 1 - (t - ms.t0) / 0.25);
      const rk = state.mode === 'place' ? 0 : !state.region || state.region === pl.region ? 1 : 0;
      ms.rk += (rk - ms.rk) * Math.min(1, dt * 6);
      ms.hk += ((state.hover === pl.id ? 1.3 : 1) - ms.hk) * Math.min(1, dt * 10);
      // keep a steady size on screen, from the journey down low to the map high above
      const px = state.mode === 'place' ? 62 : lerp(80, 60, s);
      const k = Math.max(state.mode === 'place' ? 0.5 : 1, ((px / state.h) * 2 * dist * tanF) / MARK_H);
      ms.scale = k * pop * ms.rk * ms.hk;
      dummy.position.copy(ms.base);
      dummy.position.y += (Math.sin(t * 2.2 + i) * 0.5 + 0.5) * 0.12 * k;
      dummy.rotation.set(0, t * 1.4 + i, 0);
      dummy.scale.setScalar(Math.max(1e-4, ms.scale));
      dummy.updateMatrix();
      marks.setMatrixAt(i, dummy.matrix);
    });
    marks.instanceMatrix.needsUpdate = true;
  }

  // ---------------------------------------------------------------- frame
  const out = { pos: new V3(), target: new V3(), fov: 42 };
  const tmpA = new V3(), tmpB = new V3();
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn({ mode: state.mode, region: state.region, place: state.place }));

  function update(dt) {
    const t = state.t;
    shared.uTime.value = t;
    // scroll: the hero, then the flight down the islands, then the zoom out to the woven map.
    // The world glides after the scroll (about half a second to settle), so a notched wheel moves it
    // smoothly and it stops when the scroll stops; a long jump in one go (skip to the map) cuts.
    const jump = Math.abs(state.progress - state.lastP) > 0.15;
    state.lastP = state.progress;
    state.pe = state.det || !state.started || jump ? state.progress : state.pe + (state.progress - state.pe) * (1 - Math.exp(-dt * 6));
    state.started = true;
    const p = state.pe;
    state.j = clamp01((p - SCROLL.journeyStart) / (SCROLL.journeyEnd - SCROLL.journeyStart));
    const s = smooth(SCROLL.journeyEnd, SCROLL.mapAt, p);
    state.s = s;
    // landing on a place unweaves the cloth back into land; leaving weaves it again
    state.land += ((state.mode === 'place' ? 0 : 1) - state.land) * Math.min(1, dt * 1.6);
    state.weave = smooth(SCROLL.journeyEnd + 0.025, SCROLL.mapAt + 0.005, p) * state.land;
    shared.uWeave.value = state.weave;
    if (!mapPose) { mapPose = overviewPose(); mapCur = pose(mapPose.pos, mapPose.target, mapPose.fov); }

    // a focused place or region lets go when the visitor scrolls back up to the hero
    if (s < 0.98 && (state.place || state.region)) { state.place = null; state.region = 0; state.mode = 'overview'; state.insetTarget = 0; mapPose = overviewPose(); mapCur = pose(mapPose.pos, mapPose.target, mapPose.fov); state.flight = null; emit(); }

    // region mask eases toward its target
    const mt = state.region ? new V3(state.region === 1 ? 1 : 0, state.region === 2 ? 1 : 0, state.region === 3 ? 1 : 0) : new V3(1, 1, 1);
    state.mask.lerp(mt, Math.min(1, dt * 4));
    shared.uMask.value.copy(state.mask);
    state.inset += (state.insetTarget * s - state.inset) * Math.min(1, dt * 5);
    state.insetY += (state.insetYTarget * s - state.insetY) * Math.min(1, dt * 5);

    // flights between map poses: an arc up and over, with a dolly in the field of view
    if (state.flight) {
      const f = state.flight, k = Math.min(1, (t - f.t0) / f.dur), e = easeInOut(k);
      const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, c = e * e;
      mapCur.pos.set(0, 0, 0).addScaledVector(f.from.pos, a).addScaledVector(f.mid, b).addScaledVector(f.to.pos, c);
      mapCur.target.lerpVectors(f.from.target, f.to.target, easeInOut(Math.min(1, k * 1.12)));
      mapCur.fov = lerp(f.from.fov, f.to.fov, e) + Math.sin(Math.PI * k) * 14;
      state.streak = Math.pow(Math.sin(Math.PI * k), 2);
      if (k >= 1) { state.flight = null; mapCur = pose(f.to.pos, f.to.target, f.to.fov); }
    } else state.streak = 0;
    if (state.mode === 'place' && !state.flight) {
      if (!orbit.dragging) { orbit.yawGoal += orbit.spin * dt; orbit.spin *= Math.exp(-dt * 2.5); }
      const k = 1 - Math.exp(-dt * 10);
      orbit.yaw += (orbit.yawGoal - orbit.yaw) * k;
      orbit.tilt += (orbit.tiltGoal - orbit.tilt) * k;
      mapPose = placePose(state.place); mapCur = pose(mapPose.pos, mapPose.target, mapPose.fov);
    }

    // the journey camera
    const b = smooth(0, J_TURN, state.j);
    flyPose(b, travel(state.j));
    // a narrow screen gets a wider lens once the flight is under way, so it still sees both coasts
    const flyFov = lerp(42, state.w / state.h < 0.9 ? 56 : 42, b);
    tmpA.copy(mapCur.pos);
    out.pos.lerpVectors(flyPos, tmpA, easeInOut(s));
    out.target.lerpVectors(flyTarget, mapCur.target, easeInOut(s));
    out.fov = lerp(flyFov, mapCur.fov, s);
    cam.position.copy(out.pos);
    cam.lookAt(out.target);
    if (Math.abs(cam.fov - out.fov) > 0.01) { cam.fov = out.fov; cam.updateProjectionMatrix(); }
    if (state.inset > 0.5 || state.insetY > 0.5) cam.setViewOffset(state.w, state.h, state.inset, state.insetY, state.w, state.h);
    else if (cam.view) cam.clearViewOffset();

    // fog, sun and shadow frustum follow the camera
    const dist = out.pos.distanceTo(out.target);
    const fogNear = lerp(42, dist * 1.4, s), fogFar = lerp(175, dist * 3.2, s);
    seaUniforms.uSun.value.copy(SUN_OFFSET);
    scene.fog.near = fogNear; scene.fog.far = fogFar;
    seaUniforms.uFogNear.value = fogNear; seaUniforms.uFogFar.value = fogFar;
    sun.target.position.copy(out.target);
    sun.position.copy(out.target).add(SUN_OFFSET);
    const sh = THREE.MathUtils.clamp(dist * 0.95, 16, 170);
    const sc = sun.shadow.camera;
    if (Math.abs(sc.right - sh) > 0.5) { sc.left = -sh; sc.right = sh; sc.top = sh; sc.bottom = -sh; sc.near = 10; sc.far = 420; sc.updateProjectionMatrix(); }
    skyMat.uniforms.uSun.value.copy(SUN_OFFSET).normalize();
    sky.position.copy(cam.position);
    updatePearl(t, p);
    updateMarks(t, dt, p, s);

    // actors
    for (const a of actors) {
      for (let i = 0; i < a.count; i++) {
        dummy.position.set(0, 0, 0); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.userData.pose = 0;
        a.fn(i, t, dummy);
        a.track?.copy(dummy.position);
        dummy.updateMatrix();
        a.mesh.setMatrixAt(i, dummy.matrix);
      }
      a.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------- public API
  const ro = new ResizeObserver(() => resize());
  function resize() {
    const r = canvas.getBoundingClientRect();
    state.w = Math.max(1, Math.round(r.width)); state.h = Math.max(1, Math.round(r.height));
    renderer.setSize(state.w, state.h, false);
    cam.aspect = state.w / state.h; cam.updateProjectionMatrix();
    if (mapPose) {
      const dest = state.mode === 'place' ? placePose(state.place) : state.mode === 'region' ? regionPose(state.region) : overviewPose();
      mapPose = dest; mapCur = pose(dest.pos, dest.target, dest.fov); state.flight = null;
    }
    if (pearlReady) placePearl();
  }
  ro.observe(canvas);
  resize();

  // adaptive quality: if frames run long, render fewer pixels
  let acc = 0, frames = 0;
  function quality(dt) {
    acc += dt; frames++;
    if (frames === 90) {
      const avg = acc / frames;
      if (avg > 0.03 && dprCap > 1) { dprCap = Math.max(1, dprCap - 0.25); renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap)); resize(); }
      acc = 0; frames = 0;
    }
  }

  let running = false, last = 0;
  function loop(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    state.t += dt;   // the world lives on its own clock, reduced motion or not
    update(dt);
    renderer.render(scene, cam);
    quality(dt);
    for (const fn of frameListeners) fn(api);
  }
  const frameListeners = new Set();

  await placePearl();
  pearlReady = true;
  await renderer.compileAsync(scene, cam);

  const v3 = new V3();
  const api = {
    scene, camera: cam, renderer,
    // what the page's sound listens to: the moving actors' positions and the words in the sea
    emitters: tracked, pearl,
    get state() { return state; },
    setProgress(p) { state.progress = p; },
    setTime(t) { state.t = t; },
    setHover(id) { state.hover = id; },
    start() { if (!running) { running = true; last = 0; renderer.setAnimationLoop(loop); } },
    stop() { running = false; renderer.setAnimationLoop(null); },
    renderOnce() { update(0.016); renderer.render(scene, cam); },
    // deterministic frame for video renders: time t, scroll progress p
    renderAt(t, p = state.progress) { state.det = true; state.t = t; state.progress = p; update(1 / 30); renderer.render(scene, cam); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    onFrame(fn) { frameListeners.add(fn); return () => frameListeners.delete(fn); },
    // room for the dossier: px to the right (desktop), py below (phones)
    setInset(px, py = 0) {
      const changed = Math.abs(px - state.insetTarget) > 1 || Math.abs(py - state.insetYTarget) > 1;
      state.insetTarget = px; state.insetYTarget = py;
      if (changed && mapPose) { const d = state.mode === 'place' ? placePose(state.place) : state.mode === 'region' ? regionPose(state.region) : overviewPose(); mapPose = d; if (!state.flight) mapCur = pose(d.pos, d.target, d.fov); }
    },
    selectRegion(r) {
      state.region = r; state.place = null; state.mode = r ? 'region' : 'overview';
      flyTo(r ? regionPose(r) : overviewPose(), 1.6);
      emit();
    },
    focusPlace(id) {
      if (!id) { api.selectRegion(state.region); return; }
      Object.assign(orbit, { yaw: 0, yawGoal: 0, tilt: 0, tiltGoal: 0, spin: 0, dragging: false });
      const p = PLACES.find((q) => q.id === id);
      state.place = id; state.mode = 'place'; state.region = p.region;
      flyTo(placePose(id), 2.0);
      emit();
    },
    // turning around a place: grab, drag by pixels (gap: seconds since the last move), let go (still: it stops)
    grab() { orbit.spin = 0; orbit.dragging = state.mode === 'place'; },
    drag(dx, dy, gap) {
      if (!orbit.dragging || state.flight) return;
      const d = -dx * 0.008;
      orbit.yawGoal += d;
      orbit.tiltGoal = THREE.MathUtils.clamp(orbit.tiltGoal + dy * 0.004, -0.3, 0.6);
      orbit.spin = THREE.MathUtils.clamp(orbit.spin * 0.6 + (d / Math.max(0.008, gap)) * 0.4, -6, 6);
    },
    release(still) { if (still) orbit.spin = 0; orbit.dragging = false; },
    nudge(a) { if (state.mode === 'place') orbit.yawGoal += a; },
    // screen position of a place's exclamation mark (its middle, or its top), or null when hidden
    project(id, outPt, where = 'mid') {
      const i = PLACES.findIndex((q) => q.id === id), ms = markState[i];
      if (ms.scale < 0.05) return null;
      v3.copy(ms.base); v3.y += MARK_H * ms.scale * (where === 'top' ? 1.08 : 0.55);
      v3.project(cam);
      if (v3.z > 1) return null;
      outPt.x = (v3.x * 0.5 + 0.5) * state.w; outPt.y = (-v3.y * 0.5 + 0.5) * state.h;
      return outPt;
    },
    // the popped mark nearest the camera that is on screen, for the passing label
    nearestPlace(maxDist = NEAR_OUT) {
      let best = null, bd = maxDist;
      PLACES.forEach((pl, i) => {
        const ms = markState[i];
        if (!ms.on || ms.scale < 0.05) return;
        v3.copy(ms.base).project(cam);
        if (v3.z > 1 || Math.abs(v3.x) > 0.9 || Math.abs(v3.y) > 0.9) return;
        const d = cam.position.distanceTo(ms.base);
        if (d < bd) { bd = d; best = pl; }
      });
      return best;
    },
    // screen position of the top-left of the submerged words, for the line above them
    textAnchor(outPt) {
      if (!pearlInfo || !pearl.visible) return null;
      v3.set(-pearlInfo.wUnits / 2, pearlInfo.hUnits, 0).applyMatrix4(pearlMesh.matrixWorld).project(cam);
      if (v3.z > 1) return null;
      outPt.x = (v3.x * 0.5 + 0.5) * state.w; outPt.y = (-v3.y * 0.5 + 0.5) * state.h;
      return outPt;
    },
    // which island group the visitor clicked
    pick(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, cam);
      const hit = ray.intersectObject(terrain, false)[0];
      if (!hit) return 0;
      const [c, rr] = landCells[hit.instanceId];
      return regionAt(c, rr);
    },
    dispose() { api.stop(); ro.disconnect(); renderer.dispose(); },
  };
  return api;
}

// a little lake with lotus pads
function pond() {
  const v = new Vox();
  for (let x = -6; x <= 6; x++) for (let z = -4; z <= 4; z++) {
    if ((x * x) / 40 + (z * z) / 18 > 1) continue;
    const h = hash3(x, 0, z);
    v.set(x, 0, z, h > 0.88 ? 0x6f9f58 : h > 0.84 ? 0xe58aa0 : 0x5f9fb3);
  }
  return v;
}

// the image of San Isidro Labrador on a carroza dressed in kiping
function carroza() {
  const v = new Vox();
  v.box(-3, 1, -4, 3, 2, 4, (x, y, z) => [0xd9584a, 0xe8b23c, 0x5bae8c, 0xe57fa0][(x + z + 20) % 4]);
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) v.set(x, 0, z, 0x3b2b21);
  v.add(M.person({ ...M.COSTUMES.farmer(50), hold: 'staff', hat: 'crown' }), 0, 3, 0);
  for (const [x, z] of [[-3, -4], [3, -4], [-3, 4], [3, 4]]) v.box(x, 3, z, x, 7, z, 0xd0aa5f);
  return v;
}

const C = () => M.C;
