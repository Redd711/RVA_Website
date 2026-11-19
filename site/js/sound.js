// The islands' sound. The ambience follows the camera (the sea, birds, the swell on the words in the
// sea, a splash now and then); every place sounds where it stands: its festival or music, the jeepney
// in Manila, the eagle over Apo. Landing on a place keeps only the ambience and that place. Built on
// three.js audio: the listener rides the camera and each source is a PositionalAudio in the scene.
// Sound is on by default; the browser holds it until the visitor's first click, tap or key.
import { THREE } from './voxel-kit.js';
import { PLACES, LANDMARKS } from './places.js';
import { toWorld, groundY, regionAt } from './world.js';
import { DIR, PAD, LOOPS, dB } from './sound-files.js';

const SEA_Y = 0.16;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const SHOTS = ['splash1', 'splash2', 'splash3', 'horn', 'eagle1', 'eagle2', 'eagle3', 'ding', 'whoosh'];

const at = (id) => { const p = PLACES.find((q) => q.id === id) ?? LANDMARKS[id]; const v = toWorld(p.lon, p.lat); v.y = groundY(v.x, v.z) + 0.6; return v; };

// Where each sound stands and whose it is (owner: the place a click lands on; none = ambience, always on).
// Level in dB; full within ref, then -6 dB per doubling of distance, gone by far (world units). Landing on a place
// plays its own sounds at full level, wherever the camera hovers, and silences every other place.
const SOURCES = [
  { id: 'swell', loop: 'swell', at: 'pearl', db: -9, ref: 30, far: 150, water: true },
  { id: 'coast', at: null, db: -16, ref: 8, far: 60, water: true },
  { id: 'calesa', loop: 'calesa', at: 'calesa', owner: 'vigan', db: -9, ref: 4, far: 40 },
  { id: 'banaue', loop: 'banaue', at: at('banaue'), owner: 'banaue', db: -4, ref: 3, far: 40, wet: -18 },
  { id: 'pahiyas', loop: 'pahiyas', at: at('lucban'), owner: 'lucban', db: 0, ref: 6, far: 44, wet: -20 },
  { id: 'jeepney', loop: 'jeepney', at: 'jeepney', owner: 'manila', db: 2, ref: 5, far: 25 },   // heard only near Manila
  { id: 'ati', loop: 'ati', at: at('kalibo'), owner: 'kalibo', db: -2, ref: 8, far: 48, wet: -20 },
  { id: 'sinulog', loop: 'sinulog', at: at('cebu'), owner: 'cebu', db: -2, ref: 8, far: 48, wet: -20 },
  { id: 'kadayawan', loop: 'kadayawan', at: at('davao'), owner: 'davao', db: -4, ref: 8, far: 48, wet: -20 },
  { id: 'eagle', at: 'eagle', owner: 'davao', db: -3, ref: 10, far: 70 },
  { id: 'tboli', loop: 'tboli', at: at('lakesebu'), owner: 'lakesebu', db: -3, ref: 7, far: 45, wet: -18 },
  { id: 'kulintang', loop: 'kulintang', at: at('lanao'), owner: 'lanao', db: -1, ref: 6, far: 45, wet: -16 },
];
// one-shots that come and go: which emitter, which takes, seconds between them
const NOW_AND_THEN = [
  { em: 'eagle', takes: ['eagle1', 'eagle2', 'eagle3'], every: [4, 10] },
  { em: 'jeepney', takes: ['horn'], every: [7, 16], db: -5 },
  { em: 'swell', takes: ['splash1', 'splash2', 'splash3'], every: [1.8, 4.5], db: -6 },
];
const DING = [-5, -3, 0, 2, 4, 7, 9, 12, 14];   // each mark rings its own note of one scale, north to south
const WATER = 0.3, BIRDS = 0.3;   // the sea, the swell and the splashes; the birds (the eagle is a place's sound, not these)

