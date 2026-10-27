"""Headless smoke test for index.html (backlog F-035).

    python smoke.py            # exit 0 when every check passes

Runs the real game in headless Chrome once per scenario, each with a fresh profile (so localStorage starts
from the scenario's preset), and reads the results the injected probe writes into <title>.
Chrome: set CHROME=<path> if it is not in a standard location.
"""
import html
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
# virtual time advances the game, then runs the scenario's async steps and reports JSON in <title>.
PROBE = r"""<script>
(() => {
  const SC = __SCENARIO__;
  if (SC.preset !== null) localStorage.setItem(SC.key, SC.preset);
  window.__err = [];
  addEventListener('error', e => __err.push(String(e.message) + ' @' + e.lineno));
  window.requestAnimationFrame = f => setTimeout(() => f(performance.now()), 16);
  const done = o => { document.title = 'RESULT ' + JSON.stringify(Object.assign({errors: __err}, o)); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const snap = V => JSON.parse(JSON.stringify(V.save));
  const board = V => V.grid.map(r => r.map(x => x ? (x.joker ? 'J' : x.locked ? 'L' + x.c : x.bomb ? 'B' : x.c) : '.').join('')).join('|');
  async function tapClusters(V, n) {
    let taps = 0;
    for (let i = 0; i < 40 && taps < n; i++) {
      const cl = V.clusters.find(c => c.length >= 3);
      if (cl && V.state === 'play') {
        const c = cl[0], w = V.blockWorld(c.r, c.s, V.grid[c.r][c.s]), p = V.toScreen(w.x, w.y);
        document.getElementById('game').dispatchEvent(new PointerEvent('pointerdown', {clientX: p.x, clientY: p.y, bubbles: true}));
        taps++;
      }
      await wait(600);
    }
    return taps;
  }
  const S = {};
  S.fresh = async V => {
    const o = {consentModal: V.modal};
    V.tapHit('age16p'); await wait(100); V.tapHit('yes'); await wait(100);
    o.afterConsent = V.modal; o.consent = snap(V).consent;
    V.seedRng(42); const a = Array.from({length: 20}, V.rng);
    V.seedRng(42); const b = Array.from({length: 20}, V.rng);
    o.rngSame = JSON.stringify(a) === JSON.stringify(b);
    V.seedRng(7); V.fillBoardFresh(false); const b1 = board(V);
    V.seedRng(7); V.fillBoardFresh(false); o.boardSame = b1 === board(V);
    o.playHit = V.tapHit('play'); await wait(400);
    o.state = V.state; o.ftue0 = V.ftueStep;
    o.taps = await tapClusters(V, 6); await wait(800);
    o.score = V.score; o.ftue = V.ftueStep; o.save = snap(V);
    return o;
  };
  S.features = async V => {
    const o = {opened: {}};
    for (const id of ['daily', 'quests', 'season', 'profile', 'gear']) {
      V.tapHit(id); await wait(150); o.opened[id] = V.modal;
      if (id === 'profile') { V.tapHit('themesBtn'); await wait(150); o.opened.themes = V.modal; }
      V.tapHit('close'); await wait(150);
    }
    const g0 = V.save.gems; V.tapHit('daily'); await wait(100); V.tapHit('claimDaily'); await wait(300); V.tapHit('close'); await wait(150);
    o.dailyGems = V.save.gems - g0; o.daily = snap(V).daily;
    V.tapHit('profile'); await wait(100); V.tapHit('themesBtn'); await wait(100); V.tapHit('thneon'); await wait(200);
    o.theme = V.save.theme; o.themes = snap(V).themes; V.tapHit('close'); await wait(100);
    V.tapHit('gear'); await wait(100); V.tapHit('langtr'); await wait(100); o.lang = V.save.settings.lang; V.tapHit('close'); await wait(100);
    V.tapHit('play'); await wait(150); o.boostModal = V.modal; V.tapHit('bpbomb'); V.tapHit('boostGo'); await wait(400);
    o.stateAfterBoost = V.state; o.inv = snap(V).inventory;
    V.tapHit('pause'); await wait(150); o.pauseModal = V.modal; const st = V.stability; await wait(500); o.pausedHeld = V.stability === st;
    V.tapHit('resume'); await wait(900); o.resumed = V.modal === null && V.stability < st;
    V.tapHit('pause'); await wait(100); V.tapHit('quit'); await wait(300); o.afterQuit = V.state;
    V.tapHit('modezen'); await wait(100); V.tapHit('play'); await wait(150); if (V.modal === 'boost') { V.tapHit('boostGo'); await wait(200); }
    o.zen = V.mode; const s0 = V.stability; await wait(1500); o.zenNoDrain = V.stability >= s0;
    o.taps = await tapClusters(V, 2); o.queue = V.Track.queue.map(e => e.e);
    return o;
  };
  S.revive = async V => {
    V.tapHit('play'); await wait(300); if (V.modal === 'boost') { V.tapHit('boostGo'); await wait(200); }
    V.setStability(0.01); await wait(300);
    const o = {state1: V.state};
    V.tapHit('revive'); await wait(200); o.adModal = V.modal; await wait(3200);
    o.state2 = V.state; o.stab = V.stability; o.modal = V.modal;
    await wait(1700); V.setStability(0.01); await wait(300); o.state3 = V.state;   // second death after the 1.5 s grace: no revive left
    await wait(2500); o.state4 = V.state;
    return o;
  };
  S.content = async V => {
    V.seedRng(5); V.fillBoardFresh(false);
    // force a known layout in ring 0: R R J R R L(R) and the rest alternating 1/2/3
    const G = V.grid;
    for (let s = 0; s < 12; s++) { const b = G[0][s]; b.c = [0, 0, 0, 0, 0, 0, 1, 2, 3, 1, 2, 3][s]; b.joker = s === 2; b.locked = s === 5; }
    for (let r = 1; r < 4; r++) for (let s = 0; s < 12; s++) { const b = G[r][s]; b.c = 1 + ((r + s) % 3); b.joker = false; b.locked = false; }
    V.computeClusters();
    const cl = V.clusters.find(c => c.some(x => x.r === 0 && x.s === 2)) || [];
    return {jokerCluster: cl.map(x => x.r + ':' + x.s).sort(), lockedIn: cl.some(x => x.r === 0 && x.s === 5)};
  };
  S.daily = async V => {
    V.tapHit('modedaily'); await wait(100); V.tapHit('play'); await wait(300);
    return {mode: V.mode, board: board(V), seed: V.runSeed, challenge: snap(V).challenge};
  };
  addEventListener('load', () => setTimeout(async () => {
    const V = window.__vortex;
    if (SC.name === 'production') return done({hook: typeof V});
    if (!V) return done({hook: 'undefined'});
    const out = {hook: typeof V, save: snap(V), bak: localStorage.getItem(SC.key + '.bak')};
    try { if (S[SC.run]) Object.assign(out, await S[SC.run](V)); } catch (e) { __err.push('probe: ' + e.message + ' ' + String(e.stack || '').split('\n').slice(1, 4).join(' | ')); }
    done(out);
  }, 1500));
})();
</script>"""

