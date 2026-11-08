/** Menu mobile, en-tête au défilement et lien actif. */
export function initNavigation() {
  const topbar = document.getElementById('topbar');
  const nav = document.getElementById('nav');
  const btn = document.getElementById('menuBtn');

  const onScroll = () => topbar.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('.sr-only').textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };

  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); btn.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (mq) => { if (mq.matches) setOpen(false); });
}
