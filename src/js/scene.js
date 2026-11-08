/**
 * Scène 3D « Signal » — un nuage de particules qui se recompose à chaque chapitre.
 * Chaque forme raconte une étape du parcours :
 *   0 Intro        → noyau (une identité, un point de départ)
 *   1 À propos     → nœud torique (curiosité, connexions entre domaines)
 *   2 Compétences  → treillis de blocs (des briques assemblables)
 *   3 Projets      → écrans superposés (des produits livrés)
 *   4 Parcours     → spirale ascendante (une progression)
 *   5 Expériences  → circuit imprimé (du logiciel au matériel)
 *   6 Objectifs    → cible (une direction claire)
 *   7 Contact      → onde (un signal émis)
 *
 * Le morphing est calculé dans le vertex shader : le CPU ne fait que
 * permuter deux attributs et envoyer un uniform par image.
 */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, IcosahedronGeometry,
  LineBasicMaterial, LineSegments, PerspectiveCamera, Points, Scene, ShaderMaterial,
  WebGLRenderer, EdgesGeometry, MathUtils,
} from 'three';

const SHAPE_COUNT = 8;

/* ---------- Générateurs de formes (aléatoire déterministe) ---------- */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const generators = [
  // 0 — noyau : coquille de Fibonacci + cœur dense
  (n, r) => {
    const out = new Float32Array(n * 3);
    const shell = Math.floor(n * 0.72);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      let x, y, z;
      if (i < shell) {
        const yy = 1 - (i / (shell - 1)) * 2;
        const rad = Math.sqrt(1 - yy * yy);
        const th = golden * i;
        const R = 1.55 + (r() - 0.5) * 0.04;
        x = Math.cos(th) * rad * R; y = yy * R; z = Math.sin(th) * rad * R;
      } else {
        const u = r() * 2 - 1, th = r() * Math.PI * 2, R = Math.cbrt(r()) * 0.55;
        const rad = Math.sqrt(1 - u * u);
        x = Math.cos(th) * rad * R; y = u * R; z = Math.sin(th) * rad * R;
      }
      out.set([x, y, z], i * 3);
    }
    return out;
  },
  // 1 — nœud torique (2,3)
  (n, r) => {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const p = 2, q = 3;
      const cr = 0.95 + 0.42 * Math.cos(q * t);
      const cx = cr * Math.cos(p * t), cy = cr * Math.sin(p * t), cz = 0.42 * Math.sin(q * t);
      const a = r() * Math.PI * 2, tube = 0.16 * Math.sqrt(r());
      out.set([cx + Math.cos(a) * tube, cy + Math.sin(a) * tube, cz + Math.sin(a * 1.3) * tube], i * 3);
    }
    return out;
  },
  // 2 — treillis 3×3×3 de cubes (arêtes)
  (n, r) => {
    const out = new Float32Array(n * 3);
    const step = 0.92, half = 0.3;
    for (let i = 0; i < n; i++) {
      const cx = (Math.floor(r() * 3) - 1) * step;
      const cy = (Math.floor(r() * 3) - 1) * step;
      const cz = (Math.floor(r() * 3) - 1) * step;
      const axis = Math.floor(r() * 3);
      const s1 = r() < 0.5 ? -half : half, s2 = r() < 0.5 ? -half : half;
      const t = (r() * 2 - 1) * half;
      const v = axis === 0 ? [t, s1, s2] : axis === 1 ? [s1, t, s2] : [s1, s2, t];
      out.set([cx + v[0], cy + v[1], cz + v[2]], i * 3);
    }
    return out;
  },
  // 3 — trois écrans en cascade (cadre + lignes d'interface)
  (n, r) => {
    const out = new Float32Array(n * 3);
    const w = 1.5, h = 0.95;
    for (let i = 0; i < n; i++) {
      const layer = Math.floor(r() * 3);
      const ox = (layer - 1) * 0.45, oy = (1 - layer) * 0.35, oz = (layer - 1) * -0.7;
      let x, y;
      if (r() < 0.45) { // cadre
        const e = r() * 4, t = r() * 2 - 1;
        if (e < 1) { x = t * w; y = h; } else if (e < 2) { x = t * w; y = -h; } else if (e < 3) { x = w; y = t * h; } else { x = -w; y = t * h; }
      } else { // lignes de contenu
        const row = Math.floor(r() * 6);
        const len = [1.6, 1.1, 2.2, 0.9, 1.9, 1.3][row];
        x = -w + 0.2 + r() * len; y = h - 0.3 - row * 0.28;
      }
      out.set([x + ox, y + oy, oz], i * 3);
    }
    return out;
  },
  // 4 — double spirale ascendante
  (n, r) => {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = r();
      const strand = r() < 0.5 ? 0 : Math.PI;
      const a = t * Math.PI * 6 + strand;
      const R = 0.45 + t * 0.85;
      const j = (r() - 0.5) * 0.06;
      out.set([Math.cos(a) * R + j, t * 3.2 - 1.6, Math.sin(a) * R + j], i * 3);
    }
    return out;
  },
  // 5 — circuit imprimé : puce centrale, broches et pistes
  (n, r) => {
    const out = new Float32Array(n * 3);
    const tracks = [];
    const tr = rng(42);
    for (let k = 0; k < 28; k++) {
      const side = k % 4, off = (Math.floor(k / 4) - 3) * 0.16;
      const L = 0.6 + tr() * 0.9, bend = (tr() - 0.5) * 1.2;
      tracks.push({ side, off, L, bend });
    }
    for (let i = 0; i < n; i++) {
      let x, y;
      const pick = r();
      if (pick < 0.3) { // bord de la puce
        const e = r() * 4, t = r() * 2 - 1, s = 0.55;
        if (e < 1) { x = t * s; y = s; } else if (e < 2) { x = t * s; y = -s; } else if (e < 3) { x = s; y = t * s; } else { x = -s; y = t * s; }
      } else if (pick < 0.38) { // cœur
        x = (r() - 0.5) * 0.5; y = (r() - 0.5) * 0.5;
      } else { // pistes en L
        const tk = tracks[Math.floor(r() * tracks.length)];
        const t = r();
        const d1 = 0.55 + Math.min(t, 0.5) * 2 * tk.L * 0.5;
        const d2 = t > 0.5 ? (t - 0.5) * 2 * tk.bend : 0;
        const along = d1, across = tk.off + d2;
        if (tk.side === 0) { x = along; y = across; } else if (tk.side === 1) { x = -along; y = across; } else if (tk.side === 2) { x = across; y = along; } else { x = across; y = -along; }
      }
      out.set([x, y, (r() - 0.5) * 0.04], i * 3);
    }
    return out;
  },
  // 6 — cible : anneaux concentriques inclinés
  (n, r) => {
    const out = new Float32Array(n * 3);
    const radii = [0.25, 0.7, 1.15, 1.6];
    for (let i = 0; i < n; i++) {
      const k = Math.floor(Math.pow(r(), 0.8) * radii.length);
      const a = r() * Math.PI * 2, R = radii[k] + (r() - 0.5) * 0.05;
      out.set([Math.cos(a) * R, Math.sin(a) * R, (k - 1.5) * -0.12], i * 3);
    }
    return out;
  },
  // 7 — onde : surface de signal qui se propage depuis le centre
  (n, r) => {
    const out = new Float32Array(n * 3);
    const side = Math.ceil(Math.sqrt(n));
    for (let i = 0; i < n; i++) {
      const gx = (i % side) / (side - 1) * 2 - 1, gz = Math.floor(i / side) / (side - 1) * 2 - 1;
      const x = gx * 1.9, z = gz * 1.9, d = Math.hypot(x, z);
      const y = Math.cos(d * 3.2) * 0.32 * Math.exp(-d * 0.45);
      out.set([x, y - 0.1, z], i * 3);
    }
    return out;
  },
];

