// ---------------------------------------------------------------- input
function toggleDrawer(open) {
  drawerOpen = open; Snd.click();
  if (open) { drawerScroll = 0; Track.ev('drawer_open', { state }); }
}
const toLogical = e => ({ x: (e.clientX - offX) / scale, y: (e.clientY - offY) / scale });
function handleTap(x, y) {
  Snd.init();
  // modal or screen buttons first (topmost registered last)
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (inRect(x, y, h)) {
      pressId = h.id; pressT = T;
      const m0 = modal;
      h.fn(x, y);
      // targets were registered for the screen as it was drawn; once a modal opens or closes they are
      // stale until the next frame, so a second tap in the same frame must not reach them
      if (modal !== m0) hits = [];
      return;
    }
  }
  if (modal) return;
  const py = panelY();
  if (y >= py && x >= 10 && x <= 530 && state !== 'dying' && state !== 'revive') { toggleDrawer(true); return; }
  if (autoPaused) { autoPaused = false; resumeT = 0.5; Snd.click(); return; }
  if (state === 'play') tapBoard(x, y);
}
cvs.addEventListener('pointerdown', e => {
  e.preventDefault();
  const p = toLogical(e);
  if (drawerOpen && !modal) {
    const py = panelY();
    if (p.y < py + HANDLE_H) { toggleDrawer(false); return; }
    drawerDrag = { y0: p.y, s0: drawerScroll, moved: false, id: e.pointerId };
    return;
  }
  handleTap(p.x, p.y);
}, { passive: false });
cvs.addEventListener('pointermove', e => {
  if (!drawerDrag || e.pointerId !== drawerDrag.id) return;
  const p = toLogical(e), dy = p.y - drawerDrag.y0;
  if (Math.abs(dy) > 8) drawerDrag.moved = true;
  if (drawerDrag.moved) drawerScroll = clamp(drawerDrag.s0 - dy, 0, drawerMaxScroll());
});
const endDrag = e => {
  if (!drawerDrag || e.pointerId !== drawerDrag.id) return;
  const p = toLogical(e), moved = drawerDrag.moved; drawerDrag = null;
  if (moved || !drawerOpen) return;
  const py = panelY();
  for (let i = 0; i < UPGRADES.length; i++) if (inRect(p.x, p.y, buyRect(py, i))) { buy(i); return; }
};
cvs.addEventListener('pointerup', endDrag);
cvs.addEventListener('pointercancel', e => { if (drawerDrag && e.pointerId === drawerDrag.id) drawerDrag = null; });
cvs.addEventListener('wheel', e => { if (drawerOpen) { e.preventDefault(); drawerScroll = clamp(drawerScroll + e.deltaY * 0.6, 0, drawerMaxScroll()); } }, { passive: false });
cvs.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (e.repeat) return;                       // holding Space must not chain-restart
  if (modal && modal.kind === 'consent') return;
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (modal) { if (modal.kind === 'pause') resumeGame(); return; }
    if (state === 'title' || (state === 'over' && overT > 0.5)) { Snd.init(); doubled = false; pressPlay(); }
    else if (autoPaused) { autoPaused = false; resumeT = 0.5; Snd.click(); }
  } else if (e.code === 'Escape') {
    if (modal) { if (modal.kind === 'pause') resumeGame(); else if (modal.kind !== 'ad') closeModal(); }
    else if (drawerOpen) toggleDrawer(false);
    else if (state === 'play') pauseGame();
  } else if (e.code === 'KeyP') { if (state === 'play') { if (paused) resumeGame(); else pauseGame(); } }
  else if (e.code === 'KeyU') { if (state !== 'dying' && state !== 'revive' && !modal) toggleDrawer(!drawerOpen); }
  else if (e.code === 'KeyM') toggleMute();
  else if (e.code === 'KeyD' && DEBUG) showDebug = !showDebug;
});
document.addEventListener('visibilitychange', () => {
  perfSkip = 60;
  if (document.hidden) {
    if (state === 'play' && !paused) { autoPaused = true; Track.ev('pause', { source: 'visibility' }); }
    persist(); Track.flush();
  }
});

// Adaptive quality: if the device can't hold ~48fps, drop to 1x pixel density, then drop the swirl layer.
let quality = 2, perfN = 0, perfAcc = 0, perfSkip = 90;
function perfWatch(dt) {
  if (quality === 0 || document.hidden) return;
  if (perfSkip > 0) { perfSkip--; return; }
  perfN++; perfAcc += dt;
  if (perfN < 120) return;
  const avg = perfAcc / perfN; perfN = 0; perfAcc = 0;
  if (avg <= 1 / 48) return;
  quality--; perfSkip = 30;
  Track.ev('perf_drop', { quality, avg_fps: Math.round(1 / avg) });
  if (quality === 1 && (window.devicePixelRatio || 1) > 1) { dprCap = 1; resize(); }
  else { quality = 0; swEl.style.display = 'none'; }
}
window.addEventListener('pagehide', () => { persist(); Track.flush(); });
window.addEventListener('resize', queueResize);
window.addEventListener('orientationchange', () => setTimeout(queueResize, 120));

