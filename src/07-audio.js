// ---------------------------------------------------------------- audio
// Graph: sfx bus ─┐
//        music bus ┴→ master (mute) → compressor → speakers
const Snd = (() => {
  let ac = null, master = null, sfx = null, music = null, noiseBuf = null;
  function init() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        ac = new AC();
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -12; comp.knee.value = 12; comp.ratio.value = 5;
        comp.attack.value = 0.002; comp.release.value = 0.12;
        master = ac.createGain(); master.gain.value = save.muted ? 0 : 1;
        sfx = ac.createGain(); sfx.gain.value = save.settings.sfx;
        music = ac.createGain(); music.gain.value = 0;
        sfx.connect(master); music.connect(master); master.connect(comp); comp.connect(ac.destination);
        const len = Math.floor(ac.sampleRate * 1.2);
        noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      // iOS reports 'interrupted' (not 'suspended') after a call or app switch
      if (ac.state !== 'running' && ac.state !== 'closed') ac.resume().catch(() => {});
    } catch (e) {}
  }
  const live = () => ac && ac.state === 'running' && !save.muted;
  function setMuted(m) { if (master) master.gain.setTargetAtTime(m ? 0 : 1, ac.currentTime, 0.02); }
  function setSfx(v) { if (sfx) sfx.gain.setTargetAtTime(v, ac.currentTime, 0.02); }
  function voice(dest, type, f0, f1, dur, vol, at, attack = 0.004, filter = 0) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, at);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    if (filter) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filter; o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(dest); o.start(at); o.stop(at + dur + 0.03);
  }
  function noiseVoice(dest, dur, vol, at, type, f0, f1, q) {
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, at); fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1), at + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(fl); fl.connect(g); g.connect(dest);
    src.start(at, Math.random() * 0.1); src.stop(at + dur + 0.03);
  }
  function tone(type, f0, f1, dur, vol, when = 0, attack = 0.004) { if (live()) voice(sfx, type, f0, f1, dur, vol, ac.currentTime + when, attack); }
  function noise(dur, vol, when = 0, type = 'bandpass', f0 = 1200, f1 = 400, q = 1) { if (live()) noiseVoice(sfx, dur, vol, ac.currentTime + when, type, f0, f1, q); }
  const PENT = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36];
  const semi = s => Math.pow(2, s / 12);
  function pop(step, base, when, vol = 0.3) {
    const f = base * semi(PENT[Math.min(step, PENT.length - 1)]);
    tone('sine', f * 1.9, f * 0.72, 0.11, vol, when, 0.002);       // the "bloop"
    tone('triangle', f * 3.1, f * 2.2, 0.045, vol * 0.4, when, 0.001); // click transient
    noise(0.035, 0.08, when, 'highpass', 3500, 1800, 0.7);
  }
  return {
    init, setMuted, setSfx, semi,
    ctx: () => ac, musicBus: () => music, voice, noiseVoice, live,
    blast(n, combo) {
      const base = 300 * semi(Math.min(combo - 1, 12) * 1.5);  // each combo step raises the key
      const m = Math.min(n, 14);
      for (let i = 0; i < m; i++) pop(i, base, i * 0.026, 0.28);
      tone('sine', 150, 55, 0.2, 0.32, 0, 0.003);                // body thump
    },
    bomb() {
      noise(1.0, 0.9, 0, 'lowpass', 2200, 50, 0.8);
      tone('sine', 170, 30, 0.85, 0.85, 0, 0.004);
      tone('sawtooth', 95, 32, 0.5, 0.14, 0);
      for (let i = 0; i < 9; i++) pop(i * 2, 280, 0.06 + i * 0.028, 0.18);
    },
    bombMade() {
      for (let i = 0; i < 6; i++) { const f = 620 * semi(i * 4); tone('triangle', f, f * 1.01, 0.2, 0.11, 0.05 + i * 0.045); }
      noise(0.45, 0.14, 0, 'bandpass', 700, 5000, 2);
    },
    nope() { tone('square', 150, 95, 0.1, 0.07); tone('sine', 100, 60, 0.14, 0.25); },
    click() { tone('triangle', 950, 700, 0.06, 0.14); },
    tink() { const f = rand(1900, 2300); tone('sine', f, f, 0.07, 0.05); },
    buy() { [0, 4, 7, 12, 16].forEach((s, i) => tone('triangle', 523 * semi(s), 523 * semi(s), 0.24, 0.17, i * 0.055)); noise(0.3, 0.08, 0.1, 'highpass', 4000, 8000, 1); },
    deny() { tone('square', 230, 210, 0.08, 0.07); tone('square', 175, 160, 0.11, 0.07, 0.1); },
    wave() { [0, 4, 7, 11, 14].forEach((s, i) => tone('sine', 392 * semi(s), 392 * semi(s) * 1.004, 0.45, 0.15, i * 0.07)); noise(0.7, 0.1, 0, 'bandpass', 400, 6000, 1.5); },
    over() {
      [12, 7, 3, 0, -5].forEach((s, i) => tone('triangle', 330 * semi(s), 330 * semi(s) * 0.97, 0.38, 0.2, 0.15 + i * 0.13));
      noise(1.3, 0.55, 0, 'lowpass', 2500, 40, 0.7); tone('sine', 130, 28, 1.2, 0.7);
    },
    tick(k) { tone('sine', 72, 48, 0.12, 0.38 * k); tone('sine', 72, 48, 0.1, 0.24 * k, 0.15); },
    start() { [0, 7, 12, 19].forEach((s, i) => tone('triangle', 440 * semi(s), 440 * semi(s), 0.2, 0.16, i * 0.065)); },
    boss() { [0, -1, 0, -1].forEach((s, i) => tone('sawtooth', 110 * semi(s), 110 * semi(s), 0.22, 0.12, i * 0.2)); noise(0.9, 0.3, 0, 'lowpass', 900, 60, 1); },
    heartbeat() { for (let i = 0; i < 2; i++) { tone('sine', 62, 40, 0.16, 0.6, i * 0.42); tone('sine', 62, 40, 0.12, 0.4, i * 0.42 + 0.17); } },
    quest() { [0, 7, 12].forEach((s, i) => tone('sine', 660 * semi(s), 660 * semi(s), 0.18, 0.12, i * 0.06)); },
  };
})();

