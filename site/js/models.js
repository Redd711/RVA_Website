// Voxel models: people in regional dress, animals, houses, boats and landmarks.
// Every model faces +z and stands on y = 0. Units are voxels; the world scales them down.
import { Vox, hash3 } from './voxel-kit.js';

export const C = {
  skin: [0x8a5a3c, 0xa06a47, 0x74492f, 0x95603f],
  hair: 0x231c19, eye: 0x1c1816, foot: 0x3b2b21,
  wood: 0x6b4a30, woodDark: 0x4a3424, bamboo: 0xc4a46a, bambooDark: 0xa98a52,
  thatch: 0x9c8250, thatchDark: 0x7c6743, straw: 0xd0aa5f,
  stone: 0xe4dac6, stoneDark: 0xcbbfa8, tile: 0xb4573b, tileDark: 0x96452f, capiz: 0xf3ecdc,
  clay: 0xa4492f, gold: 0xd9ae5f, cream: 0xf1e9d8, indigo: 0x26345a, ink: 0x2a2522,
  red: 0xc0462f, blue: 0x2f5d9e, teal: 0x3f8478, green: 0x5e9a5a, yellow: 0xe8b23c, pink: 0xd9768a, white: 0xf2eee6,
  leaf: 0x5e8f45, leafLight: 0x79a852, leafDark: 0x426e3a, pine: 0x3d6646, trunk: 0x6f5237,
  rock: 0x8c8478, rockDark: 0x6f665b, ash: 0xb9b2a6, sand: 0xe6d4a6, water: 0x5f9fb3, waterDeep: 0x3b6f8f,
  carabao: 0x4f4d50, carabaoBelly: 0x67645f, horn: 0xcdbf9f, horse: 0x7b4a2b, mane: 0x2e211a,
};

const pick = (arr, s) => arr[Math.floor(s * arr.length) % arr.length];

// ---------------------------------------------------------------- people
// o: { skin, top, bottom, skirt, arms: 'down'|'up'|'out', hat, face, hold, necklace, sash, seed }
// top / bottom may be a colour or fn(x, y, z) -> colour
export function person(o = {}) {
  const v = new Vox();
  const skin = o.skin ?? pick(C.skin, hash3(o.seed ?? 1, 3, 7));
  const top = o.top ?? C.cream;
  const bottom = o.bottom ?? C.indigo;
  const face = o.face ?? skin;
  // legs or skirt
  if (o.skirt) v.box(-1, 0, -1, 1, 3, 0, bottom);
  else {
    v.box(-1, 1, -1, -1, 3, 0, bottom);
    v.box(1, 1, -1, 1, 3, 0, bottom);
    v.box(-1, 0, -1, -1, 0, 0, C.foot);
    v.box(1, 0, -1, 1, 0, 0, C.foot);
  }
  v.box(-1, 4, -1, 1, 8, 0, top);
  if (o.sash) v.box(-1, 4, -1, 1, 4, 0, o.sash);
  // arms
  const arm = o.arms ?? 'down';
  const sleeve = o.sleeve ?? top;
  for (const s of [-2, 2]) {
    if (arm === 'down') { v.box(s, 7, -1, s, 8, -1, sleeve); v.box(s, 4, -1, s, 6, -1, skin); }
    else if (arm === 'up') { v.box(s, 8, -1, s, 9, -1, sleeve); v.box(s, 10, -1, s, 12, -1, skin); }
    else { v.box(s, 8, -1, s, 8, 0, sleeve); v.set(s + Math.sign(s), 8, 0, skin); v.set(s + Math.sign(s), 8, 1, skin); }
  }
  // head
  v.box(-1, 9, -1, 1, 11, 1, face);
  v.set(-1, 10, 1, o.face ? C.cream : C.eye);
  v.set(1, 10, 1, o.face ? C.cream : C.eye);
  v.box(-1, 11, -1, 1, 11, 1, C.hair);
  v.box(-1, 9, -1, 1, 10, -1, C.hair);
  if (o.necklace) for (let x = -1; x <= 1; x++) v.set(x, 8, 1, typeof o.necklace === 'function' ? o.necklace(x) : o.necklace);
  hat(v, o.hat, o);
  holdItem(v, o.hold, o);
  return v;
}

