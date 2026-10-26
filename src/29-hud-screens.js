// ---------------------------------------------------------------- HUD & screens
function drawGemPill() {
  const P = GEM_PILL, b = 1 + 0.14 * gemBounce;
  ctx.save(); ctx.translate(P.x + P.w / 2, P.y + P.h / 2); ctx.scale(b, b);
  rr(-P.w / 2, -P.h / 2, P.w, P.h, P.h / 2); ctx.fillStyle = 'rgba(10,4,32,0.65)'; ctx.fill();
  ctx.strokeStyle = 'rgba(140,220,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
  drawGem(-P.w / 2 + 24, 1, 12);
  txtFit(fmt(shownGems()), 14, 2, P.w - 50, { size: 23, color: '#fff' });
  ctx.restore();
}
function toggleMute() { save.muted = !save.muted; Snd.init(); Snd.setMuted(save.muted); persist(); if (!save.muted) Snd.click(); }
function drawTopLeft() {
  roundButton('mute', MUTE_BTN.x, MUTE_BTN.y, MUTE_BTN.r, ICON.speaker, toggleMute);
  if (state === 'play') roundButton('pause', 96, 45, 23, ICON.pause, () => pauseGame());
  else roundButton('gear', 96, 45, 23, ICON.gear, () => { Snd.click(); openModal({ kind: 'settings' }); });
}
function pauseGame() { if (state !== 'play' || paused) return; paused = true; Snd.click(); Track.ev('pause', { source: 'button' }); openModal({ kind: 'pause', pausesGame: true }); }
function resumeGame() { paused = false; modal = null; resumeT = 0.5; Snd.click(); }

