"""AS-BUILT vs PROPOSED tuning comparison (GDD §3, §5, §6; backlog F-019 / F-044).

Run from this folder:  python vb_proposed.py      → out/tuning_compare.md, out/progression_compare.md
Same bots and seeds as vb_analysis.py; fewer runs to keep runtime short.
"""
import os
import statistics as st

import vb_model as m

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
os.makedirs(OUT, exist_ok=True)
NONE = {'magnet': 0, 'bomb': 0, 'mult': 0}
MAX = {'magnet': 5, 'bomb': 2, 'mult': 10}
CAP = 900
RUNS = {'novice': 100, 'casual': 100, 'skilled': 20}


def pct(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(round(p / 100 * (len(xs) - 1))))]


def use(tuning):
    m.TUNING.clear(); m.TUNING.update(tuning)


lines = []
for tname, tuning in (('AS-BUILT', m.AS_BUILT), ('ÖNERİ', m.PROPOSED)):
    use(tuning)
    for cname, cfg in (('none', NONE), ('max', MAX)):
        for bot, n in RUNS.items():
            gs = [m.play_run(cfg, bot, seed=1000 + i, max_t=CAP) for i in range(n)]
            d = [g.time_alive for g in gs]
            lines.append(f"| {tname} | {cname} | {bot} | {st.median(d):,.0f} ({pct(d, 10):,.0f}–{pct(d, 90):,.0f}) | "
                         f"{sum(1 for g in gs if g.alive) / n * 100:.0f}% | {st.median([g.wave for g in gs]):g} | "
                         f"{st.mean([g.gems for g in gs]):,.1f} | {st.median([g.max_combo for g in gs]):g} |")
with open(os.path.join(OUT, 'tuning_compare.md'), 'w', encoding='utf-8') as f:
    f.write('| Tuning | Upgrade | Bot | Süre sn medyan (p10–p90) | 900 sn tavanı | Dalga medyan | Gem/run ort. | Max combo medyan |\n'
            '|---|---|---|---|---:|---:|---:|---:|\n' + '\n'.join(lines) + '\n')


def progression(bot, seed):
    upg = dict(NONE); gems = 0; t = 0.0; runs = 0
    while any(upg[k] < m.UPGRADES[k][0] for k in upg) and runs < 600:
        g = m.play_run(upg, bot, seed=seed * 1000 + runs, max_t=CAP)
        runs += 1; t += g.time_alive; gems += g.gems
        while True:
            opts = [(m.UPGRADES[k][1](upg[k]), k) for k in upg if upg[k] < m.UPGRADES[k][0]]
            opts = [o for o in opts if o[0] <= gems]
            if not opts:
                break
            c, k = min(opts); gems -= c; upg[k] += 1
    return runs, t / 60


plines = []
for tname, tuning in (('AS-BUILT', m.AS_BUILT), ('ÖNERİ', m.PROPOSED)):
    use(tuning)
    for bot in ('novice', 'casual'):
        res = [progression(bot, s) for s in range(1, 7)]
        r = st.median([x[0] for x in res]); mins = st.median([x[1] for x in res])
        capped = ' (600 run sınırı)' if r >= 600 else ''
        plines.append(f'| {tname} | {bot} | {r:g}{capped} | {mins:,.0f} dk ({mins / 60:.1f} sa) |')
with open(os.path.join(OUT, 'progression_compare.md'), 'w', encoding='utf-8') as f:
    f.write('| Tuning | Bot | Tüm upgrade maks. (run, medyan) | Toplam oyun süresi |\n|---|---|---:|---:|\n' + '\n'.join(plines) +
            '\n\n6 tohum; politika: her run sonu en ucuz alınabilir upgrade (tekrarlı) `[VARSAYIM]`.\n')
use(m.AS_BUILT)
for n in ('tuning_compare.md', 'progression_compare.md'):
    print(open(os.path.join(OUT, n), encoding='utf-8').read())
