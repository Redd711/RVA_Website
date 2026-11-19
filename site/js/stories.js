// Lifecycle stages for the three stories. Each builder returns one stage: a normalised voxel list.
import { Vox, hash3 } from './voxel-kit.js';
import * as M from './models.js';
import { normalise } from './lifecycle.js';

// a stage collects voxels with optional tags (o, u, a) on top of a colour
class Stage {
  constructor() { this.m = new Map(); }
  put(x, y, z, c, tag) { this.m.set(`${x},${y},${z}`, { x, y, z, c, ...(tag || {}) }); }
  vox(v, dx = 0, dy = 0, dz = 0, tag) {
    v.each((x, y, z, c) => this.put(x + dx, y + dy, z + dz, c, typeof tag === 'function' ? tag(x, y, z) : tag));
    return this;
  }
  done() { return normalise([...this.m.values()]); }
}
const shape = (fn) => { const v = new Vox(); fn(v); return v; };
const pickH = (a, b, x, y, z) => (hash3(x, y, z) > 0.5 ? a : b);

// ------------------------------------------------------------------ t'nalak
const TN = { dark: 0x3a2a22, red: 0x9a3324, cream: 0xefe4c8, fibre: 0xebdfc0, fibre2: 0xdcc9a1, leaf: 0x5f9145, leaf2: 0x77a852, stem: 0x7d9a52, soil: 0x6b4a33, wood: 0x6b4a30, bamboo: 0xc4a46a };
const pattern = (x, z) => M.tnalak(x, z);

function abaca(s, dx, dz, h) {
  s.vox(shape((v) => v.cyl(0, 0, 0, h, 1.3, (x, y, z) => pickH(TN.stem, 0x6c8a47, x, y, z))), dx, 1, dz);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7]];
  dirs.forEach(([ax, az], k) => {
    const len = Math.round(h * 0.65) + (k % 2);
    for (let i = 1; i <= len; i++) {
      const y = h + 1 + Math.round(Math.sin((i / len) * Math.PI * 0.9) * 3) - Math.max(0, i - Math.round(len * 0.6));
      const width = i < len - 1 ? 1 : 0;
      for (let w = -width; w <= width; w++) {
        const x = dx + Math.round(ax * i - az * w), z = dz + Math.round(az * i + ax * w);
        s.put(x, y, z, w === 0 ? TN.leaf2 : TN.leaf, { a: 'sway' });
      }
    }
  });
}

