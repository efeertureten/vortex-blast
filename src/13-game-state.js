// ---------------------------------------------------------------- game state
let state = 'title';                 // title | play | revive | dying | over
let mode = 'endless';                // endless | daily (seeded, one official try a day) | zen (no drain)
let autoPaused = false, paused = false, resumeT = 0;
let score = 0, baseScore = 0, dispScore = 0, stability = 100, dispStab = 100, wave = 1;
let combo = 0, comboT = 0, comboWin = 1, maxCombo = 0, runGems = 0, blasts = 0, bombsMade = 0, timeAlive = 0, runSeed = 0;
let bossT = 0, bossRing = -1, slowT = 0, lastChanceUsed = false, revivesUsed = 0, shieldArmed = false, magnetBoostT = 0;
let graceT = 0, reviveT = 0, officialDaily = false;
const run = { cbombs: 0, jokers: 0, unlocks: 0, rings: 0, bigs: 0, cross: 0, bosses: 0 };   // per-run counters for quests
let hitStop = 0, pending = null, shake = 0, flashA = 0, flashCol = '255,255,255';
let corePulse = 0, boardPunch = 0, dyingT = 0, overT = 0, newBest = false, lowT = 0;
let comboPop = 0, gemBounce = 0, barFlash = 0, bombOnBoard = false;
let T = 0, simT = 0, gemsInFlight = 0;
let drawerOpen = false, drawerT = 0;
const btnPress = [0, 0, 0, 0, 0, 0], cardShake = [0, 0, 0, 0, 0, 0], cardFlash = [0, 0, 0, 0, 0, 0];
let playPress = 0;

const grid = Array.from({ length: RINGS }, () => new Array(SLOTS).fill(null));
const ringAng = [0, 0.26, 0.1, 0.4];
const ringMag = [0, 0, 0, 0];
// speed = (a + b*sin(f*t+p)) — ring 2 occasionally reverses direction
const RSPEC = [{ a: 0.30, b: 0.10, f: 0.31, p: 0 }, { a: -0.21, b: 0.12, f: 0.23, p: 1.7 },
               { a: 0.10, b: 0.17, f: 0.17, p: 3.1 }, { a: -0.13, b: 0.06, f: 0.29, p: 4.4 }];
let clusters = [];
const links = [];
const parts = [];
const banners = [];

let uid = 1;
// bomb = Vortex Bomb (clears its ring), cb = Colour Bomb (clears its colour, c = that colour),
// joker = prism that links with any colour, locked = can't link until a neighbour blasts.
function newBlock(c, bomb = false) {
  return { id: uid++, c, bomb, cb: false, joker: false, locked: false, dr: 0, vr: 0, da: 0, va: 0, sc: 1, vs: 0,
    jel: 0, jelP: 0, wob: 0, flash: 0, glow: 0, ready: false, cl: -1 };
}
const isSpecial = b => b.bomb || b.cb;              // tapped on their own, never part of a cluster
const linkable = b => !isSpecial(b) && !b.joker && !b.locked;
const slotAng = (r, s) => ringAng[r] + s * DA;
function closest(r, a) { let k = Math.round(wrapA(a - ringAng[r]) / DA) % SLOTS; if (k < 0) k += SLOTS; return k; }
const isSettled = b => Math.abs(b.dr) < 5 && Math.abs(b.da) < 0.06;
function ringSpeed(r) {
  const s = RSPEC[r], wf = 1 + Math.min(wave - 1, 8) * 0.07;
  const v = (s.a + s.b * Math.sin(simT * s.f + s.p)) * wf;
  return bossT > 0 && r === bossRing ? v * CFG.content.bossSpeed : v;   // boss wave: one ring reverses and speeds up
}
// Stability drain: 7 %/s at wave 1, +1.15 per wave up to the cap, then +postCap per wave (no flat ceiling,
// so even a perfect player's run ends — docs/01_GDD.md §3.5).
function drainBase(w) {
  const d = CFG.drain, lin = d.base + (w - 1) * d.perWave;
  if (lin <= d.cap) return lin;
  return d.cap + Math.max(0, w - (1 + (d.cap - d.base) / d.perWave)) * d.postCap;
}
const drainRate = () => mode === 'zen' || graceT > 0 ? 0
  : drainBase(wave) * Math.min(1, timeAlive / CFG.drain.ramp) * ftueDrainK();
