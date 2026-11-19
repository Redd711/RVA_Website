// Voxel hero scenes for the inner-page mockups (Traditions, Arts, Members).
// One still frame each, lit like the Overview's first frame: a low golden sun, an indigo sky fill and
// warm haze, built from the same voxel kit and models as the world (../js/voxel-kit.js, ../js/models.js).
import { THREE, Vox, meshVox, hash3 } from '../js/voxel-kit.js';
import * as M from '../js/models.js';

const { C } = M;
const mod = (a, n) => ((a % n) + n) % n;
const KIPING = [0xd9584a, 0xe8b23c, 0x5bae8c, 0xe57fa0, 0xf2e6c8, 0x8cc152, 0x4f86c6];
const banig = (x, z) => (mod(Math.floor(x / 2) + Math.floor(z / 2), 2) ? 0xd2b47c : 0xe7d6ae);

// ---------------------------------------------------------------- words as voxels
// The Overview's trick: rasterise Cormorant Garamond in a canvas and stand every inked pixel up as a voxel.
export async function textVox(text, { px = 56, depth = 5, colour = 0xf1ebe0 } = {}) {
  const font = `600 ${px}px "Cormorant Garamond", Georgia, serif`;
  if (document.fonts?.load) await Promise.race([document.fonts.load(font).catch(() => {}), new Promise((r) => setTimeout(r, 2500))]);
  const c = document.createElement('canvas');
  const g = c.getContext('2d', { willReadFrequently: true });
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 8, h = Math.ceil(px * 1.3);
  c.width = w; c.height = h;
  g.font = font; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
  g.fillText(text, 4, Math.round(px * 0.95));
  const data = g.getImageData(0, 0, w, h).data;
  const v = new Vox();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] < 120) continue;
    for (let z = 0; z < depth; z++) v.set(x, h - y, z, typeof colour === 'function' ? colour(x, h - y, z) : colour);
  }
  return v;
}

// ---------------------------------------------------------------- the stage
// opts: build(S), cam { pos, look, fov }, sun (direction the light comes from), glow (sun disc in the sky),
// fog [near, far], sky false for a transparent canvas over the page's own indigo
export async function mountScene(canvas, opts) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: opts.sky === false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? 1.02;

  const scene = new THREE.Scene();
  const fogCol = new THREE.Color(opts.fogColour ?? 0xd9b98f);
  if (opts.fog) scene.fog = new THREE.Fog(fogCol, opts.fog[0], opts.fog[1]);
  const cam = new THREE.PerspectiveCamera(opts.cam.fov ?? 40, 1, 0.5, 4000);
  const look = new THREE.Vector3(...opts.cam.look);

  scene.add(new THREE.HemisphereLight(0xc4d3ee, 0x6b5236, opts.fill ?? 1.05));
  const sunDir = new THREE.Vector3(...(opts.sun ?? [-0.55, 0.62, 0.55])).normalize();
  const sun = new THREE.DirectionalLight(0xffd6a0, opts.sunPower ?? 2.7);
  sun.position.copy(look).addScaledVector(sunDir, 400);
  sun.target.position.copy(look);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  const sb = opts.shadowBox ?? 120;
  Object.assign(sun.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb, near: 1, far: 900 });
  scene.add(sun, sun.target);

  if (opts.sky !== false) {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x1b2742) }, uMid: { value: new THREE.Color(0x46557a) }, uHorizon: { value: new THREE.Color(0xe7c18f) },
        uSun: { value: new THREE.Vector3(...(opts.glow ?? opts.sun ?? [-0.55, 0.62, 0.55])).normalize() },
        // how high the golden band climbs: the world heroes keep it low so the words stand on indigo
        uBand: { value: opts.band ?? 0.22 },
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position,1.0)).xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 uTop, uMid, uHorizon, uSun; uniform float uBand; varying vec3 vDir;
        void main(){ float h = vDir.y;
          vec3 c = mix(uHorizon, uMid, smoothstep(0.0, uBand, h)); c = mix(c, uTop, smoothstep(uBand * 0.8, 0.6, h));
          float s = max(dot(normalize(vDir), normalize(uSun)), 0.0);
          c += vec3(1.0, 0.82, 0.55) * (pow(s, 220.0) * 1.2 + pow(s, 8.0) * 0.18);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }));
    sky.frustumCulled = false;
    scene.add(sky);
    sky.onBeforeRender = () => sky.position.copy(cam.position);
  }

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const S = {
    THREE, scene, mat,
    // add a Vox at a place; its own coordinates are kept (models stand on y = 0 round x = z = 0)
    add(vox, { at = [0, 0, 0], size = 1, rot = 0, jitter = 0.07, parent = scene, shadow = true, material = mat } = {}) {
      const mesh = new THREE.Mesh(meshVox(vox, { size, jitter, centre: false, bottom: false }), material);
      mesh.position.set(...at);
      mesh.rotation.y = rot;
      mesh.castShadow = shadow; mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    },
    group(at = [0, 0, 0], rot = 0) {
      const g = new THREE.Group();
      g.position.set(...at); g.rotation.y = rot;
      scene.add(g);
      return g;
    },
  };
  await opts.build(S);

  function frame() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    // narrow screens step back so the whole scene stays in the frame
    const back = w / h < 1 ? (opts.phoneBack ?? 1.6) : 1;
    const p = new THREE.Vector3(...opts.cam.pos).sub(look).multiplyScalar(back).add(look);
    cam.position.copy(p);
    cam.lookAt(look);
    if (opts.cam.shift) cam.setViewOffset(w, h, w * opts.cam.shift[0] * (w / h < 1 ? 0 : 1), h * (opts.cam.shift[1] ?? 0), w, h);
    cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    opts.after?.(api);
  }
  const api = {
    scene, cam, renderer,
    // a world point to page pixels inside the canvas
    toScreen(v) {
      const p = v.clone().project(cam), r = canvas.getBoundingClientRect();
      return { x: (p.x * 0.5 + 0.5) * r.width, y: (-p.y * 0.5 + 0.5) * r.height };
    },
    // the screen box of a mesh (its eight corners)
    box(mesh) {
      const b = new THREE.Box3().setFromObject(mesh);
      const out = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
        const s = api.toScreen(new THREE.Vector3(x, y, z));
        out.x0 = Math.min(out.x0, s.x); out.x1 = Math.max(out.x1, s.x); out.y0 = Math.min(out.y0, s.y); out.y1 = Math.max(out.y1, s.y);
      }
      return out;
    },
  };
  await renderer.compileAsync(scene, cam);
  frame();
  new ResizeObserver(frame).observe(canvas);
  canvas.closest('[data-scene]')?.classList.add('is-live');
  document.documentElement.dataset.sceneReady = '1';
  return api;
}

