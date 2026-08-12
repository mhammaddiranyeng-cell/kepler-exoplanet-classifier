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
| `SITE.social.facebook` | No Facebook link in the footer or in `sameAs` |
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
  assets/css/site.css  brand palette + full RTL support
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

The model is a **picture frame holding NABA's current headline activity**.

| Scroll | What happens |
|---|---|
| 0 – 8% | Frame sits centred, picture dark, breathing gently |
| 8 – 36% | Travels a fixed curved path to the inline-end side, rotating |
| 36 – 46% | The picture lights up — opens from a band with a warm bloom |
| 46 – 66% | The caption writes itself on over the photograph |
| 66 – 92% | The frame opens into an exploded view: glass, photo, mount board, backing and the four moulding rails |
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

**The photograph:** the frame displays `/assets/img/hero-frame.jpg` when that
file exists, and falls back to a drawn placeholder carrying the same caption
until it does — a missing asset never breaks the sequence. Drop in a portrait
photo of the current activity at roughly 900×1200 and it appears automatically.
When the headline activity changes, swap that file and edit `CAPTION` at the top
of `hero3d.js` (both languages).

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
  postal address, and `sameAs` → Instagram, LinkedIn (and Facebook once set);
- gives every page a distinct, specific meta description — no NGO boilerplate;
- ships `sitemap.xml` (with `hreflang` alternates) and `robots.txt`.

Update `SITE.url` if the site ever moves off `naba.ngo`.

## Brand

The palette is **sampled directly from the NABA logo**: the bronze/earth tones of
the نبا calligraphy and the cupped hand, the blue of the globe, and the cream
ground. Every colour is a CSS custom property at the top of `site.css` — nothing
else hard-codes one, so retuning the brand means editing those tokens and
nothing more. The 3D hero mirrors the same values. Typography: **Cairo** for
Arabic, **Inter** for English.

The logo itself is `static/assets/img/logo.png`, used for the header lockup, the
footer, and the favicon. A dedicated 1200×630 share card built from the logo
would still be an improvement over the generated `og-placeholder.png`.

Remaining placeholder image slots are neutral blocks, never stock photography —
see `static/assets/img/README.md` for the exact sizes to drop in.

---

## Open questions

1. **Photographs.** The hero frame (`hero-frame.jpg`) and the gallery still need
   the real image files committed — they came through in chat as inline images
   rather than as files, so they could not be saved into the repo.
2. **Facebook page URL** for "Naba Qasarnaba" → `SITE.social.facebook`.
3. **Confirm +961 76 890 159** (from the roll-up banner) as the primary number.
4. **Bank details**: currently contact-only. See the note in `content/site.mjs`
   before publishing an account number on a public page.
5. **Form backend**: create the Formspree forms and paste the endpoints, or move
   `optional-functions/contact.js` into `functions/api/`.

Still pending review: **all Arabic prose is a draft translation**, and every
impact figure came from the most recent grant application rather than a verified
current count.

Deliberately not published: **Care International is named nowhere on the site**
(`funderPublic: false`), and the Summer Camp instructor team is credited
collectively rather than by name, pending each person's consent.
