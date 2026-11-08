/** Cartes projets : inclinaison 3D au survol + ouverture des études de projet. */
export function initProjects() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (finePointer && !reduced) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--mx', `${x * 100}%`);
          card.style.setProperty('--my', `${y * 100}%`);
          card.style.transform = `perspective(1200px) rotateX(${(0.5 - y) * 4}deg) rotateY(${(x - 0.5) * 5}deg) translateZ(0)`;
        });
      });
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        card.style.transform = '';
      });
    });
  }

  let lastTrigger = null;

  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dlg = document.getElementById(btn.dataset.open);
      if (!dlg || typeof dlg.showModal !== 'function') return;
      lastTrigger = btn;
      dlg.showModal();
      document.body.classList.add('dialog-open');
    });
  });

  document.querySelectorAll('dialog.case').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      // Clic sur le fond (hors contenu) ou sur le bouton fermer.
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
    dlg.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      lastTrigger?.focus();
    });
  });
}
