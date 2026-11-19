// Arts: three museums round one plaza (Textile, Clay, Brass), the hall where their pieces stand in the
// dark and light up as you reach them, and the viewer that opens a piece: its voxel model to turn any
// way, its photograph and its museum label. Visitors walk the ring path in and out of the museums; the
// hall slides sideways only as the visitor scrolls. arts.html#<piece> opens the hall at that piece.
import { mountScene, textVox, flatGround, mod, along, THREE, Vox } from './hero-stage.js';
import { hash3, rng, meshVox } from './voxel-kit.js';
import * as M from './models.js';

const { C, COSTUMES: K } = M;

// the six pieces in hall order, the museum each belongs to, and how a museum would show it
const PIECES = [
  { id: 'tnalak', wing: 'textile', model: () => M.tnalakHanging(), show: 'open' },
  { id: 'inabel', wing: 'textile', model: () => M.inabelBlanket(), show: 'open' },
  { id: 'pina', wing: 'textile', model: () => M.pinaBarong(), show: 'case' },
  { id: 'burnay', wing: 'clay', model: () => M.burnay(3), show: 'pedestal' },
  { id: 'manunggul', wing: 'clay', model: () => M.manunggulJar(), show: 'pedestal' },
  { id: 'kulintang', wing: 'brass', model: () => M.brassEnsemble(), show: 'open' },
];
const N = PIECES.length, GAP = 46, X = PIECES.map((_, i) => i * GAP);
const WINGS = { textile: { first: 0, name: 'Textile' }, clay: { first: 3, name: 'Clay' }, brass: { first: 5, name: 'Brass' } };
const MUSEUMS = [
  { id: 'textile', at: [0, -46], rot: 0 },
  { id: 'clay', at: [-80, -12], rot: 0.78 },
  { id: 'brass', at: [80, -12], rot: -0.78 },
];
const smooth = (t) => { const k = Math.min(1, Math.max(0, t)); return k * k * (3 - 2 * k); };

// ---------------------------------------------------------------- the plaza
// A stone ring runs past the three museum steps round a pond; a path leads in from the front.
const RING = { x: 0, z: 8, rx: 74, rz: 38 }, POND = { rx: 28, rz: 14 }, SPUR = 46, OFF = 160;
const ringAt = (a) => [RING.x + Math.cos(a) * RING.rx, RING.z + Math.sin(a) * RING.rz];
const ringAngle = ([x, z]) => Math.atan2((z - RING.z) / RING.rz, (x - RING.x) / RING.rx);
// a museum's own point (its front faces +z: the foot of the steps at z 13, the door at z -3) in the plaza
const local = (m, lx, lz) => { const c = Math.cos(m.rot), s = Math.sin(m.rot); return [m.at[0] + lx * c + lz * s, m.at[1] - lx * s + lz * c]; };
// the height of the floor under a walker: up the museum steps to the podium, level elsewhere
function floorY(x, z) {
  for (const m of MUSEUMS) {
    const dx = x - m.at[0], dz = z - m.at[1], c = Math.cos(m.rot), s = Math.sin(m.rot);
    const lx = dx * c - dz * s, lz = dx * s + dz * c;
    if (Math.abs(lx) < 21 && lz < 14 && lz > -16) return Math.min(3, Math.max(0, ((13 - lz) / 6.5) * 3));
  }
  return 0;
}
// the ring from one angle to another, the short way round
function arc(a0, a1) {
  let d = a1 - a0;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const n = Math.max(2, Math.ceil(Math.abs(d) / 0.08)), out = [];
  for (let i = 0; i <= n; i++) out.push(ringAt(a0 + (d * i) / n));
  return out;
}
const ENTRY = Object.fromEntries(MUSEUMS.map((m) => [m.id, ringAngle(local(m, 0, 15))]));
const POND_VIEWS = [[-16, 29], [14, 30], [-36, 21]];

