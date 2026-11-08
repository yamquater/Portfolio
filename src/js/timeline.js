/** Timeline : ligne de progression liée au défilement + accordéon. */
export function initTimeline() {
  const tl = document.getElementById('timeline');
  if (!tl) return;
  const items = [...tl.querySelectorAll('.tl-item')];

  tl.addEventListener('click', (e) => {
    const head = e.target.closest('.tl-item__head');
    if (!head) return;
    head.setAttribute('aria-expanded', String(head.getAttribute('aria-expanded') !== 'true'));
  });

  let ticking = false;
  const update = () => {
    ticking = false;
    const r = tl.getBoundingClientRect();
    const probe = window.innerHeight * 0.6;
    const p = Math.min(Math.max((probe - r.top) / r.height, 0), 1);
    tl.style.setProperty('--progress', p.toFixed(3));
    items.forEach((it) => {
      const node = it.querySelector('.tl-item__node').getBoundingClientRect();
      it.classList.toggle('is-reached', node.top < probe);
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}
