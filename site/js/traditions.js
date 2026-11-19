// Traditions: the festival town. One voxel town holds every tradition on the page, each in its own
// corner behind a gateway that carries its name on a woven sign. The town is alive: each corner keeps
// its festival going, and people in each corner's dress walk the roads to visit the others and go home.
// Picking a name flies the camera in (the Overview's swoosh); Back or Escape flies it out. The camera
// never moves on its own. ?t=<id> opens a corner directly, for screenshots and links.
import { mountScene, wovenSign, flatGround, bunting, face, mod, along, Vox } from './hero-stage.js';
import { hash3, rng } from './voxel-kit.js';
import { canWalk, walker } from './walk.js';
import { walkSound } from './walk-sound.js';
import * as M from './models.js';

const { C, COSTUMES: K } = M;
const LUZON = 0xc4664a, VISAYAS = 0xddb260, MINDANAO = 0x5fa596;   // the map's three cloths (DESIGN.md 3.2)
const SIGN = 0.45;                                                  // world units per sign voxel
const ROAD_Z = 18;                                                  // the road along the front of the town

// each corner: its gateway (x, z), its island group's colour, the lines on its sign, the floor of its
// plaza, the dress of the people who live there. Every sign has a column of its own, so none hides
// another at any screen shape; Banaue stands apart on its hill, its sign hung higher.
const CORNERS = {
  sinulog: { at: [-106, -12], border: VISAYAS, lines: ['Sinulog'], dress: [K.sinulog, K.barong], floor: (x, z) => (mod(x + z, 4) ? 0xd5c4a0 : 0xc9b691) },
  pahiyas: { at: [0, 8], border: LUZON, lines: ['Pahiyas'], dress: [K.farmer, K.reveler], floor: (x) => (Math.abs(x) <= 8 ? 0xc8b692 : 0x9cb866) },
  kadayawan: { at: [106, -12], border: MINDANAO, lines: ['Kadayawan'], dress: [K.kadayawan, K.maranao], floor: (x, z) => (hash3(x, 1, z) > 0.5 ? 0xc9ad84 : 0xbea078) },
  'ati-atihan': { at: [-70, -114], border: VISAYAS, lines: ['Ati-Atihan'], dress: [K.ati, K.reveler], floor: (x, z) => (hash3(x, 2, z) > 0.55 ? 0xc6a983 : 0xbb9d77) },
  vigan: { at: [70, -114], border: LUZON, lines: ['Calle', 'Crisologo'], dress: [K.barong, K.saya], floor: (x, z) => (mod(x, 3) && mod(z, 3) ? 0xb59f86 : 0x9c8770) },
  terraces: { at: [-150, -168], border: LUZON, lines: ['Banaue'], dress: [K.ifugaoMan, K.ifugaoWoman], floor: () => 0x8fae5a, foot: 46 },
};
const IDS = Object.keys(CORNERS);
export const WIDE = { pos: [0, 66, 232], look: [0, 16, -64] };
export const near = (id) => {
  const { at: [x, z], foot = 21 } = CORNERS[id];
  return { pos: [x, foot + 2, z + 108], look: [x, foot - 9, z - 30] };
};

// how each corner sounds on foot: its recording on the Overview's mark, and whose voices (js/walk-sound.js)
const SOUNDS = {
  sinulog: { loop: 'sinulog', db: -2, voices: 'sinulog' },
  pahiyas: { loop: 'pahiyas', db: 0, voices: 'pahiyas' },
  kadayawan: { loop: 'kadayawan', db: -4, voices: 'kadayawan' },
  'ati-atihan': { loop: 'ati', db: -2, voices: 'ati' },
  vigan: { loop: 'calesa', db: -9, voices: 'vigan' },   // the calesa's hooves follow the calesa
  terraces: { loop: 'banaue', db: -4, voices: 'banaue' },
};

