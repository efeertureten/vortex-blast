// ---------------------------------------------------------------- upgrade drawer (6 cards, scrolls)
const CARD_H = 104, CARD_GAP = 8;
const panelY = () => H - HANDLE_H - (DRAWER_H - HANDLE_H) * drawerT;
const cardY = (py, i) => py + HANDLE_H + 10 + i * (CARD_H + CARD_GAP) - drawerScroll;
const buyRect = (py, i) => ({ x: 382, y: cardY(py, i) + 22, w: 122, h: 58 });
const drawerMaxScroll = () => Math.max(0, UPGRADES.length * (CARD_H + CARD_GAP) + 20 - (DRAWER_H - HANDLE_H));

function drawUpgradeIcon(key, x, y) {
  ctx.save(); ctx.translate(x, y);
  if (key === 'magnet') {
    ctx.lineCap = 'butt'; ctx.lineWidth = 11; ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-13, -14); ctx.lineTo(-13, 0); ctx.arc(0, 0, 13, Math.PI, 0, true); ctx.lineTo(13, -14); ctx.stroke();
    ctx.fillStyle = '#d6e4ff'; ctx.fillRect(-18.5, -20, 11, 8); ctx.fillRect(7.5, -20, 11, 8);
  } else if (key === 'bomb') drawSwirl(0, 0, 20, T * 3);
  else if (key === 'mult') txt('x2', 0, 2, { size: 30, color: '#fff', stroke: '#7a4a00', sw: 6 });
  else if (key === 'combo') {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(-10, 3); ctx.lineTo(-1, 3); ctx.lineTo(-5, 20); ctx.lineTo(11, -4); ctx.lineTo(2, -4); ctx.closePath(); ctx.fill();
  } else if (key === 'shield') boosterIcon('shield', 0, 0, 1.4);
  else {
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * 10, Math.sin(a) * 10, 7, 0, TAU); ctx.fillStyle = COLORS[i].light; ctx.fill(); }
  }
  ctx.restore();
}
function drawDrawer() {
  const py = panelY();
  if (drawerT > 0.01) {
    ctx.fillStyle = `rgba(5,2,15,${0.6 * drawerT})`;
    ctx.fillRect(-offX / scale - 4, -offY / scale - 4, vw / scale + 8, py + offY / scale + 4);
    if (state === 'play' && drawerT > 0.5) txt(t('gamePaused'), 270, py - 50, { size: 34, color: 'rgba(255,255,255,0.85)', stroke: '#1d0840', sw: 7 });
  }
  const bottom = H + offY / scale + 4;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(10, bottom); ctx.lineTo(10, py + 28); ctx.arcTo(10, py, 38, py, 28);
  ctx.lineTo(502, py); ctx.arcTo(530, py, 530, py + 28, 28); ctx.lineTo(530, bottom); ctx.closePath();
  const g = ctx.createLinearGradient(0, py, 0, py + DRAWER_H);
  g.addColorStop(0, '#34197a'); g.addColorStop(1, '#170838');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(180,150,255,0.55)'; ctx.stroke();

  // handle
  rr(240, py + 8, 60, 6, 3); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
  ctx.fillStyle = '#ffd84a';
  ctx.beginPath(); ctx.moveTo(44, py + 22); ctx.lineTo(34, py + 40); ctx.lineTo(42, py + 40); ctx.lineTo(37, py + 54); ctx.lineTo(51, py + 33); ctx.lineTo(43, py + 33); ctx.lineTo(49, py + 22); ctx.closePath(); ctx.fill();
  txtFit(t('upgrades'), 62, py + 39, 230, { size: 27, color: '#fff', align: 'left', stroke: '#1d0840', sw: 5 });
  const aff = anyAffordable();
  if (aff && !drawerOpen) {
    const s = 1 + 0.15 * Math.sin(T * 7);
    ctx.font = '27px ' + FD; const lw = Math.min(230, ctx.measureText(t('upgrades')).width);
    ctx.save(); ctx.translate(62 + lw + 18, py + 26); ctx.scale(s, s);
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fillStyle = '#ff3b55'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
    txt('!', 0, 1, { size: 16, color: '#fff' }); ctx.restore();
  }
  drawGem(392, py + 37, 11);
  txtFit(fmt(shownGems()), 410, py + 39, 70, { size: 22, color: '#9ff8ff', align: 'left' });
  // chevron
  ctx.save(); ctx.translate(500, py + 36); ctx.rotate(drawerT * Math.PI);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(0, -4); ctx.lineTo(8, 4); ctx.stroke(); ctx.restore();

  if (drawerT > 0.02) {
    ctx.save();
    ctx.beginPath(); ctx.rect(10, py + HANDLE_H, 520, bottom - py - HANDLE_H); ctx.clip();
    for (let i = 0; i < UPGRADES.length; i++) {
      const U = UPGRADES[i], l = save.upg[U.key], maxed = l >= U.max, cost = maxed ? 0 : U.cost(l), can = !maxed && save.gems >= cost;
      const cy = cardY(py, i), sx = Math.sin(T * 60) * 6 * cardShake[i];
      if (cy > bottom || cy + CARD_H < py + HANDLE_H) continue;
      ctx.save(); ctx.translate(sx, 0);
      rr(26, cy, 488, CARD_H, 22); ctx.fillStyle = `rgba(255,255,255,${0.06 + 0.2 * cardFlash[i]})`; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2; ctx.stroke();
      const ig = ctx.createLinearGradient(0, cy + 20, 0, cy + 84); ig.addColorStop(0, U.col[0]); ig.addColorStop(1, U.col[1]);
      ctx.beginPath(); ctx.arc(74, cy + 52, 32, 0, TAU); ctx.fillStyle = ig; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(64, cy + 34, 14, 6, -0.4, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
      drawUpgradeIcon(U.key, 74, cy + 54);
      txtFit(upName(U), 120, cy + 22, 250, { size: 21, color: '#fff', align: 'left' });
      txtFit(upDesc(U, l), 120, cy + 45, 250, { size: 14, font: FB, weight: 600, color: 'rgba(255,255,255,0.75)', align: 'left' });
      const pw = U.max > 5 ? 15 : 26;
      for (let j = 0; j < U.max; j++) {
        rr(120 + j * (pw + 4), cy + 60, pw, 9, 4.5); ctx.fillStyle = j < l ? '#ffd84a' : 'rgba(255,255,255,0.14)'; ctx.fill();
      }
      txtFit(U.eff(l), 120, cy + 86, 250, { size: 13.5, font: FB, weight: 600, color: '#9ff8ff', align: 'left' });
      const R = buyRect(py, i), s = 1 - 0.08 * btnPress[i];
      ctx.save(); ctx.translate(R.x + R.w / 2, R.y + R.h / 2); ctx.scale(s, s);
      rr(-R.w / 2, -R.h / 2 + 6, R.w, R.h, 18); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      rr(-R.w / 2, -R.h / 2, R.w, R.h, 18);
      const bg = ctx.createLinearGradient(0, -R.h / 2, 0, R.h / 2);
      if (maxed) { bg.addColorStop(0, '#ffe066'); bg.addColorStop(1, '#d08400'); }
      else if (can) { bg.addColorStop(0, '#7cf08a'); bg.addColorStop(1, '#1fa83a'); }
      else { bg.addColorStop(0, '#5a4c86'); bg.addColorStop(1, '#3a2d63'); }
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,4,30,0.5)'; ctx.stroke();
      rr(-R.w / 2 + 8, -R.h / 2 + 5, R.w - 16, 13, 6.5); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
      if (maxed) txt(t('max'), 0, 3, { size: 26, color: '#fff', stroke: '#8a5200', sw: 6 });
      else {
        ctx.font = '25px ' + FD; const tw = ctx.measureText(fmt(cost)).width, tot = tw + 28;
        drawGem(-tot / 2 + 10, 3, 10);
        txt(fmt(cost), -tot / 2 + 28, 4, { size: 25, color: can ? '#fff' : 'rgba(255,255,255,0.6)', align: 'left', stroke: 'rgba(10,4,30,0.45)', sw: 5 });
      }
      ctx.restore();
      ctx.restore();
    }
    ctx.restore();
    // scroll hint
    const mx = drawerMaxScroll();
    if (mx > 0 && drawerT > 0.9) {
      const top = py + HANDLE_H + 6, hgt = bottom - top - 40, k = drawerScroll / mx;
      rr(522, top + k * hgt * 0.75, 4, hgt * 0.25, 2); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
    }
  }
  ctx.restore();
}

function buy(i) {
  const U = UPGRADES[i], l = save.upg[U.key];
  btnPress[i] = 1;
  if (l >= U.max) { Snd.deny(); return; }
  const cost = U.cost(l);
  if (save.gems < cost) { Snd.deny(); cardShake[i] = 1; return; }
  save.gems -= cost; save.upg[U.key]++; persist();
  cardFlash[i] = 1; Snd.buy();
  Track.ev('upgrade_buy', { key: U.key, level: l + 1, cost, gems_after: save.gems });
  checkAchievements();
  const R = buyRect(panelY(), i);
  for (let k = 0; k < 14; k++) {
    const a = rand(0, TAU), sp = rand(120, 320);
    addPart({ k: 'star', x: R.x + R.w / 2, y: R.y + R.h / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(5, 9), col: k % 2 ? '#ffd84a' : '#fff', rot: 0, vr: rand(-8, 8), life: 0.6, t: 0, drag: 3, g: 200 }, true);
  }
}

