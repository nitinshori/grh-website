#!/usr/bin/env python3
"""
strip-narration-docx.py  --  the same job as strip-narration.py, for the PGDs
                             that have no generator script

WHY A SECOND SCRIPT
-------------------
strip-narration.py edits generator sources. Eight of the affected documents
were never generated: they are signed .docx files that were patched in place.
This does the same sentence-level removal directly on the docx.

WHERE IT STOPS
--------------
At the change history. Everything from the first paragraph that looks like a
version and change record onwards is left exactly as it is, because that is
where this material belongs. If a document has no recognisable change history
heading, the file is SKIPPED rather than stripped end to end, because the
alternative is deleting a document's only record of what changed.

SENTENCES, NOT PARAGRAPHS
-------------------------
Most of these read "<clinical instruction>. Version 001 <what it got wrong>."
Deleting the paragraph deletes the instruction. Only the narrating sentence
goes. A paragraph whose every sentence narrates is reported, not deleted:
that means the instruction and the narration are the same sentence and it
needs rewriting by a person.

RUNS ACROSS RUNS
----------------
python-docx splits a paragraph into runs at every formatting change, so a
sentence can span several runs and a run can hold half a sentence. Editing
run by run would cut sentences in half. This rewrites the paragraph text as
a whole and puts it back in the FIRST run, clearing the others, which keeps
that paragraph's leading formatting and loses mid-paragraph bold. That is
acceptable here and only touches paragraphs that actually narrate.

  python3 tools/pgd-generator/strip-narration-docx.py [--write]
"""

import io
import os
import re
import subprocess
import sys

import docx

NARRATION = re.compile(
    r"(got wrong"
    r"|(?:version|v)\s*0?0?\d\s+(?:stated|said|carried|had|listed|offered|gave|"
    r"left|lost|dropped|permitted|delegated|authorised|treated|pointed|"
    r"required|made|excluded|reversed|covered|kept|omitted|gave)"
    r"|was (?:an exclusion|lost) in version|was lost in the version"
    r"|new in version \d|this was wrong|nobody noticed)",
    re.I,
)

CHANGE_HISTORY = re.compile(
    r"(version and change record|change history|record of changes|"
    r"version and change|changes in this version|what changed in this version)",
    re.I,
)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")

# slug -> (source docx in 02 Approved, published filename in public/)
DOCS = [
    ("ed", "ed-v003-SIGNED.docx", "ed-v003.pdf"),
    ("impetigo", "impetigo-v004-SIGNED.docx", "impetigo-v004.pdf"),
    ("period-delay", "period-delay-v004-SIGNED.docx", "period-delay-v004.pdf"),
    ("tetanus", "tetanus-v004-SIGNED.docx", "tetanus-v004.pdf"),
    ("wegovy-oral", "wegovy-oral-v006-SIGNED.docx", "wegovy-oral-v006.pdf"),
    ("anti-malarials", "antimalarials-v004-SIGNED.docx", "anti-malarials-v004.pdf"),
    ("sleep-melatonin", "sleep-melatonin-v003-SIGNED.docx", "sleep-melatonin-v003.pdf"),
    ("wound-care", "wound-care-v004-SIGNED.docx", "wound-care-v004.pdf"),
]


# Paragraphs where the narration and the clinical point are in the SAME
# sentence, so sentence removal would take the clinical point with it. Each
# is rewritten by hand, forwards, saying what the rule is rather than what a
# previous version got wrong. `None` blanks the paragraph, used where the
# whole thing was justification and the rule itself is stated elsewhere.
PARA_REWRITES = [
    (
        "This was an exclusion in version 001 and was lost in the version 002",
        "Cardiac conduction disorders, including known QT prolongation, or a "
        "family history of either, and concurrent QT-prolonging medicines. "
        "Refer. Mefloquine carries QT prolongation and arrhythmia in its SPC "
        "as rare but serious.",
    ),
    (
        "New in version 002. Version 001 had no route for a penicillin-allergic",
        "This arm is the route for a penicillin-allergic patient who needs an "
        "oral antibiotic.",
    ),
    (
        "Version 002 stated the travel exemption but said nothing about the wound",
        None,
    ),
]


