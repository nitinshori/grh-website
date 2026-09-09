#!/usr/bin/env python3
"""
strip-narration.py  --  take the error narration out of the BODY of a PGD and
                        leave it where it belongs, in the change history

WHY
---
The September reissues explained themselves inside the document. Sections
headed "What version 002 got wrong", and sentences like "Version 001 carried
this warning and version 002 lost it", ran through the scope pages, the
clinical rows and the counselling of sixteen live PGDs.

That is our own error log, printed on page one of a signed document that
adopting pharmacies read and that customers can see. It clutters the clinical
content a pharmacist needs at the point of care, and it advertises our
mistakes instead of telling the reader what to do.

The change history at the back is where a version records what it changed and
why. In every document checked, the narration in the body was already there,
in almost the same words. The body copy is redundant as well as wrong.

WHAT IT DOES
------------
Two passes over a generator script, both stopping at `changes:`, so the
change history is never touched:

  1. Removes a leading "What version NNN got wrong" section from `intro`,
     from its {h:...} down to the next {h:...}.
  2. Inside every string literal, drops whole SENTENCES that narrate a
     previous version, keeping the rest of the string.

Pass 2 is sentence-level on purpose. Most of these asides are appended to a
clinical instruction that must survive:

    "ON THE FACE ... 7 DAYS MAXIMUM, whichever arm. Not 4 weeks.
     Version 002 stated this limit only inside an exclusion bullet ..."

Deleting the bullet would delete the 7 day cap. Deleting the last sentence
leaves the instruction intact.

WHAT IT WILL NOT DO
-------------------
It refuses to empty a string. If every sentence in a literal is narration,
the string is left alone and reported, because that means the clinical
content and the narration are in the same sentence and a human has to
rewrite it rather than a script deleting it.

  python3 tools/pgd-generator/strip-narration.py [--write] [file.js ...]
"""

import io
import os
import re
import sys

NARRATION = re.compile(
    r"(got wrong"
    r"|(?:version|v)\s*0?0?\d\s+(?:stated|said|carried|had|listed|offered|gave|"
    r"left|lost|dropped|permitted|delegated|authorised|treated|pointed|"
    r"required|made|excluded|reversed|covered|kept|omitted)"
    r"|was lost in|this was wrong|which was wrong|nobody noticed"
    r"|is why version|earlier versions of this (?:tool|document))",
    re.I,
)

# A single-quoted JS string literal, allowing \' escapes.
STRING = re.compile(r"'((?:[^'\\]|\\.)*)'")


def split_sentences(s):
    """Split on sentence ends, keeping the terminator with its sentence."""
    parts = re.split(r"(?<=[.!?])\s+", s)
    return [p for p in parts if p.strip()]


def strip_string(s):
    """Return (new, dropped[]) with narrating sentences removed."""
    sents = split_sentences(s)
    if len(sents) < 2:
        return s, []
    keep = [x for x in sents if not NARRATION.search(x)]
    drop = [x for x in sents if NARRATION.search(x)]
    if not drop:
        return s, []
    if not keep:
        # Nothing would survive. Leave it; a human must rewrite this one.
        return s, ["!! WHOLE STRING IS NARRATION: " + s[:110]]
    return " ".join(keep), drop


def find_changes_line(lines):
    for i, l in enumerate(lines):
        if re.match(r"\s*changes\s*:", l) or re.match(r"\s*prior\s*:", l):
            return i
    return len(lines)


# Headings whose whole section is our own error log and comes out.
# NOT every heading containing "got wrong": the HPV one is a list of three
# real clinical points (yeast allergy is not a contraindication, and so on)
# that must stay. That heading is renamed in RENAMES instead.
WRONG_SECTION = re.compile(r"\{\s*h\s*:\s*'What version [^']*got wrong[^']*'")

# Elements whose every sentence is narration and whose clinical content is
# carried by the lines around them. Matched on a distinctive fragment.
DELETE_IF_PRESENT = [
    "Version 002 left a group of adults with no arm at all",
    "Version 003 of this document had that the wrong way round",
    "Version 002 offered 15g and 30g only",
    "Version 002 carried a single adult row and applied it from age 2",
    "This is the counselling point version 001 omitted entirely",
]