function hat(v, kind, o) {
  if (!kind) return;
  if (kind === 'salakot') {
    for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) if (Math.abs(x) + Math.abs(z) < 4) v.set(x, 12, z, C.straw);
    v.box(-1, 13, -1, 1, 13, 1, 0xbf9850);
    v.set(0, 14, 0, 0xa98545);
  } else if (kind === 'crown') {
    for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) if (x || z) v.set(x, 12, z, C.gold);
    v.set(-1, 13, 1, C.gold); v.set(1, 13, 1, C.gold); v.set(0, 13, -1, C.gold); v.set(0, 12, 1, C.blue);
  } else if (kind === 'feathers') {
    const cols = [C.red, C.white, C.ink, C.gold];
    for (let x = -3; x <= 3; x++) for (let y = 12; y <= 16; y++) {
      if (x * x + (y - 11) * (y - 11) * 0.55 > 13) continue;
      v.set(x, y, -1, cols[(Math.abs(x) + y) % 4]);
    }
    v.box(-1, 11, 1, 1, 11, 1, C.red);
  } else if (kind === 'tboli') {
    for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) {
      const d = x * x + z * z;
      if (d <= 9.5) v.set(x, 12, z, d > 6 ? C.red : C.ink);
    }
    for (const s of [-2, 2]) for (let y = 9; y <= 11; y++) v.set(s, y, 0, [C.red, C.white, C.yellow][y % 3]);
  } else if (kind === 'band') {
    for (let x = -1; x <= 1; x++) v.set(x, 11, 1, o.bandColor ?? C.red);
    v.set(-1, 11, 0, o.bandColor ?? C.red); v.set(1, 11, 0, o.bandColor ?? C.red);
  } else if (kind === 'veil') {
    v.box(-1, 12, -1, 1, 12, 1, o.veil ?? C.yellow);
    v.box(-1, 9, -2, 1, 12, -2, o.veil ?? C.yellow);
  } else if (kind === 'bun') {
    v.box(0, 11, -2, 0, 12, -2, C.hair);
  }
}

function holdItem(v, item) {
  if (!item) return;
  if (item === 'drum') {
    v.box(-1, 4, 1, 1, 6, 2, C.wood);
    v.box(-1, 7, 1, 1, 7, 2, C.cream);
  } else if (item === 'santo') {
    v.box(0, 13, -1, 0, 14, -1, C.red);
    v.set(0, 15, -1, C.skin[1]);
    v.set(0, 16, -1, C.gold);
  } else if (item === 'basket') {
    v.box(-1, 12, -1, 1, 12, 1, C.bamboo);
    v.set(-1, 13, 0, C.red); v.set(0, 13, 0, C.yellow); v.set(1, 13, 0, C.leafLight); v.set(0, 13, -1, C.clay);
  } else if (item === 'staff') {
    v.line(2, 0, 1, 2, 13, 1, C.wood);
  } else if (item === 'sickle') {
    v.set(2, 4, 0, C.wood); v.set(2, 4, 1, C.ash); v.set(2, 5, 2, C.ash);
  }
}

export function personSitting(o = {}) {
  const standing = person({ ...o, arms: 'out' });
  const v = new Vox();
  standing.each((x, y, z, c) => { if (y >= 4) v.set(x, y - 2, z, c); });
  const bottom = o.bottom ?? C.indigo;
  v.box(-1, 0, 0, 1, 1, 3, bottom);
  v.box(-1, 0, 4, 1, 0, 4, C.foot);
  return v;
}

const stripes = (a, b, every = 1) => (x, y) => (Math.floor(y / every) % 2 ? a : b);
const checks = (a, b) => (x, y, z) => ((x + y + z) % 2 ? a : b);

