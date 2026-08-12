/* =====================================================================
   NABA NGO — scroll-driven 3D hero (homepage only)

   Behaviour, in order, driven entirely by scroll position (never by drag —
   the model is deliberately non-interactive):

     1. The model sits centred, screen off.
     2. It travels along a curved, rotating path toward the inline-end side
        of the screen (right in English, left in Arabic — the path mirrors).
     3. Its screen powers on and plays a warm "hello" boot animation.
     4. The greeting completes, then the model explodes apart into an
        exploded-view diagram of its internals.
     5. The page continues into the normal content sections.

   PLACEHOLDER MODEL — OPEN QUESTION #1
   ------------------------------------
   The subject of the model was never specified, so this builds a neutral
   procedural "device" from primitives: shell, glass, screen, board, battery,
   chips, camera module and back plate. It is deliberately generic and is not
   meant to ship as final art. To swap in a real model, replace buildDevice()
   with a GLTFLoader load, keep a mesh named "screen" carrying `screenMaterial`,
   and tag each mesh that should fly apart with
   `mesh.userData.explode = new THREE.Vector3(x, y, z)`. The timeline below
   needs no other changes.

   Progressive enhancement: this module only ever *adds* the animation. The hero
   copy, and every content section below it, is in the DOM regardless — with JS
   off, WebGL unavailable, reduced motion requested or a low-power device
   detected, the hero stays a normal static panel and the page is fully readable
   and indexable.
   ===================================================================== */

const hero = document.querySelector("[data-hero]");
const canvas = document.querySelector("[data-hero-canvas]");
const hint = document.querySelector("[data-hero-hint]");

/** Bail out before downloading Three.js at all if the 3D hero isn't wanted. */
function shouldSkip() {
  if (!hero || !canvas) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (navigator.connection && navigator.connection.saveData) return true;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true;
  try {
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return true;
  } catch {
    return true;
  }
  return false;
}

if (!shouldSkip()) {
  init().catch((err) => {
    // Any failure leaves the static hero in place — never a blank screen.
    console.warn("[naba] 3D hero disabled:", err);
    hero.removeAttribute("data-hero-active");
  });
}

/* ------------------------------ helpers ------------------------------ */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Normalised progress of `v` across [a, b]. */
const range = (v, a, b) => clamp01((v - a) / (b - a));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

