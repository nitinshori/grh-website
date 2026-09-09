#!/usr/bin/env python3
"""
pgd-version-diff.py  --  what did a reissue silently drop?

WHY THIS EXISTS
---------------
On 7 September 2026 every PGD was archived before the clinical review began,
so that old and new could be compared. The archive was then never opened.
Five documents were rewritten from scratch rather than amended, and an
adopting pharmacy found by manual line-by-line comparison that the rewrites
had lost:

  - the clarithromycin renal dose halving below CrCl 30 (skin, chest)
  - the fungal skin infection exclusion (eczema)
  - the "weeping skin" exclusion (eczema)
  - the pregnancy and breastfeeding statements (dental amoxicillin arm)
  - the SPC/BNF familiarity training requirement (chest, all three arms)
  - the practitioner "Agreement to practise" page (21 documents)

None of those was a decision. Each was a clause that existed, was not carried
across, and was noticed by nobody because nothing compared the two versions.

The checks that were in place at the time were PRESENCE checks: regex for a
string somebody had already thought of. A presence check cannot find a
deletion, because you only search for what you remembered to list. This
script inverts that: it takes the OLD document as the source of things to
look for, so it can only miss what the old document never had.

WHAT IT COMPARES
----------------
Not raw prose. A rewrite legitimately rewords almost every sentence, so a
text diff is pure noise. Instead it extracts, from each version, the items
where a silent loss actually matters:

  DOSES        every number carrying a clinical unit (mg, mL, g, %, kg,
               micrograms, days, hours, times daily, IU)
  MEDICINES    named drugs, from a vocabulary
  CONCEPTS     clinical concepts that gate or modify a supply (renal
               impairment, hepatic, pregnancy, breastfeeding, fungal
               infection, warfarin, weeping skin, and the rest)
  STRUCTURE    document furniture that has legal weight (the practitioner
               agreement page, the premises block, key references)

and reports what the old version had and the new one does not.

READING THE OUTPUT
------------------
A finding is NOT automatically a defect. Removing the ibuprofen arm from the
dental PGD correctly removed every ibuprofen dose with it. The rule is that
every finding must be ACCOUNTED FOR: either it was a deliberate decision, in
which case it belongs in the change history, or it was an accident, in which
case it needs reinstating. A finding that cannot be explained is a defect.

USAGE
-----
  python3 scripts/pgd-version-diff.py                # every document
  python3 scripts/pgd-version-diff.py eczema dental-bridging
  python3 scripts/pgd-version-diff.py --prose eczema # add a clause-level diff
"""

import os
import re
import sys

try:
    import pymupdf
except ImportError:  # older name
    import fitz as pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CURRENT = os.path.join(REPO, "public", "pgd-documents")
ARCHIVE = os.path.join(
    os.path.dirname(REPO), "PGD Archive 2026-09-07 (pre-review)", "master"
)
MANIFEST = os.path.join(REPO, "src", "lib", "pgd-document-manifest.ts")
ACCESS = os.path.join(REPO, "src", "lib", "pgd-access.ts")


# ── loading ───────────────────────────────────────────────────────────────

def master_files():
    """slug -> current filename, from PGD_MASTER_FILES."""
    src = open(MANIFEST, encoding="utf-8").read()
    block = src.split("PGD_MASTER_FILES", 1)[1].split("};", 1)[0]
    return dict(re.findall(r'"([^"]+)":\s*"([^"]+)"', block))


def withdrawn_slugs():
    """
    A withdrawn PGD's current PDF is a withdrawal notice, not a document.
    Diffing a notice page against a full v001 reports every clause in the
    old document as lost, which is true and useless. The first run produced
    seven such documents and they drowned the real findings.

    A check that cries wolf gets ignored, which is how the estate ended up
    in this state in the first place.

    Do not do this with a single regex. The first attempt used
    `NAME[^[]*\[(.*?)\]` and matched into the long explanatory comments that
    sit inside these sets, which both missed seven genuinely retired slugs and
    invented two withdrawals that do not exist. A scan that reports a document
    as withdrawn when it is live is worse than no scan.

    So: find the declaration, walk lines to the closing `])`, drop comment
    lines, and only then read the quoted slugs.
    """
    lines = open(ACCESS, encoding="utf-8").read().splitlines()
    out = set()
    for name in ("RETIRED_SLUGS", "PAUSED_SLUGS", "REBUILDING_SLUGS"):
        start = next(
            (i for i, ln in enumerate(lines)
             if re.match(r"\s*export const " + name + r"\b", ln)),
            None,
        )
        if start is None:
            continue
        for ln in lines[start + 1:]:
            if re.match(r"\s*\]\)", ln):
                break
            code = re.sub(r"//.*$", "", ln)          # strip trailing comment
            if code.strip().startswith("//"):        # whole-line comment
                continue
            out |= set(re.findall(r"'([a-z0-9-]+)'", code))
    return out


