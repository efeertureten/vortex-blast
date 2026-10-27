# Vortex Blast

A hybrid-casual mobile puzzle game that ships as a single `index.html`: HTML5 Canvas, vanilla JS, Web Audio. It plays from `file://`, installs as a PWA and packages for the stores with Capacitor.

Four concentric rings of glossy toon blocks spin around an Energy Core at different speeds and directions. Same-colour blocks link up when they touch in a ring, or radially when the rotation lines them up across neighbouring rings. Tap any glowing group of 3+ to blast it before Core Stability runs out.

## Play

Open `index.html` in any browser (designed for portrait phones; letterboxes on desktop).
Keys: **Space** play / resume · **P** or **Esc** pause · **U** upgrades · **M** mute.

## Features

**Core**
- Rotating cluster matching: 4 rings × 12 blocks, same-ring and cross-ring links
- Spring physics: blasted slots refill from the next ring out; new blocks spawn outside
- Core Stability drains a little faster every wave, without a ceiling, so every run ends; blasts refill it
- Combos: the combo window shrinks as the combo grows, so long combos take speed
- Vortex Bomb (6+ at once, clears its ring) · Colour Bomb (9+ at once, clears its colour)
- Prism blocks link with any colour · Locked blocks open when a neighbour blasts
- Boss Waves every 5th wave: one ring reverses and speeds up for 20 s
- Last-chance slow motion once per run

**Modes:** Endless · Daily Challenge (same seeded board for everyone, one official try a day) · Zen (no timer)

**Meta:** 6 upgrades bought with Core Gems · daily reward calendar · 3 daily quests · 20 achievements · monthly season track · win streak · boosters (start bomb, shield, magnet+) · 5 colour themes · profile with stats and recent runs

**Feel & access:** hit-stop, particles, shockwaves, haptics, adaptive synth music · English and Turkish · reduced-motion mode · colour-blind patterns · interactive tutorial

**Platform:** offline PWA (embedded fonts, service worker, icons) · remote tuning and A/B tests from `config.json` · consent-first analytics · rewarded ads through an adapter (none / H5 Games Ads / AdMob) · age gate · save schema with migrations and a tamper check · adaptive quality

## Develop

The code lives in `src/` (one file per section); `index.html` is built from it.

```bash
python tools/build.py            # src/ → index.html, docs/PRIVACY.md → privacy.html
python tools/build.py --check    # are both up to date?
python docs/tools/smoke.py       # headless-Chrome tests of the real game
python docs/tools/parity.py      # game ↔ balance-model parity
python tools/build_www.py --web  # www/ = the shipped files only (adds sw.js); used for the store build
```

GitHub Pages serves the root of `main` (https://efeertureten.github.io/vortex-blast/), so pushing to `main` is the web release; `.github/workflows/check.yml` verifies the committed build.

Balance numbers come from a Python port of the game rules (`docs/tools/vb_model.py`). See `docs/README.md` for the design docs and `docs/STORE.md` for web and store builds.

Fonts: Fredoka and Lilita One, SIL Open Font License, see `fonts-LICENSE.txt`.
