/*
 * mac3d.js — a procedurally generated Macintosh 128K.
 *
 * Every piece of geometry and every texture in this file is generated in code
 * at runtime: no downloaded models, no image assets, no licensing to worry
 * about. The whole machine is built from three.js primitives, extruded
 * profiles and canvas-drawn textures.
 *
 * The exported controller exposes a single scalar, `explode` (0..1), which the
 * scroll layer drives. 0 is a fully assembled Macintosh, 1 is the machine
 * pulled apart into its labelled components. Because it is a pure function of
 * that scalar, scrolling back up reassembles the machine exactly.
 */

import * as THREE from '../vendor/three.module.js';

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
// Smoothstep-ish easing so parts ease out of, and back into, the chassis.
const ease = (t) => t * t * (3 - 2 * t);

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function roundedRectPath(w, h, r, cx = 0, cy = 0) {
  const p = new THREE.Path();
  const x = cx - w / 2, y = cy - h / 2;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
  return p;
}

function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

/* ------------------------------------------------------------------ *
 * Procedural textures
 * ------------------------------------------------------------------ */

// Circuit-board copper traces, drawn as a constrained random walk on a grid.
function pcbTexture(seed = 1) {
  const [c, g] = canvas2d(512, 512);
  g.fillStyle = '#1d5137';
  g.fillRect(0, 0, 512, 512);

  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

  g.strokeStyle = '#2f7a54';
  g.lineWidth = 3;
  for (let i = 0; i < 90; i++) {
    let x = Math.floor(rnd() * 32) * 16;
    let y = Math.floor(rnd() * 32) * 16;
    g.beginPath();
    g.moveTo(x, y);
    const steps = 4 + Math.floor(rnd() * 8);
    for (let k = 0; k < steps; k++) {
      const horiz = rnd() > 0.5;
      const d = (rnd() > 0.5 ? 1 : -1) * (16 + Math.floor(rnd() * 4) * 16);
      if (horiz) x += d; else y += d;
      g.lineTo(x, y);
    }
    g.stroke();
  }

  // Solder pads.
  g.fillStyle = '#c9a227';
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rnd() * 32) * 16;
    const y = Math.floor(rnd() * 32) * 16;
    g.beginPath();
    g.arc(x, y, 3.2, 0, Math.PI * 2);
    g.fill();
  }

  // Silkscreen.
  g.fillStyle = 'rgba(230,230,220,.5)';
  g.font = '11px monospace';
  for (let i = 0; i < 40; i++) {
    g.fillText(
      ['U' + i, 'R' + i, 'C' + i, 'J' + i][i % 4],
      rnd() * 480, rnd() * 500
    );
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Rear-panel cooling vents.
function ventTexture() {
  const [c, g] = canvas2d(256, 512);
  g.fillStyle = '#cfc4ad';
  g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#8d8571';
  for (let y = 60; y < 300; y += 18) {
    g.fillRect(40, y, 176, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The signatures of the Macintosh team, moulded into the inside of the case.
function signatureTexture() {
  const [c, g] = canvas2d(1024, 512);
  g.fillStyle = '#c9bfa8';
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
    'Burrell Smith', 'Bryan Stearns', 'Lynn Takahashi', 'Guy "Bud" Tribble',
    'Randy Wigginton', 'Linda Wilkin', 'Steve Capps', 'Pamela Wyman'
  ];
  g.fillStyle = '#5e5744';
  names.forEach((n, i) => {
    const col = i % 3, row = (i / 3) | 0;
    g.save();
    g.translate(34 + col * 336, 52 + row * 30);
    g.rotate((-3 + (i % 5)) * 0.014);
    g.font = 'italic ' + (24 + (i % 4) * 2) +
      'px "Segoe Script","Bradley Hand","Snell Roundhand",cursive';
    g.fillText(n, 0, 0);
    g.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ *
 * The screen — a live 512x342 Macintosh display
 * ------------------------------------------------------------------ */

class MacScreen {
  constructor() {
    // The Macintosh 128K's exact framebuffer: 512 x 342, one bit per pixel.
    [this.canvas, this.g] = canvas2d(512, 342);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
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
    const on = '#e9f6ec';   // P4 phosphor white
    const off = '#0d1310';

    g.fillStyle = off;
    g.fillRect(0, 0, 512, 342);
    g.fillStyle = on;
    g.strokeStyle = on;
    g.lineWidth = 2;

    if (this.mode === 'off') return;
    if (this.mode === 'boot') this.drawHappyMac(g, on, false);
    else if (this.mode === 'sad') this.drawHappyMac(g, on, true);
    else if (this.mode === 'hello') this.drawHello(g);
    else this.drawFinder(g, on, off);

    this.texture.needsUpdate = true;
  }

  drawHappyMac(g, on, sad) {
    const cx = 256, cy = 171, w = 96, h = 118;
    g.save();
    g.translate(cx, cy);
    g.lineWidth = 4;
    g.strokeRect(-w / 2, -h / 2, w, h);          // case outline
    g.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, 46); // screen
    g.strokeRect(-w / 2 + 20, h / 2 - 30, 26, 12);      // floppy slot
    // Face inside the little screen.
    const fy = -h / 2 + 34;
    g.fillRect(-18, fy - 8, 7, 7);
    g.fillRect(11, fy - 8, 7, 7);
    g.beginPath();
    if (sad) {
      g.moveTo(-16, fy + 16); g.lineTo(-8, fy + 8);
      g.moveTo(-8, fy + 8); g.lineTo(8, fy + 8);
      g.moveTo(8, fy + 8); g.lineTo(16, fy + 16);
    } else {
      g.moveTo(-16, fy + 6);
      g.quadraticCurveTo(0, fy + 20, 16, fy + 6);
    }
    g.stroke();
    g.restore();
  }

  drawHello(g) {
    // "hello" in the handwriting of the 1984 introduction.
    g.save();
    g.translate(256, 190);
    g.font = 'italic 120px "Segoe Script","Bradley Hand","Snell Roundhand",cursive';
    g.textAlign = 'center';
    g.fillText('hello', 0, 0);
    g.restore();
  }

  drawFinder(g, on, off) {
    // Menu bar.
    g.fillStyle = on;
    g.fillRect(0, 0, 512, 20);
    g.fillStyle = off;
    g.font = 'bold 13px Chicago, Geneva, monospace';
    g.fillText('  File  Edit  View  Special', 10, 15);

    // Desktop pattern (the classic 50% dither).
    g.fillStyle = on;
    for (let y = 20; y < 342; y += 2)
      for (let x = (y / 2) % 2; x < 512; x += 2) g.fillRect(x, y, 1, 1);

    // Disk icon, top right.
    g.fillStyle = off; g.fillRect(452, 34, 40, 30);
    g.fillStyle = on; g.fillRect(454, 36, 36, 26);
    g.fillStyle = off; g.font = '11px Geneva, monospace';
    g.fillText('Macintosh HD', 430, 78);

    // An open window.
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
    g.strokeRect(wx + 6, wy + 4, 12, 12);     // close box

    // Document icons.
    for (let i = 0; i < 3; i++) {
      const ix = wx + 30 + i * 90, iy = wy + 50;
      g.fillStyle = off;
      g.strokeRect(ix, iy, 30, 38);
      g.beginPath(); g.moveTo(ix + 22, iy); g.lineTo(ix + 30, iy + 8); g.stroke();
      g.font = '10px Geneva, monospace';
      g.fillText(['MacPaint', 'MacWrite', 'Empty'][i], ix - 6, iy + 52);
    }

    // Blinking insertion point, because it always was blinking.
    if (Math.floor(this.t * 1.6) % 2 === 0) {
      g.fillStyle = off;
      g.fillRect(wx + 30, wy + 150, 2, 16);
    }
  }
}

/* ------------------------------------------------------------------ *
 * The machine
 * ------------------------------------------------------------------ */

export class MacintoshScene {
  constructor(canvasEl, labelLayer) {
    this.canvasEl = canvasEl;
    this.labelLayer = labelLayer;

    this.explode = 0;        // 0 assembled .. 1 fully apart
    // How far to slide the machine out of the way of the copy on phones.
    // Positive pushes it down the frame, negative lifts it up.
    this.mobileShift = 1.35;
    this.spin = 0;           // extra yaw driven by scroll
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.parts = [];
    this.labels = [];
    this._v = new THREE.Vector3();
    this._clock = new THREE.Clock();

    // offsetX slides the machine left or right of frame so the type always
    // has somewhere to live.
    this.camState = { radius: 9.5, theta: 0.5, phi: 1.35, targetY: 0, fov: 32, offsetX: 0 };
    this.camGoal = { ...this.camState };

    this._initRenderer();
    this._initScene();
    this._build();
    this._initLabels();

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  /* ---------------- renderer / scene ---------------- */

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasEl,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

    // A studio-in-a-canvas: a gradient equirect map run through PMREM gives
    // the plastics and metals something believable to reflect.
    const [c, g] = canvas2d(64, 256);
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#5c6470');
    grad.addColorStop(0.45, '#e8e6e2');
    grad.addColorStop(0.55, '#a8a6a2');
    grad.addColorStop(1.0, '#14161a');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 256);
    const envTex = new THREE.CanvasTexture(c);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromEquirectangular(envTex).texture;
    pmrem.dispose();
    envTex.dispose();

    this.scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x2a2620, 0.55));

    const key = new THREE.DirectionalLight(0xfff4e2, 2.1);
    key.position.set(4, 6, 7);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x8fb6ff, 1.4);
    rim.position.set(-6, 2, -5);
    this.scene.add(rim);

    // The screen's own light, spilling onto the bezel.
    this.screenLight = new THREE.PointLight(0xa9f2c8, 1.6, 8, 2);
    this.screenLight.position.set(0, 0.55, 1.9);
    this.scene.add(this.screenLight);

    this.root = new THREE.Group();
    this.scene.add(this.root);
  }

  /* ---------------- materials ---------------- */

  _materials() {
    const M = THREE.MeshStandardMaterial;
    return {
      beige: new M({ color: 0xd6cbb4, roughness: 0.62, metalness: 0.0 }),
      beigeDark: new M({ color: 0xc4b99f, roughness: 0.7, metalness: 0.0 }),
      beigeInner: new M({ color: 0xbdb298, roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide }),
      dark: new M({ color: 0x1b1c1e, roughness: 0.55, metalness: 0.1 }),
      rubber: new M({ color: 0x2a2b2d, roughness: 0.95 }),
      metal: new M({ color: 0xbfc4c9, roughness: 0.34, metalness: 0.95 }),
      metalDull: new M({ color: 0x8d949b, roughness: 0.55, metalness: 0.8 }),
      copper: new M({ color: 0xb87333, roughness: 0.4, metalness: 0.9 }),
      glass: new M({ color: 0x0e1512, roughness: 0.08, metalness: 0.0 }),
      pcb: new M({ map: pcbTexture(7), roughness: 0.75, metalness: 0.05 }),
      pcbB: new M({ map: pcbTexture(31), roughness: 0.75, metalness: 0.05 }),
      cap: new M({ color: 0x24406b, roughness: 0.45, metalness: 0.3 }),
      capRed: new M({ color: 0x7a2233, roughness: 0.45, metalness: 0.3 })
    };
  }

  /* ---------------- part registration ---------------- */

  _addPart(obj, opts) {
    obj.position.copy(opts.home || new THREE.Vector3());
    this.root.add(obj);
    const part = {
      obj,
      name: opts.name,
      blurb: opts.blurb || '',
      home: obj.position.clone(),
      dir: (opts.dir || new THREE.Vector3(0, 1, 0)).clone().normalize(),
      dist: opts.dist != null ? opts.dist : 2,
      spinAxis: opts.spinAxis || null,
      spinAmt: opts.spinAmt || 0,
      baseRot: obj.rotation.clone(),
      delay: opts.delay || 0,          // staggers the teardown
      label: opts.label !== false
    };
    this.parts.push(part);
    return part;
  }

  /* ---------------- geometry ---------------- */

  _build() {
    const m = this._materials();
    this.mat = m;

    // Body reference dimensions (1 unit ~ 10 cm), from the real 128K:
    // 9.7" wide x 13.5" tall x 10.9" deep.
    const W = 2.46, H = 3.43, D = 2.77;
    this.dims = { W, H, D };

    this._buildFrontBezel(m, W, H, D);
    this._buildRearShell(m, W, H, D);
    this._buildCRT(m, D);
    this._buildLogicBoard(m, W, D);
    this._buildAnalogBoard(m, H, D);
    this._buildFloppy(m, D);
    this._buildSignaturePlate(m, W, H, D);
    this._buildKeyboard(m, W, D);
    this._buildMouse(m, W, D);

    // Ground shadow: a cheap radial-gradient decal, far cheaper than a
    // shadow map and quite convincing at this camera distance.
    const [sc, sg] = canvas2d(256, 256);
    const rg = sg.createRadialGradient(128, 128, 8, 128, 128, 124);
    rg.addColorStop(0, 'rgba(0,0,0,.55)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -H / 2 - 0.015;
    this.root.add(shadow);
    this.shadow = shadow;
  }

  // The front of the case: one extruded shape with holes punched for the
  // screen and the floppy slot, so it reads as a real moulding when it lifts
  // away from the machine.
  _buildFrontBezel(m, W, H, D) {
    const shape = roundedRectShape(W, H, 0.16);
    shape.holes.push(roundedRectPath(1.72, 1.28, 0.06, 0, 0.62));   // screen
    shape.holes.push(roundedRectPath(0.92, 0.09, 0.04, 0.02, -0.72)); // floppy slot

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.3, bevelEnabled: true, bevelThickness: 0.035,
      bevelSize: 0.035, bevelSegments: 3, curveSegments: 6
    });
    geo.translate(0, 0, -0.3);

    const bezel = new THREE.Group();
    const front = new THREE.Mesh(geo, m.beige);
    bezel.add(front);

    // Dark surround sitting behind the screen opening. It must stay behind
    // the tube's faceplate or it would black the picture out.
    const recess = new THREE.Mesh(new THREE.BoxGeometry(1.96, 1.52, 0.02), m.dark);
    recess.position.set(0, 0.62, -0.34);
    bezel.add(recess);

    // Apple badge and model wordmark on the chin.
    const [bc, bg] = canvas2d(512, 128);
    bg.fillStyle = '#d6cbb4'; bg.fillRect(0, 0, 512, 128);
    bg.fillStyle = '#6e6553';
    bg.font = 'bold 34px Helvetica, Arial, sans-serif';
    bg.fillText('macintosh', 150, 82);
    // Six-stripe rainbow apple, abstracted to a stack of bars.
    const stripes = ['#61bb46', '#fdb827', '#f5821f', '#e03a3e', '#963d97', '#009ddc'];
    stripes.forEach((s, i) => { bg.fillStyle = s; bg.fillRect(96, 40 + i * 8, 40, 7); });
    const badgeTex = new THREE.CanvasTexture(bc);
    badgeTex.colorSpace = THREE.SRGBColorSpace;
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.375),
      new THREE.MeshStandardMaterial({ map: badgeTex, roughness: 0.6 })
    );
    badge.position.set(0, -1.24, 0.032);
    bezel.add(badge);

    this._addPart(bezel, {
      name: 'Front bezel',
      blurb: 'Jerry Manock and Terry Oyama’s vertical case — a face, not a box.',
      home: new THREE.Vector3(0, 0, D / 2 - 0.05),
      dir: new THREE.Vector3(0, 0.15, 1), dist: 2.4, delay: 0
    });
  }

  // Five panels rather than a solid block, so the exploded view shows a
  // hollow shell the way a real teardown would.
  _buildRearShell(m, W, H, D) {
    const t = 0.07;
    const ventTex = ventTexture();

    const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, t), [
      m.beigeDark, m.beigeDark, m.beigeDark, m.beigeDark,
      new THREE.MeshStandardMaterial({ map: ventTex, roughness: 0.7 }),
      m.beigeInner
    ]);
    this._addPart(back, {
      name: 'Rear housing',
      blurb: 'Vented, screwed shut with long Torx bits so nobody could open it.',
      home: new THREE.Vector3(0, 0, -D / 2),
      dir: new THREE.Vector3(0, 0, -1), dist: 2.6, delay: 0.05
    });

    const side = (sx) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(t, H, D - 0.1), m.beigeDark);
      this._addPart(p, {
        name: sx > 0 ? 'Right side panel' : 'Left side panel',
        blurb: 'Part of the one-piece rear shell.',
        home: new THREE.Vector3(sx * (W / 2 - t / 2), 0, -0.05),
        dir: new THREE.Vector3(sx, 0, -0.2), dist: 2.2, delay: 0.1,
        label: false
      });
    };
    side(1); side(-1);

    const top = new THREE.Mesh(new THREE.BoxGeometry(W, t, D - 0.1), m.beigeDark);
    this._addPart(top, {
      name: 'Top panel',
      blurb: 'With the recessed carry handle — the Mac was meant to be lifted.',
      home: new THREE.Vector3(0, H / 2 - t / 2, -0.05),
      dir: new THREE.Vector3(0, 1, -0.2), dist: 2.2, delay: 0.12, label: false
    });

    const bottom = new THREE.Mesh(new THREE.BoxGeometry(W, t, D - 0.1), m.beigeDark);
    this._addPart(bottom, {
      name: 'Base',
      blurb: '',
      home: new THREE.Vector3(0, -H / 2 + t / 2, -0.05),
      dir: new THREE.Vector3(0, -1, -0.2), dist: 1.3, delay: 0.12, label: false
    });
  }

  // A 9" monochrome CRT: faceplate, square funnel, neck and deflection yoke.
  _buildCRT(m, D) {
    const crt = new THREE.Group();

    const faceplate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.45, 0.14), m.glass);
    faceplate.position.z = 0.07;
    crt.add(faceplate);

    this.screen = new MacScreen();
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.62, 1.08),
      new THREE.MeshBasicMaterial({ map: this.screen.texture, toneMapped: false })
    );
    screenMesh.position.set(0, 0, 0.145);
    crt.add(screenMesh);
    this.screenMesh = screenMesh;

    // Funnel: a 4-sided cone gives the square-to-round taper of a real tube.
    const funnel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 1.31, 1.15, 4, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x2a2d30, roughness: 0.45, metalness: 0.6, side: THREE.DoubleSide
      })
    );
    funnel.rotation.x = Math.PI / 2;
    funnel.rotation.y = Math.PI / 4;
    funnel.position.z = -0.58;
    crt.add(funnel);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 16), m.glass);
    neck.rotation.x = Math.PI / 2;
    neck.position.z = -1.42;
    crt.add(neck);

    const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.26, 0.26, 20), m.copper);
    yoke.rotation.x = Math.PI / 2;
    yoke.position.z = -1.16;
    crt.add(yoke);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), m.dark);
    cap.position.z = -1.78;
    crt.add(cap);

    // Anode lead, the fat red wire every CRT has.
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.1, -1.75),
      new THREE.Vector3(0.55, 0.45, -1.3),
      new THREE.Vector3(0.75, 0.2, -0.7),
      new THREE.Vector3(0.62, -0.1, -0.35)
    ]);
    crt.add(new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, 0.035, 8),
      m.capRed
    ));

    this._addPart(crt, {
      name: 'Cathode ray tube',
      blurb: '9-inch monochrome, 512 × 342 pixels — square pixels, on purpose.',
      home: new THREE.Vector3(0, 0.62, D / 2 - 0.42),
      dir: new THREE.Vector3(0.1, 0.85, 0.5), dist: 2.4, delay: 0.18
    });
  }

  // The digital board that made the machine: 68000, RAM, ROM, IWM.
  _buildLogicBoard(m, W, D) {
    const g = new THREE.Group();

    const board = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.045, 1.75), m.pcb);
    g.add(board);

    const chip = (w, d, x, z, label) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.075, d), m.dark);
      c.position.set(x, 0.06, z);
      g.add(c);
      // Two rows of DIP legs.
      const legGeo = new THREE.BoxGeometry(0.02, 0.045, 0.02);
      const n = Math.max(3, Math.round(w / 0.09));
      const legs = new THREE.InstancedMesh(legGeo, m.metal, n * 2);
      const mtx = new THREE.Matrix4();
      let i = 0;
      for (let s = -1; s <= 1; s += 2)
        for (let k = 0; k < n; k++) {
          mtx.makeTranslation(
            x - w / 2 + 0.045 + k * (w - 0.09) / (n - 1),
            0.012,
            z + s * (d / 2 + 0.012)
          );
          legs.setMatrixAt(i++, mtx);
        }
      legs.instanceMatrix.needsUpdate = true;
      g.add(legs);
      return c;
    };

    // Motorola 68000 — the big 64-pin DIP, unmistakable on the real board.
    chip(0.82, 0.24, -0.42, 0.34);
    // 16 × 64Kbit DRAM: the entire 128K of memory.
    for (let r = 0; r < 2; r++)
      for (let k = 0; k < 8; k++) chip(0.17, 0.11, -0.72 + k * 0.19, -0.28 - r * 0.2);
    // ROMs and the Integrated Woz Machine.
    chip(0.34, 0.16, 0.62, 0.5);
    chip(0.34, 0.16, 0.62, 0.26);
    chip(0.3, 0.16, 0.62, -0.05);

    // Rear connectors: serial DE-9s, floppy DB-19, mouse, sound.
    for (let k = 0; k < 4; k++) {
      const con = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.1), m.metalDull);
      con.position.set(-0.7 + k * 0.45, 0.08, -0.84);
      g.add(con);
    }

    this._addPart(g, {
      name: 'Digital logic board',
      blurb: 'Burrell Smith’s board: an 8 MHz 68000 and 128K of RAM, no more.',
      home: new THREE.Vector3(0, -this.dims.H / 2 + 0.28, -0.15),
      dir: new THREE.Vector3(-0.35, -1, 0.55), dist: 2.7, delay: 0.28
    });
  }

  // Analog board: power supply, flyback, and the CRT drive circuitry.
  _buildAnalogBoard(m, H, D) {
    const g = new THREE.Group();

    const board = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.2, 1.7), m.pcbB);
    g.add(board);

    const flyback = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.36), m.dark);
    flyback.position.set(-0.2, 0.55, 0.3);
    g.add(flyback);

    const heatsink = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.5), m.metalDull);
    heatsink.position.set(-0.16, -0.2, -0.4);
    g.add(heatsink);
    for (let k = 0; k < 7; k++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.03), m.metalDull);
      fin.position.set(-0.24, -0.2, -0.62 + k * 0.072);
      g.add(fin);
    }

    // Electrolytics — the parts that fail forty years later.
    const capGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.3, 14);
    [[-0.2, -0.75, 0.5], [-0.2, -0.75, 0.16], [-0.2, 0.05, 0.55]].forEach((p, i) => {
      const c = new THREE.Mesh(capGeo, i === 2 ? m.capRed : m.cap);
      c.rotation.z = Math.PI / 2;
      c.position.set(p[0], p[1], p[2]);
      g.add(c);
    });

    this._addPart(g, {
      name: 'Analog board',
      blurb: 'Rod Holt’s switching supply — no fan, by Jobs’ decree. It ran hot.',
      home: new THREE.Vector3(this.dims.W / 2 - 0.3, -0.15, -0.35),
      dir: new THREE.Vector3(1, -0.15, -0.35), dist: 2.6, delay: 0.34
    });
  }

  _buildFloppy(m, D) {
    const g = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.5, 1.5), m.metalDull);
    g.add(body);

    const face = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.42, 0.05), m.beige);
    face.position.z = 0.76;
    g.add(face);

    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 0.03), m.dark);
    slot.position.set(0, 0.03, 0.79);
    g.add(slot);

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 18), m.metal);
    motor.rotation.x = Math.PI / 2;
    motor.position.set(0, -0.1, -0.6);
    g.add(motor);

    // A 3.5" disk loaded in the drive: hidden while the machine is together,
    // revealed the moment the drive slides out.
    const disk = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.045, 0.88),
      new THREE.MeshStandardMaterial({ color: 0x33383d, roughness: 0.7 }));
    disk.position.set(0, 0.06, 0.5);
    g.add(disk);
    const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.26), m.metal);
    shutter.position.set(0, 0.06, 0.82);
    g.add(shutter);
    this.diskMesh = disk;

    this._addPart(g, {
      name: '400K floppy drive',
      blurb: 'Sony’s 3.5-inch mechanism, driven by Woz’s IWM chip. One drive only.',
      home: new THREE.Vector3(0.02, -0.72, D / 2 - 0.82),
      dir: new THREE.Vector3(0.55, -0.35, 1), dist: 2.6, delay: 0.24
    });
  }

  _buildSignaturePlate(m, W, H, D) {
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(W - 0.4, (W - 0.4) / 2),
      new THREE.MeshStandardMaterial({ map: signatureTexture(), roughness: 0.9 })
    );
    plate.rotation.y = Math.PI;   // faces backwards: it is moulded inside
    this._addPart(plate, {
      name: 'The signatures',
      blurb: 'Forty-seven names moulded inside the case. Artists sign their work.',
      home: new THREE.Vector3(0, 0.35, -D / 2 + 0.06),
      dir: new THREE.Vector3(0, 0.35, -1), dist: 3.5, delay: 0.42
    });
  }

  _buildKeyboard(m, W, D) {
    const g = new THREE.Group();

    const shape = roundedRectShape(2.6, 0.95, 0.06);
    const base = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.17, bevelEnabled: true, bevelSize: 0.02,
        bevelThickness: 0.02, bevelSegments: 2
      }),
      m.beige
    );
    base.rotation.x = -Math.PI / 2;
    // The extrusion rises along +y after the rotation, so the slab already
    // sits on the desk at y = 0 — offsetting it would swallow the keycaps.
    g.add(base);

    // Keys as one instanced mesh — 58 caps for the price of one draw call.
    const keyGeo = new THREE.BoxGeometry(0.15, 0.05, 0.15);
    const rows = [10, 10, 10, 9, 5];
    const total = rows.reduce((a, b) => a + b, 0);
    const keys = new THREE.InstancedMesh(keyGeo, m.beigeDark, total);
    const mtx = new THREE.Matrix4();
    let i = 0;
    rows.forEach((count, r) => {
      const z = -0.3 + r * 0.17;
      const offset = (r === 3 ? 0.08 : 0) + (r === 4 ? 0.5 : 0);
      for (let k = 0; k < count; k++) {
        const wide = r === 4 && k === 2;
        mtx.makeTranslation(-1.0 + offset + k * 0.175 + (wide ? 0.2 : 0), 0.2, z);
        keys.setMatrixAt(i++, mtx);
      }
    });
    keys.instanceMatrix.needsUpdate = true;
    g.add(keys);

    this._addPart(g, {
      name: 'Keyboard',
      blurb: 'No cursor keys. Raskin and Jobs wanted your hand on the mouse.',
      home: new THREE.Vector3(0, -this.dims.H / 2 + 0.01, D / 2 + 0.95),
      dir: new THREE.Vector3(-0.55, -0.45, 0.75), dist: 2.2, delay: 0.5
    });
  }

  _buildMouse(m, W, D) {
    const g = new THREE.Group();

    const shape = roundedRectShape(0.52, 0.72, 0.1);
    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.24, bevelEnabled: true, bevelSize: 0.05,
        bevelThickness: 0.06, bevelSegments: 4, curveSegments: 8
      }),
      m.beige
    );
    body.rotation.x = -Math.PI / 2;
    g.add(body);

    const button = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.2), m.beigeDark);
    button.position.set(0, 0.315, -0.2);
    g.add(button);

    // Coiled cable, swept along a helix.
    const pts = [];
    for (let k = 0; k <= 60; k++) {
      const t = k / 60;
      pts.push(new THREE.Vector3(
        -t * 1.5 + Math.sin(t * 34) * 0.06,
        0.1 + Math.cos(t * 34) * 0.06,
        0.42 + t * 0.1
      ));
    }
    g.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.022, 6),
      m.rubber
    ));

    this._addPart(g, {
      name: 'The mouse',
      blurb: 'One button. The whole interface argument, settled in plastic.',
      home: new THREE.Vector3(1.75, -this.dims.H / 2 + 0.01, D / 2 + 0.7),
      dir: new THREE.Vector3(1, -0.3, 0.85), dist: 2.0, delay: 0.55
    });
  }

  /* ---------------- labels ---------------- */

  _initLabels() {
    if (!this.labelLayer) return;
    this.parts.filter(p => p.label).forEach((p) => {
      const el = document.createElement('div');
      el.className = 'part-label';
      el.innerHTML =
        `<span class="part-label__dot"></span>` +
        `<span class="part-label__body"><b>${p.name}</b>` +
        (p.blurb ? `<i>${p.blurb}</i>` : '') + `</span>`;
      this.labelLayer.appendChild(el);
      this.labels.push({ el, part: p });
    });
  }

  _updateLabels() {
    if (!this.labels.length) return;
    const w = this.canvasEl.clientWidth, h = this.canvasEl.clientHeight;

    this.labels.forEach(({ el, part }) => {
      // Only the part the current step is talking about is labelled — all of
      // them at once collapses into an unreadable pile.
      const local = this.focus && this.focus.has(part.name) && this.explode > part.delay;
      if (!local) {
        if (el.dataset.on === '1') { el.dataset.on = '0'; el.classList.remove('is-on'); }
        return;
      }
      part.obj.getWorldPosition(this._v);
      this._v.project(this.camera);
      const x = (this._v.x * 0.5 + 0.5) * w;
      const y = (-this._v.y * 0.5 + 0.5) * h;
      const behind = this._v.z > 1;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.classList.toggle('is-flipped', x > w * 0.62);
      if (!behind && el.dataset.on !== '1') { el.dataset.on = '1'; el.classList.add('is-on'); }
      if (behind && el.dataset.on === '1') { el.dataset.on = '0'; el.classList.remove('is-on'); }
    });
  }

  /* ---------------- public API for the scroll layer ---------------- */

  setExplode(v) { this.explode = clamp(v, 0, 1); }
  setFocus(names) { this.focus = names && names.length ? new Set(names) : null; }
  setMobileShift(v) { this.mobileShift = v; }
  setSpin(v) { this.spin = v; }
  setScreen(mode) { this.screen.set(mode); }

  // Called by section triggers to move the camera without cuts.
  frame(goal) { Object.assign(this.camGoal, goal); }

  resize() {
    const w = this.canvasEl.clientWidth || window.innerWidth;
    const h = this.canvasEl.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Pull the camera back on narrow screens so the machine always fits.
    this.fitScale = w < 760 ? 1.45 : w < 1100 ? 1.15 : 1;
    this.camera.updateProjectionMatrix();
  }

  update() {
    const dt = Math.min(this.clockDelta = this._clock.getDelta(), 0.05);

    // Camera easing — the goal is set by scroll, the state chases it, so
    // direction changes feel like momentum rather than teleporting.
    const k = this.reducedMotion ? 1 : 1 - Math.pow(0.0015, dt);
    for (const key of ['radius', 'theta', 'phi', 'targetY', 'fov', 'offsetX']) {
      this.camState[key] = lerp(this.camState[key], this.camGoal[key], k);
    }

    const { radius, theta, phi, fov } = this.camState;
    const r = radius * (this.fitScale || 1);
    // On phones the machine drops into the lower half of the frame so the
    // copy, which has nowhere else to go, keeps the top.
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

    // Part placement is a pure function of `explode`, which is what makes the
    // teardown perfectly reversible on the way back up.
    const e = this.explode;
    for (const p of this.parts) {
      const local = ease(clamp((e - p.delay) / (1 - p.delay || 1), 0, 1));
      p.obj.position.copy(p.home).addScaledVector(p.dir, p.dist * local);
      if (p.spinAxis) {
        p.obj.rotation[p.spinAxis] = p.baseRot[p.spinAxis] + p.spinAmt * local;
      }
    }

    this.root.rotation.y = this.spin;
    // On narrow screens the machine is centred: there is no room beside it.
    this.root.position.x = this.camState.offsetX * ((this.fitScale || 1) > 1.3 ? 0 : 1);
    this.shadow.material.opacity = 1 - e * 0.75;
    this.screenLight.intensity = 1.6 * (1 - e * 0.8);

    this.screen.draw(dt);
    this._updateLabels();
    this.renderer.render(this.scene, this.camera);
  }
}
