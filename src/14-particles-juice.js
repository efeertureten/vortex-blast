// ---------------------------------------------------------------- particles & juice
function addPart(p, force) { if (force || parts.length < 750) parts.push(p); }
function burst(x, y, c, power) {
  const C = COLORS[c];
  for (let i = 0; i < 8; i++) {
    const a = rand(0, TAU), sp = rand(150, 460) * power;
    addPart({ k: 'dot', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(3, 7.5), col: i % 3 ? C.base : C.light, life: rand(0.35, 0.62), t: 0, drag: 4.5, g: 260 });
  }
  for (let i = 0; i < 3; i++) {
    const a = rand(0, TAU), sp = rand(90, 300) * power;
    addPart({ k: 'star', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(5, 9.5), col: i ? '#ffffff' : C.light, rot: rand(0, TAU), vr: rand(-9, 9), life: rand(0.5, 0.75), t: 0, drag: 3.5, g: 180 });
  }
  addPart({ k: 'ring', x, y, r: 10, gr: 230, w: 6, col: C.rgb, life: 0.3, t: 0 });
}
function orb(x, y, rgb) {
  addPart({ k: 'orb', sx: x, sy: y, cx: lerp(x, CX, 0.4) + rand(-70, 70), cy: lerp(y, CY, 0.4) + rand(-70, 70), col: rgb, life: rand(0.38, 0.55), t: -rand(0, 0.12) });
}
// Gameplay gems: CFG.gemRate scales every in-run source; the fraction carries over to the next award
// (and across runs via the save). Rewards (quests, daily, achievements, 2x ad) use grantGems, unscaled.
function addGems(g, x, y) {
  if (g <= 0) return;
  save.gemFrac += g * CFG.gemRate * gemEventMult() * (mode === 'zen' ? 0.25 : 1);
  g = Math.floor(save.gemFrac + 1e-9); save.gemFrac -= g;
  markDirty();
  if (g <= 0) return;
  runGems += g;
  gemFly(g, x, y);
}
function grantGems(g, x, y) { if (g > 0) { gemFly(g, x, y); markDirty(); } }
function gemFly(g, x, y) {
  save.gems += g;
  const n = Math.min(g, 5); let rem = g;
  for (let i = 0; i < n; i++) {
    const val = i === n - 1 ? rem : Math.floor(g / n); rem -= val;
    gemsInFlight += val;
    addPart({ k: 'gem', sx: x + rand(-12, 12), sy: y + rand(-12, 12), cx: x + rand(-140, 140), cy: y - rand(80, 220),
      tx: GEM_PILL.x + 24, ty: GEM_PILL.y + GEM_PILL.h / 2, t: -i * 0.07, life: rand(0.7, 0.85), val }, true);
  }
}
function floatText(x, y, s, size, col) { addPart({ k: 'text', x, y, vy: -80, s, size, col, life: 0.95, t: 0 }, true); }
// Banners queue up and play one at a time (the queue fast-forwards when it backs up).
function banner(s, size, col, dur = 1.3, y = 300) { banners.push({ s, size, col, dur, y, t: 0 }); if (banners.length > 3) banners.splice(1, 1); }

function updateParticles(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t += dt;
    if (p.t >= 0) {
      if (p.k === 'dot' || p.k === 'star' || p.k === 'shard') {
        const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; p.vy += (p.g || 0) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt;
      } else if (p.k === 'ring') {
        p.r = Math.max(0, p.r + p.gr * dt * (1 - 0.6 * p.t / p.life));
      } else if (p.k === 'text') {
        p.y += p.vy * dt; p.vy *= Math.exp(-2.5 * dt);
      }
    }
    if (p.t >= p.life) {
      if (p.k === 'orb') corePulse = Math.min(1, corePulse + 0.1);
      else if (p.k === 'gem') { gemsInFlight -= p.val; gemBounce = 1; Snd.tink(); }
      parts[i] = parts[parts.length - 1]; parts.pop();
    }
  }
}
function updateDust(dt) {
  for (const d of dust) {
    d.r -= (14 + (640 - d.r) * 0.12) * d.sp * dt;
    d.a += dt * (0.18 + 26 / Math.max(d.r, 30));
    if (d.r < 58) Object.assign(d, newDust(false));
  }
}

