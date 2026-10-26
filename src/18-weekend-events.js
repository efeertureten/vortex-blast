// ---------------------------------------------------------------- weekend events (F-041)
// Built-in rotation by week number (Sat/Sun); CFG.events [{from, to, type}] (ISO times) replaces it.
const EVENT_ROTATION = ['gems', 'bomb', 'quest', 'combo'];
let evCache = { k: '', v: '' };
function eventToday() {
  const now = new Date(), k = dayKey(now) + now.getHours();
  if (evCache.k === k) return evCache.v;
  let v = '';
  if (Array.isArray(CFG.events)) {
    const iso = now.toISOString(), e = CFG.events.find(e => e && e.from <= iso && iso < e.to);
    v = e && EVENT_ROTATION.includes(e.type) ? e.type : '';
  } else if (now.getDay() === 0 || now.getDay() === 6) {
    v = EVENT_ROTATION[Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 6048e5) % 4];
  }
  evCache = { k, v };
  return v;
}
const gemEventMult = () => eventToday() === 'gems' ? 2 : 1;

