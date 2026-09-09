#!/usr/bin/env python3
"""
add-practitioner-page.py  --  retrofit the practitioner authorisation page

WHY
---
sig() in gen.js emitted the Get Real Health authorisation block and the
organisation adoption block, and nothing for the individual practitioner.
Every v001 document had an "Agreement to practise by the Registered
Healthcare Professional" page with a premises block and a signature table.
No document produced by the generator did. It went missing from 15 live
documents through one omission in one function.

An adopting pharmacy raised it as blocking, correctly: it is the page a
practitioner signs, and NICE MPG2 expects a record of the individuals
authorised to work under a PGD. Until it is there, no pharmacy can lawfully
name a practitioner against any of these documents.

WHY A PATCH RATHER THAN A REGENERATION
--------------------------------------
Only three of the fifteen have a generator script. Rewriting the other
twelve from scratch is exactly the practice that caused the damage this
review is repairing: five documents rewritten rather than amended lost a
renal dose adjustment, a fungal exclusion, a weeping-skin exclusion, two
pregnancy statements and a training requirement between them, and nobody
noticed for two days.

So this makes a narrow, identical, verifiable change to each signed
document and nothing else:

  1. appends the practitioner agreement page, premises block and signature
     table, in the same wording gen.js now emits
  2. appends the standard governance requirements as a document-level
     section: SPC and BNF familiarity, MHRA safety alerts, CPD and
     appraisal, indemnity, capacity and consent. All were in v001 and were
     lost in the rewrites.
  3. removes em dashes, against a standing house rule
  4. bumps the version, supersedes, valid-from and signature dates
  5. prepends an itemised change history entry saying exactly this

It does NOT touch clinical content. Every document it produces is checked
afterwards by pgd-version-diff and pgd-consistency-scan.

USAGE
-----
  python3 tools/pgd-generator/add-practitioner-page.py \
      --docx "<source>.docx" --out "<dest>.docx" \
      --version v003 --supersedes "Version 002, 7 September 2026" \
      --date "9 September 2026"
"""

import argparse
import copy
import re

import docx
from docx.enum.text import WD_BREAK

GOVERNANCE = [
    "All users must be familiar with the current Summary of Product Characteristics for every product named in this PGD, and with current BNF and national guidance for the condition.",
    "All users must be up to date with MHRA drug safety alerts and recalls relevant to these products.",
    "All users must be up to date with their CPD requirements and appraisal.",
    "All users must hold appropriate professional indemnity covering this service.",
    "All users must understand capacity and consent, including the Mental Capacity Act 2005, and must be able to assess consent in children and young people where this PGD covers them.",
]

CHANGE_ENTRY = (
    "The practitioner Agreement to practise page, the premises block and the "
    "practitioner signature table are restored. Every version 001 document "
    "carried them; no document produced by the current generator did, through "
    "one omission in one function, which left 15 live documents with no page "
    "for an individual practitioner to sign. Raised as blocking by an adopting "
    "pharmacy: NICE MPG2 expects a record of the individuals authorised to work "
    "under a PGD. The standard governance requirements are restored at the same "
    "time: SPC and BNF familiarity, MHRA safety alerts, CPD and appraisal, "
    "indemnity, and capacity and consent, all of which were in version 001 and "
    "were lost in the rewrite. This version changes no clinical content."
)


def set_text(par, new):
    """Replace a paragraph's text, keeping the first run's formatting."""
    for r in par.runs[1:]:
        r.text = ""
    if par.runs:
        par.runs[0].text = new
    else:
        par.add_run(new)


def all_paragraphs(d):
    yield from d.paragraphs
    for t in d.tables:
        for row in t.rows:
            for c in row.cells:
                yield from c.paragraphs


def strip_em_dashes(d):
    n = 0
    for par in all_paragraphs(d):
        if "—" in par.text:
            new = par.text.replace("—", ",")
            for label in ("Arm 1", "Arm 2", "Arm 3", "Arm 4",
                          "Appendix 1", "Appendix 2", "Appendix 3"):
                new = new.replace(label + ",", label + ":")
            new = re.sub(r"^ISSUED\s*,\s*VALID FROM", "ISSUED, VALID FROM", new)
            set_text(par, new)
            n += 1
    return n


