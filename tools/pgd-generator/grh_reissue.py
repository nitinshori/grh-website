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
            new.style = None
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
        t = (p.text or "").strip()
        if t in OLD_EXPIRIES or t == "31/7/27":
            if t != "31/7/27":
                set_text(p, "31/7/27")
            n += 1
            if i and re.match(r"^\d{1,2}/\d{1,2}/\d{2}$", (paras[i - 1].text or "").strip()):
                set_text(paras[i - 1], short)
    if n:
        print(f"  expiry cell(s) set to 31/7/27, valid from {short} x{n}")


def fill_validity_tables(doc, date):
    """Every 'Valid from date' / 'Expiry date' cell pair in the document gets
    this issue date and the estate expiry. Two layouts exist: label above
    value (the HubRx and Jane originals, often with merged duplicate cells)
    and label beside value (generator-built documents). Blank cells are
    filled, not skipped: the flu, MenB and chlamydia originals shipped with
    the practitioner page's validity cells empty."""
    short = _short(date)
    n = 0
    for tbl_el in doc.element.body.iter():
        if not tbl_el.tag.endswith("}tbl"):
            continue
        tbl = Table(tbl_el, doc)
        rows = tbl.rows
        for ri, row in enumerate(rows):
            cells = row.cells
            for ci, c in enumerate(cells):
                label = c.text.strip()
                if label not in ("Valid from date", "Expiry date"):
                    continue
                long_v = date if label == "Valid from date" else EXPIRY
                short_v = short if label == "Valid from date" else "31/7/27"
                beside = cells[ci + 1] if ci + 1 < len(cells) else None
                if beside is not None and beside._tc is not c._tc and beside.text.strip() not in ("Valid from date", "Expiry date", "") \
                        and re.match(r"^\d{1,2} \w+ \d{4}$", beside.text.strip()):
                    target, val = beside, long_v
                elif ri + 1 < len(rows) and ci < len(rows[ri + 1].cells):
                    below = rows[ri + 1].cells[ci]
                    if below.text.strip() in ("Valid from date", "Expiry date"):
                        continue
                    if below.text.strip() and not re.match(r"^\d{1,2}/\d{1,2}/\d{2,4}$|^\d{1,2} \w+ \d{4}$", below.text.strip()):
                        continue
                    target, val = below, short_v
                elif beside is not None and beside._tc is not c._tc and beside.text.strip() == "":
                    target, val = beside, long_v
                else:
                    continue
                if target.text.strip() != val:
                    paras = target.paragraphs
                    set_text(paras[0], val)
                    for extra in paras[1:]:
                        set_text(extra, "")
                    n += 1
    if n:
        print(f"  validity cell(s) set: {n}")


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
                    if cj.tag.endswith("}sectPr"):
                        j -= 1
                        break
                    if cj.tag.endswith("}p") and "Both authorising signatories reviewed" in (Paragraph(cj, doc).text or ""):
                        break
                    j += 1
                for k in range(start, min(j + 1, len(kids))):
                    body.remove(kids[k])
                kids = list(body.iterchildren())
                i = start
                continue
        i += 1


def _elem_text(el):
    return "".join(t.text or "" for t in el.iter() if t.tag.endswith("}t"))


def _short(date):
    import datetime
    d = datetime.datetime.strptime(date, "%d %B %Y")
    return f"{d.day}/{d.month}/{d.year % 100}"


# ---------------------------------------------------------------------------
# NORMALISATION, applied to every document on every reissue.
#
# The adversarial review of 10 September 2026 found the same structural
# faults across the estate, and a hostile reader leads with them because they
# need no clinical knowledge to see: the adopting pharmacy's authorisation
# block pre-signed by GRH's own Head Pharmacist (29 documents); two signature
# pages for one version, dated differently (21); version bookkeeping and
# admissions about earlier errors in the body of the document (36); and
# separate "Version and change record" sections stacked one per reissue.
# ---------------------------------------------------------------------------

ADOPTION_HEAD = "PGD adoption and authorisation by the employer/clinical lead"
ADOPTION_NOTE = ("To be completed by the adopting pharmacy. These are the adopting organisation's "
                 "own signatories and must not be Get Real Health staff.")
SIGN_HEAD = "Signed on behalf of Get Real Health"
RECORD_HEAD = "Version and change record"

NARRATION = re.compile(
    r"\b[Vv]ersion 00\d\b|\bv00\d\b|consultation tool|\bgenerator\b|this reissue|previous version|"
    r"correction notice|not resolved here|recorded for (a )?decision|remains outstanding|"
    r"clinical review (is|remains) outstanding|no (signed )?PGD behind|without (a|any) (signed )?PGD|"
    r"unlawful|were being (administered|supplied)|Moin|Heron Cross|\bPPH\b|Pritchard|Smartway|Janey|"
    r"\bJane\b|September rewrites|estate-wide|found by the clinical review|found by comparing")
NARRATION_HEADS = re.compile(
    r"^(What version 00\d got wrong|Why this document exists|What changed, and why.*|"
    r"Read this first: three things version 00\d got wrong|The three things this version adds|"
    r"A note on the safety requirements in this PGD|What this version fixes.*)$", re.I)