// give a walker a new path: its length, and where on it a pond walk stops
function setRoute(w, path) {
  w.path = path; w.d = 0;
  w.total = along(path, 0).total;
  w.stopAt = path.stop !== undefined ? along(path.slice(0, path.stop + 1), 0).total : -1;
}

function plazaRoutes(rand) {
  const front = Math.PI / 2;
  const inTo = (m) => [[0, OFF], [0, SPUR], ...arc(front, ENTRY[m.id]), local(m, 0, 13), local(m, 0, 6), local(m, 0, -3)];
  return {
    enter: () => inTo(MUSEUMS[Math.floor(rand() * 3)]),
    exit: () => inTo(MUSEUMS[Math.floor(rand() * 3)]).reverse(),
    // a walk in to look at the pond for a while, then out again
    pond: () => { const v = POND_VIEWS[Math.floor(rand() * POND_VIEWS.length)]; return Object.assign([[0, OFF], [0, SPUR], v, [0, SPUR], [0, OFF]], { stop: 2 }); },
  };
}

async function museumPlaza(canvas, after) {
  const groups = {}, folk = [], idle = [];
  const rand = rng(11), routes = plazaRoutes(rand);
  const api = await mountScene(canvas, {
    cam: { pos: [0, 30, 170], look: [0, 17, -20], fov: 46 },
    sun: [-0.45, 0.6, 0.66],
    glow: [-0.36, 0.05, -0.93],
    band: 0.07,
    fog: [240, 900],
    land: 0x8fae5a,
    shadowBox: 170,
    centre: [0, 0, -10],
    phoneBack: 2.7,
    build: async (S) => {
      // lawn, the stone ring and the path in, a stone rim round the pond
      S.add(flatGround(-100, -60, 100, 90, (gx, gz) => {
        const x = gx * 2, z = gz * 2;
        const e = Math.hypot((x - RING.x) / RING.rx, (z - RING.z) / RING.rz), p = Math.hypot(x / POND.rx, (z - RING.z) / POND.rz);
        if (p <= 1) return 0x6f6450;
        if (Math.abs(e - 1) < 0.075 || (Math.abs(x) < 5 && z > SPUR - 2)) return mod(gx + gz, 2) ? 0xd6cab2 : 0xc8bb9f;
        return hash3(gx, 0, gz) > 0.5 ? 0x8fae5a : 0x9cb866;
      }), { at: [0, -2, 0], size: 2, shadow: false, jitter: 0.04 });   // two-unit cells: top at y 0
      const rim = new Vox();
      for (let a = 0; a < Math.PI * 2; a += 0.02) {
        const x = Math.round(Math.cos(a) * (POND.rx + 1)), z = Math.round(RING.z + Math.sin(a) * (POND.rz + 1));
        rim.set(x, 0, z, hash3(x, 0, z) > 0.5 ? 0xbfb29a : 0xa89c86);
      }
      S.add(rim, { jitter: 0.06 });
      const water = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x3f7f93, transparent: true, opacity: 0.92 }));
      water.scale.set(POND.rx, 1, POND.rz); water.position.set(0, 0.45, RING.z); water.receiveShadow = true;
      S.scene.add(water);
      const pads = new Vox();
      for (const [x, z] of [[-14, 4], [-11, 6], [9, 12], [12, 10], [17, 4], [-4, 14]]) { pads.set(x, 0, z, 0x5e9a5a); pads.set(x + 1, 0, z, 0x6fae62); }
      pads.set(12, 1, 10, 0xe57fa0);
      S.add(pads, { at: [0, -0.4, 0], shadow: false });

      for (const m of MUSEUMS) {
        const g = S.group([m.at[0], 0, m.at[1]], m.rot);
        S.add(M.museum(m.id), { parent: g });
        // the museum's name on its frieze, in the wordmark's indigo
        const word = await textVox(WINGS[m.id].name, { px: 34, depth: 2, colour: 0x2b3554 });
        const b = word.bounds(), size = 0.28, w = (b.x1 - b.x0 + 1) * size;
        S.add(word, { parent: g, at: [-w / 2 - b.x0 * size, 27.4 - word.baseline * size, 5], size, jitter: 0.02, shadow: false });
        groups[m.id] = g;
      }

      // a picnic on the lawn by the pond, and two people watching the water
      const mat = new Vox();
      for (let x = -6; x <= 6; x++) for (let z = -4; z <= 4; z++) mat.set(x, 0, z, Math.abs(x) === 6 || Math.abs(z) === 4 ? C.clay : mod(Math.floor(x / 2) + Math.floor(z / 2), 2) ? 0xd2b47c : 0xe7d6ae);
      mat.lathe(2, -1, 1, [1.6, 2, 2], C.bamboo, 2);
      mat.set(-2, 1, 1, C.red); mat.set(-1, 1, 1, C.yellow); mat.set(-2, 1, 0, 0x8aa646);
      S.add(mat, { at: [36, -0.6, 26], jitter: 0.05 });
      for (const [dx, dz, dir, k] of [[-4, -6, 0, K.saya], [6, -1, -Math.PI / 2, K.barong], [-3, 6, Math.PI, K.reveler]]) {
        const p = S.add(M.personSitting(k(140 + dx)), { at: [36 + dx, 0, 26 + dz], rot: dir });
        idle.push([p, p.position.y, dz]);
      }
      for (const [x, z, k] of [[-10, 28, K.farmer], [8, 28, K.maranao]]) {
        const p = S.add(M.person(k(150 + x)), { at: [x, 0, z], rot: Math.PI });
        idle.push([p, 0, x]);
      }

      // visitors: they walk in from the front, along the ring, up the steps and in; others come out
      const dress = [K.barong, K.saya, K.reveler, K.farmer, K.maranao, K.tboli, K.kadayawan];
      for (let i = 0; i < 12; i++) {
        const mesh = S.add(M.person(dress[i % dress.length](100 + i)), { at: [0, 0, 0] });
        mesh.scale.setScalar(0.0001);
        const w = { mesh, speed: 4.5 + rand() * 2, pause: 0 };
        setRoute(w, routes[['enter', 'exit', 'pond'][i % 3]]());
        w.d = rand() * w.total * 0.9;
        folk.push(w);
      }
      for (const [x, z, s] of [[-150, 20, 1], [150, 24, 2], [-140, -70, 3], [140, -66, 4], [-40, -96, 5], [44, -100, 6], [-170, 80, 7], [170, 76, 8], [-110, 70, 9], [116, 66, 10]])
        S.add(s % 3 ? M.roundTree(s) : M.palm(s), { at: [x, 0, z], size: 2 });
    },
    tick: (t, dt) => {
      for (const [p, y, k] of idle) { p.position.y = y + Math.abs(Math.sin(t * 1.3 + k)) * 0.15; }
      for (const w of folk) {
        if (w.pause > 0) { w.pause -= dt; continue; }
        const before = w.d;
        w.d += w.speed * dt;
        // a pond walk stops at the water for a few seconds, facing it
        if (w.stopAt > 0 && before < w.stopAt && w.d >= w.stopAt) { w.d = w.stopAt; w.pause = 4 + rand() * 5; }
        const p = along(w.path, w.d);
        w.mesh.position.set(p.x, floorY(p.x, p.z) + (w.pause > 0 ? 0 : Math.abs(Math.sin(w.d * 0.9)) * 0.35), p.z);
        w.mesh.rotation.y = w.pause > 0 ? Math.atan2(-p.x, RING.z - p.z) : p.heading;
        // they shrink away through a museum door, and grow out of one
        w.mesh.scale.setScalar(Math.max(0.0001, Math.min(1, w.d / 2.5, (w.total - w.d) / 2.5)));
        if (w.d >= w.total) {   // through the door, or off the plaza: someone else's turn
          setRoute(w, routes[rand() < 0.42 ? 'enter' : rand() < 0.72 ? 'exit' : 'pond']());
          w.speed = 4.5 + rand() * 2;
        }
      }
    },
    after: (a) => after?.(a, groups),
  });
  return api;
}

