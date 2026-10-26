// ---------------------------------------------------------------- pre-rendered icons (cute toon symbols)
function iconPath(kind) {
  const p = new Path2D();
  if (kind === 'star') {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 13 : 28, a = -Math.PI / 2 + i * Math.PI / 5;
      const x = Math.cos(a) * r, y = Math.sin(a) * r + 3;
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
  } else if (kind === 'drop') {
    p.moveTo(0, -29); p.bezierCurveTo(6, -18, 19, -7, 19, 8);
    p.arc(0, 8, 19, 0, Math.PI, false);
    p.bezierCurveTo(-19, -7, -6, -18, 0, -29); p.closePath();
  } else if (kind === 'flame') {
    p.moveTo(2, -30); p.bezierCurveTo(9, -19, 21, -10, 20, 7);
    p.bezierCurveTo(19, 21, 10, 28, 0, 28); p.bezierCurveTo(-10, 28, -20, 21, -20, 7);
    p.bezierCurveTo(-20, -5, -14, -9, -11, -20); p.bezierCurveTo(-8, -12, -5, -10, -2, -9);
    p.bezierCurveTo(-4, -17, -3, -24, 2, -30); p.closePath();
  } else { // leaf
    p.moveTo(0, -29); p.bezierCurveTo(19, -17, 20, 11, 0, 27);
    p.bezierCurveTo(-20, 11, -19, -17, 0, -29); p.closePath();
  }
  return p;
}
function makeIcon(C) {
  const S = 88, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.translate(S / 2, S / 2); g.scale(1.25, 1.25);
  const p = iconPath(C.icon), rot = C.icon === 'leaf' ? 0.55 : 0;
  // drop shadow
  g.save(); g.translate(0, 3.5); g.rotate(rot); g.globalAlpha = 0.5; g.fillStyle = C.deep; g.fill(p); g.restore();
  // body
  g.save(); g.rotate(rot);
  const gr = g.createLinearGradient(0, -28, 0, 28);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, C.ico); gr.addColorStop(1, C.light);
  g.fillStyle = gr; g.fill(p);
  if (C.icon === 'flame') { g.save(); g.translate(0, 13); g.scale(0.45, 0.45); g.globalAlpha = 0.55; g.fillStyle = C.base; g.fill(p); g.restore(); }
  if (C.icon === 'leaf') { g.beginPath(); g.moveTo(0, 25); g.quadraticCurveTo(3, 2, 0, -22); g.strokeStyle = C.light; g.lineWidth = 3; g.lineCap = 'round'; g.stroke(); }
  g.lineJoin = 'round'; g.lineWidth = 4.2; g.strokeStyle = C.deep; g.stroke(p);
  if (C.icon === 'leaf') { g.beginPath(); g.moveTo(0, 27); g.lineTo(0, 33); g.strokeStyle = C.deep; g.lineWidth = 4.5; g.lineCap = 'round'; g.stroke(); }
  g.restore();
  // specular shine
  const sh = { star: [-6, -5], drop: [-8, 1], flame: [-9, 3], leaf: [-9, -6] }[C.icon];
  g.save(); g.translate(sh[0], sh[1]); g.rotate(-0.6);
  g.beginPath(); g.ellipse(0, 0, 4.6, 2.6, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.95)'; g.fill();
  g.restore();
  // cute face
  const ey = { star: 6, drop: 12, flame: 13, leaf: 7 }[C.icon];
  for (const ex of [-6.5, 6.5]) {
    g.beginPath(); g.ellipse(ex, ey, 3.1, 4, 0, 0, TAU); g.fillStyle = '#26101f'; g.fill();
    g.beginPath(); g.arc(ex - 1, ey - 1.6, 1.25, 0, TAU); g.fillStyle = '#fff'; g.fill();
  }
  g.beginPath(); g.arc(0, ey + 4, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); g.strokeStyle = '#26101f'; g.lineWidth = 1.8; g.lineCap = 'round'; g.stroke();
  return c;
}
const ICONS = COLORS.map(makeIcon);

