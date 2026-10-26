// ---------------------------------------------------------------- background
// Static backdrop (drawn once per resize into its own canvas layer).
function buildBg() {
  bgEl.width = cvs.width; bgEl.height = cvs.height;
  bgEl.style.width = vw + 'px'; bgEl.style.height = vh + 'px';
  const g = bgEl.getContext('2d');
  const cx = (offX + CX * scale) * dpr, cy = (offY + CY * scale) * dpr;
  const R = Math.hypot(cvs.width, cvs.height) * 0.75;
  const grd = g.createRadialGradient(cx, cy, 0, cx, cy, R);
  const bg = (THEMES[save.theme] || THEMES.classic).bg;
  grd.addColorStop(0, bg[0]); grd.addColorStop(0.3, bg[1]); grd.addColorStop(0.7, bg[2]); grd.addColorStop(1, bg[3]);
  g.fillStyle = grd; g.fillRect(0, 0, bgEl.width, bgEl.height);
  // seeded (mulberry32) so the starfield doesn't jump around on every resize
  let seed = 0x5eed;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), seed | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = 0; i < 140; i++) {
    g.fillStyle = `rgba(${rnd() < 0.3 ? '180,220,255' : '255,255,255'},${rnd() * 0.4 + 0.05})`;
    const s = (rnd() * 1.6 + 0.5) * dpr;
    g.fillRect(rnd() * bgEl.width, rnd() * bgEl.height, s, s);
  }
}
// Spiral-arm layer centred on the vortex; rotated by CSS so it costs nothing per frame.
function buildSwirl() {
  const L = 1100, S = L * scale, px = Math.max(64, Math.round(Math.min(S * Math.min(dpr, 1.25), 1400)));
  swEl.width = swEl.height = px;
  swEl.style.width = swEl.style.height = S + 'px';
  swEl.style.left = (offX + CX * scale - S / 2) + 'px';
  swEl.style.top = (offY + CY * scale - S / 2) + 'px';
  const g = swEl.getContext('2d');
  g.clearRect(0, 0, px, px);
  g.translate(px / 2, px / 2); g.scale(px / L, px / L); g.lineCap = 'round';
  for (let arm = 0; arm < 5; arm++) {
    const off = arm * TAU / 5;
    g.beginPath();
    for (let i = 0; i <= 140; i++) {
      const k = i / 140, r = 70 + k * (L / 2 - 70), a = off + k * 3.4;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.strokeStyle = 'rgba(150,100,255,0.085)'; g.lineWidth = 60; g.stroke();
    g.strokeStyle = 'rgba(120,210,255,0.07)'; g.lineWidth = 16; g.stroke();
  }
}
const dust = [];
function newDust(init) { return { a: rand(0, TAU), r: init ? rand(70, 640) : rand(560, 660), sp: rand(0.4, 1.1), s: rand(0.8, 2.4), al: rand(0.25, 0.8) }; }
for (let i = 0; i < 60; i++) dust.push(newDust(true));