// little motions for the people who stay in their corner; whatever moves is flagged, so a walker
// collides with it where it is now, not where it started (js/walk.js)
const life = [];
const moving = (mesh) => { mesh.userData.moves = true; return mesh; };
const hop = (mesh, amp, speed, phase = 0) => { moving(mesh); const y = mesh.position.y; life.push((t) => { mesh.position.y = y + Math.abs(Math.sin(t * speed + phase)) * amp; }); };
const sway = (mesh, amp, speed, phase = 0) => { moving(mesh); const r = mesh.rotation.y; life.push((t) => { mesh.rotation.y = r + Math.sin(t * speed + phase) * amp; }); };
// back and forth along a line, turning at each end (a carabao, a calesa, a farmer on a terrace)
const pace = (mesh, [x0, z0], [x1, z1], speed, phase = 0) => {
  moving(mesh);
  const len = Math.hypot(x1 - x0, z1 - z0), out = Math.atan2(x1 - x0, z1 - z0);
  life.push((t) => {
    const u = ((t * speed + phase * len) / len) % 2, k = u < 1 ? u : 2 - u, s = k * k * (3 - 2 * k);
    mesh.position.x = x0 + (x1 - x0) * s; mesh.position.z = z0 + (z1 - z0) * s;
    mesh.rotation.y = u < 1 ? out : out + Math.PI;
  });
};

