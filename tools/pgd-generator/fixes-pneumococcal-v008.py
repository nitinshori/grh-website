#!/usr/bin/env python3
"""
Pneumococcal v008: a Prevenar 20 (PCV20) arm is added.

Reported by a customer on 24 September 2026: the document authorised
Pneumovax 23 and Prevenar 13 only and said Prevenar 20 was outside its scope,
while the national programme moved adults at 65 and the clinical risk groups
to Prevenar 20 in early 2026 and PPV23 is no longer available to order. The
gap had been on the review register since version 003 (round 4 option (a):
"add a Prevenar 20 arm if the service wants to stock it"). It does.

Sources checked on 24 September 2026: Prevenar 20 SmPC (emc 13461, single
dose from 2 years, at least 8 weeks after any previous conjugate vaccine,
adults single dose, PCV20 before PPV23 where both are given, hypersensitivity
to diphtheria toxoid contraindication, IM only, caution in bleeding disorders,
immunocompromised on an individual basis, pregnancy only where benefit
outweighs risk, flu co-administration with optional 4 week separation in the
highest risk, 2 to 8 C with 96 hour excursion data at 8 to 25 C); Green Book
chapter 25 as already summarised in part 2 of this document.

  python3 tools/pgd-generator/fixes-pneumococcal-v008.py          reissue
  python3 tools/pgd-generator/fixes-pneumococcal-v008.py --dry    build to /tmp only
"""

import copy
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from docx.table import Table  # noqa: E402
from grh_reissue import reissue, walk  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
DATE = "24 September 2026"

SRC = os.path.join(APPROVED, "pneumococcal-v007-SIGNED.docx")
LIVE = "pneumococcal-v007.pdf"
VERSION = "v008"
SUPERSEDES = "Version 007, 14 September 2026"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

SEVERE = ("Severe immunocompromise as defined in Green Book chapter 25 (bone marrow transplant, acute or chronic "
          "leukaemia, multiple myeloma, or a genetic immune disorder such as IRAK-4 or NEMO deficiency): the "
          "multi-dose sequence needs specialist input and is not given under this PGD. Refer.")
CHEMO = ("Currently receiving chemotherapy or radiotherapy, or within 3 months of completing it (6 months after "
         "chemotherapy for leukaemia): not given under this PGD; refer to the treating team, which decides the timing "
         "(part 2: vaccination is not delayed where that would mean it never happens, so long-term maintenance "
         "treatment is not an indefinite deferral). Where treatment is planned and has not started, give at least 2 "
         "weeks before it does.")
FEVER = "Acute illness with fever (postpone until recovered; a minor illness without fever or systemic upset is not a reason to postpone)."
CKD = "chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant)"
PREV_POLY = ("Any previous dose of PPV23, PCV20, Vaxneuvance (PCV15) or Capvaxive (PCV21) given at 2 years of age or "
             "older, whatever the interval, except for asplenia, splenic dysfunction or " + CKD + " where at least 5 "
             "years have elapsed since the last PPV23 or PCV20 dose (5-yearly revaccination, Green Book chapter 25). "
             "An individual vaccinated for a risk group does not need another dose at 65.")
NOT_ELIGIBLE = ("Not in an eligible group: for example a healthy adult under 65 asking for the vaccine privately. Not "
                "authorised under this PGD, whatever the product licence says.")

