# NABA NGO — naba.ngo

Bilingual (English / Arabic) static website for **NABA NGO** — جمعية نبا — a
grassroots organisation in Qasarnaba, Bekaa Valley, Baalbek District, Lebanon.

No framework, no bundler, no runtime dependencies. A ~250-line Node script
renders every page from one content file into `dist/`, which is what Cloudflare
Pages serves.

---

## Quick start

```bash
node build.mjs          # -> dist/
node build.mjs --serve  # -> dist/ + preview on http://localhost:4321
```

Node 18+. `npm install` is not needed to build — the only dev dependency
(Playwright) is for the optional screenshot checks.

## Deploying to Cloudflare Pages

The domain is already registered at Namecheap and pointed at Cloudflare.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   *Connect to Git*, pick this repository.
2. Build settings:
   | Setting | Value |
   |---|---|
   | Framework preset | None |
   | Build command | `node build.mjs` |
   | Build output directory | `dist` |
   | Root directory | `naba-website` |
3. **Custom domains** → add `naba.ngo` and `www.naba.ngo`. Cloudflare writes
   the DNS records itself since the zone is already on Cloudflare.
4. **Web Analytics** → enable for `naba.ngo`, copy the token, and paste it into
   `SITE.cfAnalyticsToken` in `content/site.mjs`. Cookieless, free, no consent
   banner needed. Until the token is set, no beacon is emitted at all.

## Editing content

**Everything is in `content/site.mjs`.** Contact details, programs, impact
numbers, team, gallery captions, news posts and all page copy for both
languages live there; the templates only lay it out. Add a news post by putting
a new object at the top of `NEWS`; add a program by appending to `PROGRAMS`.

Markers used throughout that file:

- `REVIEW:` — wording, a number or a partner name you should confirm before publishing.
- `TRANSLATION:` — **Arabic drafted by Claude; needs a native review pass.**
- `TODO:` — a fact that is still missing (see *Open questions* below).

Existing Arabic program titles are used verbatim and must not be re-translated:
صحتك بالدنيا · حمايتنا أونلاين · نساء الورد · ورد جوري

### Safety switches already wired in

| Flag in `content/site.mjs` | Effect while unset/false |
|---|---|
| `PROGRAMS[].funderPublic` | Care International is **not** named anywhere on the public site |
| `TEAM[].consent` | That person renders as an unnamed placeholder card |
| `SITE.foundingYear` | The "est. YYYY" marker is suppressed |
| `SITE.forms.*Endpoint` | Forms render disabled with an email fallback instead of silently dropping submissions |
| `SITE.location.coordsAreApproximate` | Map shows an "approximate location" note and omits `geo` from structured data |
| `SITE.whatsappEnabled` | Set to `false` to drop all WhatsApp links |

## Structure

```
build.mjs              generates dist/ (pages, sitemap.xml, robots.txt, 404)
content/site.mjs       ALL copy + config, EN and AR
templates/layout.mjs   <head>, header, footer, JSON-LD, OG tags, hreflang
templates/pages.mjs    per-page body markup
static/                copied verbatim into dist/
  assets/css/site.css  provisional palette + full RTL support
  assets/js/site.js    mobile nav, form submission, lazy Leaflet map
  assets/js/hero3d.js  scroll-driven 3D hero (homepage only)
  assets/vendor/       three.js + leaflet, vendored (no CDN at runtime)
optional-functions/    Cloudflare Pages Function alternative to Formspree
tools/                 placeholder OG image generator
```

URLs: English at `/`, `/about/`, … Arabic at `/ar/`, `/ar/about/`, … Each page
carries `hreflang` pointers to its counterpart and `x-default` → English.

## The 3D hero

`static/assets/js/hero3d.js`. Scroll position is the *only* input — the model
cannot be dragged or rotated by the visitor. The timeline:

| Scroll | What happens |
|---|---|
| 0 – 8% | Model sits centred, screen off, breathing gently |
| 8 – 36% | Travels a fixed curved path to the inline-end side, rotating |
| 36 – 46% | Screen powers on — backlight opens with a warm flash |
| 46 – 66% | Bilingual "hello / أهلاً" greeting writes itself on |
| 66 – 92% | Model explodes apart into an exploded-view diagram |
| 92 – 100% | Holds, then the page continues into normal content |

Motion is eased rather than stepped: scroll sets a *target* and the model
follows it with a damped lerp, so it never snaps.