def split_sentences(s):
    parts = re.split(r"(?<=[.!?])\s+", s)
    return [p for p in parts if p.strip()]


def set_text(p, text):
    """Put `text` in the paragraph's first run and empty the rest."""
    runs = p.runs
    if not runs:
        return
    runs[0].text = text
    for r in runs[1:]:
        r.text = ""


def iter_paragraphs(doc):
    """
    Every paragraph in TRUE reading order, walking into tables where they sit.

    doc.paragraphs then doc.tables is the obvious way to do this and it is
    wrong. It puts every table's contents after all the body text, so a
    clinical row that appears on page 3 lands after the change history
    heading found on page 9, and gets treated as part of the change history.
    That is how the first run of this script reported "nothing to change" for
    tetanus, anti-malarials and wound care while their published PDFs plainly
    still narrated. Walk the XML instead.
    """
    from docx.table import Table
    from docx.text.paragraph import Paragraph

    def walk(parent, element):
        for child in element.iterchildren():
            if child.tag.endswith('}p'):
                yield Paragraph(child, parent)
            elif child.tag.endswith('}tbl'):
                tbl = Table(child, parent)
                for row in tbl.rows:
                    for cell in row.cells:
                        yield from walk(cell, cell._tc)

    yield from walk(doc, doc.element.body)


def process(slug, src, write):
    path = os.path.join(APPROVED, src)
    if not os.path.exists(path):
        print(f"  SOURCE MISSING: {src}")
        return False
    d = docx.Document(path)

    paras = list(iter_paragraphs(d))

    # The LAST such heading, not the first. Several of these documents open
    # with a "Three changes in this version" summary, which is not the change
    # history at the back; stopping there would leave the whole document
    # unstripped. And the chosen heading must be in the back half, or this is
    # not a change history at all and the file is left alone.
    stop = None
    for i, p in enumerate(paras):
        if CHANGE_HISTORY.search(p.text or ""):
            stop = i
    if stop is None or stop < len(paras) // 2:
        print(
            f"  SKIPPED: no change history heading in the back half "
            f"(found at {stop} of {len(paras)}), refusing to strip"
        )
        return False

    changed = 0
    for p in paras[:stop]:
        t = p.text or ""
        if not NARRATION.search(t):
            continue

        hand = next((r for frag, r in PARA_REWRITES if frag in t), False)
        if hand is not False:
            set_text(p, hand or "")
            changed += 1
            print(f"    rewritten forwards: {t[:100]}")
            continue

        sents = split_sentences(t)
        keep = [s for s in sents if not NARRATION.search(s)]
        drop = [s for s in sents if NARRATION.search(s)]
        if not keep:
            print(f"    ** whole paragraph narrates, left for a human: {t[:110]}")
            continue
        set_text(p, " ".join(keep))
        changed += 1
        for s in drop:
            print(f"    dropped: {s[:120]}")

    if not changed:
        print("  nothing to change")
        return False
    if write:
        d.save(path)
        print(f"  WRITTEN {src} ({changed} paragraph(s))")
        return True
    print(f"  (dry run) {src} ({changed} paragraph(s))")
    return False


def main():
    write = "--write" in sys.argv
    rebuilt = []
    for slug, src, pub in DOCS:
        print(f"== {slug}")
        if process(slug, src, write):
            rebuilt.append((src, pub))
    if write and rebuilt:
        print("\n== converting and publishing")
        for src, pub in rebuilt:
            subprocess.run(
                ["soffice", "--headless", "--convert-to", "pdf", src],
                cwd=APPROVED, capture_output=True,
            )
            pdf = os.path.join(APPROVED, src.replace(".docx", ".pdf"))
            dest = os.path.join(ROOT, "public", "pgd-documents", pub)
            if os.path.exists(pdf):
                with open(pdf, "rb") as a, open(dest, "wb") as b:
                    b.write(a.read())
                print(f"  published {pub}")
            else:
                print(f"  PDF NOT PRODUCED for {src}, {pub} left as it was")


if __name__ == "__main__":
    main()
