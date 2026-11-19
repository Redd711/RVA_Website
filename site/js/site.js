// Habing Lahi — shared behaviour. No dependencies.
document.documentElement.classList.add('js');

const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// One-time "moments": add .is-in when a [data-moment] block enters the viewport.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { threshold: 0.25 });
document.querySelectorAll('[data-moment]').forEach((el) => io.observe(el));

// Pointer parallax: writes --rx / --ry (degrees) on the element. Off for touch.
function parallax(el, max) {
  if (!finePointer || !el) return;
  el.addEventListener('pointermove', (ev) => {
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', (x * max).toFixed(2) + 'deg');
    el.style.setProperty('--ry', (-y * max).toFixed(2) + 'deg');
  });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
}
parallax(document.querySelector('.stage'), 6);
parallax(document.querySelector('.atlas__view'), 4);

// ---------- Woven map ----------
const atlas = document.querySelector('.atlas');
if (atlas) {
  const pins = [...atlas.querySelectorAll('.pin')];
  const dossier = atlas.querySelector('.dossier');
  const img = dossier.querySelector('img');
  const fields = ['place', 'name', 'text'].map((k) => dossier.querySelector(`[data-f="${k}"]`));
  const more = dossier.querySelector('[data-f="link"]');

  function select(pin, focus) {
    pins.forEach((p) => p.setAttribute('aria-pressed', String(p === pin)));
    if (focus) pin.focus();
    const d = pin.dataset;
    const swap = () => {
      img.src = d.img; img.alt = d.alt;
      fields[0].textContent = d.place; fields[1].textContent = d.name; fields[2].textContent = d.text;
      more.href = d.link; more.textContent = d.linkText;
      dossier.classList.remove('is-swapping');
    };
    dossier.classList.add('is-swapping');
    setTimeout(swap, 220);
  }

  pins.forEach((pin) => pin.addEventListener('click', () => select(pin)));

  // Arrow keys move between visible pins (north to south order).
  atlas.querySelector('.atlas__plane').addEventListener('keydown', (ev) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[ev.key];
    if (!step) return;
    const live = pins.filter((p) => !p.classList.contains('is-dim'));
    const i = live.indexOf(document.activeElement);
    if (i < 0) return;
    ev.preventDefault();
    select(live[(i + step + live.length) % live.length], true);
  });

  atlas.querySelectorAll('[data-region-filter]').forEach((chip, _, chips) => {
    chip.addEventListener('click', () => {
      const r = chip.dataset.regionFilter;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      pins.forEach((p) => {
        const off = r !== 'all' && p.dataset.region !== r;
        p.classList.toggle('is-dim', off);
        p.tabIndex = off ? -1 : 0;
      });
      const first = pins.find((p) => !p.classList.contains('is-dim'));
      if (first) select(first);
    });
  });
}

// ---------- Gallery wall ----------
const wall = document.querySelector('.wall');
if (wall) {
  const arts = [...wall.querySelectorAll('.art')];
  document.querySelectorAll('[data-material]').forEach((chip, _, chips) => {
    chip.addEventListener('click', () => {
      const m = chip.dataset.material;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      wall.classList.toggle('is-filtered', m !== 'all');
      arts.forEach((a) => a.classList.toggle('is-hidden', m !== 'all' && a.dataset.mat !== m));
    });
  });

  const viewer = document.querySelector('.viewer');
  const vImg = viewer.querySelector('img');
  let opener = null;
  arts.forEach((a) => a.addEventListener('click', () => {
    opener = a;
    const src = a.querySelector('img');
    vImg.src = src.currentSrc || src.src; vImg.alt = src.alt;
    const t = a.querySelector('template').content.cloneNode(true);
    viewer.querySelector('.viewer__body').replaceChildren(t);
    viewer.showModal();
  }));
  viewer.addEventListener('close', () => opener && opener.focus());
  viewer.querySelector('.viewer__close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (ev) => { if (ev.target === viewer) viewer.close(); });
}