def text_of(path):
    if not os.path.exists(path):
        return None
    doc = pymupdf.open(path)
    return "".join(p.get_text() for p in doc)


def archive_candidates(slug, current_name):
    """
    The archive is keyed by the filename the document had on 7 Sep, which for
    a since-renamed document is not its current name. Try the obvious keys.
    """
    stem = re.sub(r"-v\d+.*$", "", os.path.splitext(current_name)[0])
    for name in (f"{slug}.pdf", f"{stem}.pdf", current_name):
        p = os.path.join(ARCHIVE, name)
        if os.path.exists(p):
            return p
    return None


# ── extraction ────────────────────────────────────────────────────────────

# A correction notice stapled to the front of a document is not part of the
# signed PGD. Comparing against it produces phantom findings both ways.
NOTICE = re.compile(
    r"CORRECTION NOTICE.*?(?=\n\s*(?:Patient Group Direction|This Patient Group|ISSUED))",
    re.S | re.I,
)

# Records-retention boilerplate is identical in every PGD and carries numbers
# ("8 years", "25th birthday") that are not clinical doses.
RETENTION = re.compile(
    r"(records? (should be|must be) kept|keep records|retention|for audit purposes)"
    r".{0,500}",
    re.I | re.S,
)

# The retention paragraph is worded slightly differently in each document and
# the block match above does not always cover it. These are its constituent
# phrases, which carry "18 years", "25th birthday" and "8 years" and are not
# clinical content. Left in, they reported an age-floor change in eczema that
# had not happened. A finding that is not real costs as much trust as a real
# one that is missed.
RETENTION_PHRASES = re.compile(
    r"(adults? aged 18 years and over[^.]*"
    r"|children aged under 18 years[^.]*"
    r"|until the 2[56]th birthday[^.]*"
    r"|keep records for 8 years"
    r"|records signed, dated, legible and contemporaneous[^.]*)",
    re.I,
)

UNIT = r"(?:mg|milligrams?|g|grams?|mcg|micrograms?|ml|mL|litres?|%|kg|IU|units?)"

DOSE_PATTERNS = [
    # 250mg, 0.5 mL, 12.5 micrograms, 0.05%
    re.compile(r"\b(\d+(?:\.\d+)?)\s*(" + UNIT + r")\b"),
    # 250mg/5mL
    re.compile(r"\b(\d+(?:\.\d+)?)\s*" + UNIT + r"\s*/\s*(\d+(?:\.\d+)?)\s*" + UNIT + r"\b"),
]

FREQ = re.compile(
    r"\b(once|twice|three times|four times|\d+)\s*(?:a|per)?\s*(?:daily|day)\b"
    r"|\b(?:od|bd|tds|qds)\b"
    r"|\bevery\s+\d+\s*hours?\b",
    re.I,
)

DURATION = re.compile(r"\b(\d+)\s*(?:to\s*\d+\s*)?(days?|weeks?|months?|years?)\b", re.I)

MEDICINES = [
    "amoxicillin", "flucloxacillin", "clarithromycin", "doxycycline", "metronidazole",
    "phenoxymethylpenicillin", "erythromycin", "azithromycin", "ciprofloxacin",
    "trimethoprim", "nitrofurantoin", "cefalexin", "fusidic", "mupirocin",
    "clobetasone", "clobetasol", "betamethasone", "hydrocortisone", "mometasone",
    "fluticasone", "pimecrolimus", "tacrolimus", "calcipotriol", "ibuprofen",
    "paracetamol", "naproxen", "codeine", "aciclovir", "valaciclovir", "famciclovir",
    "fluconazole", "miconazole", "clotrimazole", "terbinafine", "nystatin",
    "chloramphenicol", "prednisolone", "salbutamol", "melatonin", "mebendazole",
    "norethisterone", "levonorgestrel", "ulipristal", "sildenafil", "tadalafil",
    "finasteride", "minoxidil", "tamsulosin", "dapoxetine", "propranolol",
    "varenicline", "bupropion", "naltrexone", "orlistat", "semaglutide",
    "tirzepatide", "liraglutide", "orforglipron", "testosterone", "estradiol",
    "utrogestan", "adrenaline", "epinephrine", "warfarin", "colchicine",
    "isotretinoin", "adapalene", "lymecycline", "ivermectin", "dexamethasone",
    "neomycin", "ceftriaxone", "azelaic", "imiquimod", "podophyllotoxin",
    "desogestrel", "mefenamic", "hydroxocobalamin", "cyanocobalamin",
]

