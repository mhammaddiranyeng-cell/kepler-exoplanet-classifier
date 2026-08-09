/*
 * main.js — the scroll layer.
 *
 * Responsibilities:
 *   1. boot screen, then hand control to a Lenis smooth-scroll instance
 *   2. wire Lenis into GSAP's ticker so ScrollTrigger stays in sync
 *   3. animate every section in *and back out* so motion follows the reader
 *      whichever way they are travelling
 *   4. map scroll position onto the 3D teardown and the camera
 */

import { MacintoshScene } from './mac3d.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ *
 * 1. Boot screen
 * ------------------------------------------------------------------ */

// Assigned by setupStage; the boot screen hands over to it so the stage
// fades up at whatever presence the first section asked for.
let revealStage = () => {};

const boot = document.getElementById('boot');
const bootBar = boot.querySelector('.boot__bar i');

document.body.classList.add('is-booting');

function finishBoot() {
  boot.classList.add('is-done');
  document.body.classList.remove('is-booting');
  ScrollTrigger.refresh();
  document.getElementById('gl').classList.add('is-live');
  revealStage();
  // Intro flourish for the hero — plays once, then scroll takes over.
  if (!REDUCED) {
    gsap.from('.hero__title .line > span', {
      yPercent: 115, duration: 1.15, ease: 'power4.out', stagger: .08
    });
    gsap.from('.eyebrow, .hero__sub, .hero__meta span', {
      opacity: 0, y: 24, duration: .9, ease: 'power3.out', stagger: .06, delay: .25
    });
  }
}

/* ------------------------------------------------------------------ *
 * 2. Smooth scroll
 * ------------------------------------------------------------------ */

let lenis = null;

if (!REDUCED) {
  lenis = new Lenis({
    duration: 1.15,
    // Slightly weighted easing: momentum on release, no rubber banding.
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // Exposed so deep links, and anything driving the page from outside,
  // can move the scroll without fighting the smoothing loop.
  window.__lenis = lenis;
}

const scrollTo = (target) => {
  if (lenis) lenis.scrollTo(target, { duration: 1.4 });
  else document.querySelector(target)?.scrollIntoView();
};

/* ------------------------------------------------------------------ *
 * 3. Text animation — plays forwards on the way down, reverses on the
 *    way back up, so nothing is ever "already finished" behind you.
 * ------------------------------------------------------------------ */

// Wrap each word in a masked span so headings can rise into place.
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  return words.map((w, i) => {
    const mask = document.createElement('span');
    mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;';
    const inner = document.createElement('span');
    inner.style.cssText = 'display:inline-block;will-change:transform;';
    inner.textContent = w;
    mask.appendChild(inner);
    el.appendChild(mask);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    return inner;
  });
}

function setupReveals() {
  if (REDUCED) return;

  const opts = (trigger) => ({
    trigger,
    start: 'top 82%',
    end: 'bottom 15%',
    // enter / leave / enterBack / leaveBack
    toggleActions: 'play none none reverse'
  });

  document.querySelectorAll('[data-anim="fade"]').forEach((el) => {
    gsap.from(el, {
      opacity: 0, y: 42, duration: 1, ease: 'power3.out',
      scrollTrigger: opts(el)
    });
  });

  document.querySelectorAll('[data-anim="stagger"]').forEach((el) => {
    gsap.from(el.children, {
      opacity: 0, y: 34, duration: .85, ease: 'power3.out', stagger: .09,
      scrollTrigger: opts(el)
    });
  });

  document.querySelectorAll('[data-anim="lines"]').forEach((el) => {
    const inners = splitWords(el);
    gsap.from(inners, {
      yPercent: 115, duration: 1.05, ease: 'power4.out', stagger: .045,
      scrollTrigger: opts(el)
    });
  });

  // Hero title lines are masked in markup; just wrap their contents.
  document.querySelectorAll('.hero__title .line').forEach((line) => {
    const inner = document.createElement('span');
    inner.textContent = line.textContent;
    line.textContent = '';
    line.appendChild(inner);
  });

  // Line art draws itself on, and un-draws when you scroll back past it.
  document.querySelectorAll('[data-anim="art"] .art').forEach((svg) => {
    const shapes = svg.querySelectorAll('path, rect, circle');
    shapes.forEach((s) => {
      const len = typeof s.getTotalLength === 'function' ? s.getTotalLength() : 0;
      if (!len) return;
      gsap.set(s, { strokeDasharray: len });
      gsap.fromTo(s,
        { strokeDashoffset: len },
        {
          strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut',
          scrollTrigger: opts(svg)
        }
      );
    });
    gsap.from(svg, { opacity: 0, duration: .6, scrollTrigger: opts(svg) });
  });
}

/* ------------------------------------------------------------------ *
 * 4. Year rail + progress bar
 * ------------------------------------------------------------------ */

function setupRail() {
  const list = document.getElementById('rail-list');
  const sections = [...document.querySelectorAll('[data-section]')];

  sections.forEach((sec) => {
    const li = document.createElement('li');
    li.innerHTML = `${sec.dataset.year}<span>${sec.dataset.label}</span>`;
    li.addEventListener('click', () => scrollTo('#' + sec.id));
    list.appendChild(li);

    const activate = () => {
      list.querySelectorAll('li').forEach((n) => n.classList.remove('is-active'));
      li.classList.add('is-active');
    };
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: activate,
      onEnterBack: activate
    });
  });

  const bar = document.getElementById('progress-bar');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => { bar.style.width = (self.progress * 100).toFixed(2) + '%'; }
  });
}

