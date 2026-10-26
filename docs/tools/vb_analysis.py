"""Generates every numeric table used in docs/ (GDD §5-6, Appendix C, Roadmap gates).

Run from this folder:   python vb_analysis.py
Writes:                 out/*.md (markdown tables, embedded verbatim in the docs) + out/summary.json
Deterministic: fixed seeds, so re-running reproduces the exact numbers in the docs.
"""
import json
import os
import statistics as st

import vb_model as m

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
os.makedirs(OUT, exist_ok=True)
summary = {}

NONE = {'magnet': 0, 'bomb': 0, 'mult': 0}
MID = {'magnet': 2, 'bomb': 1, 'mult': 4}
MAX = {'magnet': 5, 'bomb': 2, 'mult': 10}
CAP = 900  # simulated run cap (s); a run reaching it counts as "never dies"


def write(name, text):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        f.write(text.rstrip() + '\n')


def pct(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(round(p / 100 * (len(xs) - 1))))]


def fmt(x, d=0):
    return f'{x:,.{d}f}'


# ---------------------------------------------------------------- 1. upgrade costs
rows, total = [], 0
for key, (mx, cost) in m.UPGRADES.items():
    cum = 0
    for l in range(mx):
        c = cost(l); cum += c
        rows.append(f'| {key} | {l} → {l + 1} | {fmt(c)} | {fmt(cum)} |')
    summary[f'cost_total_{key}'] = cum
    total += cum
summary['cost_total_all'] = total
write('upgrade_costs.md', '| Upgrade | Seviye | Maliyet (gem) | Kümülatif |\n|---|---|---:|---:|\n' + '\n'.join(rows) +
      f'\n| **TOPLAM** | | | **{fmt(total)}** |')

# ---------------------------------------------------------------- 2. simulated runs per bot × upgrade set
RUNS = {'novice': 200, 'casual': 200, 'skilled': 40}
sim = {}
lines = []
for cfg_name, cfg in (('none', NONE), ('mid', MID), ('max', MAX)):
    for bot, n in RUNS.items():
        gs = [m.play_run(cfg, bot, seed=1000 + i, max_t=CAP) for i in range(n)]
        dur = [g.time_alive for g in gs]
        rec = dict(
            runs=n,
            dur_med=st.median(dur), dur_p10=pct(dur, 10), dur_p90=pct(dur, 90),
            capped=sum(1 for g in gs if g.alive) / n,
            wave_med=st.median([g.wave for g in gs]),
            score_med=st.median([g.score for g in gs]),
            gems_mean=st.mean([g.gems for g in gs]),
            gems_per_min=st.mean([g.gems / (g.time_alive / 60) for g in gs]),
            blasts_med=st.median([g.blasts for g in gs]),
            taps_per_s=st.mean([g.blasts / g.time_alive for g in gs]),
            avg_n=st.mean([x for g in gs for x in g.cluster_sizes]),
            bombs_med=st.median([g.bombs_used for g in gs]),
            max_combo_med=st.median([g.max_combo for g in gs]),
        )
        sim[(cfg_name, bot)] = (rec, gs)
        summary[f'sim_{cfg_name}_{bot}'] = rec
        lines.append(
            f"| {cfg_name} | {bot} | {n} | {fmt(rec['dur_med'])} ({fmt(rec['dur_p10'])}–{fmt(rec['dur_p90'])}) | "
            f"{rec['capped'] * 100:.0f}% | {rec['wave_med']:g} | {fmt(rec['score_med'])} | {fmt(rec['gems_mean'], 1)} | "
            f"{fmt(rec['gems_per_min'], 1)} | {rec['taps_per_s']:.2f} | {rec['avg_n']:.2f} | {rec['bombs_med']:g} | {rec['max_combo_med']:g} |")
write('sim_runs.md',
      '| Upgrade seti | Bot | Run | Süre sn medyan (p10–p90) | 900 sn tavanı | Dalga medyan | Skor medyan | Gem/run ort. | Gem/dk | Blast/sn | Ort. küme | Bomba/run | Max combo |\n'
      '|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n' + '\n'.join(lines))

# ---------------------------------------------------------------- 3. wave table 1–20 (formulas + casual-bot empirics)
_, casual = sim[('none', 'casual')]
rec_c = summary['sim_none_casual']
deaths = {}
for g in casual:
    if not g.alive:
        deaths[g.wave] = deaths.get(g.wave, 0) + 1
