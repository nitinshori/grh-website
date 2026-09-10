#!/usr/bin/env python3
"""
fixes-round2.py  --  clinical review of 10 September 2026, round 2: the
                     document contradicts itself

Theme 2 of the register: the same patient is included by one line and
excluded by another, or two parts of the document give two different rules
for the same thing. Each fix below picks one rule and states it everywhere
the document states it. Where a choice had to be made the safer rule was
chosen, and the change record says which.

The two generator-built documents in this theme (chest, dental) are
rebuilt from their generator scripts, not patched here.

Not in this round, recorded for a decision: the travel-core typhoid arm
duplicating the standalone typhoid PGD; RSV supply after 36 weeks; a
Shingrix arm for immunosuppressed adults aged 18 to 49; tetanus in
pregnancy (kept as an unqualified exclusion, now stated as a service
decision that departs from the Green Book).

  python3 tools/pgd-generator/fixes-round2.py            all documents
  python3 tools/pgd-generator/fixes-round2.py tetanus    one document
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from grh_reissue import reissue  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
JANE = os.path.join(PARENT, "Jane 2026 PGD")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
DATE = "10 September 2026"
R1 = "10 September 2026"  # round 1 reissues, same day


def A(name):
    return os.path.join(APPROVED, name)


GLP1_SU = [
    ("replace", "Patients on insulin or sulphonylureas whose GP is unwilling to monitor and adjust their hypoglycaemic regimen.",
     "Insulin-treated diabetes. Refer: a pharmacy weight-management service cannot manage insulin dose reduction."),
    ("replace", "Sulfonylurea or insulin co-use in patients with comorbid type 2 diabetes carries a hypoglycaemia risk. Refer to the prescribing GP or specialist before starting.",
     "Type 2 diabetes on metformin, an SGLT2 inhibitor or a DPP-4 inhibitor only: no dose adjustment is needed, "
     "but inform the GP. Any sulfonylurea, meglitinide or insulin EXCLUDES (see exclusion criteria); there is no "
     "GP-monitored route for those patients under this PGD."),
]
GLP1_SU_CHANGE = (
    "One rule for insulin secretagogues and insulin. The previous version excluded every sulfonylurea or "
    "meglitinide user in one bullet, then excluded them only 'where the GP is unwilling to monitor' two bullets "
    "later, then made co-use a referral caution on the next page. The blanket exclusion stands; insulin-treated "
    "diabetes is now an exclusion in the same terms; the conditional exclusion and the caution are gone."
)

JOBS = [
    # ------------------------------------------------------------ period-delay
    dict(slug="period-delay", src=A("period-delay-v006-SIGNED.docx"), version="v007",
         supersedes="Version 006, " + R1, remove="period-delay-v006.pdf",
         changes=[
             "One rule for each venous thromboembolism risk factor, stated identically in the exclusion criteria, "
             "Appendix 1 and the risk factor page. Version 006 gave smoking three rules (exclude at 35 or over; "
             "exclude at any age; count as a risk factor under 35), BMI three thresholds (35, 30, and 30 to 34.9 "
             "as a counted factor) and long travel two (an exclusion on the cover and in Appendix 1; a counted "
             "factor on the risk factor page). The stricter rule is kept in each case, matching Appendix 1: any "
             "current smoker excludes, BMI 30 or over excludes, a seated journey of 4 hours or more excludes. "
             "The Medical Director confirmed the travel exclusion stands.",
             "The risk factor page now lists the one category 2 factor this PGD does not exclude (aged 40 or "
             "over) and says that smoking, BMI and travel are exclusions rather than counted factors.",
         ],
         edits=[
             ("replace", "AGED 35 OR OVER AND CURRENTLY SMOKES, any number. UKMEC 3 below 15 a day, UKMEC 4 at 15 or more. Under 35 a smoker is UKMEC 2 and is handled as a risk factor below, not an exclusion.",
              "CURRENTLY SMOKES, any amount, any age. UKMEC grades smoking under 35 as category 2 and at 35 or "
              "over as category 3 or 4; this PGD excludes all current smokers, because this is a lifestyle "
              "supply and the risk is avoidable."),
             ("replace", "AGED 35 OR OVER AND STOPPED SMOKING LESS THAN A YEAR AGO. UKMEC 3. Ask this separately: a question that only asks \"do you smoke\" misclassifies a recent quitter.",
              "STOPPED SMOKING LESS THAN A YEAR AGO, any age. Ask this separately: a question that only asks "
              "\"do you smoke\" misclassifies a recent quitter."),
             ("replace", "BMI 35 kg/m2 OR ABOVE. UKMEC 3. Measure or ask for height and weight; do not estimate by looking. BMI 30 to 34.9 is UKMEC 2 and is a risk factor below, not an exclusion.",
              "BMI 30 kg/m2 OR ABOVE. UKMEC grades 30 to 34.9 as category 2 and 35 or over as category 3; this "
              "PGD excludes from 30. Measure or ask for height and weight; do not estimate by looking."),
             ("insert_after", "Active cancer, or cancer treated within the last 12 months.", [
                 "A FLIGHT, COACH, TRAIN OR CAR JOURNEY OF 4 HOURS OR MORE during the course, or within 2 weeks "
                 "of finishing it. This will exclude many holiday requests; that is intended. Give the "
                 "alternatives in Appendix 2.",
             ]),
             ("replace", "These are UKMEC 2025 category 2 for combined hormonal contraception: the advantages generally outweigh the risks, so ONE of them alone does NOT exclude. Supply, and counsel on the precautions below.",
              "The one UKMEC 2025 category 2 factor that this PGD does not exclude. On its own it does not "
              "exclude: supply, and counsel on the precautions below."),
             ("delete", "A flight or other seated journey of 4 HOURS OR MORE, during the course or within 2 weeks of finishing it."),
             ("delete", "CURRENT SMOKER AND UNDER 35, any number. UKMEC 2."),
             ("delete", "BMI 30 to 34.9 kg per square metre. UKMEC 2."),
             ("replace_contains", "TWO OR MORE PRESENT TOGETHER: EXCLUDE and refer.",
              "SMOKING (any amount, any age), BMI 30 OR OVER, and a SEATED JOURNEY OF 4 HOURS OR MORE are "
              "EXCLUSIONS in this PGD (see the exclusion criteria and Appendix 1). They are not risk factors "
              "to be counted."),
             ("replace", "Record which risk factors were present and the count, not only the conclusion.",
              "Record the risk factor where present, not only the conclusion."),
             ("replace_contains", "PRECAUTIONS TO GIVE WHERE A LONG JOURNEY IS INVOLVED:",
              "PRECAUTIONS TO GIVE WHERE ANY JOURNEY IS INVOLVED (a seated journey of 4 hours or more "
              "excludes): move around at least hourly, keep well hydrated, avoid alcohol and sedatives on the "
              "journey, and consider graduated compression stockings. Seek urgent help for a painful swollen "
              "calf, sudden breathlessness or chest pain, during the course or in the weeks after it."),
         ]),
    # ----------------------------------------------------------------- tetanus
    dict(slug="tetanus", src=A("tetanus-v006-SIGNED.docx"), version="v007",
         supersedes="Version 006, " + R1, remove="tetanus-v006.pdf",
         changes=[
             "Tetanus-prone wound: assessed by time since the last dose, not by dose count. Version 006 said "
             "five documented doses meant no vaccine for a tetanus-prone wound, in the cover, the inclusion "
             "criteria, the exclusion criteria, the dose row and Appendix 1. UKHSA's Tetanus: advice for "
             "health professionals (Table 4), which this PGD's own part 2 says governs wound management, "
             "gives an immediate reinforcing dose to anyone with an adequate priming course whose last dose "
             "was more than 10 years ago, whatever the total. Every one of those places now says that. The "
             "Wound Care PGD is aligned in the same round.",
             "Immunoglobulin: a wound needing immunoglobulin no longer excludes the vaccine dose. The dose is "
             "given under this PGD where indicated and the patient is referred the same day for "
             "immunoglobulin, which this PGD does not supply.",
             "Pregnancy remains an unqualified exclusion. The document now states that this is a Get Real "
             "Health service decision that departs from Green Book chapter 30, which permits tetanus-containing "
             "vaccines in pregnancy without delay, and that the referral must be the same day so the dose is "
             "not delayed.",
         ],
         edits=[
             ("replace_contains", "FIVE DOCUMENTED DOSES MEANS NO FURTHER VACCINE FOR A TETANUS-PRONE WOUND.",
              "A TETANUS-PRONE WOUND IS ASSESSED BY TIME SINCE THE LAST DOSE, NOT BY DOSE COUNT. Adequate "
              "priming (3 or more doses) with the last dose within 10 years: no vaccine. Last dose more than "
              "10 years ago, whatever the total number of doses: a reinforcing dose under this PGD. High-risk "
              "wound: immunoglobulin as well, which is a same-day referral (UKHSA Tetanus: advice for health "
              "professionals, Table 4)."),
             ("replace_contains", "PREGNANCY IS NOW AN UNQUALIFIED EXCLUSION.",
              "PREGNANCY IS AN UNQUALIFIED EXCLUSION. Refer every pregnant individual to the GP or midwife, "
              "including after a tetanus-prone wound, the same day. This is a Get Real Health service decision "
              "that departs from Green Book chapter 30, which permits tetanus-containing vaccines in pregnancy "
              "without delay; the same-day referral is what stops the departure delaying a needed dose."),
             ("replace_contains", "Has a tetanus-prone wound where a reinforcing dose is indicated under Green Book chapter 30 table 30.1",
              "Has a tetanus-prone wound where a reinforcing dose is indicated under UKHSA Tetanus: advice for "
              "health professionals (Table 4): an adequate priming course (3 or more doses) with the last dose "
              "more than 10 years ago, whatever the total number of doses, or an incomplete or uncertain "
              "history. Where the wound is high risk the dose is still given and the patient is referred the "
              "same day for immunoglobulin as well."),
             ("replace", "Five documented doses of a tetanus-containing vaccine is a complete lifetime course. Understand where that exempts the individual and where it does not, because the two situations point in opposite directions.",
              "Five documented doses of a tetanus-containing vaccine is a complete lifetime course for ROUTINE "
              "purposes: no further scheduled boosters are due. It does NOT exempt the individual from a wound "
              "dose or a travel booster when the last dose was more than 10 years ago, because UKHSA's wound "
              "guidance and the Green Book travel advice both go by time since the last dose."),
             ("replace", "TETANUS-PRONE WOUND, 5 doses already given: NO further vaccine dose is needed. It adds nothing. Do not give one.",
              "TETANUS-PRONE WOUND: adequate priming and the last dose within 10 years, no vaccine. Last dose "
              "more than 10 years ago, give a reinforcing dose under this PGD, whatever the total number of doses."),
             ("replace_contains", "Where the wound is high risk, the question becomes whether tetanus immunoglobulin is indicated.",
              "Where the wound is HIGH RISK (heavy contamination with soil or manure, devitalised tissue, "
              "burns, sepsis, or a delay of more than 6 hours to surgical treatment) tetanus immunoglobulin is "
              "indicated in addition to any vaccine dose. Immunoglobulin is not a PGD supply: give the vaccine "
              "dose where indicated and refer the same day for immunoglobulin."),
             ("replace", "Where the wound is not high risk and 5 doses have been given, no immunisation action is needed at all. Give wound care advice and record the assessment.",
              "Where the wound is not tetanus-prone, or the person is adequately primed with the last dose "
              "within 10 years, no immunisation action is needed. Give wound care advice and record the assessment."),
             ("replace", "A tetanus-prone wound where human tetanus immunoglobulin is indicated under Green Book chapter 30. Refer for same-day medical assessment.",
              "A tetanus-prone wound needing immunoglobulin is NOT an exclusion from the vaccine dose: give the "
              "dose where indicated and refer the same day for immunoglobulin, which this PGD does not supply."),
             ("replace", "A tetanus-prone wound in an individual with 5 or more documented doses. No further vaccine is needed; assess for immunoglobulin by referral.",
              "A tetanus-prone wound in an individual with an adequate priming course whose last "
              "tetanus-containing dose was within the last 10 years. No further vaccine is needed; where the "
              "wound is high risk, refer for immunoglobulin."),
             ("replace_contains", "Tetanus-prone wound: a single reinforcing dose where the last tetanus-containing dose was more than 10 years ago",
              "Tetanus-prone wound: a single reinforcing dose where the last tetanus-containing dose was more "
              "than 10 years ago, whatever the total number of doses, or where the history is incomplete or "
              "uncertain, in accordance with UKHSA Tetanus: advice for health professionals."),
             ("replace", "5 OR MORE, and the reason is a WOUND: no vaccine needed. Refer for an immunoglobulin assessment if the wound is high risk.",
              "5 OR MORE, and the reason is a WOUND: a reinforcing dose if the last dose was more than 10 years "
              "ago; none if within 10 years. Refer the same day for immunoglobulin in addition if the wound is "
              "high risk."),
             ("replace_contains", "PREGNANCY, in all circumstances, including after a tetanus-prone wound.",
              "PREGNANCY, in all circumstances, including after a tetanus-prone wound. Refer to the GP or "
              "midwife THE SAME DAY. This is a Get Real Health service decision that departs from Green Book "
              "chapter 30, which permits tetanus-containing vaccines in pregnancy without delay; the same-day "
              "referral is what keeps the dose from being delayed. From week 16 of pregnancy a "
              "pertussis-containing vaccine is routinely indicated instead, which is a different product and a "
              "different decision."),
         ]),
    # -------------------------------------------------------------- wound-care
    dict(slug="wound-care", src=A("wound-care-v005-SIGNED.docx"), version="v006",
         supersedes="Version 005, " + R1, remove="wound-care-v005.pdf",
         changes=[
             "Appendix 1 observations are now by age band. Version 005 admitted children from 2 years in the "
             "flucloxacillin arm but carried a single set of adult thresholds, so a well 3 year old breached "
             "three of them. The bands match the Skin and Soft Tissue Infection PGD: 2 to 4, 5 to 11, and 12 "
             "and over, with capillary refill and behaviour in the paediatric bands and no adult blood pressure "
             "threshold under 12.",
             "Tetanus aligned to the Tetanus PGD v007 and UKHSA Table 4: a tetanus-prone wound with the last "
             "dose more than 10 years ago gets a reinforcing dose under the Tetanus PGD whatever the dose "
             "count; an incomplete history alone is not a same-day referral; a high-risk wound needing "
             "immunoglobulin is.",
         ],
         edits=[
             ("replace_contains", "Every observation must be measured and recorded before any supply. If ANY threshold is breached, do not supply: refer. These thresholds match",
              "Every observation must be measured and recorded before any supply. Use the threshold for the "
              "patient's age band. If ANY threshold is breached, do not supply: refer. The bands match the "
              "Skin and Soft Tissue Infection PGD Appendix 1; the 12 and over row matches the Acute Bacterial "
              "Bronchitis PGD."),
             ("replace", "REFER if above 110 at rest.",
              "12 and over: REFER if above 110 at rest. 5 to 11 years: REFER if above 120. 2 to 4 years: REFER if above 140."),
             ("replace", "REFER if 22 or above.",
              "12 and over: REFER if 22 or above. 5 to 11 years: REFER if 25 or above. 2 to 4 years: REFER if 40 or above."),
             ("replace", "REFER if systolic below 100.",
              "12 and over: REFER if systolic below 100. UNDER 12: do not apply an adult threshold (a paediatric "
              "cuff and reference range are needed, and most pharmacies hold neither); use capillary refill, "
              "REFER if more than 2 seconds, and appearance."),
             ("replace", "REFER on any new confusion or drowsiness.",
              "REFER on any new confusion or drowsiness; in a child, on any drowsiness, floppiness, or not "
              "responding normally to social cues."),
             ("replace", "Must be competent in measuring and recording the observations in Appendix 1, and in recognising the necrotising fasciitis features listed there.",
              "Must be competent in measuring and recording the observations in Appendix 1 for the age of the "
              "patient, including capillary refill in children, and in recognising the necrotising fasciitis "
              "features listed there."),
             ("replace", "Tetanus-prone wound where the immunisation history is incomplete, unknown, or where human tetanus immunoglobulin may be indicated. Refer the same day; HTIG is not covered by this PGD.",
              "High-risk tetanus-prone wound where human tetanus immunoglobulin may be indicated (heavy "
              "contamination, devitalised tissue, burns, sepsis, or more than 6 hours to treatment). Refer the "
              "same day; HTIG is not covered by this PGD. A wound that needs only a vaccine dose is handled "
              "under the Tetanus (Td/IPV) PGD and does not exclude this supply."),
             ("replace_contains", "FOR TETANUS: where the wound is tetanus-prone and the history is incomplete or unknown, refer the same day.",
              "FOR TETANUS: where the wound is high risk and immunoglobulin may be indicated, refer the same "
              "day; immunoglobulin is not covered by this or any GRH PGD. Where a vaccine dose is all that is "
              "needed (last dose more than 10 years ago whatever the dose count, or an incomplete history) and "
              "the patient is aged 10 or over, the Tetanus (Td/IPV) PGD may be used."),
             ("replace", "A tetanus-prone wound with an incomplete or unknown history: refer the same day. Human tetanus immunoglobulin may be needed and is not covered by any GRH PGD.",
              "A HIGH-RISK tetanus-prone wound (heavy contamination, devitalised tissue, burns, sepsis, or more "
              "than 6 hours to treatment) needs immunoglobulin: refer the same day. Immunoglobulin is not "
              "covered by any GRH PGD."),
             ("replace", "A tetanus-prone wound in a fully immunised patient needing only a booster: the Tetanus (Td/IPV) PGD may be used.",
              "A tetanus-prone wound where the last tetanus-containing dose was more than 10 years ago, "
              "whatever the number of doses, or where the history is incomplete: a reinforcing dose is "
              "indicated (UKHSA Table 4) and may be given under the Tetanus (Td/IPV) PGD from age 10. Under 10, refer."),
         ]),
    # ---------------------------------------------------------------- impetigo
    dict(slug="impetigo", src=A("impetigo-v006-SIGNED.docx"), version="v007",
         supersedes="Version 006, " + R1, remove="impetigo-v006.pdf",
         changes=[
             "Flucloxacillin arm age band: '3 months to 18 years' both included an 18 year old and, two lines "
             "later, excluded 18 and over, with no dose band for 18. Now 3 months to 17 years inclusive "
             "(under 18). The dose table started at 1 month while inclusion started at 3 months; it now starts "
             "at 3 months.",
             "Macrolide arm: 'flucloxacillin unsuitable' is defined narrowly (true penicillin allergy, "
             "documented intolerance, or a child who will not take the suspension) and the arm now states that "
             "a penicillin-tolerant adult is not eligible and is referred, matching the cover and Appendix 1.",
         ],
         edits=[
             ("replace_contains", "Flucloxacillin oral suspension, for children 3 months to 18 years who are not penicillin-allergic",
              "Flucloxacillin oral suspension, for children aged 3 months to 17 years (under 18) who are not penicillin-allergic"),
             ("replace_contains", "in children aged 3 months to 18 years.",
              "Patient Group Direction for the supply of flucloxacillin 250mg/5ml oral suspension for widespread "
              "non-bullous impetigo, bullous impetigo, or failure of topical treatment, in children aged 3 "
              "months to 17 years inclusive (under 18)."),
             ("replace_contains", "in a child aged 3 months to 18 years who is not penicillin-allergic.",
              "Treatment of widespread non-bullous impetigo, bullous impetigo, or impetigo that has failed "
              "topical treatment, in a child aged 3 months to 17 years inclusive (under 18) who is not "
              "penicillin-allergic."),
             ("replace", "Aged 3 months to 18 years.", "Aged 3 months to 17 years inclusive (under 18)."),
             ("replace", "1 month to 1 year: 62.5mg to 125mg four times a day for 5 days.",
              "3 months to 1 year: 62.5mg to 125mg four times a day for 5 days. (Under 3 months is excluded.)"),
             ("replace", "NO, and aged 3 months to 18 years: flucloxacillin oral suspension, four times a day for 5 days.",
              "NO, and aged 3 months to 17 years (under 18): flucloxacillin oral suspension, four times a day for 5 days."),
             ("replace", "Penicillin-allergic, or flucloxacillin unsuitable, for example an oral suspension the child will not take. Record which applies.",
              "Penicillin-allergic (true allergy or documented intolerance), OR a child aged 3 months to 17 "
              "who will not take the flucloxacillin suspension. Record which applies. A penicillin-tolerant "
              "ADULT is NOT eligible for this arm: this PGD carries no adult flucloxacillin, and the absence of "
              "an arm is not 'flucloxacillin unsuitable'. Refer."),
         ]),
    # ------------------------------------------------------ shingles-treatment
    dict(slug="shingles-treatment", src=A("shingles-treatment-v003-SIGNED.docx"), version="v004",
         supersedes="Version 003, " + R1, remove="shingles-treatment-v003.pdf",
         changes=[
             "Indication now covers immunocompetent adults AND adults with non-severe (mild or moderate) "
             "immunosuppression, treated with valaciclovir or famciclovir, which the previous version already "
             "dosed and cautioned for while its indication said immunocompetent only. Severe immunosuppression "
             "(Green Book chapter 28a) remains an exclusion.",
             "Head or neck involvement is an exclusion. The inclusion criterion listed 'non-truncal involvement "
             "of the neck' as a reason to supply while the guidance summary (NICE CKS) says head and neck "
             "involvement is a trigger for admission or specialist advice.",
         ],
         edits=[
             ("replace_contains", "Treatment of uncomplicated herpes zoster (shingles) in immunocompetent adults,",
              "Treatment of uncomplicated herpes zoster (shingles) in immunocompetent adults, and in adults with "
              "non-severe (mild or moderate) immunosuppression using valaciclovir or famciclovir, to reduce the "
              "severity and duration of the episode and to reduce the risk of post-herpetic neuralgia. Severe "
              "immunosuppression as defined in Green Book chapter 28a is excluded."),
             ("replace_contains", "non-truncal involvement of the neck, limbs or perineum",
              "Rash onset within 72 hours, AND at least one of: age over 50; non-truncal involvement of the "
              "limbs or perineum (head or neck involvement excludes: see below); moderate or severe pain; or "
              "moderate or severe rash with confluent lesions."),
             ("insert_after", "Signs of meningitis: neck stiffness, photophobia, mottled skin. Refer to A&E.", [
                 "Head or neck involvement, including the face, scalp, ear or eye. Refer or seek specialist "
                 "advice the same day (NICE CKS), urgently where the eye may be involved.",
             ]),
         ]),
    # ------------------------------------------------------------ GLP-1 family
    dict(slug="mounjaro", src=A("mounjaro-v005-SIGNED.docx"), version="v006",
         supersedes="Version 005, " + R1, remove="mounjaro-v005.pdf",
         changes=[GLP1_SU_CHANGE], edits=GLP1_SU),
    dict(slug="wegovy", src=A("wegovy-v005-SIGNED.docx"), version="v006",
         supersedes="Version 005, " + R1, remove="wegovy-v005.pdf",
         changes=[GLP1_SU_CHANGE], edits=GLP1_SU),
    dict(slug="foundayo", src=A("foundayo-v005-SIGNED.docx"), version="v006",
         supersedes="Version 005, " + R1, remove="foundayo-v005.pdf",
         changes=[GLP1_SU_CHANGE], edits=GLP1_SU),
    dict(slug="wegovy-oral", src=A("wegovy-oral-v008-SIGNED.docx"), version="v009",
         supersedes="Version 008, " + R1, remove="wegovy-oral-v008.pdf",
         changes=[GLP1_SU_CHANGE],
         edits=[
             ("replace", "On insulin or a sulphonylurea where the GP is unwilling to monitor and adjust the hypoglycaemic regimen.",
              "Insulin-treated diabetes. Refer: a pharmacy weight-management service cannot manage insulin dose reduction."),
             ("replace", "Sulfonylurea or insulin co-use in comorbid type 2 diabetes carries a hypoglycaemia risk. Refer to the prescribing GP or specialist before starting.",
              GLP1_SU[1][2]),
         ]),
    # ---------------------------------------------------- postnatal-contraception
    dict(slug="postnatal-contraception", src=A("postnatal-contraception-v002-SIGNED.docx"), version="v003",
         supersedes="Version 002, " + R1, remove="postnatal-contraception-v002.pdf",
         changes=[
             "Desogestrel: initiation allowed at any time postpartum, as the document's own guidance summary "
             "and UKMEC 2025 (category 1 at every postpartum interval) say. The previous inclusion and dose "
             "row required day 21. Starts after day 21 need pregnancy excluded and 2 days of extra precautions "
             "(FSRH); the SmPC's 7 days is noted.",
             "Depo-Provera: one early-start rule in place of three. From 6 weeks if breastfeeding; from 21 days "
             "if not breastfeeding and no additional VTE risk factor; otherwise refer. 'Per clinical judgement' "
             "is gone: it is not an auditable PGD criterion.",
         ],
         edits=[
             ("replace", "At least 21 days post-delivery",
              "Any time postpartum. Before day 21 no additional contraception is needed. From day 21, "
              "pregnancy must be reasonably excluded (no unprotected intercourse since day 21, or a negative "
              "test 21 days after the last episode) and 2 days of extra precautions advised (FSRH; the SmPC "
              "gives 7 days)."),
             ("replace", "Start day 21 postpartum (no additional contraception needed) or later (use barrier method for 48 hours).",
              "Start any time postpartum. Started up to and including day 21: no additional contraception "
              "needed. Started after day 21: exclude pregnancy first and use a barrier method for 2 days "
              "(FSRH; the SmPC states 7 days)."),
             ("replace", "At least 6 weeks post-delivery (or earlier per clinical judgement)",
              "From 6 weeks postpartum if breastfeeding. From 21 days postpartum if NOT breastfeeding and there "
              "is no additional VTE risk factor (previous VTE, thrombophilia, immobility, BMI 30 or over, "
              "caesarean delivery, postpartum haemorrhage, pre-eclampsia, smoking). Otherwise refer."),
             ("replace", "First injection from 6 weeks postpartum (or earlier if not breastfeeding and no contraindications)",
              "First injection from 6 weeks postpartum if breastfeeding; from 21 days if not breastfeeding and "
              "no additional VTE risk factor (see inclusion criteria). Otherwise refer."),
             ("replace", "Depo-Provera typically from 6 weeks postpartum (can be earlier if not breastfeeding).",
              "Depo-Provera from 6 weeks postpartum if breastfeeding; from 21 days if not breastfeeding and no "
              "additional VTE risk factor."),
         ]),
    # ------------------------------------------------------------ asthma-rescue
    dict(slug="asthma-rescue", src=A("asthma-rescue-v003-SIGNED.docx"), version="v004",
         supersedes="Version 003, " + R1, remove="asthma-rescue-v003.pdf",
         changes=[
             "Salbutamol arm: 'previous inhaler use' no longer counts as a confirmed diagnosis, which "
             "contradicted the guidance summary and the exclusion for first presentation. A documented "
             "diagnosis is required; preventer therapy is recorded; a patient with no preventer or more than "
             "one rescue course in 12 months is referred to the GP for review.",
             "Prednisolone arm: 'inadequately responsive to SABA alone' was both the entry criterion here and "
             "an emergency-referral trigger in the guidance summary. The arm now defines the moderate "
             "exacerbation it treats (able to complete sentences, PEF over 50%, SpO2 92% or above, RR under "
             "25, HR under 110, no severe feature); anything meeting the acute severe criteria is referred.",
         ],
         edits=[
             ("replace", "Confirmed diagnosis of asthma (documented in GP records or previous inhaler use)",
              "Confirmed diagnosis of asthma, DOCUMENTED: GP record, a repeat prescription for an asthma "
              "inhaler, or an asthma action plan. Previous inhaler use on its own is not confirmation."),
             ("insert_after", "Confirmed diagnosis of asthma, DOCUMENTED: GP record, a repeat prescription for an asthma inhaler, or an asthma action plan. Previous inhaler use on its own is not confirmation.", [
                 "Current preventer (inhaled corticosteroid) therapy asked about and recorded. A patient with "
                 "no preventer, or who has needed more than one rescue course in the last 12 months, is "
                 "referred to the GP for review; no more than one rescue course in 12 months is supplied "
                 "under this PGD.",
             ]),
             ("replace", "Acute exacerbation inadequately responsive to SABA alone",
              "MODERATE exacerbation with incomplete response to salbutamol: able to complete sentences in one "
              "breath, PEF over 50% of best or predicted where measurable, SpO2 92% or above, respiratory rate "
              "below 25, heart rate below 110, and no acute severe or life-threatening feature. Any acute "
              "severe or life-threatening feature is an emergency referral, not a prednisolone supply."),
         ]),
    # -------------------------------------------------------------------- acne
    dict(slug="acne", src=os.path.join(PARENT, "ACNE_FINAL_V_REFORMATTED.docx"), version="v002",
         supersedes="Version 001, 1 November 2025", remove="acne.pdf",
         changes=[
             "Validity: this version is valid from " + DATE + " and expires on 31 July 2027.",
             "Follow-up advice, both arms: the line telling the patient to seek advice if not improved in 3 "
             "to 4 weeks was a template sentence from an infection PGD. The same page says treatment takes 6 "
             "to 8 weeks and the guidance says review at 8 to 12 weeks. Replaced with the review interval for "
             "each product.",
         ],
         edits=[
             ("replace", "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 weeks, or they become systemically very unwell.",
              "Seek advice if the skin reaction is severe (marked redness, peeling, burning or swelling), or if "
              "there is no improvement after 8 to 12 weeks of regular use (Duac) or 4 to 8 weeks (Epiduo, per "
              "its SmPC). Improvement is not expected before 6 to 8 weeks."),
         ]),
    # ---------------------------------------------------------- anti-malarials
    dict(slug="anti-malarials", src=A("anti-malarials-v006-SIGNED.docx"), version="v007",
         supersedes="Version 006, " + R1, remove="anti-malarials-v006.pdf",
         changes=[
             "Fever exclusion window: one month in the exclusion criteria, twelve months on the cover and in "
             "every counselling box. Now 12 months everywhere: any fever following travel to a malarious area "
             "in the last 12 months that has not been investigated with a malaria blood film excludes and refers.",
         ],
         edits=[
             ("replace", "Any febrile illness at the time of presentation, or a fever within the last month following travel to a malarious area. Malaria is a medical emergency; refer for the same day.",
              "Any febrile illness at the time of presentation, or a fever at any time within the last 12 "
              "months following travel to a malarious area that has not been investigated with a malaria "
              "blood film. Malaria is a medical emergency; refer the same day."),
         ]),
    # ----------------------------------------------------------------- rosacea
    dict(slug="rosacea", src=os.path.join(JANE, "Jane 2026 PGD rosacea.docx"), version="v002",
         supersedes="Version 001, 13 December 2025", remove="rosacea.pdf",
         changes=[
             "Validity: this version is valid from " + DATE + " and expires on 31 July 2027.",
             "Azelaic acid quantity: one 30 g tube covers about 4 to 5 weeks at the SmPC application (2.5 cm, "
             "about 0.5 g, twice daily) of a course the PGD runs for 12 weeks. Quantity now up to 3 x 30 g "
             "per 12-week course, one tube per supply, with the review at 8 to 12 weeks. Metronidazole gel "
             "quantity stated the same way for its 8-week course.",
         ],
         edits=[
             ("replace", "Up to 1 x 30 g tube per treatment course.",
              "One 30 g tube per supply; up to 2 x 30 g per 8-week course. Record each supply.", 1),
             ("replace", "Up to 1 x 30 g tube per treatment course.",
              "One 30 g tube per supply (about 4 to 5 weeks at 2.5 cm twice daily, per the SmPC); up to 3 x "
              "30 g per 12-week course. Record each supply and review at 8 to 12 weeks.", 1),
         ]),
    # ------------------------------------------------------------- period-pain
    dict(slug="period-pain", src=os.path.join(JANE, "Jane 2026 PGD period pain.docx"), version="v002",
         supersedes="Version 001, 17 December 2025", remove="period-pain.pdf",
         changes=[
             "Validity: this version is valid from " + DATE + " and expires on 31 July 2027.",
             "Mefenamic acid quantity: one cycle at 500 mg three times a day for 3 days is 9 doses. The "
             "previous quantity (60 x 250 mg or 30 x 500 mg) was more than three cycles of a medicine the same "
             "box describes as causing seizures in overdose with a narrow margin. Now one cycle per supply.",
         ],
         edits=[
             ("replace", "60 capsules of 250mg or 30 tablets of 500mg",
              "One cycle per supply: 18 capsules of 250 mg, or 9 tablets of 500 mg (500 mg three times a day "
              "for 3 days). A further supply needs a further consultation."),
         ]),
    # ----------------------------------------------------------- junior-travel
    dict(slug="junior-travel", src=A("junior-travel-v004-SIGNED.docx"), version="v005",
         supersedes="Version 004, " + R1, remove="junior-travel-v004.pdf",
         changes=[
             "Minimum age: the indication said the vaccine-specific minimum age 'always takes precedence over "
             "the general lower limit' while the table listed 'from birth' and '2 months', which read "
             "literally authorised hepatitis B at birth and Ixiaro at 2 months in a PGD that excludes under "
             "12 months. Now the HIGHER of 12 months and the vaccine-specific minimum applies, and the table "
             "says 12 months under this PGD for those rows.",
             "Twinrix Paediatric: the SmPC advises against same-day co-administration with vaccines other "
             "than Cervarix. The blanket co-administration statement now carries that caveat.",
         ],
         edits=[
             ("replace_contains", "the vaccine-specific minimum age always takes precedence over the general lower limit of this PGD.",
              "Active immunisation of children and young people aged 12 months to 17 years inclusive against "
              "travel-related infection, in accordance with Immunisation Against Infectious Disease (the Green "
              "Book) and current NaTHNaC / TravelHealthPro country-specific recommendations. Each vaccine has "
              "its own minimum age, dose and schedule as set out in the schedule of vaccines table below; the "
              "HIGHER of 12 months and the vaccine-specific minimum age applies."),
             ("replace", "From birth", "12 months under this PGD (licensed from birth)"),
             ("replace", "2 months", "12 months under this PGD (licensed from 2 months)"),
             ("replace", "0.25 ml for children aged 2 months to under 3 years; 0.5 ml for 3 years and over, intramuscular",
              "0.25 ml for children aged 12 months to under 3 years; 0.5 ml for 3 years and over, intramuscular"),
             ("insert_after", "Hepatitis A and B combined (paediatric): Twinrix® Paediatric", [
                 "SmPC: vaccines other than Cervarix should not be given at the same time as Twinrix "
                 "Paediatric. Give separately, or follow Green Book advice and record the reason.",
             ]),
             ("replace_contains", "Vaccines listed may generally be given at the same time as other vaccines at separate sites.",
              "Vaccines listed may generally be given at the same time as other vaccines at separate sites, "
              "EXCEPT Twinrix Paediatric, whose SmPC advises against same-day co-administration with vaccines "
              "other than Cervarix (HPV). The immune response may be reduced in children receiving "
              "immunosuppressive treatment; such children are excluded from this PGD and require specialist "
              "advice. Dukoral® should be separated from oral typhoid vaccine and from antimalarials in "
              "accordance with the SPC. Consult the SPC of each product for a full list of interactions."),
         ]),
    # ------------------------------------------------------ meningitis-acwy
    dict(slug="meningitis-acwy-travel", src=A("menacwy-v004-SIGNED.docx"), version="v005",
         supersedes="Version 004, " + R1, remove="meningitis-acwy-travel-v004.pdf",
         changes=[
             "Infants under one year: the guidance summary gave the Green Book traveller schedule (two doses "
             "four weeks apart) and the PGD gave two doses two months apart; the 6 to 11 month row matched "
             "neither source. The PGD follows the licensed Nimenrix schedule: 6 weeks to under 6 months, two "
             "doses 2 months apart with a booster at 12 months; 6 to 11 months, a single dose with a booster "
             "at 12 months at least 2 months later. The summary now says the Green Book interval is not used.",
         ],
         edits=[
             ("replace", "Under one year: two 0.5 mL doses, four weeks apart.",
              "Under one year: the Green Book gives two doses four weeks apart. This PGD follows the licensed "
              "Nimenrix schedule in part 3, which differs; the Green Book interval is not used here."),
             ("replace", "NIMENRIX, infants 6 to 11 months: two doses at least 2 months apart, with the second dose given in the second year of life.",
              "NIMENRIX, infants 6 to 11 months: a single dose, with a booster at 12 months of age at least 2 "
              "months after the primary dose (SmPC)."),
             ("replace", "Two doses at least 2 months apart.",
              "A single dose, with a booster at 12 months of age at least 2 months after it.", 2),
         ]),
    # --------------------------------------------------------------------- rsv
    dict(slug="rsv", src=A("rsv-v003-SIGNED.docx"), version="v004",
         supersedes="Version 003, " + R1, remove="rsv-v003.pdf",
         changes=[
             "Guidance summary corrected to the Green Book: the maternal programme is offered from 28 weeks in "
             "every pregnancy, all year round, and later vaccination up to delivery is still recommended. The "
             "summary previously said 32 to 36 weeks and seasonal, contradicting the PGD's own inclusion of 28 "
             "to 36 weeks. Whether supply after 36 weeks should be added to the PGD is recorded for decision.",
         ],
         edits=[
             ("replace", "Typically offered during 32–36 weeks gestation (autumn–winter programme, varies by season and JCVI advice).",
              "Offered from 28 weeks of pregnancy, in every pregnancy, all year round (Green Book). Women "
              "presenting later can still be vaccinated up to delivery, though the infant gains less passive "
              "protection. This PGD's inclusion is 28 to 36 weeks; after 36 weeks refer to the maternity service."),
             ("replace", "Offered seasonally to women between 32–36 weeks gestation to protect infants for their first 6 months of life.",
              "Offered from 28 weeks of pregnancy, all year round, to protect infants for their first 6 months of life."),
         ]),
    # -------------------------------------------------------- shingles-vaccine
    dict(slug="shingles-vaccine", src=A("shingles-vaccine-v003-SIGNED.docx"), version="v004",
         supersedes="Version 003, " + R1, remove="shingles-vaccine-v003.pdf",
         changes=[
             "Guidance summary: it stated that immunocompromised adults aged 18 and over are eligible for "
             "Shingrix, which the SmPC and Green Book support, while the PGD covers 50 and over only. The "
             "summary now says so. Whether to add an 18 to 49 immunosuppressed arm is recorded for decision.",
         ],
         edits=[
             ("replace", "Aged 18 years and over are eligible for Shingrix®.",
              "Aged 18 years and over are eligible for Shingrix® under the Green Book and SmPC, but THIS PGD "
              "covers individuals aged 50 and over only; an immunosuppressed adult under 50 is referred."),
             ("replace", "Suitable for people aged 50 years and older or 18+ if immunocompromised.",
              "Suitable for people aged 50 years and older, or 18 and over if immunocompromised (the latter "
              "group is not covered by this PGD: refer)."),
         ]),
    # ------------------------------------------------------------------ b12
    dict(slug="b12-folate", src=A("b12-folate-v006-SIGNED.docx"), version="v007",
         supersedes="Version 006, " + R1, remove="b12-folate-v006.pdf",
         changes=[
             "Follow-up aligned to NICE NG239, which the document's own guidance summary states: a review 3 "
             "months after the loading course (1 month if pregnant or breastfeeding), then at least annually "
             "with a full blood count. The annual repeat B12 for patients on intramuscular maintenance is "
             "removed, because NICE says the result is uninformative on injections.",
         ],
         edits=[
             ("replace", "Review at least annually, including symptoms, response and adherence, and repeat a full blood count and B12 at least annually while on maintenance.",
              "Review at 3 months after the loading course (symptoms, response, full blood count; at 1 month if "
              "pregnant or breastfeeding), and where the cause was uncertain decide then whether it is "
              "reversible. Thereafter review at least annually with symptoms, adherence and a full blood "
              "count. Do NOT repeat serum B12 in a patient on intramuscular maintenance: NICE NG239 says the "
              "result is uninformative."),
         ]),
    # ------------------------------------------------------------------ dengue
    dict(slug="dengue", src=A("dengue-v003-SIGNED.docx"), version="v004",
         supersedes="Version 003, " + R1, remove="dengue-v003.pdf",
         changes=[
             "Name and form corrected to the SmPC: Qdenga is a powder and solvent for solution for injection, "
             "reconstituted before use. The previous row described a ready-to-use suspension and then "
             "referred to reconstitution.",
         ],
         edits=[
             ("replace", "Qdenga (TAK-003), suspension for injection in pre-filled syringe, 0.5 mL",
              "Qdenga (TAK-003), powder and solvent for solution for injection: a vial of lyophilised vaccine "
              "reconstituted with the 0.5 mL solvent in the pre-filled syringe supplied. Reconstitute "
              "immediately before use."),
             ("replace_contains", "After reconstitution, use within 30 minutes.",
              "Store in a refrigerator between 2°C and 8°C. Protect from light. Do not freeze. After "
              "reconstitution, use immediately or within 30 minutes at room temperature (SmPC)."),
         ]),
]


def main():
    only = set(sys.argv[1:])
    done = []
    for j in JOBS:
        if only and j["slug"] not in only:
            continue
        out = os.path.join(APPROVED, f"{j['slug']}-{j['version']}-SIGNED.docx")
        pub = f"{j['slug']}-{j['version']}.pdf"
        reissue(j["slug"], j["src"], out, j["version"], j["supersedes"], DATE, j["changes"],
                edits=j.get("edits", ()),
                publish_to=os.path.join(PUBLIC, pub),
                remove=os.path.join(PUBLIC, j["remove"]) if j.get("remove") else None)
        done.append((j["slug"], j["remove"], pub))
    print("\nMANIFEST")
    for slug, old, new in done:
        print(f"  {slug:26} {old:36} -> {new}")


if __name__ == "__main__":
    main()
