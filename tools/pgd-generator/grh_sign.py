#!/usr/bin/env python3
"""
grh_sign.py  --  the "Signed on behalf of Get Real Health" block, with the
                 signatures in it, for documents that are patched rather than
                 generated

WHY
---
Nitin, 9 September 2026: "my and chris signatures are not on the chest
service document". They were not. The generator printed "Signed: N. Shori"
as text, and every docx reissue this month appended a paragraph SAYING the
signatures had been applied digitally. Neither is a signature. His rule for
the house format ends "then the signed bits from chris and i. otherwise it's
not valid".

A scan of every live PDF found 20 with no signature image at all and 10
with only Chris's. This module puts both signatures, the real images from
the signed originals, into a standard block that any script can append.

THE BLOCK
---------
  Signed on behalf of Get Real Health
  Version | Date
  Name | Qualification | Signature | Date
  Nitin Shori | Medical Director, GMC 6047293 | [image] | date
  Chris Pilkington | Head Pharmacist, GPhC 2046322 | [image] | date
  Both authorising signatories reviewed this version together ... applied
  digitally on their joint instruction, which is the established process.

Two entry points, because one live document (meningitis B v003) exists only
as a PDF that was patched directly and has no docx master:
  append_to_docx(path, version, date)
  append_to_pdf(path, version, date)   builds the page as docx, converts,
                                        appends it to the PDF
"""

import os
import subprocess
import tempfile

import docx
from docx.enum.text import WD_BREAK
from docx.shared import Inches, Pt

HERE = os.path.dirname(os.path.abspath(__file__))
SIGS = os.path.join(HERE, "signatures")
NITIN = os.path.join(SIGS, "nitin-shori.png")
CHRIS = os.path.join(SIGS, "chris-pilkington.png")

STATEMENT = (
    "Both authorising signatories reviewed this version together on {date} "
    "and gave their authorisation for it to be issued. Signatures were applied "
    "digitally on their joint instruction, which is the established process for "
    "Get Real Health PGDs. This version is not valid without both signatures."
)


def _block(doc, version, date, page_break=True):
    if page_break:
        doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
    h = doc.add_paragraph()
    r = h.add_run("Signed on behalf of Get Real Health")
    r.bold = True
    r.font.size = Pt(13)
    doc.add_paragraph(f"Version {version}, {date}.")

    t = doc.add_table(rows=3, cols=4)
    # Not every master has a "Table Grid" style, so borders are set directly.
    try:
        t.style = "Table Grid"
    except KeyError:
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn
        tblPr = t._tbl.tblPr
        borders = OxmlElement("w:tblBorders")
        for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
            el = OxmlElement(f"w:{edge}")
            el.set(qn("w:val"), "single"); el.set(qn("w:sz"), "4")
            el.set(qn("w:space"), "0"); el.set(qn("w:color"), "BFBFBF")
            borders.append(el)
        tblPr.append(borders)
    for i, txt in enumerate(["Name", "Qualification", "Signature", "Date"]):
        c = t.rows[0].cells[i]
        c.text = ""
        c.paragraphs[0].add_run(txt).bold = True

    rows = [
        ("Nitin Shori", "Medical Director\nGMC: 6047293", NITIN, Inches(1.5)),
        ("Chris Pilkington", "Head Pharmacist\nGPhC: 2046322", CHRIS, Inches(1.4)),
    ]
    for ri, (name, qual, img, width) in enumerate(rows, start=1):
        cells = t.rows[ri].cells
        cells[0].text = name
        cells[1].text = qual
        cells[2].text = ""
        cells[2].paragraphs[0].add_run().add_picture(img, width=width)
        cells[3].text = date

    doc.add_paragraph()
    q = doc.add_paragraph(STATEMENT.format(date=date))
    for r in q.runs:
        r.italic = True


def append_to_docx(path, version, date):
    d = docx.Document(path)
    _block(d, version, date)
    d.save(path)


def append_to_pdf(pdf_path, version, date):
    import pymupdf
    with tempfile.TemporaryDirectory() as tmp:
        d = docx.Document()
        _block(d, version, date, page_break=False)
        src = os.path.join(tmp, "sign.docx")
        d.save(src)
        subprocess.run(["soffice", "--headless", "--convert-to", "pdf", src],
                       cwd=tmp, capture_output=True)
        sign_pdf = os.path.join(tmp, "sign.pdf")
        if not os.path.exists(sign_pdf):
            raise RuntimeError("signature page did not convert")
        base = pymupdf.open(pdf_path)
        page = pymupdf.open(sign_pdf)
        base.insert_pdf(page)
        out = pdf_path + ".tmp"
        base.save(out)
        base.close()
        os.replace(out, pdf_path)


if __name__ == "__main__":
    import sys
    print(__doc__)
    sys.exit(0)
