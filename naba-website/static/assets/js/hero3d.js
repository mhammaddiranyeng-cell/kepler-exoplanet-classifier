/* =====================================================================
   NABA NGO — scroll-driven 3D hero (homepage only)

   The model is a picture frame holding NABA's current headline activity.
   Driven entirely by scroll position (never by drag — deliberately
   non-interactive):

     1. The frame sits centred, its picture dark.
     2. It travels a fixed, rotating path toward the inline-end side of the
        screen (right in English, left in Arabic — the path mirrors).
     3. The picture lights up and the caption writes itself on, like a frame
        waking up.
     4. The frame then opens into an exploded view — glass, photo, mount board
        and backing separating layer by layer.
     5. The page continues into the normal content sections.

   THE PHOTOGRAPH
   --------------
   The frame displays /assets/img/hero-frame.jpg when that file exists. Until
   it does, it falls back to a drawn placeholder carrying the same caption, so
   the sequence is never broken by a missing asset. Drop in a landscape-ish
   photo of the current activity (Summer Camp 2026) at roughly 900x1200 and it
   appears automatically — swap the file each time the headline activity
   changes, and edit CAPTION below to match.

   Progressive enhancement: this module only ever *adds* the animation. The hero
   copy, and every content section below it, is in the DOM regardless — with JS
   off, WebGL unavailable, reduced motion requested or a low-power device
   detected, the hero stays a normal static panel and the page is fully readable
   and indexable.
   ===================================================================== */

/** The activity the frame is currently showing. Update alongside the photo. */
const CAPTION = {
  en: { line1: "Summer Camp 2026", line2: "Second Edition" },
  ar: { line1: "مخيم نبا الصيفي 2026", line2: "النسخة الثانية" },
};
const PHOTO_SRC = "/assets/img/hero-frame.jpg";

const hero = document.querySelector("[data-hero]");
const canvas = document.querySelector("[data-hero-canvas]");
const hint = document.querySelector("[data-hero-hint]");

/**
 * Why the 3D hero would be skipped, or null to run it. Returning a reason
 * rather than a boolean so the console says exactly what happened — a silent
 * fallback is impossible to debug on someone else's machine.
 */
function skipReason() {
  if (!hero || !canvas) return "hero markup not found on this page";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return "the system is set to Reduce Motion (macOS: System Settings > Accessibility > Display > Reduce motion; Windows: Settings > Accessibility > Visual effects > Animation effects)";
  if (navigator.connection && navigator.connection.saveData) return "the browser is in Data Saver mode";
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return "this device reports 2GB RAM or less";
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
    return "this device reports 2 CPU cores or fewer";
  try {
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl")))
      return "WebGL is unavailable — in Chrome check chrome://settings > System > 'Use graphics acceleration when available', and chrome://gpu for details";
  } catch (err) {
    return "WebGL threw on startup: " + err.message;
  }
  return null;
}

// A debug handle, so a single line in the console explains the hero's state.
window.__nabaHero = { status: "starting", reason: null };

