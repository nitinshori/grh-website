# PGD document generator

`gen.js` builds a signed PGD as .docx from a plain data object. Every
document reissued in the September 2026 review came out of this file.

    npm install docx --prefix tools/pgd-generator
    node tools/pgd-generator/<document>.js
    soffice --headless --convert-to pdf <document>.docx

## Why it lives here now

It used to live in `PGD Rewrite 2026/generator/`, outside the repository.
That folder is the single point of failure for the whole PGD estate: one
omission in `sig()` left the practitioner "Agreement to practise" page out
of 21 signed documents, and nothing about that change was version
controlled, reviewable or recoverable.

## The build gates

`build()` REFUSES to produce a document, rather than warning, when:

- the change history has fewer than two entries, or contains "Full clinical
  review and reissue". Three reissued documents carried exactly that as
  their entire change log, which forced an adopting pharmacy into a manual
  line-by-line comparison to find out what had changed. Writing the log
  properly is also the step that surfaces accidental deletions and forces a
  questionable clinical decision to be defended in writing.
- a version after the first does not name what it supersedes, or omits the
  previous-versions table.
- an em dash appears anywhere in the document data. House rule.

Refuse rather than warn, because a warning printed at 23:13 at the end of a
batch of five gets scrolled past. `gate-test.js` proves the gates hold.

## What every arm gets automatically

`armBlock()` appends the standard governance training requirements (SPC and
BNF familiarity, MHRA safety alerts, CPD and appraisal, indemnity, capacity
and consent) so that a new document script cannot omit them. `sig()` emits
the practitioner agreement page, the premises block and the signature table.

## Before publishing anything from here

    python3 scripts/pgd-version-diff.py <slug>       # what did this drop?
    python3 scripts/pgd-consistency-scan.py <slug>   # does it contradict itself?

Every version-diff finding must be accounted for: a deliberate removal
belongs in the change history, anything else needs reinstating.