export const COSTUMES = {
  sinulog: (s) => ({ seed: s, top: (x, y) => (y === 8 || y === 4 ? C.gold : C.blue), bottom: (x, y, z) => ((x + z + y) % 2 ? C.gold : C.blue), skirt: true, hat: 'crown', sleeve: C.gold }),
  sinulogLead: (s) => ({ seed: s, top: (x, y) => (y >= 7 ? C.white : 0xb9c7dd), bottom: (x, y) => (y % 2 ? C.white : 0xb9c7dd), skirt: true, hat: 'crown', hold: 'santo' }),
  ati: (s) => ({ seed: s, face: C.ink, top: (x, y) => (y === 7 && x === 0 ? C.white : 0x3a2f2a), bottom: (x, y) => (y === 3 ? C.gold : y % 2 ? C.red : C.ink), skirt: true, hat: 'feathers', necklace: C.white, sleeve: 0x3a2f2a }),
  atiDrum: (s) => ({ ...COSTUMES.ati(s), hold: 'drum', arms: 'out' }),
  kadayawan: (s) => ({ seed: s, top: (x, y) => [C.red, C.yellow, C.blue, C.white][y % 4], bottom: C.red, skirt: true, hat: 'band', bandColor: C.yellow, necklace: (x) => [C.yellow, C.white, C.blue][x + 1], sleeve: C.blue }),
  tboli: (s) => ({ seed: s, top: (x, y) => (y === 6 || y === 7 ? C.red : C.ink), bottom: stripes(C.red, C.ink), skirt: true, hat: 'tboli', necklace: (x) => [C.red, C.white, C.yellow][x + 1], sleeve: C.ink }),
  ifugaoMan: (s) => ({ seed: s, top: (x, y, z) => (y === 4 ? C.red : C.skin[2]), bottom: stripes(C.red, C.ink), hat: 'band', sleeve: C.skin[2] }),
  ifugaoWoman: (s) => ({ seed: s, top: C.cream, bottom: stripes(C.red, C.ink), skirt: true, hat: 'bun' }),
  barong: (s) => ({ seed: s, top: (x, y) => (x === 0 && y > 4 ? 0xd9ceb5 : 0xece3cf), bottom: 0x2e2a28 }),
  saya: (s) => ({ seed: s, top: C.cream, sleeve: C.white, bottom: (x, y, z) => ((x + z) % 2 ? 0xc96f6a : 0xb45a58), skirt: true, hat: 'bun' }),
  farmer: (s) => ({ seed: s, top: checks(C.white, 0x9cb3cf), bottom: C.indigo, hat: 'salakot', hold: 'sickle' }),
  reveler: (s) => ({ seed: s, top: [C.yellow, C.clay, C.teal, C.pink][Math.floor(hash3(s, 2, 2) * 4)], bottom: C.indigo, hat: hash3(s, 1, 9) > 0.5 ? 'salakot' : 'basket', hold: hash3(s, 1, 9) > 0.5 ? null : null }),
  maranao: (s) => ({ seed: s, top: (x, y) => (y === 8 ? C.gold : C.teal), bottom: (x, y) => (y % 2 ? C.gold : C.green), skirt: true, hat: 'veil', veil: C.yellow }),
  fisher: (s) => ({ seed: s, top: C.white, bottom: C.indigo, hat: 'salakot' }),
};

// ---------------------------------------------------------------- animals
export function carabao() {
  const v = new Vox();
  for (const [x, z] of [[-2, -3], [2, -3], [-2, 3], [2, 3]]) v.box(x, 0, z, x, 2, z, C.carabao);
  v.ellipsoid(0, 4, 0, 2.6, 1.8, 4.4, (x, y) => (y <= 3 ? C.carabaoBelly : C.carabao));
  v.box(-1, 2, 5, 1, 4, 7, C.carabao);
  v.box(-1, 2, 7, 1, 2, 7, 0x3a3836);
  v.set(-1, 4, 7, C.eye); v.set(1, 4, 7, C.eye);
  for (const s of [-1, 1]) { v.line(s * 2, 5, 5, s * 4, 5, 5, C.horn); v.line(s * 4, 5, 5, s * 5, 6, 4, C.horn); v.set(s * 5, 7, 3, C.horn); }
  v.box(0, 3, -5, 0, 4, -5, C.carabao);
  return v;
}

