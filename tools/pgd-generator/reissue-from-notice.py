#!/usr/bin/env python3
"""
reissue-from-notice.py  --  write each correction INTO its signed document,
                            and retire the notice stapled to the front of it

WHY
---
On 7 September a CORRECTION NOTICE was prepended to the PDF of six PGDs. Each
said "the signed PGD behind this page is unaltered; these corrections take
precedence". That was a reasonable stopgap for a day and a poor place to
stay: the signed document underneath still said the wrong thing, so a
pharmacy printing from its own records, or reading past page one, had the
error. Two of the notices told a pharmacist one quantity while the document
three pages later printed another. Whichever page they read governed what
they did.

MMR and pneumococcal were taken off this arrangement in August for exactly
that reason. This does the same for the rest.

WHAT IT DOES
------------
For each document: opens the signed .docx, applies the edits listed below
(replace this paragraph with that; insert these bullets after this one),
appends a version and change record page, saves a new versioned .docx,
converts it, and publishes the PDF. The notice is not carried over because
the PDF is rebuilt from the document and the notice was never in the
document.

Every edit is anchored on the paragraph's EXACT text. An anchor that does not
match stops the run for that document with a message, rather than silently
doing nothing, which is the failure mode that let the vaccine sweep miss
chickenpox.

`nth` on an edit selects which occurrence. The propranolol document is two
complete arms, 10mg and 40mg, with identical exclusion lists; an exclusion
must go into BOTH, but the quantity line must differ, because "up to 56
tablets" is a 28 day supply at 10mg and four times that at 40mg.

  python3 tools/pgd-generator/reissue-from-notice.py [--dry]
"""

import copy
import os
import subprocess
import sys

import docx
from docx.enum.text import WD_BREAK
from docx.table import Table
from docx.text.paragraph import Paragraph

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
DATE = "9 September 2026"
HUB = "HUB RX LATEST PRESENTATIONS /2026 PGD"

AUTH = (
    "Authorised by Nitin Shori, Medical Director (GMC 6047293) and Chris "
    f"Pilkington, Head Pharmacist (GPhC 2046322), on {DATE}. Signatures "
    "applied digitally on their joint instruction, which is the established "
    "process for Get Real Health PGDs."
)

GLP1_EXCLUSION_OLD = (
    "Concurrent use of any other GLP-1 receptor agonist or insulin "
    "secretagogue used for weight management."
)
GLP1_EXCLUSION_NEW = (
    "Concurrent use of any other GLP-1 receptor agonist or insulin "
    "secretagogue, FOR ANY INDICATION. Ask specifically about medicines taken "
    "for diabetes and name the products: oral or injectable semaglutide, "
    "tirzepatide, orforglipron, liraglutide, dulaglutide, exenatide, and the "
    "sulfonylureas and meglitinides. Patients do not always think of a "
    "diabetes medicine as the same kind of drug as a weight loss one."
)
GLP1_CHANGE = (
    "The concurrent GLP-1 exclusion read \"used for weight management\". "
    "Several GLP-1 medicines are licensed for type 2 diabetes as well, so a "
    "patient already taking one for diabetes was not caught and could have "
    "been supplied a second. The exclusion now reads \"for any indication\" "
    "and names the products to ask about. This incorporates and withdraws the "
    "correction notice of 7 September 2026. No other change."
)

