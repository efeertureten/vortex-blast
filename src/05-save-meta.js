// ---------------------------------------------------------------- save / meta
// The key keeps its v1 name so existing players' saves are found; the schema version lives in `v`.
const SAVE_KEY = 'vortexBlast.save.v1', SAVE_VERSION = 2;
const save = {
  v: SAVE_VERSION, uid: '', gems: 0, gemFrac: 0, best: 0, muted: false,
  upg: { magnet: 0, bomb: 0, mult: 0, combo: 0, shield: 0, harmony: 0 },
  settings: { sfx: 0.75, music: 0.5, haptics: true, motion: 'auto', lang: 'auto', patterns: false },
  consent: { age: '', analytics: false, ads: false, ts: '' },      // age '' = not asked yet (F-033)
  stats: { runs: 0, blasts: 0, bombs: 0, cbombs: 0, jokers: 0, bosses: 0, maxCombo: 0, maxWave: 0, playSec: 0 },
  ftue: 0,                                                          // 1 = interactive tutorial finished
  daily: { lastClaim: '', day: 0 }, inventory: { bomb: 0, shield: 0, magnet: 0 }, streak: 0,
  quests: { date: '', items: [] }, season: { id: '', pts: 0, claimed: 0 }, ach: {},
  theme: 'classic', themes: ['classic'], ent: { noads: false },
  challenge: { date: '', best: 0, tries: 0 }, zenBest: 0, adsDay: { date: '', doubles: 0 },
  history: [],                                                      // last 10 runs, newest first
};
const multOf = l => 1 + 0.25 * l;
// names/descriptions come from the string table at draw time (see I18N)
const UPGRADES = [
  { key: 'magnet', max: 5, cost: l => Math.round(40 * Math.pow(1.8, l)),
    eff: l => l ? t('up.magnet.eff', { p: l * 20 }) : t('up.none'), col: ['#ff7a8c', '#c3163f'] },
  { key: 'bomb', max: 2, cost: l => [120, 360][l] || 0, descArg: l => ({ n: 6 - l }),
    eff: l => l < 2 ? t('up.bomb.eff', { n: 5 - l }) : t('up.min'), col: ['#c08bff', '#5a1fb0'] },
  { key: 'mult', max: 10, cost: l => Math.round(50 * Math.pow(1.55, l)),
    eff: l => t('up.mult.eff', { a: multOf(l).toFixed(2), b: (1 + CFG.gemMultStep * l).toFixed(2) }), col: ['#ffe066', '#d08400'] },
  // F-025: new gem sinks (costs mirror docs/tools/vb_model.py NEW_UPGRADES)
  { key: 'combo', max: 4, cost: l => Math.round(80 * Math.pow(1.8, l)),
    eff: l => t('up.combo.eff', { s: (l * 0.1).toFixed(1) }), col: ['#7df9ff', '#1f7fb0'] },
  { key: 'shield', max: 5, cost: l => Math.round(100 * Math.pow(1.7, l)),
    eff: l => t('up.shield.eff', { p: 100 + 5 * l }), col: ['#9dffb0', '#16904a'] },
  { key: 'harmony', max: 4, cost: l => Math.round(120 * Math.pow(1.8, l)),
    eff: l => t('up.harmony.eff', { p: 22 + 3 * l }), col: ['#ffb3f0', '#a8288f'] },
];
// Each step upgrades a parsed save by one version; sections a step doesn't touch take their defaults.
const MIGRATIONS = {
  1: d => Object.assign(d, { v: 2 }),   // v1 → v2: adds settings/stats/daily/inventory/streak/history/gemFrac
};
function migrate(d) {
  let v = Number.isFinite(d.v) ? d.v : 1;
  while (v < SAVE_VERSION && MIGRATIONS[v]) { d = MIGRATIONS[v](d); v = d.v; }
  return d;
}
const intIn = (x, lo, hi, dflt) => Number.isFinite(x) ? clamp(Math.floor(x), lo, hi) : dflt;
function applySave(d) {
  save.gems = intIn(d.gems, 0, 1e9, 0);
  save.gemFrac = Number.isFinite(d.gemFrac) ? clamp(d.gemFrac, 0, 0.999) : 0;
  save.best = intIn(d.best, 0, 1e12, 0);
  if (d.upg) for (const U of UPGRADES) save.upg[U.key] = intIn(d.upg[U.key], 0, U.max, 0);
  save.muted = !!d.muted;
  const S = save.settings, ds = d.settings || {};
  if (Number.isFinite(ds.sfx)) S.sfx = clamp(ds.sfx, 0, 1);
  if (Number.isFinite(ds.music)) S.music = clamp(ds.music, 0, 1);
  if (typeof ds.haptics === 'boolean') S.haptics = ds.haptics;
  if (['full', 'reduced', 'auto'].includes(ds.motion)) S.motion = ds.motion;
  if (['auto', 'en', 'tr'].includes(ds.lang)) S.lang = ds.lang;
  if (typeof ds.patterns === 'boolean') S.patterns = ds.patterns;
  const str = (x, n) => typeof x === 'string' ? x.slice(0, n) : '';
  const dc = d.consent || {};
  save.consent = { age: ['u13', '13to15', '16p'].includes(dc.age) ? dc.age : '', analytics: dc.analytics === true,
    ads: dc.ads === true, ts: str(dc.ts, 24) };
  if (typeof d.uid === 'string' && /^[0-9a-z]{6,24}$/.test(d.uid)) save.uid = d.uid;
  const st = d.stats || {};
  for (const k in save.stats) save.stats[k] = Number.isFinite(st[k]) ? Math.max(0, st[k]) : 0;
  save.ftue = d.ftue === 1 ? 1 : 0;
  const dl = d.daily || {};
  save.daily = { lastClaim: str(dl.lastClaim, 10), day: intIn(dl.day, 0, 7, 0) };
  for (const k in save.inventory) save.inventory[k] = intIn((d.inventory || {})[k], 0, 99, 0);
  save.streak = intIn(d.streak, 0, 9999, 0);
  const dq = d.quests || {};
  save.quests = { date: str(dq.date, 10), items: Array.isArray(dq.items) ? dq.items.filter(q => q && typeof q.id === 'string').slice(0, 3) : [] };
  const sn = d.season || {};
  save.season = { id: str(sn.id, 7), pts: intIn(sn.pts, 0, 1e6, 0), claimed: intIn(sn.claimed, 0, 30, 0) };
  save.ach = d.ach && typeof d.ach === 'object' && !Array.isArray(d.ach) ? Object.fromEntries(Object.keys(d.ach).filter(k => d.ach[k] === true).map(k => [k, true])) : {};
  save.themes = Array.isArray(d.themes) ? d.themes.filter(x => typeof x === 'string').slice(0, 16) : ['classic'];
  if (!save.themes.includes('classic')) save.themes.unshift('classic');
  save.theme = save.themes.includes(d.theme) ? d.theme : 'classic';
  save.ent = { noads: !!(d.ent && d.ent.noads === true) };
  const ch = d.challenge || {};
  save.challenge = { date: str(ch.date, 10), best: intIn(ch.best, 0, 1e12, 0), tries: intIn(ch.tries, 0, 99, 0) };
  save.zenBest = intIn(d.zenBest, 0, 1e12, 0);
  const ad = d.adsDay || {};
  save.adsDay = { date: str(ad.date, 10), doubles: intIn(ad.doubles, 0, 99, 0) };
  save.history = Array.isArray(d.history) ? d.history.filter(h => h && typeof h === 'object').slice(0, 10) : [];
  // keep fields from a newer build untouched, and never write a lower version over them
  for (const k in d) if (!(k in save) && k !== 'sum') save[k] = d[k];
  save.v = Math.max(SAVE_VERSION, Number.isFinite(d.v) ? d.v : 0);
  // F-037: a checksum that doesn't match means the file was edited by hand. Deterrent, not security:
  // the run still loads, it is only flagged (kept out of shared scores and analytics comparisons).
  if (typeof d.sum === 'string') {
    const copy = Object.assign({}, d); delete copy.sum;
    if (saveSum(JSON.stringify(copy)) !== d.sum) save.tampered = true;
  }
}
const saveSum = json => hash32('vb2|' + json).toString(36);
(function load() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return; }   // storage unavailable: play without persistence
  if (!raw) return;
  let d = null;
  try { d = JSON.parse(raw); } catch (e) { /* corrupt: handled below */ }
  if (!d || typeof d !== 'object' || Array.isArray(d)) {
    try { localStorage.setItem(SAVE_KEY + '.bak', raw); } catch (e) {}   // keep the bytes for recovery, start fresh
    return;
  }
  applySave(migrate(d));
})();
if (!save.uid) save.uid = (hash32(String(Math.random()) + Date.now()).toString(36) + Math.random().toString(36).slice(2, 10)).slice(0, 16);
applyExperiments();
let saveDirty = false, saveTimer = 0;
function persist() {
  saveDirty = false;
  try {
    const json = JSON.stringify(Object.assign({}, save, { sum: undefined }));
    localStorage.setItem(SAVE_KEY, json.slice(0, -1) + ',"sum":' + JSON.stringify(saveSum(json)) + '}');
  } catch (e) {}
}
function markDirty() { if (!saveDirty) { saveDirty = true; saveTimer = 1.0; } }
// weekend event "bomb" lowers the threshold by one, never below the upgrade floor of 4
const bombThreshold = () => Math.max(4, 6 - save.upg.bomb - (eventToday() === 'bomb' ? 1 : 0));
const multV = () => multOf(save.upg.mult);
const gemMultV = () => 1 + CFG.gemMultStep * save.upg.mult;   // the Boost multiplies gems at half its score rate
// Magnet+ booster adds 2 levels for 30 s; the tutorial's cross-ring step borrows level 3
const magnetLevel = () => Math.max(save.upg.magnet + (magnetBoostT > 0 ? 2 : 0), ftueStep === 1 ? 3 : 0);
const tolerance = () => 0.19 + 0.024 * magnetLevel();   // radial alignment window (radians)
const anyAffordable = () => UPGRADES.some(U => save.upg[U.key] < U.max && save.gems >= U.cost(save.upg[U.key]));
const shownGems = () => Math.max(0, save.gems - gemsInFlight);   // a purchase mid-flight must not show negative
