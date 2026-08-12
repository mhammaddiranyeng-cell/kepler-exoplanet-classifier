/**
 * Page body renderers. Each exported function returns the markup that goes
 * inside <main>, and is wrapped by layout() in build.mjs.
 */

import { SITE, COPY, PROGRAMS, IMPACT, TEAM, GALLERY, NEWS } from "../content/site.mjs";
import { esc, href, asset } from "./layout.mjs";

const P = (s) => `<p>${esc(s)}</p>`;
const paras = (arr = []) => arr.map(P).join("\n            ");

/** A gallery tile: the real photograph when we have it, a neutral block if not. */
function tile(lang, g, placeholder) {
  const media = g.src
    ? `<img src="${asset(g.src)}" alt="${esc(g[lang].caption)}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async">`
    : slot(g.ratio, placeholder);
  return `<figure class="tile">
              ${media}
              <figcaption>${esc(g[lang].caption)}</figcaption>
            </figure>`;
}

/** Image slot placeholder — a neutral block, never stock photography. */
function slot(ratio, label, cls = "") {
  return `<div class="img-slot ${cls}" style="aspect-ratio:${ratio}" role="img" aria-label="${esc(label)}">
              <span class="img-slot__label">${esc(label)}</span>
            </div>`;
}

function programCard(lang, prog, copy) {
  const c = prog[lang];
  const funder =
    prog.funder && prog.funderPublic
      ? `<p class="card__funder">${esc(copy.programs.funderLabel)} ${esc(prog.funder)}</p>`
      : "";
  return `<article class="card card--program" id="${prog.id}">
              <p class="card__tag ${prog.status === "proposed" ? "card__tag--proposed" : ""}">${esc(c.tag)}</p>
              <h3 class="card__title">${esc(c.title)}</h3>
              <p class="card__summary">${esc(c.summary)}</p>
              ${paras(c.body)}
              ${funder}
            </article>`;
}

/* ----------------------------- Home ----------------------------- */

export function home(lang) {
  const t = COPY[lang].home;
  const active = PROGRAMS.filter((p) => p.status === "active").slice(0, 3);

  const heroCopy = `<p class="hero__kicker">${esc(t.heroKicker)}</p>
            <h1 class="hero__title">${esc(t.heroTitle)}</h1>
            <p class="hero__subtitle" lang="${lang === "ar" ? "en" : "ar"}" dir="${lang === "ar" ? "ltr" : "rtl"}">${esc(t.heroSubtitle)}</p>
            <p class="hero__lede">${esc(t.heroLede)}</p>
            <p class="hero__actions">
              <a class="btn btn--primary" href="${href(lang, "programs")}">${esc(t.heroCta)}</a>
              <a class="btn btn--ghost" href="${href(lang, "get-involved")}">${esc(t.heroCtaSecondary)}</a>
            </p>`;

  return `      <!-- ============================================================
           3D SCROLL HERO
           The canvas is progressive enhancement only: the copy below is in the
           DOM unconditionally, so the page is fully readable and indexable with
           JS off, WebGL unavailable, or reduced-motion requested. hero3d.js
           lazy-loads Three.js and only then sets data-hero-active on the
           section, which is what turns on the tall scroll track.
           ============================================================ -->
      <section class="hero" data-hero aria-labelledby="hero-title">
        <div class="hero__stage" data-hero-stage>
          <canvas class="hero__canvas" data-hero-canvas aria-hidden="true"></canvas>
          <div class="hero__copy" data-hero-copy>
            ${heroCopy.replace('class="hero__title"', 'class="hero__title" id="hero-title"')}
          </div>
          <p class="hero__scroll-hint" data-hero-hint aria-hidden="true">${esc(COPY[lang].scrollHint)}</p>
        </div>
      </section>

      <section class="section section--mission">
        <div class="wrap prose">
          <h2>${esc(t.missionTitle)}</h2>
          ${paras(t.missionBody)}
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <div class="section__head">
            <h2>${esc(t.programsTitle)}</h2>
            <a class="link-more" href="${href(lang, "programs")}">${esc(t.programsLink)}</a>
          </div>
          <div class="grid grid--3">
            ${active
              .map(
                (p) => `<article class="card">
              <p class="card__tag">${esc(p[lang].tag)}</p>
              <h3 class="card__title"><a href="${href(lang, "programs")}#${p.id}">${esc(p[lang].title)}</a></h3>
              <p class="card__summary">${esc(p[lang].summary)}</p>
            </article>`
              )
              .join("\n            ")}
          </div>
        </div>
      </section>

      <section class="section section--impact">
        <div class="wrap">
          <div class="section__head">
            <h2>${esc(t.impactTitle)}</h2>
            <a class="link-more" href="${href(lang, "impact")}">${esc(t.impactLink)}</a>
          </div>
          <ul class="stats">
            ${IMPACT.map(
              (s) => `<li class="stat">
              <span class="stat__value" dir="ltr">${esc(s.value)}</span>
              <span class="stat__label">${esc(s[lang].label)}</span>
            </li>`
            ).join("\n            ")}
          </ul>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <div class="section__head">
            <h2>${esc(t.happeningTitle)}</h2>
            <a class="link-more" href="${href(lang, "gallery")}">${esc(t.happeningLink)}</a>
          </div>
          <div class="grid grid--4">
            ${GALLERY.slice(0, 4)
              .map((g) => tile(lang, g, COPY[lang].gallery.placeholderNote))
              .join("\n            ")}
          </div>
        </div>
      </section>

      <section class="section section--cta">
        <div class="wrap prose">
          <h2>${esc(t.involvedTitle)}</h2>
          <p>${esc(t.involvedBody)}</p>
          <p><a class="btn btn--primary" href="${href(lang, "get-involved")}">${esc(t.involvedCta)}</a></p>
        </div>
      </section>`;
}