async function init() {
  const THREE = await import("/assets/vendor/three.module.min.js");

  const isRTL = document.documentElement.dir === "rtl";
  const side = isRTL ? -1 : 1; // which way the model travels

  /* ------------------------------ scene ------------------------------ */

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearAlpha(0);
  if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Provisional palette, mirrored from site.css (--rose-600 / --olive-* / sand).
  const ROSE = 0x96284a;
  const OLIVE = 0x6f8352;
  const OLIVE_DARK = 0x4c5c3a;
  const SAND = 0xe7dfd1;
  const SHELL = 0x3a322c;

  scene.add(new THREE.HemisphereLight(0xfff6ec, 0x4a3f37, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3 * side, 4, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(ROSE, 1.2);
  rim.position.set(-4 * side, -1.5, -3);
  scene.add(rim);

  /* ------------------------------ model ------------------------------ */

  const device = new THREE.Group();
  scene.add(device);

  const std = (color, opts) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.25, ...opts });

  /**
   * @param geometry
   * @param material
   * @param home     resting position inside the assembled device
   * @param explode  offset applied at full explosion (the exploded-view fan-out)
   */
  function addPart(geometry, material, home, explode) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(home[0], home[1], home[2]);
    mesh.userData.home = mesh.position.clone();
    mesh.userData.explode = new THREE.Vector3(explode[0], explode[1], explode[2]);
    device.add(mesh);
    return mesh;
  }

  const screen = createScreenCanvas();
  const screenTexture = new THREE.CanvasTexture(screen.canvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace ?? screenTexture.colorSpace;
  screenTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const screenMaterial = new THREE.MeshStandardMaterial({
    map: screenTexture,
    emissiveMap: screenTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0, // "screen off" until the boot phase
    roughness: 0.35,
    metalness: 0,
  });

  function buildDevice() {
    /* Explode offsets fan the parts out along the device's own front-to-back
       assembly axis, with a slight vertical stagger. Read together with the yaw
       applied during the explode phase, that gives a proper exploded view
       rather than a pile of overlapping slabs. */

    // Back plate — the outermost shell, flies furthest back.
    addPart(new THREE.BoxGeometry(2.5, 3.5, 0.14), std(SHELL, { roughness: 0.7 }), [0, 0, -0.34], [0, -0.45, -2.7]);

    // Battery
    addPart(new THREE.BoxGeometry(1.7, 1.7, 0.2), std(OLIVE_DARK, { metalness: 0.5 }), [0, -0.55, -0.15], [0, -0.3, -1.9]);

    // Camera module
    const cam = addPart(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 28), std(0x15171a, { metalness: 0.8, roughness: 0.2 }), [0.72, 1.35, -0.22], [0.3 * side, 0.5, -1.9]);
    cam.rotation.x = Math.PI / 2;

    // Main board
    addPart(new THREE.BoxGeometry(2.1, 3.1, 0.06), std(OLIVE, { roughness: 0.75, metalness: 0.1 }), [0, 0, 0.02], [0, -0.1, -1.05]);

    // Components lifted clear of the board so it reads as populated.
    addPart(new THREE.BoxGeometry(0.5, 0.5, 0.09), std(0x20211f, { metalness: 0.6, roughness: 0.4 }), [-0.5, 0.85, 0.09], [-0.45 * side, 0.3, -0.55]);
    addPart(new THREE.BoxGeometry(0.36, 0.36, 0.08), std(0x20211f, { metalness: 0.6, roughness: 0.4 }), [0.45, 1.05, 0.09], [0.4 * side, 0.5, -0.55]);
    addPart(new THREE.BoxGeometry(0.9, 0.28, 0.07), std(SAND, { metalness: 0.7, roughness: 0.3 }), [0.1, 0.25, 0.09], [0.5 * side, -0.4, -0.5]);

    // Mid frame — the reference part everything else separates around.
    addPart(new THREE.BoxGeometry(2.56, 3.56, 0.42), std(SHELL, { metalness: 0.55, roughness: 0.45 }), [0, 0, 0], [0, 0, 0]);

    // Screen
    const screenMesh = addPart(new THREE.PlaneGeometry(2.16, 3.12), screenMaterial, [0, 0, 0.23], [0, 0.3, 1.2]);
    screenMesh.name = "screen";

    // Glass
    addPart(
      new THREE.BoxGeometry(2.46, 3.46, 0.05),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transmission: 0.4, transparent: true, opacity: 0.2,
        roughness: 0.06, metalness: 0, thickness: 0.2,
      }),
      [0, 0, 0.3],
      [0, 0.55, 2.3]
    );
  }

  buildDevice();

  /* ------------------------------ path ------------------------------
     A fixed curve: centre → arc through the upper middle → resting point on
     the inline-end side. The user cannot deviate from it; scroll position is
     the only input. */

  const travelPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -0.7),
    new THREE.Vector3(0.6 * side, 0.55, 1.1),
    new THREE.Vector3(1.85 * side, 0.1, 0.4),
    new THREE.Vector3(2.35 * side, -0.05, 0),
  ]);
  const pathPoint = new THREE.Vector3();

  /* ------------------------------ timeline ------------------------------ */

  const T = {
    holdEnd: 0.08,      // sits centred, screen off
    travelEnd: 0.36,    // travels along the path, rotating
    bootEnd: 0.46,      // screen wakes up
    helloEnd: 0.66,     // "hello" greeting plays out
    explodeEnd: 0.92,   // exploded view opens
    // 0.92 – 1.0: holds the exploded view, then the page moves on
  };

  let targetProgress = 0;
  let progress = 0; // eased follower — this is what produces the fluid motion
  let visible = true;
  let running = false;

  function readScroll() {
    const rect = hero.getBoundingClientRect();
    const track = hero.offsetHeight - window.innerHeight;
    targetProgress = track > 0 ? clamp01(-rect.top / track) : 0;
  }

  function applyFrame(p) {
    /* --- travel + rotation --- */
    const travel = easeInOut(range(p, T.holdEnd, T.travelEnd));
    travelPath.getPoint(travel, pathPoint);
    device.position.copy(pathPoint);

    // On phones there is no room beside the copy, so the model lives above it
    // and the copy sits in the lower half of the stage (see site.css).
    if (narrow) {
      device.position.x = 0; // sideways travel would carry it off-screen
      device.position.y += 2.2;
    }

    // Scale down slightly as it moves aside so the copy keeps the focus.
    const s = (1 - 0.18 * travel) * (narrow ? 0.55 : 1);
    device.scale.setScalar(s);

    // Rotating path: a turn and a half on the way over, settling face-on.
    device.rotation.y = (1 - travel) * -0.55 + travel * Math.PI * 2 * side * 0.75 * (1 - travel) + travel * 0.32 * side;
    device.rotation.x = 0.18 * (1 - travel) + 0.06 * travel;
    device.rotation.z = 0.22 * side * Math.sin(travel * Math.PI);

    /* --- screen wakes up --- */
    const boot = range(p, T.travelEnd, T.bootEnd);
    const hello = range(p, T.bootEnd, T.helloEnd);
    screen.draw(boot, hello);
    screenTexture.needsUpdate = true;
    // A brief over-bright flash as the backlight catches, then settle.
    screenMaterial.emissiveIntensity = easeOut(boot) * (1 + 0.7 * Math.sin(boot * Math.PI)) * 1.15;

    /* --- exploded view --- */
    const explode = easeInOut(range(p, T.helloEnd, T.explodeEnd));
    // A phone has no width to fan into, so the parts separate less far.
    const spread = explode * (narrow ? 0.5 : 1);
    for (const part of device.children) {
      const { home, explode: dir } = part.userData;
      part.position.set(
        home.x + dir.x * spread,
        home.y + dir.y * spread,
        home.z + dir.z * spread
      );
    }
    // Swing into a three-quarter view: the parts separate along the device's
    // own z axis, so it needs real yaw for that axis to project across the
    // screen and the layers to read as distinct.
    device.rotation.y += explode * (narrow ? 0.26 : 0.42) * side;
    device.rotation.x += explode * 0.2;
    // The fan-out is along +/-z, which the yaw projects diagonally across the
    // frame — pull back and recentre so the opened assembly stays in view.
    device.scale.multiplyScalar(1 - 0.24 * explode);
    if (!narrow) device.position.x -= explode * 0.5 * side;

    /* --- idle breathing while it waits at the top --- */
    if (p < T.holdEnd) {
      device.position.y += Math.sin(performance.now() / 1400) * 0.04;
      device.rotation.y += Math.sin(performance.now() / 2600) * 0.08;
    }

    if (hint) hint.style.opacity = String(1 - range(p, 0, 0.12));
  }

  let narrow = window.innerWidth < 720;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    narrow = w < 720;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 720 ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull the camera back on narrow viewports so the model still fits.
    camera.position.z = w < 720 ? 13 : 10;
    camera.updateProjectionMatrix();
  }

  // Exponential smoothing with a fixed time constant: scroll sets a target and
  // the model eases toward it. Framed in seconds rather than per-frame so the
  // motion feels identical at 30, 60 or 120fps.
  const SMOOTH_TAU = 0.16;
  let lastTime = 0;

  function frame(now) {
    if (!running) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 1 / 60;
    lastTime = now;

    progress += (targetProgress - progress) * (1 - Math.exp(-dt / SMOOTH_TAU));
    if (Math.abs(targetProgress - progress) < 0.0002) progress = targetProgress;

    applyFrame(progress);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = 0; // don't integrate the time spent paused
    requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
  }

  /* ------------------------------ wiring ------------------------------ */

  hero.setAttribute("data-hero-active", "true");
  resize();
  readScroll();
  progress = targetProgress;

  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", () => {
    resize();
    readScroll();
  });

  // Don't burn GPU while the hero is scrolled past.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      },
      { threshold: 0 }
    ).observe(hero);
  }
  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : visible && start();
  });

  start();
}

