// ---------------------------------------------------------------- canvas
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
const bgEl = document.getElementById('bg');
const swEl = document.getElementById('swirl');
let dpr = 1, scale = 1, offX = 0, offY = 0, vw = 1, vh = 1;
let dprCap = 2;                           // lowered automatically on slow devices (see perfWatch)

function resize() {
  const nw = Math.max(1, window.innerWidth), nh = Math.max(1, window.innerHeight);
  const nd = Math.min(window.devicePixelRatio || 1, dprCap);
  if (nw === vw && nh === vh && nd === dpr && SPR) return;   // mobile browsers fire no-op resizes
  vw = nw; vh = nh; dpr = nd;
  cvs.width = Math.round(vw * dpr); cvs.height = Math.round(vh * dpr);
  cvs.style.width = vw + 'px'; cvs.style.height = vh + 'px';
  scale = Math.min(vw / W, vh / H);
  offX = (vw - W * scale) / 2; offY = (vh - H * scale) / 2;
  buildBg();
  buildSwirl();
  buildBlockSprites();
}
// Coalesce resize bursts (URL-bar show/hide, rotation) into one rebuild per frame.
let resizeQueued = false;
function queueResize() {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => { resizeQueued = false; resize(); });
}

