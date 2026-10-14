#!/usr/bin/env python3
"""
COVID-19 (2026/27) v011: no routine 15 minute observation after vaccination.

Nitin (Medical Director), 14 October 2026: "get rid of the 15 minute wait".

Basis: the COVID-19 chapter of the Green Book (chapter 14a, gov.uk version
dated 10 September 2026, page last updated 16 September 2026, checked live on
14 October 2026). It records that the SPCs recommend a minimum of 15 minutes,
that the UK Chief Medical Officers suspended that requirement for the mRNA
vaccines, that the Commission on Human Medicines agreed the suspension in
individuals without a history of allergy, and that "the advice to suspend
the routine 15 minute observation period has since been extended to all
currently available COVID-19 vaccines when used in the NHS programme". This
PGD is for private vaccination; it applies the same approach, which is the
Medical Director's decision and is said so in the text.

What chapter 14a still asks for, and v011 keeps:
  - individuals observed for immediate reactions while they receive the
    post-vaccination advice and leave the premises
  - anaphylaxis facilities and trained staff at every site
  - Table 5: history of allergy, observation of 15 minutes for some, 30 for
    others (special precautions column)
  - flowchart for reactions to a previous dose: 15 or 30 minutes
  - non-allergic reaction to a previous dose (vasovagal episode,
    non-urticarial skin reaction or non-specific symptoms): "Observation for
    15 minutes is recommended."
  - "It is advised not to drive or use machinery until the prevailing
    symptoms have cleared." (The Green Book gives NO fixed 15 minute driving
    rule, so none is written.)

v010 stated universal observation in one place only, the Cautions row
("Observe every individual for 15 minutes ..."). No records row, patient
counselling line or guideline summary line mentioned it, so that is the only
body edit. The v007 history line that introduced universal observation stays
in the previous version records, as history.

  python3 tools/pgd-generator/fixes-covid-v011.py          reissue, publish, manifest
  python3 tools/pgd-generator/fixes-covid-v011.py --dry    build to /tmp only
"""

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from grh_reissue import reissue  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
MANIFEST_TS = os.path.join(ROOT, "src", "lib", "pgd-document-manifest.ts")
DATE = "14 October 2026"

SRC = os.path.join(APPROVED, "covid-v010-SIGNED.docx")
VERSION = "v011"
SUPERSEDES = "Version 010, 30 September 2026"
OLD_PDF = "covid-2026-27-v010.pdf"
NEW_PDF = f"covid-2026-27-{VERSION}.pdf"
SLUGS = ("covid-booster",)

OLD_OBS = ("Observe every individual for 15 minutes after vaccination, seated, and record that the observation "
           "period was completed. Ensure procedures are in place to avoid injury from faints.")
NEW_OBS = (
    "Observation after vaccination. Routine observation is not required. The COVID-19 chapter of the Green Book "
    "(chapter 14a) suspends the routine 15 minute observation period for all currently available COVID-19 "
    "vaccines in the NHS programme, and this PGD applies the same approach. Observe every individual for any "
    "immediate reaction while they receive the post-vaccination advice and leave the premises. Observe for 15 "
    "minutes, or for 30 minutes where chapter 14a Table 5 or its flowchart for reactions to a previous dose "
    "advises 30 minutes: anyone with a history of allergy for whom chapter 14a Table 5 advises observation; "
    "anyone who had an allergic-type reaction to a previous COVID-19 vaccine dose; anyone who had a non-allergic "
    "reaction to a previous dose (vasovagal episode, non-urticarial skin reaction or non-specific symptoms); and "
    "anyone the vaccinator judges needs it. Record the observation period where one was required. Ensure "
    "procedures are in place to avoid injury from faints. Tell every individual how to get immediate healthcare "
    "advice if symptoms develop, and not to drive or use machinery until any symptoms have cleared."
)

EDITS = [
    ("replace", OLD_OBS, NEW_OBS),
]

CHANGES = [
    "Routine 15 minute observation after vaccination removed, in line with the COVID-19 chapter of the Green "
    "Book (chapter 14a), which suspends the routine 15 minute observation period for all currently available "
    "COVID-19 vaccines in the NHS programme; this PGD applies the same approach to private vaccination. "
    "Observation of 15 minutes is retained for anyone with a history of allergy for whom chapter 14a Table 5 "
    "advises it, anyone who had an allergic-type or non-allergic reaction (such as fainting) to a previous dose, "
    "and anyone the vaccinator judges needs it, with 30 minutes where Table 5 or the chapter 14a flowchart "
    "advises 30 minutes. The observation period is recorded where one was required. Every individual is still "
    "observed for immediate reactions while receiving advice and leaving, is told how to get immediate "
    "healthcare advice, and is advised not to drive or use machinery until any symptoms have cleared. "
    "Facilities and trained staff for the management of anaphylaxis remain required. Decision of the Medical "
    "Director, 14 October 2026.",
]


def update_manifest():
    s = open(MANIFEST_TS).read()
    n = 0
    for slug in SLUGS:
        pat = re.compile(r'("' + re.escape(slug) + r'":\s*")' + re.escape(OLD_PDF) + '"')
        s, k = pat.subn(r'\g<1>' + NEW_PDF + '"', s)
        n += k
    if not n:
        raise SystemExit(f"manifest: no entry pointing at {OLD_PDF}")
    open(MANIFEST_TS, "w").write(s)
    print(f"  manifest: {n} entr(y/ies) now {NEW_PDF}")


def main():
    dry = "--dry" in sys.argv
    outdir = "/tmp/covid011" if dry else APPROVED
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, f"covid-{VERSION}-SIGNED.docx")
    reissue("covid-booster", SRC, out, VERSION, SUPERSEDES, DATE, CHANGES, EDITS,
            publish_to=None if dry else os.path.join(PUBLIC, NEW_PDF), remove=None)
    if not dry:
        update_manifest()


if __name__ == "__main__":
    main()