export function horse() {
  const v = new Vox();
  for (const [x, z] of [[-1, -2], [1, -2], [-1, 2], [1, 2]]) v.box(x, 0, z, x, 3, z, C.horse);
  v.box(-1, 4, -3, 1, 5, 3, C.horse);
  v.box(-1, 5, 3, 1, 8, 4, C.horse);
  v.box(-1, 7, 5, 1, 8, 6, C.horse);
  v.box(0, 6, 2, 0, 9, 3, C.mane);
  v.box(0, 3, -4, 0, 5, -4, C.mane);
  return v;
}

export function calesa() {
  const v = horse();
  // shafts, two big wheels, a red carriage with a cream canopy
  v.line(-2, 4, 2, -2, 4, -4, C.woodDark); v.line(2, 4, 2, 2, 4, -4, C.woodDark);
  for (const s of [-4, 4]) for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2;
    v.set(s, Math.round(3 + Math.sin(t) * 3), Math.round(-8 + Math.cos(t) * 3), C.woodDark);
  }
  v.box(-3, 3, -11, 3, 6, -5, (x, y) => (y === 6 ? C.gold : C.tile));
  v.box(-3, 10, -11, 3, 10, -6, C.cream);
  for (const [x, z] of [[-3, -11], [3, -11], [-3, -6], [3, -6]]) v.box(x, 7, z, x, 9, z, C.woodDark);
  return v;
}

export function eagle(pose = 0) {
  const v = new Vox();
  v.box(-1, 0, -2, 1, 1, 3, 0x5a3c22);
  v.box(-1, 0, 4, 1, 2, 5, C.cream);
  v.set(0, 1, 6, 0x6f7a86); v.set(0, 0, 6, 0x6f7a86);
  v.box(0, 3, 4, 0, 3, 4, C.cream);
  v.box(-2, 0, -5, 2, 0, -3, 0x4a311c);
  const lift = pose ? 1 : 0;
  for (let i = 2; i <= 8; i++) {
    const y = 1 + (pose ? Math.floor((i - 1) / 3) : 0) - (pose ? 0 : Math.floor(i / 6));
    for (const s of [-1, 1]) {
      v.box(s * i, y, -1, s * i, y, 2 - (i > 6 ? 1 : 0), i > 6 ? 0x2f2117 : 0x6b4a2c);
    }
  }
  if (lift) v.set(0, 2, 0, 0x5a3c22);
  return v;
}

export function bird() {
  const v = new Vox();
  v.set(0, 0, 0, C.white); v.set(-1, 1, 0, C.white); v.set(1, 1, 0, C.white); v.set(-2, 1, -1, 0xdedad0); v.set(2, 1, -1, 0xdedad0);
  return v;
}

export function whaleShark() {
  const v = new Vox();
  for (let z = -9; z <= 9; z++) {
    const t = (z + 9) / 18;
    const r = 2.8 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08));
    for (let x = -3; x <= 3; x++) for (let y = -2; y <= 2; y++) {
      if ((x * x) / (r * r + 0.01) + (y * y) / (r * r * 0.5 + 0.01) > 1) continue;
      const spot = y >= 0 && hash3(x, y, z) > 0.78;
      v.set(x, y, z, y < 0 ? 0xc9d3d8 : spot ? C.white : 0x3f566a);
    }
  }
  v.box(0, 3, -2, 0, 5, 0, 0x34495b);
  v.box(0, -2, -13, 0, 3, -10, 0x34495b);
  return v;
}

// ---------------------------------------------------------------- boats
export function vinta(sail = [C.red, C.yellow, C.green, C.blue, C.white]) {
  const v = new Vox();
  for (let z = -8; z <= 8; z++) {
    const w = Math.abs(z) > 6 ? 0 : 1;
    v.box(-w, 0, z, w, 1, z, (x, y) => (y === 1 ? [C.yellow, C.red, C.green][(z + 9) % 3] : C.woodDark));
  }
  v.set(0, 2, 8, C.red); v.set(0, 2, -8, C.red);
  for (const s of [-5, 5]) v.box(s, 1, -6, s, 1, 6, C.bamboo);
  for (const z of [-3, 3]) v.box(-5, 2, z, 5, 2, z, C.bamboo);
  v.box(0, 2, 1, 0, 15, 1, C.woodDark);
  for (let y = 3; y <= 14; y++) {
    const half = Math.round(5 - (y - 3) * 0.25);
    for (let z = 1 - half; z <= 1 + half; z++) v.set(1, y, z, sail[(z + 20) % sail.length]);
  }
  return v;
}

