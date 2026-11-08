import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/manrope';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/main.css';

import { initNavigation } from './js/navigation.js';
import { initChapters } from './js/chapters.js';
import { initReveal } from './js/reveal.js';
import { initProjects } from './js/projects.js';
import { initTimeline } from './js/timeline.js';
import { initContactForm, initCopyButtons } from './js/contact.js';
import { loadScene } from './js/scene-loader.js';

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Chaque module est isolé : une erreur dans l'un ne bloque pas les autres.
const safe = (name, fn) => {
  try { return fn(); } catch (err) { console.error(`[portfolio] ${name} :`, err); return undefined; }
};

safe('navigation', initNavigation);
safe('reveal', initReveal);
safe('projets', initProjects);
safe('timeline', initTimeline);
safe('copie', initCopyButtons);
safe('formulaire', initContactForm);

const chapters = safe('chapitres', initChapters);
safe('scène 3D', () => loadScene(document.getElementById('scene'), chapters));
