/* NABA NGO — shared behaviour: mobile nav, static-form submission, lazy map.
   Everything here is progressive enhancement; the site works without it. */

(function () {
  "use strict";

  // Resolve vendored assets relative to this script, so the site works both at
  // a domain root and under a sub-path (GitHub Pages project sites).
  var thisScript = document.currentScript;
  function vendor(path) {
    return thisScript ? new URL("../vendor/" + path, thisScript.src).href : "/assets/vendor/" + path;
  }

  /* ------------------------------ mobile nav ------------------------------ */

  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
      document.body.style.overflow = !open ? "hidden" : "";
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });
  }

  /* ------------------------------ forms ------------------------------
     Formspree (and any endpoint accepting JSON) is posted via fetch so the
     visitor stays on the page. Without JS the form still does a normal POST
     and lands on the provider's own thank-you page. */

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var status = form.querySelector("[data-form-status]");
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) return; // let the browser show its own messages
      e.preventDefault();

      var original = button ? button.textContent : "";
      if (button) { button.disabled = true; }
      if (status) { status.textContent = "…"; status.removeAttribute("data-state"); }

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (!res.ok) throw new Error("bad status " + res.status);
          form.reset();
          if (status) {
            status.textContent = form.getAttribute("data-success") || successText();
            status.setAttribute("data-state", "ok");
          }
        })
        .catch(function () {
          if (status) {
            status.textContent = errorText();
            status.setAttribute("data-state", "error");
          }
        })
        .finally(function () {
          if (button) { button.disabled = false; button.textContent = original; }
        });
    });
  });

  function isArabic() { return document.documentElement.lang === "ar"; }
  function successText() {
    return isArabic() ? "شكراً لك — سنتواصل معك قريباً." : "Thank you — we'll be in touch.";
  }
  function errorText() {
    return isArabic()
      ? "تعذّر الإرسال. يرجى مراسلتنا على naba.beqaa@gmail.com"
      : "That didn't send. Please email us at naba.beqaa@gmail.com";
  }

  /* ------------------------------ map ------------------------------
     Leaflet + OpenStreetMap tiles: no API key, no billing, no Google Business
     Profile dependency. Vendored locally and loaded only when the map element
     is about to enter the viewport. */

  var mapEl = document.querySelector("[data-map]");
  if (mapEl) {
    var load = function () {
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = vendor("leaflet/leaflet.css");
      document.head.appendChild(css);

      var script = document.createElement("script");
      script.src = vendor("leaflet/leaflet.js");
      script.onload = initMap;
      script.onerror = mapFallback;
      document.head.appendChild(script);
    };

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          if (entries.some(function (en) { return en.isIntersecting; })) {
            io.disconnect();
            load();
          }
        },
        { rootMargin: "300px" }
      );
      io.observe(mapEl);
    } else {
      load();
    }
  }

  function initMap() {
    if (!window.L) return mapFallback();
    var lat = parseFloat(mapEl.getAttribute("data-lat"));
    var lng = parseFloat(mapEl.getAttribute("data-lng"));
    var label = mapEl.getAttribute("data-label") || "NABA NGO";

    var map = L.map(mapEl, { scrollWheelZoom: false }).setView([lat, lng], 14);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // A CSS pin avoids shipping Leaflet's default marker images.
    L.marker([lat, lng], {
      icon: L.divIcon({ className: "", html: '<div class="map-pin"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
      title: "NABA NGO",
      alt: "NABA NGO",
    })
      .addTo(map)
      .bindPopup("<strong>NABA NGO</strong><br>" + label);
  }

  function mapFallback() {
    var lat = mapEl.getAttribute("data-lat");
    var lng = mapEl.getAttribute("data-lng");
    mapEl.innerHTML =
      '<p style="padding:1rem;text-align:center"><a href="https://www.openstreetmap.org/?mlat=' +
      lat + "&mlon=" + lng + "#map=15/" + lat + "/" + lng +
      '" rel="noopener">' + (mapEl.getAttribute("data-label") || "") + "</a></p>";
  }
})();
