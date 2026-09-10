#!/usr/bin/env python3
"""
pgd-format-audit.py  --  is every live PGD in the house format, and is what it
                         says about itself true?

THE HOUSE FORMAT, in order:
  1. what the PGD is for, and which medicines it authorises
  2. a summary of the guidance that governs the condition (NICE, NICE CKS,
     the Green Book, UKMEC, SDCEP, whichever body applies)
  3. the PGD itself
and the change history at the BACK, never in the body.

WHAT IT CHECKS, per document in the manifest:
  PART 2      is there a guidance summary, and is it near the front, ahead of
              the clinical content rather than buried behind it
  SOURCE      does that summary name the body and date the summary, so a
              reader can tell when it went stale
  NARRATION   does any text before the change history narrate what a previous
              version got wrong
  HISTORY     is there a change history, and is it in the back third
  VERSION     does the version the document states match the version the
              manifest is serving
  SIGNATURES  are BOTH signatures present as images on the authorisation
              page. Text saying it was signed is not a signature.

A NOTE ON THE DETECTION, because a previous run of this check was wrong.
An earlier scan looked for "summary of ... guidance" and reported 74
documents missing part 2. That was a bad regex, not a finding: the original
signed PGDs head the section "Summary of NICE / NICE CKS Guidelines for
Acne", with "Guidelines", and every one of them was counted as missing. The
pattern below takes guideline, guidelines, guidance and advice, and does not
require the issuing body's name to appear in the heading.

Run:  python3 scripts/pgd-format-audit.py            (summary table)
      python3 scripts/pgd-format-audit.py --detail   (every finding in full)
"""

import os
import re
import sys

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "public", "pgd-documents")
MANIFEST = os.path.join(ROOT, "src", "lib", "pgd-document-manifest.ts")

# Part 2. Deliberately broad on the noun and silent on the issuing body.
PART2 = re.compile(
    r"summary\s+of\s+(?:the\s+)?[^\n]{0,80}?"
    r"(guideline|guidelines|guidance|advice|recommendations)\b"
    r"|^\s*(guideline|guidance)\s+summary\b",
    re.I | re.M,
)

# A named and dated source line under that heading.
BODY = re.compile(
    r"\b(NICE|CKS|Clinical Knowledge Summaries|Green Book|UKHSA|UKMEC|SDCEP|"
    r"FSRH|BNF|SPC|SmPC|BASHH|MHRA|Resuscitation Council|WHO|NTNAC|"
    r"Specialist Pharmacy Service)\b"
)
DATED = re.compile(r"\b(19|20)\d{2}\b")

# Matched against a LINE, at the start of it, so that "recorded in the change
# history" in the middle of a sentence on the practitioner page is not
# mistaken for the change history itself. That mistake made four clean
# documents report as still narrating.
CHANGE_HISTORY = re.compile(
    r"^(version and change record|change history|record of changes|"
    r"version history|amendment history)\b",
    re.I,
)


def change_history_pages(pages):
    """Page indexes whose text contains a change history HEADING."""
    out = []
    for i, t in enumerate(pages):
        if any(CHANGE_HISTORY.match(l.strip()) for l in t.split("\n")):
            out.append(i)
    return out

# Where the clinical body starts. Part 2 must come before this.
# Matched at the START of a line, so that a cover page sentence mentioning
# "the exclusion criteria" does not count as the clinical criteria beginning.
# The real thing is a table row label or a heading, and starts its line.
CLINICAL = re.compile(
    r"^\s*(inclusion criteria|criteria for inclusion|exclusion criteria|"
    r"characteristics of staff|description of treatment|"
    r"who can (?:operate|work) under this)",
    re.I | re.M,
)

