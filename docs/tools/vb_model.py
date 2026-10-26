"""Vortex Blast gameplay model: a headless Python port of the gameplay rules in ../../index.html.

Ported 1:1 (same constants and formulas): ring rotation (RSPEC/ringSpeed), block springs
(SPRING_K/SPRING_C, only dr/da: scale/jelly are cosmetic), isSettled, computeClusters (incl. radial
tolerance), applyMagnet, settle/moveBlock/spawnColor, doBlast, doBomb, waveUp, drainRate, combo.
Not ported (cosmetic only): particles, banners, sound, glow/jelly/wobble, rendering.

Three tunings:
  AS_BUILT  — the game as it was before the roadmap (commit 89f79ff + perf work); kept for history.
  PROPOSED  — the first GDD §3.5 proposal (score/drain/gem fixes).
  FINAL     — what index.html now implements: PROPOSED + shrinking combo window + content
              (joker, colour bomb, locked blocks, boss waves) + three new upgrades.

A *bot* stands in for the player. Bot behaviour is an ASSUMPTION ([VARSAYIM]) — see BOTS.
"""
import math
import random

TAU = math.pi * 2
RINGS, SLOTS = 4, 12
DA = TAU / SLOTS
RING_IN = [62, 111, 160, 209]
RING_T = 44
SPRING_K, SPRING_C = 560, 24
COMBO_WINDOW = 1.8
RSPEC = [(0.30, 0.10, 0.31, 0.0), (-0.21, 0.12, 0.23, 1.7), (0.10, 0.17, 0.17, 3.1), (-0.13, 0.06, 0.29, 4.4)]


AS_BUILT = dict(
    wave_from_base_score=False,   # True: wave thresholds use score before the Gem&Score multiplier
    bomb_refill=20,               # doBomb stability gain
    drain_cap=20, drain_post=0.0, # drain = min(cap, 7+1.15(w-1)) [+ drain_post per wave after cap]
    gem_rate=1.0,                 # global scale on every gem source (fractional gems accumulate)
    combo_window=COMBO_WINDOW,
    combo_decay=0.0, combo_min=0.0,   # window = max(combo_min, combo_window - combo_decay·(combo-1))
    content=False,                # joker / colour bomb / locked blocks / boss waves
    gem_mult_step=0.25,           # Gem&Score Boost effect on gems per level (score always 0.25)
)
# bomb_refill stays 20: a sweep (12/16/20) showed 12 makes a bomb worth less stability than a normal
# blast, so the Bomb Threshold upgrade *shortened* runs; the post-cap drain alone ends endless runs.
PROPOSED = dict(AS_BUILT, wave_from_base_score=True, bomb_refill=20, drain_cap=24, drain_post=0.6,
                gem_rate=0.15, combo_window=1.3)
# Combo sweep (docs/01_GDD.md §3.5): a window that shrinks as the combo grows makes combo a skill
# signal (novice/casual/skilled median max combo 6/10/25) where a fixed 1.3 s never broke (122).
# vb_final.py round 1 → round 2: locks hit skilled play -19…-27 % (criterion ±15 %) so lock_max/step and
# the boss lock multiplier came down; 6 upgrades took casual 76.5 runs (target ≥ 100) because the Boost
# multiplied gems ×3.5, so its gem effect is halved and gem_rate 0.15 → 0.13.
FINAL = dict(PROPOSED, combo_window=1.8, combo_decay=0.12, combo_min=0.7, content=True,
             gem_rate=0.13, gem_mult_step=0.125)
TUNING = dict(AS_BUILT)

# content parameters (FINAL)
CONTENT = dict(
    joker_wave=3, joker_p=0.02,
    lock_wave=4, lock_p0=0.05, lock_step=0.003, lock_max=0.09,
    cbomb_n=9, cbomb_score=40, cbomb_refill=8, cbomb_refill_n=0.8, cbomb_gems=3,
    boss_every=5, boss_secs=20, boss_speed=-1.6, boss_lock_mult=1.5, boss_gems=20,
)


def js_round(x):
    return math.floor(x + 0.5)


def ring_mid(r):
    return RING_IN[r] + RING_T / 2


