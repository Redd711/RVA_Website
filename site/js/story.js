// Story pages: the scroll position picks the lifecycle step, and how far into it you are.
const section = document.querySelector('.cycle');
const stage = section.querySelector('.cycle__stage');
const canvas = stage.querySelector('canvas');
const steps = [...section.querySelectorAll('.cycle__step')];
const rail = [...section.querySelectorAll('.cycle__rail li')];
const nowName = section.querySelector('[data-now-name]');
const nowNum = section.querySelector('[data-now-num]');

let cycle = null;
let active = -1;

function measure() {
  const mid = innerHeight * (innerWidth < 861 ? 0.66 : 0.5);
  let idx = 0, f = 0;
  steps.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (r.top <= mid) { idx = i; f = Math.min(1, Math.max(0, (mid - r.top) / r.height)); }
  });
  if (idx !== active) {
    active = idx;
    steps.forEach((el, i) => el.classList.toggle('is-now', i === idx));
    nowNum.textContent = `${idx + 1} of ${steps.length}`;
    nowName.textContent = steps[idx].querySelector('h3').textContent;
    cycle?.setStage(idx);
  }
  rail.forEach((li, i) => li.style.setProperty('--f', i < idx ? 1 : i === idx ? f : 0));
  cycle?.setProgress(f);
}
addEventListener('scroll', measure, { passive: true });
addEventListener('resize', measure);
measure();

(async () => {
  const gl = document.createElement('canvas');
  if (!(gl.getContext('webgl2') || gl.getContext('webgl'))) throw new Error('no webgl');
  const [{ mountCycle }, { STORIES }] = await Promise.all([import('./lifecycle.js'), import('./stories.js')]);
  const stages = STORIES[document.body.dataset.story].map((build) => build());
  cycle = await mountCycle(canvas, stages);
  cycle.setStage(Math.max(0, active));
  measure();
  cycle.renderOnce();
  stage.classList.add('is-live');
  // ?step=5&f=0.6 opens a given stage, for screenshots and links
  const q = new URLSearchParams(location.search);
  if (q.has('step')) {
    const el = steps[Math.min(steps.length, Number(q.get('step'))) - 1];
    const mid = innerHeight * (innerWidth < 861 ? 0.66 : 0.5);
    scrollTo({ top: scrollY + el.getBoundingClientRect().top - mid + el.offsetHeight * Number(q.get('f') ?? 0.3), behavior: 'auto' });
    measure();
  }
  new IntersectionObserver(([e]) => (e.isIntersecting ? cycle.start() : cycle.stop()), { rootMargin: '200px' }).observe(section);
})().catch(() => document.documentElement.classList.add('no-webgl'));
