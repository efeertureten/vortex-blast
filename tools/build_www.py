"""Copies the game into www/ for Capacitor (F-031) or for the web release (GitHub Pages).

    python tools/build_www.py [--web] [--config path/to/store-config.json]

The game needs no build step; www/ is just the files the app ships. --web adds the service worker
(the store app is already offline, the web build needs sw.js for PWA install). --config replaces
www/config.json (e.g. one with AdMob ad unit ids for the store build) without touching the web config.json.
privacy.html (built from docs/PRIVACY.md by tools/build.py) ships in both builds for the in-game "Privacy policy" link.
"""
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'www')
FILES = ['index.html', 'privacy.html', 'manifest.webmanifest', 'config.json', 'fonts-LICENSE.txt']
WEB_FILES = ['sw.js']

if os.path.isdir(WWW):
    shutil.rmtree(WWW)
os.makedirs(WWW)
for f in FILES + (WEB_FILES if '--web' in sys.argv else []):
    shutil.copy2(os.path.join(ROOT, f), os.path.join(WWW, f))
shutil.copytree(os.path.join(ROOT, 'icons'), os.path.join(WWW, 'icons'))
if '--config' in sys.argv:
    shutil.copy2(sys.argv[sys.argv.index('--config') + 1], os.path.join(WWW, 'config.json'))
print('www/ ready:', ', '.join(sorted(os.listdir(WWW))))
