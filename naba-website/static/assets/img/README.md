# Image slots

Drop real assets here and the build picks them up. Nothing in this folder is
stock photography by design — placeholders stay neutral so the site never
misrepresents NABA before real photos arrive.

| File | Size / ratio | Used by |
|---|---|---|
| `logo-placeholder.svg` | square, any size (renders at 40px) | header lockup, `templates/layout.mjs` |
| `favicon-placeholder.svg` | square; also export 32px `.ico`, 180px apple-touch, 512px PNG | `<link rel="icon">` |
| `og-placeholder.png` | **1200×630** | Open Graph / Twitter share card |
| `team/<id>.jpg` | **square, 400×400** | `TEAM[].photo` in `content/site.mjs` |
| `gallery/<id>.jpg` | **4:3, ~1200px wide** | `GALLERY[].src` in `content/site.mjs` |

After adding a photo, set the matching `photo` / `src` field in
`content/site.mjs` — the placeholder block is replaced automatically.

Regenerate the placeholder OG card with `node tools/make-placeholders.mjs`.