const reason = skipReason();
if (reason) {
  window.__nabaHero.status = "skipped";
  window.__nabaHero.reason = reason;
  console.info("[naba] 3D hero skipped: " + reason + ". The page works normally without it.");
} else {
  init()
    .then(() => {
      window.__nabaHero.status = "running";
      console.info("[naba] 3D hero running — scroll the homepage to drive it.");
    })
    .catch((err) => {
      // Any failure leaves the static hero in place — never a blank screen.
      window.__nabaHero.status = "failed";
      window.__nabaHero.reason = String(err && err.message ? err.message : err);
      console.error("[naba] 3D hero failed to start:", err);
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

  // Brand palette, mirrored from site.css (sampled from the NABA logo).
  const BRONZE = 0x8a4a20;
  const BRONZE_DARK = 0x6b3418;
  const BRONZE_LIGHT = 0xc08040;
  const GLOBE = 0x1b7ba0;
  const SAND = 0xebdfd0;
  const BACKING = 0x4c3b2c;

  scene.add(new THREE.HemisphereLight(0xfff6ec, 0x4a3f37, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3 * side, 4, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(BRONZE_LIGHT, 1.2);
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

  const screen = createPictureCanvas(document.documentElement.lang === "ar" ? "ar" : "en");
  const screenTexture = new THREE.CanvasTexture(screen.canvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace ?? screenTexture.colorSpace;
  screenTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const screenMaterial = new THREE.MeshStandardMaterial({
    map: screenTexture,
    emissiveMap: screenTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0, // picture unlit until the wake-up phase
    roughness: 0.35,
    metalness: 0,
  });

  function buildDevice() {
    /* A picture frame, built back to front. Explode offsets fan the layers out
       along the frame's own front-to-back axis with a slight vertical stagger;
       read together with the yaw applied during the explode phase, that gives a
       proper exploded view rather than a pile of overlapping slabs. */

    const W = 2.5;
    const H = 3.4;

    // Backing board — the outermost layer, flies furthest back.
    addPart(new THREE.BoxGeometry(W, H, 0.09), std(BACKING, { roughness: 0.85, metalness: 0.05 }), [0, 0, -0.2], [0, -0.45, -2.7]);

    // Hanging bracket on the backing board.
    addPart(new THREE.BoxGeometry(0.5, 0.16, 0.05), std(BRONZE_DARK, { metalness: 0.7, roughness: 0.35 }), [0, 1.15, -0.27], [0, -0.15, -3.1]);

    // Mount board (the mat), with its window cut visible as an inset face.
    addPart(new THREE.BoxGeometry(W - 0.06, H - 0.06, 0.04), std(SAND, { roughness: 0.9, metalness: 0 }), [0, 0, -0.13], [0, -0.15, -1.35]);

    // The photograph itself.
    const photo = addPart(new THREE.PlaneGeometry(W - 0.52, H - 0.58), screenMaterial, [0, 0, -0.09], [0, 0.15, -0.2]);
    photo.name = "screen"; // kept as "screen" — the timeline drives it by name

    // Glass.
    addPart(
      new THREE.BoxGeometry(W - 0.1, H - 0.1, 0.03),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transmission: 0.45, transparent: true, opacity: 0.18,
        roughness: 0.05, metalness: 0, thickness: 0.15,
      }),
      [0, 0, 0.02],
      [0, 0.5, 1.5]
    );

    // Frame moulding — four rails, so the frame reads as a frame and can come
    // apart at the corners like a real one.
    const railV = new THREE.BoxGeometry(0.22, H, 0.26);
    const railH = new THREE.BoxGeometry(W - 0.44, 0.22, 0.26);
    const moulding = () => std(BRONZE, { metalness: 0.45, roughness: 0.4 });
    addPart(railV, moulding(), [-(W / 2 - 0.11), 0, 0.05], [-1.15 * side, 0, 2.5]);
    addPart(railV, moulding(), [W / 2 - 0.11, 0, 0.05], [1.15 * side, 0, 2.5]);
    addPart(railH, moulding(), [0, H / 2 - 0.11, 0.05], [0, 1.0, 2.5]);
    addPart(railH, moulding(), [0, -(H / 2 - 0.11), 0.05], [0, -1.0, 2.5]);
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

    /* --- the picture wakes up --- */
    const boot = range(p, T.travelEnd, T.bootEnd);
    const hello = range(p, T.bootEnd, T.helloEnd);
    screen.draw(boot, hello);
    screenTexture.needsUpdate = true;
    // A brief over-bright bloom as the picture catches the light, then settle.
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

function createPictureCanvas(lang) {
  const canvas = document.createElement("canvas");
  canvas.width = 620;
  canvas.height = 820;
  const ctx = canvas.getContext("2d");

  // The real photograph, if it has been committed. Until then the placeholder
  // below stands in and the sequence plays identically.
  let photo = null;
  const img = new Image();
  img.onload = () => { photo = img; };
  img.src = PHOTO_SRC;

  const caption = CAPTION[lang] || CAPTION.en;

  function draw(boot, hello) {
    const W = canvas.width;
    const H = canvas.height;

    // Unlit.
    ctx.fillStyle = "#140e09";
    ctx.fillRect(0, 0, W, H);
    if (boot <= 0) return;

    // The picture lights up from a band in the middle outward.
    const open = easeOut(clamp01(boot * 1.4));
    const h = Math.max(2, H * open);
    const y = (H - h) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y, W, h);
    ctx.clip();

    if (photo) {
      // Cover-fit the photograph into the frame aperture.
      const scale = Math.max(W / photo.width, H / photo.height);
      const dw = photo.width * scale;
      const dh = photo.height * scale;
      ctx.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      const grad = ctx.createLinearGradient(0, y, W, y + h);
      grad.addColorStop(0, "#6b3418");
      grad.addColorStop(0.55, "#8a4a20");
      grad.addColorStop(1, "#1b7ba0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, W, h);
    }

    // Warm bloom as it catches the light.
    const flash = Math.sin(clamp01(boot) * Math.PI);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 240, 220, ${0.5 * flash})`;
      ctx.fillRect(0, y, W, h);
    }
    ctx.restore();

    if (hello <= 0 || open < 0.98) return;

    // Caption writes itself on across the foot of the picture.
    const reveal = easeOut(clamp01(hello * 1.15));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W * reveal, H);
    ctx.clip();

    // Scrim so the caption stays legible over any photograph.
    const scrim = ctx.createLinearGradient(0, H * 0.58, 0, H);
    scrim.addColorStop(0, "rgba(20, 14, 9, 0)");
    scrim.addColorStop(1, "rgba(20, 14, 9, 0.82)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H * 0.58, W, H * 0.42);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fdf6ee";
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 12;

    const font = lang === "ar" ? "Cairo" : "Inter";
    const maxWidth = W * 0.84;

    /** Step the size down until the line fits the aperture — Arabic and
        English caption lengths differ a lot, so this can't be a fixed size. */
    const fit = (text, weight, startSize) => {
      let size = startSize;
      ctx.font = `${weight} ${size}px ${font}, system-ui, sans-serif`;
      while (ctx.measureText(text).width > maxWidth && size > 18) {
        size -= 2;
        ctx.font = `${weight} ${size}px ${font}, system-ui, sans-serif`;
      }
    };

    fit(caption.line1, 700, 46);
    ctx.fillText(caption.line1, W / 2, H * 0.76);
    ctx.fillStyle = "rgba(253, 246, 238, 0.82)";
    fit(caption.line2, 400, 32);
    ctx.fillText(caption.line2, W / 2, H * 0.83);

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  return { canvas, ctx, draw };
}