/* ----------------------------- About ----------------------------- */

export function about(lang) {
  const t = COPY[lang].about;
  return `      ${pageHead(t.title, t.lede)}
      <section class="section">
        <div class="wrap layout-split">
          <div class="prose">
            <h2>${esc(t.storyTitle)}</h2>
            ${paras(t.storyBody)}
          </div>
          ${tile(lang, GALLERY.find((g) => g.id === "camp-day"), COPY[lang].gallery.placeholderNote)}
        </div>
      </section>

      <section class="section section--mission">
        <div class="wrap grid grid--2">
          <div class="prose">
            <h2>${esc(t.missionTitle)}</h2>
            <p>${esc(t.missionBody)}</p>
          </div>
          <div class="prose">
            <h2>${esc(t.visionTitle)}</h2>
            <p>${esc(t.visionBody)}</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <h2 class="section__title">${esc(t.valuesTitle)}</h2>
          <div class="grid grid--4">
            ${t.values
              .map(
                (v) => `<article class="card">
              <h3 class="card__title">${esc(v.title)}</h3>
              <p>${esc(v.body)}</p>
            </article>`
              )
              .join("\n            ")}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap prose">
          <h2>${esc(t.locationTitle)}</h2>
          <p>${esc(t.locationBody)}</p>
          <p><a class="link-more" href="${href(lang, "contact")}">${esc(COPY[lang].contact.mapTitle)}</a></p>
        </div>
      </section>`;
}

/* ----------------------------- Programs ----------------------------- */

export function programs(lang) {
  const t = COPY[lang].programs;
  const copy = COPY[lang];
  const active = PROGRAMS.filter((p) => p.status === "active");
  const proposed = PROGRAMS.filter((p) => p.status === "proposed");

  return `      ${pageHead(t.title, t.lede)}
      <section class="section">
        <div class="wrap">
          <h2 class="section__title">${esc(t.activeTitle)}</h2>
          <div class="stack">
            ${active.map((p) => programCard(lang, p, copy)).join("\n            ")}
          </div>
        </div>
      </section>

      <section class="section section--muted">
        <div class="wrap">
          <h2 class="section__title">${esc(t.proposedTitle)}</h2>
          <p class="section__note">${esc(t.proposedNote)}</p>
          <div class="stack">
            ${proposed.map((p) => programCard(lang, p, copy)).join("\n            ")}
          </div>
        </div>
      </section>`;
}

/* ----------------------------- Impact ----------------------------- */

export function impact(lang) {
  const t = COPY[lang].impact;
  return `      ${pageHead(t.title, t.lede)}
      <section class="section">
        <div class="wrap">
          <ul class="stats stats--large">
            ${IMPACT.map(
              (s) => `<li class="stat">
              <span class="stat__value" dir="ltr">${esc(s.value)}</span>
              <span class="stat__label">${esc(s[lang].label)}</span>
              <span class="stat__note">${esc(s[lang].note)}</span>
            </li>`
            ).join("\n            ")}
          </ul>
        </div>
      </section>

      <section class="section section--muted">
        <div class="wrap">
          <h2 class="section__title">${esc(t.breakdownTitle)}</h2>
          <div class="grid grid--2">
            ${t.breakdown
              .map(
                (b) => `<article class="card">
              <h3 class="card__title">${esc(b.title)}</h3>
              <p>${esc(b.body)}</p>
            </article>`
              )
              .join("\n            ")}
          </div>
          <p class="section__note">${esc(t.caveat)}</p>
        </div>
      </section>`;
}

/* ----------------------------- Team ----------------------------- */

