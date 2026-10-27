"""Builds index.html from src/ (F-034, ADR-2) and privacy.html from docs/PRIVACY.md.

    python tools/build.py           # write index.html and privacy.html
    python tools/build.py --check   # exit 1 if either is not what its source builds (run before committing)

src/shell.html is the page (head, styles, embedded fonts, canvases) with a /*@@SOURCES@@*/ marker inside its
<script>; src/NN-name.js are the code sections, concatenated in file-name order into one script. They share
one scope (the IIFE opens in 00 and closes in the last file), so there is no module loader, no bundler and
the result still runs from file:// and as a single-file download.

Both outputs are committed: GitHub Pages serves the repo root of main as the web release.
"""
import glob
import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'index.html')
PRIVACY_MD = os.path.join(ROOT, 'docs', 'PRIVACY.md')
PRIVACY_OUT = os.path.join(ROOT, 'privacy.html')
MARK = '/*@@SOURCES@@*/'


def build():
    shell = open(os.path.join(SRC, 'shell.html'), encoding='utf-8', newline='').read()
    parts = [open(p, encoding='utf-8', newline='').read() for p in sorted(glob.glob(os.path.join(SRC, '*.js')))]
    assert shell.count(MARK) == 1, 'shell.html needs exactly one ' + MARK
    return shell.replace(MARK, ''.join(parts))


PAGE = """<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vortex Blast — Privacy</title><link rel="icon" href="icons/icon-192.png">
<style>
:root{{color-scheme:dark;--bg:#12072b;--ink:#efe9ff;--muted:#b3a6dc;--accent:#b9a8ff;--line:#3a2a6b}}
body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif}}
main{{max-width:720px;margin:0 auto;padding:32px 16px 64px}}
h1{{font-size:26px;line-height:1.2}} h2{{font-size:20px;margin-top:36px;border-top:1px solid var(--line);padding-top:24px}}
blockquote{{margin:0;padding:8px 14px;border-left:3px solid var(--accent);color:var(--muted);font-size:14px}}
blockquote p{{margin:4px 0}} code{{font-size:.9em;color:var(--accent)}} a{{color:var(--accent)}}
</style></head><body><main>
{body}
<p><a href="./">← Vortex Blast</a></p>
</main></body></html>
"""


def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    return re.sub(r'`(.+?)`', r'<code>\1</code>', s)


def md_to_html(md):
    """Just enough Markdown for PRIVACY.md: headings, paragraphs, '-' lists, '>' quotes, bold, code."""
    out, block = [], None
    for line in md.splitlines() + ['']:
        kind = 'ul' if line.startswith('- ') else 'quote' if line.startswith('>') else 'p' if line.strip() else None
        if kind != block:
            out.append({'ul': '</ul>', 'quote': '</blockquote>'}.get(block, ''))
            out.append({'ul': '<ul>', 'quote': '<blockquote>'}.get(kind, ''))
            block = kind
        m = re.match(r'(#{1,3}) (.*)', line)
        if m:
            out.append(f'<h{len(m[1])}>{inline(m[2])}</h{len(m[1])}>')
            block = None
        elif kind == 'ul':
            out.append(f'<li>{inline(line[2:])}</li>')
        elif kind == 'quote':
            if line.lstrip('> ').strip():
                out.append(f'<p>{inline(line.lstrip("> "))}</p>')
        elif kind == 'p':
            out.append(f'<p>{inline(line)}</p>')
    return '\n'.join(x for x in out if x)


def build_privacy():
    return PAGE.format(body=md_to_html(open(PRIVACY_MD, encoding='utf-8').read()))


if __name__ == '__main__':
    outputs = [(OUT, build()), (PRIVACY_OUT, build_privacy())]
    if '--check' in sys.argv:
        stale = [p for p, text in outputs
                 if not os.path.exists(p) or open(p, encoding='utf-8', newline='').read() != text]
        for p in stale:
            print(f'{os.path.basename(p)} is out of date — run: python tools/build.py')
        if stale:
            sys.exit(1)
        print('index.html and privacy.html are up to date'); sys.exit(0)
    for p, text in outputs:
        open(p, 'w', encoding='utf-8', newline='').write(text)
    page = outputs[0][1]
    print(f'index.html written ({len(page) // 1024} KB, {page.count(chr(10)) + 1} lines), privacy.html written')
