// The voxel hero stage for the inner pages (Traditions, Arts, Members): one scene lit like the
// Overview's first frame (a low golden sun, an indigo sky fill, warm haze), drawn only when something
// changes. The camera moves only when the visitor asks it to (flyTo), never on its own.
import { THREE, Vox, meshVox } from './voxel-kit.js';

export { THREE, Vox };
export const mod = (a, n) => ((a % n) + n) % n;
export const KIPING = [0xd9584a, 0xe8b23c, 0x5bae8c, 0xe57fa0, 0xf2e6c8, 0x8cc152, 0x4f86c6];
export const banig = (x, z) => (mod(Math.floor(x / 2) + Math.floor(z / 2), 2) ? 0xd2b47c : 0xe7d6ae);
// turn a model (built facing +z) to face a direction
export const face = (vox, dir) => vox.turned({ '+z': 0, '-x': 1, '-z': 2, '+x': 3 }[dir]);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------------------------------------------------------------- words as voxels
// The Overview's trick: set the words in Cormorant Garamond on a canvas and stand every inked pixel up.
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
  v.baseline = h - Math.round(px * 0.95);   // the row the letters stand on, so words line up by their baseline
  return v;
}

// A woven sign: the words in cream on a dark cloth with a border in an island group's colour, so the
// name reads over a busy scene. Lines are centred; returns the Vox and its size in voxels.
export async function wovenSign(lines, { px = 26, border = 0xc4664a, pad = 6 } = {}) {
  const words = await Promise.all(lines.map((l) => textVox(l, { px, depth: 1 })));
  const boxes = words.map((v) => v.bounds());
  const lineH = Math.round(px * 1.05);
  const w = Math.max(...boxes.map((b) => b.x1 - b.x0 + 1)) + pad * 2;
  const h = lineH * lines.length + pad * 2;
  const v = new Vox();
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const edge = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
    v.set(x, y, 0, edge ? border : mod(x + y, 7) ? 0x2c211c : 0x382a23);
    v.set(x, y, -1, 0x241a16);
  }
  words.forEach((t, i) => {
    const b = boxes[i];
    const ox = Math.round((w - (b.x1 - b.x0 + 1)) / 2) - b.x0;
    const oy = h - pad - (i + 1) * lineH + Math.round((lineH - (b.y1 - b.y0 + 1)) / 2) - b.y0;
    t.each((x, y) => v.set(x + ox, y + oy, 1, 0xf3ecdc));
  });
  return { v, w, h };
}

// ---------------------------------------------------------------- shared ground pieces
export function flatGround(x0, z0, x1, z1, colour) {
  const g = new Vox();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, 0, z, colour(x, z));
  return g;
}

