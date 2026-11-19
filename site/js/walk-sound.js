// The walks' sound (js/walk.js). Each place's recording plays where it stands, the same files as the
// Overview's marks, and the people talk now and then in their own language as you pass. Loudness
// follows distance the Overview's way: full within ref, -6 dB per doubling past it, gone by far, and a
// low-pass darkens what is far off. Built on three.js audio like js/sound.js: the listener rides the
// camera, every source is a PositionalAudio with HRTF panning, so you hear which side it is on.
import { THREE } from './voxel-kit.js';
import { DIR, PAD, LOOPS, dB } from './sound-files.js';

// the voices of each corner of the town: one file each in assets/sound, its phrases at [start, length]
// seconds. Real recordings (credits.html); where we found none in a corner's own language, a language
// people there also speak stands in, and the credits say so.
export const VOICES = {
  pahiyas: { file: 'voices-pahiyas', cuts: [[0.35, 3.32], [4.02, 1.84], [6.21, 2.02], [8.58, 3.72]] },   // Tagalog
  vigan: { file: 'voices-vigan', cuts: [[0.35, 2.28], [2.98, 2.08], [5.41, 4.34], [10.1, 1.92], [12.37, 2.88], [15.6, 2.62]] },   // Tagalog, for Ilocano
  banaue: { file: 'voices-banaue', cuts: [[0.35, 1.42], [2.12, 1.72], [4.19, 3.34], [7.88, 2.2], [10.43, 1.48]] },   // the performers in Banaue, between dances
};

const VOICE = { db: 1, ref: 5, far: 46 };    // a person talking: beside you, a touch over the band behind them
const SLOTS = 3;                             // at most this many people talk at once
const BIRDS = 0.1;                           // the birds overhead, everywhere, quiet
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);

