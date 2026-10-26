// ---------------------------------------------------------------- boot
applyTheme(save.theme);
resize();
fillBoardFresh(true);
Quests.ensure(); Season.ensure();
fetchConfig();
if (!save.consent.age) openModal({ kind: 'consent', step: 'age' });
else Ads.loadH5();
Track.ev('app_open', { first: save.stats.runs === 0 ? 1 : 0, dpr: Math.round(dpr * 10) / 10, quality });
// F-009: offline support when served over http(s); file:// can't register a service worker
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (!(dt > 0)) dt = 0; if (dt > 0.05) dt = 0.05;
  perfWatch(dt);
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Hook for automated testing (docs/tools/smoke.py, parity.py). Absent in production builds/URLs, so the
// console can't be used to edit stability or replay seeds.
if (DEBUG) window.__vortex = {
  get state() { return state; }, get stability() { return stability; }, get score() { return score; },
  get quality() { return quality; }, get wave() { return wave; }, get runSeed() { return runSeed; },
  get clusters() { return clusters; }, get save() { return save; }, get modal() { return modal && modal.kind; },
  get hits() { return hits.map(h => h.id); }, get mode() { return mode; }, get ftueStep() { return ftueStep; },
  grid, ringAng, CX, CY, ringMid, slotAng, blockWorld, settle, computeClusters, CFG: () => CFG,
  toScreen: (x, y) => ({ x: x * scale + offX, y: y * scale + offY }),
  setStability: v => { stability = v; }, setWave: v => { wave = v; }, seedRng, rng, fillBoardFresh, startGame, Track, Ads,
  tapHit: id => { const h = hits.find(h => h.id === id); if (h) handleTap(h.x + h.w / 2, h.y + h.h / 2); return !!h; },
};
})();