const waveScore = w => 1000 * w * (w + 1) / 2;
const comboMulOf = c => 1 + Math.min(c - 1, 8) * 0.15;
// combo window shrinks as the combo grows, so keeping a long combo takes speed (Combo Timer upgrade widens it)
function comboWindow(c) {
  const C = CFG.combo, lv = save.upg.combo, ev = eventToday() === 'combo' ? 0.3 : 0;
  return Math.max(C.min + 0.05 * lv, C.window + 0.1 * lv + ev - C.decay * (c - 1));
}
// refills cap at 100 but never cut a Core Shield / streak overflow above it
const addStab = x => { stability = Math.max(stability, Math.min(100, stability + x)); };
function blockWorld(r, s, b) {
  const rad = ringMid(r) + (b ? b.dr : 0), a = slotAng(r, s) + (b ? b.da : 0);
  return { x: CX + Math.cos(a) * rad, y: CY + Math.sin(a) * rad };
}

function fillBoardFresh(fromOutside) {
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SLOTS; s++) {
    const b = newBlock((rng() * 4) | 0);
    if (fromOutside) { b.dr = 300 - ringMid(r) + r * 30 + rand(0, 50); b.vr = -80; b.sc = 0.35; b.da = rand(-0.25, 0.25); }
    grid[r][s] = b;
  }
}
function spawnColor(s) {
  const harmony = ftueStep === 3 ? 0.45 : 0.22 + 0.03 * save.upg.harmony;
  if (rng() < harmony) {
    const nb = grid[RINGS - 1][(s + SLOTS - 1) % SLOTS] || grid[RINGS - 1][(s + 1) % SLOTS];
    if (nb && !isSpecial(nb) && !nb.joker) return nb.c;
  }
  return (rng() * 4) | 0;
}
// One extra rng draw per spawn decides prism / locked (same draw order as vb_model.Game.new_spawn).
function newSpawn(s) {
  const b = newBlock(spawnColor(s)), C = CFG.content, roll = rng();
  if (ftueStep >= 0 && ftueStep < 5) return b;               // keep the tutorial board plain
  let lockP = 0;
  if (wave >= C.lockWave) {
    lockP = Math.min(C.lockMax, C.lockP0 + C.lockStep * (wave - C.lockWave));
    if (bossT > 0) lockP *= C.bossLockMult;
  }
  if (wave >= C.jokerWave && roll < C.jokerP) b.joker = true;
  else if (roll >= C.jokerP && roll < C.jokerP + lockP) b.locked = true;
  return b;
}
// Same-ring sides plus radially aligned slots in the rings either side (the cluster adjacency).
function neighbours(r, s, tol) {
  const out = [[r, (s + 1) % SLOTS], [r, (s + SLOTS - 1) % SLOTS]], a = slotAng(r, s);
  for (const nr of [r - 1, r + 1]) {
    if (nr < 0 || nr >= RINGS) continue;
    const t0 = closest(nr, a);
    for (let o = -1; o <= 1; o++) {
      const t2 = (t0 + o + SLOTS) % SLOTS;
      if (Math.abs(wrapA(slotAng(nr, t2) - a)) < tol) out.push([nr, t2]);
    }
  }
  return out;
}
// Move a block between slots, keeping its current on-screen position (spring takes it home).
function moveBlock(fr, fs, tr, ts) {
  const b = grid[fr][fs]; grid[fr][fs] = null;
  const curR = ringMid(fr) + b.dr, curA = slotAng(fr, fs) + b.da;
  b.dr = curR - ringMid(tr); b.da = wrapA(curA - slotAng(tr, ts));
  b.vr -= 140;                      // inward kick → snappier
  grid[tr][ts] = b;
}
// Gravity toward the core: fill holes from the next ring out; spawn on the outermost ring.
function settle() {
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (let r = 0; r < RINGS - 1; r++) {
      for (let s = 0; s < SLOTS; s++) {
        if (grid[r][s]) continue;
        const t2 = closest(r + 1, slotAng(r, s));
        if (grid[r + 1][t2]) { moveBlock(r + 1, t2, r, s); changed = true; }
      }
    }
    for (let s = 0; s < SLOTS; s++) {
      if (!grid[RINGS - 1][s]) {
        const b = newSpawn(s);
        b.dr = rand(80, 120); b.vr = -260; b.sc = 0.55;
        grid[RINGS - 1][s] = b; changed = true;
      }
    }
    if (!changed) break;
  }
}

