// ---------------------------------------------------------------- render
const stabHue = p => p > 0.5 ? lerp(42, 188, (p - 0.5) / 0.5) : lerp(0, 42, p / 0.5);
function fullRect() { ctx.fillRect(-offX / scale - 4, -offY / scale - 4, vw / scale + 8, vh / scale + 8); }

const breatheOf = (r, b) => b.glow > 0.01 ? 1 + 0.035 * b.glow * (0.5 + 0.5 * Math.sin(T * 9 + r * 1.3)) : 1;
// Undeformed and steady → can be drawn from the sprite cache (sub-pixel thresholds, so the switch is invisible).
const atRest = b => SPR && !isSpecial(b) && !b.joker && !b.locked && b.flash === 0 && b.wob === 0 && b.jel < 0.01 &&
  Math.abs(b.dr) < 0.3 && Math.abs(b.vr) < 5 && Math.abs(b.da) < 0.002 && Math.abs(b.sc - 1) < 0.004;
// Enter a block-local frame (origin = block centre, +x = outward) for sprite blits; caller restores.
function spriteFrame(r, s, b) {
  const k = breatheOf(r, b), ac = slotAng(r, s) + b.da;
  ctx.save(); ctx.rotate(ac); ctx.translate(ringMid(r) + b.dr, 0); ctx.scale(k, k);
  return ac;
}

function geom(r, s, b) {
  const k = Math.max(0.05, b.sc) * breatheOf(r, b) * (hitStop > 0 && b.flash > 0 ? 1.12 : 1);
  const mid = ringMid(r) + b.dr;
  const jel = b.jel * Math.sin(b.jelP);
  const stretch = clamp(Math.abs(b.vr) / 1800, 0, 0.22);
  const th = RING_T * k * (1 + stretch - 0.18 * jel);
  const ac = slotAng(r, s) + b.da + Math.sin(T * 55) * 0.06 * b.wob;
  const hw = (DA / 2 - 2.6 / Math.max(mid, 30)) * k * (1 - stretch * 0.5 + 0.12 * jel);
  return { mid, th, ac, hw, r0: mid - th / 2, r1: mid + th / 2 };
}