export function banca(hull = C.white, stripe = 0x3e6d9c) {
  const v = new Vox();
  for (let z = -6; z <= 6; z++) {
    const w = Math.abs(z) > 4 ? 0 : 1;
    v.box(-w, 0, z, w, 1, z, (x, y) => (y === 1 ? stripe : hull));
  }
  for (const s of [-4, 4]) v.box(s, 1, -5, s, 1, 5, C.bamboo);
  for (const z of [-2, 2]) v.box(-4, 2, z, 4, 2, z, C.bamboo);
  return v;
}

export function jeepney() {
  const v = new Vox();
  const body = (x, y, z) => (y === 5 ? 0xc9ced6 : y === 3 ? [C.red, C.yellow, C.blue][(z + 9) % 3] : y === 4 ? 0x3a4450 : 0xd8dce2);
  v.box(-2, 1, -6, 2, 5, 3, body);
  v.box(-2, 1, 4, 2, 3, 6, 0xc9ced6);
  v.box(-1, 4, 4, 1, 4, 4, 0x3a4450);
  v.set(0, 4, 6, 0xd8dce2); v.set(0, 5, 6, 0xd8dce2);
  v.box(-2, 6, -5, 2, 6, 2, (x, z) => 0xb7bdc6);
  for (const [x, z] of [[-2, -4], [2, -4], [-2, 4], [2, 4]]) v.box(x, 0, z, x, 1, z, 0x222222);
  return v;
}

// ---------------------------------------------------------------- buildings
export function nipaHut(seed = 1) {
  const v = new Vox();
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) v.box(x, 0, z, x, 2, z, C.bambooDark);
  v.box(-3, 3, -3, 3, 3, 3, C.bambooDark);
  v.box(-3, 4, -3, 3, 7, 3, (x, y, z) => (Math.abs(x) === 3 || Math.abs(z) === 3 ? ((x + z) % 2 ? C.bamboo : 0xb8975e) : null));
  v.box(-1, 5, 3, 0, 6, 3, null);
  v.box(-3, 5, 3, -3, 5, 3, null);
  for (let i = 0; i <= 5; i++) {
    const r = 5 - i;
    v.box(-r, 8 + i, -r, r, 8 + i, r, (x, y, z) => (Math.abs(x) === r || Math.abs(z) === r || i === 5 ? (i % 2 ? C.thatch : C.thatchDark) : null));
  }
  v.line(1, 0, 6, 1, 3, 4, C.bambooDark);
  if (hash3(seed, 4, 4) > 0.5) v.box(4, 0, -1, 4, 1, 1, C.bamboo);
  return v;
}

export function ifugaoHut() {
  const v = new Vox();
  for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { v.box(x, 0, z, x, 3, z, C.woodDark); v.box(x - 1, 3, z - 1, x + 1, 3, z + 1, 0x5d4632); }
  v.box(-3, 4, -3, 3, 6, 3, C.woodDark);
  for (let i = 0; i <= 7; i++) {
    const r = 6 - Math.floor(i * 0.85);
    v.box(-r, 6 + i, -r, r, 6 + i, r, (x, y, z) => (Math.abs(x) >= r - 0 || Math.abs(z) >= r || i === 7 ? (i % 2 ? 0x7a6a48 : 0x6a5b3c) : null));
  }
  return v;
}

