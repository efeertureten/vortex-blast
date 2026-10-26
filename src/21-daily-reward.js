// ---------------------------------------------------------------- daily reward (F-014)
// A 7-day calendar that waits for you: a missed day doesn't reset it. Clock moved backwards = no claim.
const DAILY_REWARDS = [{ gems: 10 }, { bomb: 1 }, { gems: 15 }, { shield: 1 }, { gems: 20 }, { magnet: 1 }, { gems: 40, bomb: 1, shield: 1, magnet: 1 }];
const Daily = {
  canClaim: () => dayKey() > save.daily.lastClaim,
  nextIndex: () => save.daily.day % 7,
  claim(x, y) {
    if (!Daily.canClaim()) return;
    const i = Daily.nextIndex(), r = DAILY_REWARDS[i];
    if (r.gems) grantGems(r.gems, x, y);
    for (const k of ['bomb', 'shield', 'magnet']) if (r[k]) save.inventory[k] = Math.min(99, save.inventory[k] + r[k]);
    save.daily = { lastClaim: dayKey(), day: i + 1 };
    Season.addPts(10);
    if (i === 6) { const a = ACHS.find(a => a[0] === 'week'); unlockAch('week', LANG ? a[2] : a[1], a[4]); }
    Snd.buy(); Track.ev('daily_claim', { day: i + 1 }); persist();
  },
};

