#!/usr/bin/env python3
"""
grh_reissue.py  --  one way to reissue a docx-based PGD

Every reissue this month was done by a different script with its own copy of
the same steps, and the steps drifted: one forgot the strapline, one appended
a second signature block under the first, one put the change record before
the signatures and one after. This is the single path now.

reissue(...) does, in order:
  1. applies the edits, each anchored on a paragraph's exact text (or a
     unique substring), and STOPS if an anchor is not found
  2. bumps the strapline and the first version token to the new version
  3. removes any signature block a previous sweep appended
  4. appends the change record: version, issued, supersedes, VALID FROM,
     EXPIRY, and the change entries
  5. appends the signature block with both images (grh_sign)
  6. converts to PDF

Valid from and expiry are stated in the change record of EVERY reissue,
because the clinical review of 10 September 2026 found thirteen live PGDs
with no period of validity anywhere in them, which Schedule 16 of the Human
Medicines Regulations 2012 requires.

Edit kinds:
  ("replace", anchor, new_text)            whole paragraph, exact text match
  ("replace_contains", substring, new_text) whole paragraph, substring match
  ("insert_after", anchor, [texts])        clones the anchor paragraph's style
  ("insert_after_contains", substring, [texts])
  ("delete", anchor)  /  ("delete_contains", substring)
Anchor matching is against the paragraph's stripped text; every occurrence
is affected unless nth=N is given as a fourth element.
"""

import copy
import os
import re
import subprocess

import docx
from docx.enum.text import WD_BREAK
from docx.table import Table
from docx.text.paragraph import Paragraph

HERE = os.path.dirname(os.path.abspath(__file__))
import sys
sys.path.insert(0, HERE)
import grh_sign  # noqa: E402

EXPIRY = "31 July 2027"


def walk(parent, element):
    for child in element.iterchildren():
        if child.tag.endswith("}p"):
            yield Paragraph(child, parent)
        elif child.tag.endswith("}tbl"):
            for row in Table(child, parent).rows:
                for cell in row.cells:
                    yield from walk(cell, cell._tc)


def set_text(p, text):
    runs = p.runs
    if not runs:
        p.add_run(text)
        return
    runs[0].text = text
    for r in runs[1:]:
        r.text = ""


def insert_after(p, texts):
    ref = p._p
    for t in texts:
        new = copy.deepcopy(ref)
        ref.addnext(new)
        set_text(Paragraph(new, p._parent), t)
        ref = new


def apply_edits(doc, edits, slug):
    for e in edits:
        kind, anchor = e[0], e[1]
        new = e[2] if len(e) > 2 else None
        nth = e[3] if len(e) > 3 else None
        optional = kind.startswith("opt_")
        kind = kind[4:] if optional else kind
        paras = list(walk(doc, doc.element.body))
        if kind.endswith("_contains"):
            hits = [p for p in paras if anchor in (p.text or "")]
        else:
            hits = [p for p in paras if (p.text or "").strip() == anchor]
        if not hits:
            if optional:
                continue
            raise SystemExit(f"{slug}: anchor not found, stopping: {anchor[:90]!r}")
        if nth is not None:
            if len(hits) < nth:
                raise SystemExit(f"{slug}: wanted occurrence {nth} of {anchor[:60]!r}, found {len(hits)}")
            hits = [hits[nth - 1]]
        for p in hits:
            if kind.startswith("replace"):
                set_text(p, new)
            elif kind.startswith("insert_after"):
                insert_after(p, new)
            elif kind.startswith("delete"):
                p._p.getparent().remove(p._p)
        print(f"  {kind:22} x{len(hits)}  {anchor[:60]}")


def bump_version(doc, version, prev, date, supersedes):
    """Strapline and first version token. `prev` like 'v004'.

    The HubRx-era originals have no strapline at all: the only version
    statement is a '001' cell in the change history at the back. A reissue of
    one of those gets a strapline inserted under the title so the version is
    stated at the front, where the audit and the reader look for it."""
    seen = False
    strap = False
    title = None
    for p in walk(doc, doc.element.body):
        t = (p.text or "").strip()
        m = re.match(r"^(Patient Group Direction, version )\d{3}(, issued )[^.]+\.(.*)$", t)
        if m:
            tail = m.group(3)
            if re.match(r"\s*Supersedes ", tail):
                tail = " Supersedes " + supersedes + "."
            set_text(p, m.group(1) + version[1:] + m.group(2) + date + "." + tail)
            strap = True
        elif t == prev and not seen:
            set_text(p, version)
            seen = True
        elif title is None and re.match(r"^Patient Group Direction\s*(\n|$)", t):
            title = p
    if not strap:
        if title is None:
            raise SystemExit("no strapline and no title paragraph to hang one on")
        # Some titles are one paragraph ("Patient Group Direction\nfor the
        # administration of ..."); others are a heading followed by one to
        # three short title lines. Hang the strapline under the last of them.
        anchor = title
        el = title._p
        for _ in range(3):
            nxt = el.getnext()
            if nxt is None or not nxt.tag.endswith("}p"):
                break
            t = (Paragraph(nxt, title._parent).text or "").strip()
            if not t or len(t) > 110 or t.endswith(".") or t.lower().startswith(("summary", "guideline")):
                break
            el = nxt
            anchor = Paragraph(nxt, title._parent)
        insert_after(anchor, [f"Patient Group Direction, version {version[1:]}, issued {date}. "
                              f"Supersedes {supersedes}."])
        new = Paragraph(anchor._p.getnext(), anchor._parent)
        try:
            new.style = doc.styles["Normal"]
        except KeyError:
            pass
        for r in new.runs:
            r.bold = False
            r.font.size = None