export function team(lang) {
  const t = COPY[lang].team;
  return `      ${pageHead(t.title, t.lede)}
      <section class="section">
        <div class="wrap">
          <div class="grid grid--4">
            ${TEAM.map((m) => {
              const c = m[lang];
              // PHOTO SLOT: square 400x400, /assets/img/team/<id>.jpg
              const photo = m.photo
                ? `<img class="person__photo" src="${asset(m.photo)}" alt="${esc(c.name)}" width="400" height="400" loading="lazy">`
                : slot("1/1", t.photoAlt, "img-slot--avatar");
              return `<article class="card person">
              ${photo}
              <h3 class="card__title">${esc(c.name)}</h3>
              <p class="person__role">${esc(c.role)}</p>
              <p>${esc(c.bio)}</p>
            </article>`;
            }).join("\n            ")}
          </div>
        </div>
      </section>

      <section class="section section--muted">
        <div class="wrap prose">
          <h2>${esc(t.instructorsTitle)}</h2>
          <p>${esc(t.instructorsBody)}</p>
        </div>
      </section>`;
}

/* ----------------------------- Gallery ----------------------------- */

export function gallery(lang) {
  const t = COPY[lang].gallery;
  return `      ${pageHead(t.title, t.lede)}
      <section class="section">
        <div class="wrap">
          <div class="grid grid--3">
            ${GALLERY.map((g) => tile(lang, g, t.placeholderNote)).join("\n            ")}
          </div>
        </div>
      </section>`;
}

/* ----------------------------- News ----------------------------- */

export function news(lang) {
  const t = COPY[lang].news;
  const items = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
  const fmt = (d) =>
    new Date(d + "T00:00:00Z").toLocaleDateString(lang === "ar" ? "ar-LB" : "en-GB", {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    });

  return `      ${pageHead(t.title, t.lede)}
      <section class="section">
        <div class="wrap">
          <div class="stack">
            ${items
              .map(
                (n) => `<article class="card post" id="${n.id}">
              <p class="post__date"><time datetime="${n.date}">${esc(fmt(n.date))}</time></p>
              <h2 class="card__title">${esc(n[lang].title)}</h2>
              <p>${esc(n[lang].body)}</p>
            </article>`
              )
              .join("\n            ")}
          </div>
        </div>
      </section>`;
}

/* ----------------------------- Get involved ----------------------------- */

function formNote(lang, endpoint) {
  if (endpoint) return "";
  return `<p class="form__note">${esc(COPY[lang].getInvolved.form.disabledNote)} <a href="mailto:${SITE.email}" dir="ltr">${SITE.email}</a>.</p>`;
}

/** Formspree posts need method/action; without an endpoint the form is inert. */
function formAttrs(endpoint) {
  return endpoint ? ` action="${endpoint}" method="POST" data-form` : ` data-form-disabled`;
}

export function getInvolved(lang) {
  const t = COPY[lang].getInvolved;
  const f = t.form;
  const endpoint = SITE.forms.volunteerEndpoint;

  const options = PROGRAMS.map(
    (p) => `<option value="${esc(p.id)}">${esc(p[lang].title)}</option>`
  ).join("\n                ");

  return `      ${pageHead(t.title, t.lede)}
      <section class="section">
        <div class="wrap layout-split">
          <div class="prose">
            <h2>${esc(t.volunteerTitle)}</h2>
            <p>${esc(t.volunteerBody)}</p>
            ${formNote(lang, endpoint)}
          </div>
          <form class="form"${formAttrs(endpoint)} novalidate>
            <div class="field">
              <label for="v-name">${esc(f.name)}</label>
              <input id="v-name" name="name" type="text" autocomplete="name" required>
            </div>
            <div class="field">
              <label for="v-email">${esc(f.email)}</label>
              <input id="v-email" name="email" type="email" autocomplete="email" dir="ltr" required>
            </div>
            <div class="field">
              <label for="v-phone">${esc(f.phone)}</label>
              <input id="v-phone" name="phone" type="tel" autocomplete="tel" dir="ltr">
            </div>
            <div class="field">
              <label for="v-availability">${esc(f.availability)}</label>
              <input id="v-availability" name="availability" type="text" aria-describedby="v-availability-hint">
              <p class="field__hint" id="v-availability-hint">${esc(f.availabilityHint)}</p>
            </div>
            <div class="field">
              <label for="v-interest">${esc(f.interest)}</label>
              <select id="v-interest" name="interest">
                <option value="">${esc(f.interestPlaceholder)}</option>
                ${options}
              </select>
            </div>
            <div class="field">
              <label for="v-message">${esc(f.message)}</label>
              <textarea id="v-message" name="message" rows="4"></textarea>
            </div>
            <!-- Honeypot: bots fill it, humans never see it. -->
            <div class="field field--hp" aria-hidden="true"><label for="v-company">Company</label><input id="v-company" name="_gotcha" type="text" tabindex="-1" autocomplete="off"></div>
            <p class="form__status" data-form-status role="status"></p>
            <button class="btn btn--primary" type="submit"${endpoint ? "" : " disabled"}>${esc(f.submit)}</button>
          </form>
        </div>
      </section>

      <section class="section section--muted">
        <div class="wrap">
          <h2 class="section__title">${esc(t.supportTitle)}</h2>
          <p class="section__note">${esc(t.supportBody)}</p>
          <div class="grid grid--4">
            ${t.supportWays
              .map(
                (w) => `<article class="card">
              <h3 class="card__title">${esc(w.title)}</h3>
              <p>${esc(w.body)}</p>
            </article>`
              )
              .join("\n            ")}
          </div>
          <p><a class="btn btn--primary" href="${href(lang, "contact")}">${esc(t.supportCta)}</a></p>
        </div>
      </section>`;
}

