// ---------------------------------------------------------------- frame render
// Built once in logical space; its strength is applied with globalAlpha (alpha scales linearly, so identical).
const VIGNETTE = ctx.createRadialGradient(270, 480, 260, 270, 480, 700);
VIGNETTE.addColorStop(0, 'rgba(255,0,40,0)'); VIGNETTE.addColorStop(1, 'rgb(255,20,50)');

function render() {
  hits = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offX, dpr * offY);

  drawBoard();
  drawParticles();

  // low-stability danger vignette
  if (state === 'play' && dispStab < 30 && mode !== 'zen') {
    ctx.globalAlpha = clamp((1 - dispStab / 30) * (0.35 + 0.25 * Math.sin(T * 10)), 0, 1) * (reducedMotion() ? 0.5 : 1);
    ctx.fillStyle = VIGNETTE; fullRect(); ctx.globalAlpha = 1;
  }

  if (state === 'title') { drawTitle(); drawGemPill(); drawTopLeft(); }
  else if (state === 'over') { drawOver(); drawGemPill(); drawTopLeft(); }
  else drawHUD();
  drawBanners();

  if (state === 'revive') drawRevive();
  if (autoPaused && state === 'play' && !modal) {
    ctx.fillStyle = 'rgba(6,2,18,0.6)'; fullRect();
    txt(t('paused'), 270, 440, { size: 64, stroke: '#1d0840', sw: 10 });
    txt(t('tapResume'), 270, 500, { size: 20, font: FB, weight: 600, color: 'rgba(255,255,255,0.8)' });
  }
  if (resumeT > 0 && state === 'play') txt(String(Math.ceil(resumeT * 2)), 270, 440, { size: 90, stroke: '#1d0840', sw: 12 });
  if (state !== 'revive') drawDrawer();
  drawModal();
  if (flashA > 0 && !reducedMotion()) { ctx.fillStyle = `rgba(${flashCol},${flashA * 0.6})`; fullRect(); }
  if (showDebug) drawDebug();
}
function drawDebug() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(8, 180, 250, 20 + Object.keys(Track.counts).length * 16);
  let y = 196;
  txt(`q=${Track.queue.length} fps-q=${quality} var=${variantsKey() || '-'}`, 16, y, { size: 12, font: FB, align: 'left', color: '#7dffa0' });
  for (const k in Track.counts) { y += 16; txt(`${k}: ${Track.counts[k]}`, 16, y, { size: 12, font: FB, align: 'left', color: '#fff' }); }
}