SETTLED = {'v': 2, 'ftue': 1, 'consent': {'age': '16p', 'analytics': False, 'ads': False, 'ts': 'x'}}
SCENARIOS = [
    dict(name='fresh', run='fresh', query='?debug=1', preset=None),
    dict(name='v1-migration', run='', query='?debug=1',
         preset=json.dumps({'gems': 123, 'best': 4567, 'upg': {'magnet': 2, 'bomb': 1, 'mult': 3}, 'muted': True})),
    dict(name='corrupt', run='', query='?debug=1', preset='{"gems": 12,'),
    dict(name='future-v3', run='', query='?debug=1', preset=json.dumps({'v': 3, 'gems': 5, 'future': {'x': 1}, 'upg': {'magnet': 9}})),
    dict(name='features', run='features', query='?debug=1', preset=json.dumps(dict(SETTLED, gems=5000, inventory={'bomb': 1}))),
    dict(name='revive', run='revive', query='?debug=1&ads=mock', preset=json.dumps(SETTLED)),
    dict(name='content', run='content', query='?debug=1', preset=json.dumps(SETTLED)),
    dict(name='daily-a', run='daily', query='?debug=1', preset=json.dumps(SETTLED)),
    dict(name='daily-b', run='daily', query='?debug=1', preset=json.dumps(SETTLED)),
    dict(name='tampered', run='', query='?debug=1', preset=json.dumps({'v': 2, 'gems': 99999, 'sum': 'bogus'})),
    dict(name='production', run='', query='', preset=json.dumps({'gems': 1})),
]


