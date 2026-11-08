/**
 * Chargement différé de la scène 3D :
 * - attend que la page soit interactive (requestIdleCallback) pour ne pas pénaliser le LCP ;
 * - vérifie la disponibilité de WebGL, sinon affiche un halo statique ;
 * - adapte la qualité à l'appareil (mobile, mémoire, cœurs CPU).
 */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function pickQuality() {
  const mobile = window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
  const lowMem = (navigator.deviceMemory || 8) <= 4;
  const lowCpu = (navigator.hardwareConcurrency || 8) <= 4;
  if (mobile || (lowMem && lowCpu)) return { particles: 2600, dpr: 1.5, links: false };
  if (lowMem || lowCpu) return { particles: 4200, dpr: 1.5, links: true };
  return { particles: 6400, dpr: 2, links: true };
}

export function loadScene(container, chapters) {
  if (!container) return;
  if (!hasWebGL()) { container.classList.add('is-fallback'); return; }

  const start = () => {
    import('./scene.js')
      .then(({ createScene }) => createScene(container, chapters, {
        ...pickQuality(),
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      }))
      .then(() => container.classList.add('is-ready'))
      .catch((err) => {
        console.error('[portfolio] scène 3D indisponible :', err);
        container.classList.add('is-fallback');
      });
  };

  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 });
  else setTimeout(start, 300);
}
