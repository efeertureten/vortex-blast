"""Vortex Blast gameplay model: a headless Python port of the gameplay rules in ../../index.html.

Ported 1:1 (same constants and formulas): ring rotation (RSPEC/ringSpeed), block springs
(SPRING_K/SPRING_C, only dr/da: scale/jelly are cosmetic), isSettled, computeClusters (incl. radial
tolerance), applyMagnet, settle/moveBlock/spawnColor, doBlast, doBomb, waveUp, drainRate, combo.
Not ported (cosmetic only): particles, banners, sound, glow/jelly/wobble, rendering.

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


# Tuning knobs. AS_BUILT reproduces index.html exactly; PROPOSED is the GDD §3/§5 [ÖNERİ] set.
AS_BUILT = dict(
    wave_from_base_score=False,   # True: wave thresholds use score before the Gem&Score multiplier
    bomb_refill=20,               # doBomb stability gain
    drain_cap=20, drain_post=0.0, # drain = min(cap, 7+1.15(w-1)) [+ drain_post per wave after cap]
    gem_rate=1.0,                 # global scale on every gem source (fractional gems accumulate)
    combo_window=COMBO_WINDOW,
)
# bomb_refill stays 20: a sweep (12/16/20) showed 12 makes a bomb worth less stability than a normal
# blast, so the Bomb Threshold upgrade *shortened* runs; the post-cap drain alone ends endless runs.
PROPOSED = dict(AS_BUILT, wave_from_base_score=True, bomb_refill=20, drain_cap=24, drain_post=0.6,
                gem_rate=0.15, combo_window=1.3)
TUNING = dict(AS_BUILT)


def js_round(x):
    return math.floor(x + 0.5)


def ring_mid(r):
    return RING_IN[r] + RING_T / 2


def wrapA(a):
    return (a + math.pi) % TAU - math.pi


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


class Block:
    __slots__ = ('c', 'bomb', 'dr', 'vr', 'da', 'va', 'cl', 'ready')

    def __init__(self, c, bomb=False):
        self.c, self.bomb = c, bomb
        self.dr = self.vr = self.da = self.va = 0.0
        self.cl, self.ready = -1, False


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
    def __init__(self, upg, rng, bot):
        self.upg, self.rng, self.bot = dict(upg), rng, BOTS[bot]
        self.grid = [[Block(rng.randrange(4)) for _ in range(SLOTS)] for _ in range(RINGS)]
        self.ring_ang = [0, 0.26, 0.1, 0.4]
        self.ring_mag = [0.0] * RINGS
        self.sim_t = rng.uniform(0, 60)          # the title screen runs the vortex before PLAY
        self.score = 0; self.base_score = 0; self.stability = 100.0; self.wave = 1
        self.gem_frac = 0.0
        self.combo = 0; self.combo_t = 0.0; self.max_combo = 0
        self.gems = 0; self.blasts = 0; self.bombs_made = 0; self.bombs_used = 0
        self.time_alive = 0.0; self.hit_stop = 0.0; self.pending = None
        self.cluster_sizes = []
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
        return (a + b * math.sin(self.sim_t * f + p)) * ring_speed_factor(self.wave)

    # -------------------------------------------------------------- board rules
    def spawn_color(self, s):
        g = self.grid[RINGS - 1]
        if self.rng.random() < 0.22:
            nb = g[(s + SLOTS - 1) % SLOTS] or g[(s + 1) % SLOTS]
            if nb and not nb.bomb:
                return nb.c
        return self.rng.randrange(4)

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
                    b = Block(self.spawn_color(s))
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
                if not b or b.bomb or b.cl != -1 or not settled(b):
                    continue
                idx, col, cells, st = len(clusters), b.c, [], [(r, s)]
                b.cl = idx
                while st:
                    cr, cs = st.pop(); cells.append((cr, cs))
                    a = self.slot_ang(cr, cs)
                    for ns in ((cs + 1) % SLOTS, (cs + SLOTS - 1) % SLOTS):
                        nb = G[cr][ns]
                        if nb and not nb.bomb and nb.c == col and nb.cl == -1 and settled(nb):
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
                            if not nb or nb.bomb or nb.c != col or not settled(nb):
                                continue
                            if nb.cl == -1:
                                nb.cl = idx; st.append((nr, t2))
                clusters.append(cells)
                if len(cells) >= 3:
                    for (cr, cs) in cells:
                        G[cr][cs].ready = True
        self.clusters = clusters

    def apply_magnet(self, dt):
        L = self.upg['magnet']; tgt = [0.0] * RINGS
        if L > 0:
            G = self.grid
            for r in range(RINGS - 1):
                for s in range(SLOTS):
                    b = G[r][s]
                    if not b or b.bomb or not settled(b):
                        continue
                    a = self.slot_ang(r, s); t2 = self.closest(r + 1, a); b2 = G[r + 1][t2]
                    if not b2 or b2.bomb or b2.c != b.c or not settled(b2):
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
        self.combo_t = TUNING['combo_window']
        self.max_combo = max(self.max_combo, self.combo)

    def add_gems(self, g):
        if g > 0:
            self.gem_frac += g * TUNING['gem_rate']
            whole = int(self.gem_frac); self.gems += whole; self.gem_frac -= whole

    def add_score(self, base, pts):
        # pts is computed by the caller in index.html's exact multiplication order (float rounding parity)
        self.base_score += base
        self.score += pts

    def do_blast(self, cells, tap):
        n, m = len(cells), mult_of(self.upg['mult'])
        self.bump_combo()
        cm = combo_mul(self.combo)
        self.add_score(n * n * 10 * cm, js_round(n * n * 10 * cm * m)); self.blasts += 1
        self.stability = min(100, self.stability + 3 + n * 2.4 + min(self.combo - 1, 4) * 0.5)
        for (r, s) in cells:
            self.grid[r][s] = None
        self.add_gems(js_round(max(1, (n - 2) * 0.6) * m))
        self.cluster_sizes.append(n)
        if n >= 6 - self.upg['bomb']:
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
        self.stability = min(100, self.stability + TUNING['bomb_refill'])
        self.add_gems(js_round(4 * m))
        self.settle()

    def wave_up(self):
        self.wave += 1
        self.stability = min(100, self.stability + 15)
        self.add_gems(2 + self.wave // 2)

    # -------------------------------------------------------------- bot decision
    def decide(self):
        G = self.grid
        bombs = [(r, s) for r in range(RINGS) for s in range(SLOTS) if G[r][s] and G[r][s].bomb and settled(G[r][s])]
        if bombs and self.rng.random() < self.bot['bomb_p']:
            r, s = bombs[0]
            self.pending = ('bomb', r); self.hit_stop = 0.05
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
                else:
                    self.do_bomb(p[1])
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