// what stands behind each gateway (the gateway at x, z; the corner runs back toward -z)
const BUILD = {
  sinulog(S, x, z) {
    S.add(M.church(), { at: [x + 4, 0, z - 50] });
    const nino = S.add(M.person(K.sinulogLead(3)), { at: [x, 0, z - 24] });
    hop(nino, 0.3, 3);
    // the ring dances round the Santo Nino: two steps forward and one back, like a river's current
    for (let i = 0; i < 8; i++) {
      const m = moving(S.add(M.person({ ...K.sinulog(i + 4), arms: i % 2 ? 'up' : 'out' }), { at: [x, 0, z - 24] }));
      const a0 = (i / 8) * Math.PI * 2;
      life.push((t) => {
        const a = a0 + t * 0.32 + Math.sin(t * 4.2) * 0.07;
        m.position.set(x + Math.cos(a) * 10, Math.abs(Math.sin(t * 4.2 + i)) * 0.6, z - 24 + Math.sin(a) * 8);
        m.rotation.y = -a;
      });
    }
    for (const s of [-1, 1]) hop(S.add(M.person({ ...K.sinulog(20 + s), hold: 'drum', arms: 'out' }), { at: [x + s * 18, 0, z - 12] }), 0.5, 6.3, s);
  },
  pahiyas(S, x, z) {
    [-14, -30, -46].forEach((dz, i) => {
      S.add(face(M.pahiyasHouse(i + 1), '+x'), { at: [x - 15, 0, z + dz] });
      S.add(face(M.pahiyasHouse(i + 7), '-x'), { at: [x + 15, 0, z + dz - 3] });
    });
    const flags = new Vox();
    for (const dz of [-8, -24, -40]) bunting(flags, x - 9, x + 9, 17, z + dz, dz);
    S.add(flags, { shadow: false });
    const carabao = S.add(M.carabao(), { at: [x, 0, z - 34] });
    carabao.userData.radius = 3;   // an animal or a cart: wider than a person, and it does not talk
    pace(carabao, [x, z - 48], [x, z - 18], 1.2);
    [[-4, -14], [4, -20], [-3, -46], [3, -50]].forEach(([dx, dz], i) => {
      const m = S.add(M.person({ ...K.farmer(30 + i), hold: i % 2 ? 'basket' : null, arms: i % 2 ? 'up' : 'down' }), { at: [x + dx, 0, z + dz] });
      hop(m, 0.4, 3.4, i); sway(m, 0.4, 1.1, i);
    });
  },
  kadayawan(S, x, z) {
    [[-17, -42], [-5, -46], [7, -46], [19, -42]].forEach(([dx, dz], i) => S.add(M.fruitStall(i + 1), { at: [x + dx, 0, z + dz] }));
    [[-12, -18], [-4, -16], [4, -16], [12, -18], [-8, -27], [0, -26], [8, -27]].forEach(([dx, dz], i) => {
      const m = S.add(M.person({ ...K.kadayawan(i + 40), arms: i % 2 ? 'up' : 'out' }), { at: [x + dx, 0, z + dz] });
      hop(m, 0.5, 3.8, i * 0.7); sway(m, 0.6, 1.9, i);
    });
  },
  'ati-atihan'(S, x, z) {
    for (const [dx, dz, s] of [[-19, -24, 1], [19, -28, 2], [-19, -44, 3], [19, -46, 4]]) S.add(face(M.nipaHut(s), dx < 0 ? '+x' : '-x'), { at: [x + dx, 0, z + dz] });
    [[-6, -14], [0, -12], [6, -14]].forEach(([dx, dz], i) => hop(S.add(M.person(K.atiDrum(i + 50)), { at: [x + dx, 0, z + dz] }), 0.5, 7.2, i * 0.5));
    [[-7, -26], [-2, -30], [3, -26], [8, -30], [0, -38]].forEach(([dx, dz], i) => {
      const m = S.add(M.person({ ...K.ati(i + 60), arms: 'up' }), { at: [x + dx, 0, z + dz] });
      hop(m, 1, 3.6, i); sway(m, 0.8, 2.4, i);
    });
  },
  vigan(S, x, z) {
    [-16, -36, -56].forEach((dz, i) => {
      S.add(face(M.bahayNaBato(i + 2), '+x'), { at: [x - 15, 0, z + dz] });
      S.add(face(M.bahayNaBato(i + 9), '-x'), { at: [x + 15, 0, z + dz - 2] });
    });
    const calesa = S.add(M.calesa(), { at: [x - 2, 0, z - 26] });
    calesa.userData.radius = 4;
    calesa.name = 'calesa';
    pace(calesa, [x - 2, z - 58], [x - 2, z - 10], 3.2);
    [[5, -14, K.barong], [-5, -40, K.saya], [4, -46, K.barong]].forEach(([dx, dz, k], i) => {
      pace(S.add(M.person(k(70 + i)), { at: [x + dx, 0, z + dz] }), [x + dx, z + dz], [x + dx, z + dz - 14], 1.6, i * 0.5);
    });
  },
  terraces(S, x, z) {
    S.add(M.terraces(), { at: [x, 0, z - 30], size: 2.4 });
    S.add(M.ifugaoHut(), { at: [x - 30, 0, z - 22], size: 1.2 });
    S.add(M.ifugaoHut(), { at: [x + 30, 0, z - 26], size: 1.2 });
    [[-7, -12], [6, -14], [0, -8]].forEach(([dx, dz], i) => {
      pace(S.add(M.person(K.farmer(80 + i)), { at: [x + dx, 0, z + dz] }), [x + dx - 6, z + dz], [x + dx + 6, z + dz], 1.4, i * 0.3);
    });
  },
};

// the ground, two voxels a cell: grass, the roads, each corner's own floor
const roadX = Object.values(CORNERS).map(({ at: [x] }) => x);
function onRoad(x, z) {
  if (z > ROAD_Z - 6 && z < ROAD_Z + 6 && Math.abs(x) < 175) return true;
  return Object.values(CORNERS).some(({ at: [ax, az] }) => Math.abs(x - ax) < 5 && z < ROAD_Z && z > az);
}
function ground() {
  const g = new Vox();
  for (let gx = -100; gx <= 100; gx++) for (let gz = -140; gz <= 60; gz++) {
    const x = gx * 2, z = gz * 2;
    const corner = Object.values(CORNERS).find(({ at: [ax, az] }) => Math.abs(x - ax) <= 30 && z <= az + 2 && z >= az - 62);
    g.set(gx, 0, gz, corner ? corner.floor(x, z) : onRoad(x, z) ? (mod(gx + gz, 3) ? 0xc9b691 : 0xbfab86) : hash3(gx, 0, gz) > 0.55 ? 0x8fae5a : 0x9cb866);
  }
  return g;
}

