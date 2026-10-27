"""Builds docs/dashboard.html: one screen fed by every output in docs/.

Run from this folder after the other scripts:   python build_dashboard.py
Reads: out/*.md (script tables), ../feature_backlog.csv, ../00_RESEARCH.md, ../01_GDD.md,
       ../03_ROADMAP.md, ../README.md  →  embeds them as JSON into dashboard_template.html.
"""
import csv
import datetime as dt
import hashlib
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(HERE)
ROOT = os.path.dirname(DOCS)


def read(*p):
    return open(os.path.join(*p), encoding='utf-8').read()


def clean(s):
    s = s.replace('\\|', '|').replace('**', '').replace('`', '').strip()
    return re.sub(r'\s+', ' ', s)


def split_row(line):
    cells = re.split(r'(?<!\\)\|', line.strip())[1:-1]
    return [clean(c) for c in cells]


def tables(md):
    """[(heading, [dict rows])] for every markdown table, keyed by the nearest heading above it."""
    out, head, lines = [], '', md.split('\n')
    i = 0
    while i < len(lines):
        l = lines[i]
        if l.startswith('#'):
            head = clean(l.lstrip('#'))
        if l.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:|-]+\|$', lines[i + 1].strip()):
            cols = split_row(l); rows = []; i += 2
            while i < len(lines) and lines[i].startswith('|'):
                c = split_row(lines[i])
                rows.append(dict(zip(cols, c + [''] * (len(cols) - len(c)))))
                i += 1
            out.append((head, rows))
            continue
        i += 1
    return out


def first(md, key):
    for h, rows in tables(md):
        if key in h:
            return rows
    raise KeyError(key)


def num(s):
    s = clean(str(s)).replace(',', '').replace('%', '').replace('—', '')
    try:
        return float(s)
    except ValueError:
        return None


def rng(s):  # "84 (65–104)" -> (84, 65, 104)
    m = re.match(r'([\d,.]+) \(([\d,.]+)–([\d,.]+)\)', clean(s))
    return [num(m.group(1)), num(m.group(2)), num(m.group(3))]


def out_table(name):
    return tables(read(HERE, 'out', name))[0][1]


D = {}
D['generated'] = dt.datetime.now().strftime('%Y-%m-%d %H:%M')
D['today'] = dt.date.today().isoformat()
D['hash'] = {f: hashlib.sha256(open(os.path.join(ROOT, f), 'rb').read()).hexdigest()[:16].upper()
             for f in ('index.html', 'README.md')}

D['upgradeCosts'] = [dict(key=r['Upgrade'], step=r['Seviye'], cost=num(r['Maliyet (gem)']), cum=num(r['Kümülatif']))
                     for r in out_table('upgrade_costs.md') if r['Upgrade'] != 'TOPLAM']
D['upgradeTotal'] = sum(r['cost'] for r in D['upgradeCosts'])

D['sim'] = []
for r in out_table('sim_runs.md'):
    med, p10, p90 = rng(r['Süre sn medyan (p10–p90)'])
    D['sim'].append(dict(cfg=r['Upgrade seti'], bot=r['Bot'], runs=num(r['Run']), dur=med, p10=p10, p90=p90,
                         capped=num(r['900 sn tavanı']), wave=num(r['Dalga medyan']), score=num(r['Skor medyan']),
                         gems=num(r['Gem/run ort.']), gemsMin=num(r['Gem/dk']), bps=num(r['Blast/sn']),
                         avgN=num(r['Ort. küme']), bombs=num(r['Bomba/run']), combo=num(r['Max combo'])))

D['waves'] = [dict(wave=num(r['Dalga']), need=num(r['Bu dalga için skor']), cum=num(r['Kümülatif eşik (waveScore)']),
                   drain=num(r['Drain %/sn']), speed=num(r['Halka hız çarpanı']), breakeven=num(r['Başabaş blast/sn*']),
                   tMed=num(r['Casual: dalgada geçen sn (medyan)']), reached=num(r['Casual: ulaşan run (/200)']),
                   death=num(r['Casual: bu dalgada ölüm oranı']))
              for r in out_table('wave_table.md')]

D['progression'] = [dict(bot=r['Bot'], runs=num(r['Tümü maks. (run)']), firstBuy=num(r['İlk satın alma (run #)']),
                         bomb=num(r['Bomb maks. (run #)']), magnet=num(r['Magnet maks. (run #)']),
                         mult=num(r['Mult maks. (run #)']), minutes=num(r['Toplam oyun süresi'].split(' dk')[0]))
                    for r in out_table('progression.md')]

D['tuning'] = []
for r in out_table('tuning_compare.md'):
    med, p10, p90 = rng(r['Süre sn medyan (p10–p90)'])
    D['tuning'].append(dict(t=r['Tuning'], cfg=r['Upgrade'], bot=r['Bot'], dur=med, p10=p10, p90=p90,
                            capped=num(r['900 sn tavanı']), wave=num(r['Dalga medyan']), gems=num(r['Gem/run ort.']),
                            combo=num(r['Max combo medyan'])))
