// Overview page: drives the voxel world from scroll, and the woven map's pins, chips and dossier.
import { PLACES, REGIONS, SCROLL } from './places.js';

const section = document.querySelector('.world');
const canvas = section.querySelector('.world__canvas');
const pinsBox = section.querySelector('.world__pins');
const dossier = section.querySelector('.world__dossier');
const back = section.querySelector('.world__back');
const chips = [...section.querySelectorAll('[data-region]')];
const tag = section.querySelector('.world__tag');
const motto = section.querySelector('.world__motto');
const streaks = section.querySelector('.world__streaks');
const soundBtn = section.querySelector('.world__sound');
const wide = () => innerWidth >= 960;

let world = null;
let sound = null, soundOn = true, onScreen = true;
let current = { mode: 'overview', region: 0, place: null };

// ---------------------------------------------------------------- scroll position
const progress = () => {
  const r = section.getBoundingClientRect();
  const total = section.offsetHeight - innerHeight;
  return Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
};
function onScroll() {
  const p = progress();
  section.style.setProperty('--p', p.toFixed(4));
  section.classList.toggle('is-hero', p < SCROLL.journeyStart);
  section.classList.toggle('is-journey', p >= SCROLL.journeyStart && p < SCROLL.mapAt);
  section.classList.toggle('is-map', p >= SCROLL.mapAt);
  world?.setProgress(p);
}
addEventListener('scroll', onScroll, { passive: true });

// scrolling down tucks the header away and fades the sound chip; scrolling up brings both back
const root = document.documentElement;
let lastY = scrollY;
addEventListener('scroll', () => {
  const y = scrollY, dy = y - lastY;
  if (Math.abs(dy) < 6) return;   // ignore jitter
  root.classList.toggle('is-tucked', dy > 0 && y > 80);
  lastY = y;
}, { passive: true });
addEventListener('resize', onScroll);
onScroll();

// "Skip to the map" lands on the map's resting point, not the top of the section
section.querySelector('[data-jump="map"]').addEventListener('click', (e) => {
  e.preventDefault();
  const top = section.offsetTop + (section.offsetHeight - innerHeight) * SCROLL.mapRest;
  scrollTo({ top, behavior: 'smooth' });
});

// ---------------------------------------------------------------- pins
const pins = PLACES.map((p) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'wpin';
  b.dataset.id = p.id;
  b.dataset.region = String(p.region);
  b.style.setProperty('--c', REGIONS[p.region].cloth);
  b.setAttribute('aria-label', `${p.name}, ${p.place}`);
  b.innerHTML = `<span class="wpin__label" aria-hidden="true">${p.place.split(',')[0]}</span>`;
  b.addEventListener('click', () => {
    world?.focusPlace(p.id);
    if (document.activeElement === b) back.focus({ preventScroll: true });   // the mark folds away on landing
  });
  for (const ev of ['pointerenter', 'focus']) b.addEventListener(ev, () => world?.setHover(p.id));
  // a mark rings when the pointer finds it (or the keyboard does)
  b.addEventListener('pointerenter', () => sound?.ding(p.id));
  b.addEventListener('focus', () => { if (b.matches(':focus-visible')) sound?.ding(p.id); });
  for (const ev of ['pointerleave', 'blur']) b.addEventListener(ev, () => world?.setHover(null));
  pinsBox.append(b);
  return b;
});
pinsBox.addEventListener('keydown', (e) => {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!step) return;
  const live = pins.filter((b) => !b.hidden && !b.classList.contains('is-off'));
  const i = live.indexOf(document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  live[(i + step + live.length) % live.length].focus();
});

chips.forEach((c) => c.addEventListener('click', () => world?.selectRegion(Number(c.dataset.region))));
back.addEventListener('click', () => {
  if (current.mode === 'place') world?.focusPlace(null);
  else world?.selectRegion(0);
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && section.classList.contains('is-map') && current.mode !== 'overview') back.click();
  // on a place, the left and right arrows turn the camera around it
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && current.mode === 'place' && section.classList.contains('is-map') && !e.target.closest?.('input, textarea, select')) {
    e.preventDefault();
    world?.nudge(e.key === 'ArrowLeft' ? 0.4 : -0.4);
  }
});

