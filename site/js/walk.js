// On foot through a hero scene (the Traditions town, the Arts plaza), on a computer with a mouse: the
// keys walk, the mouse looks (pointer lock), Shift runs, Space jumps, Esc opens a menu. The ground and
// the walls come from the scene's own voxels: each one-unit cell keeps 64 one-unit slices, set where
// something solid stands, so steps and terraces climb, walls stop you and a gateway's beam passes over
// your head. People are circles that nudge you aside.
import { THREE } from './voxel-kit.js';

const EYE = 10.5, BODY = 12, STEP = 3.2, R = 1.2;   // a person is 12 voxels tall (models.js), eyes at 10.5
const WALK = 14, RUN = 26, JUMP = 26, FALL = 60, LOOK = 0.0022, FOV = 70;   // a jump clears 5.6: onto the Banaue terraces' lip
const SLICES = 64;

// a mouse and a pointer to lock: phones and tablets keep the buttons' links (DESIGN.md 8.6)
export const canWalk = matchMedia('(hover: hover) and (pointer: fine)').matches && 'requestPointerLock' in Element.prototype;

const ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path class="world__sound-on" d="M15.5 9.3a3.8 3.8 0 0 1 0 5.4M18.2 6.7a7.4 7.4 0 0 1 0 10.6"/><path class="world__sound-off" d="M16 9.6l4.8 4.8M20.8 9.6L16 14.4"/></svg>';
const KEYS = 'W A S D to walk, the mouse to look, Shift to run, Space to jump, M for sound, Esc for this menu.';

// the solid slices of every static voxel in the scene, per one-unit cell of [x0, x1) x [z0, z1)
function solidGrid(scene, [x0, z0, x1, z1]) {
  const W = x1 - x0, D = z1 - z0, lo = new Uint32Array(W * D), hi = new Uint32Array(W * D);
  scene.updateMatrixWorld(true);
  scene.traverse((m) => {
    const { vox, size: s, moves } = m.userData;
    if (!vox || moves) return;
    const e = m.matrixWorld.elements;   // models only turn about y: x and z mix, y only shifts
    const reach = (s * (Math.abs(e[0]) + Math.abs(e[8]))) / 2;   // half the footprint of a turned voxel
    vox.each((vx, vy, vz) => {
      const y0 = vy * s + e[13], y1 = y0 + s;
      if (y1 <= 0.01 || y0 >= SLICES) return;   // the floor itself, or far overhead
      let b0 = 0, b1 = 0;
      for (let b = Math.max(0, Math.floor(y0 + 0.001)); b < Math.min(SLICES, Math.ceil(y1 - 0.001)); b++) {
        if (b < 32) b0 |= 1 << b; else b1 |= 1 << (b - 32);
      }
      const lx = (vx + 0.5) * s, lz = (vz + 0.5) * s;
      const wx = e[0] * lx + e[8] * lz + e[12], wz = e[2] * lx + e[10] * lz + e[14];
      for (let cx = Math.floor(wx - reach + 0.001); cx < Math.ceil(wx + reach - 0.001); cx++) {
        if (cx < x0 || cx >= x1) continue;
        for (let cz = Math.floor(wz - reach + 0.001); cz < Math.ceil(wz + reach - 0.001); cz++) {
          if (cz < z0 || cz >= z1) continue;
          const i = (cz - z0) * W + (cx - x0);
          lo[i] |= b0; hi[i] |= b1;
        }
      }
    });
  });
  return { x0, z0, x1, z1, W, lo, hi };
}

// bits a..b (inclusive, clipped to 0..63) as two 32-bit words
function band(a, b) {
  a = Math.max(0, a); b = Math.min(SLICES - 1, b);
  if (a > b) return [0, 0];
  const word = (from, to) => (to < from ? 0 : (to - from === 31 ? -1 : ((1 << (to - from + 1)) - 1) << from));
  return [word(Math.min(a, 32), Math.min(b, 31)), word(Math.max(a, 32) - 32, b - 32)];
}

