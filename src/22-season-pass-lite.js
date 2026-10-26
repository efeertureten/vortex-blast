// ---------------------------------------------------------------- season pass-lite (F-040)
// One season per calendar month, 30 tiers × 70 points (≈ one tier per day of full quests + daily reward).
const SEASON_TIERS = 30, SEASON_PTS = 70;
const seasonId = () => dayKey().slice(0, 7);
const seasonReward = i => i % 5 === 4 ? { [['bomb', 'shield', 'magnet'][((i + 1) / 5 - 1) % 3]]: 1 } : { gems: 10 + 2 * i };
const Season = {
  ensure() { if (save.season.id !== seasonId()) { save.season = { id: seasonId(), pts: 0, claimed: 0 }; markDirty(); } },
  addPts(p) { Season.ensure(); save.season.pts += p; markDirty(); },
  reached() { Season.ensure(); return Math.min(SEASON_TIERS, Math.floor(save.season.pts / SEASON_PTS)); },
  claimable() { return Season.reached() - save.season.claimed; },
  claimAll(x, y) {
    while (save.season.claimed < Season.reached()) {
      const r = seasonReward(save.season.claimed);
      if (r.gems) grantGems(r.gems, x, y);
      for (const k of ['bomb', 'shield', 'magnet']) if (r[k]) save.inventory[k] = Math.min(99, save.inventory[k] + r[k]);
      save.season.claimed++;
    }
    Snd.buy(); persist();
  },
  daysLeft() { const d = new Date(), e = new Date(d.getFullYear(), d.getMonth() + 1, 1); return Math.ceil((e - d) / 864e5); },
};