function drawBoard() {
  const pulse = 0.5 + 0.5 * Math.sin(T * 8);
  ctx.save();
  const sh = shake * motionK();
  ctx.translate(CX + (Math.random() * 2 - 1) * sh, CY + (Math.random() * 2 - 1) * sh);
  const punch = 1 + 0.03 * Math.min(1, boardPunch) * motionK(); ctx.scale(punch, punch);

  // inward-spiralling dust
  ctx.fillStyle = '#fff';
  for (const d of dust) {
    ctx.globalAlpha = d.al * clamp((d.r - 58) / 80, 0, 1) * clamp((680 - d.r) / 120, 0, 1);
    ctx.fillRect(Math.cos(d.a) * d.r, Math.sin(d.a) * d.r, d.s, d.s);
  }
  ctx.globalAlpha = 1;

  // core glow underlay
  const p = clamp(dispStab / 100, 0, 1), hue = stabHue(p);
  const gR = 150 + corePulse * 40;
  const cg = ctx.createRadialGradient(0, 0, 20, 0, 0, gR);
  cg.addColorStop(0, `hsla(${hue},100%,65%,${0.5 + corePulse * 0.3})`); cg.addColorStop(1, `hsla(${hue},100%,50%,0)`);
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, gR, 0, TAU); ctx.fill();

  // ring tracks
  for (let r = 0; r < RINGS; r++) {
    ctx.beginPath(); ctx.arc(0, 0, RING_IN[r] + RING_T + 2, 0, TAU); ctx.arc(0, 0, RING_IN[r] - 2, 0, TAU, true);
    ctx.fillStyle = 'rgba(8,3,26,0.55)'; ctx.fill();
    let hasBomb = false; for (let s = 0; s < SLOTS; s++) if (grid[r][s] && grid[r][s].bomb) hasBomb = true;
    const boss = bossT > 0 && r === bossRing;
    ctx.lineWidth = boss ? 4 : hasBomb ? 3 : 1.5;
    ctx.strokeStyle = boss ? `rgba(255,80,90,${0.5 + 0.4 * pulse})` : hasBomb ? `rgba(200,130,255,${0.35 + 0.4 * pulse})` : 'rgba(170,150,255,0.13)';
    if (boss) ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.arc(0, 0, RING_IN[r] + RING_T + 2, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, RING_IN[r] - 2, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }

  // pass 1: "ready to blast" halos under everything
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SLOTS; s++) {
    const b = grid[r][s]; if (!b || b.glow < 0.02 || isSpecial(b)) continue;
    if (atRest(b)) {
      const F = SPR[r].fr;
      spriteFrame(r, s, b);
      ctx.globalAlpha = 0.42 * b.glow * (0.55 + 0.45 * pulse);
      ctx.drawImage(SPR[r].halo, F.x, F.y, F.w, F.h);
      ctx.restore();
      continue;
    }
    const g = geom(r, s, b); if (g.r0 < 8) continue;
    const path = sector(g.r0, g.r1, g.ac - g.hw, g.ac + g.hw, 10);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgba(255,255,255,${0.42 * b.glow * (0.55 + 0.45 * pulse)})`; ctx.lineWidth = 12; ctx.stroke(path);
  }
  // radial link bridges between rings (shows cross-ring connections)
  for (let i = 0; i < links.length; i += 4) {
    const b1 = grid[links[i]][links[i + 1]], b2 = grid[links[i + 2]][links[i + 3]];
    if (!b1 || !b2) continue;
    const a1 = slotAng(links[i], links[i + 1]), a2 = slotAng(links[i + 2], links[i + 3]);
    const am = a1 + wrapA(a2 - a1) / 2, rb = RING_IN[links[i + 2]];
    ctx.strokeStyle = `rgba(255,255,255,${Math.min(b1.glow, b2.glow) * (0.6 + 0.4 * pulse)})`;
    ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(Math.cos(am) * (rb - 9), Math.sin(am) * (rb - 9)); ctx.lineTo(Math.cos(am) * (rb + 4), Math.sin(am) * (rb + 4)); ctx.stroke();
  }
  // pass 2: block bodies
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SLOTS; s++) {
    const b = grid[r][s]; if (b) drawBlock(r, s, b, pulse);
  }

  drawCore(p, hue);
  ctx.restore();
}

function drawBlockSprite(r, s, b, pulse) {
  const S = SPR[r], F = S.fr;
  const ac = spriteFrame(r, s, b);
  ctx.drawImage(S.body[b.c], F.x, F.y, F.w, F.h);
  ctx.rotate(-ac);                                  // icons stay upright while the ring turns
  ctx.drawImage(ICONS[b.c], -S.icon / 2, -S.icon / 2, S.icon, S.icon);
  ctx.rotate(ac);
  if (state === 'play' && b.glow < 0.98) { ctx.globalAlpha = 0.2 * (1 - b.glow); ctx.drawImage(S.dim, F.x, F.y, F.w, F.h); }
  if (b.glow > 0.02) { ctx.globalAlpha = (0.75 + 0.25 * pulse) * b.glow; ctx.drawImage(S.edge, F.x, F.y, F.w, F.h); }
  ctx.restore();
}

function drawBlock(r, s, b, pulse) {
  if (atRest(b)) { drawBlockSprite(r, s, b, pulse); return; }
  const g = geom(r, s, b); if (g.r0 < 8) return;
  ctx.globalAlpha = clamp(1 - (b.dr - 40) / 100, 0, 1);
  const a0 = g.ac - g.hw, a1 = g.ac + g.hw;
  const path = sector(g.r0, g.r1, a0, a1, 10);
  const ix = Math.cos(g.ac) * g.mid, iy = Math.sin(g.ac) * g.mid;
  ctx.lineJoin = 'round';
  if (b.bomb) {
    const bp = 0.5 + 0.5 * Math.sin(T * 6);
    ctx.strokeStyle = `rgba(210,120,255,${0.35 + 0.35 * bp})`; ctx.lineWidth = 12; ctx.stroke(path);
    const grd = ctx.createRadialGradient(0, 0, g.r0, 0, 0, g.r1);
    grd.addColorStop(0, '#22064f'); grd.addColorStop(0.5, '#5a1cc4'); grd.addColorStop(1, '#b77cff');
    ctx.fillStyle = grd; ctx.fill(path);
    if (ctx.createConicGradient) {
      const cg = ctx.createConicGradient(T * 3, ix, iy);
      ['#ff4d6d', '#ffd23a', '#3ddc5a', '#2f8cff', '#b04dff', '#ff4d6d'].forEach((c, i) => cg.addColorStop(i / 5, c));
      ctx.strokeStyle = cg;
    } else ctx.strokeStyle = '#ff9cf5';
    ctx.lineWidth = 3.5; ctx.stroke(path);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill(sector(g.r1 - g.th * 0.4, g.r1 - g.th * 0.1, g.ac - g.hw * 0.8, g.ac + g.hw * 0.8, 5));
    drawSwirl(ix, iy, 15 * Math.max(0.2, b.sc), T * 5);
  } else if (b.cb) {
    // Colour Bomb: a dark shell around a glowing orb of its colour
    const C = COLORS[b.c], bp = 0.5 + 0.5 * Math.sin(T * 7);
    ctx.strokeStyle = `rgba(${C.rgb},${0.4 + 0.4 * bp})`; ctx.lineWidth = 12; ctx.stroke(path);
    ctx.fillStyle = '#1a0b33'; ctx.fill(path);
    ctx.lineWidth = 3; ctx.strokeStyle = C.light; ctx.stroke(path);
    const R = 13 * Math.max(0.2, b.sc) * (1 + 0.08 * bp);
    const og = ctx.createRadialGradient(ix - R * 0.3, iy - R * 0.3, 1, ix, iy, R);
    og.addColorStop(0, '#fff'); og.addColorStop(0.35, C.light); og.addColorStop(1, C.base);
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(ix, iy, R, 0, TAU); ctx.fill();
    for (let k = 0; k < 6; k++) {
      const a = T * 2 + k * TAU / 6;
      ctx.beginPath(); ctx.arc(ix + Math.cos(a) * (R + 5), iy + Math.sin(a) * (R + 5), 1.8, 0, TAU); ctx.fillStyle = C.light; ctx.fill();
    }
  } else if (b.joker) {
    // Prism: white body, rainbow rim, star icon — links with any colour
    const grd = ctx.createRadialGradient(0, 0, g.r0, 0, 0, g.r1);
    grd.addColorStop(0, '#c9c3e8'); grd.addColorStop(0.5, '#f4f1ff'); grd.addColorStop(1, '#ffffff');
    ctx.fillStyle = grd; ctx.fill(path);
    if (ctx.createConicGradient) {
      const cg = ctx.createConicGradient(-T * 2, ix, iy);
      COLORS.concat(COLORS[0]).forEach((c, i) => cg.addColorStop(i / 4, c.base));
      ctx.strokeStyle = cg;
    } else ctx.strokeStyle = COLORS[(T * 3 | 0) % 4].base;
    ctx.lineWidth = 3.5; ctx.stroke(path);
    starPath(ix, iy, 11, T * 1.5); ctx.fillStyle = COLORS[(T * 2 | 0) % 4].base; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#2a0d55'; ctx.stroke();
    if (b.glow > 0.02) { ctx.strokeStyle = `rgba(255,255,255,${(0.75 + 0.25 * pulse) * b.glow})`; ctx.lineWidth = 3 + 1.8 * pulse; ctx.stroke(path); }
  } else {
    paintBody(ctx, COLORS[b.c], g, path);
    const is = Math.min(31, g.hw * 2 * g.mid * 0.74, g.th * 0.78);
    ctx.drawImage(ICONS[b.c], ix - is / 2, iy - is / 2, is, is);
    // blocks that can't blast yet sit back slightly so "ready" groups read instantly
    if (state === 'play' && b.glow < 0.98) { ctx.fillStyle = `rgba(14,4,40,${0.2 * (1 - b.glow)})`; ctx.fill(path); }
    if (b.locked) {
      // chains: two crossed bars and a padlock
      ctx.save(); ctx.clip(path);
      ctx.strokeStyle = 'rgba(40,30,60,0.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const ca = Math.cos(g.ac), sa = Math.sin(g.ac), L = 30;
      ctx.beginPath();
      ctx.moveTo(ix - (ca + sa) * L, iy - (sa - ca) * L); ctx.lineTo(ix + (ca + sa) * L, iy + (sa - ca) * L);
      ctx.moveTo(ix - (ca - sa) * L, iy - (sa + ca) * L); ctx.lineTo(ix + (ca - sa) * L, iy + (sa + ca) * L);
      ctx.stroke(); ctx.strokeStyle = 'rgba(200,190,230,0.9)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      rr(ix - 7, iy - 3, 14, 11, 3); ctx.fillStyle = '#c9b25a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#4a3a10'; ctx.stroke();
      ctx.beginPath(); ctx.arc(ix, iy - 3, 5, Math.PI, 0); ctx.stroke();
    }
    if (b.glow > 0.02) {
      ctx.strokeStyle = `rgba(255,255,255,${(0.75 + 0.25 * pulse) * b.glow})`;
      ctx.lineWidth = 3 + 1.8 * pulse; ctx.stroke(path);
    }
  }
  if (b.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, b.flash) * 0.9})`; ctx.fill(path); }
  ctx.globalAlpha = 1;
}