# Concepts that gate or modify a supply. Losing one silently changes who may
# be supplied, or at what dose, without changing any visible medicine name.
CONCEPTS = {
    "renal impairment / dose adjustment":
        r"renal impair|creatinine clearance|crcl|renal function|kidney (disease|impair)",
    # "hepatic dysfunction" is the wording several documents actually use.
    # Matching only "impairment" reported wound-care as having LOST its
    # hepatic exclusions when both arms still carried them, which would have
    # sent someone to restore something already there.
    "hepatic impairment":
        r"hepatic (impair|dysfunction|reaction)|liver (disease|failure|impair)",
    "pregnancy":
        r"pregnan",
    "breastfeeding":
        r"breast[- ]?feed|lactation|breast milk",
    "fungal infection":
        r"fungal|tinea|candid|ringworm|mycotic",
    "viral skin infection":
        r"viral (skin )?infection|herpes|herpetic",
    "bacterial superinfection":
        r"secondary (bacterial )?infection|superinfect|impetig",
    "broken or weeping skin":
        r"weeping|ulcerated|broken skin|excoriat",
    "warfarin / anticoagulation":
        r"warfarin|anticoagul|doac|coumarin|inr\b",
    "QT prolongation":
        r"qt prolong|long qt",
    "photosensitivity":
        r"photosensit",
    "immunosuppression":
        r"immunosuppress|immunocompromis|immune deficien",
    "diabetes":
        r"diabet",
    # A bare "65" matches a quantity, a page number or a dose. Require the
    # word to be doing clinical work.
    "elderly / age 65":
        r"\b(aged?\s+65|65\s+years?|elderly|older (adult|people))\b",
    "SPC / BNF familiarity requirement":
        r"(spc|summary of product characteristics|bnf)\b",
    "indemnity requirement":
        r"indemnit",
    "CPD / appraisal requirement":
        r"\bcpd\b|continuing professional|appraisal",
    "Mental Capacity Act":
        r"mental capacity act",
    "MHRA safety alerts requirement":
        r"mhra.{0,40}(alert|safety)|safety alert",
    "Gillick / parental responsibility":
        r"gillick|parental responsibility",
    "anaphylaxis provision":
        r"anaphylax",
    "observation period":
        r"(15|fifteen)[\s-]*min",
    "cold chain excursion":
        r"excursion|vaccine incident",
    "sharps disposal":
        r"sharps|htm 07|puncture[- ]resistant",
    "flammability of emollients":
        r"flammab|paraffin",
    "key references section":
        r"key references|nice medicines practice guideline|mpg2",
}

STRUCTURE = {
    "practitioner 'Agreement to practise' page":
        r"agreement to practise|agreement to practice",
    "premises block (which pharmacy this PGD relates to)":
        r"premises to which this pgd relates|address of pharmacy premises",
    "practitioner signature table":
        r"name of healthcare professional",
    "organisation adoption block":
        r"adoption (by|and authorisation)|superintendent\s*/\s*clinical lead",
    # Part 2 of the house format: a summary of the guidance the PGD claims to
    # follow. Twenty reissued documents lost it, because the generator did not
    # emit it and no check looked for it. It is what lets a pharmacist see that
    # a document has drifted from national practice.
    "guideline summary section":
        r"summary of (nice|ukmec|the green book|green book|national|sdcep|guidance)"
        r"|nice\s*/\s*nice cks"
        r"|guideline summary",
}


def clean(text):
    text = NOTICE.sub(" ", text)
    text = RETENTION.sub(" ", text)
    text = RETENTION_PHRASES.sub(" ", text)
    return re.sub(r"\s+", " ", text)


def doses_in(text):
    out = set()
    for pat in DOSE_PATTERNS:
        for m in pat.finditer(text):
            out.add(m.group(0).lower().replace(" ", ""))
    for m in FREQ.finditer(text):
        out.add(m.group(0).lower())
    for m in DURATION.finditer(text):
        out.add(m.group(0).lower())
    return out


def meds_in(text):
    low = text.lower()
    return {m for m in MEDICINES if m in low}


