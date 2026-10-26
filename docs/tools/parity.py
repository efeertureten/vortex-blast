"""Model ↔ game parity test (backlog F-035 part 2).

    python parity.py         # exit 0 when every case matches

For each case the real game (headless Chrome, ?debug=1) and vb_model.Game (FINAL tuning) start from the same
seed and ring angles, remove the same cells, run settle() and compare every slot: colour, prism, locked.
That covers the shared pieces the balance numbers rest on: mulberry32, board fill, closest-slot gravity,
spawnColor (incl. neighbour copy) and the prism/lock roll.
"""
import html
import json
import os
import random
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import vb_model as m          # noqa: E402
from smoke import CHROME, GAME  # noqa: E402

ANGLES = [0.4, 1.3, -0.7, 2.2]
CASES = [
    dict(seed=1, wave=1, remove=[[0, 0], [0, 1], [0, 2]]),
    dict(seed=2, wave=3, remove=[[0, 5], [1, 5], [2, 5], [3, 5]]),
    dict(seed=3, wave=5, remove=[[r, s] for r in range(2) for s in range(12)]),
    dict(seed=4, wave=12, remove=[[0, s] for s in range(0, 12, 2)] + [[2, 3], [3, 7]]),
    dict(seed=99, wave=20, remove=[[r, s] for r in range(4) for s in range(12) if (r + s) % 3 == 0]),
]

PROBE = r"""<script>
addEventListener('load', () => setTimeout(() => {
  const V = window.__vortex, out = [];
  for (const c of __CASES__) {
    V.seedRng(c.seed); V.fillBoardFresh(false);
    V.ringAng.splice(0, 4, ...__ANGLES__); V.setWave(c.wave);
    for (const [r, s] of c.remove) V.grid[r][s] = null;
    V.settle();
    out.push(V.grid.map(row => row.map(b => b ? (b.joker ? 'J' : (b.locked ? 'L' : '') + b.c) : '.').join(' ')));
  }
  document.title = 'RESULT ' + JSON.stringify(out);
}, 500));
</script>"""


def model_case(c):
    m.TUNING.clear(); m.TUNING.update(m.FINAL)
    g = m.Game({}, random.Random(0), 'casual', color_seed=c['seed'])
    g.ring_ang = list(ANGLES); g.wave = c['wave']
    for r, s in c['remove']:
        g.grid[r][s] = None
    g.settle()
    return [' '.join(('J' if b.joker else ('L' if b.locked else '') + str(b.c)) if b else '.' for b in row) for row in g.grid]


def main():
    src = open(GAME, encoding='utf-8').read()
    probe = PROBE.replace('__CASES__', json.dumps(CASES)).replace('__ANGLES__', json.dumps(ANGLES))
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'parity.html')
        open(path, 'w', encoding='utf-8').write(src.replace('</body>', probe + '</body>', 1))
        p = subprocess.run([CHROME, '--headless=new', '--no-first-run', '--disable-gpu', f'--user-data-dir={tmp}/prof',
                            '--virtual-time-budget=5000', '--dump-dom', 'file:///' + path.replace('\\', '/') + '?debug=1'],
                           capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=120)
    mt = re.search(r'<title>RESULT (.*?)</title>', p.stdout, re.S)
    if not mt:
        print('FAIL  no result from the game page'); return 1
    js = json.loads(html.unescape(mt.group(1)))
    bad = 0
    for i, c in enumerate(CASES):
        py = model_case(c)
        ok = py == js[i]
        bad += not ok
        print(f"{'PASS' if ok else 'FAIL'}  seed {c['seed']:>3} wave {c['wave']:>2} remove {len(c['remove']):>2} cells")
        if not ok:
            for r in range(4):
                print(f'      ring {r}  js: {js[i][r]}\n              py: {py[r]}')
    print('\nOK' if not bad else f'\n{bad} case(s) differ')
    return 1 if bad else 0


if __name__ == '__main__':
    m.TUNING.update(m.FINAL)
    sys.exit(main())