function drawHUD() {
  if (state === 'play' || state === 'dying' || state === 'revive') {
    txt(fmt(Math.round(dispScore)), 270, 58, { size: 50, stroke: '#2a0d55', sw: 9 });
    const bestShown = mode === 'zen' ? save.zenBest : mode === 'daily' ? save.challenge.best : save.best;
    txtFit((mode === 'endless' ? t('best') : t(mode === 'zen' ? 'zen' : 'dailyMode') + ' ' + t('best')) + ' ' + fmt(Math.max(bestShown, score)), 270, 94, 260,
      { size: 15, font: FB, weight: 700, color: 'rgba(255,255,255,0.6)' });
    // stability bar
    const x = 36, y = 132, w = 468, h = 24, p = clamp(dispStab / 100, 0, 1), hue = stabHue(p);
    txtFit(t('core'), x + 4, y - 13, 250, { size: 14, font: FB, weight: 700, color: 'rgba(255,255,255,0.75)', align: 'left' });
    txt(t('wave', { n: wave }), x + w - 4, y - 13, { size: 17, color: '#ffd84a', align: 'right' });
    rr(x, y, w, h, h / 2); ctx.fillStyle = 'rgba(8,3,26,0.75)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 2; ctx.stroke();
    if (mode === 'zen') { rr(x + 3, y + 3, w - 6, h - 6, (h - 6) / 2); ctx.fillStyle = 'rgba(125,249,255,0.35)'; ctx.fill(); }
    else if (p > 0.004) {
      const fw = Math.max(h - 6, (w - 6) * p);
      rr(x + 3, y + 3, fw, h - 6, (h - 6) / 2);
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, `hsl(${hue},100%,72%)`); g.addColorStop(1, `hsl(${hue},95%,44%)`);
      ctx.fillStyle = g; ctx.fill();
      if (fw > 18) { rr(x + 9, y + 5, fw - 12, 5, 2.5); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill(); }
      if (dispStab > 100) {   // shield / streak overflow above 100 %
        const ow = (w - 6) * Math.min(0.4, (dispStab - 100) / 100);
        rr(x + w - 3 - ow, y + 3, ow, h - 6, (h - 6) / 2); ctx.fillStyle = 'rgba(160,255,190,0.85)'; ctx.fill();
      }
    }
    if (barFlash > 0) { rr(x - 1, y - 1, w + 2, h + 2, (h + 2) / 2); ctx.strokeStyle = `rgba(255,255,255,${barFlash})`; ctx.lineWidth = 3; ctx.stroke(); }
    if (p < 0.25 && state === 'play' && mode !== 'zen') {
      rr(x - 3, y - 3, w + 6, h + 6, (h + 6) / 2); ctx.strokeStyle = `rgba(255,60,70,${0.5 + 0.5 * Math.sin(T * 14)})`; ctx.lineWidth = 3; ctx.stroke();
    }
    // status chips under the bar: boss timer, shield, magnet boost
    let cx = x;
    const chip = (label, col, k) => {
      ctx.font = '700 13px ' + FB; const cw = ctx.measureText(label).width + 22;
      rr(cx, y + 32, cw, 22, 11); ctx.fillStyle = 'rgba(8,3,26,0.7)'; ctx.fill();
      if (k != null) { rr(cx, y + 32, cw * k, 22, 11); ctx.fillStyle = col; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1; }
      txt(label, cx + cw / 2, y + 44, { size: 13, font: FB, weight: 700, color: '#fff' });
      cx += cw + 6;
    };
    if (bossT > 0) chip('BOSS ' + Math.ceil(bossT) + 's', '#ff5a6a', bossT / CFG.content.bossSecs);
    if (shieldArmed) chip(t('boost.shield'), '#7dffa0');
    if (magnetBoostT > 0) chip(t('boost.magnet').replace(/ \d+ s(n)?/, '') + ' ' + Math.ceil(magnetBoostT) + 's', '#ff7a8c', magnetBoostT / 30);
  }
  drawGemPill();
  drawTopLeft();

  if (state === 'play') {
    if (combo >= 2 && comboT > 0) {
      const s = 1 + 0.35 * easeOutCubic(comboPop) * motionK();
      ctx.save(); ctx.translate(270, 774); ctx.scale(s, s); ctx.rotate(Math.sin(T * 6) * 0.03 * motionK());
      txt(t('combo', { n: combo }), 0, 0, { size: 40, color: `hsl(${(T * 200) % 360},100%,70%)`, stroke: '#2a0d55', sw: 8 });
      ctx.restore();
      rr(195, 800, 150, 6, 3); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
      rr(195, 800, 150 * clamp(comboT / comboWin, 0, 1), 6, 3); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    }
    if (ftueStep >= 0) drawFtue();
    else {
      let tip = null;
      if (specialOnBoard === 'bomb') tip = t('tip.bomb');
      else if (specialOnBoard === 'cb') tip = t('tip.cbomb');
      else if (blasts < 2) tip = t('tip.tap');
      else if (timeAlive < 30 && bombsMade === 0) tip = t('tip.forge', { n: bombThreshold() });
      else if (specialOnBoard === 'lock' && save.stats.runs < 5) tip = t('tip.lock');
      if (tip) { ctx.globalAlpha = 0.65 + 0.35 * Math.sin(T * 4); txtFit(tip, 270, 846, 500, { size: 17, font: FB, weight: 600, color: '#fff', stroke: 'rgba(20,6,50,0.8)', sw: 5 }); ctx.globalAlpha = 1; }
    }
  }
}
function drawFtue() {
  const key = ftueStep === 1 && !ftueTarget() ? 'ftue.1b' : 'ftue.' + ftueStep;
  rr(40, 176, 460, 58, 20); ctx.fillStyle = 'rgba(10,4,32,0.82)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,216,74,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  txtFit(t(ftueStep === 1 ? 'ftue.1' : key), 270, ftueStep === 1 ? 196 : 205, 430, { size: 17, font: FB, weight: 700, color: '#ffe680' });
  if (ftueStep === 1) txtFit(t(ftueTarget() ? 'ftue.0' : 'ftue.1b'), 270, 218, 430, { size: 14, font: FB, weight: 600, color: 'rgba(255,255,255,0.85)' });
  uiButton('ftueSkip', { x: 424, y: 82, w: 92, h: 34 }, t('skip'), { size: 16, c1: '#8a7bb8', c2: '#4b3c7a' }, () => { ftueSkip(); Snd.click(); });
  const tg = ftueTarget();
  if (tg) {   // bouncing hand pointer
    const b = Math.sin(T * 6) * 6 * motionK();
    ctx.save(); ctx.translate(tg.x + 10, tg.y + 14 + b); ctx.rotate(-0.35);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 26); ctx.lineTo(4, 25); ctx.lineTo(8, 40); ctx.lineTo(-2, 40); ctx.lineTo(-4, 26); ctx.lineTo(-11, 29); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#2a0d55'; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(tg.x, tg.y, 24 + 6 * Math.sin(T * 6), 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.stroke();
  }
}

