"""Embeds script outputs into the docs and checks them.

Every   <!-- INCLUDE:out/<file> -->  ...  <!-- /INCLUDE -->   block in docs/*.md is replaced with the
current contents of docs/tools/out/<file>. Run after vb_analysis.py / vb_proposed.py / backlog.py.

    python build_docs.py           # rewrite blocks
    python build_docs.py --check   # exit 1 if any block differs from its source (used in Faz F)
"""
import glob
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(HERE)
PAT = re.compile(r'(<!-- INCLUDE:(out/[\w.\-]+) -->\n)(.*?)(<!-- /INCLUDE -->)', re.S)
check = '--check' in sys.argv
bad = 0
for path in sorted(glob.glob(os.path.join(DOCS, '*.md'))):
    text = open(path, encoding='utf-8').read()

    def sub(mo):
        global bad
        src = open(os.path.join(HERE, mo.group(2)), encoding='utf-8').read()
        if not src.endswith('\n'):
            src += '\n'
        if mo.group(3) != src:
            bad += 1
            print(('DIFF ' if check else 'update ') + os.path.basename(path) + ' <- ' + mo.group(2))
        return mo.group(1) + src + mo.group(4)

    new = PAT.sub(sub, text)
    if not check and new != text:
        open(path, 'w', encoding='utf-8').write(new)
print(('check: %d block(s) out of date' % bad) if check else 'done')
sys.exit(1 if check and bad else 0)
