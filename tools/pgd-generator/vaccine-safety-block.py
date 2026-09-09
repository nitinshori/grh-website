#!/usr/bin/env python3
"""
vaccine-safety-block.py  --  write the standard vaccine safety block into the
                             original signed vaccine PGDs

WHY
---
An estate-wide sweep of every vaccination PGD found that the original signed
documents were missing, between them: any requirement for adrenaline to be
available, any anaphylaxis provision at all, a stated observation period, a
cold chain excursion procedure, a sharps disposal provision, a batch number
requirement, and any wording on consent in children.

In August some of these were papered over with a CORRECTION NOTICE stapled
to the front of the signed PDF. That was a reasonable stopgap and a poor
resting place: the signed document underneath stayed wrong, so a pharmacy
printing the PGD from its own records, or reading past page one, still had
the original. This writes the requirements into the document itself and
drops the notice, because the new PDF is built from the signed source.

WHY APPEND RATHER THAN REWRITE
------------------------------
None of these documents has a generator script. Rewriting them from scratch
is the practice that caused the damage this review is repairing: five
documents rewritten rather than amended lost a renal dose adjustment, a
fungal exclusion, two pregnancy statements and a training requirement
between them. Appending adds what is missing without touching, and without
risking, anything already there.

These documents are the older format and carry no version field or change
history table the patcher can edit, so the appended block states the version
and the change record itself.

WHAT IT DOES NOT DO
-------------------
It does not review the clinical content. Each of these documents still needs
a proper reissue through the generator, and the block says so in terms so
that nobody mistakes this for a review.

USAGE
-----
  python3 tools/pgd-generator/vaccine-safety-block.py
"""

import os
import subprocess
import sys

import docx
from docx.enum.text import WD_BREAK

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PARENT = os.path.dirname(ROOT)

DATE = "9 September 2026"

BLOCKS = {
    "adrenaline": (
        "Anaphylaxis: what must be in place before you vaccinate",
        [
            "ADRENALINE (EPINEPHRINE) 1 IN 1,000 INJECTION must be immediately available in the room where vaccination takes place, in date, together with a telephone.",
            "A written anaphylaxis protocol consistent with current Resuscitation Council UK guidance must be available, and every person administering must be trained in the recognition and immediate management of anaphylaxis and hold current basic life support training.",
            "Be able to distinguish a faint and a panic attack from anaphylaxis. Green Book chapter 8 sets out the clinical features of each. A faint after an injection is common; anaphylaxis is very rare.",
            "Report any suspected anaphylaxis via the Yellow Card Scheme even where the diagnosis is uncertain.",
        ],
    ),
    "observation": (
        "Observation after vaccination",
        [
            "OBSERVE EVERY PATIENT FOR 15 MINUTES AFTER VACCINATION, SEATED.",
            "Anxiety-related reactions including vasovagal syncope, hyperventilation and transient visual disturbance or paraesthesia can occur before or after any injection, and are commonest in adolescents. They are a response to the needle, not to the vaccine.",
            "Have procedures in place to prevent injury from a faint.",
            "Record that the observation period was completed.",
        ],
    ),
    "coldchain": (
        "Cold chain and excursions",
        [
            "Store at +2C to +8C in the original packaging to protect from light. Do not freeze, and discard any vaccine that has been frozen.",
            "COLD CHAIN EXCURSION: any stock exposed to conditions outside +2C to +8C must be QUARANTINED and risk assessed in accordance with UKHSA Vaccine Incident Guidance before any further use.",
            "Do not administer excursion stock until that assessment is complete and has been recorded.",
            "Where the product SPC gives specific stability data for a temporary excursion, that data governs; otherwise quarantine and assess.",
        ],
    ),
    "sharps": (
        "Disposal",
        [
            "Dispose of used syringes, needles, vials and any unused or reconstituted vaccine in a UN-approved puncture-resistant sharps container.",
            "Follow local authority requirements and Health Technical Memorandum 07-01, Safe management of healthcare waste.",
            "Never re-sheath a needle.",
        ],
    ),
    "batch": (
        "Records: traceability",
        [
            "RECORD THE VACCINE NAME AND BATCH NUMBER for every dose administered. This is a requirement for any biological product and it is what makes a recall actionable.",
            "Record also the expiry date, the dose, the route, the anatomical site, and where more than one vaccine was given at the same visit, the site of each.",
            "Record the name and registration number of the person administering, and that the vaccine was given under this PGD.",
        ],
    ),
    "parental": (
        "Consent in children and young people",
        [
            "Where the individual is UNDER 16, valid consent must come from a person with PARENTAL RESPONSIBILITY, or from the young person where you assess them as GILLICK COMPETENT.",
            "Record which of the two applied. Where consent was given by a person with parental responsibility, record their name and relationship to the patient. Where the young person consented on the basis of Gillick competence, record the basis of that assessment.",
            "A parent accompanying a child does not automatically hold parental responsibility. Ask.",
            "Users must be competent in assessing consent in children and young people before working under this PGD.",
        ],
    ),
}

