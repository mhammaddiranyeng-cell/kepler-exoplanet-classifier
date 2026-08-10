/*
 * mac3d.js — the Macintosh 128K stage.
 *
 * The machine itself is modelled in Blender (see model/build_mac128k.py) and
 * loaded here as a glTF with one named node per component. This file owns the
 * scene, the lighting, the live screen, and the exploded view.
 *
 * The exploded view is driven by a single scalar, `explode` (0..1), which the
 * scroll layer sets. Part placement is a pure function of it, which is what
 * makes the teardown exactly reversible: scrolling back up runs the same
 * arithmetic backwards, so the machine reassembles with no drift.
 */

import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
// Smoothstep, so parts ease out of and back into the chassis.
const ease = (t) => t * t * (3 - 2 * t);

function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

/* ------------------------------------------------------------------ *
 * Procedural textures
 *
 * The geometry comes from Blender, but these three surfaces are still drawn
 * in code: the board traces (so they never repeat), the signatures (so the
 * names stay real text), and the screen (which has to be live).
 * ------------------------------------------------------------------ */

// Copper traces, laid out as a constrained random walk on a grid.
function pcbTexture(seed = 7) {
  const [c, g] = canvas2d(1024, 1024);
  g.fillStyle = '#1d5137';
  g.fillRect(0, 0, 1024, 1024);

  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

  g.strokeStyle = '#2f7a54';
  g.lineWidth = 5;
  g.lineCap = 'round';
  for (let i = 0; i < 160; i++) {
    let x = Math.floor(rnd() * 32) * 32;
    let y = Math.floor(rnd() * 32) * 32;
    g.beginPath();
    g.moveTo(x, y);
    const steps = 4 + Math.floor(rnd() * 9);
    for (let k = 0; k < steps; k++) {
      const d = (rnd() > 0.5 ? 1 : -1) * (32 + Math.floor(rnd() * 4) * 32);
      if (rnd() > 0.5) x += d; else y += d;
      g.lineTo(x, y);
    }
    g.stroke();
  }

  g.fillStyle = '#c9a227';
  for (let i = 0; i < 620; i++) {
    const x = Math.floor(rnd() * 32) * 32;
    const y = Math.floor(rnd() * 32) * 32;
    g.beginPath();
    g.arc(x, y, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#1d5137';
    g.beginPath();
    g.arc(x, y, 2.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#c9a227';
  }

  g.fillStyle = 'rgba(232,232,220,.45)';
  g.font = '18px monospace';
  for (let i = 0; i < 90; i++) {
    g.fillText(['U' + i, 'R' + i, 'C' + i, 'J' + i][i % 4], rnd() * 980, rnd() * 1000);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// The 47 signatures moulded into the inside of the rear case.
function signatureTexture() {
  const [c, g] = canvas2d(1024, 512);
  g.fillStyle = '#c6bb9f';
  g.fillRect(0, 0, 1024, 512);
  const names = [
    'Peggy Alexio', 'Colette Askeland', 'Bill Atkinson', 'Steve Balog',
    'Bob Belleville', 'Mike Boich', 'Bill Bull', 'Matt Carter',
    'Berry Cash', 'Debi Coleman', 'George Crow', 'Donn Denman',
    'Christopher Espinosa', 'Bill Fernandez', 'Martin Haeberli',
    'Andy Hertzfeld', 'Joanna Hoffman', 'Rod Holt', 'Bruce Horn',
    'Hap Horn', 'Brian Howard', 'Steve Jobs', 'Larry Kenyon',
    'Patti King', 'Daniel Kottke', 'Angeline Lo', 'Ivan Mach',
    'Jerrold Manock', 'Mary Ellen McCammon', 'Vicki Milledge',
    'Mike Murray', 'Ron Nicholson Jr.', 'Terry Oyama', 'Benjamin Pang',
    'Jef Raskin', 'Ed Riddle', 'Brian Robertson', 'Dave Vasquez',
    'Burrell Smith', 'Bryan Stearns', 'Lynn Takahashi', 'Guy “Bud” Tribble',
    'Randy Wigginton', 'Linda Wilkin', 'Steve Capps', 'Pamela Wyman'
  ];
  names.forEach((n, i) => {
    const col = i % 3, row = (i / 3) | 0;
    g.save();
    g.translate(40 + col * 330, 54 + row * 30);
    g.rotate((-3 + (i % 5)) * 0.014);
    // Slightly darker than the case, as a moulded impression reads.
    g.fillStyle = '#5c5542';
    g.font = 'italic ' + (23 + (i % 4) * 2) +
      'px "Segoe Script","Bradley Hand","Snell Roundhand",cursive';
    g.fillText(n, 0, 0);
    g.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------------ *
 * The screen — a live 512 x 342 Macintosh display
 * ------------------------------------------------------------------ */

class MacScreen {
  constructor() {
    // The 128K's exact framebuffer: 512 x 342, one bit per pixel.
    [this.canvas, this.g] = canvas2d(512, 342);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.flipY = false;   // glTF UVs
    this.mode = 'boot';
    this.t = 0;
    this.draw(0);
  }

  set(mode) {
    if (this.mode !== mode) { this.mode = mode; this.t = 0; }
  }

  draw(dt) {
    this.t += dt;
    const g = this.g;
    const on = '#e9f6ec';   // P4 phosphor
    const off = '#0d1310';

    g.save();
    // Orientation is handled once by texture.flipY on the CanvasTexture;
    // rotating here as well turned the picture upside down.
    g.fillStyle = off;
    g.fillRect(0, 0, 512, 342);
    g.fillStyle = on;
    g.strokeStyle = on;
    g.lineWidth = 2;

    if (this.mode !== 'off') {
      if (this.mode === 'boot') this.drawHappyMac(g, false);
      else if (this.mode === 'sad') this.drawHappyMac(g, true);
      else if (this.mode === 'hello') this.drawHello(g);
      else this.drawFinder(g, on, off);
    }

    g.restore();
    this.texture.needsUpdate = true;
  }

  drawHappyMac(g, sad) {
    const w = 96, h = 118;
    g.save();
    g.translate(256, 171);
    g.lineWidth = 4;
    g.strokeRect(-w / 2, -h / 2, w, h);
    g.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, 46);
    g.strokeRect(-w / 2 + 20, h / 2 - 30, 26, 12);
    const fy = -h / 2 + 34;
    g.fillRect(-18, fy - 8, 7, 7);
    g.fillRect(11, fy - 8, 7, 7);
    g.beginPath();
    if (sad) {
      g.moveTo(-16, fy + 16); g.lineTo(-8, fy + 8);
      g.lineTo(8, fy + 8); g.lineTo(16, fy + 16);
    } else {
      g.moveTo(-16, fy + 6);
      g.quadraticCurveTo(0, fy + 20, 16, fy + 6);
    }
    g.stroke();
    g.restore();
  }

  drawHello(g) {
    g.save();
    g.translate(256, 190);
    g.font = 'italic 120px "Segoe Script","Bradley Hand","Snell Roundhand",cursive';
    g.textAlign = 'center';
    g.fillText('hello', 0, 0);
    g.restore();
  }

  drawFinder(g, on, off) {
    g.fillStyle = on;
    g.fillRect(0, 0, 512, 20);
    g.fillStyle = off;
    g.font = 'bold 13px Chicago, Geneva, monospace';
    g.fillText('  File  Edit  View  Special', 10, 15);

    // The classic 50% dither desktop.
    g.fillStyle = on;
    for (let y = 20; y < 342; y += 2)
      for (let x = (y / 2) % 2; x < 512; x += 2) g.fillRect(x, y, 1, 1);

    g.fillStyle = off; g.fillRect(452, 34, 40, 30);
    g.fillStyle = on; g.fillRect(454, 36, 36, 26);
    g.fillStyle = off; g.font = '11px Geneva, monospace';
    g.fillText('Macintosh HD', 430, 78);

    const wx = 60, wy = 60, ww = 300, wh = 200;
    g.fillStyle = on; g.fillRect(wx, wy, ww, wh);
    g.strokeStyle = off; g.lineWidth = 2;
    g.strokeRect(wx, wy, ww, wh);
    g.fillStyle = off;
    for (let i = 0; i < 6; i++) g.fillRect(wx + 2, wy + 4 + i * 3, ww - 4, 1);
    g.fillStyle = on; g.fillRect(wx + 110, wy + 1, 90, 18);
    g.fillStyle = off;
    g.font = '12px Chicago, Geneva, monospace';
    g.fillText('System Disk', wx + 118, wy + 15);
    g.strokeRect(wx + 6, wy + 4, 12, 12);

    for (let i = 0; i < 3; i++) {
      const ix = wx + 30 + i * 90, iy = wy + 50;
      g.strokeRect(ix, iy, 30, 38);
      g.beginPath(); g.moveTo(ix + 22, iy); g.lineTo(ix + 30, iy + 8); g.stroke();
      g.font = '10px Geneva, monospace';
      g.fillText(['MacPaint', 'MacWrite', 'Empty'][i], ix - 6, iy + 52);
    }

    if (Math.floor(this.t * 1.6) % 2 === 0) {
      g.fillRect(wx + 30, wy + 150, 2, 16);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Which way each component travels when the machine comes apart.
 * Node names match the objects exported by model/build_mac128k.py.
 * ------------------------------------------------------------------ */

const PARTS = [
  {
    node: 'FrontBezel', name: 'Front bezel',
    blurb: 'Manock and Oyama stood it upright — a face, not a box.',
    dir: [0, 0.12, 1], dist: 2.7, delay: 0
  },
  {
    node: 'RearHousing', name: 'Rear housing',
    blurb: 'Vented, and screwed shut with bits nobody owned.',
    dir: [0, 0.05, -1], dist: 2.9, delay: 0.06
  },
  {
    node: 'CathodeRayTube', name: 'Cathode ray tube',
    blurb: '9-inch monochrome, 512 × 342 — square pixels, on purpose.',
    dir: [0.06, 0.9, 0.42], dist: 2.5, delay: 0.16
  },
  {
    node: 'FloppyDrive', name: '400K floppy drive',
    blurb: 'Sony’s 3.5-inch mechanism, run by Woz’s IWM chip. One drive.',
    dir: [0.6, -0.3, 1], dist: 2.5, delay: 0.24
  },
  {
    node: 'LogicBoard', name: 'Digital logic board',
    blurb: 'Burrell Smith’s board: an 8 MHz 68000 and 128K of RAM, no more.',
    dir: [-0.4, -1, 0.5], dist: 2.6, delay: 0.31
  },
  {
    node: 'AnalogBoard', name: 'Analog board',
    blurb: 'Rod Holt’s supply — no fan, by decree. It ran hot.',
    dir: [1, -0.1, -0.3], dist: 2.8, delay: 0.37
  },
  {
    node: 'SignaturePlate', name: 'The signatures',
    blurb: 'Forty-seven names moulded inside the case. Artists sign their work.',
    dir: [0, 0.3, -1], dist: 3.7, delay: 0.44
  },
  {
    node: 'Keyboard', name: 'Keyboard',
    blurb: 'No cursor keys. They wanted your hand on the mouse.',
    dir: [-0.55, -0.35, 0.8], dist: 2.2, delay: 0.5
  },
  {
    node: 'Mouse', name: 'The mouse',
    blurb: 'One button. The whole interface argument, settled in plastic.',
    dir: [1, -0.2, 0.85], dist: 2.1, delay: 0.55
  }
];

/* ------------------------------------------------------------------ *
 * The stage
 * ------------------------------------------------------------------ */

export class MacintoshScene {
  /**
   * @param canvasEl   the <canvas> to render into
   * @param labelLayer a DOM layer for the projected part callouts
   * @param source     { url } to fetch the model, or { data } for an
   *                   already-loaded ArrayBuffer (the single-file build)
   */
  constructor(canvasEl, labelLayer, source = {}) {
    this.canvasEl = canvasEl;
    this.labelLayer = labelLayer;

    this.explode = 0;
    this.spin = 0;
    this.focus = null;
    this.loaded = false;
    this.mobileShift = 1.35;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.parts = [];
    this.labels = [];
    this._v = new THREE.Vector3();
    this._clock = new THREE.Clock();

    this.camState = { radius: 15, theta: 0.5, phi: 1.34, targetY: 0, fov: 32, offsetX: 0 };
    this.camGoal = { ...this.camState };

    this._initRenderer();
    this._initScene();

    this.ready = this._load(source);

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  /* ---------------- renderer ---------------- */

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasEl,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Real shadows are most of the difference between a render that reads as
    // an object and one that reads as a decal.
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

    // A studio in a canvas: a soft gradient with a bright band where a
    // softbox would be, run through PMREM so the plastics have something
    // worth reflecting.
    const [c, g] = canvas2d(64, 256);
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.00, '#8e96a4');
    grad.addColorStop(0.34, '#ffffff');
    grad.addColorStop(0.52, '#c8c6c2');
    grad.addColorStop(0.70, '#54565c');
    grad.addColorStop(1.00, '#101216');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 256);
    const envTex = new THREE.CanvasTexture(c);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromEquirectangular(envTex).texture;
    pmrem.dispose();
    envTex.dispose();

    this.scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x2b2721, 0.5));

    const key = new THREE.DirectionalLight(0xfff3e0, 2.4);
    key.position.set(5.5, 7.5, 6.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    const s = 6.5;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s });
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 3;
    this.scene.add(key);
    this.keyLight = key;

    const fill = new THREE.DirectionalLight(0x9fc0ff, 0.85);
    fill.position.set(-6, 2.5, 3);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xbcd2ff, 1.5);
    rim.position.set(-4, 3, -7);
    this.scene.add(rim);

    // The screen's own glow, spilling onto the bezel.
    this.screenLight = new THREE.PointLight(0xa9f2c8, 2.0, 7, 2);
    this.screenLight.position.set(0, 0.62, 1.9);
    this.scene.add(this.screenLight);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Catches the contact shadow and nothing else.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.42 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.716;   // the base of the case, from the model
    ground.receiveShadow = true;
    this.root.add(ground);
    this.ground = ground;

    this.screen = new MacScreen();
  }

  /* ---------------- model ---------------- */

  _load(source) {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      const onDone = (gltf) => { this._install(gltf.scene); resolve(this); };
      if (source.data) loader.parse(source.data, '', onDone, reject);
      else loader.load(source.url || 'assets/mac128k.glb', onDone, undefined, reject);
    });
  }

  _install(model) {
    this.root.add(model);
    this.model = model;

    const pcb = pcbTexture();
    const signatures = signatureTexture();

    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const mat = o.material;
      if (!mat) return;

      // Swap in the surfaces that have to stay procedural.
      if (mat.name === 'ScreenMat') {
        o.material = new THREE.MeshBasicMaterial({
          map: this.screen.texture, toneMapped: false
        });
        o.castShadow = false;
      } else if (mat.name === 'PCB') {
        mat.map = pcb;
        mat.needsUpdate = true;
      } else if (o.name === 'SignaturePlate') {
        o.material = new THREE.MeshStandardMaterial({
          map: signatures, roughness: 0.85
        });
      }
    });

    // The screen travels with the tube it is the front of.
    const crt = model.getObjectByName('CathodeRayTube');
    const screenMesh = model.getObjectByName('Screen');
    if (crt && screenMesh) crt.attach(screenMesh);

    PARTS.forEach((spec) => {
      const obj = model.getObjectByName(spec.node);
      if (!obj) {
        console.warn('mac3d: missing node', spec.node);
        return;
      }
      this.parts.push({
        obj,
        name: spec.name,
        blurb: spec.blurb,
        home: obj.position.clone(),
        dir: new THREE.Vector3(...spec.dir).normalize(),
        dist: spec.dist,
        delay: spec.delay
      });
    });

    this._initLabels();
    this.loaded = true;
  }

  /* ---------------- labels ---------------- */

  _initLabels() {
    if (!this.labelLayer) return;
    this.parts.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'part-label';
      el.innerHTML =
        '<span class="part-label__dot"></span>' +
        '<span class="part-label__body"><b>' + p.name + '</b>' +
        (p.blurb ? '<i>' + p.blurb + '</i>' : '') + '</span>';
      this.labelLayer.appendChild(el);
      this.labels.push({ el, part: p });
    });
  }

  _updateLabels() {
    if (!this.labels.length) return;
    const w = this.canvasEl.clientWidth, h = this.canvasEl.clientHeight;

    this.labels.forEach(({ el, part }) => {
      // Only the part the current step is describing gets a callout; all of
      // them at once collapses into an unreadable pile.
      const on = this.focus && this.focus.has(part.name) && this.explode > part.delay;
      if (!on) {
        if (el.dataset.on === '1') { el.dataset.on = '0'; el.classList.remove('is-on'); }
        return;
      }
      part.obj.getWorldPosition(this._v);
      this._v.project(this.camera);
      const x = (this._v.x * 0.5 + 0.5) * w;
      const y = (-this._v.y * 0.5 + 0.5) * h;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.classList.toggle('is-flipped', x > w * 0.62);
      const behind = this._v.z > 1;
      if (!behind && el.dataset.on !== '1') { el.dataset.on = '1'; el.classList.add('is-on'); }
      if (behind && el.dataset.on === '1') { el.dataset.on = '0'; el.classList.remove('is-on'); }
    });
  }

  /* ---------------- public API ---------------- */

  setExplode(v) { this.explode = clamp(v, 0, 1); }
  setSpin(v) { this.spin = v; }
  setScreen(mode) { this.screen.set(mode); }
  setFocus(names) { this.focus = names && names.length ? new Set(names) : null; }
  setMobileShift(v) { this.mobileShift = v; }
  frame(goal) { Object.assign(this.camGoal, goal); }

  resize() {
    const w = this.canvasEl.clientWidth || window.innerWidth;
    const h = this.canvasEl.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Pull back on narrow screens so the machine always fits.
    this.fitScale = w < 760 ? 1.45 : w < 1100 ? 1.15 : 1;
    this.camera.updateProjectionMatrix();
  }

  update() {
    const dt = Math.min(this._clock.getDelta(), 0.05);

    // The camera chases a goal rather than being set outright, so a change of
    // scroll direction reads as momentum instead of a cut.
    const k = this.reducedMotion ? 1 : 1 - Math.pow(0.0015, dt);
    for (const key of ['radius', 'theta', 'phi', 'targetY', 'fov', 'offsetX']) {
      this.camState[key] = lerp(this.camState[key], this.camGoal[key], k);
    }

    const { radius, theta, phi, fov } = this.camState;
    const r = radius * (this.fitScale || 1);
    const targetY = this.camState.targetY + (this.fitScale > 1.3 ? this.mobileShift : 0);
    this.camera.position.set(
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi) + targetY,
      r * Math.sin(phi) * Math.cos(theta)
    );
    this.camera.lookAt(0, targetY, 0);
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    // Placement is a pure function of `explode` — that is what makes the
    // teardown perfectly reversible on the way back up.
    const e = this.explode;
    for (const p of this.parts) {
      const local = ease(clamp((e - p.delay) / (1 - p.delay || 1), 0, 1));
      p.obj.position.copy(p.home).addScaledVector(p.dir, p.dist * local);
    }

    this.root.rotation.y = this.spin;
    // On a phone the machine is centred: there is no room beside it.
    this.root.position.x = this.camState.offsetX * ((this.fitScale || 1) > 1.3 ? 0 : 1);

    if (this.ground) this.ground.material.opacity = 0.42 * (1 - e * 0.7);
    this.screenLight.intensity = 2.0 * (1 - e * 0.85);

    this.screen.draw(dt);
    this._updateLabels();
    this.renderer.render(this.scene, this.camera);
  }
}