// ---------------------------------------------------------------- dossier
const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function renderDossier() {
  const { mode, region, place } = current;
  if (mode === 'place') {
    const p = PLACES.find((q) => q.id === place);
    dossier.innerHTML = `
      <div class="dossier__img"><img src="${p.img}" alt="${esc(p.alt)}" width="960" height="640"></div>
      <div class="dossier__body">
        <p class="dossier__place">${esc(p.place)}</p>
        <h3>${esc(p.name)}</h3>
        <p class="muted">${esc(p.text)}</p>
        <p><a class="link" href="${p.link}">${esc(p.linkText)}</a></p>
      </div>`;
  } else if (mode === 'region') {
    const g = REGIONS[region];
    const list = PLACES.filter((p) => p.region === region)
      .map((p) => `<li><button type="button" class="dossier__go" data-go="${p.id}">${esc(p.name)}<span class="muted">${esc(p.place)}</span></button></li>`).join('');
    dossier.innerHTML = `
      <div class="dossier__body">
        <p class="dossier__place"><i class="swatch" style="--c:${g.cloth}"></i>Woven in ${esc(g.clothName)}</p>
        <h3>${g.name}</h3>
        <p class="muted">${esc(g.blurb)}</p>
        <ul class="dossier__list">${list}</ul>
      </div>`;
  } else {
    const list = Object.entries(REGIONS).map(([k, g]) => `<li><button type="button" class="dossier__go" data-region-go="${k}"><i class="swatch" style="--c:${g.cloth}"></i>${g.name}<span class="muted">${esc(g.clothName)}</span></button></li>`).join('');
    dossier.innerHTML = `
      <div class="dossier__body">
        <p class="dossier__place">Three cloths, one archipelago</p>
        <h3>Where to begin</h3>
        <p class="muted">The land is woven in three colours, one for each island group. Choose a group to see its places, or click any exclamation mark.</p>
        <ul class="dossier__list">${list}</ul>
      </div>`;
  }
  dossier.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => world?.focusPlace(b.dataset.go)));
  dossier.querySelectorAll('[data-region-go]').forEach((b) => b.addEventListener('click', () => world?.selectRegion(Number(b.dataset.regionGo))));
}

function applyState(st) {
  current = st;
  section.dataset.mode = st.mode;
  chips.forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.region) === st.region)));
  pins.forEach((b) => {
    const off = st.region && Number(b.dataset.region) !== st.region;
    b.classList.toggle('is-off', !!off);
    b.tabIndex = off ? -1 : 0;
    b.setAttribute('aria-pressed', String(b.dataset.id === st.place));
  });
  back.hidden = st.mode === 'overview';
  back.querySelector('span').textContent = st.mode === 'place' ? `Back to ${REGIONS[st.region].name}` : 'Back to all islands';
  renderDossier();
  syncInset();
}
function syncInset() {
  if (wide()) world?.setInset((dossier.offsetWidth + 32) / 2, 0);
  else world?.setInset(0, (dossier.offsetHeight + 90) / 2);
}
addEventListener('resize', syncInset);
renderDossier();

// ---------------------------------------------------------------- sound: on from the start
// Browsers hold audio until the visitor's first click, tap or key (scrolling does not count), so the chip
// shows what really plays: "Turn on sound" while the browser holds it, "Turn off sound" once it plays.
let ctx = null;
const GESTURES = ['pointerdown', 'keydown', 'touchend'];
function showSound() {
  const playing = soundOn && ctx?.state === 'running';
  soundBtn.dataset.on = String(playing);
  soundBtn.querySelector('span').textContent = playing ? 'Turn off sound' : 'Turn on sound';
}
function setSound(on) {
  soundOn = on;
  if (on) ctx?.resume().catch(() => {});   // inside the chip's click: the gesture the browser waits for
  sound?.setEnabled(on);
  showSound();
}
// the first click, tap or key anywhere else starts it; the chip's own click goes through setSound
function unlock(e) {
  if (soundOn && !e.target.closest?.('.world__sound')) ctx?.resume().catch(() => {});
}
function startSound() {
  if (sound || !world || !window.AudioContext) return;
  ctx = new AudioContext();
  ctx.onstatechange = () => {
    showSound();
    if (ctx.state === 'running') for (const ev of GESTURES) removeEventListener(ev, unlock, true);
  };
  for (const ev of GESTURES) addEventListener(ev, unlock, true);
  showSound();
  sound = { setEnabled() {}, setActive() {}, update() {}, ding() {} };
  // shortcut: ?v=2 only makes browsers drop a cached old sound.js (the one with the chatter); safe to remove later
  import('./sound.js?v=2').then(({ createSound }) => {
    sound = createSound(world, ctx);
    window.__sound = sound; // for listening tests, like __world
    sound.setActive(onScreen);
    sound.setEnabled(soundOn);
  });
}
// the chip toggles what the visitor sees: while the browser holds the sound, a click starts it
soundBtn.addEventListener('click', () => { startSound(); setSound(!(soundOn && ctx?.state === 'running')); });

// ---------------------------------------------------------------- the world
const webgl = (() => {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
})();

