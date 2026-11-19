// Members: the word Kami stands in the sea like the Overview's words, and the five of us wave from the
// shore, each in the colour of our thread. Pick one of us and the camera flies to them and their summary
// opens; Back or Escape returns to the shore. Each figure is its own model (models.js MEMBERS), so it
// can be rebuilt from that member's reference photograph without touching the scene. ?m=<surname>
// opens a member directly, for screenshots and links.
import { mountScene, textVox, THREE, Vox } from './hero-stage.js';
import { hash3 } from './voxel-kit.js';
import * as M from './models.js';

const { C } = M;
const ORDER = ['aningat', 'banting', 'dumalagan', 'lausa', 'magallanes'];
const SPOT = ORDER.map((_, i) => [-20 + i * 10, 44 + (i % 2) * 4]);
const WIDE = { pos: [0, 40, 124], look: [0, 10, -30] };
const near = (i) => { const [x, z] = SPOT[i]; return { pos: [x, 19, z + 54], look: [x, 9, z - 4] }; };

async function shore(canvas, { after, focus }) {
  let word = null, foam = null;
  const people = [], boats = [], birds = [];
  return mountScene(canvas, {
    cam: { ...WIDE, fov: 42 },
    sun: [-0.55, 0.5, 0.66],
    glow: [-0.3, 0.06, -0.95],
    band: 0.1,
    fog: [160, 700],
    shadowBox: 150,
    phoneBack: 2.5,
    build: async (S) => {
      // sand sloping into the sea, deep enough that a phone's stepped-back camera stays over it
      const sand = new Vox();
      for (let x = -130; x <= 130; x++) for (let z = -30; z <= 220; z++) {
        const y = Math.max(0, Math.min(4, Math.floor((z + 22) / 9)));
        for (let k = Math.max(0, y - 1); k <= y; k++) sand.set(x, k, z, k === y ? (hash3(x, k, z) > 0.6 ? 0xddc896 : C.sand) : 0xcdb98a);
      }
      S.add(sand, { at: [0, -2, 0], shadow: false });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x2f6a92, transparent: true, opacity: 0.84 }));
      water.position.y = 0.6;
      water.receiveShadow = true;
      const shallow = new THREE.Mesh(new THREE.PlaneGeometry(6000, 12).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x8ccfc0, transparent: true, opacity: 0.4 }));
      shallow.position.set(0, 0.7, -9);
      S.scene.add(water, shallow);
      const f = new Vox();
      for (let x = -130; x <= 130; x++) if (hash3(x, 2, 3) > 0.25) f.set(x, 0, Math.round(Math.sin(x * 0.2) * 1.2), 0xf6f1e6);
      foam = S.add(f, { at: [0, 0.3, -4], shadow: false, jitter: 0.02 });

      // the word stands in the water, its last row under the surface
      const size = 0.7;
      const t = await textVox('Kami', { px: 64, depth: 6, colour: 0xf3ecdc });
      const b = t.bounds();
      word = S.add(t, { at: [-((b.x1 - b.x0 + 1) * size) / 2 - b.x0 * size, -5.5 - b.y0 * size, -44], size, jitter: 0.03 });

      // the five of us on the shore
      ORDER.forEach((name, i) => people.push(S.add(M.MEMBERS[name](), { at: [SPOT[i][0], 3, SPOT[i][1]] })));
      S.add(M.banca().turned(3), { at: [-58, 1.2, 10], size: 1.3 });
      boats.push(S.add(M.vinta(), { at: [86, 0.6, -170], size: 1.1, rot: 0.5 }));
      boats.push(S.add(M.vinta([C.yellow, C.red, C.green, C.white, C.blue]), { at: [-130, 0.6, -240], size: 1.1, rot: -0.4 }));
      for (const [x, z, s] of [[-80, 40, 1], [-100, 60, 3], [-70, 76, 5], [82, 44, 7], [104, 64, 9], [66, 82, 11]]) S.add(M.palm(s), { at: [x, 2, z], size: 2.2 });
      for (let i = 0; i < 6; i++) birds.push(S.add(M.bird(), { at: [0, 40, -60], size: 1.6, shadow: false }));
    },
    tick: (t) => {
      const chosen = focus();
      people.forEach((p, i) => {
        // a step in place; the two at the ends jump as they wave; the one picked hops to say hello
        const jump = i === chosen ? Math.max(0, Math.sin(t * 4)) ** 2 * 2.4 : i === 0 || i === 4 ? Math.max(0, Math.sin(t * 2.6 + i)) ** 6 * 2.2 : 0;
        p.position.y = 3 + Math.abs(Math.sin(t * 2.2 + i * 0.8)) * 0.2 + jump;
        p.rotation.y = i === chosen ? 0 : Math.sin(t * 0.9 + i * 1.7) * 0.35;
      });
      if (word) { word.position.y = (word.userData.y ??= word.position.y) + Math.sin(t * 0.7) * 0.35; word.rotation.z = Math.sin(t * 0.5) * 0.006; }
      if (foam) foam.position.z = -4 + Math.sin(t * 0.9) * 1.2;
      boats.forEach((v, i) => { v.position.x = ((v.userData.x ??= v.position.x) + t * (2.2 + i) + 320) % 640 - 320; v.position.y = 0.6 + Math.sin(t * 1.4 + i) * 0.25; });
      birds.forEach((v, i) => {
        const a = t * (0.22 + i * 0.02) + i * 1.1, r = 50 + (i % 3) * 18;
        v.position.set(Math.cos(a) * r, 34 + (i % 3) * 5 + Math.sin(t * 1.6 + i) * 1.2, -70 + Math.sin(a) * r * 0.5);
        v.rotation.y = -a;
      });
    },
    after: (api) => after(api, word, people),
  });
}