export function bahayNaBato(seed = 1) {
  const v = new Vox();
  const wall = hash3(seed, 7, 1) > 0.5 ? C.stone : 0xe9d8bf;
  v.box(-5, 0, -3, 5, 4, 3, (x, y, z) => (hash3(x, y, z) > 0.9 ? 0xb8775c : wall));
  v.box(-1, 0, 3, 1, 2, 3, 0x4a3424);
  v.box(-5, 5, -3, 5, 8, 4, (x, y, z) => {
    if (z === 4 && y >= 6 && y <= 7 && x % 2 === 0) return (x + y) % 2 ? C.capiz : 0xe0d7c3;
    return y === 5 ? C.woodDark : C.wood;
  });
  for (let i = 0; i <= 3; i++) v.box(-6 + i, 9 + i, -4 + i, 6 - i, 9 + i, 5 - i, (x, y, z) => ((x + z) % 2 ? C.tile : C.tileDark));
  return v;
}

export function church() {
  const v = new Vox();
  v.box(-6, 0, -14, 6, 9, -1, (x, y, z) => (Math.abs(x) === 6 && y < 8 && z % 3 === 0 ? C.stoneDark : C.stone));
  for (let i = 0; i <= 5; i++) v.box(-7 + i, 10 + i, -15, 7 - i, 10 + i, -1, (x, y, z) => ((x + z) % 2 ? C.tile : C.tileDark));
  v.box(-7, 0, 0, 7, 13, 1, (x, y) => (y === 13 || y === 0 ? C.stoneDark : 0xddd0b4));
  for (let i = 0; i <= 4; i++) v.box(-5 + i, 14 + i, 0, 5 - i, 14 + i, 1, 0xddd0b4);
  v.box(-1, 0, 1, 1, 4, 1, 0x4a3424);
  v.set(0, 9, 1, 0x4a3424);
  v.box(8, 0, -4, 11, 18, 0, (x, y) => (y >= 15 && y <= 16 && x > 8 && x < 11 ? 0x4a3424 : C.stone));
  v.box(8, 19, -4, 11, 19, 0, C.tile);
  v.set(0, 20, 0, C.gold);
  return v;
}

const KIPING = [0xd9584a, 0xe8b23c, 0x5bae8c, 0xe57fa0, 0xf2e6c8, 0x8cc152, 0x4f86c6];
export function pahiyasHouse(seed = 1) {
  const v = new Vox();
  v.box(-5, 0, -4, 5, 9, 3, (x, y) => (y < 4 ? C.stone : C.wood));
  for (let i = 0; i <= 4; i++) v.box(-6 + i, 10 + i, -5 + i, 6 - i, 10 + i, 4 - i, i % 2 ? C.thatch : C.thatchDark);
  // the facade dressed in kiping, fruit and rice
  for (let x = -6; x <= 6; x++) for (let y = 1; y <= 10; y++) {
    if (Math.abs(x) <= 1 && y <= 3) { v.set(x, y, 4, 0x4a3424); continue; }
    const h = hash3(x + seed * 13, y, seed);
    v.set(x, y, 4, KIPING[Math.floor(h * KIPING.length)]);
    if (h > 0.82) v.set(x, y, 5, KIPING[Math.floor(hash3(y, x, seed) * KIPING.length)]);
  }
  // arangya chandeliers hanging from the eaves
  for (const ax of [-4, 4]) for (let k = 0; k < 4; k++) {
    const r = k === 3 ? 0 : 1;
    v.box(ax - r, 9 - k * 2, 6 - r, ax + r, 9 - k * 2, 6 + r, KIPING[(k + seed) % KIPING.length]);
  }
  // rice stalks along the roof edge
  for (let x = -6; x <= 6; x += 2) v.box(x, 10, 5, x, 11, 5, C.straw);
  return v;
}

export function torogan() {
  const v = new Vox();
  for (const x of [-4, -1, 2, 5]) for (const z of [-2, 2]) v.box(x, 0, z, x, 3, z, C.woodDark);
  v.box(-6, 4, -3, 6, 7, 3, 0x4a3a2c);
  // panolong: carved, painted beam ends that sweep upward
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) v.box(s * (6 + i), 4 + i, 3, s * (6 + i), 5 + i, 3, [C.red, C.yellow, C.green, C.red][i]);
  for (let i = 0; i <= 5; i++) v.box(-7 - Math.max(0, i - 3), 8 + i, -4 + i, 7 + Math.max(0, i - 3), 8 + i, 4 - i, i % 2 ? 0x3b3329 : 0x4b4136);
  return v;
}