export function createSound(world, ctx) {
  if (ctx) THREE.AudioContext.setContext(ctx);
  const listener = new THREE.AudioListener();
  ctx = listener.context;
  world.camera.add(listener);
  const small = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;

  // a soft limiter on the way out, so a crowd of sources never clips
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10; limiter.knee.value = 8; limiter.ratio.value = 6; limiter.attack.value = 0.005; limiter.release.value = 0.3;
  listener.setFilter(limiter);
  listener.gain.gain.value = 0;
  const out = listener.getInput();

  // outdoor air: a short reverb the music shares, a little warmer than its source
  const air = ctx.createConvolver();
  air.buffer = (() => {
    const n = Math.floor(ctx.sampleRate * 0.6), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let lp = 0;
      for (let i = 0; i < n; i++) { lp += (Math.random() * 2 - 1 - lp) * 0.6; d[i] = lp * Math.exp(-i / (ctx.sampleRate * 0.1)); }
    }
    return b;
  })();
  air.connect(out);

  // the recordings
  const buffers = {};
  for (const name of [...Object.keys(LOOPS), ...SHOTS]) {
    fetch(DIR + name + '.mp3').then((r) => r.arrayBuffer()).then((a) => ctx.decodeAudioData(a)).then((b) => (buffers[name] = b)).catch(() => {});
  }

  // beds: everywhere, with levels that follow where the camera is
  const bed = (name) => { const g = ctx.createGain(); g.gain.value = 0; g.connect(out); return { name, g, src: null }; };
  const beds = { sea: bed('sea'), birds: bed('birds') };

  // a source in the world: buffer sources -> air absorption -> the PositionalAudio's panner and gain
  const emitter = (spec) => {
    const pa = new THREE.PositionalAudio(listener);
    pa.hasPlaybackControl = false;   // our own buffer sources play through it; this keeps its panner following it
    pa.panner.panningModel = small ? 'equalpower' : 'HRTF';
    pa.setRolloffFactor(0);           // distance is ours (the gain below); the panner only places the sound
    pa.gain.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 16000; lp.Q.value = 0.4;
    lp.connect(pa.panner);
    if (spec.wet) { const s = ctx.createGain(); s.gain.value = dB(spec.wet); pa.gain.connect(s); s.connect(air); }
    world.scene.add(pa);
    return { ...spec, pa, lp, src: null, quiet: 0, want: 0 };
  };
  const ems = Object.fromEntries(SOURCES.map((s) => [s.id, emitter(s)]));
  const all = Object.values(ems);

  // smooth parameter moves, only when the value really changes
  const glide = (p, v, tc = 0.25) => { if (Math.abs((p._v ?? -1) - v) > 0.004 * Math.max(v, 0.02)) { p._v = v; p.setTargetAtTime(v, ctx.currentTime, tc); } };
  const loopOn = (name, dest) => {
    const b = buffers[name]; if (!b) return null;
    const s = ctx.createBufferSource();
    s.buffer = b; s.loop = true; s.loopStart = PAD; s.loopEnd = PAD + LOOPS[name];
    s.connect(dest); s.start(ctx.currentTime, PAD + Math.random() * LOOPS[name]);
    return s;
  };
  const loopOff = (s) => { try { s.stop(); } catch {} s.disconnect(); };
  const play = (b, dest, { gain = 1, rate = 1, offset = 0 } = {}) => {
    if (!b) return 0;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; s.playbackRate.value = rate; g.gain.value = gain;
    s.connect(g); g.connect(dest); s.start(ctx.currentTime, offset);
    s.onended = () => { s.disconnect(); g.disconnect(); };
    return (b.duration - offset) / rate;
  };

  // where the camera is: how much land is around what it looks at, and how high it flies
  const fwd = new THREE.Vector3(), look = new THREE.Vector3(), mid = new THREE.Vector3();
  function surroundings(cam) {
    cam.getWorldDirection(fwd);
    if (fwd.y < -0.05) look.copy(cam.position).addScaledVector(fwd, (cam.position.y - SEA_Y) / -fwd.y);
    else look.copy(cam.position).addScaledVector(fwd, 40);
    mid.lerpVectors(cam.position, look, 0.5);
    let land = 0;
    for (let i = 0; i < 25; i++) land += regionAt(Math.floor(mid.x + ((i % 5) - 2) * 5), Math.floor(mid.z + (Math.floor(i / 5) - 2) * 5)) ? 1 : 0;
    return { land: land / 25, alt: cam.position.y - Math.max(SEA_Y, groundY(cam.position.x, cam.position.z)) };
  }

  let enabled = false, active = true, sleep = 0, lastFlight = null, lastDing = 0;
  const timers = NOW_AND_THEN.map(() => 0);
  let coastNext = 0;
  function master() {
    const on = enabled && active && !document.hidden;
    clearTimeout(sleep);
    if (on) { ctx.resume().catch(() => {}); listener.gain.gain.setTargetAtTime(0.9, ctx.currentTime, 0.5); }
    else { listener.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.12); sleep = setTimeout(() => ctx.suspend(), 700); }
  }
  document.addEventListener('visibilitychange', master);

  function update(w) {
    if (!enabled || !active || ctx.state !== 'running') return;
    const st = w.state, cam = w.camera, now = ctx.currentTime;
    const { land, alt } = surroundings(cam);
    const high = smooth(25, 140, alt);

    // beds
    const on = st.mode === 'place';   // landed on a place: its own sounds come first, the sea steps back
    // the first frame is the water alone; the rest comes in as the words sink, when the scroll begins
    const seaG = WATER * dB(on ? -12 : -3) * (0.45 + 0.55 * (1 - land)) * (1 - 0.5 * high);
    const birdG = BIRDS * dB(on ? -10 : -6) * smooth(0.08, 0.6, land) * (1 - smooth(16, 70, alt)) * st.sink;
    for (const [b, g] of [[beds.sea, seaG], [beds.birds, birdG]]) {
      if (!b.src) b.src = loopOn(b.name, b.g);
      glide(b.g.gain, g, 0.6);
    }

    // sources: place, distance, focus
    for (const em of all) {
      if (em.at === 'pearl') em.pa.position.set(w.pearl.position.x, 0.4, w.pearl.position.z);
      else if (typeof em.at === 'string') em.pa.position.copy(w.emitters[em.at]);
      else if (em.at) em.pa.position.copy(em.at);
      const d = cam.position.distanceTo(em.pa.position);
      const near = st.mode === 'place' && em.owner === st.place;
      let g = dB(em.db) * (near ? 1 : Math.min(1, em.ref / Math.max(d, 1e-3)) * (1 - smooth(em.far * 0.65, em.far, d)));
      if (st.mode === 'place' && !near && em.owner) g = 0;
      g *= em.water ? WATER : st.sink;
      if (em.id === 'swell') g *= 1 - st.sink;
      if (em.id === 'coast') g *= em.coast ?? 0;
      em.want = g;
      glide(em.pa.gain.gain, g, 0.3);
      glide(em.lp.frequency, near ? 16000 : 16000 - 13500 * smooth(em.ref, em.far, d), 0.3);
      if (em.loop) {
        if (g > 1e-4) { em.quiet = 0; if (!em.src) em.src = loopOn(em.loop, em.lp); }
        else if (em.src && (em.quiet += 1 / 60) > 3) { loopOff(em.src); em.src = null; }
      }
    }

    // now and then: the eagle's cry, a horn in Manila traffic, the swell breaking on the words
    NOW_AND_THEN.forEach((s, i) => {
      if (ems[s.em].want < dB(-50)) return;
      if (now >= timers[i]) { play(buffers[pick(s.takes)], ems[s.em].lp, { gain: dB(s.db ?? 0), rate: rand(0.94, 1.06) }); timers[i] = now + rand(...s.every); }
    });
    // a splash along a coast below the flight
    const c = ems.coast;
    c.coast = st.s < 0.5 ? smooth(0.08, 0.3, land) * (1 - smooth(0.7, 0.92, land)) * (1 - smooth(14, 30, alt)) : 0;
    if (c.coast > 0.05 && now >= coastNext) {
      c.pa.position.set(mid.x + rand(-9, 9), SEA_Y, mid.z + rand(-9, 9));
      play(buffers[pick(['splash1', 'splash2', 'splash3'])], c.lp, { rate: rand(0.9, 1.1) });
      coastNext = now + rand(6, 14);
    }

    // the swoosh between map views: the whoosh peaks (1.0 s into its file) on the flight's middle
    if (st.flight && st.flight !== lastFlight) {
      lastFlight = st.flight;
      play(buffers.whoosh, out, { gain: dB(-17), offset: Math.max(0, 1 - st.flight.dur / 2) });
    }
  }

  return {
    update,
    // for listening tests and the console: the context, the master output and what sounds now
    ctx, output: limiter,
    info: () => ({ state: ctx.state, loaded: Object.keys(buffers).length, sea: beds.sea.g.gain._v, birds: beds.birds.g.gain._v,
      on: all.filter((e) => e.want > 1e-3).map((e) => `${e.id} ${(20 * Math.log10(e.want)).toFixed(1)} dB`) }),
    setEnabled(on) { enabled = on; master(); },
    setActive(on) { active = on; master(); },
    // a mark under the pointer rings its note
    ding(id) {
      const now = ctx.currentTime;
      if (!enabled || now - lastDing < 0.06) return;
      lastDing = now;
      const i = Math.max(0, PLACES.findIndex((p) => p.id === id));
      play(buffers.ding, out, { gain: dB(-17), rate: 2 ** (DING[i] / 12) });
    },
  };
}