// Connected same-colour groups: neighbours in the same ring, or radially aligned across rings.
let specialOnBoard = '';   // '', 'bomb' or 'cb' — drives the hint line
function computeClusters() {
  const tol = tolerance();
  bombOnBoard = false; specialOnBoard = '';
  let lockedOnBoard = false;
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SLOTS; s++) {
    const b = grid[r][s];
    if (!b) continue;
    b.cl = -1; b.ready = false;
    if (b.bomb) { bombOnBoard = true; specialOnBoard = 'bomb'; } else if (b.cb && !specialOnBoard) specialOnBoard = 'cb';
    if (b.locked) lockedOnBoard = true;
  }
  if (!specialOnBoard && lockedOnBoard) specialOnBoard = 'lock';
  clusters = []; links.length = 0;
  const lks = [];
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SLOTS; s++) {
    const b = grid[r][s]; if (!b || !linkable(b) || b.cl !== -1 || !isSettled(b)) continue;
    const idx = clusters.length, col = b.c, cells = [], lk = [], st = [r, s];
    b.cl = idx;
    while (st.length) {
      const cs = st.pop(), cr = st.pop(); cells.push({ r: cr, s: cs });
      const a = slotAng(cr, cs);
      for (let k = 0; k < 2; k++) {
        const ns = (cs + (k ? 1 : SLOTS - 1)) % SLOTS, nb = grid[cr][ns];
        if (nb && linkable(nb) && nb.c === col && nb.cl === -1 && isSettled(nb)) { nb.cl = idx; st.push(cr, ns); }
      }
      for (let k = 0; k < 2; k++) {
        const nr = cr + (k ? 1 : -1); if (nr < 0 || nr >= RINGS) continue;
        const t0 = closest(nr, a);
        for (let o = -1; o <= 1; o++) {
          const t2 = (t0 + o + SLOTS) % SLOTS;
          if (Math.abs(wrapA(slotAng(nr, t2) - a)) >= tol) continue;
          const nb = grid[nr][t2];
          if (!nb || !linkable(nb) || nb.c !== col || !isSettled(nb)) continue;
          if (nr > cr) lk.push(cr, cs, nr, t2);
          if (nb.cl === -1) { nb.cl = idx; st.push(nr, t2); }
        }
      }
    }
    clusters.push(cells); lks.push(lk);
  }
  attachJokers(tol);
  clusters.forEach((cells, i) => {
    if (cells.length < 3) return;
    for (const c of cells) grid[c.r][c.s].ready = true;
    for (const v of lks[i] || []) links.push(v);
  });
}
// A settled prism joins the colour whose neighbouring clusters are largest, merging those clusters.
function attachJokers(tol) {
  const parent = clusters.map((_, i) => i);
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const extra = {};
  const sizeOf = roots => roots.reduce((a, x) => a + clusters[x].length + (extra[x] ? extra[x].length : 0), 0);
  for (let r = 0; r < RINGS; r++) for (let s = 0; s < SLOTS; s++) {
    const j = grid[r][s];
    if (!j || !j.joker || j.locked || !isSettled(j)) continue;
    const byCol = new Map();
    for (const [nr, ns] of neighbours(r, s, tol)) {
      const nb = grid[nr][ns];
      if (nb && nb.cl >= 0 && !nb.joker) {
        const root = find(nb.cl);
        if (!byCol.has(nb.c)) byCol.set(nb.c, new Set());
        byCol.get(nb.c).add(root);
      }
    }
    if (!byCol.size) continue;
    let col = -1, best = -1;
    for (const [c, set] of byCol) { const sz = sizeOf([...set]); if (sz > best) { best = sz; col = c; } }
    const roots = [...byCol.get(col)].sort((a, b) => a - b), keep = roots[0];
    for (const x of roots.slice(1)) {
      parent[x] = keep;
      extra[keep] = (extra[keep] || []).concat(clusters[x], extra[x] || []);
      delete extra[x]; clusters[x] = [];
    }
    (extra[keep] = extra[keep] || []).push({ r, s });
    j.cl = keep;
  }
  clusters = clusters.map((cells, i) => parent[i] === i ? cells.concat(extra[i] || []) : []);
  clusters.forEach((cells, i) => { for (const c of cells) grid[c.r][c.s].cl = i; });
}

// Alignment Magnet: adjacent rings get a gentle torque toward lining up same-colour neighbours.
function applyMagnet(dt) {
  const L = magnetLevel(), tgt = [0, 0, 0, 0];
  if (L > 0) {
    for (let r = 0; r < RINGS - 1; r++) for (let s = 0; s < SLOTS; s++) {
      const b = grid[r][s]; if (!b || !linkable(b) || !isSettled(b)) continue;
      const a = slotAng(r, s), t2 = closest(r + 1, a), b2 = grid[r + 1][t2];
      if (!b2 || !linkable(b2) || b2.c !== b.c || !isSettled(b2)) continue;
      const f = -Math.sin(wrapA(slotAng(r + 1, t2) - a) * TAU / DA);
      tgt[r + 1] += f; tgt[r] -= f;
    }
    const k = 0.045 * L, mx = 0.032 * L;
    for (let r = 0; r < RINGS; r++) tgt[r] = clamp(tgt[r] * k, -mx, mx);
  }
  for (let r = 0; r < RINGS; r++) ringMag[r] += (tgt[r] - ringMag[r]) * Math.min(1, dt * 5);
}