OLD_EXPIRIES = {"31/10/26", "31/10/2026", "31 October 2026"}


def harmonise_expiry(doc, date):
    """Any cell or line that is nothing but a lapsed expiry date becomes the
    estate expiry, and the valid-from cell beside it becomes the issue date
    of this version. Thirteen November 2025 documents were printed with
    31/10/26 in the expiry cell and would lapse seven weeks after this
    review; several reissues then stated 31 July 2027 elsewhere, which left
    two expiry dates in one document."""
    import datetime
    d = datetime.datetime.strptime(date, "%d %B %Y")
    short = f"{d.day}/{d.month}/{d.year % 100}"
    n = 0
    paras = list(walk(doc, doc.element.body))
    for i, p in enumerate(paras):
        if (p.text or "").strip() in OLD_EXPIRIES:
            set_text(p, "31/7/27")
            n += 1
            if i and re.match(r"^\d{1,2}/\d{1,2}/\d{2}$", (paras[i - 1].text or "").strip()):
                set_text(paras[i - 1], short)
    if n:
        print(f"  expiry cell(s) set to 31/7/27, valid from {short} x{n}")


def strip_old_sign_blocks(doc):
    """Remove 'Signed on behalf of Get Real Health' blocks appended by sweeps."""
    body = doc.element.body
    kids = list(body.iterchildren())
    i = 0
    while i < len(kids):
        c = kids[i]
        if c.tag.endswith("}p") and (Paragraph(c, doc).text or "").strip() == "Signed on behalf of Get Real Health":
            nxt = kids[i + 1] if i + 1 < len(kids) else None
            if nxt is not None and nxt.tag.endswith("}p") and re.match(r"^Version v\d{3}, ", (Paragraph(nxt, doc).text or "").strip()):
                start = i - 1 if i > 0 and kids[i - 1].tag.endswith("}p") and "w:br" in kids[i - 1].xml else i
                j = i + 1
                while j < len(kids):
                    cj = kids[j]
                    if cj.tag.endswith("}p") and "Both authorising signatories reviewed" in (Paragraph(cj, doc).text or ""):
                        break
                    j += 1
                for k in range(start, min(j + 1, len(kids))):
                    body.remove(kids[k])
                kids = list(body.iterchildren())
                i = start
                continue
        i += 1


def change_record(doc, version, supersedes, date, changes):
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    h = doc.add_paragraph()
    h.add_run("Version and change record").bold = True
    for line in [
        "Version: " + version,
        "Issued: " + date,
        "Supersedes: " + supersedes,
        "Valid from: " + date + ". Expiry: " + EXPIRY + ". These dates govern this "
        "version and supersede any earlier date printed elsewhere in this document.",
    ]:
        doc.add_paragraph(line)
    doc.add_paragraph("Changes in this version:")
    for c in changes:
        doc.add_paragraph(c, style=None)


def reissue(slug, src, out, version, supersedes, date, changes, edits=(), publish_to=None, remove=None):
    if not os.path.exists(src):
        raise SystemExit(f"{slug}: source missing: {src}")
    d = docx.Document(src)
    apply_edits(d, list(edits), slug)
    prev = "v" + re.search(r"Version (\d{3})", supersedes).group(1)
    bump_version(d, version, prev, date, supersedes)
    harmonise_expiry(d, date)
    strip_old_sign_blocks(d)
    change_record(d, version, supersedes, date, changes)
    d.save(out)
    grh_sign.append_to_docx(out, version, date)
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", out],
                   cwd=os.path.dirname(out), capture_output=True)
    pdf = out[:-5] + ".pdf"
    if not os.path.exists(pdf):
        raise SystemExit(f"{slug}: PDF not produced")
    if publish_to:
        with open(pdf, "rb") as a, open(publish_to, "wb") as b:
            b.write(a.read())
    if remove and os.path.exists(remove):
        os.remove(remove)
    print(f"{slug:24} {version}  reissued" + (f", published {os.path.basename(publish_to)}" if publish_to else ""))
    return pdf
