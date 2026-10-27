// ---------------------------------------------------------------- modals
function drawModal() {
  if (!modal) return;
  hit({ x: -2000, y: -2000, w: 5000, h: 5000 }, () => { if (modal && !['pause', 'consent', 'ad'].includes(modal.kind)) closeModal(); }, 'swallow');
  ctx.save();
  const M = MODALS[modal.kind];
  if (M) M(modal);
  ctx.restore();
}
const MODALS = {
  pause() {
    panelBox(95, 300, 350, 330, t('pauseTitle'));
    uiButton('resume', { x: 135, y: 370, w: 270, h: 64 }, t('resume'), { size: 28 }, resumeGame);
    uiButton('settings2', { x: 135, y: 452, w: 270, h: 56 }, t('settings'), { size: 24, c1: '#8fb8ff', c2: '#3a5fc4' }, () => openModal({ kind: 'settings', back: 'pause', pausesGame: true }));
    uiButton('quit', { x: 135, y: 526, w: 270, h: 56 }, t('quit'), { size: 22, c1: '#ff8a8a', c2: '#b8233a' }, () => { Snd.click(); quitRun(); });
  },
  settings(m) {
    const S = save.settings, x = 40, w = 460;
    const rows = [];
    rows.push(['t', 'sound', t('sound'), !save.muted, () => toggleMute()]);
    rows.push(['t', 'music', t('music'), S.music > 0, () => { S.music = S.music > 0 ? 0 : 0.5; Music.mood(); persist(); }]);
    rows.push(['t', 'hapt', t('haptics'), S.haptics, () => { S.haptics = !S.haptics; persist(); if (S.haptics) buzz(20); }]);
    rows.push(['s', 'motion', t('motion'), [['auto', t('motion.auto')], ['full', t('motion.full')], ['reduced', t('motion.reduced')]], S.motion, v => { S.motion = v; persist(); }]);
    rows.push(['s', 'lang', t('language'), [['auto', t('lang.auto')], ['en', 'EN'], ['tr', 'TR']], S.lang, v => { S.lang = v; setLang(); persist(); }]);
    rows.push(['t', 'pat', t('patterns'), S.patterns, () => { S.patterns = !S.patterns; buildBlockSprites(); persist(); }]);
    if (save.consent.age === '16p') {
      rows.push(['t', 'an', t('analytics'), save.consent.analytics, () => { save.consent.analytics = !save.consent.analytics; save.consent.ts = new Date().toISOString(); persist(); }]);
      rows.push(['t', 'ads', t('adsPersonal'), save.consent.ads, () => { save.consent.ads = !save.consent.ads; save.consent.ts = new Date().toISOString(); persist(); }]);
    }
    const h = 110 + rows.length * 52 + 102, y = Math.max(70, (H - h) / 2 - 20);
    panelBox(x, y, w, h, t('settings'));
    closeX(x + w - 34, y + 36);
    rows.forEach((r, i) => {
      const ry = y + 76 + i * 52;
      if (i) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 16, ry, w - 32, 1); }
      if (r[0] === 't') toggleRow(r[1], x, ry, w, r[2], r[3], () => { r[4](); Snd.click(); });
      else segRow(r[1], x, ry, w, r[2], r[3], r[4], v => { r[5](v); Snd.click(); });
    });
    const by = y + 86 + rows.length * 52;
    const armed = T - resetArmedT < 3;
    uiButton('reset', { x: x + 90, y: by, w: w - 180, h: 46 }, armed ? t('resetConfirm') : t('reset'), { size: 17, c1: armed ? '#ff5a6a' : '#8a7bb8', c2: armed ? '#a3122c' : '#4b3c7a' }, () => {
      if (!armed) { resetArmedT = T; Snd.deny(); return; }
      try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem('vortexBlast.q'); } catch (e) {}
      location.reload();
    });
    privacyLink(x + w / 2, y + h - 42);
    txt(t('version', { v: BUILD }) + (variantsKey() ? '  •  ' + variantsKey() : ''), x + w / 2, y + h - 14, { size: 12, font: FB, weight: 600, color: 'rgba(255,255,255,0.4)' });
  },
  consent(m) {
    panelBox(50, 250, 440, 430, t('welcome'));
    if (m.step !== 'data') {
      txtFit(t('ageQ'), 270, 330, 380, { size: 24, font: FB, weight: 700, color: '#fff' });
      [['u13', t('ageU13')], ['13to15', t('age1315')], ['16p', t('age16')]].forEach(([v, l], i) => {
        uiButton('age' + v, { x: 110, y: 370 + i * 74, w: 320, h: 58 }, l, { size: 24, c1: '#8fb8ff', c2: '#3a5fc4' }, () => {
          save.consent.age = v; Snd.click();
          if (v === '16p') m.step = 'data';
          else { save.consent.analytics = false; save.consent.ads = false; finishConsent(); }
        });
      });
      txtFit(t('ageWhy'), 270, 610, 400, { size: 14, font: FB, weight: 600, color: 'rgba(255,255,255,0.65)' });
    } else {
      txtFit(t('dataQ'), 270, 330, 400, { size: 22, font: FB, weight: 700, color: '#fff' });
      wrapText(t('dataBody'), 270, 372, 380, 24, { size: 16, font: FB, weight: 600, color: 'rgba(255,255,255,0.8)' });
      uiButton('yes', { x: 110, y: 470, w: 320, h: 60 }, t('yesShare'), { size: 24 }, () => { save.consent.analytics = true; save.consent.ads = true; finishConsent(); });
      uiButton('no', { x: 110, y: 548, w: 320, h: 54 }, t('noThanks'), { size: 21, c1: '#8a7bb8', c2: '#4b3c7a' }, () => { save.consent.analytics = false; save.consent.ads = false; finishConsent(); });
    }
    privacyLink(270, 650);
  },
  daily() {
    panelBox(40, 200, 460, 520, t('dailyTitle'));
    closeX(466, 236);
    const can = Daily.canClaim(), next = Daily.nextIndex();
    DAILY_REWARDS.forEach((r, i) => {
      const big = i === 6, col = big ? 0 : i % 3, row = big ? 2 : Math.floor(i / 3);
      const R = big ? { x: 70, y: 268 + 2 * 112, w: 400, h: 100 } : { x: 70 + col * 136, y: 268 + row * 112, w: 128, h: 100 };
      const done = i < next || (i === next && !can && save.daily.day > 0 && i === (save.daily.day - 1) % 7);
      const today = i === next && can;
      rr(R.x, R.y, R.w, R.h, 18);
      ctx.fillStyle = today ? 'rgba(255,216,74,0.25)' : done ? 'rgba(47,212,87,0.18)' : 'rgba(255,255,255,0.07)'; ctx.fill();
      ctx.lineWidth = today ? 3 : 1.5; ctx.strokeStyle = today ? `rgba(255,216,74,${0.6 + 0.4 * Math.sin(T * 6)})` : 'rgba(255,255,255,0.15)'; ctx.stroke();
      txt(t('day', { n: i + 1 }), R.x + R.w / 2, R.y + 18, { size: 15, font: FB, weight: 700, color: 'rgba(255,255,255,0.8)' });
      let ix = R.x + R.w / 2 - (Object.keys(r).length - 1) * 26;
      for (const k of Object.keys(r)) {
        if (k === 'gems') { gemsAmount(r.gems, ix - 26, R.y + 60, 20); ix += 70; }
        else { boosterIcon(k, ix, R.y + 58, 1.1); txt('x' + r[k], ix + 20, R.y + 74, { size: 15, color: '#fff' }); ix += 52; }
      }
      if (done) txt('✓', R.x + R.w - 18, R.y + 18, { size: 20, color: '#7dffa0' });
    });
    if (can) uiButton('claimDaily', { x: 160, y: 636, w: 220, h: 58 }, t('claim'), { size: 28 }, () => Daily.claim(270, 600));
    else txt(t('tomorrow'), 270, 664, { size: 20, font: FB, weight: 700, color: 'rgba(255,255,255,0.75)' });
  },
  quests() {
    Quests.ensure();
    panelBox(40, 220, 460, 470, t('questsTitle'));
    closeX(466, 256);
    save.quests.items.forEach((q, i) => {
      const y = 290 + i * 116, done = q.prog >= q.goal, r = Quests.reward(q);
      rr(64, y, 412, 104, 18); ctx.fillStyle = q.claimed ? 'rgba(47,212,87,0.12)' : 'rgba(255,255,255,0.07)'; ctx.fill();
      txtFit(Quests.text(q), 84, y + 26, 250, { size: 18, font: FB, weight: 700, color: '#fff', align: 'left' });
      progressBar(84, y + 50, 250, 12, q.prog / q.goal, done ? '#2fd457' : '#ffd84a');
      txt(`${q.id === 'score' ? fmt(q.prog) : q.prog} / ${q.id === 'score' ? fmt(q.goal) : q.goal}`, 84, y + 80, { size: 14, font: FB, weight: 600, color: 'rgba(255,255,255,0.7)', align: 'left' });
      gemsAmount(r.gems, 200, y + 80, 16);
      txt(t('pts', { p: r.pts }), 290, y + 80, { size: 14, font: FB, weight: 700, color: '#ffd84a', align: 'left' });
      if (q.claimed) txt(t('done'), 410, y + 52, { size: 22, color: '#7dffa0' });
      else uiButton('qc' + i, { x: 350, y: y + 24, w: 110, h: 54 }, t('claim'), { size: 22, disabled: !done }, () => Quests.claim(q, 405, y + 50));
    });
    txt(t('newQuests') + (eventToday() === 'quest' ? '  •  ' + t('ev.quest') : ''), 270, 662, { size: 14, font: FB, weight: 600, color: 'rgba(255,255,255,0.6)' });
  },
  season() {
    Season.ensure();
    panelBox(30, 120, 480, 700, t('season') + ' ' + seasonId());
    closeX(476, 156);
    const reached = Season.reached(), pts = save.season.pts;
    txt(t('endsIn', { d: Season.daysLeft() }) + '  •  ' + t('pts', { p: pts }), 270, 196, { size: 16, font: FB, weight: 700, color: 'rgba(255,255,255,0.8)' });
    const inTier = reached >= SEASON_TIERS ? 1 : (pts % SEASON_PTS) / SEASON_PTS;
    progressBar(70, 214, 400, 14, inTier);
    txt(t('tier', { n: Math.min(SEASON_TIERS, reached + 1) }), 270, 244, { size: 15, font: FB, weight: 700, color: '#ffd84a' });
    for (let i = 0; i < SEASON_TIERS; i++) {
      const c = i % 6, r = Math.floor(i / 6), R = { x: 58 + c * 72, y: 266 + r * 82, w: 66, h: 74 };
      const got = i < save.season.claimed, open = i < reached && !got;
      rr(R.x, R.y, R.w, R.h, 12);
      ctx.fillStyle = got ? 'rgba(47,212,87,0.2)' : open ? 'rgba(255,216,74,0.3)' : 'rgba(255,255,255,0.06)'; ctx.fill();
      if (open) { ctx.lineWidth = 2; ctx.strokeStyle = '#ffd84a'; ctx.stroke(); }
      txt(String(i + 1), R.x + 12, R.y + 12, { size: 12, font: FB, weight: 700, color: 'rgba(255,255,255,0.6)' });
      const rw = seasonReward(i);
      if (rw.gems) gemsAmount(rw.gems, R.x + R.w / 2, R.y + 44, 16, 'center');
      else boosterIcon(Object.keys(rw)[0], R.x + R.w / 2, R.y + 42, 1.1);
      if (got) txt('✓', R.x + R.w - 12, R.y + 12, { size: 15, color: '#7dffa0' });
      if (i >= reached) { rr(R.x, R.y, R.w, R.h, 12); ctx.fillStyle = 'rgba(10,4,32,0.35)'; ctx.fill(); }
    }
    rr(58, 682, 424, 40, 12); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();
    txtFit(t('premiumNote'), 270, 703, 400, { size: 13, font: FB, weight: 600, color: 'rgba(255,255,255,0.55)' });
    if (Season.claimable() > 0) uiButton('sclaim', { x: 160, y: 738, w: 220, h: 56 }, t('claim') + ' (' + Season.claimable() + ')', { size: 24 }, () => Season.claimAll(270, 700));
    else txtFit(t('seasonHow'), 270, 764, 420, { size: 15, font: FB, weight: 600, color: 'rgba(255,255,255,0.7)' });
  },
  profile() {
    panelBox(30, 80, 480, 800, t('profile'));
    closeX(476, 116);
    const st = save.stats;
    const cells = [[t('runs'), fmt(st.runs)], [t('blastsL'), fmt(st.blasts)], [t('bombsL'), fmt(st.bombs)],
      [t('bestCombo'), 'x' + st.maxCombo], [t('bestWave'), fmt(st.maxWave)], [t('playTime'), Math.floor(st.playSec / 60) + (LANG ? ' dk' : ' min')]];
    cells.forEach(([k, v], i) => {
      const x = 62 + (i % 3) * 142, y = 150 + Math.floor(i / 3) * 66;
      rr(x, y, 132, 58, 14); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
      txtFit(v, x + 66, y + 24, 120, { size: 22, color: '#fff' });
      txtFit(k, x + 66, y + 46, 120, { size: 12, font: FB, weight: 700, color: 'rgba(255,255,255,0.6)' });
    });
    txt(t('recent'), 62, 300, { size: 18, color: '#ffd84a', align: 'left' });
    if (!save.history.length) txt(t('noRuns'), 270, 340, { size: 15, font: FB, weight: 600, color: 'rgba(255,255,255,0.6)' });
    save.history.slice(0, 5).forEach((h, i) => {
      const y = 326 + i * 30;
      txt((h.at || '').replace('T', ' '), 62, y, { size: 13, font: FB, weight: 600, color: 'rgba(255,255,255,0.55)', align: 'left' });
      txt(t(h.mode === 'zen' ? 'zen' : h.mode === 'daily' ? 'dailyMode' : 'endless'), 220, y, { size: 12, font: FB, weight: 700, color: '#c9b8ff', align: 'left' });
      txt(fmt(h.score || 0), 400, y, { size: 16, color: '#fff', align: 'right' });
      txt(t('wave', { n: h.wave || 1 }), 478, y, { size: 12, font: FB, weight: 700, color: '#ffd84a', align: 'right' });
    });
    const nAch = Object.keys(save.ach).length;
    txt(t('achievements') + `  ${nAch}/${ACHS.length}`, 62, 492, { size: 18, color: '#ffd84a', align: 'left' });
    ACHS.forEach(([id, en, tr], i) => {
      const x = 62 + (i % 4) * 106, y = 512 + Math.floor(i / 4) * 52, got = save.ach[id];
      rr(x, y, 100, 44, 10); ctx.fillStyle = got ? 'rgba(255,216,74,0.22)' : 'rgba(255,255,255,0.05)'; ctx.fill();
      starPath(x + 16, y + 22, 9, 0); ctx.fillStyle = got ? '#ffd84a' : 'rgba(255,255,255,0.2)'; ctx.fill();
      txtFit(LANG ? tr : en, x + 60, y + 22, 72, { size: 12, font: FB, weight: 700, color: got ? '#fff' : 'rgba(255,255,255,0.45)' });
    });
    uiButton('themesBtn', { x: 150, y: 790, w: 240, h: 54 }, t('themes'), { size: 24, c1: '#ff9ce6', c2: '#b0309a' }, () => openModal({ kind: 'themes' }));
  },
  themes() {
    panelBox(30, 120, 480, 700, t('themes'));
    closeX(476, 156);
    Object.keys(THEMES).forEach((id, i) => {
      const th = THEMES[id], x = 56 + (i % 2) * 218, y = 190 + Math.floor(i / 2) * 200;
      const owned = save.themes.includes(id), used = save.theme === id;
      rr(x, y, 206, 186, 20);
      const g = ctx.createLinearGradient(0, y, 0, y + 186); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[3]);
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = used ? 4 : 1.5; ctx.strokeStyle = used ? '#ffd84a' : 'rgba(255,255,255,0.2)'; ctx.stroke();
      th.colors.forEach((c, k) => { ctx.beginPath(); ctx.arc(x + 46 + k * 38, y + 62, 15, 0, TAU); ctx.fillStyle = c.base; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = c.deep; ctx.stroke(); });
      txt(t('th.' + id), x + 103, y + 26, { size: 22, color: '#fff', stroke: '#1d0840', sw: 4 });
      const R = { x: x + 28, y: y + 112, w: 150, h: 52 };
      if (used) txt(t('inUse'), x + 103, y + 138, { size: 20, color: '#ffd84a' });
      else if (owned) uiButton('th' + id, R, t('use'), { size: 22, c1: '#8fb8ff', c2: '#3a5fc4' }, () => { save.theme = id; applyTheme(id); persist(); Snd.click(); });
      else uiButton('th' + id, R, fmt(th.cost), { size: 22, disabled: save.gems < th.cost, icon: (x0, y0) => drawGem(x0, y0, 10) }, () => { if (buyTheme(id)) { save.theme = id; applyTheme(id); persist(); } });
    });
  },
  boost() {
    panelBox(60, 260, 420, 440, t('boostTitle'));
    closeX(446, 296);
    ['bomb', 'shield', 'magnet'].forEach((k, i) => {
      const y = 330 + i * 92, n = save.inventory[k], on = boostPick[k] && n > 0;
      rr(90, y, 360, 80, 18); ctx.fillStyle = on ? 'rgba(47,212,87,0.25)' : 'rgba(255,255,255,0.07)'; ctx.fill();
      if (on) { ctx.lineWidth = 3; ctx.strokeStyle = '#7dffa0'; ctx.stroke(); }
      boosterIcon(k, 130, y + 40, 1.5);
      txtFit(t('boost.' + k), 170, y + 32, 190, { size: 20, font: FB, weight: 700, color: n ? '#fff' : 'rgba(255,255,255,0.4)', align: 'left' });
      txt(t('have', { n }), 170, y + 58, { size: 15, font: FB, weight: 700, color: '#9ff8ff', align: 'left' });
      txt(on ? '✓' : '', 420, y + 40, { size: 30, color: '#7dffa0' });
      if (n > 0) hit({ x: 90, y, w: 360, h: 80 }, () => { boostPick[k] = !boostPick[k]; Snd.click(); }, 'bp' + k);
    });
    uiButton('boostGo', { x: 150, y: 612, w: 240, h: 64 }, t('start'), { size: 32 }, () => { const b = Object.assign({}, boostPick); modal = null; startGame({ boosters: b }); });
  },
  ad(m) {
    // mock rewarded ad (debug / ?ads=mock): 2.5 s, then the reward is granted
    ctx.fillStyle = 'rgba(0,0,0,0.92)'; fullRect();
    const k = clamp((T - m.t0) / 2.5, 0, 1);
    txt(t('testAd'), 270, 420, { size: 40, color: '#fff' });
    progressBar(120, 470, 300, 12, k, '#7dffa0');
    if (k >= 1 && !m.done) { m.done = true; modal = null; m.resolve(true); return; }
    if (T - m.t0 > 1) { txt(t('close'), 270, 540, { size: 18, font: FB, weight: 700, color: 'rgba(255,255,255,0.6)' }); hit({ x: 190, y: 522, w: 160, h: 36 }, () => { m.done = true; modal = null; m.resolve(false); }, 'adClose'); }
  },
};
function wrapText(s, x, y, maxW, lh, o) {
  ctx.font = (o.weight ? o.weight + ' ' : '') + o.size + 'px ' + (o.font || FD);
  const words = s.split(' '); let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { txt(line, x, yy, o); line = w; yy += lh; } else line = test;
  }
  if (line) txt(line, x, yy, o);
}
function finishConsent() {
  save.consent.ts = new Date().toISOString(); modal = null; Snd.click(); persist();
  Ads.loadH5();
  Track.ev('consent', { age: save.consent.age, analytics: save.consent.analytics ? 1 : 0 });
}

