"""FINAL tuning (what index.html implements) — content impact and 6-upgrade progression.

Run from this folder:  python vb_final.py      → out/final_runs.md, out/final_progression.md
Checks the backlog acceptance criteria for F-019/F-020/F-021/F-022/F-025/F-028:
  run length per bot in band, content on vs off within ±15 %, all 6 upgrades ≥ 100 casual runs.
"""
import os
import statistics as st

import vb_model as m

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
os.makedirs(OUT, exist_ok=True)
CAP = 900
NONE = {}
MID = dict(magnet=2, bomb=1, mult=4, combo=1, shield=1, harmony=1)
MAX = {k: v[0] for k, v in m.ALL_UPGRADES.items()}
RUNS = {'novice': 60, 'casual': 60, 'skilled': 20}


def pct(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(round(p / 100 * (len(xs) - 1))))]


def use(**kw):
    m.TUNING.clear(); m.TUNING.update(m.FINAL, **kw)


lines = []
base = {}
for content in (False, True):
    use(content=content)
    for cname, cfg in (('none', NONE), ('mid', MID), ('max', MAX)):
        for bot, n in RUNS.items():
            gs = [m.play_run(cfg, bot, seed=2000 + i, max_t=CAP) for i in range(n)]
            d = [g.time_alive for g in gs]
            med = st.median(d)
            if not content:
                base[(cname, bot)] = med
                delta = ''
            else:
                delta = f'{(med / base[(cname, bot)] - 1) * 100:+.0f}%'
            lines.append(
                f"| {'açık' if content else 'kapalı'} | {cname} | {bot} | {med:,.0f} ({pct(d, 10):,.0f}–{pct(d, 90):,.0f}) | {delta or '—'} | "
                f"{sum(1 for g in gs if g.alive) / n * 100:.0f}% | {st.median([g.wave for g in gs]):g} | "
                f"{st.mean([g.gems for g in gs]):,.1f} | {st.median([g.max_combo for g in gs]):g} | "
                f"{st.mean([g.jokers for g in gs]):.1f} | {st.mean([g.locks for g in gs]):.1f} | "
                f"{st.mean([g.cbombs for g in gs]):.1f} | {st.mean([g.bosses for g in gs]):.1f} |")
with open(os.path.join(OUT, 'final_runs.md'), 'w', encoding='utf-8') as f:
    f.write('| İçerik | Upgrade | Bot | Süre sn medyan (p10–p90) | Fark (içerik açık/kapalı) | 900 sn tavanı | Dalga medyan | Gem/run | Max combo | Joker/run | Kilitli/run | Renk bombası/run | Boss geçildi/run |\n'
            '|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n' + '\n'.join(lines) +
            '\n\nUpgrade setleri: none = hepsi 0; mid = magnet 2, bomb 1, mult 4, combo 1, shield 1, harmony 1; max = hepsi maksimum. '
            'Bot başına 60 run (skilled 20), tohum 2000+.\n')


def progression(bot, seed):
    upg = {k: 0 for k in m.ALL_UPGRADES}; gems = 0; t = 0.0; runs = 0; done3 = None
    while any(upg[k] < m.ALL_UPGRADES[k][0] for k in upg) and runs < 800:
        g = m.play_run(upg, bot, seed=seed * 1000 + runs, max_t=CAP)
        runs += 1; t += g.time_alive; gems += g.gems
        while True:
            opts = [(m.ALL_UPGRADES[k][1](upg[k]), k) for k in upg if upg[k] < m.ALL_UPGRADES[k][0]]
            opts = [o for o in opts if o[0] <= gems]
            if not opts:
                break
            c, k = min(opts); gems -= c; upg[k] += 1
        if done3 is None and all(upg[k] == m.UPGRADES[k][0] for k in m.UPGRADES):
            done3 = runs
    return runs, t / 60, done3


use(content=True)
plines = []
for bot in ('novice', 'casual'):
    res = [progression(bot, s) for s in range(1, 5)]
    r = st.median([x[0] for x in res]); mins = st.median([x[1] for x in res]); d3 = st.median([x[2] or x[0] for x in res])
    plines.append(f'| {bot} | {d3:g} | **{r:g}** | {mins:,.0f} dk ({mins / 60:.1f} sa) |')
total = sum(sum(c(l) for l in range(mx)) for mx, c in m.ALL_UPGRADES.values())
with open(os.path.join(OUT, 'final_progression.md'), 'w', encoding='utf-8') as f:
    f.write(f'| Bot | İlk 3 upgrade maks. (run) | 6 upgrade maks. (run) | Toplam oyun süresi |\n|---|---:|---:|---:|\n' + '\n'.join(plines) +
            f'\n\n6 upgrade toplam maliyeti: {total:,} gem. 4 tohum; politika: her run sonu en ucuz alınabilir upgrade `[VARSAYIM]`.\n')
use()
for n in ('final_runs.md', 'final_progression.md'):
    print(open(os.path.join(OUT, n), encoding='utf-8').read())