// ---------------------------------------------------------------- shared pieces
function flatGround(x0, z0, x1, z1, colour) {
  const g = new Vox();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, 0, z, colour(x, z));
  return g;
}

// the land past the voxel ground, so the horizon is haze and never an edge
function farLand(S, colour, y = -0.05) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: colour }));
  g.position.y = y; g.receiveShadow = true;
  S.scene.add(g);
}

const face = (vox, dir) => vox.turned({ '+z': 0, '-x': 1, '-z': 2, '+x': 3 }[dir]);

// bunting (banderitas) across a street: one string of voxel flags with a gentle sag
function bunting(v, x0, x1, y, z, seed = 0) {
  const half = (x1 - x0) / 2;
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0 - half) / half;
    const yy = Math.round(y - 2.2 * (1 - t * t));
    v.set(x, yy, z, 0x6b4a30);
    if (mod(x, 3) !== 1) continue;
    const c = KIPING[mod(x + seed, KIPING.length)];
    v.set(x, yy - 1, z, c); v.set(x, yy - 2, z, c); v.set(x + 1, yy - 1, z, c);
  }
}

// ---------------------------------------------------------------- Traditions A: Lucban on Pahiyas
// The word stands over the street as a festival arch; the procession passes under it toward the camera.
export async function traditionsStreet(canvas, { onWord } = {}) {
  let word;
  return mountScene(canvas, {
    cam: { pos: [0, 21, 124], look: [0, 22, -30], fov: 42 },
    sun: [-0.32, 0.62, 0.72],
    glow: [-0.38, 0.05, -0.93],
    band: 0.06,
    fog: [150, 600],
    shadowBox: 160,
    build: async (S) => {
      farLand(S, 0x93b060);
      S.add(flatGround(-90, -175, 90, 100, (x, z) => {
        const ax = Math.abs(x);
        if (z < -114 && z > -150 && ax < 34) return mod(x + z, 4) ? 0xd5c4a0 : 0xc9b691;          // the church plaza
        if (ax <= 9) return mod(Math.floor(x / 3) + Math.floor(z / 2), 2) ? 0xcdbb98 : 0xc2b08c;  // the street
        if (ax <= 11) return 0xb5a382;
        return hash3(x, 0, z) > 0.55 ? 0x8fae5a : 0x9cb866;
      }), { at: [0, -1, 0], shadow: false });

      // houses dressed in kiping on both sides, a stone house now and then
      [-14, -30, -46, -62, -78, -94].forEach((z, i) => {
        S.add(face(i % 3 === 2 ? M.bahayNaBato(i + 2) : M.pahiyasHouse(i + 1), '+x'), { at: [-17, 0, z] });
        S.add(face(i % 3 === 1 ? M.bahayNaBato(i + 9) : M.pahiyasHouse(i + 21), '-x'), { at: [17, 0, z - 4] });
      });
      S.add(M.church(), { at: [-2, 0, -136] });
      // the rest of the town spreading out on both sides of the procession street
      for (const side of [-1, 1]) for (const [col, x] of [[0, 40], [1, 64], [2, 88]]) for (let k = 0; k < 7; k++) {
        const z = 18 - k * 22 + col * 7, s = 100 + side * 37 + col * 11 + k;
        const m = hash3(s, 3, 1) > 0.66 ? M.nipaHut(s) : hash3(s, 4, 1) > 0.4 ? M.bahayNaBato(s) : M.pahiyasHouse(s);
        S.add(face(m, side < 0 ? '+x' : '-x'), { at: [side * (x + (k % 2) * 3), 0, z] });
      }
      for (const [x, z, s] of [[-30, -6, 1], [33, -20, 2], [-32, -44, 3], [34, -70, 4], [-31, -88, 5], [30, -104, 6], [-46, 30, 7], [48, 18, 8], [-58, -30, 9], [60, -50, 10]])
        S.add(s % 2 ? M.palm(s) : M.roundTree(s), { at: [x, 0, z], size: 1.6 });

      // banderitas across the street
      const flags = new Vox();
      for (const z of [-22, -38, -54, -70, -86]) bunting(flags, -12, 12, 17, z, z);
      S.add(flags, { shadow: false });

      // the procession: the Santo Nino first, Sinulog dancers round it, Ati-Atihan drums, Kadayawan behind
      const put = (o, x, z, dir = '+z') => S.add(face(M.person(o), dir), { at: [x, 0, z] });
      put(M.COSTUMES.sinulogLead(3), 0, 12);
      [[-6, 8], [6, 8], [-4, 2], [4, 2], [-7, -4], [7, -4]].forEach(([x, z], i) => put({ ...M.COSTUMES.sinulog(i + 4), arms: i % 2 ? 'up' : 'out' }, x, z));
      [[-5, -14], [0, -16], [5, -14], [-3, -22], [3, -22]].forEach(([x, z], i) => put(i % 2 ? M.COSTUMES.atiDrum(i + 30) : { ...M.COSTUMES.ati(i + 30), arms: 'up' }, x, z));
      [[-6, -32], [0, -34], [6, -32], [-3, -40], [3, -40]].forEach(([x, z], i) => put({ ...M.COSTUMES.kadayawan(i + 50), arms: i % 2 ? 'up' : 'out' }, x, z));
      [[-4, -50], [3, -54], [-2, -62], [5, -68], [-5, -74], [1, -80]].forEach(([x, z], i) => put(M.COSTUMES.reveler(i + 70), x, z));
      S.add(M.carabao(), { at: [0, 0, -92] });
      // townsfolk watching from the walk
      [[-10, 26], [-10, 10], [-10, -8], [-10, -28], [-10, -48], [-10, -66]].forEach(([x, z], i) => put((i % 2 ? M.COSTUMES.saya : M.COSTUMES.barong)(i + 90), x, z, '+x'));
      [[10, 22], [10, 4], [10, -18], [10, -38], [10, -58], [10, -76]].forEach(([x, z], i) => put((i % 2 ? M.COSTUMES.barong : M.COSTUMES.farmer)(i + 95), x, z, '-x'));

      // the arch: two bamboo posts dressed in kiping, a beam, and the word hanging from it
      const size = 0.22;
      const t = await textVox('Tradisyon', { px: 64, depth: 6, colour: 0xf3ecdc });
      const b = t.bounds();
      const w = (b.x1 - b.x0 + 1) * size, top = 40;
      word = S.add(t, { at: [-w / 2 - b.x0 * size, top - (b.y1 + 1) * size, 24], size, jitter: 0.03 });
      const arch = new Vox();
      const px = Math.round(w / 2) + 4;
      for (const s of [-1, 1]) for (let y = 0; y <= top + 3; y++) for (const dx of [0, 1]) for (const dz of [0, 1]) {
        const k = mod(y + dx * 2 + dz, 6);
        arch.set(s * px + dx - (s > 0 ? 1 : 0), y, 24 + dz, k < 3 ? KIPING[mod(Math.floor(y / 3) + s, KIPING.length)] : C.bamboo);
      }
      for (let x = -px - 2; x <= px + 2; x++) {
        arch.set(x, top + 2, 24, C.bamboo); arch.set(x, top + 2, 25, C.bambooDark); arch.set(x, top + 3, 24, C.bambooDark);
        if (mod(x, 4) === 0) { const c = KIPING[mod(x, KIPING.length)]; arch.set(x, top + 1, 26, c); arch.set(x, top, 26, c); }
      }
      S.add(arch, { jitter: 0.08 });
    },
    after: (api) => word && onWord?.(api.box(word)),
  });
}