# Narration that carries clinical reasoning worth keeping. Rewritten forwards,
# saying what the rule IS and why, without reference to a previous version.
REWRITES = [
    (
        "Why: CRB-65 scores 1 point for being 65 or over, and version 002",
        "     {text:'Why: CRB-65 scores 1 point for being 65 or over. Age 65 and over "
        "also qualifies a patient for treatment under this service. A rule requiring "
        "a total score of 0 would therefore include every patient in that age group "
        "by one criterion and exclude them by the next, and would direct a same-day "
        "referral for what may be a well patient with a productive cough, on "
        "arithmetic alone.',b:true},",
    ),
    (
        'Version 001 permitted repeat supply "where previous response was appropriate '
        'and no new contraindications apply"',
        "     {text:'Repeat supply with no limit on how many times is indefinite "
        "supply of a potent topical corticosteroid with no review, which is not what "
        "a PGD is for.',b:true},",
    ),
]

RENAMES = [
    (
        "Read this first: three things version 001 got wrong",
        "Read this first: three points that are commonly got wrong",
    ),
]


def remove_wrong_section(lines, limit):
    """Drop a '{h:'What version NNN got wrong'}' heading and its bullets."""
    start = None
    for i in range(limit):
        if WRONG_SECTION.search(lines[i]):
            start = i
            break
    if start is None:
        return lines, 0
    end = start + 1
    while end < limit and not re.search(r"\{\s*h\s*:\s*'", lines[end]):
        end += 1
    removed = end - start
    # Keep a blank line if the block was followed by one.
    return lines[:start] + lines[end:], removed


def process(path, write):
    src = io.open(path, encoding="utf-8").read()
    lines = src.split("\n")
    limit = find_changes_line(lines)

    lines, removed = remove_wrong_section(lines, limit)
    if removed:
        print(f"  removed the 'what went wrong' section ({removed} lines)")
        limit = find_changes_line(lines)

    kept = []
    for i, line in enumerate(lines):
        if i < limit and any(frag in line for frag in DELETE_IF_PRESENT):
            print(f"    deleted whole element: {line.strip()[:110]}")
            continue
        kept.append(line)
    lines = kept
    limit = find_changes_line(lines)

    for i in range(limit):
        for frag, new in REWRITES:
            if frag in lines[i]:
                print(f"    rewritten forwards: {lines[i].strip()[:90]}")
                lines[i] = new
        for old, new in RENAMES:
            if old in lines[i]:
                lines[i] = lines[i].replace(old, new)
                print(f"    heading renamed: {old}")

    dropped_total = []
    for i in range(limit):
        line = lines[i]
        if not NARRATION.search(line):
            continue

        def repl(m):
            new, drop = strip_string(m.group(1))
            dropped_total.extend(drop)
            return "'" + new + "'"

        lines[i] = STRING.sub(repl, line)

    out = "\n".join(lines)
    for d in dropped_total:
        print(f"    dropped: {d[:130]}")

    if out != src:
        if write:
            io.open(path, "w", encoding="utf-8").write(out)
            print(f"  WRITTEN {os.path.basename(path)}")
        else:
            print(f"  (dry run, not written) {os.path.basename(path)}")
    else:
        print(f"  no change {os.path.basename(path)}")

    left = sum(1 for l in lines[:find_changes_line(lines)] if NARRATION.search(l))
    if left:
        print(f"  ** {left} line(s) still narrate in the body, needs a human")


def main():
    args = [a for a in sys.argv[1:] if a != "--write"]
    write = "--write" in sys.argv
    here = os.path.dirname(os.path.abspath(__file__))
    files = args or [
        os.path.join(here, f)
        for f in sorted(os.listdir(here))
        if f.endswith(".js") and f not in ("gen.js", "gate-test.js")
    ]
    for f in files:
        print(f"== {os.path.basename(f)}")
        process(f, write)


if __name__ == "__main__":
    main()
