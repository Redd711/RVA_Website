// Voxel toolkit shared by the world map and the story lifecycles.
// Build a model in a Vox (integer grid, one colour per cell), then mesh it: only faces that touch
// air are kept, so a 2,000-voxel model becomes a few thousand triangles in one draw call.
import * as THREE from './vendor/three.module.min.js';

export { THREE };

// Seeded random (mulberry32): the same seed always builds the same world, which HyperFrames needs.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const OFF = 512;
const key = (x, y, z) => (x + OFF) + (y + OFF) * 1024 + (z + OFF) * 1048576;

export class Vox {
  constructor() { this.m = new Map(); }
  set(x, y, z, c) {
    if (c == null) this.m.delete(key(x, y, z));
    else this.m.set(key(x, y, z), c);
    return this;
  }
  has(x, y, z) { return this.m.has(key(x, y, z)); }
  get(x, y, z) { return this.m.get(key(x, y, z)); }
  get size() { return this.m.size; }
  // c: a hex colour, or fn(x, y, z) returning a colour or null (null leaves the cell empty)
  paint(x, y, z, c) { this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); }
  box(x0, y0, z0, x1, y1, z1, c) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) this.paint(x, y, z, c);
    return this;
  }
  // vertical cylinder of radius r (in cells), from y0 to y1
  cyl(cx, cz, y0, y1, r, c) {
    const R = Math.ceil(r);
    for (let y = y0; y <= y1; y++)
      for (let x = -R; x <= R; x++)
        for (let z = -R; z <= R; z++) if (x * x + z * z <= r * r + 0.3) this.paint(cx + x, y, cz + z, c);
    return this;
  }
  // ring (hollow cylinder) for wheels and rims
  ring(cx, cz, y0, y1, r, t, c) {
    const R = Math.ceil(r);
    for (let y = y0; y <= y1; y++)
      for (let x = -R; x <= R; x++)
        for (let z = -R; z <= R; z++) {
          const d = Math.sqrt(x * x + z * z);
          if (d <= r + 0.5 && d >= r - t + 0.5) this.paint(cx + x, y, cz + z, c);
        }
    return this;
  }
  ellipsoid(cx, cy, cz, rx, ry, rz, c, onlyTop = false) {
    for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++)
      for (let y = onlyTop ? 0 : -Math.ceil(ry); y <= Math.ceil(ry); y++)
        for (let z = -Math.ceil(rz); z <= Math.ceil(rz); z++)
          if ((x * x) / (rx * rx) + (y * y) / (ry * ry) + (z * z) / (rz * rz) <= 1.02) this.paint(cx + x, cy + y, cz + z, c);
    return this;
  }
  // radius per row, bottom to top (a pot, a volcano, a tree)
  lathe(cx, cz, y0, radii, c, hollowFrom = Infinity, wall = 1) {
    radii.forEach((r, i) => {
      const y = y0 + i;
      const R = Math.ceil(r);
      for (let x = -R; x <= R; x++)
        for (let z = -R; z <= R; z++) {
          const d = Math.sqrt(x * x + z * z);
          if (d > r + 0.35) continue;
          if (i >= hollowFrom && d < r - wall + 0.35) continue;
          this.paint(cx + x, y, cz + z, c);
        }
    });
    return this;
  }
  // straight line of voxels (bresenham in 3D, good enough for poles and ropes)
  line(x0, y0, z0, x1, y1, z1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), 1);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      this.paint(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), Math.round(z0 + (z1 - z0) * t), c);
    }
    return this;
  }
  add(other, dx = 0, dy = 0, dz = 0, mirrorX = false) {
    other.each((x, y, z, c) => this.set((mirrorX ? -x : x) + dx, y + dy, z + dz, c));
    return this;
  }
  // rotate a quarter turn around Y, n times
  turned(n = 1) {
    const out = new Vox();
    this.each((x, y, z, c) => {
      let a = x, b = z;
      for (let i = 0; i < ((n % 4) + 4) % 4; i++) [a, b] = [-b, a];
      out.set(a, y, b, c);
    });
    return out;
  }
  each(fn) {
    for (const [k, c] of this.m) {
      const x = (k % 1024) - OFF;
      const y = (Math.floor(k / 1024) % 1024) - OFF;
      const z = Math.floor(k / 1048576) - OFF;
      fn(x, y, z, c);
    }
  }
  list() {
    const out = [];
    this.each((x, y, z, c) => out.push({ x, y, z, c }));
    return out;
  }
  bounds() {
    const b = { x0: Infinity, y0: Infinity, z0: Infinity, x1: -Infinity, y1: -Infinity, z1: -Infinity };
    this.each((x, y, z) => {
      b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.z0 = Math.min(b.z0, z);
      b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y); b.z1 = Math.max(b.z1, z);
    });
    return b;
  }
}

// face: normal, 4 corners in counter-clockwise order seen from outside
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { n: [0, 1, 0], c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], c: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },
  { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
];
const tmp = new THREE.Color();

// Mesh a Vox. Origin: x and z centred on the model, y = 0 at the lowest voxel.
// size: world units per voxel. jitter: per-voxel brightness noise, the hand-made look.
export function meshVox(vox, { size = 1, jitter = 0.07, centre = true, bottom = true } = {}) {
  const b = vox.bounds();
  const ox = centre ? (b.x0 + b.x1 + 1) / 2 : 0;
  const oz = centre ? (b.z0 + b.z1 + 1) / 2 : 0;
  const oy = bottom ? b.y0 : 0;
  const pos = [], nor = [], col = [], idx = [];
  vox.each((x, y, z, c) => {
    const j = 1 + (hash3(x, y, z) - 0.5) * jitter;
    tmp.setHex(c);
    const r = tmp.r * j, g = tmp.g * j, bl = tmp.b * j;
    for (const f of FACES) {
      if (vox.has(x + f.n[0], y + f.n[1], z + f.n[2])) continue;
      const base = pos.length / 3;
      // bottoms and sides a touch darker: reads as ambient occlusion without a second pass
      const s = f.n[1] === 1 ? 1 : f.n[1] === -1 ? 0.62 : 0.86;
      for (const k of f.c) {
        pos.push((x + k[0] - ox) * size, (y + k[1] - oy) * size, (z + k[2] - oz) * size);
        nor.push(f.n[0], f.n[1], f.n[2]);
        col.push(r * s, g * s, bl * s);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}