// ---------------------------------------------------------------- Traditions B: the year woven on one mat
// Twelve months as twelve squares of banig, two rows; one gold thread runs through them the way a weft
// does, left to right along the back row (January to June), then back along the front (July to December).
// A knot on every month, filled where we document a festival; those months hold their festival.
export async function traditionsYear(canvas) {
  return mountScene(canvas, {
    sky: false,
    cam: { pos: [-15, 100, 151], look: [-6, -12, 7], fov: 38 },
    sun: [-0.55, 0.62, 0.55],
    shadowBox: 130,
    exposure: 1.06,
    phoneBack: 1.7,
    build: async (S) => {
      [[-150, 46, -150, 2], [120, 52, -170, 5]].forEach(([x, y, z, s]) => S.add(M.cloud(s), { at: [x, y, z], size: 2.2, shadow: false }));
      const row = S.group([0, 0, 0], -0.12);
      const T = 26, COLS = 6, X0 = -(COLS * T) / 2, Z0 = -T;
      // month i: the back row runs January to June left to right, the front row July to December right to left
      const cell = (i) => (i < 6 ? { c: i, r: 0 } : { c: 11 - i, r: 1 });
      const centre = (i) => { const { c, r } = cell(i); return [X0 + c * T + T / 2, Z0 + r * T + T / 2]; };
      const mat = new Vox();
      for (let x = X0 - 2; x < X0 + COLS * T + 2; x++) for (let z = Z0 - 2; z < Z0 + 2 * T + 2; z++) {
        const edge = x < X0 || x >= X0 + COLS * T || z < Z0 || z >= Z0 + 2 * T;
        const seam = mod(x - X0, T) === 0 || mod(z - Z0, T) === 0;
        mat.set(x, 0, z, edge ? C.clay : seam ? 0xc49d62 : banig(x, z));
      }
      // the thread: through each month's knot near the square's front edge, round the end like a weft turning
      const fest = new Set([0, 4, 6, 7]);
      const kz = (i) => centre(i)[1] + 8;
      const thread = (x0, x1, z) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) mat.set(x, 1, z, C.gold); };
      thread(centre(0)[0], centre(5)[0] + 9, kz(0));
      for (let z = kz(0); z <= kz(6); z++) mat.set(centre(5)[0] + 9, 1, z, C.gold);
      thread(centre(6)[0] + 9, centre(11)[0], kz(6));
      for (let i = 0; i < 12; i++) {
        const [cx] = centre(i), z = kz(i);
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 1; y <= 2; y++) {
          if (!fest.has(i) && dx === 0 && dz === 0) continue;
          mat.set(cx + dx, y, z + dz, fest.has(i) ? C.clay : C.cream);
        }
      }
      S.add(mat, { parent: row, jitter: 0.05 });

      const at = (i, dx = 0, dz = 0) => { const [x, z] = centre(i); return [x + dx, 1, z + dz]; };
      const put = (o, i, dx, dz, dir = '+z') => S.add(face(M.person(o), dir), { at: at(i, dx, dz), parent: row });
      // January: Sinulog round the Santo Nino, and the Ati-Atihan drums of Kalibo
      put(M.COSTUMES.sinulogLead(3), 0, -5, -5);
      [[-9, -1], [-1, -1], [-5, 2]].forEach(([dx, dz], k) => put({ ...M.COSTUMES.sinulog(k + 4), arms: k % 2 ? 'up' : 'out' }, 0, dx, dz));
      [[4, -6], [8, -2], [5, 2]].forEach(([dx, dz], k) => put(k === 1 ? M.COSTUMES.atiDrum(k + 9) : { ...M.COSTUMES.ati(k + 9), arms: 'up' }, 0, dx, dz));
      // May: a Lucban house in its kiping, with two neighbours and a basket
      S.add(M.pahiyasHouse(4), { at: at(4, 0, -4), parent: row, size: 0.92 });
      put(M.COSTUMES.reveler(11), 4, -7, 5); put({ ...M.COSTUMES.farmer(12), hold: 'basket', arms: 'up' }, 4, 7, 5);
      // July: the t'nalak loom of Lake Sebu
      S.add(M.loomWithCloth(), { at: at(6, 1, -5), parent: row });
      S.add(face(M.personSitting(M.COSTUMES.tboli(14)), '+z'), { at: at(6, 1, -8), parent: row });
      put(M.COSTUMES.tboli(15), 6, -7, 3);
      // August: Kadayawan in Davao, beads and fruit
      [[-6, -3], [0, -6], [6, -3], [-3, 3], [3, 3]].forEach(([dx, dz], k) => put({ ...M.COSTUMES.kadayawan(k + 20), arms: k % 2 ? 'up' : 'out' }, 7, dx, dz));
      // the quiet months keep a palm or a hut, so the runner reads as land between festivals
      [[2, M.nipaHut(2), 0.7], [9, M.palm(3), 1.3], [10, M.roundTree(4), 1.3], [11, M.nipaHut(5), 0.7], [1, M.palm(6), 1.3]].forEach(([i, v, s]) => S.add(v, { at: at(i, 0, -3), parent: row, size: s }));
    },
  });
}