/* ---------- Shaders ---------- */
const vertexShader = /* glsl */ `
  uniform float uMix;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uDrift;
  attribute vec3 posA;
  attribute vec3 posB;
  attribute float aSeed;
  varying float vSeed;
  varying float vDepth;
  void main() {
    // Chaque particule part avec un léger décalage : la transition se « propage ».
    float m = smoothstep(aSeed * 0.35, aSeed * 0.35 + 0.65, uMix);
    vec3 p = mix(posA, posB, m);
    // Arc pendant la transition : les particules s'écartent puis se reposent.
    p += normalize(p + 0.0001) * sin(m * 3.14159) * 0.35 * aSeed;
    p += uDrift * 0.025 * vec3(
      sin(uTime * 0.7 + aSeed * 40.0),
      cos(uTime * 0.6 + aSeed * 31.0),
      sin(uTime * 0.5 + aSeed * 17.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.55 + aSeed * 0.9) / -mv.z;
    vSeed = aSeed;
    vDepth = smoothstep(9.0, 4.0, -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uIce;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vSeed;
  varying float vDepth;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uIce, uAccent, step(0.86, vSeed));
    gl_FragColor = vec4(col, a * uOpacity * (0.35 + 0.65 * vDepth));
  }
`;

/* ---------- Scène ---------- */
export function createScene(container, chapters, opts) {
  const { particles: N, dpr, links, reducedMotion } = opts;

  const renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(0, 0, 6);

  const rig = new Group();     // position dans l'écran (selon chapitre / format)
  const spin = new Group();    // rotation lente + réaction à la souris
  rig.add(spin);
  scene.add(rig);

  // Formes précalculées (une fois, ~quelques ms)
  const shapes = generators.map((gen, k) => new BufferAttribute(gen(N, rng(7 + k * 101)), 3));
  const seeds = new Float32Array(N);
  const sr = rng(999);
  for (let i = 0; i < N; i++) seeds[i] = sr();

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', shapes[0]);
  geometry.setAttribute('posA', shapes[0]);
  geometry.setAttribute('posB', shapes[1]);
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));

  const material = new ShaderMaterial({
    vertexShader, fragmentShader,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: {
      uMix: { value: 0 }, uTime: { value: 0 }, uSize: { value: 26 },
      uPixelRatio: { value: renderer.getPixelRatio() }, uOpacity: { value: 0.9 },
      uDrift: { value: reducedMotion ? 0 : 1 },
      uIce: { value: new Color('#bcd3e6') }, uAccent: { value: new Color('#c6ef6a') },
    },
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  spin.add(points);

  // Armature filaire discrète au centre : donne une lecture « objet » et de la profondeur.
  let wire = null;
  if (links) {
    wire = new LineSegments(
      new EdgesGeometry(new IcosahedronGeometry(0.42, 1)),
      new LineBasicMaterial({ color: 0xc6ef6a, transparent: true, opacity: 0.35 }),
    );
    spin.add(wire);
  }

  /* ---- Entrées ---- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  let scrollVel = 0, lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    scrollVel += (window.scrollY - lastY) * 0.0006;
    lastY = window.scrollY;
  }, { passive: true });

  /* ---- Mise en page ---- */
  let wide = true, aspect = 1;
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    aspect = w / h;
    wide = w > 900;
    camera.aspect = aspect;
    // Sur écran étroit, on recule la caméra pour que la forme tienne en largeur.
    camera.position.z = aspect < 0.8 ? 6 / Math.max(aspect, 0.45) * 0.62 : 6;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  resize();
  window.addEventListener('resize', resize);

  /* ---- Boucle ---- */
  let shape = chapters?.shape ?? 0;
  let a = -1;
  let time = 0, last = performance.now();
  const target = { x: 0, y: 0, opacity: 0.9, scale: 1 };

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;

    // Lissage cinématique de la forme vers la cible issue du défilement.
    const goal = MathUtils.clamp(chapters?.shape ?? 0, 0, SHAPE_COUNT - 1);
    shape += (goal - shape) * Math.min(1, dt * 3.2);
    if (Math.abs(goal - shape) < 0.0005) shape = goal;

    const base = Math.min(Math.floor(shape), SHAPE_COUNT - 2);
    if (base !== a) {
      a = base;
      geometry.setAttribute('posA', shapes[a]);
      geometry.setAttribute('posB', shapes[a + 1]);
    }
    material.uniforms.uMix.value = shape - a;
    material.uniforms.uTime.value = time;

    // Position à l'écran : à droite du texte sur grand écran, en haut sur mobile.
    const inHero = 1 - MathUtils.clamp(shape, 0, 1);
    const halfW = Math.tan(MathUtils.degToRad(22.5)) * camera.position.z * aspect;
    if (wide) {
      target.x = MathUtils.clamp(halfW * 0.5, 1.6, 3.2);
      target.y = 0;
      target.opacity = 0.55 + 0.4 * inHero;
      target.scale = 1;
    } else {
      target.x = 0;
      target.y = 1.15 * inHero + 0.2 * (1 - inHero);
      target.opacity = 0.3 + 0.55 * inHero;
      target.scale = 0.82;
    }
    const k = Math.min(1, dt * 2.5);
    rig.position.x += (target.x - rig.position.x) * k;
    rig.position.y += (target.y - rig.position.y) * k;
    rig.scale.setScalar(rig.scale.x + (target.scale - rig.scale.x) * k);
    material.uniforms.uOpacity.value += (target.opacity - material.uniforms.uOpacity.value) * k;

    // Rotation : dérive lente + impulsion du défilement + suivi du pointeur.
    scrollVel *= 0.92;
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    if (!reducedMotion) spin.rotation.y += dt * 0.12 + scrollVel;
    spin.rotation.x = -0.25 + pointer.y * 0.35;
    rig.rotation.y = pointer.x * 0.45;
    camera.position.x = pointer.x * 0.25;
    camera.position.y = -pointer.y * 0.18;
    camera.lookAt(rig.position.x * 0.15, 0, 0);

    if (wire) {
      wire.rotation.x += dt * 0.4;
      wire.rotation.z += dt * 0.25;
      wire.material.opacity = 0.35 * inHero;
      wire.visible = inHero > 0.01;
    }

    renderer.render(scene, camera);
  };

  // Pause quand l'onglet est caché (économie batterie / CPU).
  const run = () => { last = performance.now(); renderer.setAnimationLoop(frame); };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) renderer.setAnimationLoop(null); else run();
  });

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    renderer.setAnimationLoop(null);
    container.classList.remove('is-ready');
    container.classList.add('is-fallback');
  });

  run();
  return Promise.resolve();
}