const tnalak = [
  // 1 the abaca plant
  () => {
    const s = new Stage();
    s.vox(shape((v) => v.ellipsoid(0, 0, 0, 9, 1.4, 7, TN.soil, true)));
    abaca(s, 0, 0, 12); abaca(s, 6, -3, 8); abaca(s, -6, 3, 5);
    return s.done();
  },
  // 2 stripping the fibre
  () => {
    const s = new Stage();
    s.vox(shape((v) => v.box(-10, 0, -4, 4, 1, -3, (x, y, z) => pickH(TN.stem, 0x6c8a47, x, y, z))));
    s.vox(shape((v) => v.box(-3, 0, 2, 3, 3, 4, TN.wood)));
    s.vox(shape((v) => v.box(-2, 4, 3, 2, 4, 3, 0x9aa1a8)));
    s.vox(shape((v) => { v.box(-10, 0, 0, -10, 12, 0, TN.bamboo); v.box(10, 0, 0, 10, 12, 0, TN.bamboo); v.box(-10, 12, 0, 10, 12, 0, TN.bamboo); }));
    for (let x = -9; x <= 9; x++) {
      const len = 6 + Math.floor(hash3(x, 1, 1) * 4);
      for (let y = 11; y >= 11 - len; y--) s.put(x, y, 0, x % 2 ? TN.fibre : TN.fibre2, { a: 'sway' });
    }
    return s.done();
  },
  // 3 tying the design into the warp
  () => {
    const s = new Stage();
    s.vox(shape((v) => {
      for (const [x, z] of [[-9, -11], [9, -11], [-9, 11], [9, 11]]) v.box(x, 0, z, x, 4, z, TN.wood);
      v.box(-9, 4, -11, -9, 4, 11, TN.wood); v.box(9, 4, -11, 9, 4, 11, TN.wood);
      v.box(-9, 5, -11, 9, 5, -11, TN.wood); v.box(-9, 5, 11, 9, 5, 11, TN.wood);
    }));
    for (let x = -8; x <= 8; x++) for (let z = -10; z <= 10; z++) {
      s.put(x, 5, z, TN.fibre);
      if (pattern(x, z) !== TN.dark) s.put(x, 6, z, 0x4a3424);
    }
    return s.done();
  },
  // 4 dyeing in the pot
  () => {
    const s = new Stage();
    s.vox(shape((v) => v.ring(0, 0, 0, 1, 5, 1.2, 0x8c8478)), -4, 0, 0);
    s.vox(shape((v) => v.cyl(0, 0, 0, 2, 3.4, (x, y, z) => [0xe8783c, 0xf2b648, 0xc8432f][Math.floor(hash3(x, y, z) * 3)])), -4, 0, 0, { a: 'fire' });
    s.vox(shape((v) => v.lathe(0, 0, 0, [3, 4, 5, 5.5, 5.5, 5, 4.5], 0x8c4a34, 1)), -4, 3, 0);
    s.vox(shape((v) => v.cyl(0, 0, 0, 0, 3.6, 0x1e1612)), -4, 8, 0);
    s.vox(shape((v) => { v.box(5, 0, 0, 5, 11, 0, TN.bamboo); v.box(13, 0, 0, 13, 11, 0, TN.bamboo); v.box(5, 11, 0, 13, 11, 0, TN.bamboo); }));
    for (const [x, c] of [[6, 0x8e2f22], [7, 0x8e2f22], [9, 0x2b211c], [10, 0x2b211c], [12, TN.fibre]]) for (let y = 4; y <= 10; y++) s.put(x, y, 0, c, { a: 'sway' });
    return s.done();
  },
  // 5 weaving on the backstrap loom: the cloth grows as you scroll
  () => {
    const s = new Stage();
    s.vox(M.personSitting(M.COSTUMES.tboli(5)), 0, 0, -2);
    s.vox(shape((v) => { v.box(-6, 5, 3, 6, 5, 3, TN.wood); v.box(-1, 0, 22, 1, 12, 22, TN.wood); v.box(-6, 11, 21, 6, 11, 21, TN.wood); }));
    for (let z = 4; z <= 20; z++) {
      const y = 5 + Math.round(((z - 4) / 16) * 6);
      const f = (z - 4) / 16;
      for (let x = -5; x <= 5; x++) {
        if (z <= 16) s.put(x, y, z, pattern(x, z), { o: 0.05 + f * 0.9 });
        if (x % 2 === 0) s.put(x, y + 1, z, TN.fibre, z <= 16 ? { u: 0.05 + f * 0.9 } : undefined);
      }
    }
    s.put(0, 7, 5, TN.wood, { a: 'slide' });
    return s.done();
  },
  // 6 burnishing with a cowrie shell
  () => {
    const s = new Stage();
    s.vox(shape((v) => v.box(-9, 0, -7, 9, 1, 7, TN.wood)));
    for (let x = -8; x <= 8; x++) for (let z = -6; z <= 6; z++) s.put(x, 2, z, pattern(x, z), { a: 'glint' });
    s.vox(shape((v) => v.ellipsoid(0, 0, 0, 2, 1, 1.4, (x, y, z) => (hash3(x, y, z) > 0.7 ? 0x8a6a4a : 0xf1e6cc))), 0, 3, 0, { a: 'slide' });
    return s.done();
  },
  // 7 the finished cloth
  () => {
    const s = new Stage();
    s.vox(shape((v) => { v.box(-9, 0, 0, -9, 17, 0, TN.bamboo); v.box(9, 0, 0, 9, 17, 0, TN.bamboo); v.box(-9, 17, 0, 9, 17, 0, TN.bamboo); }));
    for (let x = -8; x <= 8; x++) for (let y = 3; y <= 16; y++) s.put(x, y, 0, pattern(x, y));
    s.vox(M.person(M.COSTUMES.tboli(8)), 12, 0, 2);
    for (let k = 0; k < 4; k++) s.vox(shape((v) => v.box(-15, k, -2, -11, k, 2, k % 2 ? TN.red : TN.dark)));
    return s.done();
  },
];

