// ---------------------------------------------------------------- analytics (F-001)
// Events go to a local ring buffer (≤ 200, localStorage). They leave the device only with the player's
// analytics consent AND an endpoint in config; without consent no player id is attached at all.
const variantsKey = () => Object.keys(variants).map(k => k + ':' + variants[k]).join(',');
const Track = (() => {
  const QKEY = 'vortexBlast.q', MAX = 200, sid = Math.random().toString(36).slice(2, 10), counts = {};
  let q = [], since = 0;
  try { const x = JSON.parse(localStorage.getItem(QKEY) || '[]'); if (Array.isArray(x)) q = x.slice(-MAX); } catch (e) {}
  const store = () => { try { localStorage.setItem(QKEY, JSON.stringify(q)); } catch (e) {} };
  function ev(e, p) {
    counts[e] = (counts[e] || 0) + 1;
    const rec = Object.assign({ e, ts: Date.now(), sid, v: BUILD, var: variantsKey(), platform: platformName() }, p);
    if (save.consent.analytics) rec.uid = save.uid;
    q.push(rec);
    if (q.length > MAX) q.splice(0, q.length - MAX);
  }
  function flush() {
    store();
    const url = CFG.analytics.endpoint;
    if (!url || !save.consent.analytics || !q.length || !navigator.sendBeacon) return;
    try { if (navigator.sendBeacon(url, JSON.stringify(q))) { q = []; store(); } } catch (e) {}
  }
  function tick(dt) { since += dt; if (since >= CFG.analytics.flushSec) { since = 0; flush(); } }
  return { ev, flush, tick, counts, get queue() { return q; } };
})();
const platformName = () => window.Capacitor ? 'native' : (matchMedia('(display-mode: standalone)').matches ? 'pwa' : 'web');