# slug -> (signed source docx relative to the folder above the repo,
#          public filename now, new public filename, which blocks are missing)
DOCS = [
    ("hep-ab-travel",
     "PGD SIGNED/HEPATITIS_AB_TRAVEL_PGD_V001_SIGNED_21Aug2026.docx",
     "hep-ab-travel-v001.pdf", "hep-ab-travel-v002.pdf", "v002",
     ["observation", "coldchain", "sharps"]),
    ("japanese-encephalitis",
     "PGD SIGNED/JAPANESE_ENCEPHALITIS_PGD_V001_SIGNED_21Aug2026.docx",
     "japanese-encephalitis-v001.pdf", "japanese-encephalitis-v002.pdf", "v002",
     ["observation", "coldchain", "sharps", "parental"]),
    ("travel-core",
     "HUB RX LATEST PRESENTATIONS /2026 PGD/TRAVEL HEALTH CORE PACKAGE FINAL V.docx",
     "travel-core.pdf", "travel-core-v002.pdf", "v002",
     ["adrenaline", "observation", "coldchain", "sharps", "batch", "parental"]),
    ("rsv",
     "HUB RX LATEST PRESENTATIONS /2026 PGD/RSV final V.docx",
     "rsv.pdf", "rsv-v002.pdf", "v002",
     ["coldchain", "sharps", "parental"]),
    ("dengue",
     "HUB RX LATEST PRESENTATIONS /2026 PGD/DENGUE VACCINATION FINAL V.docx",
     "dengue.pdf", "dengue-v002.pdf", "v002",
     ["adrenaline", "observation", "coldchain", "sharps", "batch", "parental"]),
    ("hep-b-occupational",
     "HUB RX LATEST PRESENTATIONS /2026 PGD/HEPATITIS B FINAL V.docx",
     "hep-b-occupational.pdf", "hep-b-occupational-v002.pdf", "v002",
     ["adrenaline", "coldchain", "sharps", "parental"]),
    ("pneumococcal",
     "HUB RX LATEST PRESENTATIONS /2026 PGD/PNEUMOCOCCAL FINAL V.docx",
     "pneumococcal.pdf", "pneumococcal-v002.pdf", "v002",
     ["adrenaline", "coldchain", "sharps", "parental"]),
    ("shingles-vaccine",
     "HUB RX LATEST PRESENTATIONS /2026 PGD/SHINGLES FINAL V.docx",
     "shingles-vaccine.pdf", "shingles-vaccine-v002.pdf", "v002",
     ["adrenaline", "observation", "coldchain", "sharps", "parental"]),
    ("junior-travel",
     "JUNIOR_TRAVEL_VACCINES_PGD_V002_SIGNED_06Aug2026.docx",
     "junior-travel-v002.pdf", "junior-travel-v003.pdf", "v003",
     ["observation"]),
    ("yellow-fever",
     "YELLOW_FEVER_STAMARIL_PGD_V001_SIGNED_14Aug2026.docx",
     "yellow-fever.pdf", "yellow-fever-v002.pdf", "v002",
     ["observation"]),
    ("mmr",
     "HUB RX LATEST PRESENTATIONS /2026 PGD/MMR FINAL V.docx",
     "mmr.pdf", "mmr-v002.pdf", "v002",
     ["adrenaline", "coldchain", "sharps", "parental"]),
]

NOTICE_SLUGS = {"mmr", "pneumococcal"}


def build(slug, source, version, missing, out_docx):
    d = docx.Document(source)

    p = d.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    h = d.add_paragraph()
    h.add_run(f"VACCINE SAFETY REQUIREMENTS, ADDED AT VERSION {version.upper()}, {DATE}").bold = True
    d.add_paragraph(
        "The requirements on the following pages form part of this Patient Group "
        "Direction and must be met before any vaccine is administered under it. "
        "They were absent from the signed document and were added by this reissue "
        "after an estate-wide safety sweep of every vaccination PGD."
    )
    if slug in NOTICE_SLUGS:
        d.add_paragraph(
            "This version REPLACES the correction notice that was previously "
            "attached to the front of this document. The notice set out these "
            "requirements without changing the signed PGD underneath, so a "
            "pharmacy printing from its own records, or reading past the first "
            "page, still had the original. The requirements are now in the "
            "document itself and the notice is withdrawn."
        )
    d.add_paragraph(
        "This reissue adds the safety requirements below and changes nothing "
        "else. It is NOT a clinical review of this PGD, and one remains "
        "outstanding."
    )

    for key in missing:
        heading, bullets = BLOCKS[key]
        p = d.add_paragraph()
        p.add_run().add_break(WD_BREAK.PAGE)
        hh = d.add_paragraph()
        hh.add_run(heading).bold = True
        for b in bullets:
            d.add_paragraph(b)

    p = d.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    hh = d.add_paragraph()
    hh.add_run("Version and change record").bold = True
    d.add_paragraph(f"Version: {version}")
    d.add_paragraph(f"Issued: {DATE}")
    d.add_paragraph("Supersedes: the previous signed version of this document.")
    d.add_paragraph(
        "Change: the vaccine safety requirements above were added following an "
        "estate-wide sweep of every vaccination PGD, which found that the signed "
        "documents were missing, between them, any requirement for adrenaline to "
        "be available, any anaphylaxis provision, a stated observation period, a "
        "cold chain excursion procedure, a sharps disposal provision, a batch "
        "number requirement, and any wording on consent in children and young "
        "people. The specific items added to THIS document are: "
        + ", ".join(BLOCKS[k][0] for k in missing) + "."
    )
    d.add_paragraph(
        "Authorised by Nitin Shori, Medical Director (GMC 6047293) and Chris "
        f"Pilkington, Head Pharmacist (GPhC 2046322), on {DATE}. Signatures "
        "applied digitally on their joint instruction, which is the established "
        "process for Get Real Health PGDs."
    )
    d.save(out_docx)


def main():
    approved = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
    for slug, src, old, new, version, missing in DOCS:
        source = os.path.join(PARENT, src)
        if not os.path.exists(source):
            print(f"{slug:24} SOURCE MISSING: {src}")
            continue
        out_docx = os.path.join(approved, f"{slug}-{version}-SIGNED.docx")
        build(slug, source, version, missing, out_docx)
        subprocess.run(["soffice", "--headless", "--convert-to", "pdf", out_docx],
                       cwd=approved, capture_output=True)
        print(f"{slug:24} {version}  added: {', '.join(missing)}")


if __name__ == "__main__":
    main()