def bump_version(d, version, supersedes, date, old_date):
    """Update the authorisation block, banner, strap and signature dates."""
    changed = []
    for par in all_paragraphs(d):
        t = par.text.strip()
        if re.fullmatch(r"v0\d\d", t):
            set_text(par, version)
            changed.append("version")
        elif t.startswith("Date:") and old_date in t:
            set_text(par, t.replace(old_date, date))
            changed.append("sigdate")
        elif "reviewed this version together on" in t and old_date in t:
            set_text(par, t.replace(old_date, date))
            changed.append("statement")
        elif t.startswith("ISSUED") and "VALID FROM" in t:
            set_text(par, "ISSUED, VALID FROM " + date.upper())
            changed.append("banner")
        elif t.startswith("Patient Group Direction, version"):
            set_text(par, re.sub(
                r"version \d+, issued [^.]+\.",
                f"version {version.lstrip('v')}, issued {date}.",
                t, count=1))
            changed.append("strap")

    # "Valid from date" and "Supersedes" sit in two-cell table rows. Match on
    # the LABEL, not on the value: the first version of this script matched
    # supersedes by text shape and length, and silently failed on every
    # document whose supersedes line carried an explanatory clause, leaving
    # the new version claiming to supersede the wrong one.
    for t in d.tables:
        for row in t.rows:
            cells = [c.text.strip() for c in row.cells]
            if len(cells) < 2:
                continue
            if cells[0] == "Valid from date":
                for par in row.cells[1].paragraphs:
                    if par.text.strip():
                        set_text(par, date)
                        changed.append("validfrom")
            elif cells[0] == "Supersedes":
                done = False
                for par in row.cells[1].paragraphs:
                    if par.text.strip() and not done:
                        set_text(par, supersedes)
                        changed.append("supersedes")
                        done = True
                    elif done:
                        set_text(par, "")
    return changed


def add_to_row(d, label, text, nth=None):
    """
    Append a clause to the cell beside a labelled row, e.g. "Exclusion
    criteria". Used to restore a clinical clause that a rewrite dropped,
    without touching anything else in the document.

    `nth` selects WHICH occurrence, 1-based, because a multi-arm document has
    one such row per arm and a restored clause usually belongs to exactly one
    of them. Without it, restoring the mefloquine QT exclusion put it in the
    atovaquone and doxycycline arms too, and restoring the "intact skin"
    criterion for topical fusidic acid put it on the two ORAL arms, where it
    would have excluded the very patients whose skin is too broken for a
    topical and who therefore need the oral one. A blanket insertion is not a
    restoration, it is a new and different error.

    Restoring by hand is how the original damage happened. This is narrow,
    scriptable and checked afterwards by pgd-version-diff, which is what
    reported the loss in the first place.
    """
    added = 0
    seen = 0
    for t in d.tables:
        for row in t.rows:
            cells = [c.text.strip() for c in row.cells]
            if len(cells) >= 2 and cells[0] == label:
                seen += 1
                if nth is not None and seen != nth:
                    continue
                cell = row.cells[1]
                last = cell.paragraphs[-1]
                new_p = copy.deepcopy(last._p)
                last._p.addnext(new_p)
                par = docx.text.paragraph.Paragraph(new_p, cell)
                set_text(par, text)
                added += 1
    return added


def prepend_change_entry(d, text=CHANGE_ENTRY):
    """Put the new entry at the top of the Changes cell."""
    for t in d.tables:
        for row in t.rows:
            cells = [c.text.strip() for c in row.cells]
            if len(cells) >= 2 and cells[0] == "Changes":
                cell = row.cells[1]
                first = cell.paragraphs[0]
                new_p = copy.deepcopy(first._p)
                first._p.addprevious(new_p)
                par = docx.text.paragraph.Paragraph(new_p, cell)
                set_text(par, text)
                return True
    return False