NARRATION = re.compile(
    r"(got wrong"
    r"|(?:version|v)\s*0?0?\d\s+(?:stated|said|carried|had|listed|offered|gave|"
    r"left|lost|dropped|permitted|delegated|authorised|treated|pointed|"
    r"required|made|excluded|reversed|covered|kept|omitted)"
    # Version bookkeeping used as a HEADING in the body, which is the same
    # problem in a different dress: "RISK FACTORS ..., ADDED AT VERSION 004".
    # A pharmacist reading a clinical heading does not need to know which
    # version introduced it.
    r"|(?:added|new|introduced|changed|revised) (?:at|in) version\s*0?0?\d"
    r"|was lost in|this was wrong|which was wrong|nobody noticed)",
    re.I,
)

# Operative content: if this appears AFTER the change history and the
# signature page, part 3 has been split around the back matter.
OPERATIVE = re.compile(
    r"(inclusion criteria|exclusion criteria|risk factors|"
    r"do not exclude|dose\b|mg\b|refer\b|contraindicat)", re.I
)
BACK_MATTER = re.compile(
    r"(agreement to practise|standard requirements for every practitioner|"
    r"authorisation|signature|name of healthcare professional|"
    r"change history|version and change record|previous versions)", re.I
)

STATUS_BANNER = re.compile(
    r"^\s*(SUPPLY PAUSED|PARTIAL SUSPENSION|WITHDRAWN|SUSPENDED|"
    r"NOT IN USE|REBUILDING)\b", re.I | re.M
)


def manifest_entries():
    """slug -> filename, in the order the manifest lists them."""
    src = open(MANIFEST).read()
    out = {}
    for m in re.finditer(r'"([a-z0-9\-]+)"\s*:\s*"([a-z0-9\-]+\.pdf)"', src):
        out.setdefault(m.group(1), m.group(2))
    return out


def version_in_filename(fn):
    m = re.search(r"-v(\d{3})\.pdf$", fn)
    return int(m.group(1)) if m else None


def version_in_text(text):
    """The version the document states about itself, from its front matter."""
    m = re.search(r"\bversion\s*0*(\d{1,3})\b", text, re.I)
    return int(m.group(1)) if m else None


