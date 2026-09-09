#!/usr/bin/env python3
"""
sign-sweep.py  --  put both signatures on every live document that lacks them

A scan of the published PDFs on 9 September 2026 found 20 live PGDs with no
signature image on their authorisation page and 10 with only Chris's. Every
one of those is a document reissued this month by patching a .docx, and the
patch appended a paragraph SAYING the signatures were applied. Nitin's rule:
without the signed bits from him and Chris it is not valid.

For each document below: open its current signed .docx master, append the
standard block from grh_sign (both signature images, version, date),
convert, publish. Meningitis B v003 has no .docx master, it was patched as a
PDF, so its page is appended to the PDF directly.

The seven generator-built documents are not here: gen.js now embeds the
images itself and they are rebuilt separately.

  python3 tools/pgd-generator/sign-sweep.py
"""

import os
import subprocess

import grh_sign

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
DATE = "9 September 2026"

# published file -> (docx master relative to 02 Approved, or absolute; version)
DOCX = {
    "anti-malarials-v004.pdf": ("antimalarials-v004-SIGNED.docx", "v004"),
    "anxiety-propranolol-v002.pdf": ("anxiety-propranolol-v002-SIGNED.docx", "v002"),
    "asthma-rescue-v002.pdf": ("asthma-rescue-v002-SIGNED.docx", "v002"),
    "covid-2026-27-v005.pdf": ("covid-v005-SIGNED.docx", "v005"),
    "ear-infection-v003.pdf": ("ear-infection-v003-SIGNED.docx", "v003"),
    "ed-v003.pdf": ("ed-v003-SIGNED.docx", "v003"),
    "foundayo-v003.pdf": ("foundayo-v003-SIGNED.docx", "v003"),
    "hep-ab-travel-v003.pdf": ("hep-ab-travel-v003-SIGNED.docx", "v003"),
    "impetigo-v004.pdf": ("impetigo-v004-SIGNED.docx", "v004"),
    "japanese-encephalitis-v002.pdf": ("japanese-encephalitis-v002-SIGNED.docx", "v002"),
    "junior-travel-v003.pdf": ("junior-travel-v003-SIGNED.docx", "v003"),
    "meningitis-acwy-travel-v003.pdf": ("menacwy-v003-SIGNED.docx", "v003"),
    "mounjaro-v003.pdf": ("mounjaro-v003-SIGNED.docx", "v003"),
    "period-delay-v005.pdf": ("period-delay-v005-SIGNED.docx", "v005"),
    "sleep-melatonin-v003.pdf": ("sleep-melatonin-v003-SIGNED.docx", "v003"),
    "tetanus-v004.pdf": ("tetanus-v004-SIGNED.docx", "v004"),
    "typhoid-v003.pdf": ("typhoid-v003-SIGNED.docx", "v003"),
    "uti-v003.pdf": ("uti-v003-SIGNED.docx", "v003"),
    "wegovy-oral-v007.pdf": ("wegovy-oral-v007-SIGNED.docx", "v007"),
    "wegovy-v003.pdf": ("wegovy-v003-SIGNED.docx", "v003"),
    "wound-care-v004.pdf": ("wound-care-v004-SIGNED.docx", "v004"),
    "yellow-fever-v002.pdf": ("yellow-fever-v002-SIGNED.docx", "v002"),
    "b12-folate-v004.pdf": (os.path.join(PARENT, "B12_FOLATE_PGD_V004_SIGNED_06Aug2026.docx"), "v004"),
    "shingles-treatment-v001.pdf": (os.path.join(PARENT, "PGD SIGNED", "SHINGLES_TREATMENT_PGD_V001_SIGNED_21Aug2026.docx"), "v001"),
}
PDF_ONLY = {
    "meningitis-b-v003.pdf": "v003",
}


def main():
    for pub, (src, version) in DOCX.items():
        path = src if os.path.isabs(src) else os.path.join(APPROVED, src)
        if not os.path.exists(path):
            print(f"  SOURCE MISSING for {pub}: {src}")
            continue
        # Work on a copy in 02 Approved so the master used for publication is
        # always the one with the block in it.
        work = os.path.join(APPROVED, os.path.basename(path))
        if work != path:
            with open(path, "rb") as a, open(work, "wb") as b:
                b.write(a.read())
        grh_sign.append_to_docx(work, version, DATE)
        subprocess.run(["soffice", "--headless", "--convert-to", "pdf", work],
                       cwd=APPROVED, capture_output=True)
        pdf = work[:-5] + ".pdf"
        if not os.path.exists(pdf):
            print(f"  PDF NOT PRODUCED for {pub}")
            continue
        with open(pdf, "rb") as a, open(os.path.join(PUBLIC, pub), "wb") as b:
            b.write(a.read())
        print(f"  signed and published {pub}")

    for pub, version in PDF_ONLY.items():
        grh_sign.append_to_pdf(os.path.join(PUBLIC, pub), version, DATE)
        print(f"  signed (PDF page appended) {pub}")


if __name__ == "__main__":
    main()