// ---------------------------------------------------------------- Arts A: one backstrap loom, its widest view
function backstrapLoom() {
  const v = new Vox();
  const L0 = -44, L1 = 50, half = 8;
  const yAt = (x) => Math.round(7 + ((x - L0) / (L1 - L0)) * 5);
  for (let x = L0; x <= L1; x++) {
    const y = yAt(x);
    for (let z = -half; z <= half; z++) {
      if (x < 0) v.set(x, y, z, M.tnalak(x, z));                        // the woven cloth
      else if (mod(z, 2) === 0) {                                     // warp still to weave: tie-dyed threads with gaps
        const k = mod(Math.floor((x + 40) / 3) + Math.abs(z), 7);
        v.set(x, y, z, k < 2 ? C.red : k < 4 ? C.cream : 0x3a2a22);
      }
    }
  }
  // breast beam at the weaver's lap, the sword and heddle across the open warp, the far warp beam
  for (let z = -half - 2; z <= half + 2; z++) {
    v.set(L0 - 1, 7, z, C.woodDark); v.set(L0 - 1, 8, z, C.wood);
    v.set(4, yAt(4) + 1, z, C.wood); v.set(4, yAt(4) + 2, z, C.wood);
    v.set(12, yAt(12) + 2, z, C.bamboo);
    v.set(L1 + 1, 12, z, C.woodDark); v.set(L1 + 1, 13, z, C.wood);
  }
  for (let y = 0; y <= 18; y++) { v.set(L1 + 6, y, -1, C.woodDark); v.set(L1 + 6, y, 0, C.wood); }
  v.line(L1 + 1, 13, -half - 2, L1 + 6, 16, -1, 0x9c8250); v.line(L1 + 1, 13, half + 2, L1 + 6, 16, 0, 0x9c8250);
  v.line(L0 - 1, 8, -half - 2, L0 - 6, 8, -2, 0x4a3424); v.line(L0 - 1, 8, half + 2, L0 - 6, 8, 2, 0x4a3424);
  // a basket of stripped abaca by the weaver
  v.lathe(L0 - 4, 12, 0, [3, 3.5, 3.5, 3], C.bamboo, 1);
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) if (x * x + z * z < 6) v.set(L0 - 4 + x, 4, 12 + z, 0xe9dcc0);
  return v;
}

