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
| `SITE.heroImageId` | Which gallery photograph fronts the homepage |
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
  assets/vendor/       leaflet, vendored (no CDN at runtime)
optional-functions/    Cloudflare Pages Function alternative to Formspree
tools/                 placeholder OG image generator
```

URLs: English at `/`, `/about/`, … Arabic at `/ar/`, `/ar/about/`, … Each page
carries `hreflang` pointers to its counterpart and `x-default` → English.

## Homepage hero

A plain editorial hero: copy on one side, a photograph on the other, mirrored
under RTL by the same logical properties as the rest of the site. Change which
photograph fronts it by setting `SITE.heroImageId` in `content/site.mjs` to any
`GALLERY` entry id.

The scroll-driven 3D hero that used to live here has been removed at the
founder's request, along with the vendored Three.js bundle (~690KB). Nothing on
the site loads WebGL any more.

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
