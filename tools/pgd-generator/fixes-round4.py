#!/usr/bin/env python3
"""
fixes-round4.py  --  faults in the documents found while aligning and
                     attacking the consultation tools, 11 September 2026

Bringing every ePGD tool into line with its document, and then attacking
the tools, turned up faults in the documents themselves: two age limits in
one document, a records row copied from a treatment template into a
vaccine, a caution that contradicts an exclusion, a quantity row that does
not match the dose row, a product that no longer exists, a title that says
"treatment of Prevention". Four reviewers sorted every note into wording
corrections (applied here, always the safer reading) and decisions for the
signatories (round4/DECISIONS.md, not applied).

The edit lists live in round4/edits_1.py to edits_4.py, one dict per
document, anchored on paragraph text verified against the round 3 masters.
Sources are the round 3 outputs (round4/masters_r3.json); each document
goes up one version.

  python3 tools/pgd-generator/fixes-round4.py            all documents
  python3 tools/pgd-generator/fixes-round4.py bph        one document
  python3 tools/pgd-generator/fixes-round4.py --dry      build to /tmp only
"""

import importlib.util
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from grh_reissue import reissue  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
R4 = os.path.join(HERE, "round4")
DATE = "11 September 2026"
PREV_DATE = "11 September 2026"  # round 3, earlier the same day

STRUCT = (
    "Wording corrections from the tool alignment and adversarial review of the consultation tools, "
    "11 September 2026. Each correction resolves a contradiction inside the document or a plain error, "
    "taking the safer reading; no indication is widened, no dose raised and no exclusion removed. "
    "Questions that need a clinical decision are recorded separately and are not changed here."
)


def load_edits():
    merged = {}
    decisions = []
    for n in (1, 2, 3, 4):
        p = os.path.join(R4, f"edits_{n}.py")
        spec = importlib.util.spec_from_file_location(f"edits_{n}", p)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        for slug, v in m.EDITS.items():
            if slug in merged:
                raise SystemExit(f"{slug} appears in two edit files")
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
    masters = json.load(open(os.path.join(R4, "masters_r3.json")))
    edits, decisions = load_edits()
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
        pdf = reissue(slug, src, out, version, supersedes, DATE, list(v["changes"]) + [STRUCT],
                      v["edits"], publish_to=publish, remove=remove)
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
    if not args:
        with open(os.path.join(R4, "DECISIONS.md"), "w") as f:
            f.write("# Decisions for the signatories (round 4, 11 September 2026)\n\n")
            f.write("Not applied to any document. One line each: document, question, options, recommendation.\n\n")
            for slug, q, opts, rec in decisions:
                f.write(f"- **{slug}**: {q} Options: {opts} Recommendation: {rec}\n")
        print(f"{len(decisions)} decisions written to round4/DECISIONS.md")


if __name__ == "__main__":
    main()