def audit(slug, fn):
    path = os.path.join(DOCS, fn)
    if not os.path.exists(path):
        return {"slug": slug, "file": fn, "fail": ["FILE MISSING"]}

    doc = pymupdf.open(path)
    pages = [p.get_text() for p in doc]
    n = len(pages)
    whole = "\n".join(pages)
    front = "\n".join(pages[:2])

    r = {"slug": slug, "file": fn, "pages": n, "fail": [], "note": []}

    # A withdrawal notice is a one page statement that the PGD must not be
    # used, and why. It is not a PGD, so the house format does not apply to
    # it. Reported separately rather than as seven documents "missing a
    # guidance summary", which is what the first run of this audit said.
    if re.match(r"\s*PGD WITHDRAWN\b", pages[0]):
        r["withdrawn"] = True
        r["note"].append("WITHDRAWN notice, not a PGD")
        return r

    # Where does the change history start?
    #
    # Not the first match: several documents open with a "changes in this
    # version" summary. Not the last either: the practitioner page at the very
    # back says "recorded in the change history" in prose, and taking that as
    # the boundary made the real change history look like body text and
    # reported four clean documents as still narrating. Take the FIRST match
    # in the back half.
    # The LAST change history heading is the boundary. Not the first: the
    # original multi-arm documents (HRT has five arms) end EVERY arm with its
    # own change history page, so the first one sits a third of the way in
    # with three complete PGD arms still to come. Anything before the last one
    # is still body.
    hits = change_history_pages(pages)
    if not hits:
        r["fail"].append("no change history")
        hist = n
    else:
        hist = hits[-1]
        if len(hits) > 1:
            r["note"].append(f"{len(hits)} change history sections (multi-arm)")

    # Part 2.
    p2 = next((i for i, t in enumerate(pages) if PART2.search(t)), None)
    if p2 is None:
        r["fail"].append("NO GUIDANCE SUMMARY")
    else:
        r["part2_page"] = p2 + 1
        clin = next((i for i, t in enumerate(pages) if CLINICAL.search(t)), None)
        if clin is not None and p2 > clin:
            r["fail"].append(
                f"guidance summary on page {p2+1} is AFTER the clinical "
                f"criteria on page {clin+1}"
            )
        # Source named and dated, within the summary's own pages.
        window = "\n".join(pages[p2:min(p2 + 3, n)])
        if not BODY.search(window):
            r["fail"].append("guidance summary names no issuing body")
        elif not DATED.search(window):
            r["note"].append("guidance summary carries no date")

    # Narration on any page that is not a change history page.
    #
    # Not "before the last change history": the docx-patched reissues append a
    # version and change record AFTER the original change history table, so
    # the original table, which is allowed to narrate, sat in "the body" and
    # oral Wegovy reported a false finding. A change history section is taken
    # as the page carrying its heading and the page after it, which covers
    # every change history in the estate without reaching into the next arm.
    skip = set()
    for i in hits:
        skip.add(i)
        skip.add(i + 1)
    bad = [
        (i + 1, l.strip())
        for i, t in enumerate(pages)
        if i not in skip
        for l in t.split("\n")
        if NARRATION.search(l)
    ]
    if bad:
        r["fail"].append(f"{len(bad)} passage(s) of version narration in the body")
        r["narration"] = bad

    # SIGNATURES. Both, as images, on the page that names the signatories.
    # "Signed: N. Shori" in text is not a signature. Nitin: "otherwise it's
    # not valid". On 9 September 20 live documents had none and 10 had only
    # Chris's, and every one was a reissue whose patch had appended a sentence
    # saying the signatures had been applied.
    sigs = 0
    for pg in doc:
        t = pg.get_text()
        if re.search(r"Signed on behalf of Get Real Health|Nitin Shori", t):
            n = sum(1 for im in pg.get_images(full=True)
                    if pymupdf.Pixmap(doc, im[0]).width > 15)
            sigs = max(sigs, n)
    if sigs < 2:
        r["fail"].append(f"NOT SIGNED: {sigs} signature image(s), needs both")

    # Version consistency.
    fv, tv = version_in_filename(fn), version_in_text(front)
    if fv is not None and tv is not None and fv != tv:
        r["fail"].append(f"document says version {tv:03d}, manifest serves v{fv:03d}")
    if fv is None:
        r["note"].append("filename carries no version")

    m = STATUS_BANNER.search(whole[:1500])
    if m:
        r["note"].append(f"banner: {m.group(1).upper()}")

    return r


def main():
    detail = "--detail" in sys.argv
    entries = manifest_entries()
    results = [audit(s, f) for s, f in sorted(entries.items())]

    withdrawn = [r for r in results if r.get("withdrawn")]
    live = [r for r in results if not r.get("withdrawn")]
    clean = [r for r in live if not r["fail"]]
    broken = [r for r in live if r["fail"]]

    print(f"{len(results)} manifested documents: {len(live)} live PGDs, "
          f"{len(withdrawn)} withdrawal notices\n")
    print(f"  in the house format, no findings : {len(clean)}")
    print(f"  with at least one finding        : {len(broken)}")
    print(f"  withdrawn (not audited)          : "
          + ", ".join(r["slug"] for r in withdrawn) + "\n")

    counts = {}
    for r in broken:
        for f in r["fail"]:
            key = re.sub(r"\d+", "N", f)
            counts[key] = counts.get(key, 0) + 1
    print("FINDINGS BY KIND")
    for k, v in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {v:3}  {k}")

    print("\nDOCUMENTS WITH FINDINGS")
    for r in broken:
        print(f"  {r['slug']:26} {r['file']:34} {'; '.join(r['fail'])}")
        if detail and r.get("narration"):
            for pg, line in r["narration"][:5]:
                print(f"        p{pg}: {line[:110]}")

    print("\nCLEAN")
    for r in clean:
        note = ("  (" + "; ".join(r["note"]) + ")") if r["note"] else ""
        print(f"  {r['slug']:26} part 2 on page {r.get('part2_page','?')}{note}")


if __name__ == "__main__":
    main()