def wrapA(a):
    return (a + math.pi) % TAU - math.pi


class Mulberry32:
    """Bit-exact copy of rng() in index.html."""
    def __init__(self, seed):
        self.s = seed & 0xFFFFFFFF

    def random(self):
        self.s = (self.s + 0x6D2B79F5) & 0xFFFFFFFF
        s = self.s
        t = _imul(s ^ (s >> 15), s | 1)
        t ^= (t + _imul(t ^ (t >> 7), t | 61)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    def randrange(self, n):
        return int(self.random() * n)


def _imul(a, b):
    return (a * b) & 0xFFFFFFFF


# ---------------------------------------------------------------- formulas (same as index.html)
def drain_base(wave):
    t = TUNING
    lin = 7 + (wave - 1) * 1.15
    if lin <= t['drain_cap']:
        return lin
    # waves past the cap: as-built stays flat (drain_post = 0); proposed keeps climbing slowly
    w_cap = 1 + (t['drain_cap'] - 7) / 1.15
    return t['drain_cap'] + max(0.0, wave - w_cap) * t['drain_post']


def drain_rate(wave, time_alive):
    return drain_base(wave) * min(1, time_alive / 1.5)


def wave_score(w):
    return 1000 * w * (w + 1) / 2


def combo_mul(c):
    return 1 + min(c - 1, 8) * 0.15


def mult_of(level):
    return 1 + 0.25 * level


def tolerance(magnet):
    return 0.19 + 0.024 * magnet


def ring_speed_factor(wave):
    return 1 + min(wave - 1, 8) * 0.07


UPGRADES = {
    'magnet': (5, lambda l: js_round(40 * 1.8 ** l)),
    'bomb': (2, lambda l: [120, 360][l] if l < 2 else 0),
    'mult': (10, lambda l: js_round(50 * 1.55 ** l)),
}
# F-025 (FINAL only)
NEW_UPGRADES = {
    'combo': (4, lambda l: js_round(80 * 1.8 ** l)),
    'shield': (5, lambda l: js_round(100 * 1.7 ** l)),
    'harmony': (4, lambda l: js_round(120 * 1.8 ** l)),
}


def gem_mult(level):
    return 1 + TUNING['gem_mult_step'] * level
ALL_UPGRADES = dict(UPGRADES, **NEW_UPGRADES)


class Block:
    __slots__ = ('c', 'bomb', 'cb', 'joker', 'locked', 'dr', 'vr', 'da', 'va', 'cl', 'ready')

    def __init__(self, c, bomb=False):
        self.c, self.bomb = c, bomb
        self.cb = self.joker = self.locked = False
        self.dr = self.vr = self.da = self.va = 0.0
        self.cl, self.ready = -1, False

    @property
    def special(self):   # never part of a colour cluster
        return self.bomb or self.cb


def settled(b):
    return abs(b.dr) < 5 and abs(b.da) < 0.06


# ---------------------------------------------------------------- bots ([VARSAYIM])
# interval: mean seconds between taps (human reaction + scanning), jittered ±30 %
# pick: 'largest' | 'weighted' (prob ∝ size) | 'random'
# bomb_p: chance to use a bomb on a decision when one is available
BOTS = {
    'novice':  dict(interval=1.40, pick='random',   bomb_p=0.5),
    'casual':  dict(interval=0.95, pick='weighted', bomb_p=0.8),
    'skilled': dict(interval=0.60, pick='largest',  bomb_p=1.0),
}


class Game:
    def __init__(self, upg, rng, bot, color_seed=None):
        self.upg = {k: upg.get(k, 0) for k in ALL_UPGRADES}
        self.rng, self.bot = rng, BOTS[bot]
        # colours come from a Mulberry32 stream when seeded (parity with index.html), else the bot rng
        self.crng = Mulberry32(color_seed) if color_seed is not None else rng
        self.grid = [[Block(self.crng.randrange(4)) for _ in range(SLOTS)] for _ in range(RINGS)]
        self.ring_ang = [0, 0.26, 0.1, 0.4]
        self.ring_mag = [0.0] * RINGS
        self.sim_t = rng.uniform(0, 60)          # the title screen runs the vortex before PLAY
        self.score = 0; self.base_score = 0; self.wave = 1
        self.stability = 100.0 + 5 * self.upg['shield']
        self.gem_frac = 0.0
        self.combo = 0; self.combo_t = 0.0; self.max_combo = 0
        self.gems = 0; self.blasts = 0; self.bombs_made = 0; self.bombs_used = 0
        self.cbombs = 0; self.jokers = 0; self.locks = 0; self.bosses = 0
        self.time_alive = 0.0; self.hit_stop = 0.0; self.pending = None
        self.boss_t = 0.0; self.boss_ring = -1
        self.cluster_sizes = []
        self.combo_mults = []
        self.wave_t = {}                         # wave -> seconds spent in it
        self.next_tap = self._interval()
        self.clusters = []
        self.alive = True
        self.min_stab_by_wave = {}

    # -------------------------------------------------------------- helpers
    def _interval(self):
        return self.bot['interval'] * self.rng.uniform(0.7, 1.3)

    def slot_ang(self, r, s):
        return self.ring_ang[r] + s * DA

    def closest(self, r, a):
        return js_round(wrapA(a - self.ring_ang[r]) / DA) % SLOTS

    def ring_speed(self, r):
        a, b, f, p = RSPEC[r]
        v = (a + b * math.sin(self.sim_t * f + p)) * ring_speed_factor(self.wave)
        if self.boss_t > 0 and r == self.boss_ring:
            v *= CONTENT['boss_speed']
        return v

    def neighbours(self, r, s, tol):
        """Same-ring sides and radially aligned slots in the rings either side."""
        out = [(r, (s + 1) % SLOTS), (r, (s + SLOTS - 1) % SLOTS)]
        a = self.slot_ang(r, s)
        for nr in (r - 1, r + 1):
            if 0 <= nr < RINGS:
                t0 = self.closest(nr, a)
                for o in (-1, 0, 1):
                    t2 = (t0 + o + SLOTS) % SLOTS
                    if abs(wrapA(self.slot_ang(nr, t2) - a)) < tol:
                        out.append((nr, t2))
        return out

    # -------------------------------------------------------------- board rules
    def spawn_color(self, s):
        g = self.grid[RINGS - 1]
        if self.crng.random() < 0.22 + 0.03 * self.upg['harmony']:
            nb = g[(s + SLOTS - 1) % SLOTS] or g[(s + 1) % SLOTS]
            if nb and not nb.special and not nb.joker:
                return nb.c
        return self.crng.randrange(4)

    def new_spawn(self, s):
        b = Block(self.spawn_color(s))
        if TUNING['content']:
            C = CONTENT
            roll = self.crng.random()
            lock_p = 0.0
            if self.wave >= C['lock_wave']:
                lock_p = min(C['lock_max'], C['lock_p0'] + C['lock_step'] * (self.wave - C['lock_wave']))
                if self.boss_t > 0:
                    lock_p *= C['boss_lock_mult']
            if self.wave >= C['joker_wave'] and roll < C['joker_p']:
                b.joker = True; self.jokers += 1
            elif C['joker_p'] <= roll < C['joker_p'] + lock_p:
                b.locked = True; self.locks += 1
        return b

    def move_block(self, fr, fs, tr, ts):
        b = self.grid[fr][fs]; self.grid[fr][fs] = None
        cur_r = ring_mid(fr) + b.dr; cur_a = self.slot_ang(fr, fs) + b.da
        b.dr = cur_r - ring_mid(tr); b.da = wrapA(cur_a - self.slot_ang(tr, ts))
        b.vr -= 140
        self.grid[tr][ts] = b

    def settle(self):
        for _ in range(8):
            changed = False
            for r in range(RINGS - 1):
                for s in range(SLOTS):
                    if self.grid[r][s]:
                        continue
                    t2 = self.closest(r + 1, self.slot_ang(r, s))
                    if self.grid[r + 1][t2]:
                        self.move_block(r + 1, t2, r, s); changed = True
            for s in range(SLOTS):
                if not self.grid[RINGS - 1][s]:
                    b = self.new_spawn(s)
                    b.dr = self.rng.uniform(80, 120); b.vr = -260
                    self.grid[RINGS - 1][s] = b; changed = True
            if not changed:
                break

    def compute_clusters(self):
        tol = tolerance(self.upg['magnet'])
        G = self.grid
        for row in G:
            for b in row:
                if b:
                    b.cl = -1; b.ready = False
        clusters = []
        for r in range(RINGS):
            for s in range(SLOTS):
                b = G[r][s]
                if not b or b.special or b.joker or b.locked or b.cl != -1 or not settled(b):
                    continue
                idx, col, cells, st = len(clusters), b.c, [], [(r, s)]
                b.cl = idx
                while st:
                    cr, cs = st.pop(); cells.append((cr, cs))
                    a = self.slot_ang(cr, cs)
                    for ns in ((cs + 1) % SLOTS, (cs + SLOTS - 1) % SLOTS):
                        nb = G[cr][ns]
                        if nb and not nb.special and not nb.joker and not nb.locked and nb.c == col and nb.cl == -1 and settled(nb):
                            nb.cl = idx; st.append((cr, ns))
                    for nr in (cr - 1, cr + 1):
                        if nr < 0 or nr >= RINGS:
                            continue
                        t0 = self.closest(nr, a)
                        for o in (-1, 0, 1):
                            t2 = (t0 + o + SLOTS) % SLOTS
                            if abs(wrapA(self.slot_ang(nr, t2) - a)) >= tol:
                                continue
                            nb = G[nr][t2]
                            if not nb or nb.special or nb.joker or nb.locked or nb.c != col or not settled(nb):
                                continue
                            if nb.cl == -1:
                                nb.cl = idx; st.append((nr, t2))
                clusters.append(cells)
        if TUNING['content']:
            clusters = self._attach_jokers(clusters, tol)
        for cells in clusters:
            if len(cells) >= 3:
                for (cr, cs) in cells:
                    G[cr][cs].ready = True
        self.clusters = [c for c in clusters if c]

    def _attach_jokers(self, clusters, tol):
        """A settled joker joins the colour whose adjacent clusters are largest, merging them."""
        G = self.grid
        parent = list(range(len(clusters)))

        def find(i):
            while parent[i] != i:
                parent[i] = parent[parent[i]]; i = parent[i]
            return i
        extra = {}
        for r in range(RINGS):
            for s in range(SLOTS):
                j = G[r][s]
                if not j or not j.joker or j.locked or not settled(j):
                    continue
                by_col = {}
                for (nr, ns) in self.neighbours(r, s, tol):
                    nb = G[nr][ns]
                    if nb and nb.cl >= 0 and not nb.joker:
                        root = find(nb.cl)
                        by_col.setdefault(nb.c, set()).add(root)
                if not by_col:
                    continue
                size = lambda roots: sum(len(clusters[x]) + len(extra.get(x, [])) for x in roots)
                col = max(by_col, key=lambda c: size(by_col[c]))
                roots = sorted(by_col[col]); keep = roots[0]
                for x in roots[1:]:
                    parent[x] = keep
                    extra.setdefault(keep, []).extend(clusters[x] + extra.pop(x, []))
                    clusters[x] = []
                extra.setdefault(keep, []).append((r, s))
                j.cl = keep
        out = [clusters[i] + extra.get(i, []) if parent[i] == i else [] for i in range(len(clusters))]
        for i, cells in enumerate(out):
            for (cr, cs) in cells:
                G[cr][cs].cl = i
        return out

    def apply_magnet(self, dt):
        L = self.upg['magnet']; tgt = [0.0] * RINGS
        if L > 0:
            G = self.grid
            for r in range(RINGS - 1):
                for s in range(SLOTS):
                    b = G[r][s]
                    if not b or b.special or b.joker or not settled(b):
                        continue
                    a = self.slot_ang(r, s); t2 = self.closest(r + 1, a); b2 = G[r + 1][t2]
                    if not b2 or b2.special or b2.joker or b2.c != b.c or not settled(b2):
                        continue
                    f = -math.sin(wrapA(self.slot_ang(r + 1, t2) - a) * TAU / DA)
                    tgt[r + 1] += f; tgt[r] -= f
            k, mx = 0.045 * L, 0.032 * L
            tgt = [max(-mx, min(mx, t * k)) for t in tgt]
        for r in range(RINGS):
            self.ring_mag[r] += (tgt[r] - self.ring_mag[r]) * min(1, dt * 5)

    # -------------------------------------------------------------- actions
    def bump_combo(self):
        self.combo = self.combo + 1 if self.combo_t > 0 else 1
        t = TUNING
        lv = self.upg['combo']
        self.combo_t = max(t['combo_min'] + 0.05 * lv, t['combo_window'] + 0.1 * lv - t['combo_decay'] * (self.combo - 1))
        self.combo_mults.append(combo_mul(self.combo))
        self.max_combo = max(self.max_combo, self.combo)

    def add_gems(self, g):
        if g > 0:
            self.gem_frac += g * TUNING['gem_rate']
            whole = int(self.gem_frac); self.gems += whole; self.gem_frac -= whole

    def add_score(self, base, pts):
        # pts is computed by the caller in index.html's exact multiplication order (float rounding parity)
        self.base_score += base
        self.score += pts

    def add_stab(self, x):
        # refills cap at 100 but never cut a Core Shield overflow above it
        self.stability = max(self.stability, min(100, self.stability + x))

    def unlock_around(self, cells):
        tol = tolerance(self.upg['magnet'])
        for (r, s) in cells:
            for (nr, ns) in self.neighbours(r, s, tol):
                nb = self.grid[nr][ns]
                if nb and nb.locked:
                    nb.locked = False

    def do_blast(self, cells, tap):
        n, m = len(cells), mult_of(self.upg['mult'])
        self.bump_combo()
        cm = combo_mul(self.combo)
        self.add_score(n * n * 10 * cm, js_round(n * n * 10 * cm * m)); self.blasts += 1
        self.add_stab(3 + n * 2.4 + min(self.combo - 1, 4) * 0.5)
        col = next((self.grid[r][s].c for (r, s) in cells if not self.grid[r][s].joker), 0)
        if TUNING['content']:
            self.unlock_around(cells)
        for (r, s) in cells:
            self.grid[r][s] = None
        self.add_gems(js_round(max(1, (n - 2) * 0.6) * gem_mult(self.upg['mult'])))
        self.cluster_sizes.append(n)
        if TUNING['content'] and n >= CONTENT['cbomb_n']:
            b = Block(col); b.cb = True
            self.grid[tap[0]][tap[1]] = b; self.cbombs += 1
        elif n >= 6 - self.upg['bomb']:
            self.grid[tap[0]][tap[1]] = Block(-1, True); self.bombs_made += 1
        self.settle()

    def do_bomb(self, r):
        m, n = mult_of(self.upg['mult']), 0
        for k in range(SLOTS):
            if self.grid[r][k]:
                n += 1; self.grid[r][k] = None
        self.bump_combo(); self.blasts += 1; self.bombs_used += 1
        cm = combo_mul(self.combo)
        self.add_score(n * 55 * cm, js_round(n * 55 * m * cm))
        self.add_stab(TUNING['bomb_refill'])
        self.add_gems(js_round(4 * gem_mult(self.upg['mult'])))
        self.settle()

    def do_cbomb(self, r, s):
        C = CONTENT
        m = mult_of(self.upg['mult']); col = self.grid[r][s].c
        cells = [(rr, ss) for rr in range(RINGS) for ss in range(SLOTS)
                 if self.grid[rr][ss] and not self.grid[rr][ss].special and self.grid[rr][ss].c == col]
        cells.append((r, s))
        n = len(cells)
        self.unlock_around(cells)
        for (rr, ss) in cells:
            self.grid[rr][ss] = None
        self.bump_combo(); self.blasts += 1
        cm = combo_mul(self.combo)
        self.add_score(n * C['cbomb_score'] * cm, js_round(n * C['cbomb_score'] * m * cm))
        self.add_stab(C['cbomb_refill'] + C['cbomb_refill_n'] * n)
        self.add_gems(js_round(C['cbomb_gems'] * gem_mult(self.upg['mult'])))
        self.settle()

    def wave_up(self):
        self.wave += 1
        self.add_stab(15)
        self.add_gems(2 + self.wave // 2)
        C = CONTENT
        if TUNING['content'] and self.wave % C['boss_every'] == 0:
            self.boss_t = C['boss_secs']; self.boss_ring = (self.wave // C['boss_every']) % RINGS

    # -------------------------------------------------------------- bot decision
    def decide(self):
        G = self.grid
        specials = [(r, s) for r in range(RINGS) for s in range(SLOTS)
                    if G[r][s] and G[r][s].special and settled(G[r][s])]
        if specials and self.rng.random() < self.bot['bomb_p']:
            specials.sort(key=lambda p: not G[p[0]][p[1]].bomb)   # vortex bombs first
            r, s = specials[0]
            self.pending = ('bomb', r) if G[r][s].bomb else ('cbomb', r, s)
            self.hit_stop = 0.05
            return True
        self.compute_clusters()
        ready = [c for c in self.clusters if len(c) >= 3]
        if not ready:
            return False
        p = self.bot['pick']
        if p == 'largest':
            cl = max(ready, key=len)
        elif p == 'weighted':
            cl = self.rng.choices(ready, weights=[len(c) for c in ready])[0]
        else:
            cl = self.rng.choice(ready)
        self.pending = ('cluster', list(cl), self.rng.choice(cl)); self.hit_stop = 0.030
        return True

    # -------------------------------------------------------------- frame
    def step(self, dt):
        if self.hit_stop > 0:
            self.hit_stop -= dt
            if self.hit_stop <= 0:
                self.hit_stop = 0
                p, self.pending = self.pending, None
                if p[0] == 'cluster':
                    self.do_blast(p[1], p[2])
                elif p[0] == 'bomb':
                    self.do_bomb(p[1])
                else:
                    self.do_cbomb(p[1], p[2])
            return
        self.sim_t += dt
        self.apply_magnet(dt)
        for r in range(RINGS):
            self.ring_ang[r] = (self.ring_ang[r] + (self.ring_speed(r) + self.ring_mag[r]) * dt) % TAU
        steps = 2 if dt > 0.018 else 1
        h = dt / steps
        for row in self.grid:
            for b in row:
                if not b or (b.dr == 0 and b.vr == 0 and b.da == 0 and b.va == 0):
                    continue
                for _ in range(steps):
                    b.vr += (-SPRING_K * b.dr - SPRING_C * b.vr) * h; b.dr += b.vr * h
                    b.va += (-SPRING_K * b.da - SPRING_C * b.va) * h; b.da += b.va * h
                if abs(b.dr) < 1e-4 and abs(b.vr) < 1e-3 and abs(b.da) < 1e-6 and abs(b.va) < 1e-5:
                    b.dr = b.vr = b.da = b.va = 0.0
        # play state
        self.time_alive += dt
        self.wave_t[self.wave] = self.wave_t.get(self.wave, 0) + dt
        self.stability -= drain_rate(self.wave, self.time_alive) * dt
        if self.boss_t > 0:
            self.boss_t -= dt
            if self.boss_t <= 0:
                self.bosses += 1
                self.add_gems(CONTENT['boss_gems'])
        w = self.wave
        self.min_stab_by_wave[w] = min(self.min_stab_by_wave.get(w, 100), self.stability)
        if self.combo_t > 0:
            self.combo_t -= dt
            if self.combo_t <= 0:
                self.combo = 0
        prog = self.base_score if TUNING['wave_from_base_score'] else self.score
        if prog >= wave_score(self.wave):
            self.wave_up()
        if self.stability <= 0:
            self.stability = 0; self.alive = False
            return
        self.next_tap -= dt
        if self.next_tap <= 0 and self.decide():
            self.next_tap = self._interval()


def play_run(upg, bot, seed, dt=1 / 30, max_t=900):
    g = Game(upg, random.Random(seed), bot)
    while g.alive and g.time_alive < max_t:
        g.step(dt)
    return g