# ---------------------------------------------------------------- part 2, cover, Pneumovax 23 arm
EDITS = [
    ("replace",
     "Note: this summary describes the national programme as set out in the July 2026 Green Book chapter, which moved adults at 65 and the clinical risk groups from PPV23 to Prevenar 20 (PCV20) in early 2026 and includes the infant schedule. The products authorised under this PGD are Prevenar 13 and Pneumovax 23 only, for individuals aged 2 years and over. Prevenar 20 and the infant schedule are outside this PGD: where national guidance indicates PCV20 for the individual and it is not held, refer to the GP.",
     "Note: this summary describes the national programme as set out in the July 2026 Green Book chapter, which moved adults at 65 and the clinical risk groups from PPV23 to Prevenar 20 (PCV20) in early 2026 and includes the infant schedule. The products authorised under this PGD are Prevenar 20 and Pneumovax 23, for individuals aged 2 years and over. Where Prevenar 20 is held it is given in preference; Pneumovax 23 is given where Prevenar 20 is not held, where the subcutaneous route is needed, and for the later 5-yearly revaccination cycles of asplenia, splenic dysfunction and chronic kidney disease once Prevenar 20 has been given once. Prevenar 13 is no longer authorised under this PGD from version 008: the programme gives no further PCV13 from 2 years of age. The infant schedule, and the multi-dose sequences for severe immunocompromise and bone marrow transplant, are outside this PGD: refer."),
    ("replace",
     "Immunosuppression due to disease or treatment, including chemotherapy, bone marrow transplant, asplenia or splenic dysfunction, complement disorder, HIV infection at all stages, multiple myeloma, genetic disorders affecting the immune system (IRAK-4, NEMO), and systemic steroids for more than a month at a dose equivalent to prednisolone 20mg or more a day (or 1mg/kg a day in a child under 20kg)",
     "Immunosuppression due to disease or treatment, including chemotherapy, bone marrow transplant, asplenia or splenic dysfunction, complement disorder, HIV infection at all stages, multiple myeloma, genetic disorders affecting the immune system (IRAK-4, NEMO), and systemic steroids for more than a month at a dose equivalent to prednisolone 20mg or more a day (or 1mg/kg a day in a child under 20kg). Those with severe immunocompromise (bone marrow transplant, leukaemia, myeloma, genetic immune disorders) follow the multi-dose sequence in the schedule table below rather than a single dose"),
    ("replace",
     "Occupational risk from frequent or continuous exposure to metal fumes, such as welders (PPV23, PCV20 or PCV21, one dose if none given before); and people experiencing homelessness (rough sleepers and those using homeless hostels or night shelters, JCVI June 2024)",
     "Occupational risk from frequent or continuous exposure to metal fumes, such as welders (PPV23, PCV20 or PCV21, one dose if none given before; Capvaxive (PCV21) is not authorised under this PGD); and people experiencing homelessness (rough sleepers and those using homeless hostels or night shelters, JCVI June 2024)"),
    ("replace",
     "Requires specialist input. Prevenar 20 is not authorised under this PGD: refer. Where Prevenar 13 is given under this PGD and PPV23 is also indicated, this PGD keeps the 8 week interval stated in the Prevenar 13 arm, which is longer than the Green Book minimum of 4 weeks",
     "Asplenia, splenic dysfunction or complement disorder: one Prevenar 20 (or one Pneumovax 23) under this PGD; asplenia and splenic dysfunction are then revaccinated every 5 years (Prevenar 20 once, Pneumovax 23 thereafter). Severe immunocompromise and bone marrow transplant need specialist input and their multi-dose sequences are not given under this PGD: refer"),
    ("replace",
     "No further PCV13 is needed from 2 years of age, whatever the earlier PCV history (Green Book Table 3). Repeat every 5 years only for asplenia, splenic dysfunction or chronic kidney disease",
     "No further PCV13 is needed from 2 years of age, whatever the earlier PCV history (Green Book Table 3), and Prevenar 13 is not given under this PGD. Repeat every 5 years only for asplenia, splenic dysfunction or chronic kidney disease"),
    # Pneumovax 23 arm
    ("replace",
     "- Individuals aged 2 years and over eligible for pneumococcal vaccination under national guidance.\n- Informed consent obtained from the individual or guardian.\n- No contraindications to pneumococcal vaccination.",
     "- Individuals aged 2 years and over who are eligible for pneumococcal vaccination under Green Book chapter 25: aged 65 and over; or aged 2 years and over and in a clinical risk group (Green Book Table 2), with occupational exposure to metal fumes (such as welders), or experiencing homelessness.\n- Where Prevenar 20 is held it is given in preference under its arm of this PGD. Pneumovax 23 is given where Prevenar 20 is not held, where the subcutaneous route is needed, or for a 5-yearly revaccination of asplenia, splenic dysfunction or " + CKD + " in someone who has already had Prevenar 20 (a repeat Prevenar 20 is not authorised).\n- Where a pneumococcal conjugate vaccine was given, at least 8 weeks have elapsed.\n- Informed consent obtained from the individual, or for a child under 16 from a person with parental responsibility or from the young person where Gillick competent (see the consent page of this PGD).\n- No contraindications to pneumococcal vaccination."),
    ("replace",
     "- Known hypersensitivity to Pneumovax 23 or any of its components.\n- Previous severe allergic reaction to any pneumococcal vaccine.\n- PPV23 or PCV20 received within the last 5 years. Revaccination with Pneumovax 23 is authorised only for asplenia, splenic dysfunction or chronic kidney disease, and only where at least 5 years have elapsed since the previous dose; it is not recommended for any other group.\n- Acute illness with fever (postpone until recovered).",
     "- Known hypersensitivity to Pneumovax 23 or any of its components.\n- Previous severe allergic reaction to any pneumococcal vaccine.\n- Aged under 2 years.\n- " + NOT_ELIGIBLE + "\n- " + PREV_POLY + "\n- Any pneumococcal conjugate vaccine received within the last 8 weeks.\n- " + SEVERE + "\n- " + CHEMO + "\n- " + FEVER),
    ("replace",
     "Single 0.5 mL dose. Revaccination every 5 years ONLY for asplenia, splenic dysfunction or chronic kidney disease (Green Book chapter 25); not recommended for any other group, and never within 3 years of a previous dose.",
     "Single 0.5 mL dose. Revaccination every 5 years ONLY for asplenia, splenic dysfunction or chronic kidney disease (Green Book chapter 25), counted from the last PPV23 or PCV20 dose; not recommended for any other group."),
    ("replace",
     "One lifetime dose in most cases. Repeat only under specific clinical recommendations.",
     "A single dose under this PGD. A 5-yearly repeat for asplenia, splenic dysfunction or chronic kidney disease is a further single dose under this PGD; no other group is revaccinated."),
    ("replace",
     "Attend for any further dose of the course on the date given. Seek medical advice for a severe or persistent injection site reaction, a fever that does not settle within 48 hours, or any sign of an allergic reaction. Call 999 for difficulty breathing, swelling of the face or throat, or collapse. Where a Pneumovax 23 dose is due after Prevenar 13, attend for it on the date given (at least 8 weeks later).",
     "Seek medical advice for a severe or persistent injection site reaction, a fever that does not settle within 48 hours, or any sign of an allergic reaction. Call 999 for difficulty breathing, swelling of the face or throat, or collapse. Adults at 65 and most risk groups need no further pneumococcal vaccine; asplenia, splenic dysfunction and chronic kidney disease have a repeat dose every 5 years."),
    ("replace",
     "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapter 25 Pneumococcal; JCVI advice on the pneumococcal programme, current; Summaries of Product Characteristics for the vaccine administered, current version",
     "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapter 25 Pneumococcal, edition of 29 July 2026; JCVI advice on the pneumococcal programme, June 2023 and June 2024; Summaries of Product Characteristics for Prevenar 20 (emc 13461) and Pneumovax 23, current versions"),
    ("replace", "date of supply dose, form and route quantity supplied",
     "date, product name and brand, batch number, expiry date, dose, route and site; the eligibility group relied on and the pneumococcal vaccine history checked"),
    # Pneumovax 23 medicine details brought level with the Prevenar 20 arm
    ("replace", "Store in a refrigerator (2°C–8°C). Do not freeze. Protect from light.",
     "Store in a refrigerator (2 to 8 C) in the original packaging to protect from light. Do not freeze; discard if frozen. Apply the cold chain page of this PGD to any excursion."),
    ("replace", "Intramuscular or subcutaneous injection.",
     "Intramuscular injection into the deltoid, or subcutaneous injection where the intramuscular route is not appropriate (for example on the advice of a haematology team in a bleeding disorder)."),
    ("replace",
     "- Use with caution in individuals with bleeding disorders.\n- Record batch number, expiry date and site of administration.\n- Monitor for anaphylaxis for 15 minutes after administration.\n- Inform patient of possible side effects and when to seek help.",
     "- Pregnancy: not an exclusion where the woman is in an eligible group; the vaccine is inactivated and the Green Book finds no evidence of risk. Breastfeeding is not a reason to withhold.\n- Bleeding disorder, thrombocytopenia or anticoagulation: give intramuscularly with a 23 gauge or finer needle and firm pressure without rubbing for at least 2 minutes, or subcutaneously where the haematology team advises against intramuscular injection.\n- Immunosuppression other than the severe group in the exclusions: the response may be reduced but the vaccine is given; where chemotherapy, radiotherapy or splenectomy is planned, give at least 2 weeks before it starts (part 2).\n- Cochlear implant planned: vaccinate before implantation without delaying the operation.\n- Co-administration: may be given at the same time as any other vaccine at a separate site.\n- Observe the patient for 15 minutes after vaccination. Adrenaline and the anaphylaxis requirements of this PGD apply.\n- Record the batch number, expiry date and site of administration in the patient record.\n- Advise on expected side effects and when to seek medical advice."),
    ("replace", "Advise on alternative treatment options and how these can be accessed.",
     "Explain the reason. Where Prevenar 20 is indicated and held, give it under its arm of this PGD; otherwise advise how the vaccine can be accessed through the GP."),
]

