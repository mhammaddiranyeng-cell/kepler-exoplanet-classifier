#!/usr/bin/env node
/**
 * Static build for naba.ngo.
 *
 *   node build.mjs        -> writes dist/
 *   node build.mjs --serve -> writes dist/ and serves it on :4321 for preview
 *
 * No dependencies, no bundler. Cloudflare Pages settings:
 *   Build command:    node build.mjs
 *   Output directory: dist
 */

import { mkdir, writeFile, readdir, copyFile, stat, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE, NAV, COPY, OPEN_QUESTIONS } from "./content/site.mjs";
import { layout, href, absolute } from "./templates/layout.mjs";
import * as pages from "./templates/pages.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "dist");
const STATIC = join(ROOT, "static");

/** slug -> { render, copyKey } ; copyKey indexes COPY[lang] for meta tags. */
const ROUTES = [
  { slug: "", render: pages.home, copyKey: "home" },
  { slug: "about", render: pages.about, copyKey: "about" },
  { slug: "programs", render: pages.programs, copyKey: "programs" },
  { slug: "impact", render: pages.impact, copyKey: "impact" },
  { slug: "team", render: pages.team, copyKey: "team" },
  { slug: "gallery", render: pages.gallery, copyKey: "gallery" },
  { slug: "news", render: pages.news, copyKey: "news" },
  { slug: "get-involved", render: pages.getInvolved, copyKey: "getInvolved" },
  { slug: "contact", render: pages.contact, copyKey: "contact" },
];

const LANGS = ["en", "ar"];

/** The hero's Three.js bundle is only ever requested on the homepage. */
const HERO_SCRIPTS = `
    <script type="module" src="/assets/js/hero3d.js"></script>`;

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await copyFile(s, d);
  }
}

async function emit(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, "utf8");
}

/** dist path for a language + slug, using directory-index URLs. */
function outPath(lang, slug) {
  const parts = [OUT];
  if (lang === "ar") parts.push("ar");
  if (slug) parts.push(slug);
  parts.push("index.html");
  return join(...parts);
}

function sitemap() {
  const urls = [];
  for (const lang of LANGS) {
    for (const r of ROUTES) {
      const loc = absolute(href(lang, r.slug));
      const alts = LANGS.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absolute(href(l, r.slug))}"/>`
      ).join("\n");
      urls.push(
        `  <url>\n    <loc>${loc}</loc>\n${alts}\n    <changefreq>${r.slug === "" || r.slug === "news" ? "weekly" : "monthly"}</changefreq>\n    <priority>${r.slug === "" ? "1.0" : "0.7"}</priority>\n  </url>`
      );
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
}

function robots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`;
}

async function build() {
  await rm(OUT, { recursive: true, force: true });
  await copyDir(STATIC, OUT);

  let count = 0;
  for (const lang of LANGS) {
    for (const route of ROUTES) {
      const meta = COPY[lang][route.copyKey];
      const html = layout({
        lang,
        slug: route.slug,
        title: meta.metaTitle,
        description: meta.metaDescription,
        body: route.render(lang),
        // The 3D hero lives on the homepage only — other pages never load Three.js.
        scripts: route.slug === "" ? HERO_SCRIPTS : "",
      });
      await emit(outPath(lang, route.slug), html);
      count++;
    }
  }

  // Cloudflare Pages serves /404.html for unmatched routes (English shell).
  await emit(
    join(OUT, "404.html"),
    layout({
      lang: "en",
      slug: "",
      title: COPY.en.notFound.metaTitle,
      description: COPY.en.notFound.metaDescription,
      body: pages.notFound("en"),
      noIndex: true,
    })
  );

  await emit(join(OUT, "sitemap.xml"), sitemap());
  await emit(join(OUT, "robots.txt"), robots());

  console.log(`✓ built ${count} pages + 404, sitemap, robots -> ${relative(ROOT, OUT)}/`);

  const warnings = [];
  if (!SITE.forms.contactEndpoint || !SITE.forms.volunteerEndpoint)
    warnings.push("Form endpoints are not set — forms render disabled with an email fallback.");
  if (!SITE.cfAnalyticsToken) warnings.push("Cloudflare Web Analytics token not set — beacon omitted.");
  if (!SITE.foundingYear) warnings.push("Founding year unknown — 'est. YYYY' marker suppressed.");
  if (SITE.location.coordsAreApproximate)
    warnings.push("Map pin uses approximate Qasarnaba coordinates.");
  if (warnings.length) {
    console.log("\nPending configuration:");
    for (const w of warnings) console.log(`  · ${w}`);
  }
  console.log("\nOpen questions for the founder:");
  OPEN_QUESTIONS.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
}

/* --------------------- optional preview server --------------------- */

async function serve(port = 4321) {
  const { createServer } = await import("node:http");
  const { readFile } = await import("node:fs/promises");
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".xml": "application/xml",
    ".txt": "text/plain; charset=utf-8",
  };
  createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    let file = join(OUT, p);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    } catch {
      file = join(OUT, "404.html");
      res.statusCode = 404;
    }
    try {
      const body = await readFile(file);
      const ext = file.slice(file.lastIndexOf("."));
      res.setHeader("content-type", types[ext] || "application/octet-stream");
      res.end(body);
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  }).listen(port, () => console.log(`\npreview: http://localhost:${port}/`));
}

await build();
if (process.argv.includes("--serve")) await serve();