export function longhouse() {
  const v = new Vox();
  for (const x of [-6, -2, 2, 6]) for (const z of [-2, 2]) v.box(x, 0, z, x, 2, z, C.bambooDark);
  v.box(-7, 3, -3, 7, 5, 3, (x, y, z) => (Math.abs(z) === 3 || Math.abs(x) === 7 ? C.bamboo : null));
  v.box(-7, 3, -3, 7, 3, 3, C.bambooDark);
  for (let i = 0; i <= 4; i++) v.box(-8, 6 + i, -4 + i, 8, 6 + i, 4 - i, i % 2 ? C.thatch : C.thatchDark);
  return v;
}

// ---------------------------------------------------------------- landmarks
export function terraces() {
  // a bowl of stepped paddies, like Batad: each ring a step higher than the one inside it
  const v = new Vox();
  for (let x = -13; x <= 13; x++) for (let z = -13; z <= 4; z++) {
    const d = Math.sqrt(x * x + z * z * 1.25);
    if (d > 13.5) continue;
    const h = Math.floor(d / 1.6);
    for (let y = 0; y <= h; y++) {
      const topFace = y === h;
      const wet = topFace && h % 3 === 1;
      v.set(x, y, z, topFace ? (wet ? 0x8fc0b8 : h % 2 ? 0x8db15a : 0xa3c06a) : 0x7d6b52);
    }
  }
  return v;
}

export function mayon() {
  const v = new Vox();
  const H = 30;
  for (let y = 0; y <= H; y++) {
    const r = 12 * Math.pow(1 - y / (H + 1), 1.35) + 0.6;
    for (let x = -13; x <= 13; x++) for (let z = -13; z <= 13; z++) {
      const d = Math.sqrt(x * x + z * z);
      if (d > r) continue;
      if (y >= H - 1 && d < 1.2) continue;
      const c = y < 5 ? (hash3(x, y, z) > 0.4 ? C.leaf : C.leafLight) : y < 9 ? 0x7d8a5a : y > H - 6 ? (hash3(x, y, z) > 0.5 ? C.ash : 0xa59e92) : (hash3(x, y, z) > 0.5 ? C.rock : C.rockDark);
      v.set(x, y, z, c);
    }
  }
  return v;
}

export function chocolateHill(seed = 1) {
  const v = new Vox();
  const rx = 3 + hash3(seed, 1, 1) * 1.5, ry = 3.5 + hash3(seed, 2, 2) * 1.5;
  v.ellipsoid(0, 0, 0, rx, ry, rx, (x, y, z) => (y <= 0 ? C.leaf : hash3(x, y, z + seed) > 0.5 ? 0x8b6a47 : 0x9a7650), true);
  return v;
}

export function jar(withLid = true) {
  const v = new Vox();
  const radii = [3, 4, 5, 5.5, 6, 6, 6, 5.5, 5, 4.5, 4, 4, 4.5];
  v.lathe(0, 0, 0, radii, (x, y, z) => (y === 6 || y === 9 ? 0x6e3b2a : (hash3(x, y, z) > 0.85 ? 0x8b5640 : 0xa8745a)));
  if (withLid) {
    v.lathe(0, 0, 13, [4.5, 3.5, 2], 0xa8745a);
    // the boat of souls on the lid
    v.box(-3, 16, 0, 3, 16, 0, 0x8b5640);
    v.box(-2, 17, 0, -2, 19, 0, 0x8b5640); v.box(2, 17, 0, 2, 19, 0, 0x8b5640);
  }
  return v;
}

export function kulintang() {
  const v = new Vox();
  v.box(-9, 0, -1, 9, 2, 1, (x, y) => (y === 2 ? [C.red, C.yellow, C.green][(x + 12) % 3] : C.woodDark));
  for (let i = 0; i < 8; i++) {
    const x = -8 + i * 2 + (i > 3 ? 1 : 0);
    v.box(x, 3, -1, x + 1, 3, 0, 0xc9a24a);
    v.set(x, 4, 0, 0xb08a3a);
  }
  return v;
}