export async function artsLoom(canvas) {
  return mountScene(canvas, {
    sky: false,
    cam: { pos: [-1, 82, 110], look: [2, 2, 2], fov: 27 },
    sun: [-0.5, 0.75, 0.42],
    shadowBox: 90,
    exposure: 1.08,
    phoneBack: 2.3,
    build: async (S) => {
      S.add(flatGround(-64, -20, 66, 20, (x, z) => (Math.abs(z) >= 19 || x === -64 || x === 66 ? C.clay : banig(x, z))), { at: [0, -1, 0], jitter: 0.05 });
      S.add(backstrapLoom(), { at: [0, 0, 0] });
      S.add(face(M.personSitting(M.COSTUMES.tboli(5)), '+x'), { at: [-51, 0, 0] });
    },
  });
}

// ---------------------------------------------------------------- Arts B: the workshop yard, the word woven in
function wovenWord(textV, wv, hv) {
  // a hanging t'nalak: diamond bands top and bottom, the word in cream on the dark ground between
  const b = textV.bounds();
  const tw = b.x1 - b.x0 + 1, th = b.y1 - b.y0 + 1;
  const ox = Math.round((wv - tw) / 2) - b.x0, oy = Math.round((hv - th) / 2) - b.y0;
  const v = new Vox();
  for (let x = 0; x < wv; x++) for (let y = 0; y < hv; y++) {
    const band = y < 5 || y >= hv - 5;
    const ink = !band && textV.has(x - ox, y - oy, 0);
    const z = 0;
    v.set(x, y, z, band ? M.tnalak(x, y) : ink ? 0xf3ecdc : (mod(x + y, 9) === 0 ? 0x4a372d : 0x33251e));
    v.set(x, y, -1, 0x2a1f19);
    if (y === 0 && mod(x, 2) === 0) for (let k = 1; k <= 3; k++) v.set(x, -k, z, k === 3 ? C.red : 0xe9dcc0);   // the fringe
  }
  return v;
}