// bunting (banderitas) across a street: one string of voxel flags with a gentle sag
export function bunting(v, x0, x1, y, z, seed = 0) {
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

// ---------------------------------------------------------------- people on paths
// A path is a list of [x, z] points. along() gives the point a distance d along it and the heading a
// model (built facing +z) needs to face the way it walks.
export function along(path, d) {
  if (!path.len) {
    path.len = [0];
    for (let i = 1; i < path.length; i++) path.len.push(path.len[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  }
  const L = path.len, total = L[L.length - 1], t = Math.min(total, Math.max(0, d));
  let i = 1;
  while (i < L.length - 1 && L[i] < t) i++;
  const [ax, az] = path[i - 1], [bx, bz] = path[i], k = (t - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
  return { x: ax + (bx - ax) * k, z: az + (bz - az) * k, heading: Math.atan2(bx - ax, bz - az), total };
}

// ---------------------------------------------------------------- the stage
// opts: build(S), cam { pos, look, fov }, sun (where the light comes from), glow (the sun's disc in the
// sky), band (how high the gold climbs; low keeps words on indigo), fog [near, far], sky false for a
// transparent canvas over the page's own indigo, phoneBack (how far a narrow screen steps back),
// after(api) after every frame (to place buttons over the scene)
export async function mountScene(canvas, opts) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: opts.sky === false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? 1.02;

  const scene = new THREE.Scene();
  if (opts.fog) scene.fog = new THREE.Fog(new THREE.Color(0xd9b98f), opts.fog[0], opts.fog[1]);
  const cam = new THREE.PerspectiveCamera(opts.cam.fov ?? 40, 1, 0.5, 5000);
  const view = { pos: new THREE.Vector3(...opts.cam.pos), look: new THREE.Vector3(...opts.cam.look) };

  scene.add(new THREE.HemisphereLight(0xc4d3ee, 0x6b5236, opts.fill ?? 1.05));
  if (opts.sun !== null) {   // a lit room (the hall) brings its own lamps and passes sun: null
    const sunDir = new THREE.Vector3(...(opts.sun ?? [-0.55, 0.62, 0.55])).normalize();
    const sun = new THREE.DirectionalLight(0xffd6a0, opts.sunPower ?? 2.7);
    const centre = new THREE.Vector3(...(opts.centre ?? opts.cam.look));
    sun.position.copy(centre).addScaledVector(sunDir, 500);
    sun.target.position.copy(centre);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
    const sb = opts.shadowBox ?? 120;
    Object.assign(sun.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb, near: 1, far: 1100 });
    scene.add(sun, sun.target);
  }

  if (opts.sky !== false) {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x1b2742) }, uMid: { value: new THREE.Color(0x46557a) }, uHorizon: { value: new THREE.Color(0xe7c18f) },
        uSun: { value: new THREE.Vector3(...(opts.glow ?? opts.sun ?? [-0.55, 0.62, 0.55])).normalize() },
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
    sky.onBeforeRender = () => sky.position.copy(cam.position);
    scene.add(sky);
  }
  if (opts.land) {   // the land past the voxel ground, so the horizon is haze and never an edge
    const g = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: opts.land }));
    g.position.y = -0.05; g.receiveShadow = true;
    scene.add(g);
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

  let w = 1, h = 1;
  function size() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  function render() {
    // narrow screens step back along the view, so the whole scene stays in the frame
    const back = w / h < 1 ? (opts.phoneBack ?? 1.6) : 1;
    cam.position.copy(view.pos).sub(view.look).multiplyScalar(back).add(view.look);
    if (opts.fog) { scene.fog.near = opts.fog[0] * back; scene.fog.far = opts.fog[1] * back; }   // the haze steps back with it
    cam.lookAt(view.look);
    renderer.render(scene, cam);
    opts.after?.(api);
  }

  // One loop draws the scene: while a flight runs, and, once play() is called, while the canvas is on
  // screen and the tab is visible. opts.tick(t, dt, api) moves the people and the parts before each frame.
  let flight = null, playing = false, onScreen = true, raf = 0, last = 0, clock = 0;
  function loop(now) {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    clock += dt;
    if (flight) {
      const f = flight, k = Math.min(1, (now - f.t0) / f.ms), e = easeInOut(k);
      view.pos.lerpVectors(f.from.pos, f.to.pos, e);
      view.pos.y += Math.sin(Math.PI * e) * f.lift;
      view.look.lerpVectors(f.from.look, f.to.look, e);
      if (k >= 1) { flight = null; f.done(true); }
    }
    opts.tick?.(clock, dt, api);
    render();
    if (flight || (playing && onScreen && !document.hidden)) raf = requestAnimationFrame(loop);
    else last = 0;
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) wake(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });

  const api = {
    scene, cam, renderer, view, render,
    // keep the scene alive: people walk, dance and sail while it is on screen
    play() { playing = true; wake(); },
    // a world point to pixels inside the canvas
    toScreen(v) {
      const p = v.clone().project(cam);
      return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h, front: p.z < 1 };
    },
    // the screen box of an object (its bounding box's eight corners)
    box(obj) {
      const b = new THREE.Box3().setFromObject(obj);
      const out = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
        const s = api.toScreen(new THREE.Vector3(x, y, z));
        out.x0 = Math.min(out.x0, s.x); out.x1 = Math.max(out.x1, s.x); out.y0 = Math.min(out.y0, s.y); out.y1 = Math.max(out.y1, s.y);
      }
      return out;
    },
    // jump the camera (no flight): a deep link, or a reload in the middle of a visit
    jump(to) { view.pos.set(...to.pos); view.look.set(...to.look); render(); },
    // the swoosh: an arc up and over, eased in and out (DESIGN.md 7.1); a new flight cancels the last
    flyTo(to, ms = 1800) {
      flight?.done(false);
      return new Promise((done) => {
        const from = { pos: view.pos.clone(), look: view.look.clone() };
        const dest = { pos: new THREE.Vector3(...to.pos), look: new THREE.Vector3(...to.look) };
        flight = { from, to: dest, ms, done, t0: performance.now(), lift: Math.min(40, from.pos.distanceTo(dest.pos) * 0.22) };
        wake();
      });
    },
  };
  size();
  await renderer.compileAsync(scene, cam);
  render();
  new ResizeObserver(() => { size(); render(); }).observe(canvas);
  return api;
}