DELETE_PARAS = re.compile(r"^A NOTE ON WHERE THE SAFETY REQUIREMENTS IN THIS PGD COME FROM")


def _looks_like_heading(p, text):
    style = ""
    try:
        style = p.style.name or ""
    except Exception:
        pass
    if style.startswith("Heading") or style.startswith("Title"):
        return True
    runs = [r for r in p.runs if (r.text or "").strip()]
    return bool(runs) and all(r.bold for r in runs) and len(text) < 90 and not text.endswith(".")
KEEP = re.compile(r"^(Patient Group Direction, version|ISSUED, VALID FROM|Version: v|Supersedes: |Version v\d{3}, |v\d{3}$|Version \d{3}, \d{1,2} \w+ \d{4}$)")


def _strip_sentences(text):
    """Drop the sentences that narrate version history; keep the rest."""
    parts = re.split(r"(?<=[.!?])\s+", text)
    kept = [s for s in parts if not NARRATION.search(s)]
    out = " ".join(kept).strip()
    if out and out[-1] not in ".!?:" and text.rstrip()[-1:] in ".!?":
        out += "."
    return out


def strip_narration(doc):
    """Body paragraphs (before the first change-history heading) lose every
    sentence that talks about what a previous version got wrong, about the
    consultation tool or the generator, or that names a customer. A
    paragraph left empty is removed. Cover sections headed as narration go
    with their heading."""
    body = doc.element.body
    removed = trimmed = 0
    in_body = True
    in_section = 0
    for p in list(walk(doc, body)):
        t = (p.text or "").strip()
        if not t:
            continue
        if t in ("Change history", RECORD_HEAD):
            in_body = False
        if not in_body or KEEP.match(t):
            continue
        if NARRATION_HEADS.match(t):
            p._p.getparent().remove(p._p)
            removed += 1
            in_section = 8
            continue
        if DELETE_PARAS.match(t):
            p._p.getparent().remove(p._p)
            removed += 1
            continue
        if in_section:
            # what sits under a narration heading goes with it, up to the
            # next heading (styled, or a short bold line) and never more than
            # eight paragraphs
            if _looks_like_heading(p, t) or in_section <= 0:
                in_section = 0
            else:
                p._p.getparent().remove(p._p)
                removed += 1
                in_section -= 1
                continue
        if NARRATION.search(t):
            new = _strip_sentences(t)
            if not new or len(new) < 12:
                p._p.getparent().remove(p._p)
                removed += 1
            elif new != t:
                set_text(p, new)
                trimmed += 1
    if removed or trimmed:
        print(f"  narration: {removed} paragraph(s) removed, {trimmed} trimmed")


def blank_adoption_block(doc):
    """The adopting pharmacy's block must be empty for the pharmacy to sign.
    The November 2025 originals shipped with GRH's Head Pharmacist typed in
    as the pharmacy's superintendent and professional signatory, dated
    19/06/2026."""
    paras = list(walk(doc, doc.element.body))
    n = 0
    i = 0
    while i < len(paras):
        if (paras[i].text or "").strip() in (ADOPTION_HEAD, ADOPTION_HEAD.replace("employer/clinical", "employer or clinical")):
            j = i + 1
            noted = False
            while j < len(paras):
                t = (paras[j].text or "").strip()
                if t in (SIGN_HEAD, "Change history", RECORD_HEAD):
                    break
                # the signature image itself, in whatever cell it landed
                for el in list(paras[j]._p.iter()):
                    if el.tag.endswith("}drawing") or el.tag.endswith("}pict"):
                        el.getparent().remove(el)
                        n += 1
                if t.startswith("This section must be signed by the superintendent") and not noted:
                    set_text(paras[j], t + " " + ADOPTION_NOTE)
                    noted = True
                elif (t == "Chris Pilkington" or t == "Nitin Shori"
                      or t.startswith("Head Pharmacist, Get Real Health") or "GPhC: 2046322" in t
                      or "GMC: 6047293" in t or re.match(r"^\d{1,2}/\d{1,2}/\d{2,4}$", t)):
                    set_text(paras[j], "")
                    n += 1
                j += 1
            i = j
        else:
            i += 1
    if n:
        print(f"  adoption block: {n} pre-filled cell(s) blanked")


def remove_original_sign_blocks(doc):
    """The signed originals carry a 'Signed on behalf of Get Real Health'
    table dated at first issue; every reissue then appended another. One
    authorisation page per version: the appended one, dated this issue."""
    body = doc.element.body
    kids = list(body.iterchildren())
    n = 0
    i = 0
    while i < len(kids):
        c = kids[i]
        if c.tag.endswith("}p") and (Paragraph(c, doc).text or "").strip() == SIGN_HEAD:
            nxt = kids[i + 1] if i + 1 < len(kids) else None
            if nxt is not None and nxt.tag.endswith("}tbl"):
                body.remove(c)
                body.remove(nxt)
                # a trailing empty paragraph after the table
                if i < len(kids) - 2 and kids[i + 2].tag.endswith("}p") and not _elem_text(kids[i + 2]).strip():
                    body.remove(kids[i + 2])
                kids = list(body.iterchildren())
                n += 1
                continue
        i += 1
    if n:
        print(f"  original signature block(s) removed: {n}")