// an unglazed burnay jar: broad shoulder, short neck, a lip; dark earth with the kiln's ash on it
function burnay(seed = 1) {
  const v = new Vox();
  const tall = hash3(seed, 2, 2) > 0.5;
  const radii = tall ? [3, 4.5, 5.5, 6, 6.5, 6.5, 6.2, 5.6, 4.8, 3.8, 2.8, 2.4, 2.4, 3] : [3, 4.5, 5.5, 6.2, 6.5, 6.2, 5.4, 4.2, 3, 2.5, 3];
  v.lathe(0, 0, 0, radii, (x, y, z) => (y >= radii.length - 1 ? 0x5e3f31 : hash3(x + seed, y, z) > 0.78 ? 0x8a6450 : hash3(x, y + seed, z) > 0.5 ? 0x6f4b3a : 0x7a5442), radii.length - 2);
  return v;
}

function kickWheel() {
  const v = new Vox();
  v.cyl(0, 0, 0, 1, 4, C.woodDark);
  v.box(0, 2, 0, 0, 5, 0, C.wood);
  v.cyl(0, 0, 6, 6, 3, C.wood);
  v.lathe(0, 0, 7, [2, 3, 3.5, 3.5, 3, 2.5, 2, 2], 0xa8745a, 2, 1);   // a jar rising on the wheel
  return v;
}

function kiln() {
  // a dragon kiln stepping up its slope, brick, a fire mouth glowing at the foot
  const v = new Vox();
  for (let i = 0; i < 6; i++) {
    const x0 = i * 7, y0 = i * 2;
    v.box(x0, 0, -5, x0 + 7, y0 + 6, 5, (x, y, z) => (hash3(x, y, z) > 0.6 ? 0x8f4b33 : mod(y, 3) === 0 ? 0x9a4f36 : 0xa45a3c));
    v.box(x0, y0 + 7, -4, x0 + 7, y0 + 7, 4, (x, y, z) => (mod(x + z, 2) ? 0x96452f : 0xb4573b));
    v.box(x0 + 3, 1, 5, x0 + 4, 2, 5, 0x3a2420);   // a stoking hole on each chamber
  }
  v.box(-1, 0, -2, -1, 3, 2, 0xe8b23c); v.box(-1, 1, -1, -1, 2, 1, 0xf2a24a);
  v.box(40, 18, -1, 42, 26, 1, 0x7b4a33);
  return v;
}

