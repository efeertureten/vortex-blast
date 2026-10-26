// ---------------------------------------------------------------- update
function update(dt) {
  T += dt;
  drawerT += ((drawerOpen ? 1 : 0) - drawerT) * Math.min(1, dt * 14);
  for (let i = 0; i < UPGRADES.length; i++) { btnPress[i] = Math.max(0, btnPress[i] - dt * 4); cardShake[i] = Math.max(0, cardShake[i] - dt * 3); cardFlash[i] = Math.max(0, cardFlash[i] - dt * 2); }
  gemBounce = Math.max(0, gemBounce - dt * 4); playPress = Math.max(0, playPress - dt * 4);
  modalT = Math.min(1, modalT + dt * 6);
  if (saveDirty) { saveTimer -= dt; if (saveTimer <= 0) persist(); }
  Track.tick(dt); Music.tick();
  if (hitStop > 0) {                       // frozen frame: everything holds still
    hitStop -= dt;
    if (hitStop <= 0) { hitStop = 0; if (pending) resolvePending(); }
    return;
  }
  if (state === 'revive') {
    reviveT += dt;
    if (reviveT > 4.5 && !Ads.busy) gameOver();   // offer times out
    return;
  }
  if (state === 'play' && (drawerOpen || autoPaused || paused || (modal && modal.pausesGame))) return;
  if (state === 'play' && resumeT > 0) { resumeT -= dt; return; }
  // F-038: last-chance slow motion runs the simulation at half speed
  if (slowT > 0) { slowT -= dt; dt *= 0.5; }
  simulate(dt);
}

function simulate(dt) {
  simT += dt;
  applyMagnet(dt);
  for (let r = 0; r < RINGS; r++) ringAng[r] = (ringAng[r] + (ringSpeed(r) + ringMag[r]) * dt) % TAU;

  const steps = dt > 0.018 ? 2 : 1, h = dt / steps;
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SLOTS; s++) {
    const b = grid[r][s]; if (!b) continue;
    for (let k = 0; k < steps; k++) {
      const pdr = b.dr;
      b.vr += (-SPRING_K * b.dr - SPRING_C * b.vr) * h; b.dr += b.vr * h;
      b.va += (-SPRING_K * b.da - SPRING_C * b.va) * h; b.da += b.va * h;
      b.vs += (-260 * (b.sc - 1) - 13 * b.vs) * h; b.sc += b.vs * h;
      if (pdr > 0 && b.dr <= 0 && b.vr < -250) { b.jel = Math.min(1, -b.vr / 1100); b.jelP = 0; }
    }
    b.jelP += dt * 30; b.jel *= Math.exp(-dt * 5);
    b.wob = Math.max(0, b.wob - dt * 2.5);
    b.flash = Math.max(0, b.flash - dt * 5);
    b.glow += ((b.ready ? 1 : 0) - b.glow) * Math.min(1, dt * 12);
  }
  computeClusters();
  updateParticles(dt);
  updateDust(dt);

  shake *= Math.exp(-dt * 9); if (shake < 0.1) shake = 0;
  flashA = Math.max(0, flashA - dt * 2.2);
  corePulse = Math.max(0, corePulse - dt * 2.5);
  boardPunch = Math.max(0, boardPunch - dt * 6);
  comboPop = Math.max(0, comboPop - dt * 3);
  barFlash = Math.max(0, barFlash - dt * 3);
  dispScore += (score - dispScore) * Math.min(1, dt * 10); if (Math.abs(score - dispScore) < 1) dispScore = score;
  dispStab += (stability - dispStab) * Math.min(1, dt * 12);
  if (banners.length) { const b = banners[0]; b.t += dt * (banners.length > 1 ? 1.9 : 1); if (b.t > b.dur) banners.shift(); }

  if (state === 'play') {
    timeAlive += dt;
    graceT = Math.max(0, graceT - dt);
    magnetBoostT = Math.max(0, magnetBoostT - dt);
    stability -= drainRate() * dt;
    if (bossT > 0) { bossT -= dt; if (bossT <= 0) endBoss(); }
    if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
    if ((CFG.waveFromBaseScore ? baseScore : score) >= waveScore(wave)) waveUp();
    ftueUpdate(dt);
    if (stability < 25 && mode !== 'zen') { lowT -= dt; if (lowT <= 0) { Snd.tick(clamp(1 - stability / 25, 0.35, 1)); lowT = 0.32 + stability / 25 * 0.5; } }
    if (stability < 8 && !lastChanceUsed && mode !== 'zen' && ftueStep < 0) {
      lastChanceUsed = true; slowT = 0.8; banner(t('lastChance'), 64, '#ff8a8a', 0.9, 300); Snd.heartbeat();
    }
    if (stability <= 0) die();
  } else if (state === 'dying') {
    dyingT += dt;
    if (dyingT > 1.25) { state = 'over'; overT = 0; stability = 100; fillBoardFresh(true); Ads.maybeInterstitial(); }
  } else if (state === 'over') overT += dt;
}