async function boot() {
  if (!webgl) throw new Error('no webgl');
  const { createWorld } = await import('./world.js');
  world = await createWorld(canvas);
  window.__world = world; // for screenshots and the HyperFrames render
  world.onChange(applyState);
  syncInset();
  onScroll();
  world.renderOnce();
  section.classList.add('is-live');
  soundBtn.hidden = !window.AudioContext;
  startSound();
  world.onFrame((w) => sound?.update(w));

  const pt = { x: 0, y: 0 };
  world.onFrame((w) => {
    const st = w.state;
    // the buttons sit on their exclamation marks while the map is showing
    if (section.classList.contains('is-map')) {
      for (const b of pins) {
        const hit = w.project(b.dataset.id, pt);
        b.hidden = !hit || (st.mode === 'place' && b.dataset.id !== st.place);
        if (hit) b.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`;
      }
    }
    // in the hero, the plain words sit just above the words in the sea
    if (section.classList.contains('is-hero') && w.textAnchor(pt)) {
      motto.style.transform = `translate(${Math.max(16, Math.min(pt.x, innerWidth - motto.offsetWidth - 16)).toFixed(1)}px, ${Math.max(92, pt.y - motto.offsetHeight - 12).toFixed(1)}px)`;
      motto.classList.add('is-placed');
    }
    // on the journey, a quiet label names the place whose mark just popped
    if (section.classList.contains('is-journey')) {
      const near = w.nearestPlace();
      if (near && w.project(near.id, pt, 'top')) {
        tag.querySelector('[data-tag-name]').textContent = near.name;
        tag.querySelector('[data-tag-place]').textContent = near.place;
        const half = tag.offsetWidth / 2 + 16;
        tag.style.transform = `translate(${Math.max(half, Math.min(pt.x, innerWidth - half)).toFixed(1)}px, ${Math.max(tag.offsetHeight + 104, pt.y).toFixed(1)}px)`;
        tag.classList.add('is-on');
      } else tag.classList.remove('is-on');
    } else tag.classList.remove('is-on');
    streaks.style.opacity = st.streak.toFixed(3);
  });

  // only draw while the section is on screen and the tab is visible
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen && !document.hidden) world.start(); else world.stop();
    sound?.setActive(onScreen);
  }, { rootMargin: '100px' });
  io.observe(section);
  document.addEventListener('visibilitychange', () => { if (document.hidden) world.stop(); else if (section.getBoundingClientRect().bottom > 0) world.start(); });

  // links can open a given moment: ?p=0.8 (scroll), &region=2, &place=cebu, &t=40 (flyover time)
  const q = new URLSearchParams(location.search);
  if (q.has('t')) world.setTime(Number(q.get('t')));
  if (q.has('p')) { scrollTo({ top: section.offsetTop + (section.offsetHeight - innerHeight) * Number(q.get('p')), behavior: 'auto' }); onScroll(); }
  if (q.has('region')) world.selectRegion(Number(q.get('region')));
  if (q.has('place')) world.focusPlace(q.get('place'));

  // clicking the woven land picks its island group; on a place, a drag turns the camera around it
  let down = null, last = null;
  canvas.addEventListener('pointerdown', (e) => {
    down = [e.clientX, e.clientY];
    if (current.mode !== 'place' || !section.classList.contains('is-map')) return;
    last = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    world.grab();
    canvas.setPointerCapture(e.pointerId);
    section.classList.add('is-turning');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!last) return;
    world.drag(e.clientX - last.x, e.clientY - last.y, (e.timeStamp - last.t) / 1000);
    last = { x: e.clientX, y: e.clientY, t: e.timeStamp };
  });
  // let go while moving and it keeps turning, slowing down; let go while still and it stops
  const letGo = (e) => { if (!last) return; world.release(e.timeStamp - last.t > 90); last = null; section.classList.remove('is-turning'); };
  canvas.addEventListener('pointerup', letGo);
  canvas.addEventListener('pointercancel', letGo);
  canvas.addEventListener('pointerup', (e) => {
    if (!down || !section.classList.contains('is-map') || current.mode === 'place') return;
    if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = world.pick(e.clientX, e.clientY);
    if (r && r !== current.region) world.selectRegion(r);
  });
}

boot().catch((err) => {
  window.__err = String(err && err.message || err);
  document.documentElement.classList.add('no-webgl');
  // without WebGL the map still works as a list: chips and the dossier, over the still image
  chips.forEach((c) => c.addEventListener('click', () => applyState({ mode: Number(c.dataset.region) ? 'region' : 'overview', region: Number(c.dataset.region), place: null })));
  dossier.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]'), rg = e.target.closest('[data-region-go]');
    if (go) applyState({ mode: 'place', region: PLACES.find((p) => p.id === go.dataset.go).region, place: go.dataset.go });
    if (rg) applyState({ mode: 'region', region: Number(rg.dataset.regionGo), place: null });
  });
  back.addEventListener('click', () => applyState(current.mode === 'place' ? { mode: 'region', region: current.region, place: null } : { mode: 'overview', region: 0, place: null }));
  pins.forEach((b) => (b.hidden = true));
});
