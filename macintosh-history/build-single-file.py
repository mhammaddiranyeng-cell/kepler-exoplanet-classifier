#!/usr/bin/env python3
"""
Bundle the site into one self-contained .html file.

The site itself is written as ES modules loading three.js, GSAP and Lenis from
vendor/. That is the nicer thing to work on, but it needs a web server. This
script flattens the whole thing — every library, the stylesheet and both of our
modules — into a single file you can double-click, email, or drop on any host.

    python3 build-single-file.py            -> dist/macintosh-history.html

The only transform applied to our own code is dropping the import/export lines
between mac3d.js and main.js, since in the bundle they share one scope.
"""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
OUT = DIST / "macintosh-history.html"
BODY_ONLY = DIST / "macintosh-history.embed.html"


def read(rel):
    p = ROOT / rel
    if not p.exists():
        sys.exit(f"missing: {rel}")
    return p.read_text(encoding="utf-8")


def main():
    html = read("index.html")

    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).strip()
    body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)

    # The bundle has no separate files to load, so the tags that pulled them in
    # go away along with the import map.
    body = re.sub(r'\s*<script src="vendor/[^"]+"></script>', "", body)
    body = re.sub(r'\s*<script type="module" src="js/main\.js"></script>', "", body)

    css = read("vendor/lenis.css") + "\n" + read("css/style.css")

    # three.js ships a UMD build (a plain script exposing a global THREE) as
    # well as the ES module; the global build is what lets everything live in
    # one <script> without an import map. Its own deprecation notice is dropped
    # so the console stays clean.
    three = read("vendor/three.global.js")
    three = re.sub(r"^console\.warn\([^\n]*\);\s*", "", three, count=1)

    libs = "\n".join([
        three,
        read("vendor/gsap.min.js"),
        read("vendor/ScrollTrigger.min.js"),
        read("vendor/lenis.min.js"),
    ])

    mac3d = read("js/mac3d.js")
    mac3d = mac3d.replace(
        "import * as THREE from '../vendor/three.module.js';",
        "const THREE = window.THREE;",
    )
    mac3d = mac3d.replace("export class MacintoshScene", "class MacintoshScene")

    main_js = read("js/main.js")
    main_js = main_js.replace("import { MacintoshScene } from './mac3d.js';", "")

    # Module scripts are deferred; a plain <script> is not. Everything is held
    # until DOMContentLoaded so Lenis measures a fully parsed document, exactly
    # as it does in the unbundled site.
    app = (
        "(function () {\n'use strict';\nfunction start() {\n"
        + mac3d + "\n" + main_js
        + "\n}\nif (document.readyState === 'loading') {\n"
        "  document.addEventListener('DOMContentLoaded', start, { once: true });\n"
        "} else { start(); }\n})();"
    )

    page = (
        f"<style>\n{css}\n</style>\n"
        f"{body}\n"
        f"<script>\n{libs}\n</script>\n"
        f"<script>\n{app}\n</script>\n"
    )

    # The doctype is not cosmetic here. Without it the browser drops into
    # quirks mode, document.scrollingElement becomes <body> instead of <html>,
    # and Lenis's writes go somewhere the viewport never reads — the page
    # simply refuses to scroll.
    standalone = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, '
        'viewport-fit=cover">\n'
        f"<title>{title}</title>\n"
        "</head>\n<body>\n" + page + "</body>\n</html>\n"
    )

    DIST.mkdir(exist_ok=True)
    OUT.write_text(standalone, encoding="utf-8")
    print(f"{OUT}  ({len(standalone) / 1024:.0f} KB)")

    # Same page without the document skeleton, for hosts that supply their own
    # (the doctype comes from the wrapper in that case).
    BODY_ONLY.write_text(f"<title>{title}</title>\n" + page, encoding="utf-8")
    print(f"{BODY_ONLY}  ({len(page) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