// ------------------------------------------------------------------ burnay
const BN = { clay: 0x9a4a32, clay2: 0xa85a3e, wet: 0x7e3c2a, sand: 0xd8c39a, soil: 0x6b4a33, grass: 0x6e9a54, wood: 0x6b4a30, brick: 0x9a5a42, brick2: 0x7d4a37, raw: 0xc29a74, raw2: 0xd0ab84, fired: 0x5a3a2a, fired2: 0x6e4632 };
const jarShape = (r = 1, colour = BN.fired) => {
  const radii = [3, 4, 5, 5.5, 6, 6, 6, 5.5, 5, 4.2, 3.5, 3, 3.4].map((x) => x * r);
  return shape((v) => v.lathe(0, 0, 0, radii, typeof colour === 'function' ? colour : (x, y, z) => (y === 4 || y === 8 ? 0x4a2f22 : pickH(colour, colour === BN.fired ? BN.fired2 : BN.raw2, x, y, z)), 1));
};

const burnay = [
  // 1 clay and sand
  () => {
    const s = new Stage();
    s.vox(shape((v) => v.box(-13, 0, -9, 13, 1, 9, (x, y, z) => (y === 1 && (Math.abs(x) > 11 || Math.abs(z) > 7) ? BN.grass : BN.soil))));
    s.vox(shape((v) => v.ellipsoid(0, 0, 0, 5.5, 4.5, 5, (x, y, z) => pickH(BN.clay, BN.clay2, x, y, z), true)), -4, 2, 1);
    s.vox(shape((v) => v.ellipsoid(0, 0, 0, 4, 3, 3.5, (x, y, z) => pickH(BN.sand, 0xcbb489, x, y, z), true)), 7, 2, -3);
    s.vox(shape((v) => { v.line(3, 2, 5, 8, 10, 1, BN.wood); v.box(2, 2, 5, 3, 3, 6, 0x9aa1a8); }));
    return s.done();
  },
  // 2 a carabao treads the clay
  () => {
    const s = new Stage();
    s.vox(shape((v) => v.ring(0, 0, 0, 1, 10, 1.2, BN.soil)));
    s.vox(shape((v) => v.cyl(0, 0, 0, 0, 9, (x, y, z) => pickH(BN.wet, BN.clay, x, y, z))));
    s.vox(M.carabao().turned(0), 6, 1, 0, { a: 'orbit' });
    s.vox(M.person(M.COSTUMES.farmer(3)), -13, 0, 0);
    s.vox(shape((v) => v.ellipsoid(0, 0, 0, 3, 2.5, 3, BN.sand, true)), 13, 0, 0);
    return s.done();
  },
  // 3 thrown on the kick wheel: the jar rises as you scroll
  () => {
    const s = new Stage();
    s.vox(shape((v) => { v.cyl(0, 0, 0, 1, 5, BN.wood); v.box(0, 2, 0, 0, 6, 0, 0x4a3424); v.cyl(0, 0, 7, 7, 3.5, 0x8a6a4a); }));
    s.vox(M.personSitting(M.COSTUMES.farmer(9)), 0, 0, -11);
    const radii = [2, 2.6, 3.2, 3.6, 3.8, 3.8, 3.6, 3.2, 2.6, 2.1, 2.3];
    radii.forEach((r, i) => s.vox(shape((v) => v.lathe(0, 0, 0, [r], (x, y, z) => pickH(BN.raw, BN.raw2, x, i, z), 0)), 0, 8 + i, 0, { o: 0.06 + (i / radii.length) * 0.86 }));
    return s.done();
  },
  // 4 drying in the shade
  () => {
    const s = new Stage();
    for (const [x, z] of [[-12, -7], [12, -7], [-12, 7], [12, 7]]) s.vox(shape((v) => v.box(x, 0, z, x, 11, z, BN.wood)));
    s.vox(shape((v) => v.box(-13, 12, -8, 13, 12, 8, (x, y, z) => ((x + z) % 2 ? 0x9c8250 : 0x7c6743))));
    [[-7, -3], [0, -3], [7, -3], [-7, 4], [0, 4], [7, 4]].forEach(([x, z], k) => s.vox(jarShape(0.62, BN.raw), x, 0, z));
    return s.done();
  },
  // 5 a day and a night of fire in the long brick kiln
  () => {
    const s = new Stage();
    for (let k = 0; k < 6; k++) {
      const x0 = -15 + k * 5, base = k;
      s.vox(shape((v) => v.box(x0, 0, -4, x0 + 4, base + 6, 4, (x, y, z) => {
        if (y > base + 5 && Math.abs(z) > 2) return null;
        return (x + y) % 3 === 0 ? BN.brick2 : BN.brick;
      })));
      s.vox(shape((v) => v.box(x0 + 1, base + 1, 5, x0 + 2, base + 2, 5, (x, y, z) => [0xe8783c, 0xf2b648][(x + y) % 2])), 0, 0, 0, { a: 'fire' });
    }
    s.vox(shape((v) => v.box(14, 0, -2, 16, 13, 2, BN.brick2)));
    for (let k = 0; k < 6; k++) s.put(15, 14 + k, 0, 0xd9d3c8, { a: 'rise' });
    for (let k = 0; k < 5; k++) s.vox(shape((v) => v.box(-18, k, -3 + (k % 2), -17, k, 3, BN.wood)));
    return s.done();
  },
  // 6 jars for basi, bagoong and salt
  () => {
    const s = new Stage();
    s.vox(jarShape(1), -8, 0, 0);
    s.vox(shape((v) => { v.cyl(0, 0, 0, 0, 3.6, 0xefe4c8); v.ring(0, 0, 0, 0, 3.6, 1, 0x9a3324); }), -8, 13, 0);
    s.vox(jarShape(0.8), 3, 0, -3);
    s.vox(shape((v) => v.cyl(0, 0, 0, 0, 2.6, 0x4a2a2a)), 3, 10, -3);
    s.vox(jarShape(0.6), 10, 0, 4);
    s.vox(shape((v) => v.cyl(0, 0, 0, 0, 1.8, 0xf2eee6)), 10, 8, 4);
    s.vox(jarShape(0.5), 1, 0, 8);
    return s.done();
  },
];