// ---------------------------------------------------------------- the hall
async function hallScene(canvas, after) {
  const lamps = [], items = [];
  const api = await mountScene(canvas, {
    sky: false,
    sun: null,
    fill: 0.22,
    exposure: 1.1,
    cam: { pos: [0, 24, 90], look: [0, 18, -4], fov: 38 },
    phoneBack: 2,
    build: async (S) => {
      const T = THREE, x0 = -34, x1 = X[N - 1] + 34;
      S.add(flatGround(x0, -12, x1, 90, (x, z) => (mod(Math.floor(z / 3), 2) ? 0x2d241e : 0x342a22)), { at: [0, -1, 0], shadow: false, jitter: 0.06 });
      // the back wall with its dado rail, the end walls that close the hall, the ceiling track
      const room = new Vox();
      const plaster = (x, y, z) => (y === 9 || y === 10 ? 0x2a2018 : y < 2 ? 0x1a140f : hash3(x, y, z) > 0.92 ? 0x222d48 : 0x1e2843);
      for (let x = x0; x <= x1; x++) {
        for (let y = 0; y <= 58; y++) room.set(x, y, -13, plaster(x, y, -13));
        room.set(x, 50, 18, 0x15110e); room.set(x, 51, 18, 0x15110e);
      }
      for (const x of [x0 - 1, x1 + 1]) for (let z = -13; z <= 64; z++) for (let y = 0; y <= 58; y++) room.set(x, y, z, plaster(x, y, z));
      S.add(room, { shadow: false });
      // the hall's two ends read even in the dark: a brass rail and a stone pilaster at each corner
      const trim = new Vox(), stone = new Vox();
      for (const x of [x0, x1]) {
        for (let z = -12; z <= 64; z++) { trim.set(x, 10, z, 0x6f5c3d); trim.set(x, 1, z, 0x4a3d2a); }
        for (let y = 0; y <= 58; y++) for (const dz of [0, 1, 2]) stone.set(x, y, -12 + dz, mod(y, 6) ? 0x4d4a45 : 0x3b3935);
      }
      for (let x = x0; x <= x1; x++) trim.set(x, 10, -12, 0x6f5c3d);
      S.add(trim, { shadow: false, jitter: 0, material: new THREE.MeshBasicMaterial({ vertexColors: true }) });
      S.add(stone, { shadow: false, jitter: 0.03, material: new THREE.MeshBasicMaterial({ vertexColors: true }) });

      PIECES.forEach((p, i) => {
        const g = S.group([X[i], 0, 0]);
        const model = p.model(), mb = model.bounds();
        let lift = 0;
        if (p.show !== 'open') {   // a pedestal, cream stone
          lift = p.show === 'case' ? 10 : 13;
          const ped = new Vox();
          ped.box(-8, 0, -7, 8, lift - 1, 7, (x, y) => (y === lift - 1 ? 0xeee5d3 : y === 0 ? 0xbcae93 : 0xdcd1bc));
          S.add(ped, { parent: g });
        }
        S.add(model, { parent: g, at: [0, lift - mb.y0, p.id === 'tnalak' ? -10 : 0] });
        if (p.show === 'case') {   // a glass case on the pedestal, its edges in brass
          const h = mb.y1 - mb.y0 + 6;
          const box = new T.BoxGeometry(17, h, 15);
          const glass = new T.Mesh(box, new T.MeshLambertMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.1, depthWrite: false }));
          const edges = new T.LineSegments(new T.EdgesGeometry(box), new T.LineBasicMaterial({ color: 0x9c8f72 }));
          glass.position.set(0, lift + h / 2, 0); edges.position.copy(glass.position);
          g.add(glass, edges);
        }
        items.push(g);
        // the lamp: a spot on the ceiling track aimed at the middle of the piece, the beam you can see,
        // the bulb that glows when it is on
        const spot = new T.SpotLight(0xffe2b8, 0, 0, 0.4, 0.55, 0);
        spot.position.set(X[i], 49, 18);
        spot.target.position.set(X[i], lift + (mb.y1 - mb.y0) / 2, -4);
        spot.castShadow = true; spot.shadow.mapSize.set(512, 512); spot.shadow.bias = -0.0008;
        S.scene.add(spot, spot.target);
        const len = spot.position.distanceTo(spot.target.position) + 8;
        const cone = new T.ConeGeometry(Math.tan(0.4) * len, len, 40, 1, true);
        cone.translate(0, -len / 2, 0);
        const beamMat = new T.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
        const beam = new T.Mesh(cone, beamMat);
        beam.position.copy(spot.position);
        beam.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), spot.target.position.clone().sub(spot.position).normalize());
        const bulbMat = new T.MeshBasicMaterial({ color: 0x2a2622 });
        const bulb = new T.Mesh(new T.BoxGeometry(3, 2, 3), bulbMat);
        bulb.position.set(X[i], 48.5, 18);
        S.scene.add(beam, bulb);
        lamps.push({ spot, beamMat, bulbMat, k: 0 });
      });
    },
    after: (a) => after?.(a, items),
  });
  return { ...api, lamps };
}