# ---------------------------------------------------------------- the new arm
INDICATION = ("Prevenar 20 (pneumococcal polysaccharide conjugate vaccine, 20-valent, adsorbed) is licensed for active "
              "immunisation for the prevention of pneumococcal disease caused by Streptococcus pneumoniae in individuals "
              "from 6 weeks of age. Under this PGD it is given to individuals aged 2 years and over who are eligible under "
              "Green Book chapter 25: adults aged 65 and over, and individuals aged 2 years and over in a clinical risk "
              "group (Green Book Table 2), with occupational exposure to metal fumes, or experiencing homelessness.")

INCLUSION = [
    "- Individuals aged 2 years and over who are eligible for pneumococcal vaccination under Green Book chapter 25: aged 65 and over; or aged 2 years and over and in a clinical risk group (Green Book Table 2), with occupational exposure to metal fumes (such as welders), or experiencing homelessness.",
    "- No previous dose of PPV23, PCV20, Vaxneuvance (PCV15) or Capvaxive (PCV21) given at 2 years of age or older (see the exclusion criteria), except that an individual with asplenia, splenic dysfunction or " + CKD + " who is due a 5-yearly revaccination (at least 5 years since the last PPV23) and has never had Prevenar 20 receives Prevenar 20 as that revaccination dose; later cycles are Pneumovax 23. A previous Prevenar 13, at any age, does not exclude, provided at least 8 weeks have elapsed. A child who had Prevenar 20 under 2 years on the risk group schedule is referred (see the exclusion criteria).",
    "- Informed consent obtained from the individual, or for a child under 16 from a person with parental responsibility or from the young person where Gillick competent (see the consent page of this PGD).",
    "- No contraindications to Prevenar 20.",
]

