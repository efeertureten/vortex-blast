// ---------------------------------------------------------------- core actions
const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const streakBonus = () => Math.min(save.streak, 3) * 5;   // F-027: +5/+10/+15 % start stability
// opts.boosters = { bomb, shield, magnet } chosen on the booster sheet (F-023)
function startGame(opts = {}) {
  state = 'play'; autoPaused = false; paused = false; resumeT = 0;
  score = 0; baseScore = 0; dispScore = 0; wave = 1;
  stability = 100 + 5 * save.upg.shield + streakBonus(); dispStab = stability;
  combo = 0; comboT = 0; comboWin = 1; maxCombo = 0; runGems = 0; blasts = 0; bombsMade = 0; timeAlive = 0;
  bossT = 0; bossRing = -1; slowT = 0; lastChanceUsed = false; revivesUsed = 0; graceT = 0; magnetBoostT = 0; shieldArmed = false;
  for (const k in run) run[k] = 0;
  newBest = false; lowT = 0; hitStop = 0; pending = null; doubled = false;
  banners.length = 0; drawerOpen = false; modal = null;
  officialDaily = false;
  if (mode === 'daily') {
    // everyone gets the same board today: seed from the date, reset the rotation clock
    officialDaily = save.challenge.date !== dayKey() || save.challenge.tries === 0;
    runSeed = hash32('daily:' + dayKey()); seedRng(runSeed);
    simT = 0; ringAng.splice(0, RINGS, 0, 0.26, 0.1, 0.4);
    fillBoardFresh(true);
    if (officialDaily) { save.challenge = { date: dayKey(), best: save.challenge.date === dayKey() ? save.challenge.best : 0, tries: 1 }; markDirty(); }
  } else {
    // Seeds every colour spawned from here on (the board on screen is kept). ?seed=N replays one in debug.
    const fixed = DEBUG && qparam('seed');
    runSeed = fixed ? Number(fixed) >>> 0 : (Math.random() * 4294967296) >>> 0;
    seedRng(runSeed);
  }
  const B = opts.boosters || {};
  const use = k => { if (B[k] && save.inventory[k] > 0) { save.inventory[k]--; markDirty(); return true; } return false; };
  if (use('bomb')) { const s = (rng() * SLOTS) | 0, bomb = newBlock(-1, true); bomb.sc = 0.2; bomb.vs = 6; grid[1][s] = bomb; }
  if (use('shield')) shieldArmed = true;
  if (use('magnet')) magnetBoostT = 30;
  ftueStep = save.ftue ? -1 : 0;
  if (ftueStep === 0) ftueSetupBoard();
  banner(t('go'), 92, '#7dffa0', 0.9, 330);
  Snd.start(); Music.mood();
  Track.ev('run_start', { mode, run_idx: save.stats.runs, upg: Object.values(save.upg).join(''), boost: Object.keys(B).filter(k => B[k]).join(',') });
}