// people who come and go: each lives in a corner, walks out through its gate, along the road to
// another corner, goes in for a while, and walks home again
function walkers(S) {
  const rand = rng(7), list = [];
  const gate = (id) => { const [x, z] = CORNERS[id].at; return [x, z - 6]; };
  // out of a's gate, along the road (one lane each way), in through b's gate
  const route = (a, b) => {
    const [ax] = CORNERS[a].at, [bx] = CORNERS[b].at, lane = bx > ax ? ROAD_Z - 2 : ROAD_Z + 3;
    return Object.assign([gate(a), [ax, lane], [bx, lane], gate(b)], { to: b });
  };
  IDS.forEach((home, h) => {
    for (let k = 0; k < 3; k++) {
      const dress = CORNERS[home].dress[k % 2];
      const mesh = moving(S.add(M.person(dress(300 + h * 10 + k)), { at: [0, 0, 0] }));
      mesh.scale.setScalar(0.0001);   // hidden until its first step
      const w = { home, at: home, mesh, path: null, d: 0, speed: 5 + rand() * 2.5, wait: rand() * 6 };
      // start some already on the road, so the town is busy from the first frame
      if (rand() > 0.35) { w.path = route(home, IDS[(h + 1 + Math.floor(rand() * 5)) % 6]); w.d = rand() * along(w.path, 0).total * 0.8; w.wait = 0; }
      list.push(w);
    }
  });
  return Object.assign((t, dt) => {
    for (const w of list) {
      if (!w.path) {   // inside a corner, resting
        w.mesh.scale.setScalar(0.0001);
        if ((w.wait -= dt) > 0) continue;
        w.path = route(w.at, w.at !== w.home ? w.home : IDS.filter((id) => id !== w.home)[Math.floor(rand() * 5)]);
        w.d = 0;
      }
      w.d += w.speed * dt;
      const p = along(w.path, w.d), edge = Math.min(1, w.d / 3, (p.total - w.d) / 3);
      w.mesh.position.set(p.x, Math.abs(Math.sin(w.d * 0.9)) * 0.35, p.z);
      w.mesh.rotation.y = p.heading;
      w.mesh.scale.setScalar(Math.max(0.0001, edge));
      if (w.d >= p.total) { w.at = w.path.to; w.path = null; w.wait = 3 + rand() * 7; }
    }
  }, { list });
}

