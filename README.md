# Vortex Blast

A hybrid-casual mobile puzzle game in a single `index.html`: HTML5 Canvas, vanilla JS, Web Audio, no build step.

Four concentric rings of glossy toon blocks spin around an Energy Core at different speeds and directions. Same-colour blocks link up when they touch in a ring, or radially when the rotation lines them up across neighbouring rings. Tap any glowing group of 3+ to blast it before Core Stability runs out.

## Play

Open `index.html` in any browser (designed for portrait phones; letterboxes on desktop).
Desktop shortcuts: **Space** start · **U** upgrades · **M** mute.

## Features

- **Rotating cluster matching**: 4 rings × 12 blocks, live same-ring and cross-ring adjacency
- **Snap physics**: blasted slots are filled by outer blocks springing inward; new blocks spawn on the outer ring
- **Vortex Bomb**: blast 6+ at once to forge a bomb that clears its whole ring
- **Core Stability timer**: drains faster every wave, refilled by each blast
- **Juice**: 30 ms hit-stop, pop particles, shockwaves, energy orbs, screen shake, pitch-escalating Web Audio pops
- **Meta progression** (saved in `localStorage`): earn Core Gems and spend them in the Upgrade Drawer
  - Alignment Magnet: rings drift to line up matching colours
  - Bomb Threshold: 6 → 5 → 4 blocks
  - Gem & Score Boost: up to x3.5
- **Adaptive quality**: drops pixel density and then the background swirl if a device can't hold ~48 fps
- **Block sprite cache**: resting blocks are pre-rasterised per ring/colour at device resolution and blitted, so only moving blocks build vector paths each frame