function tapBoard(x, y) {
  if (hitStop > 0 || pending) return;
  const dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  let r = -1, bd = 1e9;
  for (let i = 0; i < RINGS; i++) { const dd = Math.abs(d - ringMid(i)); if (dd < bd) { bd = dd; r = i; } }
  if (bd > RING_T / 2 + 12) return;
  const s = closest(r, a), b = grid[r][s];
  if (!b || !isSettled(b)) return;
  if (b.bomb) {
    for (let k = 0; k < SLOTS; k++) if (grid[r][k]) grid[r][k].flash = 0.7;
    b.flash = 1; pending = { type: 'bomb', r, s }; hitStop = 0.05; boardPunch = 1.6;
    return;
  }
  if (b.cb) {
    for (let rr = 0; rr < RINGS; rr++) for (let ss = 0; ss < SLOTS; ss++) { const o = grid[rr][ss]; if (o && !isSpecial(o) && o.c === b.c) o.flash = 0.8; }
    b.flash = 1; pending = { type: 'cbomb', r, s }; hitStop = 0.05; boardPunch = 1.4;
    return;
  }
  const cl = b.cl >= 0 ? clusters[b.cl] : null;
  if (b.ready && cl && cl.length >= 3) {
    for (const c of cl) grid[c.r][c.s].flash = 1;
    pending = { type: 'cluster', cells: cl.slice(), tap: { r, s } };
    hitStop = 0.030;                  // 30 ms hit-stop before the pop
    boardPunch = 1;
  } else { b.wob = 1; Snd.nope(); }
}
function resolvePending() {
  const p = pending; pending = null;
  if (p.type === 'cluster') doBlast(p.cells, p.tap);
  else if (p.type === 'bomb') doBomb(p.r);
  else doCBomb(p.r, p.s);
}
function bumpCombo() {
  combo = comboT > 0 ? combo + 1 : 1;
  comboT = comboWin = comboWindow(combo);
  maxCombo = Math.max(maxCombo, combo); if (combo >= 2) comboPop = 1;
  Quests.best('combo', combo);
}
// Free locked blocks next to anything that blasts (same ring sides + radial neighbours).
function unlockAround(cells) {
  const tol = tolerance();
  for (const c of cells) for (const [nr, ns] of neighbours(c.r, c.s, tol)) {
    const nb = grid[nr][ns];
    if (nb && nb.locked) {
      nb.locked = false; nb.flash = 0.8; nb.vs = 4; run.unlocks++;
      const w = blockWorld(nr, ns, nb);
      addPart({ k: 'ring', x: w.x, y: w.y, r: 6, gr: 160, w: 4, col: '255,255,255', life: 0.3, t: 0 });
      Quests.add('unlock', 1);
    }
  }
}
function doBlast(cells, tap) {
  const n = cells.length, m = multV();
  bumpCombo();
  const cm = comboMulOf(combo);
  const pts = Math.round(n * n * 10 * cm * m);
  score += pts; baseScore += n * n * 10 * cm; blasts++;
  addStab(3 + n * 2.4 + Math.min(combo - 1, 4) * 0.5); barFlash = 1;
  let col = -1, jokers = 0;
  const rings = new Set();
  for (const c of cells) { const b = grid[c.r][c.s]; if (b && !b.joker && col < 0) col = b.c; rings.add(c.r); }
  if (col < 0) col = 0;
  unlockAround(cells);
  for (const c of cells) {
    const b = grid[c.r][c.s]; if (!b) continue;
    if (b.joker) jokers++;
    const w = blockWorld(c.r, c.s, b);
    burst(w.x, w.y, b.joker ? (Math.random() * 4) | 0 : b.c, 1 + Math.min(n, 12) * 0.03);
    orb(w.x, w.y, COLORS[b.joker ? col : b.c].rgb);
    grid[c.r][c.s] = null;
  }
  const tp = blockWorld(tap.r, tap.s, null);
  // shockwaves
  addPart({ k: 'ring', x: tp.x, y: tp.y, r: 12, gr: 460, w: 11, col: '255,255,255', life: 0.38, t: 0 });
  addPart({ k: 'ring', x: tp.x, y: tp.y, r: 4, gr: 330, w: 6, col: COLORS[col].rgb, life: 0.48, t: -0.05 });
  if (n >= 6) addPart({ k: 'ring', x: CX, y: CY, r: 50, gr: 520, w: 8, col: COLORS[col].rgb, life: 0.6, t: -0.03 });
  floatText(tp.x, tp.y - 10, '+' + fmt(pts), 26 + Math.min(n, 10) * 2, '#fff');
  addGems(Math.round(Math.max(1, (n - 2) * 0.6) * gemMultV()), tp.x, tp.y);
  if (n >= CFG.content.cbombN && ftueStep < 0) {
    const cb = newBlock(col); cb.cb = true; cb.sc = 0.2; cb.vs = 6;
    grid[tap.r][tap.s] = cb;
    banner(t('cbomb'), 54, '#ffe9a8', 1.3, 300);
    Snd.bombMade();
  } else if (n >= bombThreshold()) {
    const bomb = newBlock(-1, true); bomb.sc = 0.2; bomb.vs = 6;
    grid[tap.r][tap.s] = bomb; bombsMade++;
    banner(t('vbomb'), 54, '#d6a8ff', 1.3, 300);
    Snd.bombMade();
    Track.ev('bomb_made', { wave, n });
    Quests.add('bombs', 1);
  } else if (n >= 10) banner(t('incredible'), 60, '#ffe14d');
  else if (n >= 8) banner(t('awesome'), 60, '#7df9ff');
  else if (n >= 5) banner(t(n >= 6 ? 'great' : 'nice'), 52, '#9dff8a', 1.0);
  shake = Math.max(shake, Math.min(15, 3 + n * 1.1));
  buzz(Math.min(40, 8 + n * 3));
  Snd.blast(n, combo);
  if (jokers) { run.jokers += jokers; save.stats.jokers += jokers; Quests.add('joker', jokers); }
  if (n >= 6) { run.bigs++; Quests.add('bigs', 1); }
  if (rings.size > 1) { run.cross++; Quests.add('cross', 1); }
  Quests.add('blasts', 1);
  if (blasts % 5 === 1) Track.ev('blast', { n, combo, wave, cross: rings.size > 1 ? 1 : 0 });   // sampled 1 in 5
  ftueOnBlast(cells, rings.size > 1, n);
  settle();
}
function doBomb(r) {
  const m = multV(); let n = 0;
  const cells = [];
  for (let k = 0; k < SLOTS; k++) {
    const b = grid[r][k]; if (!b) continue; n++; cells.push({ r, s: k });
    const w = blockWorld(r, k, b);
    if (b.bomb) { for (let j = 0; j < 4; j++) burst(w.x, w.y, j, 1.2); orb(w.x, w.y, '200,140,255'); }
    else { burst(w.x, w.y, b.joker ? 0 : (b.cb ? b.c : b.c), 1.35); orb(w.x, w.y, COLORS[b.c >= 0 ? b.c : 0].rgb); }
  }
  unlockAround(cells);
  for (const c of cells) grid[c.r][c.s] = null;
  bumpCombo(); blasts++;
  const cm = comboMulOf(combo);
  const pts = Math.round(n * 55 * m * cm);
  score += pts; baseScore += n * 55 * cm;
  addStab(CFG.bombRefill); barFlash = 1;
  const rm = ringMid(r);
  addPart({ k: 'ring', x: CX, y: CY, r: rm, gr: 560, w: 28, col: '255,255,255', life: 0.55, t: 0 });
  addPart({ k: 'ring', x: CX, y: CY, r: rm, gr: -280, w: 18, col: '200,130,255', life: 0.4, t: 0 });
  addPart({ k: 'ring', x: CX, y: CY, r: rm, gr: 340, w: 12, col: '255,220,90', life: 0.7, t: -0.08 });
  floatText(CX, CY - rm - 20, '+' + fmt(pts), 40, '#ffe680');
  addGems(Math.round(4 * gemMultV()), CX, CY - rm);
  banner(t('ringClear'), 64, '#e4c2ff', 1.3, 300);
  shake = 24; flashA = 0.55; flashCol = '225,190,255';
  buzz([35, 40, 70]);
  Snd.bomb();
  run.rings++; Quests.add('ring', 1);
  Track.ev('bomb_used', { wave, n });
  ftueOnBomb();
  settle();
}
// Colour Bomb (F-022): every block of its colour (locked ones too) plus itself.
function doCBomb(r, s) {
  const C = CFG.content, m = multV(), col = grid[r][s].c, cells = [];
  for (let rr = 0; rr < RINGS; rr++) for (let ss = 0; ss < SLOTS; ss++) {
    const b = grid[rr][ss];
    if (b && ((!isSpecial(b) && !b.joker && b.c === col) || (rr === r && ss === s))) cells.push({ r: rr, s: ss });
  }
  const n = cells.length;
  unlockAround(cells);
  for (const c of cells) {
    const b = grid[c.r][c.s], w = blockWorld(c.r, c.s, b);
    burst(w.x, w.y, col, 1.25); orb(w.x, w.y, COLORS[col].rgb);
    addPart({ k: 'ring', x: w.x, y: w.y, r: 4, gr: 200, w: 5, col: COLORS[col].rgb, life: 0.35, t: -Math.random() * 0.15 });
    grid[c.r][c.s] = null;
  }
  bumpCombo(); blasts++;
  const cm = comboMulOf(combo);
  const pts = Math.round(n * C.cbombScore * m * cm);
  score += pts; baseScore += n * C.cbombScore * cm;
  addStab(C.cbombRefill + C.cbombRefillN * n); barFlash = 1;
  addPart({ k: 'ring', x: CX, y: CY, r: 40, gr: 640, w: 20, col: COLORS[col].rgb, life: 0.6, t: 0 });
  floatText(CX, CY - 40, '+' + fmt(pts), 40, COLORS[col].light);
  addGems(Math.round(C.cbombGems * gemMultV()), CX, CY);
  banner(t('colourClear'), 60, COLORS[col].light, 1.2, 300);
  shake = 20; flashA = 0.45; flashCol = COLORS[col].rgb;
  buzz([30, 30, 60]);
  Snd.bomb();
  run.cbombs++; save.stats.cbombs++; Quests.add('cbomb', 1);
  settle();
}
function waveUp() {
  wave++;
  addStab(15); barFlash = 1;
  banner(t('wave', { n: wave }), 76, '#ffd84a', 1.6, 300);
  addGems(2 + Math.floor(wave / 2), CX, CY);
  addPart({ k: 'ring', x: CX, y: CY, r: 40, gr: 700, w: 14, col: '255,216,74', life: 0.8, t: 0 });
  Snd.wave();
  Quests.best('wave', wave);
  Track.ev('wave_up', { wave, t_in_wave: Math.round(timeAlive), stab: Math.round(stability) });
  // F-028: every 5th wave one ring reverses and speeds up for 20 s, and locks rain harder
  const C = CFG.content;
  if (mode !== 'zen' && ftueStep < 0 && wave % C.bossEvery === 0) {
    bossT = C.bossSecs; bossRing = (wave / C.bossEvery) % RINGS;
    banner(t('boss'), 70, '#ff7a7a', 1.6, 300);
    flashA = 0.4; flashCol = '255,80,80'; Snd.boss();
  }
}
function endBoss() {
  bossT = 0; bossRing = -1;
  run.bosses++; save.stats.bosses++;
  addGems(CFG.content.bossGems, CX, CY - 60);
  banner(t('bossClear'), 62, '#9dff8a', 1.3, 300);
  Quests.add('boss', 1); Snd.wave();
}

