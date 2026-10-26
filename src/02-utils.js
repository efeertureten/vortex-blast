// ---------------------------------------------------------------- utils
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
// Gameplay RNG (block colours): seedable, so a run can be replayed in tests and a Daily Challenge can
// share one board. Cosmetic randomness (particles, shake, spawn offsets) stays on Math.random.
let rngState = (Math.random() * 4294967296) >>> 0;
const seedRng = seed => { rngState = seed >>> 0; };
function rng() {   // mulberry32
  rngState = (rngState + 0x6D2B79F5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), rngState | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
// Test hooks and URL overrides only on ?debug=1 or a local server.
const DEBUG = /[?&]debug=1(&|$)/.test(location.search) || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const qparam = k => { const m = new RegExp('[?&]' + k + '=([^&]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; };
const hash32 = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };   // FNV-1a

