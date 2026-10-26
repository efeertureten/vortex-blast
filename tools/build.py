"""Builds index.html from src/ (F-034, ADR-2).

    python tools/build.py           # write index.html
    python tools/build.py --check   # exit 1 if index.html is not what src/ builds (run before committing)

src/shell.html is the page (head, styles, embedded fonts, canvases) with a /*@@SOURCES@@*/ marker inside its
<script>; src/NN-name.js are the code sections, concatenated in file-name order into one script. They share
one scope (the IIFE opens in 00 and closes in the last file), so there is no module loader, no bundler and
the result still runs from file:// and as a single-file download.
"""
import glob
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'index.html')
MARK = '/*@@SOURCES@@*/'


def build():
    shell = open(os.path.join(SRC, 'shell.html'), encoding='utf-8', newline='').read()
    parts = [open(p, encoding='utf-8', newline='').read() for p in sorted(glob.glob(os.path.join(SRC, '*.js')))]
    assert shell.count(MARK) == 1, 'shell.html needs exactly one ' + MARK
    return shell.replace(MARK, ''.join(parts))


if __name__ == '__main__':
    html = build()
    if '--check' in sys.argv:
        cur = open(OUT, encoding='utf-8', newline='').read()
        if cur != html:
            print('index.html is out of date — run: python tools/build.py'); sys.exit(1)
        print('index.html is up to date'); sys.exit(0)
    open(OUT, 'w', encoding='utf-8', newline='').write(html)
    print(f'index.html written ({len(html) // 1024} KB, {html.count(chr(10)) + 1} lines)')