export async function festivalTown(canvas, { after } = {}) {
  const signs = {}, folk = {};   // folk: the things that move in each corner, its people among them
  let walk = null;
  const birds = [], clouds = [];
  const api = await mountScene(canvas, {
    cam: { ...WIDE, fov: 40 },
    sun: [-0.42, 0.6, 0.68],
    glow: [0.5, 0.04, -0.87],
    band: 0.05,
    fog: [260, 900],
    land: 0x93b060,
    shadowBox: 240,
    centre: [0, 0, -80],
    phoneBack: 2.3,
    build: async (S) => {
      S.add(ground(), { at: [0, -2, 0], size: 2, shadow: false, jitter: 0.05 });   // two-unit cells: top at y 0
      for (const [id, c] of Object.entries(CORNERS)) {
        const [x, z] = c.at;
        const n = S.scene.children.length;
        BUILD[id](S, x, z);
        folk[id] = S.scene.children.slice(n).filter((m) => m.userData.moves);
        // the gateway: two bamboo posts dressed in gold, a beam, the woven sign hanging from it
        const sign = await wovenSign(c.lines, { px: 26, border: c.border });
        const w = sign.w * SIGN, h = sign.h * SIGN, foot = c.foot ?? 21, top = foot + h;
        signs[id] = S.add(sign.v, { at: [x - w / 2, foot, z], size: SIGN, jitter: 0.04 });
        const gate = new Vox(), px = Math.round(w / 2) + 2;
        for (const s of [-1, 1]) for (let y = 0; y <= top + 2; y++) {
          gate.set(x + s * px, y, z, mod(y, 5) < 2 ? C.gold : C.bamboo);
          gate.set(x + s * px, y, z - 1, C.bambooDark);
        }
        for (let gx = x - px - 1; gx <= x + px + 1; gx++) { gate.set(gx, Math.ceil(top) + 1, z, C.bamboo); gate.set(gx, Math.ceil(top) + 2, z, C.bambooDark); }
        S.add(gate);
      }
      // trees and huts between the corners, kept off the roads and the plazas
      for (let i = 0; i < 80; i++) {
        const x = Math.round((hash3(i, 7, 1) - 0.5) * 360), z = Math.round(40 - hash3(i, 7, 2) * 290);
        const busy = Object.values(CORNERS).some(({ at: [ax, az] }) => Math.abs(x - ax) < 40 && z < az + 14 && z > az - 72)
          || (z > ROAD_Z - 12 && z < ROAD_Z + 12) || roadX.some((rx) => Math.abs(x - rx) < 10 && z < ROAD_Z);
        if (busy) continue;
        const k = hash3(i, 7, 3);
        S.add(k > 0.85 ? M.nipaHut(i) : k > 0.45 ? M.palm(i) : M.roundTree(i), { at: [x, 0, z], size: k > 0.85 ? 1 : 1.7 });
      }
      for (const [x, z, s] of [[40, 52, 1], [96, 64, 2], [150, 46, 3], [-160, 60, 4], [10, 86, 5]]) S.add(s % 2 ? M.palm(s) : M.roundTree(s), { at: [x, 0, z], size: 1.8 });
      walk = walkers(S);
      // birds circling over the town, clouds drifting past
      for (let i = 0; i < 7; i++) birds.push(moving(S.add(M.bird(), { at: [0, 60, 0], size: 1.8, shadow: false })));
      [[-120, 92, -230, 2], [40, 104, -300, 5], [190, 88, -210, 8]].forEach(([x, y, z, s]) => clouds.push(moving(S.add(M.cloud(s), { at: [x, y, z], size: 3, shadow: false }))));
    },
    tick: (t, dt) => {
      for (const f of life) f(t);
      walk?.(t, dt);
      birds.forEach((b, i) => {
        const a = t * (0.18 + i * 0.015) + i * 0.9, r = 70 + (i % 3) * 22;
        b.position.set(Math.cos(a) * r - 10, 58 + (i % 4) * 5 + Math.sin(t * 1.7 + i) * 1.5, -70 + Math.sin(a) * r * 0.6);
        b.rotation.y = -a;
      });
      clouds.forEach((c, i) => { c.position.x = ((c.userData.x0 ??= c.position.x) + t * (1.2 + i * 0.4) + 260) % 520 - 260; });
    },
    after: (a) => after?.(a, signs),
  });
  return { ...api, signs, folk, walkers: walk.list };
}