export function palm(seed = 1) {
  const v = new Vox();
  const lean = hash3(seed, 5, 5) > 0.5 ? 1 : -1;
  for (let y = 0; y <= 8; y++) v.set(y > 5 ? lean : 0, y, 0, C.trunk);
  const tx = lean, ty = 9;
  v.set(tx, ty, 0, C.leafDark);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) {
    for (let i = 1; i <= 3; i++) v.set(tx + dx * i, ty - (i === 3 ? 1 : 0), dz * i, i === 3 ? C.leafLight : C.leaf);
  }
  v.set(tx, ty - 1, 1, 0x6b4b2a);
  return v;
}

export function roundTree(seed = 1) {
  const v = new Vox();
  v.box(0, 0, 0, 0, 2, 0, C.trunk);
  const r = 1.6 + hash3(seed, 9, 9) * 0.8;
  v.ellipsoid(0, 4, 0, r, r * 0.9, r, (x, y, z) => (hash3(x + seed, y, z) > 0.5 ? C.leaf : C.leafDark));
  return v;
}

export function pine(seed = 1) {
  const v = new Vox();
  v.box(0, 0, 0, 0, 1, 0, C.trunk);
  for (let i = 0; i < 5; i++) {
    const r = 2.2 - i * 0.45;
    v.cyl(0, 0, 2 + i, 2 + i, Math.max(0.4, r), (x, y, z) => (hash3(x, y + seed, z) > 0.5 ? C.pine : 0x355a3e));
  }
  v.set(0, 7, 0, C.pine);
  return v;
}

export function cloud(seed = 1) {
  const v = new Vox();
  const n = 4 + Math.floor(hash3(seed, 3, 3) * 4);
  for (let i = 0; i < n; i++) {
    const x = Math.floor((hash3(seed, i, 1) - 0.5) * 12), z = Math.floor((hash3(seed, i, 2) - 0.5) * 6);
    const r = 2 + hash3(seed, i, 3) * 2.5;
    v.ellipsoid(x, 0, z, r, r * 0.55, r * 0.8, (xx, yy) => (yy < 0 ? 0xe8e2d6 : 0xfbf8f1));
  }
  return v;
}

export function puff() {
  const v = new Vox();
  v.box(-1, -1, -1, 1, 1, 1, (x, y, z) => (Math.abs(x) + Math.abs(y) + Math.abs(z) === 3 ? null : 0xd9d3c8));
  return v;
}

export function loomWithCloth() {
  const v = new Vox();
  v.box(-4, 0, 0, 4, 0, 0, C.woodDark);
  v.box(-4, 6, 9, 4, 6, 9, C.woodDark);
  v.box(-5, 0, 10, -5, 7, 10, C.woodDark); v.box(5, 0, 10, 5, 7, 10, C.woodDark);
  for (let z = 1; z <= 8; z++) {
    const y = Math.round((z / 9) * 5);
    for (let x = -3; x <= 3; x++) v.set(x, y, z, tnalak(x, z));
  }
  return v;
}

// the explore marker: a voxel exclamation mark, white so each island group can tint it
export function exclaim() {
  const v = new Vox();
  for (let y = 5; y <= 15; y++) {
    const w = y >= 13 ? 2 : 1;
    for (let x = -w; x <= w; x++) for (let z = -w; z <= w; z++) v.set(x, y, z, x === -w && z === w ? 0xffffff : 0xe2e2e2);
  }
  v.box(-1, 0, -1, 1, 2, 1, 0xe2e2e2);
  v.set(-1, 2, 1, 0xffffff);
  return v;
}

// t'nalak: dark ground with cream and red diamonds
export function tnalak(x, z) {
  const d = (Math.abs(((x + 40) % 6) - 3) + Math.abs(((z + 40) % 6) - 3));
  return d === 3 ? C.cream : d === 1 ? C.red : 0x3a2a22;
}