export async function artsYard(canvas, { onWord } = {}) {
  let word;
  return mountScene(canvas, {
    cam: { pos: [8, 30, 132], look: [0, 21, -14], fov: 44 },
    sun: [-0.62, 0.42, 0.66],
    glow: [-0.45, 0.06, -0.9],
    band: 0.08,
    fog: [150, 620],
    shadowBox: 150,
    build: async (S) => {
      farLand(S, 0x8fae5a);
      S.add(flatGround(-110, -170, 110, 120, (x, z) => (hash3(x, 0, z) > 0.62 ? 0xc9ad84 : hash3(x, 1, z) > 0.5 ? 0xd2b78d : 0xbea078)), { at: [0, -1, 0], shadow: false });

      // the cloth between two bamboo posts, the word woven into it
      const t = await textVox('Sining', { px: 30, depth: 1 });
      const W = 78, H = 30, Y = 13;
      word = S.add(wovenWord(t, W, H), { at: [-W / 2, Y, -8], jitter: 0.04 });
      const frame = new Vox();
      for (const x of [-W / 2 - 3, W / 2 + 2]) for (let y = 0; y <= Y + H + 3; y++) { frame.set(x, y, -8, C.bamboo); frame.set(x + 1, y, -8, C.bambooDark); }
      for (let x = -W / 2 - 4; x <= W / 2 + 4; x++) { frame.set(x, Y + H + 1, -8, C.bamboo); frame.set(x, Y + H + 2, -8, C.bambooDark); }
      S.add(frame);

      // burnay jars drying in rows, a potter at the kick wheel, the kiln and its smoke behind
      for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) S.add(burnay(r * 5 + k), { at: [-84 + k * 11 + (r % 2) * 5, 0, -6 + r * 12], size: 0.7 });
      S.add(kickWheel(), { at: [-24, 0, 30] });
      S.add(face(M.personSitting({ seed: 3, top: 0x9cb3cf, bottom: C.indigo }), '-x'), { at: [-16, 0, 30] });
      S.add(M.carabao(), { at: [-38, 0, -30] });
      S.add(kiln(), { at: [34, 0, -58] });
      for (let i = 0; i < 7; i++) S.add(M.puff(), { at: [75 + i * 1.6, 28 + i * 4.2, -58 - i], size: 1 + i * 0.35, shadow: false });

      // brass: a kulintang on its frame, a Maranao player at it
      S.add(M.kulintang(), { at: [34, 0, 30] });
      S.add(face(M.personSitting(M.COSTUMES.maranao(7)), '-z'), { at: [34, 0, 37] });
      // cloth: a weaver at a small loom
      S.add(face(M.loomWithCloth(), '-x'), { at: [58, 0, 6] });
      S.add(face(M.personSitting(M.COSTUMES.tboli(8)), '-x'), { at: [66, 0, 6] });

      S.add(M.nipaHut(4), { at: [-82, 0, -36], size: 1.3 });
      S.add(M.ifugaoHut(), { at: [92, 0, -20], size: 1.2 });
      for (const [x, z, s] of [[-96, 10, 1], [-70, -70, 3], [-40, -110, 5], [70, -100, 7], [100, 50, 9], [-104, 60, 11], [96, -60, 13]])
        S.add(s % 4 === 1 ? M.palm(s) : M.roundTree(s), { at: [x, 0, z], size: 1.9 });
    },
    after: (api) => word && onWord?.(api.box(word)),
  });
}

// ---------------------------------------------------------------- Members A: five threads, five of us
function uprightLoom() {
  const v = new Vox();
  const cols = [C.clay, C.gold, C.indigo, C.clay, C.gold];
  for (const s of [-1, 1]) for (let y = 0; y <= 44; y++) { v.set(s * 25, y, 0, C.woodDark); v.set(s * 25, y, 1, C.wood); }
  for (let x = -27; x <= 27; x++) { v.set(x, 43, 0, C.wood); v.set(x, 44, 0, C.woodDark); v.set(x, 8, 0, C.wood); }
  cols.forEach((c, i) => {
    const x = -16 + i * 8;
    for (let y = 9; y <= 42; y++) for (const dx of [0, 1]) v.set(x + dx, y, 0, c);
  });
  // the weft: a cream band woven across the five threads; each thread shows over it, then dips under,
  // two rows at a time, neighbours out of step, so the band reads as plain weave
  for (let y = 21; y <= 32; y++) for (let x = -22; x <= 23; x++) {
    const t = cols.findIndex((_, i) => x === -16 + i * 8 || x === -15 + i * 8);
    const rim = y === 21 || y === 32;
    v.set(x, y, 0, rim ? C.gold : 0xf1e9d8);
    if (t >= 0 && !rim && mod(Math.floor((y - 22) / 2) + t, 2) === 0) v.set(x, y, 1, cols[t]);
    else v.set(x, y, 1, rim ? C.gold : mod(x + y, 2) ? 0xf1e9d8 : 0xe6dbc4);
  }
  return v;
}

