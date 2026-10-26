// ---------------------------------------------------------------- shared drawing helpers
function rr(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function txt(s, x, y, o) {
  ctx.font = (o.weight ? o.weight + ' ' : '') + o.size + 'px ' + (o.font || FD);
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.sw || 4; ctx.strokeStyle = o.stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = o.color || '#fff'; ctx.fillText(s, x, y);
}
function starPath(x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr2 = i % 2 ? r * 0.45 : r, a = rot - Math.PI / 2 + i * Math.PI / 5;
    const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function drawGem(x, y, s) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.32); ctx.lineTo(-s * 0.55, -s * 0.85); ctx.lineTo(s * 0.55, -s * 0.85);
  ctx.lineTo(s, -s * 0.32); ctx.lineTo(0, s * 0.95); ctx.closePath();
  const g = ctx.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, '#9ff8ff'); g.addColorStop(0.5, '#3aa8ff'); g.addColorStop(1, '#b04dff');
  ctx.fillStyle = g; ctx.fill();
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, s * 0.17); ctx.strokeStyle = '#1b0b45'; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, -s * 0.32); ctx.lineTo(s * 0.9, -s * 0.32);
  ctx.moveTo(-s * 0.3, -s * 0.32); ctx.lineTo(0, s * 0.8); ctx.lineTo(s * 0.3, -s * 0.32);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, s * 0.09); ctx.stroke();
  ctx.restore();
}
function drawSwirl(x, y, r, rot, col = '#fff') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = r * 0.24;
  for (let i = 0; i < 3; i++) {
    ctx.rotate(TAU / 3);
    ctx.beginPath(); ctx.arc(r * 0.28, 0, r * 0.62, Math.PI * 0.95, Math.PI * 1.85); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, TAU); ctx.fillStyle = col; ctx.fill();
  ctx.restore();
}

// Rounded annular sector (a curved jelly block). Origin = vortex centre.
function sector(r0, r1, a0, a1, rc) {
  const p = new Path2D();
  rc = Math.max(1, Math.min(rc, (r1 - r0) / 2 - 0.5, ((a1 - a0) / 2) * r0 - 0.5));
  const ro = rc / r1, ri = rc / r0;
  const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
  p.moveTo(Math.cos(a0 + ro) * r1, Math.sin(a0 + ro) * r1);
  p.arc(0, 0, r1, a0 + ro, a1 - ro, false);
  p.quadraticCurveTo(c1 * r1, s1 * r1, c1 * (r1 - rc), s1 * (r1 - rc));
  p.lineTo(c1 * (r0 + rc), s1 * (r0 + rc));
  p.quadraticCurveTo(c1 * r0, s1 * r0, Math.cos(a1 - ri) * r0, Math.sin(a1 - ri) * r0);
  p.arc(0, 0, r0, a1 - ri, a0 + ri, true);
  p.quadraticCurveTo(c0 * r0, s0 * r0, c0 * (r0 + rc), s0 * (r0 + rc));
  p.lineTo(c0 * (r1 - rc), s0 * (r1 - rc));
  p.quadraticCurveTo(c0 * r1, s0 * r1, Math.cos(a0 + ro) * r1, Math.sin(a0 + ro) * r1);
  p.closePath();
  return p;
}

