#!/usr/bin/env python3
"""
fixes-round6.py  --  the joint sign-off of 11 September 2026 applied

Nitin Shori and Chris Pilkington went through the drafted texts and the
morning's decisions together on the evening of 11 September 2026
(round5/SIGN-OFF-11Sep2026.md). Three documents change as a result: the
UTI eGFR 45 gate is nitrofurantoin-only; Shingrix in pregnancy and
breastfeeding is a caution with a recorded discussion, not an exclusion;
melatonin lists the methoxypsoralens once, as an exclusion.

  python3 tools/pgd-generator/fixes-round6.py            all documents
  python3 tools/pgd-generator/fixes-round6.py bph        one document
  python3 tools/pgd-generator/fixes-round6.py --dry      build to /tmp only
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
R6 = os.path.join(HERE, "round6")
DATE = "11 September 2026"
PREV_DATE = "11 September 2026"  # round 4, earlier the same day

STRUCT = (
    "Joint sign-off by the Medical Director and the Head Pharmacist, 11 September 2026: the drafted texts "
    "of version {prev} were reviewed together and confirmed, with the change above."
)


def load_edits():
    merged = {}
    decisions = []
    for n in "AB":
        p = os.path.join(R6, f"edits_{n}.py")
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
    masters = json.load(open(os.path.join(R6, "masters_r5.json")))
    edits, decisions = load_edits()
    edits = {k: v for k, v in edits.items() if v.get("edits")}
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
        pdf = reissue(slug, src, out, version, supersedes, DATE, list(v["changes"]) + [STRUCT.format(prev=v3[1:])],
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


if __name__ == "__main__":
    main()