// ---------------------------------------------------------------- the viewer
// The piece alone in the dark, no mat under it: drag to turn it any way, the bottom included; a flick
// keeps it turning for a moment; at rest it turns slowly on its own. The light rides with the camera,
// so whichever side you turn toward you is lit.
async function pieceViewer(canvas) {
  const T = THREE;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = T.NeutralToneMapping;
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 1, 3000);
  scene.add(new T.HemisphereLight(0xc9d6f0, 0x5b4a33, 1.2), cam);
  const key = new T.DirectionalLight(0xffe2b8, 2.1); key.position.set(-0.6, 0.9, 1); cam.add(key);
  const under = new T.DirectionalLight(0xc9d6f0, 0.6); under.position.set(0.4, -1, 0.5); cam.add(under);
  const turn = new T.Group(); scene.add(turn);
  const mat = new T.MeshLambertMaterial({ vertexColors: true });
  const meshes = PIECES.map((p) => {
    const g = meshVox(p.model(), { size: 1, jitter: 0.06 });
    g.center(); g.computeBoundingSphere();
    return new T.Mesh(g, mat);
  });
  const Y = new T.Vector3(0, 1, 0), XA = new T.Vector3(1, 0, 0), qa = new T.Quaternion(), qb = new T.Quaternion();
  const rotate = (dx, dy) => { qa.setFromAxisAngle(Y, dx); qb.setFromAxisAngle(XA, dy); turn.quaternion.premultiply(qa).premultiply(qb); };
  let radius = 20, drag = null, vx = 0, vy = 0, running = false, last = 0, w = 1, h = 1;
  const size = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  };
  new ResizeObserver(size).observe(canvas);
  function frame(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (!drag) {
      if (Math.abs(vx) + Math.abs(vy) > 0.0004) { rotate(vx, vy); vx *= Math.exp(-dt * 3); vy *= Math.exp(-dt * 3); }
      else rotate(dt * 0.22, 0);
    }
    const fit = Math.min(cam.fov, (2 * Math.atan(Math.tan((cam.fov * Math.PI) / 360) * cam.aspect) * 180) / Math.PI);
    cam.position.set(0, 0, (radius / Math.sin((fit * Math.PI) / 360)) * 1.06);
    cam.lookAt(0, 0, 0);
    renderer.render(scene, cam);
    if (running) requestAnimationFrame(frame);
  }
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; vx = vy = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = (e.clientX - drag.x) * 0.01, dy = (e.clientY - drag.y) * 0.01;
    rotate(dx, dy); vx = dx; vy = dy;
    drag = { x: e.clientX, y: e.clientY };
  });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  size();
  return {
    rotate,
    show(i) {
      turn.clear();
      turn.add(meshes[i]);
      turn.quaternion.setFromEuler(new T.Euler(0.3, -0.55, 0));
      radius = meshes[i].geometry.boundingSphere.radius;
      vx = vy = 0;
    },
    start() { if (!running) { running = true; last = 0; size(); requestAnimationFrame(frame); } },
    stop() { running = false; },
  };
}

