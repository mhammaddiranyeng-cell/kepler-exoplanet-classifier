# Portfolio — Mhammad Ali Dirany

A single-file, dependency-free personal portfolio site. Everything lives in
[`index.html`](./index.html): HTML, CSS and JavaScript, no build step, no framework.

## Contents

- Hero with availability badge, portrait and quick stats
- About + full personal/contact details
- Skills grouped into six domains (automation, embedded/IoT, ML, networking, software, leadership)
- Eight projects with filterable categories and expandable engineering detail
- Education, certifications and research timeline
- NABA NGO leadership section
- Contact block (email, phone, LinkedIn)

Extras: light/dark theme toggle (remembered per browser), animated starfield background,
scroll reveal animations, scroll-spy navigation, responsive down to mobile, and
`prefers-reduced-motion` support.

## Add your photo

Save your portrait as `docs/assets/profile.jpg`. Until it exists, the portrait
circle shows the initials "MD" instead. See [`assets/README.md`](./assets/README.md).

## Publish it on GitHub Pages

Two options — pick one.

**Option A — serve the `docs/` folder directly (simplest, no Actions needed):**

1. Merge this branch into `main`.
2. Repo → **Settings** → **Pages**.
3. Under *Build and deployment*, set **Source: Deploy from a branch**,
   **Branch: `main`**, **Folder: `/docs`**, then **Save**.
4. The site goes live at
   `https://mhammaddiranyeng-cell.github.io/kepler-exoplanet-classifier/`
   after a minute or two.

**Option B — GitHub Actions workflow (already included):**

1. Merge this branch into `main`.
2. Repo → **Settings** → **Pages** → *Build and deployment* →
   **Source: GitHub Actions**.
3. The [`Deploy portfolio to GitHub Pages`](../.github/workflows/pages.yml)
   workflow publishes `docs/` on every push to `main` that touches it, and can
   also be run manually from the **Actions** tab.

### Want a cleaner URL?

Create a new repository named exactly `mhammaddiranyeng-cell.github.io`, copy the
contents of this `docs/` folder into its root, and the site is served from
`https://mhammaddiranyeng-cell.github.io/` with no subpath.

## Editing

Open `index.html` and edit the markup directly — sections are commented
(`<!-- PROJECTS -->`, `<!-- SKILLS -->`, …). Colours live in the `:root` /
`html[data-theme="light"]` CSS variable blocks at the top of the `<style>` tag.

To add a project, copy any `<article class="card project" data-tags="...">` block
and change its content. Valid `data-tags` values (space-separated) are
`hardware`, `ml`, `research`, `software` — they drive the filter buttons.

## Local preview

```bash
python3 -m http.server 8080 --directory docs
# then open http://localhost:8080
```