def run(sc, tmp):
    src = open(GAME, encoding='utf-8').read()
    page = src.replace('<head>', '<head>' + PROBE.replace('__SCENARIO__', json.dumps(dict(sc, key=KEY))), 1)
    path = os.path.join(tmp, f"{sc['name']}.html")
    open(path, 'w', encoding='utf-8').write(page)
    url = 'file:///' + path.replace('\\', '/') + sc['query']
    prof = os.path.join(tmp, 'prof-' + sc['name'])
    p = subprocess.run([CHROME, '--headless=new', '--no-first-run', '--disable-gpu', f'--user-data-dir={prof}',
                        '--window-size=430,860', '--virtual-time-budget=60000', '--dump-dom', url],
                       capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=240)
    m = re.search(r'<title>RESULT (.*?)</title>', p.stdout, re.S)
    if not m:
        return {'errors': ['no result in page (did the probe run?)']}
    return json.loads(html.unescape(m.group(1)))


def checks(name, r, results):
    s = r.get('save', {})
    c = [('no JS errors', r.get('errors') == [])]
    if name == 'production':
        return c + [('window.__vortex absent without ?debug=1', r.get('hook') == 'undefined')]
    c.append(('debug hook present', r.get('hook') == 'object'))
    if name == 'fresh':
        a = r.get('save', {})
        c += [('consent asked on first launch', r.get('consentModal') == 'consent' and r.get('afterConsent') is None),
              ('consent stored', (r.get('consent') or {}).get('age') == '16p' and (r.get('consent') or {}).get('analytics') is True),
              ('same seed → same RNG sequence', r.get('rngSame') is True),
              ('same seed → same board', r.get('boardSame') is True),
              ('PLAY starts a run with the tutorial', r.get('playHit') and r.get('state') == 'play' and r.get('ftue0') == 0),
              ('blasts happened (score > 0)', (r.get('score') or 0) > 0 and r.get('taps', 0) > 0),
              ('tutorial advanced', (r.get('ftue') or 0) >= 1 or r.get('ftue') == -1),
              ('gems are whole numbers', isinstance(a.get('gems'), int)),
              ('gem fraction carried in [0,1)', 0 <= a.get('gemFrac', -1) < 1)]
    elif name == 'v1-migration':
        c += [('save.v == 2', s.get('v') == 2), ('gems/best kept', s.get('gems') == 123 and s.get('best') == 4567),
              ('upgrades kept (+3 new at 0)', s.get('upg') == {'magnet': 2, 'bomb': 1, 'mult': 3, 'combo': 0, 'shield': 0, 'harmony': 0}),
              ('muted kept', s.get('muted') is True),
              ('new sections get defaults', s.get('stats', {}).get('runs') == 0 and s.get('settings', {}).get('haptics') is True
               and s.get('history') == [] and s.get('inventory') == {'bomb': 0, 'shield': 0, 'magnet': 0}
               and s.get('consent', {}).get('age') == '')]
    elif name == 'corrupt':
        c += [('corrupt bytes backed up', r.get('bak') == '{"gems": 12,'), ('starts from defaults', s.get('gems') == 0)]
    elif name == 'future-v3':
        c += [('save.v kept at 3', s.get('v') == 3), ('unknown field preserved', s.get('future') == {'x': 1}),
              ('out-of-range upgrade clamped', s.get('upg', {}).get('magnet') == 5), ('gems kept', s.get('gems') == 5)]
    elif name == 'tampered':
        c += [('checksum mismatch flagged', s.get('tampered') is True), ('save still loads', s.get('gems') == 99999)]
    elif name == 'features':
        o = r.get('opened', {})
        c += [('all panels open', o == {'daily': 'daily', 'quests': 'quests', 'season': 'season', 'profile': 'profile',
                                        'themes': 'themes', 'gear': 'settings'}),
              ('daily reward claimed', r.get('dailyGems') == 10 and (r.get('daily') or {}).get('day') == 1),
              ('theme bought and applied', r.get('theme') == 'neon' and 'neon' in (r.get('themes') or [])),
              ('language switch', r.get('lang') == 'tr'),
              ('booster sheet → run with booster', r.get('boostModal') == 'boost' and r.get('stateAfterBoost') == 'play'
               and (r.get('inv') or {}).get('bomb') == 0),
              ('pause freezes the run', r.get('pauseModal') == 'pause' and r.get('pausedHeld') is True),
              ('resume continues', r.get('resumed') is True),
              ('end run returns to title', r.get('afterQuit') == 'title'),
              ('zen mode has no drain', r.get('zen') == 'zen' and r.get('zenNoDrain') is True),
              ('analytics events recorded', all(e in (r.get('queue') or []) for e in ('app_open', 'run_start', 'run_end', 'daily_claim', 'theme_buy')))]
    elif name == 'revive':
        c += [('death offers a revive', r.get('state1') == 'revive'),
              ('mock rewarded ad shown', r.get('adModal') == 'ad'),
              ('revive continues at 50 %', r.get('state2') == 'play' and abs((r.get('stab') or 0) - 50) < 2),
              ('second death ends the run', r.get('state3') in ('dying', 'over') and r.get('state4') in ('dying', 'over'))]
    elif name == 'content':
        jc = r.get('jokerCluster') or []
        c += [('prism links both red pairs', jc == sorted(['0:0', '0:1', '0:2', '0:3', '0:4'])),
              ('locked block stays out', r.get('lockedIn') is False)]
    elif name == 'daily-b':
        a = results.get('daily-a', {})
        c += [('daily mode starts', r.get('mode') == 'daily'),
              ('same daily board on two devices', r.get('board') and r.get('board') == a.get('board') and r.get('seed') == a.get('seed')),
              ('official try recorded', (r.get('challenge') or {}).get('tries') == 1)]
    return c


def main():
    sys.stdout.reconfigure(errors='replace')   # labels contain → etc.; don't crash on cp1254/cp1252 consoles
    if not CHROME:
        print('Chrome/Edge not found; set CHROME=<path>'); return 2
    failed = 0; results = {}
    with tempfile.TemporaryDirectory() as tmp:
        only = os.environ.get('SMOKE_ONLY')   # e.g. SMOKE_ONLY=features,revive
        for sc in SCENARIOS:
            if only and sc['name'] not in only.split(','):
                continue
            r = run(sc, tmp); results[sc['name']] = r
            if sc['name'] == 'daily-a':
                continue
            for label, ok in checks(sc['name'], r, results):
                failed += not ok
                print(f"{'PASS' if ok else 'FAIL'}  {sc['name']:<13} {label}")
            if r.get('errors'):
                print('      errors:', r['errors'])
            if sc['name'] in ('features', 'revive', 'fresh') and any(not ok for _, ok in checks(sc['name'], r, results)):
                print('      detail:', json.dumps({k: v for k, v in r.items() if k not in ('save', 'queue')})[:600])
    print(f'\n{"OK" if not failed else str(failed) + " check(s) failed"}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
