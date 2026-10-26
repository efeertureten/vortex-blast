// ---------------------------------------------------------------- config
const W = 540, H = 960;
const TAU = Math.PI * 2;
const CX = 270, CY = 486;                 // vortex centre
const RINGS = 4, SLOTS = 12, DA = TAU / SLOTS;
const RING_IN = [62, 111, 160, 209];      // inner radius of each ring
const RING_T = 44;                        // ring thickness
const ringMid = r => RING_IN[r] + RING_T / 2;
const SPRING_K = 560, SPRING_C = 24;      // block snap spring (under-damped = jelly bounce)
const BUILD = '2.0.0';
const HANDLE_H = 66, DRAWER_H = 528;
const GEM_PILL = { x: 400, y: 24, w: 120, h: 42 };
const MUTE_BTN = { x: 42, y: 45, r: 23 };
const PLAY_BTN_TITLE = { x: 145, y: 768, w: 250, h: 78 };
const PLAY_BTN_OVER = { x: 130, y: 602, w: 280, h: 74 };

const FD = "'Lilita One','Arial Rounded MT Bold','Arial Black',Impact,sans-serif";
const FB = "'Fredoka','Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif";

const COLORS = [
  { base:'#ff3b55', dark:'#b5122f', light:'#ff9aa8', deep:'#5c0616', ico:'#ffe4e8', rgb:'255,70,95',  icon:'flame' },
  { base:'#2e8bff', dark:'#1446b4', light:'#a3d3ff', deep:'#0a2466', ico:'#e6f3ff', rgb:'70,155,255', icon:'drop'  },
  { base:'#ffc928', dark:'#d07a00', light:'#fff1a6', deep:'#6b3d00', ico:'#fffadf', rgb:'255,210,50', icon:'star'  },
  { base:'#2fd457', dark:'#0e8a32', light:'#aaf8b8', deep:'#06461a', ico:'#e6ffeb', rgb:'70,225,110', icon:'leaf'  },
];

