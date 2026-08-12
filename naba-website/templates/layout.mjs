/**
 * Page shell: <head>, header, footer, structured data.
 * Every page on the site is rendered through `layout()`.
 */

import { SITE, LANGS, NAV, COPY } from "../content/site.mjs";

export const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Site-root-relative URL for a page slug in a given language. */
export function href(lang, slug) {
  const base = lang === "ar" ? "/ar/" : "/";
  return slug ? `${base}${slug}/` : base;
}

/** Absolute URL, used for canonical/hreflang/OG/sitemap. */
export const absolute = (path) => `${SITE.url}${path}`;

function organizationJsonLd(lang) {
  const data = {
    "@context": "https://schema.org",
    "@type": "NGO",
    "@id": `${SITE.url}/#organization`,
    name: "NABA NGO",
    alternateName: ["NABA", "جمعية نبا", "NABA Qasarnaba"],
    url: SITE.url,
    email: SITE.email,
    telephone: SITE.phones.map((p) => p.tel),
    // Deliberately specific: distinguishes NABA from the unrelated Beirut-based
    // "Nabaa" NGO that currently dominates search for the name.
    description:
      "NABA NGO (جمعية نبا) is a grassroots community organisation based in Qasarnaba, Baalbek District, Bekaa Valley, Lebanon, working in women's economic empowerment, gender-based violence and mental-health awareness, child development, and Damascus rose agricultural value chains.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Qasarnaba",
      addressRegion: "Baalbek District, Bekaa Governorate",
      addressCountry: "LB",
    },
    areaServed: { "@type": "Place", name: "Bekaa Valley, Lebanon" },
    sameAs: [SITE.social.instagram, SITE.social.linkedin, SITE.social.facebook].filter(Boolean),
    inLanguage: ["en", "ar"],
  };
  if (SITE.foundingYear) data.foundingDate = String(SITE.foundingYear);
  if (SITE.location.lat && SITE.location.lng && !SITE.location.coordsAreApproximate) {
    data.geo = { "@type": "GeoCoordinates", latitude: SITE.location.lat, longitude: SITE.location.lng };
  }
  return JSON.stringify(data, null, 2);
}

function header(lang, slug) {
  const t = COPY[lang];
  const nav = NAV.map((item) => {
    const active = item.slug === slug;
    return `<li><a href="${href(lang, item.slug)}"${active ? ' aria-current="page"' : ""}>${esc(item[lang])}</a></li>`;
  }).join("\n            ");

  return `    <a class="skip-link" href="#main">${esc(t.skipToContent)}</a>
    <header class="site-header" data-header>
      <div class="wrap site-header__inner">
        <a class="brand" href="${href(lang, "")}">
          <img class="brand__mark" src="/assets/img/logo.png" alt="" width="535" height="763" aria-hidden="true">
          <span class="brand__text">
            <span class="brand__name">NABA NGO</span>
            <span class="brand__sub">${lang === "ar" ? "جمعية نبا" : "جمعية نبا"}</span>
          </span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
          <span class="nav-toggle__bars" aria-hidden="true"></span>
          <span class="visually-hidden">${esc(t.menu)}</span>
        </button>
        <nav class="site-nav" id="site-nav" data-nav>
          <ul>
            ${nav}
          </ul>
          <a class="lang-switch" href="${href(LANGS[lang].other, slug)}" lang="${LANGS[lang].other}" hreflang="${LANGS[lang].other}">${esc(t.langSwitchLabel)}</a>
        </nav>
      </div>
    </header>`;
}