export async function membersLoom(canvas) {
  return mountScene(canvas, {
    cam: { pos: [-16, 28, 112], look: [-20, 20, 0], fov: 40 },
    sun: [-0.6, 0.45, 0.66],
    glow: [-0.2, 0.05, -0.98],
    fog: [140, 620],
    shadowBox: 110,
    build: async (S) => {
      farLand(S, 0x93b060);
      S.add(flatGround(-140, -160, 120, 110, (x, z) => (Math.abs(x) < 34 && z > -4 && z < 26 ? (Math.abs(x) === 33 || z === -3 || z === 25 ? C.clay : banig(x, z)) : hash3(x, 0, z) > 0.5 ? 0x8fae5a : 0x9cb866)), { at: [0, -1, 0], shadow: false });
      S.add(uprightLoom(), { at: [0, 0, -2] });
      const cols = [C.clay, C.gold, C.indigo, C.clay, C.gold];
      cols.forEach((c, i) => {
        const x = -16 + i * 8;
        S.add(M.person({ seed: 40 + i, top: c, sleeve: c, bottom: i === 2 ? 0x2e2a28 : C.indigo, arms: i === 4 ? 'up' : 'down', hat: i === 1 ? 'bun' : null }), { at: [x, 0, 12] });
        const th = new Vox(); th.line(x, 9, -1, x + 2, 5, 11, c); S.add(th, { shadow: false });
      });
      S.add(M.bahayNaBato(3), { at: [-78, 0, -70], size: 1.4 });
      S.add(M.church(), { at: [70, 0, -110], size: 1.3 });
      for (const [x, z, s] of [[-50, -20, 1], [44, -30, 2], [-96, 6, 3], [86, 10, 5], [-120, -60, 7], [110, -70, 9]])
        S.add(s % 2 ? M.palm(s) : M.roundTree(s), { at: [x, 0, z], size: 1.8 });
    },
  });
}

// ---------------------------------------------------------------- Members B: the word in the sea, the five on the shore
export async function membersShore(canvas, { onWord } = {}) {
  let word;
  return mountScene(canvas, {
    cam: { pos: [0, 40, 124], look: [0, 10, -30], fov: 42 },
    sun: [-0.55, 0.5, 0.66],
    glow: [-0.3, 0.06, -0.95],
    band: 0.1,
    fog: [160, 700],
    shadowBox: 150,
    build: async (S) => {
      // sand sloping into the sea
      const sand = new Vox();
      for (let x = -130; x <= 130; x++) for (let z = -30; z <= 110; z++) {
        const y = Math.max(0, Math.min(4, Math.floor((z + 22) / 9)));
        for (let k = 0; k <= y; k++) sand.set(x, k, z, k === y ? (hash3(x, k, z) > 0.6 ? 0xddc896 : C.sand) : 0xcdb98a);
      }
      S.add(sand, { at: [0, -2, 0], shadow: false });
      const sea = new THREE.PlaneGeometry(4000, 4000, 1, 1);
      sea.rotateX(-Math.PI / 2);
      const water = new THREE.Mesh(sea, new THREE.MeshLambertMaterial({ color: 0x2f6a92, transparent: true, opacity: 0.84 }));
      water.position.y = 0.6;
      water.receiveShadow = true;
      S.scene.add(water);
      const shallow = new THREE.Mesh(new THREE.PlaneGeometry(4000, 12).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x8ccfc0, transparent: true, opacity: 0.4 }));
      shallow.position.set(0, 0.7, -9);
      S.scene.add(shallow);
      const foam = new Vox();
      for (let x = -130; x <= 130; x++) if (hash3(x, 2, 3) > 0.25) foam.set(x, 0, Math.round(Math.sin(x * 0.2) * 1.2), 0xf6f1e6);
      S.add(foam, { at: [0, 0.3, -4], shadow: false, jitter: 0.02 });

      // the word stands in the water like the Overview's, its last row under the surface
      const size = 0.7;
      const t = await textVox('Kami', { px: 64, depth: 6, colour: 0xf3ecdc });
      const b = t.bounds();
      const w = (b.x1 - b.x0 + 1) * size;
      word = S.add(t, { at: [-w / 2 - b.x0 * size, -5.5 - b.y0 * size, -44], size, jitter: 0.03 });

      // the five of us on the shore, in the colours of our threads, waving toward the word
      [C.clay, C.gold, C.indigo, C.clay, C.gold].forEach((c, i) => {
        S.add(M.person({ seed: 60 + i, top: c, sleeve: c, bottom: i === 2 ? 0x2e2a28 : C.indigo, arms: i === 0 || i === 4 ? 'up' : i === 2 ? 'out' : 'down', hat: i === 3 ? 'bun' : null }), { at: [-20 + i * 10, 3, 44 + (i % 2) * 4] });
      });
      S.add(face(M.banca(), '+x'), { at: [-58, 1.2, 10], size: 1.3 });
      S.add(M.vinta(), { at: [86, 0.6, -170], size: 1.1, rot: 0.5 });
      S.add(M.vinta([C.yellow, C.red, C.green, C.white, C.blue]), { at: [-130, 0.6, -240], size: 1.1, rot: -0.4 });
      for (const [x, z, s] of [[-80, 40, 1], [-100, 60, 3], [-70, 76, 5], [82, 44, 7], [104, 64, 9], [66, 82, 11]]) S.add(M.palm(s), { at: [x, 2, z], size: 2.2 });
    },
    after: (api) => word && onWord?.(api.box(word)),
  });
}