def append_section(d, heading, bullets):
    """
    Append a headed section of bullets to the end of the document.

    Used for the vaccine safety requirements that a document is missing:
    the observation period, the cold chain excursion procedure, sharps
    disposal, and consent in children and young people. Appending is the
    honest option where there is no generator source: it adds what is
    missing without touching, and without risking, anything already there.
    """
    p = d.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    h = d.add_paragraph()
    h.add_run(heading).bold = True
    for b in bullets:
        d.add_paragraph(b)


def append_sections(d, table_style):
    p = d.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)

    h = d.add_paragraph()
    h.add_run("Standard requirements for every practitioner working under this PGD").bold = True
    for g in GOVERNANCE:
        d.add_paragraph(g, style=None).paragraph_format.left_indent = None

    p = d.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    h = d.add_paragraph()
    h.add_run("Agreement to practise by the registered healthcare professional").bold = True
    d.add_paragraph(
        "By signing below you confirm that you agree to the contents of this PGD "
        "and that you will work within it. A PGD does not remove the inherent "
        "professional obligations or accountability of the individual "
        "practitioner. It is the responsibility of each healthcare professional "
        "to practise only within the bounds of their own competence and "
        "professional code of conduct."
    )
    p = d.add_paragraph()
    p.add_run("Name and address of the pharmacy or clinic premises to which this PGD relates").bold = True
    t1 = d.add_table(rows=3, cols=2)
    if table_style:
        t1.style = table_style
    rows = [
        ("Premises name", "................................................................"),
        ("Address",
         "................................................................  "
         "................................................................  "
         "Postcode: ......................"),
        ("ODS code, if applicable", "......................"),
    ]
    for i, (a, b) in enumerate(rows):
        t1.rows[i].cells[0].text = a
        t1.rows[i].cells[1].text = b

    d.add_paragraph()
    p = d.add_paragraph()
    p.add_run("Registered healthcare professionals authorised to work under this PGD at those premises").bold = True
    d.add_paragraph(
        "The employing organisation must keep this page, or an equivalent local "
        "register, and must be able to produce it on request. A practitioner who "
        "has not signed against the current version is not authorised to work "
        "under it."
    )
    t2 = d.add_table(rows=7, cols=2)
    if table_style:
        t2.style = table_style
    t2.rows[0].cells[0].text = "Name of healthcare professional"
    t2.rows[0].cells[1].text = "Job title  |  Registration number  |  Signature  |  Date"
    for i in range(1, 7):
        t2.rows[i].cells[0].text = "................................"
        t2.rows[i].cells[1].text = (
            "................................  |  ..................  |  "
            "................................  |  ................"
        )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--version", required=True)
    ap.add_argument("--supersedes", required=True)
    ap.add_argument("--date", required=True)
    ap.add_argument("--old-date", default="7 September 2026")
    ap.add_argument("--add", action="append", default=[],
                    help='restore a clause: "Row label::text to append"')
    ap.add_argument("--extra-change", action="append", default=[],
                    help="an additional itemised change history entry")
    ap.add_argument("--section", action="append", default=[],
                    help='append a section: "Heading::bullet||bullet||bullet"')
    ap.add_argument("--no-practitioner-page", action="store_true",
                    help="for documents that already carry one")
    a = ap.parse_args()

    d = docx.Document(a.docx)
    style = d.tables[0].style.name if d.tables and d.tables[0].style is not None else None

    restored = 0
    for spec in a.add:
        label, _, rest = spec.partition("::")
        nth = None
        if "::" in rest:
            nth_s, _, rest = rest.partition("::")
            nth = int(nth_s)
        restored += add_to_row(d, label.strip(), rest.strip(), nth)

    for spec in a.section:
        heading, _, body = spec.partition("::")
        append_section(d, heading.strip(), [b.strip() for b in body.split("||") if b.strip()])

    dashes = strip_em_dashes(d)
    changed = bump_version(d, a.version, a.supersedes, a.date, a.old_date)
    for extra in reversed(a.extra_change):
        prepend_change_entry(d, extra)
    entry = prepend_change_entry(d)
    if not a.no_practitioner_page:
        append_sections(d, style)
    d.save(a.out)

    print(f"{a.out}: em dashes fixed {dashes}, clauses restored {restored}, "
          f"fields {sorted(set(changed))}, change entry {'yes' if entry else 'NO'}")


if __name__ == "__main__":
    main()