EXCLUSION = [
    "- Known hypersensitivity to the active substances, to any excipient (sodium chloride, succinic acid, polysorbate 80, aluminium phosphate) or to diphtheria toxoid (CRM197 carrier protein).",
    "- Severe allergic reaction to a previous dose of any pneumococcal vaccine.",
    "- Aged under 2 years. The infant and toddler schedules are not given under this PGD.",
    "- " + NOT_ELIGIBLE,
    "- Any previous dose of Prevenar 20 (PCV20) given at 2 years of age or older, whatever the interval: under this PGD Prevenar 20 is a single lifetime dose and is not repeated (a repeat dose is not established in the SmPC). Later 5-yearly revaccination of asplenia, splenic dysfunction or " + CKD + " is given with Pneumovax 23 under its arm where held, or through the GP. A child aged 2 to 4 who had Prevenar 20 on the under-2 risk group schedule: refer to the GP to complete Green Book Table 3.",
    "- Any previous dose of PPV23, Vaxneuvance (PCV15) or Capvaxive (PCV21) given at 2 years of age or older, whatever the interval, except for asplenia, splenic dysfunction or " + CKD + " where at least 5 years have elapsed since the last PPV23 dose (5-yearly revaccination, Green Book chapter 25). An individual vaccinated for a risk group does not need another dose at 65.",
    "- Any pneumococcal conjugate vaccine received within the last 8 weeks.",
    "- " + SEVERE,
    "- " + CHEMO,
    "- " + FEVER,
]

