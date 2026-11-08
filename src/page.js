// Entrée légère pour les pages secondaires (CV, merci, 404) : pas de scène 3D.
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/manrope';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/main.css';
import './styles/cv.css';

document.querySelectorAll('[data-print]').forEach((btn) => btn.addEventListener('click', () => window.print()));
