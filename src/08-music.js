// ---------------------------------------------------------------- music (F-008)
// A small synth sequencer (Am–F–C–G, 8th notes) scheduled 0.2 s ahead. Layers follow the game:
// pad always · bass in play · arpeggio while a combo ≥ 3 runs · hats/kick from wave 3 · faster when the core is low.
const Music = (() => {
  let next = 0, step = 0, lp = null;
  const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];   // MIDI notes
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const level = () => save.muted ? 0 : save.settings.music * 0.32;
  function mood() { next = 0; }
  function schedule(i, at, spb) {
    const bus = lp, ch = CHORDS[Math.floor(i / 16) % 4], s = i % 16, inPlay = state === 'play';
    const v = Snd.voice;
    if (s === 0) for (const n of ch) v(bus, 'triangle', hz(n), hz(n), spb * 15, 0.05, at, 0.4, 1400);
    if (inPlay && (s === 0 || s === 6 || s === 8 || s === 14)) v(bus, 'sine', hz(ch[0] - 24), hz(ch[0] - 24), spb * 1.6, 0.28, at, 0.01);
    if (inPlay && combo >= 3) { const n = ch[(s + (s >> 2)) % 3] + 12; v(bus, 'triangle', hz(n), hz(n), spb * 0.9, 0.06, at, 0.005); }
    if (inPlay && wave >= 3) {
      if (s % 2 === 0) Snd.noiseVoice(bus, 0.04, 0.05, at, 'highpass', 7000, 6000, 0.8);
      if (s === 0 || s === 8) v(bus, 'sine', 120, 45, 0.18, 0.4, at, 0.002);
    }
  }
  function tick() {
    const ac = Snd.ctx(), bus = Snd.musicBus();
    if (!ac || !bus || ac.state !== 'running') return;
    if (!lp) { lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000; lp.connect(bus); }
    const lvl = level();
    bus.gain.setTargetAtTime(lvl, ac.currentTime, 0.4);
    const low = state === 'play' && stability < 25 && mode !== 'zen';
    lp.frequency.setTargetAtTime(state === 'play' ? (low ? 9000 : 5000) : 2200, ac.currentTime, 0.5);
    if (lvl <= 0) { next = 0; return; }
    const spb = 60 / (96 * (low ? 1.25 : 1)) / 2;
    if (next < ac.currentTime) next = ac.currentTime + 0.05;
    while (next < ac.currentTime + 0.2) { schedule(step++, next, spb); next += spb; }
  }
  return { tick, mood };
})();

