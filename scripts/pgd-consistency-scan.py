#!/usr/bin/env python3
"""
pgd-consistency-scan.py  --  does the document contradict itself?

WHY THIS EXISTS
---------------
pgd-version-diff answers "what did the rewrite drop?". It cannot answer
"is what is present self-consistent?", because every part of a
contradiction is present.

Every check in place during the September 2026 review was a PRESENCE
check: regex for a string somebody had already thought of. Those checks
returned OK on four documents that contained, between them:

  - inclusion criteria admitting patients aged 65 and over as a qualifying
    comorbidity, and the next bullet requiring a CRB-65 score of 0, which
    scores a point for being 65 or over. The whole group was admitted and
    refused by consecutive bullets.
  - "250mg four times daily (10mL of the 250mg/5mL suspension)". 250mg of
    that suspension is 5mL. A two year old would have had double.
  - an arm heading giving an OR-rule, a subtitle giving an AND-rule over a
    different drug pair, and the inclusion criteria giving a third version.
  - a scope page directing staff to Arm 1 for moderate disease while Arm 1
    admitted only mild disease.
  - a facial duration cap of 7 days inside an exclusion bullet, and 4 weeks
    in the duration box of the same arm.

All five were found by an adopting pharmacy reading the documents by hand.
None was findable by any check that asks whether a string is present.

WHAT IT CHECKS
--------------
  ARITHMETIC   every "<dose> (<volume> of the <strength>/<per>mL
               suspension)" is recomputed. This catches the flucloxacillin
               class of error directly and with certainty.
  OVERLAP      terms that appear in BOTH the inclusion and the exclusion
               criteria of the same arm. Most are legitimate (an inclusion
               says "not pregnant", an exclusion says "pregnancy"), so this
               reports for a human to read rather than asserting a defect.
  AGE FLOORS   every distinct "aged N years and over" in one document. A
               document with three different floors may be correct, but
               somebody should have decided that on purpose.
  DURATION     every distinct maximum duration in one document, for the
               same reason.
  SCORES       a document that requires a clinical score of zero AND lists,
               as a qualifying criterion, something that scores a point on
               that same score.

None of these asserts a defect on its own. Each one asks a question that
a human has to answer, which is the point: the errors above all survived
because nobody was made to answer them.

USAGE
-----
  python3 scripts/pgd-consistency-scan.py
  python3 scripts/pgd-consistency-scan.py skin-infection chest-service
"""

import os
import re
import sys

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CURRENT = os.path.join(REPO, "public", "pgd-documents")
MANIFEST = os.path.join(REPO, "src", "lib", "pgd-document-manifest.ts")


def master_files():
    src = open(MANIFEST, encoding="utf-8").read()
    block = src.split("PGD_MASTER_FILES", 1)[1].split("};", 1)[0]
    return dict(re.findall(r'"([^"]+)":\s*"([^"]+)"', block))


def text_of(path):
    doc = pymupdf.open(path)
    return " ".join("".join(p.get_text() for p in doc).split())


# ── 1. Arithmetic: dose against stated volume ─────────────────────────────
#
# Matches the shapes these documents actually use:
#   "250mg four times daily (10mL of the 250mg/5mL suspension)"
#   "250mg four times daily, which is 5 mL of the 250mg/5mL suspension"
#   "125mg twice daily, being 5 mL of 125mg/5mL"
DOSE_VOLUME = re.compile(
    r"(\d+(?:\.\d+)?)\s*mg\b"                       # the dose
    r"(?:[^.();]{0,60}?)"                           # words between, no clause break
    r"[(,]?\s*(?:which is|being|=)?\s*"
    r"(\d+(?:\.\d+)?)\s*m[lL]\b"                    # the stated volume
    r"[^.();]{0,20}?"                               # short hop only
    r"(\d+(?:\.\d+)?)\s*mg\s*/\s*(\d+(?:\.\d+)?)\s*m[lL]",   # the strength
    re.I,
)

# The first version of the pattern allowed 80 and 40 characters of slack and
# stitched fragments across a whole sentence: from the phrase "using 125mg/5mL
# for the two smallest bands and 250mg/5mL above" it manufactured a dose, a
# volume and a strength that were never stated together, and reported a dose
# error that did not exist. The windows are now short, clause breaks are
# excluded, and a match containing a conjunction is discarded below. A false
# arithmetic finding on a dosing table is exactly the kind of noise that gets
# a scan switched off.
SPANS_CLAUSE = re.compile(r"\b(and|or|for|above|below|band)\b", re.I)

# These documents narrate the errors they correct: v003 of the skin PGD
# quotes "250mg four times daily (10mL of the 250mg/5mL suspension)" in order
# to explain that it was wrong. Without this, the corrected document trips the
# very check that was written to catch the original defect, and every future
# reissue inherits the same false alarm.
#
# A match is historical if the text around it refers to a previous version or
# is inside quotation marks.
HISTORICAL = re.compile(
    r"(version\s*0?0?\d|v00\d|previously|used to|the dose box read|stated|was wrong|earlier version)",
    re.I,
)


def is_historical(text, start, end, window=180):
    before = text[max(0, start - window):start]
    after = text[end:end + 60]
    if HISTORICAL.search(before):
        return True
    # inside a quotation that opened before the match and closes after it
    if before.count('"') % 2 == 1 and '"' in after:
        return True
    return False


