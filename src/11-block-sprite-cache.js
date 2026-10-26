// ---------------------------------------------------------------- block sprite cache
// A block at rest is the same picture rotated around the core, so each (ring, colour) body and the
// per-ring dim / outline / halo masks are rasterised once per resize at device resolution and blitted
// with one drawImage. Moving, squashing, flashing and bomb blocks keep the full vector path.
let SPR = null;
function paintBody(g, C, gm, path) {
  const grd = g.createRadialGradient(0, 0, gm.r0, 0, 0, gm.r1);
  grd.addColorStop(0, C.dark); grd.addColorStop(0.5, C.base); grd.addColorStop(1, C.light);
  g.fillStyle = grd; g.fill(path);
  g.lineJoin = 'round'; g.lineWidth = 2.6; g.strokeStyle = C.deep; g.stroke(path);
  // glossy jelly band + specular
  g.fillStyle = 'rgba(255,255,255,0.36)';
  g.fill(sector(gm.r1 - gm.th * 0.42, gm.r1 - gm.th * 0.11, gm.ac - gm.hw * 0.8, gm.ac + gm.hw * 0.8, 5));
  const sa = gm.ac - gm.hw * 0.68, sr = gm.r1 - gm.th * 0.27;
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(Math.cos(sa) * sr, Math.sin(sa) * sr, 2.6, 0, TAU); g.fill();
  if (save.settings.patterns) paintPattern(g, COLORS.indexOf(C), gm, path);
}
// F-039: a second cue besides colour + icon — stripes / dots / zigzag / grid, one per colour.
function paintPattern(g, i, gm, path) {
  if (i < 0) return;
  g.save(); g.clip(path);
  g.strokeStyle = 'rgba(255,255,255,0.32)'; g.fillStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 2.2;
  const cx = Math.cos(gm.ac) * gm.mid, cy = Math.sin(gm.ac) * gm.mid, R = 36;
  g.beginPath();
  if (i === 0) for (let k = -R; k <= R; k += 8) { g.moveTo(cx + k - R, cy - R); g.lineTo(cx + k + R, cy + R); }
  else if (i === 1) for (let x = -R; x <= R; x += 9) for (let y = -R; y <= R; y += 9) { g.moveTo(cx + x + 1.8, cy + y); g.arc(cx + x, cy + y, 1.8, 0, TAU); }
  else if (i === 2) for (let y = -R; y <= R; y += 9) { g.moveTo(cx - R, cy + y); for (let x = -R; x <= R; x += 6) g.lineTo(cx + x, cy + y + ((x / 6) & 1 ? 3 : -3)); }
  else for (let k = -R; k <= R; k += 9) { g.moveTo(cx + k, cy - R); g.lineTo(cx + k, cy + R); g.moveTo(cx - R, cy + k); g.lineTo(cx + R, cy + k); }
  i === 1 ? g.fill() : g.stroke();
  g.restore();
}
function buildBlockSprites() {
  const pr = Math.min(4, scale * dpr), PAD = 9;
  SPR = [];
  for (let r = 0; r < RINGS; r++) {
    const mid = ringMid(r), hw = DA / 2 - 2.6 / mid;
    const gm = { mid, th: RING_T, ac: 0, hw, r0: mid - RING_T / 2, r1: mid + RING_T / 2 };
    const x0 = gm.r0 * Math.cos(hw) - PAD, hh = gm.r1 * Math.sin(hw) + PAD;
    const pw = Math.ceil((gm.r1 + PAD - x0) * pr), ph = Math.ceil(2 * hh * pr);
    const mk = paint => {
      const c = document.createElement('canvas'); c.width = pw; c.height = ph;
      const g = c.getContext('2d');
      g.setTransform(pr, 0, 0, pr, -x0 * pr, hh * pr);   // vortex-centre coords → sprite pixels
      g.lineJoin = 'round';
      paint(g, sector(gm.r0, gm.r1, -hw, hw, 10));
      return c;
    };
    SPR.push({
      fr: { x: x0 - mid, y: -hh, w: pw / pr, h: ph / pr },   // sprite rect relative to the block centre
      icon: Math.min(31, hw * 2 * mid * 0.74, RING_T * 0.78),
      body: COLORS.map(C => mk((g, p) => paintBody(g, C, gm, p))),
      dim:  mk((g, p) => { g.fillStyle = 'rgb(14,4,40)'; g.fill(p); }),
      edge: mk((g, p) => { g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(p); }),
      halo: mk((g, p) => { g.strokeStyle = '#fff'; g.lineWidth = 12; g.stroke(p); }),
    });
  }
}

