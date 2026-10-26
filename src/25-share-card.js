// ---------------------------------------------------------------- share card (F-030)
function shareCard() {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  const th = THEMES[save.theme] || THEMES.classic;
  const grd = g.createRadialGradient(540, 620, 0, 540, 620, 900);
  th.bg.forEach((col, i) => grd.addColorStop(i / 3, col));
  g.fillStyle = grd; g.fillRect(0, 0, 1080, 1350);
  // a ring of the four block colours
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU; g.fillStyle = COLORS[i % 4].base;
    g.beginPath(); g.arc(540 + Math.cos(a) * 360, 640 + Math.sin(a) * 360, 34, 0, TAU); g.fill();
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '120px ' + FD; g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = '#1d0840';
  g.strokeText('VORTEX BLAST', 540, 170); g.fillStyle = '#ffd84a'; g.fillText('VORTEX BLAST', 540, 170);
  g.font = '64px ' + FB; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillText(t('score'), 540, 520);
  g.font = '190px ' + FD; g.lineWidth = 26; g.strokeText(fmt(score), 540, 660); g.fillStyle = '#fff'; g.fillText(fmt(score), 540, 660);
  g.font = '56px ' + FB; g.fillStyle = '#9ff8ff';
  g.fillText(t('wave', { n: wave }) + '  •  ' + t('combo', { n: maxCombo }), 540, 800);
  g.font = '44px ' + FB; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText(t('shareText', { s: fmt(score) }), 540, 1180);
  const text = t('shareText', { s: fmt(score) });
  c.toBlob(blob => {
    if (!blob) return;
    const file = typeof File === 'function' ? new File([blob], 'vortex-blast.png', { type: 'image/png' }) : null;
    Track.ev('share', { score });
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text }).catch(() => {}); return; }
    if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vortex-blast.png';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'image/png');
}

