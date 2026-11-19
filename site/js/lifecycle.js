// The story lifecycle stage: one pool of voxels that flies into the shape of each step.
// A stage is a list of voxels { x, y, z, c, o?, u?, a? }:
//   o  appears once the step's scroll progress passes o (a cloth weaving row by row)
//   u  disappears once progress passes u (warp threads used up by the weave)
//   a  a small loop: 'fire', 'orbit', 'slide', 'glint', 'rise', 'sway'
import { THREE, Vox, meshVox, hash3 } from './voxel-kit.js';

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// centre a model on x/z and stand it on y = 0, sorted bottom-up so stages build from the ground
export function normalise(list) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const v of list) { x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
  const cx = Math.round((x0 + x1) / 2), cz = Math.round((z0 + z1) / 2);
  const out = list.map((v) => ({ ...v, x: v.x - cx, y: v.y - y0, z: v.z - cz }));
  out.sort((a, b) => a.y - b.y || a.x - b.x || a.z - b.z);
  out.bounds = { r: Math.max(x1 - x0, z1 - z0) / 2 + 1, h: y1 - y0 + 1 };
  return out;
}

export async function mountCycle(canvas, stages) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, 0.5, 600);
  scene.add(new THREE.HemisphereLight(0xc9d6f0, 0x5b4a33, 1.15));
  const sun = new THREE.DirectionalLight(0xffd9a8, 2.4);
  sun.position.set(-22, 40, 26);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 });
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  // the banig mat the scene stands on
  const mat = new Vox();
  for (let x = -18; x <= 18; x++) for (let z = -18; z <= 18; z++) {
    if (x * x + z * z > 18.5 * 18.5) continue;
    const edge = x * x + z * z > 16.5 * 16.5;
    const over = (Math.floor(x / 2) + Math.floor(z / 2)) % 2 === 0;
    mat.set(x, 0, z, edge ? 0xa4492f : over ? 0xe7d6ae : 0xd2b47c);
  }
  const ground = new THREE.Mesh(meshVox(mat, { size: 1, jitter: 0.05 }), new THREE.MeshLambertMaterial({ vertexColors: true }));
  ground.position.y = -1;
  ground.receiveShadow = true;
  scene.add(ground);

  const N = Math.max(...stages.map((s) => s.length));
  const box = new THREE.BoxGeometry(0.97, 0.97, 0.97);
  const mesh = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial(), N);
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  // per voxel: where it is now, and where it was when the current change began
  const cur = { p: new Float32Array(N * 3), c: new Float32Array(N * 3), s: new Float32Array(N) };
  const from = { p: new Float32Array(N * 3), c: new Float32Array(N * 3), s: new Float32Array(N) };
  const colours = stages.map((st) => st.map((v) => new THREE.Color(v.c)));
  for (let i = 0; i < N; i++) { cur.p[i * 3 + 1] = -2; }

  // progress eases toward goal; yaw eases toward yawGoal, which drags and flicks (spin) move
  const state = { stage: -1, progress: 0, goal: 0, t: 0, t0: 0, yaw: 0.6, yawGoal: 0.6, spin: 0, dragging: false, camR: 40, camY: 10, w: 1, h: 1 };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), col = new THREE.Color();
  const want = { x: 0, y: 0, z: 0, s: 0, r: 0, g: 0, b: 0 };

  function desired(i, t) {
    const st = stages[state.stage], v = st[i];
    if (!v) { want.s = 0; return false; }
    const f = state.progress;
    let s = 1;
    if (v.o !== undefined) s *= smooth(v.o - 0.04, v.o, f);
    if (v.u !== undefined) s *= 1 - smooth(v.u - 0.04, v.u, f);
    let x = v.x, y = v.y, z = v.z;
    const base = colours[state.stage][i];
    let k = 1;
    switch (v.a) {
      case 'fire': y += Math.sin(t * 9 + i) * 0.18; k = 0.75 + 0.45 * Math.abs(Math.sin(t * 7 + i * 1.7)); break;
      case 'orbit': { const a = t * 0.55, ca = Math.cos(a), sa = Math.sin(a); const nx = x * ca - z * sa; z = x * sa + z * ca; x = nx; y += Math.abs(Math.sin(t * 4)) * 0.2; break; }
      case 'slide': x += Math.sin(t * 1.4) * 2.5; break;
      case 'glint': k = 1 + 0.7 * Math.pow(Math.max(0, Math.sin(t * 1.8 - (v.x + v.z) * 0.35)), 10); break;
      case 'rise': { const u = (t * 0.9 + i * 0.37) % 5; y += u * 1.6; s *= 1 - u / 5; break; }
      case 'sway': x += Math.sin(t * 1.3 + v.y * 0.25) * 0.03 * v.y; break;
    }
    want.x = x; want.y = y; want.z = z; want.s = s;
    want.r = base.r * k; want.g = base.g * k; want.b = base.b * k;
    return true;
  }

  function setStage(k) {
    if (k === state.stage) return;
    from.p.set(cur.p); from.c.set(cur.c); from.s.set(cur.s);
    state.stage = k; state.t0 = state.t;
    const b = stages[k].bounds;
    state.camR = Math.max(34, b.r * 3.7 + b.h * 1.1) * (state.w / state.h < 0.9 ? 1.25 : 1);
    state.camY = b.h * 0.42;
  }

  function update(dt) {
    const t = state.t;
    // the making follows the scroll through a short glide, so a notched wheel still builds it smoothly
    state.progress += (state.goal - state.progress) * (1 - Math.exp(-dt * 6));
    for (let i = 0; i < N; i++) {
      const has = desired(i, t);
      if (!has) { want.x = from.p[i * 3]; want.y = from.p[i * 3 + 1]; want.z = from.p[i * 3 + 2]; want.r = from.c[i * 3]; want.g = from.c[i * 3 + 1]; want.b = from.c[i * 3 + 2]; want.s = 0; }
      // each voxel leaves on its own beat, bottom ones first, and arcs up on the way
      const delay = (i / N) * 0.55;
      const e = easeInOut(Math.min(1, Math.max(0, (t - state.t0 - delay) / 0.85)));
      const fx = from.p[i * 3], fy = from.p[i * 3 + 1], fz = from.p[i * 3 + 2];
      const d = Math.hypot(want.x - fx, want.y - fy, want.z - fz);
      const lift = Math.sin(Math.PI * e) * Math.min(7, d * 0.35);
      cur.p[i * 3] = fx + (want.x - fx) * e;
      cur.p[i * 3 + 1] = fy + (want.y - fy) * e + lift;
      cur.p[i * 3 + 2] = fz + (want.z - fz) * e;
      cur.s[i] = from.s[i] + (want.s - from.s[i]) * e;
      cur.c[i * 3] = from.c[i * 3] + (want.r - from.c[i * 3]) * e;
      cur.c[i * 3 + 1] = from.c[i * 3 + 1] + (want.g - from.c[i * 3 + 1]) * e;
      cur.c[i * 3 + 2] = from.c[i * 3 + 2] + (want.b - from.c[i * 3 + 2]) * e;
      pos.set(cur.p[i * 3], cur.p[i * 3 + 1] + 0.5, cur.p[i * 3 + 2]);
      const s = Math.max(0.0001, cur.s[i]);
      scl.set(s, s, s);
      m4.compose(pos, q, scl);
      mesh.setMatrixAt(i, m4);
      col.setRGB(cur.c[i * 3], cur.c[i * 3 + 1], cur.c[i * 3 + 2]);
      mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    // camera: a slow turn around the mat; a drag turns it, a flick keeps it turning for a moment,
    // and the view always eases after the pointer so the turn stays smooth
    if (!state.dragging) { state.yawGoal += (0.12 + state.spin) * dt; state.spin *= Math.exp(-dt * 2.5); }
    state.yaw += (state.yawGoal - state.yaw) * (1 - Math.exp(-dt * 10));
    const r = cam.userData.r = (cam.userData.r ?? state.camR) + (state.camR - (cam.userData.r ?? state.camR)) * Math.min(1, dt * 2.5);
    const y = cam.userData.y = (cam.userData.y ?? state.camY) + (state.camY - (cam.userData.y ?? state.camY)) * Math.min(1, dt * 2.5);
    cam.position.set(Math.sin(state.yaw) * r, y + r * 0.55, Math.cos(state.yaw) * r);
    cam.lookAt(0, y, 0);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.w = Math.max(1, rect.width); state.h = Math.max(1, rect.height);
    renderer.setSize(state.w, state.h, false);
    cam.aspect = state.w / state.h;
    cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // drag to turn
  let lastX = null, lastT = 0;
  canvas.addEventListener('pointerdown', (e) => { lastX = e.clientX; lastT = e.timeStamp; state.spin = 0; state.dragging = true; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (lastX === null) return;
    const d = -(e.clientX - lastX) * 0.008, gap = Math.max(8, e.timeStamp - lastT) / 1000;
    state.yawGoal += d;
    state.spin = Math.max(-6, Math.min(6, state.spin * 0.6 + (d / gap) * 0.4));   // how fast it is being turned
    lastX = e.clientX; lastT = e.timeStamp;
  });
  // let go while moving and it keeps turning, slowing down; let go while still and it just stops
  const end = (e) => { if (e.timeStamp - lastT > 90) state.spin = 0; lastX = null; state.dragging = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  let running = false, last = 0;
  function loop(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    state.t += dt;
    update(dt);
    renderer.render(scene, cam);
  }
  setStage(0);
  await renderer.compileAsync(scene, cam);
  return {
    setStage,
    setProgress(f) { state.goal = f; },
    start() { if (!running) { running = true; last = 0; renderer.setAnimationLoop(loop); } },
    stop() { running = false; renderer.setAnimationLoop(null); },
    renderOnce() { update(0.016); renderer.render(scene, cam); },
  };
}
