// ---------------------------------------------------------------- tutorial (F-006)
// Step 0 tap a group → 1 cross-ring group → 2 drain/refill → 3 forge a bomb → 4 use it → 5 ramp to normal.
let ftueStep = -1, ftueT = 0, ftueDipped = false;
function ftueSet(n) { ftueStep = n; ftueT = 0; Track.ev('ftue_step', { step: n }); }
function ftueDrainK() {
  if (ftueStep < 0) return 1;
  return [0, 0, 0.4, 0.5, 0.5][ftueStep] ?? Math.min(1, 0.5 + ftueT / 20);
}
function ftueSetupBoard() {
  // make sure the very first tap has an obvious target: three neighbours in the inner ring
  ftueT = 0; ftueDipped = false; Track.ev('ftue_step', { step: 0 });
  const c = grid[0][0] ? grid[0][0].c : 0;
  for (let s = 0; s < 3; s++) { const b = newBlock(c); grid[0][s] = b; }
}
function ftueOnBlast(cells, cross) {
  if (ftueStep === 0) ftueSet(1);
  else if (ftueStep === 1 && (cross || ftueT > 20)) ftueSet(2);
  else if (ftueStep === 2 && ftueDipped) ftueSet(3);
  if (ftueStep === 3 && bombsMade > 0) ftueSet(4);
}
function ftueOnBomb() { if (ftueStep === 4) ftueSet(5); }
function ftueUpdate(dt) {
  if (ftueStep < 0) return;
  ftueT += dt;
  if (ftueStep === 2 && stability < 85) ftueDipped = true;
  if (ftueStep === 3 && ftueT > 25 && !bombOnBoard) {       // no 6+ group came up: hand them a bomb
    const s = (Math.random() * SLOTS) | 0, bomb = newBlock(-1, true); bomb.sc = 0.2; bomb.vs = 6;
    grid[0][s] = bomb; bombsMade++; banner(t('ftue.3g'), 46, '#d6a8ff', 1.3, 260); ftueSet(4);
  }
  if (ftueStep === 5 && ftueT > 10) { ftueStep = -1; save.ftue = 1; Track.ev('ftue_step', { step: 'done' }); persist(); }
}
function ftueSkip() { ftueStep = -1; save.ftue = 1; Track.ev('ftue_step', { step: 'skip' }); persist(); }
// where the tutorial hand points: the target cluster/bomb for the current step
function ftueTarget() {
  if (ftueStep === 4) {
    for (let r = 0; r < RINGS; r++) for (let s = 0; s < SLOTS; s++) if (grid[r][s] && grid[r][s].bomb) return blockWorld(r, s, grid[r][s]);
    return null;
  }
  if (ftueStep > 1) return null;
  let best = null, bestN = 0;
  for (const cl of clusters) {
    if (cl.length < 3) continue;
    const cross = new Set(cl.map(c => c.r)).size > 1;
    const n = cl.length + (ftueStep === 1 && cross ? 100 : 0);
    if (n > bestN) { bestN = n; best = cl; }
  }
  if (!best || (ftueStep === 1 && bestN < 100)) return null;
  const c = best[0];
  return blockWorld(c.r, c.s, grid[c.r][c.s]);
}