# slug: (source docx relative to the folder above the repo,
#        new version, old published file, new published file, edits, change text)
# edits: ("replace", anchor, new_text, nth_or_None)
#        ("insert_after", anchor, [texts], nth_or_None)
#        ("delete", anchor, None, nth_or_None)
# nth None = every occurrence.
DOCS = {
    "anxiety-propranolol": dict(
        src=f"{HUB}/ANXIETY PROPRANOLOL FINAL V.docx",
        version="v002", old="anxiety-propranolol.pdf", new="anxiety-propranolol-v002.pdf",
        edits=[
            # The 40mg arm is withdrawn entirely. It is the second complete
            # PGD in the file, from its title page to its change history, and
            # comes out as a block of top-level elements. The rule set by the
            # Medical Director on 9 September 2026: the whole supply taken at
            # once must stay BELOW 320mg, so 28 x 10mg (280mg) is the only
            # supply this PGD offers. 14 x 40mg would have been 560mg.
            ("truncate_from_toplevel", "Propranolol 40mg tablets", None, 2),
            ("replace", "Concurrent intravenous verapamil or diltiazem",
             "Concurrent verapamil or diltiazem, oral or intravenous. With a "
             "beta-blocker the combination risks severe bradycardia, heart block "
             "and hypotension.", None),
            ("insert_after", "Known hypersensitivity to propranolol", [
                "Suicidal ideation, self-harm, or severe depression. Propranolol "
                "is cardiotoxic in overdose. Refer.",
                "PTSD, severe panic disorder or agoraphobia. Refer. This PGD is "
                "for the physical symptoms of situational anxiety only.",
                "Comorbid substance or alcohol misuse. Refer.",
                "Already taking another beta-blocker.",
            ], None),
            ("replace", "Depression",
             "Depression that is not severe and without any suicidal ideation. "
             "Supply may proceed with counselling. Severe depression or any "
             "suicidal ideation is an exclusion, above.", None),
            ("replace", "Up to 56 tablets (28-day supply at twice daily dosing)",
             "Up to 28 tablets of 10mg, 280mg of propranolol in total, and no "
             "more. Propranolol is cardiotoxic in overdose and the whole supply "
             "taken at once must remain below 320mg. One supply per situational "
             "event or course. Review before any repeat. The 40mg strength is "
             "not authorised under this PGD.", None),
        ],
        change=(
            "Version 001 authorised a 40mg arm and printed the same quantity line "
            "for both strengths, up to 56 tablets, which at 40mg is 2,240mg of "
            "propranolol. Propranolol is cardiotoxic in overdose. The 40mg arm is "
            "withdrawn, and the supply is capped at 28 tablets of 10mg, 280mg in "
            "total, so that the entire supply taken at once remains below 320mg. "
            "The document's own guidance named suicidal ideation, severe "
            "depression, PTSD and substance misuse as red flags and none of them "
            "was an exclusion. They are now, with another beta-blocker, and the "
            "verapamil and diltiazem exclusion covers the oral forms as well as "
            "intravenous. This incorporates and withdraws the correction notice "
            "of 7 September 2026."
        ),
    ),
    "asthma-rescue": dict(
        src=f"{HUB}/ASTHMA RESCUE FINAL V.docx",
        version="v002", old="asthma-rescue.pdf", new="asthma-rescue-v002.pdf",
        edits=[
            ("insert_after",
             "Known hypersensitivity to prednisolone or other corticosteroids", [
                "Severe exacerbation with hypoxia (SpO2 below 92%). Refer for "
                "emergency assessment. Do not supply.",
                "Silent chest, exhaustion or confusion. Refer for emergency "
                "assessment. Do not supply.",
                "First presentation suggestive of asthma without a prior "
                "diagnosis. Refer for assessment.",
             ], None),
            ("replace", "For 5-7 day course: 8-10 tablets of 5mg strength",
             "Prednisolone 5mg tablets: 40mg daily is EIGHT tablets a day and "
             "50mg daily is TEN tablets a day. Eight to ten tablets is one day "
             "of treatment, not a course.", None),
            ("replace", "Up to 42 tablets (5mg) for a single course",
             "40 tablets of 5mg for 40mg daily for 5 days. Where the course is 7 "
             "days or the dose is 50mg, supply the number of tablets the course "
             "needs, to a maximum of 70 (50mg daily for 7 days). Check the "
             "arithmetic against the dose before supply.", None),
        ],
        change=(
            "The prednisolone arm stated \"for 5-7 day course: 8-10 tablets of "
            "5mg\" and, two lines later, \"up to 42 tablets\". Eight to ten "
            "tablets is a single day at 40 to 50mg. The quantity is now stated "
            "from the dose: 40 tablets for 40mg daily for 5 days, to a maximum "
            "of 70 for 50mg daily for 7 days. The emergency red flags in the "
            "salbutamol arm, hypoxia, silent chest, exhaustion, confusion and "
            "first presentation, were not in the prednisolone arm's exclusions. "
            "They are now. This incorporates and withdraws the correction notice "
            "of 7 September 2026. The salbutamol arm is unchanged."
        ),
    ),
    "foundayo": dict(
        src="FOUNDAYO_ORFORGLIPRON_PGD_V002_SIGNED_21Aug2026.docx",
        version="v003", old="foundayo-v002.pdf", new="foundayo-v003.pdf",
        edits=[("replace", GLP1_EXCLUSION_OLD, GLP1_EXCLUSION_NEW, None)],
        change=GLP1_CHANGE,
    ),
    "mounjaro": dict(
        src="GRH_MOUNJARO_PGD_V002_SIGNED_06Aug2026.docx",
        version="v003", old="mounjaro-v002.pdf", new="mounjaro-v003.pdf",
        edits=[("replace", GLP1_EXCLUSION_OLD, GLP1_EXCLUSION_NEW, None)],
        change=GLP1_CHANGE,
    ),
    "wegovy": dict(
        src="GRH_WEGOVY_INJECTION_PGD_V002_SIGNED_06Aug2026.docx",
        version="v003", old="wegovy-v002.pdf", new="wegovy-v003.pdf",
        edits=[("replace", GLP1_EXCLUSION_OLD, GLP1_EXCLUSION_NEW, None)],
        change=GLP1_CHANGE,
    ),
    # Not a correction notice. Found by pgd-format-audit.py once it scanned the
    # pages AFTER the change history: three clinical appendices sat behind the
    # signature page, one headed "..., ADDED AT VERSION 004" and one opening
    # "WHY THIS CHANGED. Version 002 and version 003 made ...". Version
    # bookkeeping in a clinical heading, and a change rationale in the body.
    # Both belong in the change history, where the rationale already is.
    "period-delay": dict(
        src="PGD Rewrite 2026/02 Approved/period-delay-v004-SIGNED.docx",
        version="v005", old="period-delay-v004.pdf", new="period-delay-v005.pdf",
        edits=[
            ("replace",
             "Patient Group Direction, version 004, issued 9 September 2026. "
             "Norethisterone 5mg tablets, women aged 16 years and over.",
             "Patient Group Direction, version 005, issued 9 September 2026. "
             "Norethisterone 5mg tablets, women aged 16 years and over.", None),
            ("replace", "RISK FACTORS THAT DO NOT EXCLUDE ON THEIR OWN, ADDED AT VERSION 004",
             "RISK FACTORS THAT DO NOT EXCLUDE ON THEIR OWN", None),
            ("delete_prefix", "WHY THIS CHANGED. Version 002 and version 003 made", None, None),
            ("replace", "v004", "v005", 1),
            ("replace", "Version 003, 9 September 2026", "Version 004, 9 September 2026", 1),
        ],
        change=(
            "An appendix heading carried \"added at version 004\" and a paragraph "
            "headed \"why this changed\" explained what versions 002 and 003 had "
            "got wrong, in the body of the document. Both removed. The rationale "
            "is in the change history for version 004 and remains there. No "
            "clinical change."
        ),
    ),
    "wegovy-oral": dict(
        src="PGD Rewrite 2026/02 Approved/wegovy-oral-v006-SIGNED.docx",
        version="v007", old="wegovy-oral-v006.pdf", new="wegovy-oral-v007.pdf",
        edits=[
            ("replace",
             "Patient Group Direction, version 006, issued 9 September 2026. Oral "
             "semaglutide 1.5mg, 4mg, 9mg and 25mg. Adults 18 to 85.",
             "Patient Group Direction, version 007, issued 9 September 2026. Oral "
             "semaglutide 1.5mg, 4mg, 9mg and 25mg. Adults 18 to 85.", None),
            ("delete", "Three things changed in this version. Read them before supplying.", None, None),
            ("delete", "THE STOPPING RULE IS NOW ONE RULE. See \"Review and the stopping rule\" below.", None, None),
            ("delete_prefix", "BASELINE WEIGHT MUST BE RECORDED AT INITIATION", None, None),
            ("delete_prefix", "SWITCHING FROM THE INJECTION NOW REQUIRES DOCUMENTED EVIDENCE", None, None),
            ("delete_prefix", "The GLP-1 exclusion now reads \"for any indication\". The correction notice", None, None),
            ("replace", "v006", "v007", 1),
            ("replace", "Version 005, 8 September 2026", "Version 006, 9 September 2026", 1),
        ],
        change=(
            "Version 006 opened with a \"three things changed in this version\" "
            "block on page one, ahead of the clinical content, which is version "
            "administration in the body of a clinical document. It is removed. "
            "Every item in it was already in the change history and remains "
            "there. No clinical change."
        ),
    ),
}


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
    """Clone `p` (style, numbering, formatting) for each text, after it."""
    ref = p._p
    for t in texts:
        new = copy.deepcopy(ref)
        ref.addnext(new)
        np = Paragraph(new, p._parent)
        set_text(np, t)
        ref = new