/* =====================================================================
   Screen contents — drawn to a 2D canvas used as the screen texture.
   Phase 1 (boot): the panel lights up from a thin line to full brightness.
   Phase 2 (hello): a warm bilingual greeting writes itself on.
   ===================================================================== */

function createScreenCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 740;
  const ctx = canvas.getContext("2d");

  // Fonts may not be ready on first paint; redraw once they are.
  if (document.fonts && document.fonts.ready) document.fonts.ready.catch(() => {});

  function draw(boot, hello) {
    const W = canvas.width;
    const H = canvas.height;

    // Screen off
    ctx.fillStyle = "#0b0908";
    ctx.fillRect(0, 0, W, H);
    if (boot <= 0) return;

    // Backlight opening from a horizontal sliver to the full panel.
    const open = easeOut(clamp01(boot * 1.4));
    const h = Math.max(2, H * open);
    const y = (H - h) / 2;

    const grad = ctx.createLinearGradient(0, y, W, y + h);
    grad.addColorStop(0, "#7a1e35");
    grad.addColorStop(0.55, "#96284a");
    grad.addColorStop(1, "#4c5c3a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, W, h);

    // Warm bloom while the backlight catches.
    const flash = Math.sin(clamp01(boot) * Math.PI);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 244, 232, ${0.5 * flash})`;
      ctx.fillRect(0, y, W, h);
    }

    if (hello <= 0 || open < 0.98) return;

    // Greeting, revealed left-to-right as it "writes" on.
    const reveal = easeOut(clamp01(hello * 1.15));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W * reveal, H);
    ctx.clip();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255, 240, 225, 0.75)";
    ctx.shadowBlur = 26;
    ctx.fillStyle = "#fdf6ee";

    ctx.font = "600 96px Inter, system-ui, sans-serif";
    ctx.fillText("hello", W / 2, H / 2 - 60);

    ctx.font = "700 88px Cairo, system-ui, sans-serif";
    ctx.fillText("أهلاً", W / 2, H / 2 + 70);

    ctx.shadowBlur = 0;
    ctx.restore();

    // Cursor riding the reveal edge, fading out as the greeting completes.
    if (reveal < 1) {
      ctx.fillStyle = `rgba(255, 246, 236, ${0.85 * (1 - reveal)})`;
      ctx.fillRect(W * reveal - 3, H / 2 - 150, 4, 300);
    }
  }

  return { canvas, ctx, draw };
}
