/** Apparition progressive des blocs à l'entrée dans le viewport. */
export function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  // Décalage léger entre éléments frères pour un effet en cascade.
  document.querySelectorAll('.skills-grid, .projects, .goals, .exp-grid, .timeline').forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty('--rd', `${Math.min(i, 5) * 0.08}s`));
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  items.forEach((el) => io.observe(el));
}