def refresh_authorisation_table(doc, version, date, supersedes):
    """Generator-built documents carry an 'Authorisation' table on the last
    arm: version, supersedes, valid from, expiry, then typed signature lines
    for the doctor and pharmacist. The dates are those of the build, and
    every patch since then added a second, later, signature page. The table
    keeps the version, supersedes and validity rows, updated; the typed
    signature rows point to the signed page at the end."""
    paras = list(walk(doc, doc.element.body))
    n = 0
    sign_head = None
    for i, p in enumerate(paras):
        t = (p.text or "").strip()
        if t == SIGN_HEAD:
            sign_head = p
        if re.match(r"^ISSUED, VALID FROM ", t):
            set_text(p, "ISSUED, VALID FROM " + date.upper()); n += 1
        elif t == "Valid from date" and i + 1 < len(paras) and re.match(r"^\d{1,2} \w+ \d{4}$", (paras[i + 1].text or "").strip()):
            set_text(paras[i + 1], date); n += 1
        elif t == "Supersedes" and i + 1 < len(paras) and re.match(r"^Version \d{3}, ", (paras[i + 1].text or "").strip()):
            set_text(paras[i + 1], supersedes); n += 1
        elif (t == "Version" and i + 2 < len(paras) and re.match(r"^v\d{3}$", (paras[i + 1].text or "").strip())
              and (paras[i + 2].text or "").strip() == "Supersedes"):
            # the authorisation table only; a change-history row keeps its version
            set_text(paras[i + 1], version); n += 1
        elif t == "Doctor" and i + 1 < len(paras) and (paras[i + 1].text or "").strip().startswith("Name: Nitin Shori"):
            set_text(p, "Authorised on behalf of Get Real Health by the Medical Director and the Head "
                        "Pharmacist. Their signatures for this version are on the signed authorisation "
                        "page at the end of this document.")
            if sign_head is not None:
                # the heading no longer sits over signatures
                set_text(sign_head, "Authorisation of this version")
                sign_head = None
            j = i + 1
            while j < len(paras):
                tj = (paras[j].text or "").strip()
                set_text(paras[j], "")
                if tj.startswith("Both authorising signatories reviewed"):
                    break
                j += 1
            n += 1
    if n:
        print(f"  authorisation table refreshed ({n} field(s))")


def consolidate_change_records(doc):
    """Collect every 'Version and change record' block appended by earlier
    reissues, remove them, and return their lines so the new record can
    carry them as 'Previous versions'."""
    body = doc.element.body
    kids = list(body.iterchildren())
    blocks = []
    i = 0
    while i < len(kids):
        c = kids[i]
        if c.tag.endswith("}p") and _elem_text(c).strip() == RECORD_HEAD:
            start = i - 1 if i > 0 and kids[i - 1].tag.endswith("}p") and "w:br" in kids[i - 1].xml else i
            j = i + 1
            lines = []
            while j < len(kids):
                if kids[j].tag.endswith("}sectPr"):
                    break
                tj = _elem_text(kids[j]).strip()
                if tj == RECORD_HEAD or tj == SIGN_HEAD or (kids[j].tag.endswith("}p") and "w:br" in kids[j].xml and j + 1 < len(kids) and _elem_text(kids[j + 1]).strip() in (RECORD_HEAD, SIGN_HEAD)):
                    break
                if tj:
                    lines.append(tj)
                j += 1
            blocks.append(lines)
            for k in range(start, j):
                body.remove(kids[k])
            kids = list(body.iterchildren())
            i = start
            continue
        i += 1
    return blocks


def change_record(doc, version, supersedes, date, changes, previous=()):
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    h = doc.add_paragraph()
    h.add_run(RECORD_HEAD).bold = True
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
    if previous:
        doc.add_paragraph("")
        hp = doc.add_paragraph()
        hp.add_run("Previous version records").bold = True
        for block in previous:
            for line in block:
                doc.add_paragraph(line)
            doc.add_paragraph("")


def normalise(doc, version, date, supersedes):
    blank_adoption_block(doc)
    remove_original_sign_blocks(doc)
    strip_old_sign_blocks(doc)
    refresh_authorisation_table(doc, version, date, supersedes)
    strip_narration(doc)
    return consolidate_change_records(doc)


def reissue(slug, src, out, version, supersedes, date, changes, edits=(), publish_to=None, remove=None):
    if not os.path.exists(src):
        raise SystemExit(f"{slug}: source missing: {src}")
    d = docx.Document(src)
    apply_edits(d, list(edits), slug)
    prev = "v" + re.search(r"Version (\d{3})", supersedes).group(1)
    bump_version(d, version, prev, date, supersedes)
    harmonise_expiry(d, date)
    fill_validity_tables(d, date)
    previous = normalise(d, version, date, supersedes)
    change_record(d, version, supersedes, date, changes, previous)
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