def concepts_in(text, table):
    low = text.lower()
    return {name for name, pat in table.items() if re.search(pat, low, re.I)}


# ── prose diff, for a human read ──────────────────────────────────────────

def clauses(text):
    parts = re.split(r"(?:●|•|●|\n)\s*", text)
    out = []
    for p in parts:
        p = re.sub(r"\s+", " ", p).strip()
        if 25 <= len(p) <= 400:
            out.append(p)
    return out


def signature(clause):
    """Content words only, so rewording does not register as deletion."""
    stop = {
        "the", "a", "an", "of", "to", "in", "is", "are", "be", "and", "or", "for",
        "with", "on", "at", "by", "this", "that", "should", "must", "may", "not",
        "any", "where", "if", "as", "it", "from", "their", "they", "patient",
    }
    words = re.findall(r"[a-z]{4,}", clause.lower())
    return frozenset(w for w in words if w not in stop)


def prose_losses(old, new):
    new_sigs = [signature(c) for c in clauses(new)]
    lost = []
    for c in clauses(old):
        sig = signature(c)
        if len(sig) < 4:
            continue
        best = max((len(sig & n) / len(sig) for n in new_sigs), default=0.0)
        if best < 0.45:
            lost.append((round(best, 2), c))
    return sorted(lost)


# ── report ────────────────────────────────────────────────────────────────

def compare(slug, old_text, new_text, show_prose=False):
    old, new = clean(old_text), clean(new_text)
    findings = []

    lost_meds = sorted(meds_in(old) - meds_in(new))
    if lost_meds:
        findings.append(("MEDICINE IN v001, ABSENT NOW", ", ".join(lost_meds)))

    lost_concepts = sorted(concepts_in(old, CONCEPTS) - concepts_in(new, CONCEPTS))
    for c in lost_concepts:
        findings.append(("CONCEPT LOST", c))

    lost_structure = sorted(concepts_in(old, STRUCTURE) - concepts_in(new, STRUCTURE))
    for s in lost_structure:
        findings.append(("STRUCTURE LOST", s))

    # Doses only matter for medicines the new document still carries: dropping
    # an arm legitimately drops its doses.
    kept_meds = meds_in(old) & meds_in(new)
    if kept_meds:
        lost_doses = sorted(doses_in(old) - doses_in(new))
        if lost_doses:
            findings.append((
                "DOSE/QUANTITY IN v001, ABSENT NOW",
                ", ".join(lost_doses[:24]) + (" ..." if len(lost_doses) > 24 else ""),
            ))

    if show_prose:
        for score, c in prose_losses(old, new)[:40]:
            findings.append((f"CLAUSE LOST ({score})", c))

    return findings


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    show_prose = "--prose" in sys.argv

    files = master_files()
    withdrawn = withdrawn_slugs()
    slugs = args or sorted(set(files))

    total = 0
    unpaired = []
    skipped = []
    print("Comparing current documents against the 7 September pre-review archive.")
    print("A finding is not automatically a defect. Every finding must be ACCOUNTED")
    print("FOR: a deliberate removal belongs in the change history; anything else")
    print("needs reinstating. An unexplained finding IS a defect.\n")

    for slug in slugs:
        if slug not in files:
            continue
        if slug in withdrawn and not args:
            skipped.append(slug)
            continue
        new_path = os.path.join(CURRENT, files[slug])
        new_text = text_of(new_path)
        if new_text is None:
            continue
        old_path = archive_candidates(slug, files[slug])
        if old_path is None:
            unpaired.append(slug)
            continue
        old_text = text_of(old_path)
        if old_text is None:
            unpaired.append(slug)
            continue

        findings = compare(slug, old_text, new_text, show_prose)
        if not findings:
            continue
        total += len(findings)
        print(f"── {slug}  ({os.path.basename(old_path)} -> {files[slug]})")
        for kind, detail in findings:
            print(f"     [{kind}] {detail}")
        print()

    print(f"{total} findings across {len(slugs) - len(skipped)} documents.")
    if skipped:
        print(
            f"\nSkipped {len(skipped)} withdrawn or paused PGDs, whose current "
            f"file is a withdrawal notice rather than a document:"
        )
        print("  " + ", ".join(skipped))
    if unpaired:
        print(
            f"\n{len(unpaired)} documents had no archived predecessor to compare "
            f"against (new documents, or renamed beyond recognition):"
        )
        print("  " + ", ".join(unpaired))


if __name__ == "__main__":
    main()