The path mirrors under RTL — on Arabic pages the model travels to the **left**.

**It is progressive enhancement only.** All hero copy and every section below
it is in the DOM unconditionally. The module refuses to even download Three.js
(~690 KB) when: reduced motion is requested, WebGL is unavailable, Save-Data is
on, `deviceMemory ≤ 2`, or `hardwareConcurrency ≤ 2` — the hero then stays a
normal static panel. Rendering pauses when the hero scrolls out of view or the
tab is hidden. The hero only exists on the homepage; no other page loads
Three.js at all.

> **The model is a placeholder.** Nobody specified what it should depict, so
> `buildDevice()` assembles a neutral generic device from primitives. To swap in
> real art, replace that function with a `GLTFLoader` load, keep a mesh named
> `screen` using `screenMaterial`, and tag each part with
> `mesh.userData.explode = new THREE.Vector3(x, y, z)`. Nothing else changes.

## Forms

Both forms (volunteer + contact) post to one static-form backend. Two options,
pick one:

**A. Formspree** (default, simplest — no keys, no DNS)
1. Create two forms at [formspree.io](https://formspree.io) (free tier: 50
   submissions/month) pointed at `naba.beqaa@gmail.com`.
2. Paste the endpoints into `SITE.forms.contactEndpoint` and
   `SITE.forms.volunteerEndpoint`.

**B. Cloudflare Pages Function** (no monthly cap, needs a sender domain)
See the header comment in `optional-functions/contact.js` for the three-step
setup.

Both are progressive: with JS the submission happens in place; without JS the
form does an ordinary POST. A honeypot field catches bots in either case.

## Map

Leaflet + OpenStreetMap tiles — keyless, free, and not dependent on NABA being
indexed by Google. Vendored locally and lazy-loaded only when the map scrolls
into view. Set `SITE.location.lat` / `lng` to the real premises coordinates and
flip `coordsAreApproximate` to `false`.

> **Action item outside the code:** set up a free **Google Business Profile**
> for "NABA NGO" in Qasarnaba. That — not any code here — is what makes the
> organisation appear in Google Maps and Google Search. Once it exists, a Google
> Maps embed can be added alongside the Leaflet map.

## SEO

There is an unrelated Beirut-based NGO called "Nabaa" (est. 2001, Palestinian
refugee communities) that currently dominates search for the name. To
disambiguate, the site:

- pairs "NABA NGO" with **Qasarnaba** and **Bekaa Valley** in every title, meta
  description and H1;
- emits `schema.org` **NGO** structured data with `alternateName`, a specific
  postal address, and `sameAs` → Instagram + LinkedIn;
- gives every page a distinct, specific meta description — no NGO boilerplate;
- ships `sitemap.xml` (with `hreflang` alternates) and `robots.txt`.

Update `SITE.url` if the site ever moves off `naba.ngo`.

## Brand

**The palette is provisional** and labelled as such in the site footer. Deep
rose/burgundy (Damascus rose), olive green and warm sand — chosen for the Bekaa
context, not from any official NABA guideline. Every colour is a CSS custom
property at the top of `site.css`; replacing those tokens re-skins the whole
site. Typography: **Cairo** for Arabic, **Inter** for English.

Placeholder image slots are neutral blocks, never stock photography — see
`static/assets/img/README.md` for the exact sizes to drop in.

---

## Open questions

These were flagged during the build and are not guessed at anywhere in the code.
Answer them in `content/site.mjs` and rebuild.

1. **What should the 3D hero model depict?** (currently a generic placeholder device)
2. **NABA's founding year** — for the "est. YYYY" credibility marker.
3. **Exact address or GPS coordinates** in Qasarnaba — only the town is known.
4. **Care International**: okay to name publicly as a funder? And should the
   pending نساء الورد / ورد جوري proposals appear on the public site at all yet?
   They currently appear in a clearly-labelled "proposed, awaiting confirmation"
   section — delete them from `PROGRAMS` if you'd rather they stayed private.
5. **Team**: role/title, short bio, and explicit consent to be named and
   photographed publicly, per person.
6. **Donations**: contact-to-arrange only (what's built), or link an existing
   fundraising platform? No payment integration was built.
7. **WhatsApp** click-to-chat links alongside the phone numbers — keep them?
8. **Form backend**: Formspree or the Pages Function?

Also pending review: **all Arabic prose is a draft translation**, and every
impact figure came from the most recent grant application rather than a verified
current count.