// ---------------------------------------------------------------- on foot
// The road in front of the Pahiyas gate, looking up its street; each corner's recording at the middle
// of its plaza; everyone who stays in a corner or walks the road talks in their corner's language.
function onFoot(town, hero) {
  const near = (m) => m.position.y < 20;   // the birds and clouds overhead are out of reach
  const people = [...Object.values(town.folk).flat(), ...town.walkers.map((w) => w.mesh)].filter(near);
  const loops = Object.entries(SOUNDS).map(([id, s]) => {
    const [x, z] = CORNERS[id].at;
    const calesa = id === 'vigan' && town.folk.vigan.find((m) => m.name === 'calesa');
    return calesa ? { name: s.loop, db: s.db, ref: 6, far: 50, follow: calesa } : { name: s.loop, db: s.db, ref: 22, far: 110, at: [x, 6, z - 28] };
  });
  const talkers = () => [
    ...Object.entries(town.folk).flatMap(([id, ms]) => ms.filter((m) => !m.userData.radius && near(m)).map((mesh) => ({ mesh, lang: SOUNDS[id].voices }))),
    ...town.walkers.map((w) => ({ mesh: w.mesh, lang: SOUNDS[w.home].voices })),
  ];
  return walker(town, hero, {
    place: 'town',
    bounds: [-198, -278, 198, 118],
    spawn: { at: [7, 30], yaw: 0 },   // beside the walkers' line to the gate
    home: WIDE,
    people: () => people,
    sound: walkSound(town, { loops, people: talkers }),
  });
}

// ---------------------------------------------------------------- the page
const hero = document.querySelector('.town');
if (hero) {
  const canvas = hero.querySelector('canvas');
  const panel = hero.querySelector('.town__panel');
  const pins = [...hero.querySelectorAll('.town__pin')];
  const back = () => hero.querySelector('[data-back]');
  let here = null, town = null, feet = null, walkable = canWalk;

  // on a computer the town's first button walks you in; on a phone it stays the link to the year.
  // data-walk holds the button's words for the walk
  const label = () => panel.querySelectorAll('[data-walk]').forEach((a) => {
    a.dataset.link ??= a.textContent;
    a.textContent = walkable ? a.dataset.walk : a.dataset.link;
  });
  label();
  panel.addEventListener('click', (e) => {
    const a = e.target.closest('[data-walk]');
    if (!a || !walkable) return;
    e.preventDefault();
    feet?.start(a);   // before the town is built, the click waits for nothing
  });

  // each pin sits over its sign: at least 44px square, so a small sign is still easy to tap
  const placePins = (api, signs) => {
    for (const pin of pins) {
      const b = api.box(signs[pin.dataset.corner]);
      const w = Math.max(44, b.x1 - b.x0 + 16), h = Math.max(44, b.y1 - b.y0 + 16);
      Object.assign(pin.style, { left: `${(b.x0 + b.x1) / 2 - w / 2}px`, top: `${(b.y0 + b.y1) / 2 - h / 2}px`, width: `${w}px`, height: `${h}px` });
    }
  };
  const show = (id) => {
    panel.replaceChildren(hero.querySelector(`template[data-panel="${id ?? 'town'}"]`).content.cloneNode(true));
    label();
    hero.dataset.here = id ?? '';
    pins.forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.corner === id)));
  };
  async function go(id, fly = true) {
    here = id;
    show(id);
    if (!fly) return town.jump(near(id));   // a link opened here: no flight, focus stays put
    await town.flyTo(near(id));
    if (here === id) back()?.focus({ preventScroll: true });
  }
  async function home() {
    const from = here;
    here = null;
    show(null);
    await town.flyTo(WIDE);
    pins.find((p) => p.dataset.corner === from)?.focus({ preventScroll: true });
  }

  festivalTown(canvas, { after: placePins }).then((api) => {
    town = api;
    hero.classList.add('is-live');
    town.play();
    if (walkable) window.__feet = feet = onFoot(town, hero);   // the global is for tests, like the Overview's __sound
    pins.forEach((p) => p.addEventListener('click', () => (here === p.dataset.corner ? home() : go(p.dataset.corner))));
    panel.addEventListener('click', (e) => { if (e.target.closest('[data-back]')) home(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && here) home(); });
    const t = new URLSearchParams(location.search).get('t');
    if (t in CORNERS) go(t, false);
  }).catch(() => { hero.classList.add('is-still'); walkable = false; label(); });
}