D['progCompare'] = [dict(t=r['Tuning'], bot=r['Bot'], runs=num(r['Tüm upgrade maks. (run, medyan)'].split(' ')[0]),
                         minutes=num(r['Toplam oyun süresi'].split(' dk')[0]))
                    for r in out_table('progression_compare.md')]

D['backlog'] = []
for r in csv.DictReader(open(os.path.join(DOCS, 'feature_backlog.csv'), encoding='utf-8-sig')):
    D['backlog'].append(dict(id=r['ID'], name=r['Ad'], cat=r['Kategori'], problem=r['Problem/gerekçe'],
                             solution=r['Çözüm özeti'], kpi=r['Etkilediği KPI'], R=num(r['Reach']), I=num(r['Impact']),
                             C=num(r['Confidence']), E=num(r['Effort (kişi-gün)']), rice=num(r['RICE']),
                             deps=r['Bağımlılıklar'], risk=r['Risk'], accept=r['Kabul kriterleri'],
                             touch=r['Dokunulacak fonksiyonlar/alanlar'], phase=r['Faz'], status=r.get('Durum', '')))

road = read(DOCS, '03_ROADMAP.md')
cap = out_table('capacity.md')
D['phases'] = [dict(p=r['Faz'], name=r['Ad'], effort=num(r['Effort (kişi-gün)']), weeks=num(r['Tamponlu hafta']),
                    measure=num(r['Ölçüm (hafta)']), start=r['Başlangıç'], end=r['Bitiş'])
               for r in cap if re.match(r'^P\d$', r['Faz'])]
later = [r for r in cap if r['Faz'].startswith('Later')][0]
D['laterEffort'] = num(later['Effort (kişi-gün)'])
D['risks'] = [dict(id=r['#'], risk=r['Risk'], p=num(r['Olasılık (1–5)']), i=num(r['Etki (1–5)']), score=num(r['Skor']),
                   mitigation=r['Azaltma']) for r in first(road, 'Risk register')]
D['gates'] = [dict(gate=r['Kapı'], when=r['Zaman'], go=r['Go kriterleri (hepsi)'], nogo=r['No-Go olursa'])
              for r in first(road, 'Go / No-Go')]
D['sprints'] = []
for h, rows in tables(road):
    if h.startswith('Sprint'):
        D['sprints'].append(dict(title=h, tasks=[dict(n=r['#'], task=r['Görev'], feat=r['Feature'], est=num(r['Tahmin']),
                                                     done=r['Bitti tanımı'], status=r.get('Durum', '')) for r in rows]))

gdd = read(DOCS, '01_GDD.md')
D['hypotheses'] = [dict(n=r['#'], h=r['Hipotez'], res=r['Sonuç'], ev=r['Kanıt'])
                   for r in first(gdd, 'Görev hipotezlerinin doğrulanması')]
D['issues'] = [dict(n=r['#'], issue=r['Sorun'], ev=r['Kanıt (Ek C)'], impact=r['Etki'])
               for r in first(gdd, 'Tespit edilen tasarım sorunları')]
D['tuningParams'] = [dict(param=r['Parametre'], asBuilt=r['As-built'], prop=r['Öneri'], why=r['Gerekçe'])
                     for r in first(gdd, 'Önerilen tuning')]
D['adrs'] = []
for m in re.finditer(r'#### (ADR-\d): (.+?)\n(.*?)(?=\n#### |\n---|\n## )', gdd, re.S):
    karar = re.search(r'\*\*Karar:\*\*(.+)', m.group(3))
    D['adrs'].append(dict(id=m.group(1), q=clean(m.group(2)), decision=clean(karar.group(1)) if karar else ''))

res = read(DOCS, '00_RESEARCH.md')
D['benchmarks'] = [dict(metric=r['Metrik'], value=r['Değer'], scope=r['Kapsam / tarih'], src=r['Kaynak'],
                        rel=r['Güvenilirlik']) for r in first(res, 'Benchmark metrikler')]
D['sources'] = [dict(no=r['No'], title=r['Başlık'], url=r['URL'], rel=r['Güvenilirlik notu'])
                for r in first(res, 'Kaynak tablosu')]
D['summary15'] = [clean(re.sub(r'^\d+\.\s*', '', l)) for l in
                  re.search(r'## Yönetici özeti.*?\n\n(.*?)\n\n---', res, re.S).group(1).split('\n') if re.match(r'^\d+\.', l)]
D['kpis'] = [dict(kpi=r['KPI'], target=r['Hedef'], src=r['Kaynak']) for r in first(gdd, 'KPI hedefleri')]
D['assumptions'] = [dict(n=r['#'], a=r['Varsayım'], where=r['Nerede kullanıldı'])
                    for r in first(read(DOCS, 'README.md'), 'Varsayımlar listesi')]

tpl = read(HERE, 'dashboard_template.html')
data = json.dumps(D, ensure_ascii=False).replace('</', '<\\/')
html = tpl.replace('/*__DATA__*/null', data)
open(os.path.join(DOCS, 'dashboard.html'), 'w', encoding='utf-8').write(html)
print('dashboard.html', len(html) // 1024, 'KB;', ', '.join(f'{k}:{len(v)}' for k, v in D.items() if isinstance(v, list)))