/* ------------------------------------------------------------------ *
 * 5. The 3D stage
 * ------------------------------------------------------------------ */

const mac = new MacintoshScene(
  document.getElementById('gl'),
  document.getElementById('labels')
);

// Piecewise curve: assembled → fully apart → snapped back together, all as a
// pure function of scroll progress through the teardown section.
function explodeCurve(p) {
  if (p < 0.06) return 0;
  if (p < 0.70) return (p - 0.06) / 0.64;
  if (p < 0.86) return 1;
  return 1 - (p - 0.86) / 0.14;
}

// Which parts each teardown step is talking about, in step order. Must line up
// with the nine .step cards in the markup.
const STEP_FOCUS = [
  [],
  ['Front bezel'],
  ['Cathode ray tube'],
  ['400K floppy drive'],
  ['Digital logic board'],
  ['Analog board'],
  ['The signatures'],
  ['Keyboard', 'The mouse'],
  []
];

function setupStage() {
  const gl = document.getElementById('gl');

  // --- visibility: the machine is on stage for the hero, the launch and the
  //     teardown, then steps aside while the written history takes over.
  //     On narrow screens the copy sits on top of it, so it is held back to
  //     a wash everywhere except the teardown, where the cards are opaque.
  const narrow = () => window.innerWidth < 900;
  let stageAlpha = 1;
  const show = (on) =>
    gsap.to(gl, { opacity: on ? stageAlpha : 0, duration: .7, overwrite: true });
  const setAlpha = (a) => {
    stageAlpha = narrow() ? a : 1;
    if (Number(gsap.getProperty(gl, 'opacity')) > 0.02) {
      gsap.to(gl, { opacity: stageAlpha, duration: .5, overwrite: true });
    }
  };

  revealStage = () => show(true);

  ScrollTrigger.create({
    trigger: '#hero', start: 'top bottom', endTrigger: '#teardown', end: 'bottom bottom',
    onToggle: (self) => show(self.isActive)
  });
  ScrollTrigger.create({
    trigger: '#outro', start: 'top 35%', end: 'bottom bottom',
    onToggle: (self) => show(self.isActive)
  });

  // --- camera framing per section. Setting a goal rather than a value means
  //     the camera eases there, and eases back when you scroll up.
  //     The third value is how present the stage is allowed to be on a phone.
  const frames = [
    ['#hero',    { radius: 15.5, theta: 0.55, phi: 1.34, targetY: 0.00, fov: 32, offsetX:  4.0 }, .34],
    ['#origins', { radius: 17.0, theta: -0.9, phi: 1.24, targetY: 0.10, fov: 30, offsetX:  3.2 }, .35],
    ['#launch',  { radius: 13.0, theta: 0.16, phi: 1.44, targetY: 0.20, fov: 34, offsetX:  3.4 }, .4 ],
    ['#rescue',  { radius: 17.0, theta: 1.20, phi: 1.28, targetY: 0.00, fov: 30, offsetX: -3.2 }, .35],
    ['#outro',   { radius: 14.5, theta: -0.4, phi: 1.32, targetY: 0.05, fov: 32, offsetX: 3.6 }, .45]
  ];
  frames.forEach(([sel, goal, alpha]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    // On a phone the copy takes the top of the screen, so the machine drops.
    const apply = () => { mac.frame(goal); setAlpha(alpha); mac.setMobileShift(1.35); };
    ScrollTrigger.create({
      trigger: el, start: 'top 60%', end: 'bottom 40%',
      onEnter: apply, onEnterBack: apply
    });
  });

  // In the teardown the machine is the subject, so it gets the full canvas.
  ScrollTrigger.create({
    trigger: '#teardown', start: 'top 80%', end: 'bottom 20%',
    // Teardown cards sit at the bottom on a phone, so the machine goes up.
    onEnter: () => { setAlpha(1); mac.setMobileShift(-0.75); },
    onEnterBack: () => { setAlpha(1); mac.setMobileShift(-0.75); }
  });

  // --- screen contents follow the story.
  const screens = [
    ['#hero', 'hello'], ['#origins', 'boot'], ['#launch', 'hello'],
    ['#rescue', 'finder'], ['#wilderness', 'sad'], ['#imac', 'finder'],
    ['#outro', 'hello']
  ];
  screens.forEach(([sel, mode]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 60%', end: 'bottom 40%',
      onEnter: () => mac.setScreen(mode),
      onEnterBack: () => mac.setScreen(mode)
    });
  });

  // --- the teardown itself: one scrubbed trigger over the whole tall section.
  ScrollTrigger.create({
    trigger: '#teardown',
    start: 'top top',
    end: 'bottom bottom',
    scrub: REDUCED ? false : 0.6,
    onUpdate: (self) => {
      const p = self.progress;
      const e = explodeCurve(p);
      mac.setExplode(e);
      mac.setSpin(-0.28 + p * 0.78);
      // Pull back as the machine spreads out, so nothing leaves the frame.
      mac.frame({
        radius: 12.0 + e * 6.8,
        theta: 0.55 - p * 0.34,
        phi: 1.34 - e * 0.14,
        targetY: 0.0 + e * 0.2,
        fov: 32,
        offsetX: -2.2
      });
      // The CRT is on its way out of the machine — cut the picture.
      mac.setScreen(e > 0.9 ? 'off' : (p < 0.1 ? 'finder' : 'hello'));

      // Label whatever the step beside the machine is describing.
      // A step's card is centred when p == index / (steps - 1), because the
      // scrubbed range runs from the first card centred to the last.
      const step = Math.round(p * (STEP_FOCUS.length - 1));
      mac.setFocus(STEP_FOCUS[step]);
    }
  });

  // --- step cards fade through as you pass each one, in both directions.
  if (!REDUCED) {
    // Each card rises in over the first third of its step, holds while the
    // step owns the viewport, then leaves. Driven by one scrubbed timeline
    // per step so it reads identically travelling up or down.
    document.querySelectorAll('.step').forEach((step) => {
      const card = step.querySelector('.step__card');
      gsap.timeline({
        scrollTrigger: { trigger: step, start: 'top bottom', end: 'bottom top', scrub: 0.5 }
      })
        .fromTo(card, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out' })
        .to(card, { opacity: 1, duration: 0.34 })
        .to(card, { opacity: 0, y: -70, duration: 0.32, ease: 'power2.in' });
    });
  }

  // --- a slow idle rotation everywhere outside the teardown, so the stage is
  //     never completely still.
  let idle = 0;
  const teardownEl = document.querySelector('#teardown');
  gsap.ticker.add(() => {
    const r = teardownEl.getBoundingClientRect();
    const inTeardown = r.top <= 0 && r.bottom >= window.innerHeight;
    if (!inTeardown && !REDUCED) {
      idle += 0.0016;
      mac.setSpin(Math.sin(idle) * 0.22);
    }
    mac.update();
  });
}

/* ------------------------------------------------------------------ *
 * 6. Go
 * ------------------------------------------------------------------ */

setupReveals();
setupRail();
setupStage();

if (REDUCED) {
  boot.classList.add('is-done');
  document.body.classList.remove('is-booting');
  document.getElementById('gl').style.opacity = 1;
  mac.frame({ radius: 11, theta: 0.5, phi: 1.3, targetY: 0.1, fov: 32, offsetX: 0 });
} else {
  // Fake-but-honest progress: the scene is already built by the time this
  // module runs, so the bar is just the two seconds of theatre a 1984 Mac
  // would have spent finding its startup disk.
  let pct = 0;
  const tick = setInterval(() => {
    pct = Math.min(100, pct + 8 + Math.random() * 14);
    bootBar.style.width = pct + '%';
    if (pct >= 100) { clearInterval(tick); setTimeout(finishBoot, 420); }
  }, 110);
}

window.addEventListener('load', () => ScrollTrigger.refresh());