CAUTIONS = [
    "- Pregnancy: not an exclusion where the woman is in an eligible group. The vaccine is inactivated and the Green Book finds no evidence of risk from inactivated vaccines in pregnancy; the SmPC has no data in pregnancy and advises use where the potential benefit outweighs any risk. Tell her that, record it, and give the vaccine. Breastfeeding is not a reason to withhold.",
    "- Bleeding disorder, thrombocytopenia or anticoagulation: Prevenar 20 is intramuscular only. Give with a 23 gauge or finer needle and firm pressure without rubbing for at least 2 minutes (Green Book chapter 4); on warfarin, confirm the latest INR is up to date and below the top of the target range. Where the individual's haematology team has advised against intramuscular injection, give Pneumovax 23 subcutaneously under its arm of this PGD where held and indicated, or refer.",
    "- Immunosuppression other than the severe group in the exclusions (for example HIV, systemic steroids, completed chemotherapy): the response may be reduced but the vaccine is given. Where chemotherapy, radiotherapy or splenectomy is planned, give at least 2 weeks before it starts (part 2).",
    "- Cochlear implant planned: vaccinate before implantation without delaying the operation.",
    "- Co-administration: may be given at the same time as any other vaccine, including influenza, COVID-19, shingles and RSV vaccines, at a separate site (Green Book). The SmPC notes that with adjuvanted influenza vaccine a gap of about 4 weeks may be considered in those at the highest risk of life-threatening pneumococcal disease; this is not a requirement and must not delay either vaccine.",
    "- Polysorbate 80 may cause hypersensitivity reactions.",
    "- Observe the patient for 15 minutes after vaccination. Adrenaline and the anaphylaxis requirements of this PGD apply.",
    "- Record the batch number, expiry date and site of administration in the patient record.",
    "- Advise on expected side effects and when to seek medical advice.",
]

EXCLUDED_ACTIONS = ("Explain the reason. Where Pneumovax 23 is indicated and held (subcutaneous route needed, or a 5-yearly "
                    "revaccination in someone who has already had Prevenar 20), give it under its arm of this PGD; "
                    "otherwise advise how the vaccine can be accessed through the GP. Document any advice given and the "
                    "decision reached. Inform or refer to the GP as appropriate.")

MEDICINE = {
    "Name, form and strength of medicine": ["Prevenar 20 suspension for injection in pre-filled syringe (pneumococcal polysaccharide conjugate vaccine, 20-valent, adsorbed), 0.5 mL."],
    "Legal category": ["POM"],
    "Storage": ["Store in a refrigerator (2 to 8 C) in the original packaging. Do not freeze; discard if frozen. Store pre-filled syringes horizontally. Use as soon as possible after removal from the refrigerator. Any excursion is quarantined and assessed under the cold chain page of this PGD; the SmPC stability data for that assessment are 96 hours at 8 to 25 C or 72 hours at 0 to 2 C, and the vaccine is returned to 2 to 8 C and the excursion recorded."],
    "Route/method of administration": ["Intramuscular injection only, into the deltoid muscle of the upper arm. Shake vigorously to a homogeneous white suspension and do not use if it cannot be resuspended or shows particles or discolouration. Do not give intravascularly. Not for subcutaneous use."],
    "Dose and frequency": ["One 0.5 mL dose, once, at any age from 2 years. Under this PGD the dose is given at least 8 weeks after any previous pneumococcal conjugate vaccine at any age (the SmPC states this interval for 2 to 17 years; this PGD applies it to adults as well). Not repeated under this PGD: for asplenia, splenic dysfunction or " + CKD + " the later 5-yearly revaccination cycles are Pneumovax 23."],
    "Quantity to be administered and/or supplied": ["0.5 mL per dose: one pre-filled syringe."],
    "Maximum or minimum treatment period": ["A single lifetime dose under this PGD. Infant and toddler doses, repeat doses, and the multi-dose sequences for severe immunocompromise and bone marrow transplant are not given under this PGD."],
    "Adverse effects": ["Adults, very common: injection site pain, muscle pain, joint pain, fatigue, headache; common: fever, injection site redness or swelling; uncommon: hypersensitivity including facial swelling and angioedema, urticaria, lymphadenopathy, chills, diarrhoea, nausea, vomiting. Children and adolescents 5 to 17 years, very common: injection site reactions, headache, muscle pain, fatigue; common: joint pain; uncommon: urticaria, fever. Children 2 to 4 years, very common: injection site reactions, irritability, drowsiness, decreased appetite, fever. Anaphylaxis has been reported with pneumococcal conjugate vaccines. Refer to the SmPC."],
}

