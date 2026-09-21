#!/usr/bin/env python3
"""
publish-new.py  --  finish and publish a FIRST issue built by gen.js

gen.js writes the body, the signatures and the practitioner pages. The
identity elements that every reissue gets from grh_reissue.normalise (logo in
the header, the ownership statement under the strapline, the em dash rule)
are applied here so that a brand-new document is published in the same
state as a reissued one. No version bump, no change record: v001 already
carries its change history from gen.js.

  python3 tools/pgd-generator/publish-new.py hepatitis-a tools/pgd-generator/hepatitis-a-v001-SIGNED.docx

Copies the docx to "PGD Rewrite 2026/02 Approved/<base>-vNNN-SIGNED.docx",
converts it to PDF there, and publishes the PDF to public/pgd-documents/
<slug>-vNNN.pdf. Prints the manifest line.
"""

import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import docx  # noqa: E402
from grh_reissue import brand_header, ownership_statement, strip_em_dashes  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")


def main():
    slug, src = sys.argv[1], sys.argv[2]
    m = re.search(r"-(v\d{3})-SIGNED\.docx$", os.path.basename(src))
    if not m:
        raise SystemExit("source must be named <base>-vNNN-SIGNED.docx")
    version = m.group(1)
    out = os.path.join(APPROVED, os.path.basename(src))
    d = docx.Document(src)
    strip_em_dashes(d)
    brand_header(d)
    ownership_statement(d)
    d.save(out)
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", out],
                   cwd=APPROVED, capture_output=True)
    pdf = out[:-5] + ".pdf"
    if not os.path.exists(pdf):
        raise SystemExit("PDF not produced")
    pdf_name = f"{slug}-{version}.pdf"
    shutil.copyfile(pdf, os.path.join(PUBLIC, pdf_name))
    print(f'  "{slug}": "{pdf_name}",')


if __name__ == "__main__":
    main()