function footer(lang) {
  const t = COPY[lang].footer;
  const phoneLinks = SITE.phones
    .map(
      (p) =>
        `<li><a href="tel:${p.tel}" dir="ltr">${esc(p.display)}</a>${
          SITE.whatsappEnabled
            ? ` <a class="wa-link" href="https://wa.me/${p.wa}" rel="noopener" aria-label="WhatsApp ${esc(p.display)}">WhatsApp</a>`
            : ""
        }</li>`
    )
    .join("\n              ");

  const links = NAV.map((i) => `<li><a href="${href(lang, i.slug)}">${esc(i[lang])}</a></li>`).join(
    "\n              "
  );

  return `    <footer class="site-footer">
      <div class="wrap site-footer__grid">
        <div class="site-footer__brand">
          <img class="site-footer__logo" src="/assets/img/logo.png" alt="" width="535" height="763" aria-hidden="true">
          <p class="site-footer__name">NABA NGO</p>
          <p class="site-footer__ar" lang="ar" dir="rtl">جمعية نبا</p>
          <p class="site-footer__tagline">${esc(t.tagline)}</p>
          <p class="site-footer__est">${esc(t.established)}</p>
        </div>
        <div>
          <h2 class="site-footer__heading">${esc(t.exploreTitle)}</h2>
          <ul class="site-footer__list">
              ${links}
          </ul>
        </div>
        <div>
          <h2 class="site-footer__heading">${esc(t.contactTitle)}</h2>
          <ul class="site-footer__list">
              <li><a href="mailto:${SITE.email}" dir="ltr">${SITE.email}</a></li>
              ${phoneLinks}
              <li>${esc(SITE.location[lang])}</li>
          </ul>
        </div>
        <div>
          <h2 class="site-footer__heading">${esc(t.followTitle)}</h2>
          <ul class="site-footer__list">
              <li><a href="${SITE.social.instagram}" rel="me noopener">Instagram</a></li>
              <li><a href="${SITE.social.linkedin}" rel="me noopener">LinkedIn</a></li>
              ${SITE.social.facebook ? `<li><a href="${SITE.social.facebook}" rel="me noopener">Facebook</a></li>` : ""}
          </ul>
        </div>
      </div>
      <div class="wrap site-footer__legal">
        <p>&copy; ${new Date().getFullYear()} NABA NGO. ${esc(t.rights)}</p>
        <p class="site-footer__note">${esc(t.registration)}</p>
      </div>
    </footer>`;
}

/**
 * @param {object} o
 * @param {"en"|"ar"} o.lang
 * @param {string} o.slug        page slug ("" for home)
 * @param {string} o.title       <title> / og:title
 * @param {string} o.description meta description
 * @param {string} o.body        page markup
 * @param {string} [o.head]      extra <head> markup
 * @param {string} [o.scripts]   extra markup before </body>
 * @param {boolean} [o.noIndex]
 */
export function layout({ lang, slug, title, description, body, head = "", scripts = "", noIndex = false }) {
  const L = LANGS[lang];
  const path = href(lang, slug);
  const canonical = absolute(path);

  const analytics = SITE.cfAnalyticsToken
    ? `\n    <!-- Cloudflare Web Analytics (cookieless) -->\n    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${SITE.cfAnalyticsToken}"}'></script>`
    : `\n    <!-- Cloudflare Web Analytics: set SITE.cfAnalyticsToken in content/site.mjs to enable the cookieless beacon. -->`;

  return `<!doctype html>
<html lang="${L.code}" dir="${L.dir}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    ${noIndex ? '<meta name="robots" content="noindex">' : ""}
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" hreflang="en" href="${absolute(href("en", slug))}">
    <link rel="alternate" hreflang="ar" href="${absolute(href("ar", slug))}">
    <link rel="alternate" hreflang="x-default" href="${absolute(href("en", slug))}">

    <link rel="icon" href="/assets/img/logo.png" type="image/png">
    <link rel="apple-touch-icon" href="/assets/img/logo.png">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="NABA NGO">
    <meta property="og:locale" content="${lang === "ar" ? "ar_LB" : "en_US"}">
    <meta property="og:locale:alternate" content="${lang === "ar" ? "en_US" : "ar_LB"}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${absolute("/assets/img/og-placeholder.png")}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${absolute("/assets/img/og-placeholder.png")}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap">
    <link rel="stylesheet" href="/assets/css/site.css">

    <script type="application/ld+json">
${organizationJsonLd(lang)}
    </script>${analytics}${head}
  </head>
  <body class="lang-${lang}">
${header(lang, slug)}
    <main id="main">
${body}
    </main>
${footer(lang)}
    <script src="/assets/js/site.js" defer></script>${scripts}
  </body>
</html>
`;
}
