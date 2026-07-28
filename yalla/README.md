# Yalla 🌱 — Mhammad's Personal Journey App

A free, personal weight-loss companion built for one person's real life: a
Lebanese household kitchen, no gym, no equipment beyond a jump rope and a
staircase, and zero budget for subscriptions.

**No accounts. No servers. No cost.** Everything runs in the browser and all
data stays on your device (localStorage).

## What it does

- **Today** — your daily plan: 3 meals + 1 snack picked from a Lebanese-pantry
  meal engine (mujadara, foul, balila, ejjeh, tuna fatteh…), each rated for how
  *filling* it is, with a swap button when you're not feeling it. Plus today's
  workout, a water tracker, and a rotating coach's tip.
- **Meals** — browse ~35 dishes with short recipes, honest calorie/protein
  estimates, and a "protein boost" tip on every meal (how to add cheap protein
  from eggs, laban, labneh, tuna). Filters for filling / high-protein / quick.
- **Craving SOS** (the 😤 button) — for the moments you're circling the
  kitchen. A short ritual (water → 10 minutes → decide) plus sweet or savory
  low-damage snacks from the same pantry.
- **Move** — a workout generator that never repeats: 8 different session
  formats (circuits, ladders, intervals, jump-rope days, stair days, lucky
  draw, walk & sculpt, minute machine) built from ~30 low-impact, no-equipment
  exercises. 10 difficulty levels; exercises upgrade as you level (wall
  push-ups → knee push-ups → full push-ups). Rate each session and the app
  adjusts intensity automatically.
- **Progress** — weekly weigh-ins with a chart showing your next milestone,
  BMI, pace, 16 milestone badges, and training stats.

## How to use it on your phone

### Option A — GitHub Pages (recommended, free)

1. On GitHub: **Settings → Pages → Source: Deploy from a branch**, pick the
   branch and `/ (root)`, save.
2. Open `https://<username>.github.io/<repo>/yalla/` on your phone.
3. In the browser menu choose **Add to Home Screen**. It installs like a real
   app and works fully offline after the first visit (service worker).

### Option B — run locally

```bash
cd yalla
python3 -m http.server 8080
# open http://localhost:8080
```

## Backing up

Data lives only in the browser. **Settings → Backup data** downloads a JSON
file; **Restore** brings it back on any device. Do this occasionally.

## Tech

Plain HTML/CSS/JS — no frameworks, no build step, no dependencies. PWA with a
cache-first service worker. Theme-aware (light/dark). The chart palette was
validated for colorblind-safe contrast in both themes.