FOLLOW_UP = ("Seek medical advice for a severe or persistent injection site reaction, a fever that does not settle within "
             "48 hours, or any sign of an allergic reaction. Call 999 for difficulty breathing, swelling of the face or "
             "throat, or collapse. This is a single dose: adults at 65 and most risk groups need no further pneumococcal "
             "vaccine. Asplenia, splenic dysfunction and chronic kidney disease have a repeat dose every 5 years, given "
             "with Pneumovax 23 (Prevenar 20 is given once only) or through the GP.")


def _text(el):
    return "".join(t.text or "" for t in el.iter(W + "t"))


def _set_cell(cell, lines):
    """One paragraph per cell, lines separated by line breaks, as the masters have it."""
    paras = cell.paragraphs
    first = paras[0]
    for p in paras[1:]:
        p._p.getparent().remove(p._p)
    text = "\n".join(lines)
    runs = first.runs
    if runs:
        runs[0].text = text
        for r in runs[1:]:
            r.text = ""
    else:
        first.add_run(text)


def _rows(tbl, doc):
    out = []
    for r in Table(tbl, doc).rows:
        cells = []
        for c in r.cells:
            if cells and c._tc is cells[-1]._tc:
                continue
            cells.append(c)
        out.append(cells)
    return out


def add_prevenar20_arm(doc):
    body = doc.element.body
    kids = list(body.iterchildren())
    # locate the Prevenar 13 arm: cover heading paragraph two before "Prevenar 13"
    cover = next(i for i, k in enumerate(kids)
                 if k.tag == W + "p" and _text(k).strip() == "Prevenar 13")
    start = cover - 2
    assert _text(kids[start]).strip() == "Patient Group Direction", _text(kids[start])
    # the arm ends with its change history table
    end = next(i for i in range(cover, len(kids))
               if kids[i].tag == W + "p" and _text(kids[i]).strip().startswith("Change history"))
    end = next(i for i in range(end, len(kids)) if kids[i].tag == W + "tbl")
    # insertion point: the "Vaccine safety requirements" page break paragraph
    safety = next(i for i, k in enumerate(kids)
                  if k.tag == W + "p" and _text(k).strip() == "Vaccine safety requirements")
    anchor = kids[safety - 1] if kids[safety - 1].tag == W + "p" and kids[safety - 1].xpath(
        './/w:br[@w:type="page"]') else kids[safety]
    block = [copy.deepcopy(kids[i]) for i in range(start, end + 1)]
    pb = copy.deepcopy(anchor) if anchor is not kids[safety] else None
    if pb is None:
        # build a page-break paragraph from the safety page's own break
        pb = copy.deepcopy(kids[safety])
        for t in pb.iter(W + "t"):
            t.text = ""
        for r in pb.findall(W + "r"):
            if r.find(W + "br") is None:
                pb.remove(r)
    else:
        for t in pb.iter(W + "t"):
            t.text = ""
    anchor.addprevious(pb)
    for el in block:
        anchor.addprevious(el)
    # the spacer paragraphs that used to push the Prevenar 13 cover onto a new
    # page would now make a blank page before the Prevenar 20 cover
    prev = pb.getprevious()
    while prev is not None and prev.tag == W + "p" and not _text(prev).strip() and not prev.xpath('.//w:br[@w:type="page"]'):
        gone = prev
        prev = prev.getprevious()
        gone.getparent().remove(gone)

    # ---- edit the copy
    for k in block:
        if k.tag == W + "p" and _text(k).strip() == "Prevenar 13":
            for t in k.iter(W + "t"):
                t.text = t.text.replace("Prevenar 13", "Prevenar 20")
    tables = [k for k in block if k.tag == W + "tbl"]
    crit = next(t for t in tables if _rows(t, doc)[0][0].text.strip() == "PGD Indication")
    rows = _rows(crit, doc)
    _set_cell(rows[0][1], [INDICATION])
    _set_cell(rows[1][1], INCLUSION)
    _set_cell(rows[2][1], EXCLUSION)
    _set_cell(rows[3][1], CAUTIONS)
    _set_cell(rows[4][1], [EXCLUDED_ACTIONS])
    med = next(t for t in tables if _rows(t, doc)[0][0].text.strip().startswith("Name, form and"))
    for cells in _rows(med, doc):
        key = " ".join(cells[0].text.split())
        if key in MEDICINE:
            _set_cell(cells[1], MEDICINE[key])
        else:
            raise SystemExit(f"unexpected medicine row: {key!r}")
    info = next(t for t in tables if _rows(t, doc)[0][0].text.strip().startswith("Written information"))
    _set_cell(_rows(info, doc)[1][1], [FOLLOW_UP])
    hist = next(t for t in tables if _rows(t, doc)[0][0].text.strip() == "Version number")
    hrows = _rows(hist, doc)
    _set_cell(hrows[1][0], ["008"])
    _set_cell(hrows[1][1], ["Prevenar 20 arm added to this PGD, replacing the Prevenar 13 arm"])
    _set_cell(hrows[1][2], [DATE])
    # heading: "Change history to version 001" -> "Change history"; drop the pointer line
    for k in block:
        if k.tag == W + "p" and _text(k).strip().startswith("Change history"):
            ts = list(k.iter(W + "t"))
            ts[0].text = "Change history"
            for t in ts[1:]:
                t.text = ""
        if k.tag == W + "p" and _text(k).strip().startswith("Later versions are recorded"):
            k.getparent().remove(k)
    # arm-specific safety-page pointer in the Prevenar 20 records row is inherited unchanged.
    print("  pneumococcal: Prevenar 20 arm inserted after the Prevenar 13 arm")

    # withdraw the Prevenar 13 arm: its cover through its change history table
    for i in range(start, end + 1):
        body.remove(kids[i])
    print("  pneumococcal: Prevenar 13 arm withdrawn")

    # cover title
    for p in walk(doc, body):
        t = (p.text or "")
        if t.startswith("Patient Group Direction") and "Pneumovax 23 or Prevenar 13" in t:
            for r in p.runs:
                if r.text == "or Prevenar 13 ":
                    r.text = "or Prevenar 20 "
            assert "Prevenar 20" in p.text, "cover title run split; fix by hand"
            break
    else:
        raise SystemExit("cover title not found")
    print("  pneumococcal: cover title now names Pneumovax 23 or Prevenar 20")

    # hyperlinked NICE address and the part 2 sources sentence: run-level text
    n = 0
    for t in body.iter(W + "t"):
        if t.text and "nice.org.uk/guidance/mg2" in t.text:
            t.text = t.text.replace("nice.org.uk/guidance/mg2", "nice.org.uk/guidance/mpg2")
            n += 1
        if t.text and "the Prevenar 20, Prevenar 13 and Pneumovax 23 SmPCs" in t.text:
            t.text = t.text.replace("the Prevenar 20, Prevenar 13 and Pneumovax 23 SmPCs", "the Prevenar 20 and Pneumovax 23 SmPCs")
            n += 1
    for rel in doc.part.rels.values():
        if rel.is_external and "nice.org.uk/guidance/mg2" in rel.target_ref:
            rel._target = rel.target_ref.replace("guidance/mg2", "guidance/mpg2")
    print(f"  pneumococcal: run-level fixes {n}")