// Stability hit zero: Shield booster first, then one rewarded revive offer, then the collapse.
function die() {
  stability = 0;
  if (shieldArmed) {
    shieldArmed = false; stability = 30; graceT = 1.5; barFlash = 1; flashA = 0.5; flashCol = '120,255,160';
    banner(t('shieldSaved'), 70, '#9dffb0', 1.1, 300); Snd.wave();
    return;
  }
  if (revivesUsed < CFG.ads.revivePerRun && Ads.ready('revive') && mode !== 'daily') {
    state = 'revive'; reviveT = 0; hitStop = 0; pending = null;
    Track.ev('ad_offer', { placement: 'revive' });
    return;
  }
  gameOver();
}
function acceptRevive() {
  Ads.showRewarded('revive').then(ok => {
    if (state !== 'revive') return;
    if (!ok) { gameOver(); return; }
    revivesUsed++; state = 'play'; stability = 50; graceT = 1.5; barFlash = 1;
    banner(t('revived'), 70, '#9dffb0', 1.0, 300); Snd.start();
  });
}
function gameOver() {
  state = 'dying'; dyingT = 0; hitStop = 0; pending = null; banners.length = 0; combo = 0; comboT = 0; bossT = 0; slowT = 0;
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SLOTS; s++) {
    const b = grid[r][s]; if (!b) continue;
    const w = blockWorld(r, s, b), a = Math.atan2(w.y - CY, w.x - CX), sp = rand(250, 700);
    addPart({ k: 'shard', x: w.x, y: w.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 100, rot: a, vr: rand(-8, 8),
      w: rand(26, 40), h: rand(20, 30), col: b.bomb ? '#8a3cff' : COLORS[b.c >= 0 ? b.c : 0].base, life: rand(0.9, 1.3), t: -r * 0.04, drag: 1.2, g: 700 }, true);
    grid[r][s] = null;
  }
  addPart({ k: 'ring', x: CX, y: CY, r: 30, gr: 900, w: 30, col: '255,90,70', life: 0.8, t: 0 });
  shake = 30; flashA = 0.85; flashCol = '255,120,90';
  endRun();
  buzz([60, 50, 140]);
  Snd.over(); Music.mood();
}
// Bookkeeping shared by a collapse and a quit: bests, stats, history, streak, quests, achievements.
function endRun(quit = false) {
  const best0 = mode === 'zen' ? save.zenBest : save.best;
  newBest = !quit && mode !== 'daily' && score > best0;
  if (mode === 'zen') { if (score > save.zenBest) save.zenBest = score; }
  else if (mode === 'endless' && score > save.best) save.best = score;
  if (mode === 'daily' && officialDaily) save.challenge.best = Math.max(save.challenge.best, score);
  const st = save.stats;
  st.runs++; st.blasts += blasts; st.bombs += bombsMade; st.maxCombo = Math.max(st.maxCombo, maxCombo);
  st.maxWave = Math.max(st.maxWave, wave); st.playSec = Math.round(st.playSec + timeAlive);
  if (mode === 'endless' && !quit) save.streak = wave >= 5 ? save.streak + 1 : 0;
  save.history.unshift({ at: new Date().toISOString().slice(0, 16), mode, score, wave, sec: Math.round(timeAlive), gems: runGems, seed: runSeed });
  save.history.length = Math.min(save.history.length, 10);
  Quests.add('runs', 1); Quests.add('gems', runGems); Quests.best('score', score); Quests.best('time', Math.round(timeAlive));
  checkAchievements();
  Track.ev('run_end', { mode, score, wave, dur: Math.round(timeAlive), blasts, max_combo: maxCombo, gems: runGems,
    revived: revivesUsed, quit: quit ? 1 : 0, tampered: save.tampered ? 1 : 0 });
  if (ftueStep >= 0) { save.ftue = 1; ftueStep = -1; }
  persist();
}
function quitRun() {
  endRun(true);
  state = 'title'; paused = false; modal = null; stability = 100; dispStab = 100; bossT = 0;
  fillBoardFresh(true); Music.mood();
}