def truncate_from_toplevel(doc, anchor, back):
    """
    Delete every top-level body element from `back` elements before the
    top-level paragraph whose text is `anchor`, to the end of the body, keeping
    the final sectPr. Used to remove a whole arm: its title page sits `back`
    elements before the strength line that identifies it.
    """
    body = doc.element.body
    kids = list(body.iterchildren())
    idx = None
    for i, c in enumerate(kids):
        if c.tag.endswith("}p") and Paragraph(c, doc).text.strip() == anchor:
            idx = i
            break
    if idx is None:
        raise SystemExit(f"truncate: top-level anchor not found: {anchor!r}")
    start = max(0, idx - back)
    removed = 0
    for c in kids[start:]:
        if c.tag.endswith("}sectPr"):
            continue
        body.remove(c)
        removed += 1
    return removed


def apply(doc, edits, slug):
    for kind, anchor, new, nth in edits:
        if kind == "truncate_from_toplevel":
            n = truncate_from_toplevel(doc, anchor, nth or 0)
            print(f"  {kind:13} removed {n} top-level elements from {anchor[:50]!r}")
            continue
        paras = list(walk(doc, doc.element.body))
        if kind == "delete_prefix":
            hits = [p for p in paras if (p.text or "").strip().startswith(anchor)]
        else:
            hits = [p for p in paras if (p.text or "").strip() == anchor]
        if not hits:
            raise SystemExit(f"{slug}: anchor not found, stopping: {anchor[:80]!r}")
        if nth is not None:
            if len(hits) < nth:
                raise SystemExit(f"{slug}: wanted occurrence {nth} of {anchor[:60]!r}, found {len(hits)}")
            hits = [hits[nth - 1]]
        if kind == "replace_each":
            if len(hits) != len(new):
                raise SystemExit(f"{slug}: {anchor[:60]!r} occurs {len(hits)} times, {len(new)} replacements given")
            for p, t in zip(hits, new):
                set_text(p, t)
            print(f"  {kind:13} x{len(hits)}  {anchor[:70]}")
            continue
        for p in hits:
            if kind == "replace":
                set_text(p, new)
            elif kind == "insert_after":
                insert_after(p, new)
            elif kind in ("delete", "delete_prefix"):
                p._p.getparent().remove(p._p)
        print(f"  {kind:13} x{len(hits)}  {anchor[:70]}")