// ---------------------------------------------------------------- the page
const plaza = document.querySelector('.plaza');
const hall = document.querySelector('.hall');
const viewer = document.querySelector('.piece');

// the scroll position that brings piece i to the middle of the hall
function scrollFor(i) {
  const r = hall.getBoundingClientRect();
  return scrollY + r.top + (i / (N - 1)) * (r.height - innerHeight);
}
const goTo = (i, behavior = 'smooth') => scrollTo({ top: scrollFor(i), behavior });

if (plaza) {
  const doors = [...plaza.querySelectorAll('.plaza__door')];
  // each door covers its museum, kept inside the hero (a turned museum's box runs past the frame)
  const place = (api, groups) => {
    const W = plaza.clientWidth;
    for (const d of doors) {
      const b = api.box(groups[d.dataset.museum]);
      const x0 = Math.max(0, b.x0), x1 = Math.min(W, b.x1);
      Object.assign(d.style, { left: `${x0}px`, top: `${b.y0}px`, width: `${x1 - x0}px`, height: `${b.y1 - b.y0}px` });
    }
  };
  doors.forEach((d) => d.addEventListener('click', () => goTo(WINGS[d.dataset.museum].first)));
  museumPlaza(plaza.querySelector('canvas'), place).then((api) => { plaza.classList.add('is-live'); api.play(); }).catch(() => plaza.classList.add('is-still'));
}

