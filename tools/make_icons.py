"""Renders the PWA / store icons from tools/icon.html with headless Chrome (no image libraries needed).

    python tools/make_icons.py      → icons/icon-192.png, icon-512.png, maskable-512.png
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'icon.html').replace('\\', '/')
OUT = os.path.join(ROOT, 'icons')
CANDIDATES = [os.environ.get('CHROME', ''), r'C:\Program Files\Google\Chrome\Application\chrome.exe',
              r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              shutil.which('google-chrome') or '', shutil.which('chromium') or '']
CHROME = next((c for c in CANDIDATES if c and os.path.exists(c)), None)

if not CHROME:
    sys.exit('Chrome/Edge not found; set CHROME=<path>')
os.makedirs(OUT, exist_ok=True)
for name, size, mask in (('icon-192.png', 192, 0), ('icon-512.png', 512, 0), ('maskable-512.png', 512, 1)):
    path = os.path.join(OUT, name)
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
                    f'--window-size={size},{size}', f'--screenshot={path}', '--virtual-time-budget=2000',
                    f'file:///{SRC}?size={size}&mask={mask}'], capture_output=True, timeout=60)
    print(name, os.path.getsize(path) if os.path.exists(path) else 'FAILED')