def append_record(doc, version, change):
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    h = doc.add_paragraph()
    h.add_run("Version and change record").bold = True
    doc.add_paragraph(f"Version: {version}")
    doc.add_paragraph(f"Issued: {DATE}")
    doc.add_paragraph("Supersedes: the previous signed version of this document, "
                      "and any correction notice attached to it.")
    doc.add_paragraph("Change: " + change)
    doc.add_paragraph(AUTH)


def main():
    dry = "--dry" in sys.argv
    for slug, d in DOCS.items():
        print(f"== {slug} -> {d['version']}")
        src = os.path.join(PARENT, d["src"])
        if not os.path.exists(src):
            print(f"  SOURCE MISSING: {d['src']}")
            continue
        doc = docx.Document(src)
        apply(doc, d["edits"], slug)
        append_record(doc, d["version"], d["change"])
        if dry:
            print("  (dry run)")
            continue
        out = os.path.join(APPROVED, f"{slug}-{d['version']}-SIGNED.docx")
        doc.save(out)
        subprocess.run(["soffice", "--headless", "--convert-to", "pdf", out],
                       cwd=APPROVED, capture_output=True)
        pdf = out.replace(".docx", ".pdf")
        if not os.path.exists(pdf):
            print("  PDF NOT PRODUCED")
            continue
        with open(pdf, "rb") as a, open(os.path.join(PUBLIC, d["new"]), "wb") as b:
            b.write(a.read())
        old = os.path.join(PUBLIC, d["old"])
        if os.path.exists(old):
            os.remove(old)
        print(f"  published {d['new']}, removed {d['old']}")


if __name__ == "__main__":
    main()