const hero = document.querySelector('.shore');
if (hero) {
  const motto = hero.querySelector('.vhero__motto');
  const panel = hero.querySelector('.shore__panel');
  const pins = [...hero.querySelectorAll('.shore__pin')];
  let here = -1, api = null;

  const after = (a, word, people) => {
    // the plain line sits on the word's top-left corner, as on the Overview
    const b = a.box(word);
    motto.style.left = `${Math.round(b.x0 + 6)}px`;
    motto.style.top = `${Math.round(b.y0 - motto.offsetHeight - 10)}px`;
    motto.classList.add('is-placed');
    // a button over each of us, at least 44px, following the hop
    people.forEach((p, i) => {
      const r = a.box(p), w = Math.max(44, r.x1 - r.x0 + 12), h = Math.max(44, r.y1 - r.y0 + 12);
      Object.assign(pins[i].style, { left: `${(r.x0 + r.x1) / 2 - w / 2}px`, top: `${(r.y0 + r.y1) / 2 - h / 2}px`, width: `${w}px`, height: `${h}px` });
    });
  };
  const show = (i) => {
    hero.dataset.here = i < 0 ? '' : ORDER[i];
    pins.forEach((p, k) => p.setAttribute('aria-pressed', String(k === i)));
    panel.hidden = i < 0;
    if (i >= 0) panel.replaceChildren(hero.querySelector(`template[data-member="${ORDER[i]}"]`).content.cloneNode(true));
  };
  async function go(i, fly = true) {
    here = i;
    show(i);
    if (!fly) return api.jump(near(i));
    await api.flyTo(near(i), 1600);
    if (here === i) panel.querySelector('[data-back]')?.focus({ preventScroll: true });
  }
  async function home() {
    const from = here;
    here = -1;
    show(-1);
    await api.flyTo(WIDE, 1600);
    pins[from]?.focus({ preventScroll: true });
  }

  shore(hero.querySelector('canvas'), { after, focus: () => here }).then((a) => {
    api = a;
    hero.classList.add('is-live');
    api.play();
    pins.forEach((p, i) => p.addEventListener('click', () => (here === i ? home() : go(i))));
    panel.addEventListener('click', (e) => { if (e.target.closest('[data-back]')) home(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && here >= 0) home(); });
    const m = ORDER.indexOf(new URLSearchParams(location.search).get('m'));
    if (m >= 0) go(m, false);
  }).catch(() => hero.classList.add('is-still'));
}