// ------------------------------------------------------------------ pahiyas
const KP = [0xd9584a, 0xe8b23c, 0x5bae8c, 0xe57fa0, 0xf2e6c8, 0x8cc152, 0x4f86c6];
const leafShape = (v, cx, cy, cz, c, flat = true) => {
  for (let i = -3; i <= 3; i++) {
    const w = i === -3 || i === 3 ? 0 : 1;
    for (let k = -w; k <= w; k++) flat ? v.set(cx + i, cy, cz + k, c) : v.set(cx + k, cy + i, cz, c);
  }
};
function plainHouse(s) {
  s.vox(shape((v) => {
    v.box(-6, 0, -5, 6, 10, 4, (x, y) => (y < 4 ? 0xe4dac6 : 0x6b4a30));
    v.box(-1, 0, 4, 1, 3, 4, 0x4a3424);
    for (let i = 0; i <= 5; i++) v.box(-7 + i, 11 + i, -6 + i, 7 - i, 11 + i, 5 - i, i % 2 ? 0x9c8250 : 0x7c6743);
  }));
}

const pahiyas = [
  // 1 the harvest
  () => {
    const s = new Stage();
    s.vox(shape((v) => v.box(-13, 0, -9, 13, 0, 9, 0x6b4a33)));
    for (let x = -12; x <= 12; x++) for (let z = -8; z <= 8; z++) {
      if ((x + z) % 2) continue;
      const h = 2 + Math.floor(hash3(x, 0, z) * 2);
      for (let y = 1; y <= h; y++) s.put(x, y, z, y === h ? 0xe2bf55 : 0xc9a84a, { a: 'sway' });
    }
    s.vox(M.person(M.COSTUMES.farmer(4)), -4, 1, 3);
    for (let k = 0; k < 3; k++) s.vox(shape((v) => v.box(7 + k * 3, 1, -6, 8 + k * 3, 3, -5, 0xe9dfc6)));
    return s.done();
  },
  // 2 rice ground into paste
  () => {
    const s = new Stage();
    s.vox(shape((v) => { v.box(-3, 0, -3, 3, 2, 3, 0x6b4a30); v.cyl(0, 0, 3, 4, 4.5, 0x8c8478); v.cyl(0, 0, 5, 6, 4.2, 0x9a9283); v.box(3, 7, 0, 3, 10, 0, 0x6b4a30); }));
    [[-10, -5, 0xf2eee6], [-10, 5, 0xe58aa0], [10, -5, 0xe8c24a], [10, 5, 0x8cc152]].forEach(([x, z, c]) => {
      s.vox(shape((v) => v.lathe(0, 0, 0, [2, 3, 3.5], 0x7b5a3a, 1)), x, 0, z);
      s.vox(shape((v) => v.cyl(0, 0, 0, 0, 2.6, c)), x, 2, z);
    });
    return s.done();
  },
  // 3 pressed onto kabal leaves, steamed and peeled
  () => {
    const s = new Stage();
    s.vox(shape((v) => { v.box(-12, 4, -7, 12, 4, 7, 0x6b4a30); for (const [x, z] of [[-11, -6], [11, -6], [-11, 6], [11, 6]]) v.box(x, 0, z, x, 3, z, 0x4a3424); }));
    const v = new Vox();
    [[-7, -3], [0, -3], [7, -3], [-7, 3], [0, 3], [7, 3]].forEach(([x, z], k) => { leafShape(v, x, 5, z, 0x4f8a3c); leafShape(v, x, 6, z, KP[k]); });
    s.vox(v);
    for (let k = 0; k < 5; k++) s.vox(shape((w) => leafShape(w, 0, 0, 0, KP[(k + 2) % KP.length])), 13, k, 0);
    return s.done();
  },
  // 4 dried in the sun
  () => {
    const s = new Stage();
    for (const z of [-5, 5]) {
      s.vox(shape((v) => { v.box(-12, 0, z, -12, 10, z, 0xc4a46a); v.box(12, 0, z, 12, 10, z, 0xc4a46a); v.box(-12, 10, z, 12, 10, z, 0xc4a46a); }));
      const v = new Vox();
      for (let k = 0; k < 6; k++) leafShape(v, -9 + k * 3.6 | 0, 6, z, KP[(k + (z > 0 ? 3 : 0)) % KP.length], false);
      s.vox(v, 0, 0, 0, { a: 'sway' });
    }
    return s.done();
  },
  // 5 the house is dressed: kiping climbs the walls as you scroll
  () => {
    const s = new Stage();
    plainHouse(s);
    for (let x = -7; x <= 7; x++) for (let y = 1; y <= 11; y++) {
      if (Math.abs(x) <= 1 && y <= 3) continue;
      s.put(x, y, 5, KP[Math.floor(hash3(x, y, 3) * KP.length)], { o: 0.05 + (y / 11) * 0.55 + hash3(x, y, 9) * 0.08 });
    }
    for (const ax of [-5, 5]) for (let k = 0; k < 4; k++) {
      const r = k === 3 ? 0 : 1;
      for (let x = ax - r; x <= ax + r; x++) for (let z = 7 - r; z <= 7 + r; z++) s.put(x, 10 - k * 2, z, KP[(k + 2) % KP.length], { o: 0.7 + k * 0.06 });
    }
    for (let x = -7; x <= 7; x += 2) s.put(x, 12, 6, 0xd0aa5f, { o: 0.92 });
    return s.done();
  },
  // 6 the procession passes
  () => {
    const s = new Stage();
    s.vox(shape((v) => v.box(-4, 1, -5, 4, 2, 5, (x, y, z) => KP[(x + z + 20) % 4])));
    for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) s.put(x, 0, z, 0x3b2b21);
    s.vox(M.person({ ...M.COSTUMES.farmer(50), hold: 'staff', hat: 'crown' }), 0, 3, 0);
    for (let k = 0; k < 4; k++) s.vox(M.person(M.COSTUMES.reveler(k + 2)), -12 + (k % 2) * 4, 0, -6 + Math.floor(k / 2) * 12);
    for (let k = 0; k < 2; k++) s.vox(M.person(M.COSTUMES.reveler(k + 9)), 9 + k * 4, 0, k ? 5 : -5);
    return s.done();
  },
];

export const STORIES = { tnalak, burnay, pahiyas };
