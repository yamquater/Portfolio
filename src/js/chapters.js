/**
 * Suivi des chapitres : calcule une valeur continue « shape » (0 → 7)
 * à partir du défilement. La scène 3D s'en sert pour morpher ses formes,
 * le rail et le HUD pour indiquer le chapitre courant.
 */
export function initChapters() {
  const sections = [...document.querySelectorAll('.chapter')];
  const railLinks = [...document.querySelectorAll('[data-rail]')];
  const navLinks = [...document.querySelectorAll('.nav__list a[href^="#"]:not(.btn)')];
  const hudIndex = document.getElementById('hudIndex');
  const hudLabel = document.getElementById('hudLabel');

  const state = { shape: 0, index: 0, listeners: new Set() };
  let metrics = [];

  const measure = () => {
    metrics = sections.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height, shape: Number(el.dataset.shape) || 0 };
    });
  };

  const smooth = (t) => t * t * (3 - 2 * t);

  const update = () => {
    const probe = window.scrollY + window.innerHeight * 0.5;
    let i = metrics.findIndex((m) => probe < m.top + m.height);
    if (i === -1) i = metrics.length - 1;
    const m = metrics[i];
    const next = metrics[i + 1];
    const frac = Math.min(Math.max((probe - m.top) / m.height, 0), 1);

    // On reste sur la forme du chapitre puis on transite vers la suivante sur la fin.
    let shape = m.shape;
    if (next && frac > 0.55) shape = m.shape + (next.shape - m.shape) * smooth((frac - 0.55) / 0.45);
    state.shape = shape;

    if (i !== state.index || !hudLabel.textContent) {
      state.index = i;
      railLinks.forEach((a, k) => a.classList.toggle('is-active', k === i));
      const id = sections[i].id;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
      hudIndex.textContent = String(i).padStart(2, '0');
      hudLabel.textContent = sections[i].dataset.label || '';
    }
    state.listeners.forEach((fn) => fn(state));
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };

  measure();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); });
  // Les polices et images peuvent modifier la hauteur des sections.
  window.addEventListener('load', () => { measure(); onScroll(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);

  return {
    get shape() { return state.shape; },
    subscribe(fn) { state.listeners.add(fn); fn(state); return () => state.listeners.delete(fn); },
  };
}
