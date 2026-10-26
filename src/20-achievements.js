// ---------------------------------------------------------------- achievements (F-016)
let achQueue = [];
function checkAchievements() {
  const x = { best: Math.max(save.best, score), longest: Math.max(timeAlive, ...save.history.map(h => h.sec || 0)), week: false };
  for (const [id, en, tr, test, reward] of ACHS) {
    if (save.ach[id] || !test(save.stats, x)) continue;
    unlockAch(id, LANG ? tr : en, reward);
  }
}
function unlockAch(id, name, reward) {
  if (save.ach[id]) return;
  save.ach[id] = true;
  grantGems(reward, CX, 200);
  achQueue.push({ name, t: 0 });
  Track.ev('achievement', { id });
  markDirty();
}

