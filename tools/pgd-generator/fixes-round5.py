#!/usr/bin/env python3
"""
fixes-round5.py  --  the signatories' decisions applied, 11 September 2026

Nitin answered the sixty questions in round4/DECISIONS.md on the morning
of 11 September 2026 (round4/DECISIONS-ANSWERS.md). Eight reviewers wrote
each answer into the document (round5/edits_A.py to edits_H.py, anchors
verified against the round 4 masters) and into the matching tool. Where a
decision needed new clinical text (the Shingrix 18 to 49 arm, the
pneumococcal guidance summary, the Bexsero 12 to 23 month schedule, the
UKMEC POP list, the famciclovir and Mounjaro SmPC summaries) the text is
drafted from the current source and the change line says so, for Chris
Pilkington to confirm.

Decision 5 (travel-core: one agreement page, one adoption block) is a
structural change done by grh_reissue.keep_last_practitioner_section.

  python3 tools/pgd-generator/fixes-round5.py            all documents
  python3 tools/pgd-generator/fixes-round5.py bph        one document
  python3 tools/pgd-generator/fixes-round5.py --dry      build to /tmp only
"""

import importlib.util
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from grh_reissue import reissue, keep_last_practitioner_section  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
R5 = os.path.join(HERE, "round5")
DATE = "11 September 2026"
PREV_DATE = "11 September 2026"  # round 4, earlier the same day

STRUCT = (
    "Decisions of the authorising signatories, 11 September 2026: the questions raised by the reviews of "
    "10 and 11 September were put to the Medical Director and answered; each answer is written into this "
    "document above and, where the answer set a rule, into the consultation tool. Text drafted from a source "
    "for the Head Pharmacist to confirm is marked as such in the change lines."
)


def load_edits():
    merged = {}
    decisions = []
    for n in "ABCDEFGH":
        p = os.path.join(R5, f"edits_{n}.py")
        spec = importlib.util.spec_from_file_location(f"edits_{n}", p)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        for slug, v in m.EDITS.items():
            if slug in merged:  # two batches touching one document: concatenate
                merged[slug] = {"edits": list(merged[slug]["edits"]) + list(v["edits"]),
                                "changes": list(merged[slug]["changes"]) + list(v["changes"])}
            else:
                merged[slug] = v
        decisions += list(getattr(m, "DECISIONS", []))
    # folic-acid is PGD 3 of 3 inside the B12 and folate document: one reissue
    for twin, host in (("folic-acid", "b12-injection"), ("alopecia-minoxidil", "hair-loss")):
        if twin in merged:
            host_v = merged.setdefault(host, {"edits": [], "changes": []})
            host_v["edits"] = list(host_v["edits"]) + list(merged[twin]["edits"])
            host_v["changes"] = list(host_v["changes"]) + list(merged[twin]["changes"])
            del merged[twin]
    return merged, decisions


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    outdir = "/tmp/r4out" if dry else APPROVED
    os.makedirs(outdir, exist_ok=True)
    masters = json.load(open(os.path.join(R5, "masters_r4.json")))
    edits, decisions = load_edits()
    edits.setdefault("travel-core", {"edits": [], "changes": []})
    edits["travel-core"]["changes"] = list(edits["travel-core"]["changes"]) + [
        "Decision 5: one Agreement to practise page, one premises block, one practitioner table, one adoption "
        "block and one change history for the document, after the last arm; the copies that followed the first "
        "two arms are removed."]
    manifest = {}
    for slug, v in edits.items():
        if args and slug not in args:
            continue
        m = masters[slug]
        src = m["docx_bash"]
        if not os.path.exists(src):
            src = m["docx"]
        v3 = m["version"]                       # e.g. v008
        num = int(v3[1:])
        version = f"v{num + 1:03d}"
        supersedes = f"Version {num:03d}, {PREV_DATE}"
        live = m["pdf"]                         # e.g. bph-v002.pdf
        pdf_name = re.sub(r"-v\d{3}\.pdf$", f"-{version}.pdf", live)
        docx_name = re.sub(r"-v\d{3}-SIGNED\.docx$", f"-{version}-SIGNED.docx", os.path.basename(src))
        out = os.path.join(outdir, docx_name)
        publish = None if dry else os.path.join(PUBLIC, pdf_name)
        remove = None if dry else os.path.join(PUBLIC, live)
        hooks = (keep_last_practitioner_section,) if slug == "travel-core" else ()
        pdf = reissue(slug, src, out, version, supersedes, DATE, list(v["changes"]) + [STRUCT],
                      v["edits"], publish_to=publish, remove=remove, hooks=hooks)
        manifest[slug] = pdf_name
        if slug == "hair-loss" and not dry:
            # one document, two catalogue entries
            shutil.copyfile(pdf, os.path.join(PUBLIC, f"alopecia-minoxidil-{version}.pdf"))
            old = os.path.join(PUBLIC, masters["alopecia-minoxidil"]["pdf"])
            if os.path.exists(old):
                os.remove(old)
            manifest["alopecia-minoxidil"] = f"alopecia-minoxidil-{version}.pdf"
        if slug == "b12-injection":
            manifest["folic-acid"] = pdf_name
    print()
    for k, val in sorted(manifest.items()):
        print(f'  "{k}": "{val}",')


if __name__ == "__main__":
    main()
