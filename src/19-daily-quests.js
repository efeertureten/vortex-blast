// ---------------------------------------------------------------- daily quests (F-015)
// 15 templates × 3 tiers. 'add' counts across the day, 'best' is the best single run.
const QUEST_T = [
  ['blasts', 'add', [25, 40, 60]], ['bigs', 'add', [3, 5, 8]], ['combo', 'best', [5, 8, 12]],
  ['bombs', 'add', [2, 4, 6]], ['wave', 'best', [6, 9, 12]], ['score', 'best', [20000, 40000, 80000]],
  ['runs', 'add', [3, 5, 8]], ['cross', 'add', [10, 20, 30]], ['joker', 'add', [1, 2, 3]],
  ['cbomb', 'add', [1, 1, 2]], ['boss', 'add', [1, 1, 2]], ['gems', 'add', [30, 50, 80]],
  ['ring', 'add', [2, 4, 6]], ['unlock', 'add', [5, 10, 15]], ['time', 'best', [90, 120, 180]],
];
const QUEST_REWARD = [{ gems: 15, pts: 10 }, { gems: 25, pts: 20 }, { gems: 40, pts: 30 }];
const Quests = (() => {
  function ensure() {
    const d = dayKey();
    if (save.quests.date === d && save.quests.items.length === 3) return;
    let h = hash32('q:' + d + ':' + save.uid);
    const pool = QUEST_T.map((_, i) => i), items = [];
    for (let tier = 0; tier < 3; tier++) {
      const i = pool.splice(h % pool.length, 1)[0]; h = hash32(String(h));
      const [id, , goals] = QUEST_T[i];
      items.push({ id, goal: goals[tier], prog: 0, tier, claimed: false });
    }
    save.quests = { date: d, items }; markDirty();
  }
  function bump(id, fn) {
    if (ftueStep >= 0 && ftueStep < 5) return;
    ensure();
    for (const q of save.quests.items) {
      if (q.id !== id || q.prog >= q.goal) continue;
      q.prog = Math.min(q.goal, fn(q.prog));
      if (q.prog >= q.goal) {
        banner(t('questDone'), 50, '#9dffb0', 1.0, 250); Snd.quest();
        Track.ev('quest_done', { quest_id: id, goal: q.goal });
      }
      markDirty();
    }
  }
  const add = (id, v) => bump(id, p => p + v);
  const best = (id, v) => { const T0 = QUEST_T.find(q => q[0] === id); if (T0 && T0[1] === 'best') bump(id, p => Math.max(p, v)); };
  const text = q => t('q.' + q.id, { n: q.id === 'score' ? fmt(q.goal) : q.goal });
  const reward = q => ({ gems: QUEST_REWARD[q.tier].gems * (eventToday() === 'quest' ? 2 : 1), pts: QUEST_REWARD[q.tier].pts });
  function claim(q, x, y) {
    if (q.claimed || q.prog < q.goal) return;
    const r = reward(q);
    q.claimed = true; grantGems(r.gems, x, y); Season.addPts(r.pts);
    Snd.buy(); persist();
  }
  const claimable = () => { ensure(); return save.quests.items.some(q => q.prog >= q.goal && !q.claimed); };
  return { ensure, add, best, text, reward, claim, claimable };
})();

