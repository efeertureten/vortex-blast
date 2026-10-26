"""Headless smoke test for index.html (backlog F-035, part 1).

    python smoke.py            # exit 0 when every check passes

Runs the real game in headless Chrome once per scenario, each with a fresh profile (so localStorage starts
from the scenario's preset), and reads the results the injected probe writes into <title>.
Chrome: set CHROME=<path> if it is not in a standard location.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, '..', '..', 'index.html'))
KEY = 'vortexBlast.save.v1'

CANDIDATES = [os.environ.get('CHROME', ''),
              r'C:\Program Files\Google\Chrome\Application\chrome.exe',
              r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              shutil.which('google-chrome') or '', shutil.which('chromium') or '']
CHROME = next((c for c in CANDIDATES if c and os.path.exists(c)), None)

# Runs before the game script: presets storage, captures errors, drives frames from timers so Chrome's
# virtual time advances the game, then performs the scenario's checks and reports them as JSON in <title>.
PROBE = r"""<script>
(() => {
  const SC = __SCENARIO__;
  if (SC.preset !== null) localStorage.setItem(SC.key, SC.preset);
  window.__err = [];
  addEventListener('error', e => __err.push(String(e.message)));
  window.requestAnimationFrame = f => setTimeout(() => f(performance.now()), 16);
  const done = o => { document.title = 'RESULT ' + JSON.stringify(Object.assign({errors: __err}, o)); };
  addEventListener('load', () => setTimeout(() => {
    const V = window.__vortex;
    if (SC.name === 'production') return done({hook: typeof V});
    if (!V) return done({hook: 'undefined'});
    const out = {hook: typeof V, save: JSON.parse(JSON.stringify(V.save)), bak: localStorage.getItem(SC.key + '.bak')};
    if (SC.name !== 'fresh') return done(out);
    // RNG determinism: same seed, same sequence and same board
    V.seedRng(42); const a = Array.from({length: 20}, V.rng);
    V.seedRng(42); const b = Array.from({length: 20}, V.rng);
    out.rngSame = JSON.stringify(a) === JSON.stringify(b);
    const board = () => V.grid.map(r => r.map(x => x.c).join('')).join('|');
    V.seedRng(7); V.fillBoardFresh(false); const b1 = board();
    V.seedRng(7); V.fillBoardFresh(false); out.boardSame = b1 === board();
    // play: start, then tap a ready cluster a few times
    dispatchEvent(new KeyboardEvent('keydown', {code: 'Space'}));
    out.runSeed = V.runSeed;
    let taps = 0;
    const tick = () => {
      const cl = V.clusters.find(c => c.length >= 3);
      if (cl && V.state === 'play') {
        const c = cl[0], w = V.blockWorld(c.r, c.s, V.grid[c.r][c.s]), p = V.toScreen(w.x, w.y);
        document.getElementById('game').dispatchEvent(new PointerEvent('pointerdown', {clientX: p.x, clientY: p.y, bubbles: true}));
        taps++;
      }
      if (taps < 6) return setTimeout(tick, 700);
      setTimeout(() => {
        out.taps = taps; out.score = V.score; out.state = V.state;
        out.saveAfter = JSON.parse(JSON.stringify(V.save));
        done(out);
      }, 1500);
    };
    setTimeout(tick, 800);
  }, 1500));
})();
</script>"""

SCENARIOS = [
    dict(name='fresh', query='?debug=1', preset=None),
    dict(name='v1-migration', query='?debug=1',
         preset=json.dumps({'gems': 123, 'best': 4567, 'upg': {'magnet': 2, 'bomb': 1, 'mult': 3}, 'muted': True})),
    dict(name='corrupt', query='?debug=1', preset='{"gems": 12,'),
    dict(name='future-v3', query='?debug=1', preset=json.dumps({'v': 3, 'gems': 5, 'future': {'x': 1}, 'upg': {'magnet': 9}})),
    dict(name='production', query='', preset=json.dumps({'gems': 1})),
]


def run(sc, tmp):
    src = open(GAME, encoding='utf-8').read()
    page = src.replace('<head>', '<head>' + PROBE.replace('__SCENARIO__', json.dumps(dict(sc, key=KEY))), 1)
    path = os.path.join(tmp, f"{sc['name']}.html")
    open(path, 'w', encoding='utf-8').write(page)
    url = 'file:///' + path.replace('\\', '/') + sc['query']
    prof = os.path.join(tmp, 'prof-' + sc['name'])
    p = subprocess.run([CHROME, '--headless=new', '--no-first-run', '--disable-gpu', f'--user-data-dir={prof}',
                        '--window-size=430,860', '--virtual-time-budget=20000', '--dump-dom', url],
                       capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=180)
    m = re.search(r'<title>RESULT (.*?)</title>', p.stdout, re.S)
    if not m:
        return {'errors': ['no result in page (did the probe run?)']}
    import html
    return json.loads(html.unescape(m.group(1)))


def checks(name, r):
    s = r.get('save', {})
    c = [('no JS errors', r.get('errors') == [])]
    if name == 'production':
        return c + [('window.__vortex absent without ?debug=1', r.get('hook') == 'undefined')]
    c.append(('debug hook present', r.get('hook') == 'object'))
    c.append(('save.v == 2' if name != 'future-v3' else 'save.v kept at 3', s.get('v') == (3 if name == 'future-v3' else 2)))
    if name == 'fresh':
        a = r.get('saveAfter', {})
        c += [('same seed → same RNG sequence', r.get('rngSame') is True),
              ('same seed → same board', r.get('boardSame') is True),
              ('blasts happened (score > 0)', (r.get('score') or 0) > 0 and r.get('taps', 0) > 0),
              ('gems are whole numbers', isinstance(a.get('gems'), int)),
              ('gem fraction carried in [0,1)', 0 <= a.get('gemFrac', -1) < 1)]
    elif name == 'v1-migration':
        c += [('gems/best kept', s.get('gems') == 123 and s.get('best') == 4567),
              ('upgrades kept', s.get('upg') == {'magnet': 2, 'bomb': 1, 'mult': 3}),
              ('muted kept', s.get('muted') is True),
              ('new sections get defaults', s.get('stats', {}).get('runs') == 0 and s.get('settings', {}).get('haptics') is True
               and s.get('history') == [] and s.get('inventory') == {'bomb': 0, 'shield': 0, 'magnet': 0})]
    elif name == 'corrupt':
        c += [('corrupt bytes backed up', r.get('bak') == '{"gems": 12,'), ('starts from defaults', s.get('gems') == 0)]
    elif name == 'future-v3':
        c += [('unknown field preserved', s.get('future') == {'x': 1}),
              ('out-of-range upgrade clamped', s.get('upg', {}).get('magnet') == 5), ('gems kept', s.get('gems') == 5)]
    return c


def main():
    if not CHROME:
        print('Chrome/Edge not found; set CHROME=<path>'); return 2
    failed = 0
    with tempfile.TemporaryDirectory() as tmp:
        for sc in SCENARIOS:
            r = run(sc, tmp)
            for label, ok in checks(sc['name'], r):
                failed += not ok
                print(f"{'PASS' if ok else 'FAIL'}  {sc['name']:<13} {label}")
            if r.get('errors'):
                print('      errors:', r['errors'])
    print(f'\n{"OK" if not failed else str(failed) + " check(s) failed"}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