function drawBanners() {
  if (banners.length) {
    const b = banners[0], k = b.t / b.dur;
    const s = reducedMotion() ? 1 : k < 0.18 ? easeOutBack(k / 0.18) : 1 + (k - 0.18) * 0.08;
    ctx.globalAlpha = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
    ctx.save(); ctx.translate(270, b.y - k * 26 * motionK()); ctx.scale(s, s);
    txtFit(b.s, 0, 0, 500, { size: b.size, color: b.col, stroke: '#1d0840', sw: b.size * 0.2 });
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  // achievement toasts slide down from the top one at a time
  if (achQueue.length) {
    const a = achQueue[0]; a.t += 1 / 60;
    const k = a.t < 0.3 ? easeOutCubic(a.t / 0.3) : a.t > 2.2 ? 1 - (a.t - 2.2) / 0.3 : 1;
    if (a.t > 2.5) achQueue.shift();
    ctx.save(); ctx.globalAlpha = clamp(k, 0, 1); ctx.translate(0, -60 + 80 * k);
    rr(110, 0, 320, 52, 26); ctx.fillStyle = 'rgba(20,8,48,0.92)'; ctx.fill(); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; ctx.stroke();
    starPath(140, 26, 13, 0); ctx.fillStyle = '#ffd84a'; ctx.fill();
    txtFit(t('achDone'), 285, 17, 240, { size: 13, font: FB, weight: 700, color: '#ffd84a' });
    txtFit(a.name, 285, 36, 240, { size: 19, color: '#fff' });
    ctx.restore();
  }
}

function logoWord(s, y, size, cols) {
  ctx.font = size + 'px ' + FD; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.3; ctx.strokeStyle = '#12052b'; ctx.strokeText(s, 0, y + size * 0.08);
  ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#2d0d63'; ctx.strokeText(s, 0, y);
  const g = ctx.createLinearGradient(0, y - size * 0.45, 0, y + size * 0.45);
  cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
  ctx.fillStyle = g; ctx.fillText(s, 0, y);
}
function drawButton(R, label, c1, c2, press, size, extraScale = 1) {
  const s = (1 - 0.07 * press) * extraScale;
  ctx.save(); ctx.translate(R.x + R.w / 2, R.y + R.h / 2); ctx.scale(s, s);
  const w = R.w, h = R.h;
  rr(-w / 2, -h / 2 + 7, w, h, h * 0.36); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
  rr(-w / 2, -h / 2, w, h, h * 0.36);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(20,6,40,0.55)'; ctx.stroke();
  rr(-w / 2 + 10, -h / 2 + 6, w - 20, h * 0.3, h * 0.15); ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fill();
  txtFit(label, 0, 3, w - 30, { size, color: '#fff', stroke: 'rgba(10,40,10,0.45)', sw: 7 });
  ctx.restore();
}
// PLAY: offer boosters first when there are any (not in the Daily Challenge, which stays fair)
function pressPlay() {
  Snd.init(); playPress = 1;
  if (mode !== 'daily' && ['bomb', 'shield', 'magnet'].some(k => save.inventory[k] > 0)) {
    for (const k in boostPick) boostPick[k] = false;
    openModal({ kind: 'boost' }); Snd.click(); return;
  }
  startGame();
}
function drawTitle() {
  const bob = Math.sin(T * 2) * 4 * motionK();
  ctx.save(); ctx.translate(270, 112 + bob); ctx.rotate(Math.sin(T * 1.3) * 0.025 * motionK());
  logoWord('VORTEX', 0, 80, ['#b5fbff', '#4f8bff', '#9a4dff']);
  logoWord('BLAST!', 74, 94, ['#fff59a', '#ffb21f', '#ff4f2c']);
  ctx.restore();
  const ev = eventToday();
  if (ev) {
    const s = t('ev.' + ev); ctx.font = '700 15px ' + FB; const w = Math.min(460, ctx.measureText(s).width + 36);
    rr(270 - w / 2, 236, w, 30, 15); ctx.fillStyle = 'rgba(255,90,140,0.9)'; ctx.fill();
    txtFit(s, 270, 252, w - 20, { size: 15, font: FB, weight: 700, color: '#fff' });
  }
  // mode line + chips
  const dailyUsed = save.challenge.date === dayKey() && save.challenge.tries > 0;
  const line = mode === 'daily' ? (dailyUsed ? t('mode.dailyUsed', { s: fmt(save.challenge.best) }) : t('mode.daily')) : t('mode.' + mode);
  txtFit(line, 270, 698, 500, { size: 16, font: FB, weight: 600, color: 'rgba(255,255,255,0.9)', stroke: 'rgba(20,6,50,0.8)', sw: 5 });
  const modes = [['endless', t('endless')], ['daily', t('dailyMode')], ['zen', t('zen')]];
  modes.forEach(([m, l], i) => {
    const R = { x: 84 + i * 126, y: 716, w: 120, h: 34 };
    rr(R.x, R.y, R.w, R.h, 17); ctx.fillStyle = mode === m ? '#7c5cff' : 'rgba(10,4,32,0.7)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = mode === m ? '#c9b8ff' : 'rgba(255,255,255,0.2)'; ctx.stroke();
    txtFit(l, R.x + R.w / 2, R.y + 18, R.w - 14, { size: 16, color: '#fff' });
    hit(R, () => { if (mode !== m) { mode = m; Snd.click(); Track.ev('mode_select', { mode: m }); } }, 'mode' + m);
  });
  drawButton(PLAY_BTN_TITLE, t('play'), '#7cf08a', '#1fa83a', playPress, 42, 1 + 0.04 * Math.sin(T * 5) * motionK());
  hit(PLAY_BTN_TITLE, pressPlay, 'play');
  // side buttons around PLAY
  roundButton('daily', 52, 795, 25, ICON.gift, () => { Snd.click(); openModal({ kind: 'daily' }); }, Daily.canClaim());
  roundButton('quests', 106, 795, 25, ICON.quest, () => { Snd.click(); openModal({ kind: 'quests' }); }, Quests.claimable());
  roundButton('season', 434, 795, 25, ICON.season, () => { Snd.click(); openModal({ kind: 'season' }); }, Season.claimable() > 0);
  roundButton('profile', 488, 795, 25, ICON.profile, () => { Snd.click(); openModal({ kind: 'profile' }); });
  const extra = save.streak > 0 && mode === 'endless' ? '   •   ' + t('streak', { n: save.streak, p: streakBonus() }) : '';
  if (save.best > 0 || extra) txtFit(t('best') + '  ' + fmt(save.best) + extra, 270, 852, 500, { size: 18, color: '#ffd84a', stroke: '#2a0d55', sw: 5 });
}
function nextTargets() {
  const out = [];
  let cheapest = null;
  for (const U of UPGRADES) { const l = save.upg[U.key]; if (l < U.max) { const c = U.cost(l); if (!cheapest || c < cheapest.c) cheapest = { U, l, c }; } }
  if (cheapest) out.push(save.gems >= cheapest.c ? t('next.upReady', { name: upName(cheapest.U), l: cheapest.l + 1 })
    : t('next.up', { n: fmt(cheapest.c - save.gems), name: upName(cheapest.U), l: cheapest.l + 1 }));
  Quests.ensure();
  const q = save.quests.items.filter(q => q.prog < q.goal).sort((a, b) => b.prog / b.goal - a.prog / a.goal)[0];
  if (q) out.push(t('next.quest', { q: Quests.text(q), p: q.id === 'score' ? fmt(q.prog) : q.prog, g: q.id === 'score' ? fmt(q.goal) : q.goal }));
  if (out.length < 2 && mode === 'endless' && !newBest && save.best > score) out.push(t('next.best', { n: fmt(save.best - score) }));
  return out.slice(0, 2);
}
function drawOver() {
  const a = clamp(overT / 0.35, 0, 1), e = reducedMotion() ? 1 : easeOutBack(a);
  ctx.fillStyle = `rgba(6,2,18,${0.55 * a})`; fullRect();
  ctx.save(); ctx.globalAlpha = a;
  ctx.translate(270, 450); ctx.scale(0.6 + 0.4 * e, 0.6 + 0.4 * e); ctx.translate(-270, -450);
  rr(46, 200, 448, 500, 36);
  const g = ctx.createLinearGradient(0, 200, 0, 700); g.addColorStop(0, '#3d1c80'); g.addColorStop(1, '#1b0a44');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(190,150,255,0.6)'; ctx.stroke();
  txtFit(mode === 'daily' ? t('dailyMode') + ' • ' + dayKey() : t('collapsed'), 270, 248, 340, { size: 38, color: '#ff6b5c', stroke: '#2a0a1a', sw: 9 });
  txt(t('score'), 270, 292, { size: 16, font: FB, weight: 700, color: 'rgba(255,255,255,0.6)' });
  txtFit(fmt(score), 270, 338, 400, { size: 62, stroke: '#2a0d55', sw: 10 });
  if (newBest) {
    ctx.save(); ctx.translate(270, 388); ctx.rotate(-0.04); const s = 1 + 0.06 * Math.sin(T * 6) * motionK(); ctx.scale(s, s);
    rr(-100, -20, 200, 40, 20); ctx.fillStyle = '#ffcf2e'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#7a4a00'; ctx.stroke();
    txtFit(t('newBest'), 0, 2, 180, { size: 26, color: '#fff', stroke: '#a85a00', sw: 6 });
    ctx.restore();
  } else {
    const b = mode === 'zen' ? save.zenBest : mode === 'daily' ? save.challenge.best : save.best;
    txt(t('best') + '  ' + fmt(b), 270, 388, { size: 22, color: '#ffd84a' });
  }
  txtFit(t('runLine', { w: wave, b: blasts, c: maxCombo }), 270, 426, 420, { size: 15, font: FB, weight: 600, color: 'rgba(255,255,255,0.75)' });
  // gems row (+ rewarded 2x)
  const canDouble = !doubled && runGems > 0 && Ads.ready('double');
  const pillX = canDouble ? 96 : 150;
  rr(pillX, 446, 240, 50, 25); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  gemsAmount(runGems, pillX + 120, 471, 30, 'center');
  ctx.restore();
  if (canDouble && overT > 0.25) {
    uiButton('double', { x: 346, y: 446, w: 104, h: 50 }, t('double'), { size: 20, c1: '#ffd84a', c2: '#d08400',
      sub: t('adLabel') }, () => {
      Ads.showRewarded('double').then(ok => {
        if (!ok || doubled) return;
        doubled = true;
        if (save.adsDay.date !== dayKey()) save.adsDay = { date: dayKey(), doubles: 0 };
        save.adsDay.doubles++;
        grantGems(runGems, 280, 470); runGems *= 2; persist();
      });
    });
  }
  if (overT > 0.25) {
    nextTargets().forEach((s, i) => txtFit(s, 270, 524 + i * 26, 410, { size: 15, font: FB, weight: 600, color: i ? '#c9b8ff' : '#8dff9e' }));
    roundButton('share', 456, 238, 20, ICON.share, () => { Snd.click(); shareCard(); });
    drawButton(PLAY_BTN_OVER, t('playAgain'), '#7cf08a', '#1fa83a', playPress, 34, 1 + 0.03 * Math.sin(T * 5) * motionK());
    if (overT > 0.5) hit(PLAY_BTN_OVER, () => { doubled = false; pressPlay(); }, 'again');
    const aff = anyAffordable();
    ctx.globalAlpha = aff ? 0.7 + 0.3 * Math.sin(T * 6) : 0.75;
    txtFit(aff ? t('upHintYes') : t('upHint'), 270, 742, 500,
      { size: 17, font: FB, weight: 700, color: aff ? '#8dff9e' : '#fff', stroke: 'rgba(20,6,50,0.8)', sw: 5 });
    ctx.globalAlpha = 1;
  }
}
// rewarded revive offer (F-010): countdown ring, watch or decline
function drawRevive() {
  ctx.fillStyle = 'rgba(6,2,18,0.6)'; fullRect();
  rr(70, 330, 400, 300, 32); ctx.fillStyle = '#2a1260'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,120,120,0.7)'; ctx.stroke();
  txtFit(t('reviveTitle'), 270, 378, 360, { size: 34, color: '#ff8a7a', stroke: '#2a0a1a', sw: 7 });
  const k = 1 - clamp(reviveT / 4.5, 0, 1);
  ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.arc(270, 455, 34, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(270, 455, 34, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
  txt(String(Math.ceil(4.5 - reviveT)), 270, 457, { size: 34, color: '#fff' });
  uiButton('revive', { x: 105, y: 510, w: 330, h: 60 }, t('reviveWatch'), { size: 21, sub: t('adLabel') }, () => acceptRevive());
  txt(t('reviveSkip'), 270, 600, { size: 18, font: FB, weight: 700, color: 'rgba(255,255,255,0.7)' });
  hit({ x: 180, y: 584, w: 180, h: 34 }, () => { if (!Ads.busy) gameOver(); }, 'noRevive');
}

