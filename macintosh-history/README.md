# The Macintosh — a scroll-driven history

A single-page, animation-heavy history of the Apple Macintosh with a 3D
Macintosh 128K that **comes apart as you scroll down and rebuilds itself as you
scroll back up**.

```
macintosh-history/
├── index.html          # the whole page: boot screen, chapters, teardown steps
├── css/style.css
├── js/
│   ├── mac3d.js        # the procedural Macintosh + exploded-view controller
│   └── main.js         # smooth scroll, scroll-triggered animation, camera
└── vendor/             # three.js, GSAP + ScrollTrigger, Lenis (bundled locally)
```

## Running it

Because the page uses ES modules and an import map, it must be served over
HTTP — opening `index.html` from the filesystem will fail on CORS.

```bash
cd macintosh-history
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static host works: GitHub Pages, Netlify, `npx serve`, nginx. There is no
build step, no bundler, no package.json, and no network access at runtime.

## Where the 3D model came from

Nowhere — it does not exist as a file. There is no `.glb`, no `.obj`, no
texture image anywhere in this directory. `js/mac3d.js` builds the entire
machine at load time out of three.js primitives and extruded 2D profiles:

| Part | How it is made |
|---|---|
| Front bezel | An extruded rounded rectangle with the screen opening and floppy slot punched through as holes |
| Rear housing | Five separate panels, so the exploded view reveals a hollow shell |
| CRT | Faceplate + four-sided tapered funnel + neck + deflection yoke + anode lead |
| Screen | A live 512 × 342 canvas — the 128K's exact framebuffer — drawn every frame |
| Logic board | A PCB with a 64-pin 68000, sixteen DRAMs, ROMs and rear connectors, DIP legs drawn as instanced meshes |
| Analog board | Flyback transformer, finned heatsink, electrolytics |
| Floppy drive | Sony 3.5" mechanism with a disk loaded inside it |
| Signature plate | The team's 47 signatures, drawn as text into a canvas texture |
| Keyboard | Extruded wedge + 44 instanced keycaps |
| Mouse | Extruded rounded body with a coiled cable swept along a helix |

Textures are the same story: the circuit traces are a seeded random walk on a
canvas, the rear vents are drawn rectangles, the screen is Chicago-ish text and
dither patterns painted at 512 × 342 with nearest-neighbour filtering so the
pixels stay square and hard-edged.

This was a deliberate choice. Higgsfield and similar AI tools generate *video
clips*, which cannot be taken apart, rotated, or driven by scroll position —
and they are not free. Procedural geometry costs nothing, has no licence
attached, and is the only approach that makes a genuinely interactive,
reversible teardown possible.

## How the teardown works

The exploded view is a **pure function of one number**. Each part registers a
home position, a direction, a distance and a delay:

```js
part.obj.position.copy(part.home).addScaledVector(part.dir, part.dist * eased);
```

`explode` (0 → 1) comes from a single GSAP ScrollTrigger scrubbed over the tall
teardown section. Because nothing is stateful and nothing is a one-shot
animation, scrolling up runs the exact same maths backwards — the machine
reassembles in the reverse order it came apart, with no drift and no snapping.

The curve holds fully-exploded across the last few steps and then returns to
zero, so the final step shows the machine whole again.

## Animation that follows the scroll in both directions

Every reveal uses `toggleActions: 'play none none reverse'` or a scrubbed
timeline, so text that animated in on the way down animates back out on the way
up. Nothing is left "already finished" behind the reader. Section triggers also
drive:

- **the camera** — each chapter sets a spherical framing goal that the camera
  eases toward, so direction changes read as momentum rather than cuts
- **the screen** — the CRT shows `hello`, the Happy Mac, a Finder desktop or a
  Sad Mac depending on which part of the story is on screen
- **the part labels** — only the component the current step is describing is
  labelled, projected from 3D to screen space each frame

## Accessibility and performance

- `prefers-reduced-motion: reduce` disables smooth scrolling, the boot screen,
  the grain and all scrubbing; the page becomes an ordinary static document with
  a still 3D render.
- Pixel ratio is capped at 2; there are no shadow maps (the contact shadow is a
  gradient decal); repeated geometry uses `InstancedMesh`.
- On phones the machine slides out of the way of the copy, its opacity is held
  back outside the teardown, and the part labels are hidden — the step cards
  carry the same information.
- Keyboard: a skip link, and the year rail entries are clickable.

## Third-party code

All bundled in `vendor/`, no CDN, no analytics, no network requests at runtime.

| Library | Version | Licence |
|---|---|---|
| [three.js](https://threejs.org) | 0.160.0 | MIT (`vendor/LICENSE.three.txt`) |
| [GSAP + ScrollTrigger](https://gsap.com) | 3.12.5 | GSAP standard "no charge" licence — free for this use |
| [Lenis](https://github.com/darkroomengineering/lenis) | 1.1.14 | MIT (`vendor/LICENSE.lenis.txt`) |

## A note on the history

The dates, prices, part numbers and quotations are drawn from the well
documented public record of the Macintosh (the 1984 introduction, the 128K's
specifications, the desktop publishing rescue, the PowerPC, Intel and Apple
silicon transitions). The 47 names on the signature plate are the Macintosh
division's 1982 signing, reproduced as text.
