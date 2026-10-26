"""Screenshots of every screen for a visual check (dev tool).

    python shots.py <out_dir> [lang]      # lang: en | tr (default en)

Each shot loads the game in headless Chrome with a preset save, runs a few UI steps through the debug hook
and captures the final frame (430×860, a typical phone).
"""
import json
import os
import subprocess
import sys
import tempfile

from smoke import CHROME, GAME, KEY

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
LANG = sys.argv[2] if len(sys.argv) > 2 else 'en'
BASE = {'v': 2, 'ftue': 1, 'gems': 640, 'best': 48210, 'streak': 2, 'consent': {'age': '16p', 'analytics': True, 'ads': True, 'ts': 'x'},
        'settings': {'lang': LANG}, 'inventory': {'bomb': 1, 'shield': 2, 'magnet': 0},
        'upg': {'magnet': 2, 'bomb': 1, 'mult': 3, 'combo': 1, 'shield': 0, 'harmony': 0},
        'stats': {'runs': 14, 'blasts': 820, 'bombs': 31, 'maxCombo': 17, 'maxWave': 16, 'playSec': 1860},
        'ach': {'first': True, 'b100': True, 'bomb': True, 'c10': True, 'w10': True},
        'history': [{'at': '2026-10-25T21:04', 'mode': 'endless', 'score': 48210, 'wave': 14, 'sec': 151}]}
SHOTS = {
    'consent': (None, ''),
    'title': (BASE, ''),
    'play': (BASE, "V.tapHit('play'); await w(300); if (V.modal==='boost') { V.tapHit('boostGo'); } await w(5000); V.setWave(6);"),
    'ftue': (dict(BASE, ftue=0), "V.tapHit('play'); await w(1200);"),
    'over': (BASE, "V.tapHit('play'); await w(300); if (V.modal==='boost') V.tapHit('boostGo'); await w(2500); V.setStability(0.01); await w(3000);"),
    'revive': (BASE, "V.tapHit('play'); await w(300); if (V.modal==='boost') V.tapHit('boostGo'); await w(1500); V.setStability(0.01); await w(800);"),
    'settings': (BASE, "V.tapHit('gear'); await w(600);"),
    'daily': (BASE, "V.tapHit('daily'); await w(600);"),
    'quests': (BASE, "V.tapHit('quests'); await w(600);"),
    'season': (BASE, "V.tapHit('season'); await w(600);"),
    'profile': (BASE, "V.tapHit('profile'); await w(600);"),
    'themes': (BASE, "V.tapHit('profile'); await w(200); V.tapHit('themesBtn'); await w(600);"),
    'boost': (BASE, "V.tapHit('play'); await w(600);"),
    'pause': (BASE, "V.tapHit('play'); await w(300); if (V.modal==='boost') V.tapHit('boostGo'); await w(1500); V.tapHit('pause'); await w(600);"),
    'drawer': (BASE, "document.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyU'})); window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyU'})); await w(900);"),
}
PROBE = r"""<script>
(() => {
  if (__PRESET__ !== null) localStorage.setItem('__KEY__', JSON.stringify(__PRESET__));
  const w = ms => new Promise(r => setTimeout(r, ms));
  // frames run on timers (virtual time); once the steps are done the loop stops so the shot shows that frame
  window.__freeze = false;
  window.requestAnimationFrame = f => setTimeout(() => { if (!window.__freeze) f(performance.now()); }, 16);
  addEventListener('load', () => setTimeout(async () => { const V = window.__vortex; __STEPS__; await w(120); window.__freeze = true; }, 1200));
})();
</script>"""

os.makedirs(OUT, exist_ok=True)
only = sys.argv[3].split(',') if len(sys.argv) > 3 else None
with tempfile.TemporaryDirectory() as tmp:
    src = open(GAME, encoding='utf-8').read()
    for name, (preset, steps) in SHOTS.items():
        if only and name not in only:
            continue
        probe = PROBE.replace('__PRESET__', json.dumps(preset)).replace('__KEY__', KEY).replace('__STEPS__', steps)
        path = os.path.join(tmp, name + '.html')
        open(path, 'w', encoding='utf-8').write(src.replace('<head>', '<head>' + probe, 1))
        png = os.path.join(OUT, f'{name}-{LANG}.png')
        subprocess.run([CHROME, '--headless=new', '--no-first-run', '--disable-gpu', '--hide-scrollbars',
                        f'--user-data-dir={tmp}/p-{name}', '--window-size=540,960', '--force-device-scale-factor=1',
                        '--virtual-time-budget=14000',
                        f'--screenshot={png}', 'file:///' + path.replace('\\', '/') + '?debug=1'], capture_output=True, timeout=120)
        print(name, 'ok' if os.path.exists(png) else 'FAILED')