// stage: the hero-stage api. root: the hero section. opts: bounds [x0, z0, x1, z1] of the walkable ground,
// spawn { at: [x, z], yaw } (yaw 0 looks toward -z), home (the hero's view to fly back to), place ("town"),
// blocked(x, z) for water and the like, sound (js/walk-sound.js), reach(x, z, feet) called every step.
export function walker(stage, root, opts) {
  const cam = stage.cam, canvas = stage.renderer.domElement;
  const hud = document.createElement('div');
  hud.className = 'walk';
  hud.hidden = true;
  hud.innerHTML = `<p class="walk__hint">${KEYS}</p>
    <button class="chip world__sound walk__sound" type="button" data-on="true">${ICON}<span>Turn off sound</span></button>
    <div class="vhero__panel walk__menu dark" role="dialog" aria-modal="true" aria-labelledby="walk-menu-${opts.place}" hidden>
      <h2 class="vhero__name" id="walk-menu-${opts.place}">Paused in the ${opts.place}</h2>
      <p>${KEYS} Esc again leaves.</p>
      <div class="vhero__actions"><button class="btn" type="button" data-resume>Keep walking</button><button class="link" type="button" data-leave>Leave the ${opts.place}</button></div>
    </div>`;
  root.append(hud);
  const menu = hud.querySelector('.walk__menu'), chip = hud.querySelector('.walk__sound');

  let grid = null, active = false, ready = false, leaving = false, menuAt = 0, opener = null;
  let px = 0, pz = 0, feet = 0, vy = 0, eye = EYE, yaw = 0, pitch = 0, grounded = true, homeFov = cam.fov;
  const vel = new THREE.Vector2(), keys = new Set();

  const cellBits = (x, z) => {
    if (x < grid.x0 || x >= grid.x1 || z < grid.z0 || z >= grid.z1) return [-1, -1];   // the edge of the ground is a wall
    const i = (Math.floor(z) - grid.z0) * grid.W + (Math.floor(x) - grid.x0);
    return [grid.lo[i], grid.hi[i]];
  };
  // every cell the walker's circle touches at (x, z)
  const around = (x, z, fn) => {
    for (let cx = Math.floor(x - R); cx <= Math.floor(x + R); cx++)
      for (let cz = Math.floor(z - R); cz <= Math.floor(z + R); cz++) {
        const dx = Math.max(cx - x, 0, x - cx - 1), dz = Math.max(cz - z, 0, z - cz - 1);
        if (dx * dx + dz * dz < R * R) fn(cellBits(cx, cz));
      }
  };
  // something solid between knee (STEP) and head (BODY) at (x, z) with the feet at f
  const hits = (x, z, f) => {
    if (opts.blocked?.(x, z)) return true;
    const [m0, m1] = band(Math.floor(f + STEP), Math.ceil(f + BODY) - 1);
    let hit = false;
    around(x, z, ([a, b]) => { if ((a & m0) || (b & m1)) hit = true; });
    return hit;
  };
  // the floor under (x, z): the top of the highest solid slice the walker can step onto from f
  const floorAt = (x, z, f) => {
    const [m0, m1] = band(0, Math.floor(f + STEP) - 1);
    let top = 0;
    around(x, z, ([a, b]) => {
      const h1 = b & m1, h0 = a & m0;
      if (h1) top = Math.max(top, 64 - Math.clz32(h1));
      else if (h0) top = Math.max(top, 32 - Math.clz32(h0));
    });
    return top;
  };

  function step(dt) {
    if (!ready) return;
    const run = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const s = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    const want = new THREE.Vector2(s * Math.cos(yaw) - f * Math.sin(yaw), -s * Math.sin(yaw) - f * Math.cos(yaw));
    if (want.lengthSq() > 1) want.normalize();
    want.multiplyScalar(run ? RUN : WALK);
    vel.lerp(want, 1 - Math.exp(-dt * (grounded ? 10 : 3)));

    // move in short steps (a run covers a voxel in a few frames), sliding along whatever stops us
    const n = Math.max(1, Math.ceil((vel.length() * dt) / 0.5));
    for (let i = 0; i < n; i++) {
      const dx = (vel.x * dt) / n, dz = (vel.y * dt) / n;
      if (!hits(px + dx, pz + dz, feet)) { px += dx; pz += dz; }
      else if (!hits(px + dx, pz, feet)) px += dx;
      else if (!hits(px, pz + dz, feet)) pz += dz;
    }
    // people step round each other: the walker is nudged out of anyone it walks into
    for (const p of opts.people?.() ?? []) {
      if (p.scale.x < 0.5) continue;   // a walker not yet out of a door
      const r = R + (p.userData.radius ?? 1.6), dx = px - p.position.x, dz = pz - p.position.z, d = Math.hypot(dx, dz);
      if (d >= r || d < 1e-4) continue;
      const k = (r - d) / d;
      if (!hits(px + dx * k, pz + dz * k, feet)) { px += dx * k; pz += dz * k; }
    }

    // up and down: jump, fall, land, step up onto what is underfoot
    if (grounded && keys.has('Space')) { vy = JUMP; grounded = false; }
    vy -= FALL * dt;
    if (vy > 0 && hits(px, pz, feet + vy * dt)) vy = 0;   // a beam or a roof overhead
    feet += vy * dt;
    const floor = floorAt(px, pz, feet);
    if (feet <= floor) { feet = floor; vy = 0; grounded = true; } else grounded = feet - floor < 0.05;

    eye += (feet + EYE - eye) * (1 - Math.exp(-dt * 16));   // a step up glides instead of jolting
    cam.position.set(px, eye, pz);
    cam.rotation.set(pitch, yaw, 0, 'YXZ');
    opts.reach?.(px, pz, feet);
  }

  function frame(dt) {
    step(dt);
    opts.sound?.update(cam, dt);
  }

  // ---------------------------------------------------------------- the menu and the mouse
  const lock = () => {
    try {
      const p = canvas.requestPointerLock({ unadjustedMovement: true });
      p?.catch?.(() => canvas.requestPointerLock()?.catch?.(() => {}));
    } catch { try { canvas.requestPointerLock(); } catch {} }
  };
  const showMenu = (on) => {
    menu.hidden = !on;
    if (on) { menuAt = performance.now(); keys.clear(); menu.querySelector('[data-resume]').focus({ preventScroll: true }); }
  };
  const showSound = () => {
    const on = !opts.sound?.muted;
    chip.dataset.on = String(on);
    chip.querySelector('span').textContent = on ? 'Turn off sound' : 'Turn on sound';
  };
  const toggleSound = () => { opts.sound?.setMuted(!opts.sound.muted); showSound(); };

  document.addEventListener('pointerlockchange', () => {
    if (!active || leaving) return;
    if (document.pointerLockElement === canvas) showMenu(false);
    else if (ready) showMenu(true);
  });
  // with the mouse locked it turns the view; without the lock (it was refused), a drag does
  addEventListener('mousemove', (e) => {
    if (!active || !ready || !menu.hidden) return;
    if (document.pointerLockElement !== canvas && !(e.buttons & 1 && e.target === canvas)) return;
    yaw -= e.movementX * LOOK;
    pitch = Math.max(-1.45, Math.min(1.45, pitch - e.movementY * LOOK));
  });
  canvas.addEventListener('click', () => { if (active && ready && document.pointerLockElement !== canvas) { showMenu(false); lock(); } });
  addEventListener('keydown', (e) => {
    if (!active) return;
    if (e.key === 'Escape') {
      // the first Esc frees the mouse and opens the menu (the browser's own unlock, or ours when the lock was refused)
      if (menu.hidden) { if (ready && document.pointerLockElement !== canvas) showMenu(true); }
      else if (performance.now() - menuAt > 400) leave();
      return;
    }
    if (!menu.hidden) return;   // the menu's own buttons take Tab, Enter and Space
    if (e.code === 'KeyM') toggleSound();
    if (/^(Key[WASD]|Arrow|Space|Shift|Tab)/.test(e.code)) e.preventDefault();   // no scrolling, no focus walking off behind the scene
    keys.add(e.code);
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  hud.addEventListener('click', (e) => {
    if (e.target.closest('[data-resume]')) { showMenu(false); lock(); }
    else if (e.target.closest('[data-leave]')) leave();
    else if (e.target.closest('.walk__sound')) toggleSound();
  });

  // ---------------------------------------------------------------- in and out
  // while walking, the page behind the scene is out of reach: Tab stays in the menu, readers stay here
  const behind = () => [...document.body.children, ...root.parentElement.children].filter((el) => el !== root && !el.contains(root));
  async function start(from) {
    if (active) return;
    opener = from ?? null;
    active = true; leaving = false; ready = false;
    opts.sound?.start();   // inside the click, so the browser lets it play
    showSound();
    grid ??= solidGrid(stage.scene, opts.bounds);
    document.activeElement?.blur?.();
    root.classList.add('is-afoot');
    document.documentElement.classList.add('is-afoot');
    behind().forEach((el) => { el.inert = true; });
    hud.hidden = false;
    hud.classList.remove('is-quiet');
    showMenu(false);
    lock();
    [px, pz] = opts.spawn.at; yaw = opts.spawn.yaw; pitch = 0; vy = 0; vel.set(0, 0); keys.clear();
    feet = floorAt(px, pz, 0); eye = feet + EYE; grounded = true;
    homeFov = cam.fov;
    stage.fov(FOV);
    await stage.flyTo({ pos: [px, eye, pz], look: [px - Math.sin(yaw) * 40, eye, pz - Math.cos(yaw) * 40] }, 1500);
    if (!active) return;
    ready = true;
    stage.walk(frame);
    setTimeout(() => hud.classList.add('is-quiet'), 9000);   // the line of keys steps back once learned
  }

  // fly: back up to the hero's view (Leave), or jump straight there (a museum door, which scrolls on)
  async function leave({ fly = true } = {}) {
    if (!active) return;
    leaving = true; active = false; ready = false;
    if (document.pointerLockElement) document.exitPointerLock();
    stage.walk(null);
    const dir = cam.getWorldDirection(new THREE.Vector3());
    stage.view.pos.copy(cam.position);
    stage.view.look.copy(cam.position).addScaledVector(dir, 40);
    stage.fov(homeFov);
    opts.sound?.stop();
    hud.hidden = true;
    menu.hidden = true;
    root.classList.remove('is-afoot');
    document.documentElement.classList.remove('is-afoot');
    behind().forEach((el) => { el.inert = false; });
    opener?.focus({ preventScroll: true });
    if (fly) await stage.flyTo(opts.home);
    else stage.jump(opts.home);
  }

  return {
    start, leave, get active() { return active; },
    // for tests and the console: where the walker stands, and what it hears
    where: () => ({ x: +px.toFixed(2), z: +pz.toFixed(2), feet: +feet.toFixed(2), yaw: +yaw.toFixed(3), grounded }),
    advance: (s, keysDown = []) => { keysDown.forEach((k) => keys.add(k)); for (let t = 0; t < s; t += 1 / 60) step(1 / 60); keys.clear(); },
    sound: opts.sound,
  };
}