def check_arithmetic(text):
    out = []
    for m in DOSE_VOLUME.finditer(text):
        if SPANS_CLAUSE.search(m.group(0)):
            continue
        if is_historical(text, m.start(), m.end()):
            continue
        dose, vol, strength, per = (float(m.group(i)) for i in (1, 2, 3, 4))
        if strength <= 0 or per <= 0:
            continue
        expected = dose / (strength / per)
        if abs(expected - vol) > 0.01:
            out.append(
                (
                    "ARITHMETIC",
                    f"{dose:g}mg of a {strength:g}mg/{per:g}mL suspension is "
                    f"{expected:g}mL, but the document says {vol:g}mL. "
                    f"Context: \"{m.group(0)[:120]}\"",
                )
            )
    return out


# ── 2. Inclusion / exclusion overlap ──────────────────────────────────────

SECTION = re.compile(
    r"(Inclusion criteria)(.*?)(?=Exclusion criteria|Cautions|The medicine|$)"
    r"|(Exclusion criteria)(.*?)(?=Cautions|Actions if|The medicine|$)",
    re.I | re.S,
)

# Terms worth noticing on both sides. Deliberately short: a long list
# produces noise, and a scan that cries wolf gets ignored.
OVERLAP_TERMS = [
    "immunosuppress", "pregnan", "breastfeed", "warfarin", "renal",
    "hepatic", "cellulitis", "excoriat", "broken skin", "fungal",
    "65 and over", "65 or over", "diabet", "penicillin allergy",
]


def check_overlap(text):
    inc, exc = [], []
    for m in SECTION.finditer(text):
        if m.group(1):
            inc.append(m.group(2).lower())
        elif m.group(3):
            exc.append(m.group(4).lower())
    inc_t, exc_t = " ".join(inc), " ".join(exc)
    out = []
    for term in OVERLAP_TERMS:
        if term in inc_t and term in exc_t:
            out.append(
                (
                    "OVERLAP",
                    f'"{term}" appears in BOTH the inclusion and the exclusion '
                    f"criteria. Often legitimate (an inclusion saying \"not X\" "
                    f"and an exclusion saying \"X\"). Read both and confirm.",
                )
            )
    return out


# ── 3. Age floors and durations stated more than once ─────────────────────

AGE_FLOOR = re.compile(r"aged?\s+(\d{1,2})\s+years?\s+(?:and|or)\s+(?:over|above|older)", re.I)
MAX_DURATION = re.compile(r"maximum\s+(?:of\s+)?(\d+)\s*(day|week)s?", re.I)


def check_floors(text):
    out = []
    ages = sorted({int(a) for a in AGE_FLOOR.findall(text)})
    if len(ages) > 1:
        out.append(
            (
                "AGE FLOORS",
                f"this document states {len(ages)} different age floors: "
                f"{', '.join(str(a) + ' years' for a in ages)}. Confirm each is "
                f"deliberate and that every arm says which applies to it.",
            )
        )
    durs = sorted({(int(n), u.lower()) for n, u in MAX_DURATION.findall(text)})
    if len(durs) > 1:
        out.append(
            (
                "DURATIONS",
                f"this document states {len(durs)} different maximum durations: "
                f"{', '.join(f'{n} {u}s' for n, u in durs)}. Confirm each is "
                f"deliberate and stated where a reader will look for it, not "
                f"only inside an exclusion bullet.",
            )
        )
    return out


# ── 4. A score of zero required, with a scoring criterion as an inclusion ─
#
# The chest service required a CRB-65 of 0 while listing age 65 and over as
# a qualifying comorbidity, and CRB-65 scores a point for being 65 or over.

def check_score_gates(text):
    low = text.lower()
    out = []
    if re.search(r"crb-?65[^.]{0,60}\b(score\s+of\s+)?0\b", low) or re.search(
        r"\bcrb-?65\s+score\s+of\s+0", low
    ):
        if re.search(r"age\s+65\s+(and|or)\s+over", low) and "age point" not in low:
            out.append(
                (
                    "SCORE GATE",
                    "this document requires a CRB-65 score of 0 AND mentions age "
                    "65 and over as a criterion. CRB-65 scores a point for being "
                    "65 or over, so every patient in that group scores at least "
                    "1. Either the age point is excluded from the score, in which "
                    "case say so in the document, or the group is refused.",
                )
            )
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    files = master_files()
    slugs = args or sorted(set(files))

    total = 0
    print("Internal consistency scan: does the document contradict itself?")
    print("A finding is a QUESTION, not a verdict. Each one needs a human to")
    print("confirm the document says what it means to say.\n")

    seen = set()
    for slug in slugs:
        if slug not in files:
            continue
        path = os.path.join(CURRENT, files[slug])
        if not os.path.exists(path) or files[slug] in seen:
            continue
        seen.add(files[slug])
        text = text_of(path)

        findings = (
            check_arithmetic(text)
            + check_overlap(text)
            + check_floors(text)
            + check_score_gates(text)
        )
        if not findings:
            continue
        total += len(findings)
        print(f"── {slug}  ({files[slug]})")
        for kind, detail in findings:
            print(f"     [{kind}] {detail}")
        print()

    print(f"{total} questions across {len(seen)} documents.")


if __name__ == "__main__":
    main()
