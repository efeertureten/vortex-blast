"""Copies the game into www/ for Capacitor (F-031).

    python tools/build_www.py [--config path/to/store-config.json]

The web build needs no build step; www/ is just the files the app ships. --config replaces www/config.json
(e.g. one with AdMob ad unit ids for the store build) without touching the web config.json.
"""
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'www')
FILES = ['index.html', 'manifest.webmanifest', 'config.json', 'fonts-LICENSE.txt']

if os.path.isdir(WWW):
    shutil.rmtree(WWW)
os.makedirs(WWW)
for f in FILES:
    shutil.copy2(os.path.join(ROOT, f), os.path.join(WWW, f))
shutil.copytree(os.path.join(ROOT, 'icons'), os.path.join(WWW, 'icons'))
if '--config' in sys.argv:
    shutil.copy2(sys.argv[sys.argv.index('--config') + 1], os.path.join(WWW, 'config.json'))
print('www/ ready:', ', '.join(sorted(os.listdir(WWW))))