function drawCore(p, hue) {
  let jx = 0, jy = 0, sc = 1;
  if (state === 'play' && p < 0.25) { const k = (0.25 - p) * 12; jx = rand(-k, k); jy = rand(-k, k); }
  if (state === 'dying') sc = Math.max(0, 1 - dyingT * 1.6);
  const pulse = (1 + corePulse * 0.16 + Math.sin(T * (p < 0.25 ? 14 : 3.5)) * 0.03) * sc;
  ctx.save(); ctx.translate(jx, jy);
  // stability arc
  ctx.lineCap = 'round';
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(0, 0, 53, 0, TAU); ctx.stroke();
  if (p > 0.003 && sc > 0) {
    ctx.strokeStyle = `hsl(${hue},100%,64%)`; ctx.beginPath(); ctx.arc(0, 0, 53, -Math.PI / 2, -Math.PI / 2 + TAU * p); ctx.stroke();
  }
  const R = 42 * pulse;
  if (R > 1) {
    const bg = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.08, 0, 0, R);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.28, `hsl(${hue},100%,78%)`);
    bg.addColorStop(0.75, `hsl(${hue},92%,50%)`); bg.addColorStop(1, `hsl(${hue + 12},85%,26%)`);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = `hsla(${hue},100%,85%,0.7)`; ctx.stroke();
    drawSwirl(0, 0, R * 0.62, T * 2.4, 'rgba(255,255,255,0.55)');
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(-R * 0.32, -R * 0.48, R * 0.38, R * 0.18, -0.5, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// Two passes: normal blend first, then every additive ('lighter') particle, so the composite
// mode flips twice per frame instead of twice per ring/orb particle.
function drawParticles() {
  drawParticlePass(false);
  ctx.globalCompositeOperation = 'lighter';
  drawParticlePass(true);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
function drawParticlePass(additive) {
  for (const p of parts) {
    if (p.t < 0 || (p.k === 'ring' || p.k === 'orb') !== additive) continue;
    const k = clamp(p.t / p.life, 0, 1), a = 1 - k;
    switch (p.k) {
      case 'dot':
        ctx.globalAlpha = a; ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - k * 0.6), 0, TAU); ctx.fill(); break;
      case 'star':
        ctx.globalAlpha = a; ctx.fillStyle = p.col; starPath(p.x, p.y, p.r * (1 - k * 0.4), p.rot); ctx.fill(); break;
      case 'shard':
        ctx.globalAlpha = Math.min(1, a * 1.6);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        rr(-p.w / 2, -p.h / 2, p.w, p.h, 6); ctx.fillStyle = p.col; ctx.fill();
        rr(-p.w / 2 + 4, -p.h / 2 + 3, p.w - 8, p.h * 0.3, 3); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
        ctx.restore(); break;
      case 'ring':
        if (p.r <= 0) break;
        ctx.globalAlpha = a; ctx.strokeStyle = `rgb(${p.col})`; ctx.lineWidth = Math.max(0.5, p.w * (1 - k));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke();
        break;
      case 'orb': {
        for (let j = 0; j < 3; j++) {
          const u = Math.max(0, k - j * 0.06), uu = u * u;
          const x = (1 - uu) * (1 - uu) * p.sx + 2 * (1 - uu) * uu * p.cx + uu * uu * CX;
          const y = (1 - uu) * (1 - uu) * p.sy + 2 * (1 - uu) * uu * p.cy + uu * uu * CY;
          ctx.globalAlpha = (1 - j * 0.3) * 0.9;
          ctx.fillStyle = `rgba(${p.col},0.45)`; ctx.beginPath(); ctx.arc(x, y, 8 - j * 2, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3.2 - j * 0.8, 0, TAU); ctx.fill();
        }
        break;
      }
      case 'gem': {
        const u = easeInOut(k);
        const x = (1 - u) * (1 - u) * p.sx + 2 * (1 - u) * u * p.cx + u * u * p.tx;
        const y = (1 - u) * (1 - u) * p.sy + 2 * (1 - u) * u * p.cy + u * u * p.ty;
        ctx.globalAlpha = 1; drawGem(x, y, 10 + 4 * Math.sin(k * Math.PI)); break;
      }
      case 'text': {
        const s = k < 0.15 ? easeOutBack(k / 0.15) : 1;
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
        txt(p.s, 0, 0, { size: p.size, color: p.col, stroke: '#2a0d55', sw: 7 });
        ctx.restore(); break;
      }
    }
  }
}