/* ----------------------------- Contact ----------------------------- */

export function contact(lang) {
  const t = COPY[lang].contact;
  const f = t.form;
  const endpoint = SITE.forms.contactEndpoint;

  const phoneItems = SITE.phones
    .map(
      (p) => `<li>
              <a href="tel:${p.tel}" dir="ltr">${esc(p.display)}</a>
              ${SITE.whatsappEnabled ? `<a class="wa-link" href="https://wa.me/${p.wa}" rel="noopener">${esc(t.whatsappLabel)}</a>` : ""}
            </li>`
    )
    .join("\n            ");

  return `      ${pageHead(t.title, t.lede)}
      <section class="section">
        <div class="wrap layout-split">
          <div class="prose contact-details">
            <h2>${esc(t.emailLabel)}</h2>
            <p><a href="mailto:${SITE.email}" dir="ltr">${SITE.email}</a></p>
            <h2>${esc(t.phoneLabel)}</h2>
            <ul class="plain-list">
            ${phoneItems}
            </ul>
            <h2>${esc(t.locationLabel)}</h2>
            <p>${esc(SITE.location[lang])}</p>
          </div>
          <form class="form"${formAttrs(endpoint)} novalidate>
            <h2 class="form__title">${esc(t.formTitle)}</h2>
            ${formNote(lang, endpoint)}
            <div class="field">
              <label for="c-name">${esc(f.name)}</label>
              <input id="c-name" name="name" type="text" autocomplete="name" required>
            </div>
            <div class="field">
              <label for="c-email">${esc(f.email)}</label>
              <input id="c-email" name="email" type="email" autocomplete="email" dir="ltr" required>
            </div>
            <div class="field">
              <label for="c-message">${esc(f.message)}</label>
              <textarea id="c-message" name="message" rows="6" required></textarea>
            </div>
            <div class="field field--hp" aria-hidden="true"><label for="c-company">Company</label><input id="c-company" name="_gotcha" type="text" tabindex="-1" autocomplete="off"></div>
            <p class="form__status" data-form-status role="status"></p>
            <button class="btn btn--primary" type="submit"${endpoint ? "" : " disabled"}>${esc(f.submit)}</button>
          </form>
        </div>
      </section>

      <section class="section section--muted">
        <div class="wrap">
          <h2 class="section__title">${esc(t.mapTitle)}</h2>
          <!-- Keyless map: Leaflet + OpenStreetMap tiles, no API key, no billing.
               Loaded lazily by site.js only when the map scrolls into view.
               Swap SITE.location.lat/lng in content/site.mjs for the exact
               premises coordinates; the approximate-location note then drops. -->
          <div class="map" data-map data-lat="${SITE.location.lat}" data-lng="${SITE.location.lng}" data-label="${esc(SITE.location[lang])}">
            <noscript><p class="section__note">${esc(SITE.location[lang])}</p></noscript>
          </div>
          ${SITE.location.coordsAreApproximate ? `<p class="section__note">${esc(t.mapApproxNote)}</p>` : ""}
        </div>
      </section>`;
}

/* ----------------------------- 404 ----------------------------- */

export function notFound(lang) {
  const t = COPY[lang].notFound;
  return `      ${pageHead(t.title, t.body)}
      <section class="section">
        <div class="wrap prose">
          <p><a class="btn btn--primary" href="${href(lang, "")}">${esc(t.cta)}</a></p>
        </div>
      </section>`;
}

/* ----------------------------- shared ----------------------------- */

function pageHead(title, lede) {
  return `<section class="page-head">
        <div class="wrap">
          <h1>${esc(title)}</h1>
          <p class="page-head__lede">${esc(lede)}</p>
        </div>
      </section>`;
}