CHANGES = [
    "A Prevenar 20 (PCV20) arm is added, with its own criteria, medicine details and follow-up pages after the "
    "Pneumovax 23 arm. Prevenar 20 is the product the national programme has used for adults at 65 and for the "
    "clinical risk groups since early 2026 and PPV23 can no longer be ordered through the programme; a customer "
    "reported on 24 September 2026 that the document still said Prevenar 20 was outside its scope, a gap on the "
    "review register since version 003. Written from the Prevenar 20 SmPC (emc 13461: licensed from 6 weeks; one "
    "0.5 mL dose from 2 years, with an 8 week interval after any previous conjugate vaccine stated for 2 to 17 "
    "years and applied to all ages by this PGD; need for revaccination not established, so no repeat dose is "
    "authorised; contraindicated with hypersensitivity to diphtheria toxoid; intramuscular only; caution in "
    "bleeding disorders, immunocompromise and pregnancy; cold chain 2 to 8 C with the SmPC excursion data) and "
    "Green Book chapter 25 as summarised in part 2.",
    "The Prevenar 13 arm is withdrawn. The programme gives no further PCV13 from 2 years of age and Prevenar 20 "
    "covers every group this PGD serves, so the arm had no defined population once Prevenar 20 was authorised. "
    "The cover title, the part 2 note, the schedule table and the references now name Prevenar 20 and Pneumovax 23. "
    "Decision of the Medical Director, 24 September 2026, on the hostile review of the draft.",
    "The Pneumovax 23 arm is aligned with the Prevenar 20 arm and with part 2: the eligible groups are named; "
    "Prevenar 20 is the arm to use where it is held and Pneumovax 23 runs down existing stock, serves the "
    "subcutaneous route and gives the 5-yearly revaccination of asplenia, splenic dysfunction and chronic kidney "
    "disease; any previous PPV23 or PCV20 excludes except that revaccination, matching the Green Book statement "
    "that a person vaccinated for a risk group needs no dose at 65; an 8 week interval after a conjugate vaccine, "
    "the same fever wording, and referrals for severe immunocompromise and for current or recent chemotherapy or "
    "radiotherapy are stated in both arms; the 'never within 3 years' residue and the 'further dose of the course' "
    "follow-up line are removed.",
    "Severe immunocompromise (bone marrow transplant, acute or chronic leukaemia, multiple myeloma, genetic immune "
    "disorders) is a referral in both arms: the Green Book sequence for that group is more than one dose and needs "
    "specialist input, and version 007 already said so in the schedule table while the arms still admitted the group. "
    "Individuals outside the eligible groups, such as a healthy adult under 65 asking privately, are stated to be "
    "outside this PGD. The NICE MPG2 reference address is corrected and the references name the Green Book edition "
    "and the SmPCs. The consultation tool offers Prevenar 20 and Pneumovax 23 with the same rules and no longer "
    "offers Prevenar 13.",
]


def main():
    dry = "--dry" in sys.argv
    outdir = "/tmp/pnout" if dry else APPROVED
    os.makedirs(outdir, exist_ok=True)
    out = os.path.join(outdir, f"pneumococcal-{VERSION}-SIGNED.docx")
    reissue("pneumococcal", SRC, out, VERSION, SUPERSEDES, DATE, CHANGES, EDITS,
            publish_to=None if dry else os.path.join(PUBLIC, f"pneumococcal-{VERSION}.pdf"),
            remove=None if dry else os.path.join(PUBLIC, LIVE),
            hooks=[add_prevenar20_arm])
    print(f'  "pneumococcal": "pneumococcal-{VERSION}.pdf",')


if __name__ == "__main__":
    main()