if (hall && viewer) {
  const pins = [...hall.querySelectorAll('.hall__piece')];
  const wings = [...hall.querySelectorAll('[data-wing]')];
  const now = { name: hall.querySelector('[data-now-name]'), maker: hall.querySelector('[data-now-maker]'), num: hall.querySelector('[data-now-num]') };
  const labels = PIECES.map((p) => document.querySelector(`template[data-label="${p.id}"]`));
  let H = null, cur = 0, focus = -1, raf = 0, last = 0;

  const progress = () => {
    const r = hall.getBoundingClientRect(), span = r.height - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  };
  // the hall rests on each piece for the middle of its share of the scroll, and slides between them
  const camX = (p) => {
    const f = p * (N - 1), i = Math.min(N - 2, Math.floor(f));
    return X[i] + (X[i + 1] - X[i]) * smooth((f - i - 0.2) / 0.6);
  };
  function setFocus(i) {
    if (i === focus) return;
    focus = i;
    const t = labels[i].content;
    now.name.textContent = t.querySelector('h2').textContent;
    now.maker.textContent = t.querySelector('.label__maker').textContent;
    now.num.textContent = `${i + 1} of ${N}`;
    wings.forEach((w) => w.toggleAttribute('aria-current', w.dataset.wing === PIECES[i].wing));
  }
  function tick(t) {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
    last = t;
    const p = progress();
    // the hall's title and museum chips step aside once the walk begins
    hall.classList.toggle('is-walking', p > 0.015);
    const goal = camX(p);
    cur += (goal - cur) * (1 - Math.exp(-dt * 10));
    let busy = Math.abs(goal - cur) > 0.02;
    H.lamps.forEach((l, i) => {
      const want = smooth(1 - Math.abs(cur - X[i]) / 24);
      l.k += (want - l.k) * (1 - Math.exp(-dt * 7));
      if (Math.abs(want - l.k) > 0.003) busy = true;
      l.spot.intensity = l.k * 4;
      l.beamMat.opacity = l.k * 0.03;
      l.bulbMat.color.setHex(0x2a2622).lerp(new THREE.Color(0xfff1cf), l.k);
    });
    H.jump({ pos: [cur, 24, 90], look: [cur, 18, -4] });
    setFocus(X.reduce((best, x, i) => (Math.abs(x - cur) < Math.abs(X[best] - cur) ? i : best), 0));
    raf = busy ? requestAnimationFrame(tick) : 0;
  }
  const wake = () => { if (H && !raf) { last = 0; raf = requestAnimationFrame(tick); } };

  // each piece's button sits over it, so a click on the piece opens it and Tab walks the hall
  const placePins = (api, items) => {
    items.forEach((g, i) => {
      const b = api.box(g);
      Object.assign(pins[i].style, { left: `${b.x0}px`, top: `${b.y0}px`, width: `${b.x1 - b.x0}px`, height: `${b.y1 - b.y0}px` });
    });
  };
  hallScene(hall.querySelector('canvas'), placePins).then((api) => {
    H = api;
    cur = camX(progress());
    hall.classList.add('is-live');
    addEventListener('scroll', wake, { passive: true });
    addEventListener('resize', wake);
    wake();
  }).catch(() => hall.classList.add('is-still'));
  setFocus(0);

  pins.forEach((p, i) => {
    p.addEventListener('click', () => open(i, p));
    p.addEventListener('focus', () => { if (H && focus !== i) goTo(i); });
  });
  hall.querySelector('[data-open]').addEventListener('click', (e) => open(Math.max(0, focus), e.currentTarget));
  wings.forEach((w) => w.addEventListener('click', (e) => { e.preventDefault(); goTo(WINGS[w.dataset.wing].first); }));

  // arts.html#<piece> (the Overview's map and the Traditions year link here) opens the hall at that piece
  const fromHash = () => {
    const i = PIECES.findIndex((p) => `#${p.id}` === location.hash);
    if (i >= 0) requestAnimationFrame(() => goTo(i, 'auto'));
  };
  addEventListener('hashchange', fromHash);
  fromHash();

  // ---------------------------------------------------------------- the viewer
  const vStage = viewer.querySelector('.piece__stage');
  const vCanvas = vStage.querySelector('canvas');
  const vPhoto = vStage.querySelector('.piece__photo');
  const swap = viewer.querySelector('.piece__swap');
  const body = viewer.querySelector('.piece__label');
  let model = null, opener = null;

  async function open(i, from) {
    opener = from;
    const t = labels[i];
    body.replaceChildren(t.content.cloneNode(true));
    vPhoto.src = t.dataset.photo; vPhoto.alt = t.dataset.alt;
    swap.querySelector('img').src = t.dataset.photo;
    vStage.classList.remove('is-photo');
    swap.setAttribute('aria-pressed', 'false');
    swap.querySelector('span').textContent = 'See the photograph';
    if (!viewer.open) viewer.showModal();
    try {
      model ??= await pieceViewer(vCanvas);
      model.show(i);
      model.start();
    } catch {
      vStage.classList.add('is-photo');   // without WebGL the photograph takes the stage
      swap.hidden = true;
    }
  }
  swap.addEventListener('click', () => {
    const photo = vStage.classList.toggle('is-photo');
    swap.setAttribute('aria-pressed', String(photo));
    swap.querySelector('span').textContent = photo ? 'See the voxel model' : 'See the photograph';
  });
  // the arrow keys turn the piece too, any way
  viewer.addEventListener('keydown', (e) => {
    const turn = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, -0.25], ArrowDown: [0, 0.25] }[e.key];
    if (!turn || !model || vStage.classList.contains('is-photo')) return;
    e.preventDefault();
    model.rotate(...turn);
  });
  viewer.addEventListener('close', () => { model?.stop(); opener?.focus({ preventScroll: true }); });
  viewer.querySelector('.viewer__close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });

  // ?piece=<id> opens the viewer on that piece, for screenshots and links
  const asked = PIECES.findIndex((p) => p.id === new URLSearchParams(location.search).get('piece'));
  if (asked >= 0) open(asked, pins[asked]);
}
