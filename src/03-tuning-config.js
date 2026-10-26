// ---------------------------------------------------------------- tuning config (F-036, F-019)
// Every balance number lives here. Defaults = the FINAL set validated in docs/tools/vb_final.py.
// config.json next to index.html (or the cached copy of it) can override any key; `experiments`
// split players by a hash of their id and patch the config per variant.
const CFG_DEFAULT = {
  drain: { base: 7, perWave: 1.15, cap: 24, postCap: 0.6, ramp: 1.5 },
  combo: { window: 1.8, decay: 0.12, min: 0.7 },               // window shrinks as the combo grows
  bombRefill: 20, gemRate: 0.13, gemMultStep: 0.125, waveFromBaseScore: true,
  content: {
    jokerWave: 3, jokerP: 0.02, lockWave: 4, lockP0: 0.05, lockStep: 0.003, lockMax: 0.09,
    cbombN: 9, cbombScore: 40, cbombRefill: 8, cbombRefillN: 0.8, cbombGems: 3,
    bossEvery: 5, bossSecs: 20, bossSpeed: -1.6, bossLockMult: 1.5, bossGems: 20,
  },
  // provider 'auto' = AdMob inside the native app, H5 Games Ads on the web when a client id is set, else none.
  // interstitialEveryRuns 0 = off (ADR-3: rewarded first; run-end interstitials only as experiment E4).
  ads: { provider: 'auto', h5Client: '', admobRewardedId: '', admobInterstitialId: '', revivePerRun: 1,
    doubleGemsPerDay: 5, interstitialEveryRuns: 0 },
  analytics: { endpoint: '', flushSec: 30 },
  events: null,          // null = built-in weekend rotation (see eventToday)
  experiments: {},       // { name: { variants: { A: {patch}, B: {patch} }, weights: { A: 50, B: 50 } } }
};
function deepMerge(a, b) {
  const o = Object.assign({}, a);
  for (const k in b || {}) {
    const v = b[k], cur = a ? a[k] : undefined;
    o[k] = v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur) ? deepMerge(cur, v) : v;
  }
  return o;
}
const CFG_CACHE = 'vortexBlast.cfg';
let cfgRemote = null;
try { const c = JSON.parse(localStorage.getItem(CFG_CACHE) || 'null'); if (c && typeof c === 'object') cfgRemote = c; } catch (e) {}
let CFG = deepMerge(CFG_DEFAULT, cfgRemote);
const variants = {};
function applyExperiments() {   // called once the save (and its player id) is loaded
  CFG = deepMerge(CFG_DEFAULT, cfgRemote);
  for (const name in CFG.experiments || {}) {
    const ex = CFG.experiments[name], keys = Object.keys(ex.variants || {});
    if (!keys.length) continue;
    const w = keys.map(k => Math.max(0, (ex.weights || {})[k] ?? 1)), tot = w.reduce((a, b) => a + b, 0) || 1;
    let x = (hash32(save.uid + ':' + name) % 10000) / 10000 * tot, pick = keys[keys.length - 1];
    for (let i = 0; i < keys.length; i++) { if (x < w[i]) { pick = keys[i]; break; } x -= w[i]; }
    variants[name] = pick;
    CFG = deepMerge(CFG, ex.variants[pick] || {});
  }
}
// Fetch the latest config; it takes effect immediately on the title screen, otherwise at the next launch.
function fetchConfig() {
  if (!/^https?:$/.test(location.protocol) || typeof fetch !== 'function') return;
  const ac = typeof AbortController === 'function' ? new AbortController() : null;
  const to = setTimeout(() => ac && ac.abort(), 1500);
  fetch('config.json', { cache: 'no-store', signal: ac ? ac.signal : undefined })
    .then(r => r.ok ? r.json() : null)
    .then(c => {
      if (!c || typeof c !== 'object') return;
      cfgRemote = c;
      try { localStorage.setItem(CFG_CACHE, JSON.stringify(c)); } catch (e) {}
      if (state === 'title') applyExperiments();
    })
    .catch(() => {})
    .finally(() => clearTimeout(to));
}
const wrapA = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
let NUM_FMT = new Intl.NumberFormat('en-US');     // one formatter per language: toLocaleString() rebuilds it per call
const fmt = n => NUM_FMT.format(Math.floor(n));
const inRect = (x, y, R) => x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h;

