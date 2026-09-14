#!/usr/bin/env python3
"""
fixes-round8.py  --  Cellulitis: strapline and ownership statement on page 1

The Cellulitis master has no strapline in its cover block (its cover title is
one long paragraph, "Patient Group Direction for the administration of
Flucloxacillin ..."), so the reissue pipeline hung the strapline, and with it
the ownership statement, under the first bare "Patient Group Direction"
heading it found: arm 1, on page 4, after the NICE summary. The other 69
documents carry both on page 1. This moves them under the cover title.

  python3 tools/pgd-generator/fixes-round8.py            reissue
  python3 tools/pgd-generator/fixes-round8.py --dry      build to /tmp only
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from grh_reissue import reissue, walk, OWNER_HEAD  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
DATE = "14 September 2026"

SLUG = "cellulitis"
SRC = os.path.join(APPROVED, "cellulitis-v005-SIGNED.docx")
LIVE = "cellulitis-v005.pdf"
VERSION = "v006"
SUPERSEDES = "Version 005, 14 September 2026"

CHANGES = [
    "The version strapline and the statement naming Get Real Health Limited as the owner and authorising "
    "organisation now sit under the title on page 1, where every other Get Real Health PGD carries them. In "
    "version 005 they followed the guidance summary on page 4. No clinical content changes.",
]


def cover_identity(doc):
    paras = list(walk(doc, doc.element.body))
    title = next(p for p in paras if (p.text or "").strip().startswith(
        "Patient Group Direction for the administration of Flucloxacillin"))
    strap = next(p for p in paras if re.match(r"^Patient Group Direction, version \d{3}, issued ", (p.text or "").strip()))
    owner = next(p for p in paras if (p.text or "").strip().startswith(OWNER_HEAD))
    for el in (strap._p, owner._p):
        el.getparent().remove(el)
    title._p.addnext(strap._p)
    strap._p.addnext(owner._p)
    # they were styled like the arm heading they used to sit under (indented,
    # centred); make them plain body paragraphs
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    for p in (strap, owner):
        pPr = p._p.pPr
        if pPr is not None:
            for tag in ("ind", "jc", "pStyle"):
                for el in pPr.findall("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}" + tag):
                    pPr.remove(el)
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = None
        for r in p.runs:
            r.bold = False
    print("  cellulitis: strapline and ownership statement moved under the cover title")


def main():
    dry = "--dry" in sys.argv
    outdir = "/tmp/r8out" if dry else APPROVED
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, f"cellulitis-{VERSION}-SIGNED.docx")
    pdf_name = f"cellulitis-{VERSION}.pdf"
    reissue(SLUG, SRC, out, VERSION, SUPERSEDES, DATE, CHANGES, [],
            publish_to=None if dry else os.path.join(PUBLIC, pdf_name),
            remove=None if dry else os.path.join(PUBLIC, LIVE),
            hooks=(cover_identity,))
    print(f'  "{SLUG}": "{pdf_name}",')


if __name__ == "__main__":
    main()