// stage: the hero-stage api. loops: [{ name, at: [x, y, z] or follow: a mesh, db, ref, far }].
// people(): [{ mesh, lang }], everyone who may talk (read again at every start).
export function walkSound(stage, { loops = [], people = () => [] }) {
  let ctx = null, listener = null, ems = [], slots = [], talkers = [], birds = null, muted = false, on = false, sleep = 0;
  const buffers = {}, last = {};

  function setup() {
    listener = new THREE.AudioListener();
    ctx = listener.context;
    stage.cam.add(listener);
    const limiter = ctx.createDynamicsCompressor();   // a crowd of sources never clips
    limiter.threshold.value = -10; limiter.knee.value = 8; limiter.ratio.value = 6; limiter.attack.value = 0.005; limiter.release.value = 0.3;
    listener.setFilter(limiter);
    listener.gain.gain.value = 0;
    const names = [...new Set(['birds', ...loops.map((l) => l.name), ...Object.values(VOICES).map((v) => v.file)])];
    for (const name of names) {
      fetch(DIR + name + '.mp3').then((r) => r.arrayBuffer()).then((a) => ctx.decodeAudioData(a)).then((b) => (buffers[name] = b)).catch(() => {});
    }
    const emitter = () => {
      const pa = new THREE.PositionalAudio(listener);
      pa.hasPlaybackControl = false;   // our own buffer sources play through it; this keeps its panner following it
      pa.panner.panningModel = 'HRTF';
      pa.setRolloffFactor(0);          // distance is ours (the gain below); the panner only places the sound
      pa.gain.gain.value = 0;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 16000; lp.Q.value = 0.4;
      lp.connect(pa.panner);
      stage.scene.add(pa);
      return { pa, lp, src: null, quiet: 0 };
    };
    ems = loops.map((l) => ({ ...l, ...emitter() }));
    slots = Array.from({ length: SLOTS }, () => ({ ...emitter(), who: null, until: 0 }));
    birds = { g: ctx.createGain(), src: null };
    birds.g.gain.value = BIRDS;
    birds.g.connect(listener.getInput());
  }

  // smooth moves, only when the value really changes (as in js/sound.js)
  const glide = (p, v, tc = 0.25) => { if (Math.abs((p._v ?? -1) - v) > 0.004 * Math.max(v, 0.02)) { p._v = v; p.setTargetAtTime(v, ctx.currentTime, tc); } };
  const level = (s, d) => dB(s.db) * Math.min(1, s.ref / Math.max(d, 1e-3)) * (1 - smooth(s.far * 0.65, s.far, d));
  const dark = (s, d) => 16000 - 13500 * smooth(s.ref, s.far, d);
  const loopOn = (name, dest) => {
    const b = buffers[name]; if (!b) return null;
    const s = ctx.createBufferSource();
    s.buffer = b; s.loop = true; s.loopStart = PAD; s.loopEnd = PAD + LOOPS[name];
    s.connect(dest); s.start(ctx.currentTime, PAD + Math.random() * LOOPS[name]);
    return s;
  };
  const master = () => {
    clearTimeout(sleep);
    if (on && !document.hidden) { ctx.resume().catch(() => {}); listener.gain.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.3); }
    else { listener.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.12); sleep = setTimeout(() => ctx.suspend(), 700); }
  };
  document.addEventListener('visibilitychange', () => ctx && master());

  // one phrase from someone, through a free slot that follows them while they talk
  function say(t, now) {
    const v = VOICES[t.lang], b = v && buffers[v.file];
    const slot = slots.find((s) => now >= s.until);
    if (!b || !slot) return false;
    let i = Math.floor(Math.random() * v.cuts.length);
    if (v.cuts.length > 1 && i === last[t.lang]) i = (i + 1) % v.cuts.length;   // never the same line twice running
    last[t.lang] = i;
    const [at, len] = v.cuts[i];
    const s = ctx.createBufferSource();
    s.buffer = b; s.playbackRate.value = rand(0.97, 1.03);
    s.connect(slot.lp);
    s.start(now, at, len);
    s.onended = () => s.disconnect();
    slot.who = t.mesh; slot.until = now + len / s.playbackRate.value + 0.1;
    return true;
  }

  const where = new THREE.Vector3();
  function update(cam) {
    if (!on || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    birds.src ??= loopOn('birds', birds.g);
    for (const e of ems) {
      if (e.follow) e.pa.position.set(e.follow.position.x, 6, e.follow.position.z);
      else e.pa.position.set(...e.at);
      const d = cam.position.distanceTo(e.pa.position), g = level(e, d);
      glide(e.pa.gain.gain, g, 0.3);
      glide(e.lp.frequency, dark(e, d), 0.3);
      if (g > 1e-4) { e.quiet = 0; e.src ??= loopOn(e.name, e.lp); }
      else if (e.src && (e.quiet += 1 / 60) > 3) { try { e.src.stop(); } catch {} e.src.disconnect(); e.src = null; }   // far off: stop it
    }
    // people talk now and then, only those near enough to hear and out of doors
    for (const t of talkers) {
      if (now < t.next) continue;
      const near = t.mesh.scale.x > 0.5 && cam.position.distanceTo(t.mesh.position) < VOICE.far * 0.8;
      t.next = now + (near && say(t, now) ? rand(9, 22) : rand(1, 3));
    }
    for (const s of slots) {
      if (!s.who) continue;
      s.who.getWorldPosition(where);
      s.pa.position.set(where.x, where.y + 10, where.z);   // a mouth, near the top of a 12-voxel person
      const d = cam.position.distanceTo(s.pa.position);
      glide(s.pa.gain.gain, now < s.until ? level(VOICE, d) : 0, 0.08);
      glide(s.lp.frequency, dark(VOICE, d), 0.08);
      if (now >= s.until) s.who = null;
    }
  }

  return {
    update,
    start() {
      if (!ctx) setup();
      on = true;
      const now = ctx.currentTime;
      talkers = people().map((p) => ({ ...p, next: now + rand(0.5, 9) }));
      master();
    },
    stop() { on = false; if (ctx) master(); },
    get muted() { return muted; },
    setMuted(m) { muted = m; if (ctx) master(); },
    // for listening tests and the console
    info: () => ctx && { state: ctx.state, loaded: Object.keys(buffers), on: ems.filter((e) => (e.pa.gain.gain._v ?? 0) > 1e-3).map((e) => `${e.name} ${(20 * Math.log10(e.pa.gain.gain._v)).toFixed(1)} dB`),
      talking: slots.filter((s) => s.who).length },
  };
}