reached = {w: sum(1 for g in casual if g.wave >= w) for w in range(1, 21)}
lines = []
for w in range(1, 21):
    need = m.wave_score(w); prev = m.wave_score(w - 1) if w > 1 else 0
    drain = min(20, 7 + (w - 1) * 1.15)
    ts = [g.wave_t[w] for g in casual if w in g.wave_t and g.wave > w]   # completed waves only
    t_med = fmt(st.median(ts), 1) if len(ts) >= 5 else '—'
    hz = deaths.get(w, 0) / reached[w] if reached[w] else 0
    # stability per second gained from blasts needed to break even, at the casual bot's avg cluster size
    refill = 3 + rec_c['avg_n'] * 2.4 + 0.5 * 2   # [VARSAYIM] typical combo bonus ≈ +1.0
    lines.append(f'| {w} | {fmt(need - prev)} | {fmt(need)} | {drain:.2f} | {m.ring_speed_factor(w):.2f} | '
                 f'{drain / refill:.2f} | {t_med} | {reached[w]} | {hz * 100:.0f}% |')
summary['wave_reached_casual'] = reached
summary['deaths_by_wave_casual'] = deaths
write('wave_table.md',
      '| Dalga | Bu dalga için skor | Kümülatif eşik (`waveScore`) | Drain %/sn | Halka hız çarpanı | Başabaş blast/sn* | Casual: dalgada geçen sn (medyan) | Casual: ulaşan run (/200) | Casual: bu dalgada ölüm oranı |\n'
      '|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n' + '\n'.join(lines) +
      f"\n\n\\* Başabaş blast/sn = drain ÷ blast başına ortalama stability dolumu (3 + n·2.4 + ~1.0 combo bonusu; n = {rec_c['avg_n']:.2f}, casual bot ortalaması). `[VARSAYIM]` combo bonusu ≈ +1.0.")

# ---------------------------------------------------------------- 4. progression: runs until every upgrade is maxed
def progression(bot, seed):
    upg = dict(NONE); gems = 0; t = 0.0; runs = 0; first_buy = None; milestones = {}
    while any(upg[k] < m.UPGRADES[k][0] for k in upg) and runs < 400:
        g = m.play_run(upg, bot, seed=seed * 1000 + runs, max_t=CAP)
        runs += 1; t += g.time_alive; gems += g.gems
        bought = True
        while bought:  # greedy: buy the cheapest affordable upgrade, repeat ([VARSAYIM] player policy)
            opts = [(m.UPGRADES[k][1](upg[k]), k) for k in upg if upg[k] < m.UPGRADES[k][0]]
            opts = [o for o in opts if o[0] <= gems]
            bought = bool(opts)
            if bought:
                c, k = min(opts); gems -= c; upg[k] += 1
                first_buy = first_buy or runs
                for kk in upg:
                    if upg[kk] == m.UPGRADES[kk][0] and kk not in milestones:
                        milestones[kk] = runs
    return dict(runs=runs, minutes=t / 60, first_buy=first_buy, **{f'max_{k}': v for k, v in milestones.items()})


prog = {}
lines = []
for bot, seeds in (('novice', 12), ('casual', 12)):
    res = [progression(bot, s) for s in range(1, seeds + 1)]
    r = {k: st.median([x[k] for x in res if k in x]) for k in ('runs', 'minutes', 'first_buy', 'max_bomb', 'max_magnet', 'max_mult')}
    prog[bot] = r
    lines.append(f"| {bot} | {seeds} | {r['first_buy']:g} | {r['max_bomb']:g} | {r['max_magnet']:g} | {r['max_mult']:g} | "
                 f"**{r['runs']:g}** | {fmt(r['minutes'])} dk ({r['minutes'] / 60:.1f} sa) |")
summary['progression'] = prog
write('progression.md',
      '| Bot | Tohum | İlk satın alma (run #) | Bomb maks. (run #) | Magnet maks. (run #) | Mult maks. (run #) | Tümü maks. (run) | Toplam oyun süresi |\n'
      '|---|---:|---:|---:|---:|---:|---:|---:|\n' + '\n'.join(lines) +
      '\n\nPolitika `[VARSAYIM]`: her run sonunda alınabilen en ucuz upgrade alınır (tekrarlı). Değerler tohumlar üzerinden medyandır.')

with open(os.path.join(OUT, 'summary.json'), 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=1, default=str)
print('ok ->', OUT)
for name in ('upgrade_costs.md', 'sim_runs.md', 'wave_table.md', 'progression.md'):
    print('\n##', name); print(open(os.path.join(OUT, name), encoding='utf-8').read())
