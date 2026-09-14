#!/usr/bin/env python3
"""
fixes-round7.py  --  identity, training and the two document errors raised by
adopting pharmacies on 14 September 2026

Every live document is reissued one version up with four shared changes made
by grh_reissue.normalise (so they also hold for every future reissue):

  * the Get Real Health logo in the page header (52 of 69 masters had none);
  * an ownership statement under the strapline naming Get Real Health Limited
    as the organisation that owns and authorises the direction;
  * the training row no longer demands previous PGD experience; it requires
    PGD training and a competence assessment instead;
  * the earlier "Change history" table is retitled to the versions it covers,
    with a pointer to the Version and change record at the back;
  * and the "This summary is part 2 of the house format" narration that 21
    documents still carried in the body is removed.

Two documents also change in substance (round7/edits.py): the COVID-19 PGD
moves the vaccine particulars from an appendix into the body, and the Eczema
PGD states its supply quantities as marketed packs.

  python3 tools/pgd-generator/fixes-round7.py            all documents
  python3 tools/pgd-generator/fixes-round7.py eczema     one document
  python3 tools/pgd-generator/fixes-round7.py --dry      build to /tmp only
"""

import importlib.util
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from grh_reissue import reissue, _elem_text  # noqa: E402
from docx.text.paragraph import Paragraph  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
R7 = os.path.join(HERE, "round7")
DATE = "14 September 2026"
PREV_DATE = "11 September 2026"  # every current master was issued that day

SHARED = (
    "Identity and training, applied to every Get Real Health PGD on 14 September 2026 after two adopting "
    "pharmacies wrote: the Get Real Health logo is in the page header; the organisation that owns and "
    "authorises this direction, Get Real Health Limited, is named under the strapline with its company "
    "number and registered office; the requirement that practitioners must previously have used a PGD is "
    "replaced by a requirement for PGD training and a competence assessment, so that a newly registered "
    "pharmacist or technician who has completed the training may work under it; and the earlier change "
    "history table is headed with the versions it covers."
)


def load_edits():
    p = os.path.join(R7, "edits.py")
    spec = importlib.util.spec_from_file_location("edits", p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m.EDITS, m.MEDICINE_TABLE_HEAD


def covid_particulars(head):
    """Move the vaccine table (heading, intro, table, checked-against-SPC
    note) from the appendix to the top of The medicine section, and make the
    heading a level-2 heading like its neighbours."""
    def hook(doc):
        body = doc.element.body
        kids = list(body.iterchildren())
        texts = [_elem_text(k).strip() if k.tag.endswith("}p") else None for k in kids]
        try:
            src = texts.index(head)
            dst = texts.index("The medicine")
        except ValueError:
            raise SystemExit("covid: vaccine table heading or 'The medicine' heading not found")
        if src < dst:
            raise SystemExit("covid: vaccine table already sits before The medicine")
        # the block: heading, then everything up to (not including) the next
        # Heading 1 (Appendix 1: Key references)
        end = src + 1
        while end < len(kids) and not (kids[end].tag.endswith("}p") and (texts[end] or "").startswith("Appendix 1: Key references")):
            end += 1
        block = kids[src:end]
        anchor = kids[dst]
        for el in block:
            body.remove(el)
        for el in block:
            anchor.addnext(el)
            anchor = el
        hp = Paragraph(kids[src], doc)
        hp.style = Paragraph(kids[dst], doc).style  # same level as "The medicine"
        print(f"  covid: vaccine table moved under The medicine ({len(block)} elements)")
    return hook


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    outdir = "/tmp/r7out" if dry else APPROVED
    os.makedirs(outdir, exist_ok=True)
    masters = json.load(open(os.path.join(R7, "masters_r6.json")))
    edits, table_head = load_edits()
    manifest = {}
    done = set()
    for slug, m in sorted(masters.items()):
        if args and slug not in args:
            continue
        if slug in ("folic-acid", "alopecia-minoxidil"):
            continue  # twins of b12-injection and hair-loss: one document each
        src = m["docx_bash"]
        if not os.path.exists(src):
            src = m["docx"]
        if src in done:
            continue
        done.add(src)
        v3 = m["version"]
        num = int(v3[1:])
        version = f"v{num + 1:03d}"
        supersedes = f"Version {num:03d}, {PREV_DATE}"
        live = m["pdf"]
        pdf_name = re.sub(r"-v\d{3}\.pdf$", f"-{version}.pdf", live)
        docx_name = re.sub(r"-v\d{3}-SIGNED\.docx$", f"-{version}-SIGNED.docx", os.path.basename(src))
        out = os.path.join(outdir, docx_name)
        publish = None if dry else os.path.join(PUBLIC, pdf_name)
        remove = None if dry else os.path.join(PUBLIC, live)
        v = edits.get(slug, {"edits": [], "changes": []})
        hooks = (covid_particulars(table_head),) if slug == "covid-booster" else ()
        pdf = reissue(slug, src, out, version, supersedes, DATE, list(v["changes"]) + [SHARED],
                      v["edits"], publish_to=publish, remove=remove, hooks=hooks)
        manifest[slug] = pdf_name
        if slug == "hair-loss" and not dry:
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
    json.dump(manifest, open(os.path.join(R7, "manifest_out.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
