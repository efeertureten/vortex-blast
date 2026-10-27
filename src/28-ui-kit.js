// ---------------------------------------------------------------- UI kit
// Immediate-mode: every frame's draw registers its tap targets in `hits` (drawn later = on top = tested first).
let hits = [], modal = null, modalT = 1, pressId = '', pressT = -9, showDebug = false;
let drawerScroll = 0, drawerDrag = null, resetArmedT = -9, doubled = false;
const boostPick = { bomb: false, shield: false, magnet: false };
const reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const reducedMotion = () => save.settings.motion === 'reduced' || (save.settings.motion === 'auto' && !!(reduceMQ && reduceMQ.matches));
const motionK = () => reducedMotion() ? 0.2 : 1;   // F-007: shake, punch and flash scale
function hit(R, fn, id) { hits.push({ x: R.x, y: R.y, w: R.w, h: R.h, fn, id }); }
const pressK = id => id && pressId === id && T - pressT < 0.15 ? 0.93 : 1;
function openModal(m) { modal = m; modalT = 0; }
// a sub-panel opened from the pause menu returns to it, so a paused run never loses its menu
function closeModal() {
  if (modal && modal.back === 'pause') { modal = { kind: 'pause', pausesGame: true }; modalT = 1; }
  else modal = null;
  Snd.click();
}
function txtFit(s, x, y, maxW, o) {
  let size = o.size;
  ctx.font = (o.weight ? o.weight + ' ' : '') + size + 'px ' + (o.font || FD);
  while (size > 9 && ctx.measureText(s).width > maxW) { size -= 1; ctx.font = (o.weight ? o.weight + ' ' : '') + size + 'px ' + (o.font || FD); }
  txt(s, x, y, Object.assign({}, o, { size }));
}
function uiButton(id, R, label, opt, fn) {
  opt = opt || {};
  const s = pressK(id) * (opt.scale || 1), w = R.w, h = R.h, rad = opt.r ?? Math.min(18, h * 0.36);
  ctx.save(); ctx.translate(R.x + w / 2, R.y + h / 2); ctx.scale(s, s);
  rr(-w / 2, -h / 2 + 5, w, h, rad); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  rr(-w / 2, -h / 2, w, h, rad);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, opt.disabled ? '#5a4c86' : opt.c1 || '#7cf08a'); g.addColorStop(1, opt.disabled ? '#3a2d63' : opt.c2 || '#1fa83a');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,4,30,0.5)'; ctx.stroke();
  rr(-w / 2 + 8, -h / 2 + 5, w - 16, Math.min(14, h * 0.28), 7); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill();
  if (opt.icon) opt.icon(-w / 2 + 22, 2);
  if (label) txtFit(label, opt.icon ? 12 : 0, opt.sub ? -7 : 2, w - (opt.icon ? 56 : 20),
    { size: opt.size || 24, color: opt.disabled ? 'rgba(255,255,255,0.6)' : '#fff', stroke: 'rgba(10,4,30,0.45)', sw: 5 });
  if (opt.sub) txtFit(opt.sub, 0, h / 2 - 13, w - 16, { size: 13, font: FB, weight: 700, color: 'rgba(255,255,255,0.88)' });
  ctx.restore();
  if (fn && !opt.disabled) hit(R, fn, id);
}
// round dark button (mute / pause / gear / title side buttons); badge = red dot
function roundButton(id, x, y, r, drawIcon, fn, badge) {
  const s = pressK(id);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = 'rgba(10,4,32,0.7)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.stroke();
  drawIcon(r);
  if (badge) {
    const b = 1 + 0.12 * Math.sin(T * 7);
    ctx.beginPath(); ctx.arc(r * 0.72, -r * 0.72, 7 * b, 0, TAU); ctx.fillStyle = '#ff3b55'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
  }
  ctx.restore();
  hit({ x: x - r - 6, y: y - r - 6, w: 2 * r + 12, h: 2 * r + 12 }, fn, id);
}
// --- small vector icons, drawn around (0,0) inside a roundButton
const ICON = {
  pause: () => { ctx.fillStyle = '#fff'; rr(-8, -9, 6, 18, 2); ctx.fill(); rr(2, -9, 6, 18, 2); ctx.fill(); },
  gear: () => {
    ctx.fillStyle = '#fff'; ctx.beginPath();
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16, r = i % 2 ? 8 : 11; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); }
    ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fillStyle = '#2a1458'; ctx.fill();
  },
  gift: () => {
    ctx.fillStyle = '#ffd84a'; rr(-11, -3, 22, 14, 3); ctx.fill(); ctx.fillStyle = '#ff6b8a'; rr(-13, -8, 26, 6, 2); ctx.fill();
    ctx.fillStyle = '#ff3b55'; ctx.fillRect(-2, -8, 4, 19);
    ctx.strokeStyle = '#ff3b55'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(-5, -11, 4, 0, TAU); ctx.arc(5, -11, 4, Math.PI, Math.PI + TAU); ctx.stroke();
  },
  quest: () => {
    ctx.fillStyle = '#e8f0ff'; rr(-9, -12, 18, 23, 3); ctx.fill();
    ctx.strokeStyle = '#4a3a8a'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-5, -6 + i * 6); ctx.lineTo(5, -6 + i * 6); ctx.stroke(); }
    ctx.strokeStyle = '#2fd457'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, 7); ctx.lineTo(5, 10); ctx.lineTo(12, 1); ctx.stroke();
  },
  season: () => {
    ctx.fillStyle = '#ffd84a'; starPath(0, 0, 13, 0); ctx.fill(); ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 2; ctx.stroke();
  },
  profile: () => {
    ctx.fillStyle = '#c9e2ff'; ctx.beginPath(); ctx.arc(0, -5, 6, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 12, 11, Math.PI, 0); ctx.fill();
  },
  share: () => {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, -7); ctx.moveTo(-6, 0); ctx.lineTo(6, 7); ctx.stroke();
    for (const [x, y] of [[-6, 0], [6, -7], [6, 7]]) { ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); }
  },
  close: () => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, 7); ctx.moveTo(7, -7); ctx.lineTo(-7, 7); ctx.stroke(); },
  speaker: () => {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-5, -4); ctx.lineTo(2, -10); ctx.lineTo(2, 10); ctx.lineTo(-5, 4); ctx.lineTo(-10, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    if (save.muted) { ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(13, 5); ctx.moveTo(13, -5); ctx.lineTo(6, 5); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(3, 0, 6, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(3, 0, 11, -0.9, 0.9); ctx.stroke(); }
  },
};
const boosterIcon = (k, x, y, s = 1) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (k === 'bomb') drawSwirl(0, 0, 13, T * 3, '#d6a8ff');
  else if (k === 'shield') {
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(11, -8); ctx.lineTo(10, 3); ctx.quadraticCurveTo(7, 10, 0, 14); ctx.quadraticCurveTo(-7, 10, -10, 3); ctx.lineTo(-11, -8); ctx.closePath();
    ctx.fillStyle = '#7dffa0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#0d5a2a'; ctx.stroke();
  } else {
    ctx.lineCap = 'butt'; ctx.lineWidth = 6; ctx.strokeStyle = '#ff7a8c';
    ctx.beginPath(); ctx.moveTo(-7, -9); ctx.lineTo(-7, 0); ctx.arc(0, 0, 7, Math.PI, 0, true); ctx.lineTo(7, -9); ctx.stroke();
    ctx.fillStyle = '#e6eeff'; ctx.fillRect(-10, -13, 6, 5); ctx.fillRect(4, -13, 6, 5);
  }
  ctx.restore();
};
function panelBox(x, y, w, h, title) {
  ctx.fillStyle = 'rgba(5,2,15,0.72)'; fullRect();
  const k = 0.9 + 0.1 * (reducedMotion() ? 1 : easeOutBack(Math.min(1, modalT)));
  ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-x - w / 2, -y - h / 2);
  rr(x, y, w, h, 30);
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#3d1c80'); g.addColorStop(1, '#1b0a44');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(190,150,255,0.6)'; ctx.stroke();
  if (title) txtFit(title, x + w / 2, y + 40, w - 120, { size: 34, stroke: '#1d0840', sw: 7 });
}
function closeX(x, y, fn) { roundButton('close', x, y, 20, ICON.close, fn || closeModal); }
// small underlined text that opens the privacy policy page shipped next to index.html (F-033)
function privacyLink(x, y) {
  txt(t('privacy'), x, y, { size: 15, font: FB, weight: 700, color: '#b9a8ff' });
  ctx.fillStyle = 'rgba(185,168,255,0.6)'; ctx.fillRect(x - 70, y + 10, 140, 1.5);
  hit({ x: x - 110, y: y - 16, w: 220, h: 34 }, () => { Snd.click(); try { window.open('privacy.html', '_blank', 'noopener'); } catch (e) {} }, 'privacy');
}
// a settings-style row: label left, control right; whole row is the tap target
function toggleRow(id, x, y, w, label, on, fn) {
  txtFit(label, x + 16, y + 24, w - 120, { size: 18, font: FB, weight: 600, align: 'left', color: '#fff' });
  const sx = x + w - 76;
  rr(sx, y + 9, 60, 30, 15); ctx.fillStyle = on ? '#2fd457' : 'rgba(255,255,255,0.18)'; ctx.fill();
  ctx.beginPath(); ctx.arc(on ? sx + 45 : sx + 15, y + 24, 11, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  hit({ x, y, w, h: 48 }, fn, id);
}
function segRow(id, x, y, w, label, opts, cur, fn) {
  txtFit(label, x + 16, y + 24, 140, { size: 18, font: FB, weight: 600, align: 'left', color: '#fff' });
  const sw = Math.min(88, (w - 170) / opts.length), sx = x + w - 16 - sw * opts.length;
  opts.forEach(([v, l], i) => {
    const R = { x: sx + i * sw, y: y + 8, w: sw - 4, h: 32 };
    rr(R.x, R.y, R.w, R.h, 10); ctx.fillStyle = v === cur ? '#7c5cff' : 'rgba(255,255,255,0.12)'; ctx.fill();
    txtFit(l, R.x + R.w / 2, R.y + 17, R.w - 8, { size: 15, font: FB, weight: 700, color: '#fff' });
    hit(R, () => fn(v), id + v);
  });
}
function progressBar(x, y, w, h, k, col) {
  rr(x, y, w, h, h / 2); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  if (k > 0.001) { rr(x, y, Math.max(h, w * Math.min(1, k)), h, h / 2); ctx.fillStyle = col || '#ffd84a'; ctx.fill(); }
}
const gemsAmount = (n, x, y, size = 22, align = 'left') => {
  ctx.font = size + 'px ' + FD;
  const s = fmt(n), tw = ctx.measureText(s).width, x0 = align === 'center' ? x - (tw + size + 4) / 2 : x;
  drawGem(x0 + size * 0.45, y, size * 0.45);
  txt(s, x0 + size + 2, y + 1, { size, color: '#9ff8ff', align: 'left', stroke: '#11284d', sw: 4 });
};

