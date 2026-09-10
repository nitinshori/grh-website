#!/usr/bin/env python3
"""
fixes-round3.py  --  adversarial review of 10 September 2026 ("Jack"):
                     every live document reissued, 11 September 2026

Two things happen to every one of the 70 live documents:

1. The structural clean-up in grh_reissue.normalise(): the adopting
   pharmacy's authorisation block is blank for the pharmacy to complete;
   one signed authorisation page for this version replaces every earlier
   signature block; every validity cell states this version's dates;
   narration about earlier versions, the consultation tool and individual
   customers leaves the body; earlier change records are carried as
   previous version records.

2. The clinical and legal criticals from the register, document by
   document, below. Where the register asked for a decision that is Chris
   and Nitin's (the travel-core typhoid arm, RSV after 36 weeks, Shingrix
   18 to 49, anti-malarial weight bands) nothing is changed here.

Sources are the current masters: the round 1 and 2 outputs in
"PGD Rewrite 2026/02 Approved", the generator outputs in this folder for the
five generator-built documents, and the November 2025 / Jane originals for
the documents never reissued before. The meningitis B document is rebuilt
from its version 002 source with the version 003 observation requirement
written into the cautions, so the addendum page goes.

  python3 tools/pgd-generator/fixes-round3.py            all documents
  python3 tools/pgd-generator/fixes-round3.py bph        one document
  python3 tools/pgd-generator/fixes-round3.py --dry      build to /tmp only
"""

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
JANE = os.path.join(PARENT, "Jane 2026 PGD")
HUBRX = os.path.join(PARENT, "HUB RX LATEST PRESENTATIONS ", "2026 PGD")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
DATE = "11 September 2026"
R = "10 September 2026"   # rounds 1 and 2 reissues
R9 = "9 September 2026"


def A(name):
    return os.path.join(APPROVED, name)


def J(name):
    return os.path.join(JANE, name)


def H(name):
    return os.path.join(HUBRX, name)


def G(name):
    return os.path.join(HERE, name)


STRUCT = (
    "Structural clean-up applied to every live Get Real Health PGD on 11 September 2026, following the "
    "adversarial review of 10 September: the adopting pharmacy's authorisation block is blank, for the "
    "pharmacy's own signatories; one signed authorisation page for this version replaces the earlier "
    "signature blocks; every validity cell states this version's dates (valid from 11 September 2026, "
    "expiry 31 July 2027); narration about earlier versions, the consultation tool and individual "
    "customers is removed from the body of the document; the change records of earlier reissues are "
    "carried below as previous version records. No clinical criterion changes unless listed."
)
P_NOTE = (
    "Legal category corrected. {drug} is a Pharmacy (P) medicine{qual}. A PGD is not the legal "
    "authority for a P sale; this arm stays in the document so that the service assesses and records "
    "the supply to the same standard as its POM arms, and the practitioner must follow the P licence "
    "conditions where they are narrower than this PGD."
)


def p_cat(drug, qual=""):
    return ("P (Pharmacy medicine){q}. A PGD is not legally required for a P sale; this arm is included so "
            "that the supply is assessed and recorded to the same standard as a POM supply. Where the P "
            "licence is narrower than this PGD, the P licence governs.").format(q=qual)


CELL_EXCL_TAIL = (
    "\n- Any sign of systemic illness or sepsis: temperature 38°C or above or below 36°C, heart rate above 90, "
    "respiratory rate 20 or above, systolic blood pressure below 100, new confusion, or rigors (call 999 or send to A&E)."
    "\n- Suspected necrotising fasciitis: pain out of proportion to the appearance, rapid spread, skin discolouration, "
    "crepitus or blistering (999)."
    "\n- Periorbital, orbital or facial cellulitis (same-day urgent referral)."
    "\n- Cellulitis of a diabetic foot, or in a limb with lymphoedema or chronic venous ulceration (same-day GP referral)."
    "\n- Immunosuppression, including chemotherapy, biologics, long-term oral steroids, or poorly controlled diabetes."
    "\n- Cellulitis following an animal or human bite, or with fresh water or sea water exposure (different organisms; refer)."
    "\n- Suspected deep vein thrombosis, or redness of both legs (usually not cellulitis; refer)."
    "\n- Abscess requiring drainage or infected wound needing surgical review."
    "\n- Not improving after 48 hours of an antibiotic, or a second episode at the same site within 3 months (refer)."
)
CELL_INCL = (
    "- Adults aged 18 years or older."
    "\n- MILD cellulitis (Eron class I) of a limb or the trunk: localised erythema, warmth, swelling and pain, with NO "
    "fever, NO tachycardia, NO hypotension, NO confusion and NO rapidly spreading margin."
    "\n- The margin of the erythema has been marked and the time recorded, so that spread can be judged at review."
    "\n- {allergy}"
    "\n- Informed consent obtained."
)
CELL_ACTION = (
    "Document any advice given and the decision reached. Where the patient is excluded because of systemic "
    "features, suspected necrotising fasciitis or periorbital or facial cellulitis, arrange emergency care (999 or "
    "A&E) before the patient leaves the pharmacy. Where excluded for a diabetic foot, lymphoedema, "
    "immunosuppression, a bite, suspected DVT or failure of a previous antibiotic, refer to the GP the same day "
    "and record that this was done."
)


def cell_ind(drug, allergy):
    return (f"{drug} is indicated for the treatment of MILD cellulitis (Eron class I: no signs of systemic toxicity "
            "and no uncontrolled comorbidity) of a limb or the trunk in adults aged 18 years and over, caused by "
            "susceptible Gram-positive organisms such as Staphylococcus aureus or Streptococcus species. Moderate "
            "or severe cellulitis (Eron class II to IV) is not covered by this PGD.")


SORE_THROAT_EXCL = [
    "Stridor, difficulty breathing, drooling, inability to swallow saliva, trismus, a muffled 'hot potato' voice, "
    "unilateral peritonsillar swelling or deviation of the uvula (suspected quinsy or epiglottitis): emergency "
    "referral, 999 or A&E. Do not examine the throat with a tongue depressor where epiglottitis is possible.",
    "Signs of sepsis or systemic illness: temperature 38°C or above together with heart rate above 90, respiratory "
    "rate 20 or above, systolic blood pressure below 100, new confusion, or a patient who looks unwell: emergency referral.",
    "Immunosuppression, or a medicine that can cause neutropenia (chemotherapy, carbimazole, clozapine, "
    "methotrexate or other DMARDs): refer for a same-day full blood count and clinical assessment.",
    "Symptoms for more than 2 weeks, or a persistent unilateral neck lump, unilateral tonsillar enlargement or "
    "hoarseness for more than 3 weeks: refer to the GP (possible malignancy pathway).",
]

MENB_OBS = [
    "Observation after vaccination: observe every patient for 15 minutes after vaccination, seated. "
    "Anxiety-related reactions, including vasovagal syncope, hyperventilation and transient visual disturbance or "
    "paraesthesia, can occur before or after any injection and are commonest in adolescents; they are a response "
    "to the needle, not to the vaccine. Have procedures in place to prevent injury from a faint, and record that "
    "the observation period was completed.",
]

# slug: (live file, source docx, new version, supersedes, edits, changes)
JOBS = {
    # ------------------------------------------------------------------ criticals
    "anti-malarials": ("anti-malarials-v007.pdf", A("anti-malarials-v007-SIGNED.docx"), "v008", f"Version 007, {R}", [
        ("replace", "Common: nausea, abdominal pain, diarrhoea, headache, dizziness, sleep disturbance and vivid dreams. Uncommon: anxiety, depression, restlessness, confusion. Rare but serious: psychosis, seizures, suicidal ideation, prolonged vestibular disturbance.",
         "Common: nausea, abdominal pain, diarrhoea, headache, dizziness, insomnia, abnormal or vivid dreams. Uncommon: anxiety, depression, restlessness, confusion. Rare but serious: psychosis, seizures, suicidal ideation, prolonged vestibular disturbance. Insomnia and abnormal dreams are neuropsychiatric adverse reactions under the SmPC and the MHRA advice of 2013, not nuisance effects: any of them is a reason to stop mefloquine and change to another antimalarial."),
        ("replace", "STOP TAKING IT and seek advice if you become anxious, low in mood, restless, confused, or feel not yourself. Do not wait to see if it settles.",
         "STOP TAKING IT and seek advice if you become anxious, low in mood, restless, confused, or feel not yourself, or if you develop insomnia, vivid or abnormal dreams or nightmares. Do not wait to see if it settles."),
        ("replace", "Vivid dreams and disturbed sleep are common and are not by themselves a reason to stop, but tell us if they are distressing.",
         "Vivid or abnormal dreams, nightmares and insomnia are a reason to STOP mefloquine and contact us or your GP for a different antimalarial. They can be the first sign of the neuropsychiatric reactions mefloquine is known for, and those can persist after the medicine is stopped."),
    ], [
        "Mefloquine counselling corrected. The previous version told patients that vivid dreams and disturbed sleep were 'not by themselves a reason to stop', which contradicts the SmPC and the MHRA Drug Safety Update of August 2013: insomnia and abnormal dreams are prodromal neuropsychiatric reactions and the patient must stop at the first sign. The counselling bullet, the stop list and the adverse effects entry now say so.",
    ]),
    "tetanus": ("tetanus-v007.pdf", A("tetanus-v007-SIGNED.docx"), "v008", f"Version 007, {R}", [
        ("insert_after_contains", "Where the wound is HIGH RISK (heavy contamination with soil or manure", [
            "Where the person is NOT adequately primed (fewer than 5 documented doses) or the vaccination history is uncertain, and the wound is tetanus-prone: give the vaccine dose under this PGD AND refer the same day for tetanus immunoglobulin, whether or not the wound is high risk. Where the person is adequately primed but the last dose was more than 10 years ago and the wound is HIGH RISK: give the reinforcing dose AND refer the same day for immunoglobulin. This follows Green Book chapter 30, table 30.1.",
        ]),
    ], [
        "Immunoglobulin rule completed. The previous version indicated immunoglobulin only for high-risk wounds. Green Book chapter 30 also requires it for any tetanus-prone wound where the person is not adequately primed or the history is uncertain, and for a high-risk wound where the last dose was over 10 years ago. Both cases are now stated, with the vaccine dose given under this PGD and same-day referral for immunoglobulin.",
    ]),
    "herpes-management": ("herpes-management-v002.pdf", A("herpes-management-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace", "Immunocompromised patients with disseminated infection or suspected meningitis/encephalitis (refer to specialist for IV therapy)",
         "Immunocompromised patients, any presentation (HIV, chemotherapy, transplant, biologic or high-dose steroid therapy): refer to specialist"),
        ("replace", "Immunocompromised patients requiring high-dose therapy; refer to specialist",
         "Immunocompromised patients, any presentation (HIV, chemotherapy, transplant, biologic or high-dose steroid therapy): refer to specialist"),
        ("insert_after", "Immunocompromised patients, any presentation (HIV, chemotherapy, transplant, biologic or high-dose steroid therapy): refer to specialist", [
            "Suspected disseminated infection, meningitis or encephalitis, or inability to pass urine, in ANY patient: emergency referral (999 or A&E), not a PGD supply",
        ]),
        ("replace", "Neonatal herpes risk (pregnant women near term; refer to specialist)",
         "Pregnancy at any gestation, or breastfeeding: refer to the GP or GUM clinic. A first episode in pregnancy needs specialist management, and suppressive treatment from 36 weeks is a prescriber decision"),
        ("replace", "Suppressive therapy (6+ recurrences/year): 400mg twice daily; continue for 6-12 months then review",
         "Suppressive therapy (6 or more recurrences a year): 400mg twice daily. Under this PGD a maximum of 3 months' suppressive supply may be made, after which GP or GUM review is required before any further supply"),
        ("replace", "Up to 15 tablets per course (first episode, 5 days at 400mg TDS) or up to 30 tablets (10-day course) for severe first episodes",
         "First episode: 15 tablets (400mg three times daily for 5 days); a further 15 tablets, to 10 days, only where new lesions are still forming at day 5. Recurrent episode: 12 tablets (800mg three times daily for 2 days). Suppressive therapy: 56 tablets per 28 days, maximum 3 supplies (168 tablets) under this PGD before review"),
        ("replace", "Suppressive therapy (6+ recurrences/year): 500mg once daily; continue for 6-12 months then review",
         "Suppressive therapy (6 or more recurrences a year): 500mg once daily. Under this PGD a maximum of 3 months' suppressive supply may be made, after which GP or GUM review is required before any further supply"),
        ("replace", "Up to 20 tablets per course (first episode or recurrence, up to 10 days at 500mg BD)",
         "First episode: 10 tablets (500mg twice daily for 5 days); a further 10 tablets, to 10 days, only where new lesions are still forming at day 5. Recurrent episode: 6 to 10 tablets (500mg twice daily for 3 to 5 days). Suppressive therapy: 28 tablets per 28 days, maximum 3 supplies (84 tablets) under this PGD before review"),
    ], [
        "Exclusions rewritten in both arms: immunocompromise excludes for any presentation; suspected meningitis, encephalitis, disseminated infection or urinary retention is an emergency referral for any patient; pregnancy at any gestation and breastfeeding refer, not only 'near term'.",
        "A quantity is stated for every regimen (first episode, extension, recurrence, suppression) in both arms, and suppressive supply under this PGD is capped at 3 months before GP or GUM review. The previous version gave one quantity for the first-episode course only.",
    ]),
    "mysimba": ("mysimba-v002.pdf", A("mysimba-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace", "Review at 16 weeks of treatment. Discontinue if <5% body weight loss achieved. Maximum treatment period should be determined based on continued clinical benefit and tolerability.",
         "Review at 16 weeks of treatment: the pharmacist weighs the patient and records the result. Discontinue if less than 5% of initial body weight has been lost. Maximum treatment period under this PGD: 16 weeks (the titration month and three maintenance months). Continuation beyond 16 weeks is by prescription from the GP or a specialist prescriber, not under this PGD."),
        ("insert_after_contains", "Maximum treatment period under this PGD: 16 weeks", [
            "Follow-up: weight, blood pressure and pulse at 4 weeks (end of titration) and at 16 weeks; ask about mood, suicidal thoughts, seizures and symptoms of raised blood pressure at every supply, and stop and refer if any is present.",
        ]),
    ], [
        "A maximum treatment period is stated: 16 weeks under this PGD, continuation by prescription only. The previous version left the maximum to be 'determined based on continued clinical benefit', which is not a maximum. The 16-week weight review is assigned to the pharmacist and a follow-up schedule added.",
    ]),
    "cellulitis": ("cellulitis.pdf", J("Jane 2026 PGD cellulitis.docx"), "v002", "Version 001, 28 December 2025", [
        ("replace", "Flucloxacillin is indicated for the treatment of mild to moderate cellulitis in adults aged 18 years and over, caused by susceptible Gram-positive organisms such as Staphylococcus aureus or Streptococcus species.", cell_ind("Flucloxacillin", "")),
        ("replace", "Clarithromycin is indicated for the treatment of mild to moderate cellulitis in adults aged 18 years and over, caused by susceptible Gram-positive organisms such as Staphylococcus aureus or Streptococcus species.", cell_ind("Clarithromycin", "")),
        ("replace", "Doxycycline is indicated for the treatment of mild to moderate cellulitis in adults aged 18 years and over, caused by susceptible Gram-positive organisms such as Staphylococcus aureus or Streptococcus species.", cell_ind("Doxycycline", "")),
        ("replace_contains", "- No known allergy to penicillins.", CELL_INCL.format(allergy="No known allergy to penicillins.")),
        ("replace_contains", "- No known allergy to macrolides.", CELL_INCL.format(allergy="No known allergy to macrolides.")),
        ("replace_contains", "- No known allergy to doxycycline or other tetracyclines", CELL_INCL.format(allergy="No known allergy to doxycycline or other tetracyclines.")),
        ("replace_contains", "- Known allergy or hypersensitivity to penicillins or beta-lactam antibiotics.",
         "- Known allergy or hypersensitivity to penicillins or beta-lactam antibiotics." + CELL_EXCL_TAIL + "\n- Pregnancy or breastfeeding."),
        ("replace_contains", "- Known allergy or hypersensitivity to macrolides",
         "- Known allergy or hypersensitivity to macrolides." + CELL_EXCL_TAIL + "\n- Pregnant or breastfeeding individuals."),
        ("replace_contains", "- Known allergy or hypersensitivity to doxycycline or other tetracycline antibiotics.",
         "- Known allergy or hypersensitivity to doxycycline or other tetracycline antibiotics." + CELL_EXCL_TAIL + "\n- Pregnancy or breastfeeding."),
        ("replace", "Document any advice given and the decision reached. Inform or refer to the GP as appropriate", CELL_ACTION),
    ], [
        "Indication restricted to MILD cellulitis (Eron class I) of a limb or the trunk in all three arms, and defined. The previous version covered 'mild to moderate' cellulitis with 'signs of severe infection' as the only severity exclusion.",
        "Named exclusions added to all three arms: sepsis and systemic features (999), suspected necrotising fasciitis (999), periorbital or facial cellulitis, diabetic foot, lymphoedema or venous ulceration, immunosuppression, bites and water exposure, suspected DVT or bilateral redness, failure of a previous antibiotic. The 'actions if excluded' row now gives the same-day escalation route.",
        "Marking the margin of the erythema at the consultation is an inclusion requirement, so spread can be judged at review.",
    ]),
    "sore-throat": ("sore-throat-v002.pdf", A("sore-throat-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace", "Pregnancy requiring safer alternative (though penicillin V is generally safe)", SORE_THROAT_EXCL[0]),
        ("insert_after", SORE_THROAT_EXCL[0], SORE_THROAT_EXCL[1:], 1),
        ("insert_after", "Myasthenia gravis (macrolides can worsen muscle weakness)", SORE_THROAT_EXCL),
    ], [
        "Red-flag exclusions added to both arms: airway compromise and suspected quinsy or epiglottitis (999), sepsis and systemic illness (emergency referral), immunosuppression and neutropenia-risk medicines (same-day FBC), and symptoms over 2 weeks or a persistent unilateral neck lump (GP, malignancy pathway). The previous version's only exclusions were allergy, a muddled pregnancy line and severe organ dysfunction. The pregnancy line is removed: phenoxymethylpenicillin is not contraindicated in pregnancy.",
    ]),
    "copd": ("copd.pdf", H("COPD FINAL V.docx"), "v002", "Version 001, 1 November 2025", [
        ("replace", "2-4 puffs as required for breathlessness", "1 to 2 puffs (100 to 200 micrograms) as required for breathlessness, up to 4 times in 24 hours"),
        ("replace", "May repeat at intervals as needed for symptom control",
         "Maximum 8 puffs in 24 hours under this PGD. A need for more than this, for relief more often than every 4 hours, or for the reliever on most days, is uncontrolled or exacerbating disease: same-day GP or urgent care referral. Ten puffs through a spacer with no relief is an emergency: call 999."),
        ("replace", "As needed (ongoing as rescue therapy)",
         "One inhaler (200 actuations) per supply. Maximum 2 supplies in any 12 months under this PGD; a third request is a GP review of the patient's COPD, not a further supply."),
    ], [
        "Salbutamol dose, maximum dose and maximum period stated: 1 to 2 puffs up to 4 times in 24 hours, maximum 8 puffs in 24 hours, one inhaler per supply and at most 2 supplies in 12 months, with the same-day and 999 thresholds. The previous version said '2-4 puffs as required', 'may repeat at intervals as needed' and 'ongoing', which is no maximum at all.",
    ]),
    "sti-testing": ("sti-testing.pdf", H("CHLAMYDIA FINAL U.docx"), "v002", "Version 001, 25 June 2025", [
        ("replace_contains", "- No contraindications to doxycycline.",
         "- Individuals aged 16 years and over; or aged 13 to 15 where the pharmacist has assessed and recorded Fraser competence and completed a safeguarding assessment (partner age, coercion, exploitation indicators) with no concern.\n- Confirmed or strongly suspected diagnosis of genital chlamydia infection.\n- Informed consent obtained.\n- No contraindications to doxycycline."),
        ("replace_contains", "- Doxycycline unsuitable or contraindicated.",
         "- Individuals aged 16 years and over; or aged 13 to 15 where the pharmacist has assessed and recorded Fraser competence and completed a safeguarding assessment (partner age, coercion, exploitation indicators) with no concern.\n- Confirmed or strongly suspected diagnosis of genital chlamydia infection.\n- Informed consent obtained.\n- Doxycycline unsuitable or contraindicated."),
        ("replace_contains", "- Inability to comply with 7-day regimen or swallow tablets.",
         "- Aged under 13: any sexual activity is a safeguarding concern; do not supply, refer to the GP or sexual health service the same day and make a safeguarding referral.\n- Aged 13 to 15 where Fraser competence is not established, or any safeguarding concern (partner 18 or over, coercion, exploitation, learning disability): refer and follow the local safeguarding pathway.\n- Known hypersensitivity to tetracyclines.\n- Pregnant or breastfeeding individuals.\n- Severe hepatic insufficiency.\n- Known or suspected complicated infection (e.g., PID).\n- Inability to comply with 7-day regimen or swallow tablets."),
        ("replace_contains", "- Concurrent use of ergot derivatives.",
         "- Aged under 13: any sexual activity is a safeguarding concern; do not supply, refer to the GP or sexual health service the same day and make a safeguarding referral.\n- Aged 13 to 15 where Fraser competence is not established, or any safeguarding concern (partner 18 or over, coercion, exploitation, learning disability): refer and follow the local safeguarding pathway.\n- Known hypersensitivity to macrolides.\n- History of QT prolongation or taking interacting QT-prolonging drugs.\n- Severe hepatic impairment.\n- Pregnant or breastfeeding: refer to the GP or sexual health service (azithromycin is the BASHH choice in pregnancy, but a test of cure and follow-up are needed).\n- Concurrent use of ergot derivatives."),
        ("replace", "Azithromycin 1 g stat, then 500 mg once daily for 2 days (some guidelines suggest single 1 g dose – follow local policy).",
         "Azithromycin 1 g on day 1, then 500 mg once daily on days 2 and 3 (BASHH 2015 chlamydia guideline, 2018 update: the single 1 g dose is no longer recommended because of treatment failure and Mycoplasma genitalium resistance)."),
        ("replace", "1 g as a single dose (two 500 mg tablets taken together).",
         "1 g (two 500 mg tablets) on day 1, then 500 mg (one tablet) once daily on days 2 and 3. Total 2 g over 3 days."),
        ("replace", "2 tablets (total 1 g).", "4 x 500 mg tablets (total 2 g)."),
        ("replace", "Single dose treatment.", "3 days."),
    ], [
        "Safeguarding written into both arms: under 13 never supplied and always referred with a safeguarding referral; 13 to 15 only with recorded Fraser competence and a safeguarding assessment; the previous version included everyone aged 15 and over with no assessment.",
        "Azithromycin regimen corrected to the BASHH regimen (1 g then 500 mg daily for 2 days, 4 tablets, 3 days). The single 1 g dose in the previous version has not been recommended since 2018. The 'unless assessed as suitable by a prescriber' pregnancy line is replaced by a referral.",
    ]),
    "travellers-diarrhoea": ("travellers-diarrhoea.pdf", "TRAVELLERS_DIARRHOEA_PGD_V2_SIGNED_13Jul2026.docx", "v003", "Version 002, 13 July 2026", [], [
        "Reissued so that both signatories sign the same version on the same date. Version 002 carried the Medical Director's signature dated 13 July 2026 beside a Head Pharmacist signature dated 25 August 2025, from version 001.",
    ]),
    "period-delay": ("period-delay-v007.pdf", A("period-delay-v007-SIGNED.docx"), "v008", f"Version 007, {R}", [
        ("replace", "EXCLUDE and refer where ANY of the following is present. These mirror UKMEC 2025 category 3 and 4 for combined hormonal contraception, plus the SPC contraindications.",
         "EXCLUDE and refer where ANY of the following is present. The list is built from the UKMEC 2025 category 3 and 4 conditions for combined hormonal contraception, applied by analogy as explained in the guidance summary, together with the Primolut N SPC contraindications and further cardiovascular and oncological conditions; it is deliberately wider than UKMEC 3 and 4, not a mirror of them."),
        ("replace", "Uncontrolled hypertension, or a blood pressure of 140/90 or above measured today.",
         "Hypertension of any grade, treated or untreated, a blood pressure of 140/90 or above measured today, or a history of hypertension in pregnancy."),
        ("insert_after", "Hypertension of any grade, treated or untreated, a blood pressure of 140/90 or above measured today, or a history of hypertension in pregnancy.", [
            "Atrial fibrillation, or valvular or congenital heart disease.",
            "Systemic lupus erythematosus, or antiphospholipid antibodies or antiphospholipid syndrome.",
            "Known BRCA1 or BRCA2 carrier status, or current or past breast cancer.",
            "Dyslipidaemia together with any other cardiovascular risk factor (smoking is already excluded; this covers obesity below the BMI threshold, diabetes, hypertension and family history).",
        ]),
    ], [
        "Exclusion list widened: hypertension of any grade (treated or not) and hypertension in pregnancy, atrial fibrillation and valvular or congenital heart disease, SLE and antiphospholipid syndrome, BRCA carrier status and breast cancer, and dyslipidaemia with another risk factor. The claim that the list 'mirrors UKMEC 3 and 4' is removed: the list is wider than UKMEC and says so.",
    ]),
    "b12-injection": ("b12-folate-v007.pdf", A("b12-folate-v007-SIGNED.docx"), "v008", f"Version 007, {R}", [
        ("delete", "Leber’s hereditary optic neuropathy, or a family history of it, because of the risk of optic atrophy."),
    ], [
        "Leber's hereditary optic neuropathy removed from the hydroxocobalamin exclusions. It is a contraindication to cyanocobalamin, not hydroxocobalamin: hydroxocobalamin is the licensed treatment for Leber's optic atrophy, as the document's own SmPC summary states. The exclusion stays in the cyanocobalamin arm.",
    ]),
    "wegovy": ("wegovy-v006.pdf", A("wegovy-v006-SIGNED.docx"), "v007", f"Version 006, {R}", [
        ("insert_after", "This PGD does not allow additional medication to be supplied to enable patients to stock up.", [
            "Maximum treatment period: 2 years of continuous treatment under this PGD, in line with NICE TA875, after which the patient is referred to the GP or a specialist prescriber for a decision on continuation. Treatment is stopped earlier where less than 5% of initial body weight has been lost after 6 months on the maximum tolerated dose, or where the patient no longer meets the criteria.",
            "NICE TA875 recommends semaglutide within a specialist weight management service with multidisciplinary support. This PGD authorises private supply outside that commissioning position: the pharmacist provides the diet, activity and behavioural support described under counselling, the GP is informed at initiation and at each review, and the patient is told that the NHS route exists and how to access it.",
        ]),
    ], [
        "A maximum treatment period row added: 2 years under this PGD (NICE TA875), stop at 6 months on the maximum tolerated dose if under 5% weight loss. The document now states that supply is private and outside the NICE commissioning position, and what the pharmacy provides in place of the specialist service.",
    ]),
    "yellow-fever": ("yellow-fever-v003.pdf", A("yellow-fever-v003-SIGNED.docx"), "v004", f"Version 003, {R}", [
        ("insert_after", "Acute severe febrile illness. Postpone until recovered, allowing 10 days before travel for the certificate to become valid.", [
            "Pregnancy. Do not vaccinate under this PGD. Advise against travel to a yellow fever risk area; where travel is unavoidable, refer to a specialist yellow fever centre for an individual risk assessment, and offer a Medical Letter of Exemption where a certificate is required for entry. Vaccinate after pregnancy if the risk continues.",
        ]),
        ("delete", "Pregnancy: advise against travel to a yellow fever risk area. Vaccination is generally not given, but can be considered after a detailed risk assessment where the benefit may outweigh the theoretical risk of foetal infection from the live virus; discuss with a specialist first. Revaccinate after pregnancy if risk continues."),
    ], [
        "Pregnancy moved from the cautions to the exclusion criteria: not vaccinated under this PGD, referred to a specialist centre, Medical Letter of Exemption offered. A caution that says vaccination 'can be considered' left a pharmacist to make a live-vaccine-in-pregnancy decision that is a specialist's.",
    ]),
    "hayfever": ("hayfever-v002.pdf", A("hayfever-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace", "Fexofenadine 180mg", "Fexofenadine 120mg tablets"),
        ("replace", "180 mg once daily.", "120 mg once daily, the licensed dose for allergic rhinitis in adults and children aged 12 years and over. The 180 mg strength is licensed for chronic idiopathic urticaria only and is not supplied under this PGD."),
        ("replace", "POM", p_cat("fexofenadine", " for fexofenadine 120 mg as Allevia; generic fexofenadine 120 mg tablets remain POM, and this PGD is the legal authority for those"), 1),
        ("replace", "Dymista", "Dymista nasal spray, suspension: azelastine hydrochloride 137 micrograms and fluticasone propionate 50 micrograms per actuation, 23 g bottle delivering 120 actuations (Viatris)"),
    ], [
        "Fexofenadine strength corrected to 120 mg, the strength licensed for allergic rhinitis. Version 002 named 180 mg, which is licensed only for chronic idiopathic urticaria, without declaring off-label use. Legal category stated correctly: 120 mg is P as Allevia and POM as the generic.",
        "Dymista is named in full with its form, both active ingredients and strengths, pack size and marketing authorisation holder.",
    ]),
    "altitude-sickness": ("altitude-sickness-v002.pdf", A("altitude-sickness-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace", "Summary of NICE CKS Guidelines for Altitude Sickness",
         "Summary of the governing guidance for altitude sickness: BNF acetazolamide monograph (unlicensed indication), NaTHNaC / TravelHealthPro altitude illness factsheet, and the Wilderness Medical Society clinical practice guidelines for acute altitude illness, 2024 update. There is no NICE or NICE CKS topic for altitude sickness."),
        ("replace", "Acetazolamide 250 mg twice daily, starting 1–2 days before ascent, continue for at least 2 days at peak altitude",
         "Acetazolamide 125 mg twice daily, starting 1 to 2 days before ascent and continuing for 2 days at the highest altitude, or until descent begins (Wilderness Medical Society 2024: 125 mg twice daily is as effective as 250 mg for prevention with fewer adverse effects)"),
        ("replace", "250 mg twice daily can help reduce symptom duration", "250 mg twice daily until symptoms resolve, together with rest or descent; descent is the definitive treatment and acetazolamide is an adjunct"),
        ("replace", "Prevention: half a tablet twice daily for (2 lead-in days + days ascending + 2 days), rounded up to whole tablets, maximum 28 tablets. Treatment: 6 tablets (250 mg twice daily for 3 days).",
         "Prevention: half a tablet (125 mg) twice daily for (1 to 2 lead-in days + days ascending + 2 days), rounded up to whole tablets, MAXIMUM 14 tablets (28 doses, 14 days). Treatment: 6 tablets (250 mg twice daily for 3 days), which may be supplied in addition to the prevention course where the itinerary makes descent difficult; maximum total 20 tablets per supply."),
        ("replace", "NICE CKS Guidance", "Wilderness Medical Society Clinical Practice Guidelines for the Prevention, Diagnosis and Treatment of Acute Altitude Illness: 2024 Update (Wilderness & Environmental Medicine, 2024); NaTHNaC TravelHealthPro factsheet, Altitude illness; BNF, acetazolamide"),
    ], [
        "The guidance summary is re-attributed to its real sources (BNF, NaTHNaC, Wilderness Medical Society 2024). There is no NICE CKS topic on altitude sickness; the previous version said there was. The summary's prevention dose is corrected to 125 mg twice daily, consistent with the PGD's own dose row.",
        "Maximum quantity set to 14 tablets for prevention (28 doses, 14 days, matching the maximum period) and 6 for treatment, total 20; the previous 28-tablet maximum was double the stated maximum period.",
    ]),
    "bph": ("bph.pdf", H("BPH FINAL V.docx"), "v002", "Version 001, 1 November 2025", [
        ("insert_after", "Acute urinary retention requiring catheterisation or in-patient management", [
            "Visible or non-visible haematuria (refer: urological investigation before any treatment of symptoms)",
            "Current or recurrent urinary tract infection, or dysuria with fever (refer)",
            "Palpable bladder, or symptoms suggesting chronic retention: overflow incontinence, a constant feeling of incomplete emptying with a poor stream (refer for post-void residual measurement)",
            "Known or suspected prostate cancer, an abnormal digital rectal examination, or a raised PSA (refer)",
            "Neurological disease affecting bladder function: multiple sclerosis, Parkinson's disease, spinal cord disease, diabetic neuropathy (refer)",
            "Aged under 45: lower urinary tract symptoms at this age are unlikely to be BPH; refer to the GP for diagnosis",
            "Symptoms not previously assessed by a GP or urologist, unless the GP is informed on the day of supply and the patient agrees to attend the GP within 6 weeks for examination and, where indicated, PSA testing",
        ]),
        ("replace", "Ongoing treatment with clinical review at 4-6 weeks to assess symptom improvement. If adequate response is achieved, continue with 6-monthly reviews. If no improvement after 4-6 weeks of treatment, consider specialist referral to urology for further assessment and alternative management options.",
         "Maximum under this PGD: an initial supply of 4 weeks, then, where the IPSS has improved by 3 points or more at the 4 to 6 week review and the patient has been examined by the GP, further supplies of up to 12 weeks each to a maximum of 12 months' continuous treatment, after which the GP takes over prescribing. No improvement at 4 to 6 weeks, or any new exclusion, ends supply under this PGD and the patient is referred."),
    ], [
        "Exclusions added: haematuria, current or recurrent UTI, chronic retention, known or suspected prostate cancer, neurological bladder disease, age under 45, and symptoms never assessed by a GP without a GP appointment within 6 weeks. The previous version's summary named these as red flags but the exclusion criteria did not.",
        "A maximum treatment period is stated: 4-week initial supply, continuation only after GP examination and IPSS improvement, 12 months' maximum before GP prescribing. The previous version said 'ongoing treatment'.",
    ]),
    "meningitis-b": ("meningitis-b-v003.pdf", "MENB_BEXSERO_TRUMENBA_PGD_V002_SIGNED_14Aug2026.docx", "v004", f"Version 003, {R9}", [
        ("insert_after_contains", "Where given with other vaccines, use a separate site", MENB_OBS),
    ], [
        "Rebuilt from the version 002 source. The 15-minute observation requirement that version 003 carried as an appended addendum page is now written into the cautions, where it belongs; the addendum page, its narrative and the second signature page are gone. Versions 001 to 003 are listed in the change history.",
    ]),
    "smoking-varenicline": ("smoking-varenicline-v002.pdf", A("smoking-varenicline-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace_contains", "for the administration of Varenicline 0.5mg and 1mg tablets (Champix) for the treatment of Smoking Cessation",
         "Patient Group Direction\nfor the supply of Varenicline 0.5mg and 1mg tablets for the treatment of Smoking Cessation"),
        ("replace", "Varenicline 0.5mg and 1mg tablets (Champix)", "Varenicline (as tartrate) 0.5mg and 1mg film-coated tablets. Any UK-licensed generic varenicline product; Champix is no longer marketed in the UK."),
        ("replace", "Supply the Patient Information Leaflet (PIL) provided with Champix tablets. Ensure patient understands the dosing schedule and importance of adherence.",
         "Supply the Patient Information Leaflet provided with the varenicline product supplied. Ensure the patient understands the dosing schedule and the importance of adherence."),
    ], [
        "Product naming corrected: Champix was withdrawn from the UK market in 2021 and has not returned; the PGD names generic varenicline tablets, which are what pharmacies hold. 'Administration' corrected to 'supply' in the title: varenicline is supplied, not administered.",
    ]),
    "smoking-nrt": ("smoking-nrt.pdf", H("SMOKING CESSATION NRT FINAL V.docx"), "v002", "Version 001, 1 November 2025", [
        ("replace", "Nicotine patches (e.g. NiQuitin/Nicorette) 7mg, 14mg, 21mg/24-hour", "Nicotine 24-hour patches 7mg, 14mg, 21mg (e.g. NiQuitin Clear)"),
        ("replace", "Nicotine patches 7mg, 14mg, 21mg/24-hour (e.g. NiQuitin, Nicorette)", "Nicotine 24-hour transdermal patches 7mg, 14mg, 21mg (e.g. NiQuitin Clear). Nicorette Invisi patches are 16-hour patches of 10mg, 15mg and 25mg and are not the product described here."),
    ], [
        "Product naming corrected: Nicorette patches are 16-hour patches (10, 15, 25 mg) and were wrongly listed as an example of a 24-hour 7/14/21 mg patch. The 24-hour arm now names NiQuitin only.",
    ]),
    "fungal-infection": ("fungal-infection-v002.pdf", A("fungal-infection-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace", "POM", p_cat("miconazole"), 1),
        ("replace_contains", "- Do not use under occlusion unless advised by prescriber.",
         "- Do not use under occlusion.\n- Avoid prolonged use; assess if symptoms persist or worsen.\n- Avoid contact with eyes and mucous membranes."),
    ], [
        "Legal category corrected: miconazole 2% cream is a P medicine, not a POM; the arm is retained so the supply is assessed and recorded to the PGD standard. 'Unless advised by prescriber' removed from the Trimovate cautions: there is no prescriber in a PGD supply.",
    ]),
    "emergency-contraception": ("emergency-contraception-v002.pdf", A("emergency-contraception-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace", "POM (Prescription-only medicine when supplied under PGD)",
         "P (Pharmacy medicine) for women aged 16 and over; POM under 16. This PGD is the legal authority for supply to those under 16; for those 16 and over it sets the standard of assessment and record for what is otherwise a P sale."),
        ("replace", "POM (Prescription-only medicine)",
         "P (Pharmacy medicine). ellaOne is licensed for sale without prescription at any age of reproductive potential; this PGD sets the standard of assessment and record for the supply."),
    ], [
        "Legal categories corrected: levonorgestrel 1.5 mg is P at 16 and over and POM under 16; ulipristal acetate 30 mg (ellaOne) is P. Version 002 called both POM.",
    ]),
    "cold-sores": ("cold-sores.pdf", J("Jane 2026 PGD cold sores.docx"), "v002", "Version 001, 28 December 2025", [
        ("replace", "POM", p_cat("aciclovir 5% cream"), 1),
    ], [
        "Legal category corrected: aciclovir 5% cream is a P medicine (and GSL in the 2 g pack), not a POM. The oral aciclovir arm is POM and unchanged.",
    ]),
    "thrush": ("thrush-v002.pdf", A("thrush-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace", "POM", "P (Pharmacy medicine) for women aged 16 to 60, which is the age range this PGD covers; POM outside it. A PGD is not legally required for a P sale; this arm is included so that the supply is assessed and recorded to the same standard as a POM supply.", 1),
        ("replace", "POM", p_cat("clotrimazole 500 mg pessary", " for women aged 16 to 60"), 1),  # the fluconazole cell is already replaced
    ], [
        "Legal categories corrected: fluconazole 150 mg and clotrimazole 500 mg pessary are P medicines for women aged 16 to 60, the range this PGD covers. Version 002 called both POM.",
    ]),
    # ------------------------------------------------------------- CKS attributions
    "dengue": ("dengue-v004.pdf", A("dengue-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [
        ("replace", "Summary of NICE / NICE CKS Guidelines for Dengue Fever Prevention",
         "Summary of the governing guidance for dengue vaccination: Green Book chapter 15a (Dengue), NaTHNaC / TravelHealthPro dengue factsheet and the Qdenga SmPC. There is no NICE or NICE CKS topic on dengue."),
        ("replace", "NICE CKS Guidance: Dengue Fever Immunisation and Prevention", "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapter 15a Dengue; NaTHNaC TravelHealthPro, Dengue factsheet; Qdenga Summary of Product Characteristics, current version"),
    ], [
        "The guidance summary and references are attributed to the Green Book, NaTHNaC and the SmPC. There is no NICE CKS topic on dengue; the previous version cited one.",
    ]),
    "chickenpox": ("chickenpox-v003.pdf", A("chickenpox-v003-SIGNED.docx"), "v004", f"Version 003, {R}", [
        ("replace", "Summary of NICE and NICE CKS Guidelines for Chickenpox (Varicella) Vaccination",
         "Summary of the governing guidance for varicella vaccination: Green Book chapter 34 (Varicella), the Varivax and Varilrix SmPCs, and the JCVI advice of November 2023 on a routine childhood varicella programme. NICE CKS 'Chickenpox' covers the illness, not vaccination."),
        ("replace", "NICE CKS Guidance", "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapter 34 Varicella; JCVI statement on a childhood varicella vaccination programme, November 2023; Varivax and Varilrix Summaries of Product Characteristics, current versions"),
    ], [
        "The guidance summary and references are attributed to the Green Book, JCVI and the SmPCs rather than to a NICE CKS vaccination topic that does not exist.",
    ]),
    "rsv": ("rsv-v004.pdf", A("rsv-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [
        ("replace", "Summary of NICE / NICE CKS Guidelines for RSV Vaccination and Prevention",
         "Summary of the governing guidance for RSV vaccination: Green Book chapter 27a (Respiratory syncytial virus), the JCVI advice of June 2023 and the Abrysvo and Arexvy SmPCs. There is no NICE or NICE CKS topic on RSV vaccination."),
        ("replace", "NICE CKS Guidance", "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapter 27a Respiratory syncytial virus; JCVI statement on immunisation for RSV, June 2023; Abrysvo and Arexvy Summaries of Product Characteristics, current versions"),
    ], [
        "The guidance summary and references are attributed to the Green Book, JCVI and the SmPCs rather than to a NICE CKS topic that does not exist.",
    ]),
    "hep-b-occupational": ("hep-b-occupational-v003.pdf", A("hep-b-occupational-v003-SIGNED.docx"), "v004", f"Version 003, {R}", [
        ("replace", "Summary of NICE / NICE CKS Guidelines for Hepatitis B Vaccination",
         "Summary of the governing guidance for hepatitis B vaccination: Green Book chapter 18 (Hepatitis B) and the Engerix B, HBvaxPRO and Fendrix SmPCs. NICE CKS 'Hepatitis B' covers the infection, not occupational vaccination."),
        ("replace", "NICE CKS Guidance", "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapter 18 Hepatitis B; Summaries of Product Characteristics for the vaccine administered, current version"),
    ], [
        "The guidance summary and references are attributed to Green Book chapter 18 and the SmPCs rather than to NICE CKS, which does not cover occupational hepatitis B vaccination.",
    ]),
    "mmr": ("mmr-v003.pdf", A("mmr-v003-SIGNED.docx"), "v004", f"Version 003, {R}", [
        ("replace", "Summary of NICE / NICE CKS Guidelines for MMR Vaccination",
         "Summary of the governing guidance for MMR vaccination: Green Book chapters 21 (Measles), 23 (Mumps) and 28 (Rubella), the UK routine immunisation schedule and the MMRvaxPro and Priorix SmPCs. NICE CKS 'Immunizations - childhood' summarises the same schedule."),
        ("replace", "NICE CKS Guidance", "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapters 21, 23 and 28; UKHSA, the complete routine immunisation schedule, current edition; MMRvaxPro and Priorix Summaries of Product Characteristics, current versions"),
    ], [
        "The guidance summary and references name the Green Book chapters, the routine schedule and the SmPCs as the governing sources.",
    ]),
    "pneumococcal": ("pneumococcal-v003.pdf", A("pneumococcal-v003-SIGNED.docx"), "v004", f"Version 003, {R}", [
        ("replace", "Summary of NICE / NICE CKS Guidelines for Pneumococcal Vaccination",
         "Summary of the governing guidance for pneumococcal vaccination: Green Book chapter 25 (Pneumococcal), the JCVI advice on PCV20 and the Prevenar 20, Prevenar 13 and Pneumovax 23 SmPCs. NICE CKS 'Immunizations - pneumococcal' summarises the same programme."),
        ("replace", "NICE CKS Guidance", "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapter 25 Pneumococcal; JCVI advice on the pneumococcal programme, current; Summaries of Product Characteristics for the vaccine administered, current version"),
    ], [
        "The guidance summary and references name Green Book chapter 25, JCVI and the SmPCs as the governing sources.",
    ]),
    "shingles-vaccine": ("shingles-vaccine-v004.pdf", A("shingles-vaccine-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [
        ("replace", "Summary of NICE and NICE CKS Guidelines for Shingles Vaccination",
         "Summary of the governing guidance for shingles vaccination: Green Book chapter 28a (Shingles), the JCVI advice of 2021 that moved the programme to Shingrix, and the Shingrix SmPC. NICE CKS 'Shingles' summarises the same programme."),
        ("replace", "NICE CKS Guidance", "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapter 28a Shingles (herpes zoster); JCVI advice on the shingles programme; Shingrix Summary of Product Characteristics, current version"),
    ], [
        "The guidance summary and references name Green Book chapter 28a, JCVI and the Shingrix SmPC as the governing sources.",
    ]),
    "travel-core": ("travel-core-v003.pdf", A("travel-core-v003-SIGNED.docx"), "v004", f"Version 003, {R}", [
        ("replace", "Summary of NICE / NICE CKS Guidelines for Travel Health",
         "Summary of the governing guidance for travel vaccination: Green Book chapters 17 (Hepatitis A), 33 (Typhoid) and 14 (Cholera), NaTHNaC / TravelHealthPro country information and the SmPCs of the vaccines administered. NICE CKS 'Immunizations - travel' summarises the same sources."),
        ("replace", "NICE CKS Guidance: Travel health", "UKHSA, Immunisation Against Infectious Disease (the Green Book), chapters 14, 17 and 33; NaTHNaC TravelHealthPro country information pages, current; Summaries of Product Characteristics for the vaccines administered, current versions"),
    ], [
        "The guidance summary and references name the Green Book chapters, NaTHNaC and the SmPCs as the governing sources.",
    ]),
    "postnatal-contraception": ("postnatal-contraception-v003.pdf", A("postnatal-contraception-v003-SIGNED.docx"), "v004", f"Version 003, {R}", [
        ("replace", "Summary of NICE / NICE CKS Guidelines for Postnatal Contraception",
         "Summary of the governing guidance for postnatal contraception: CoSRH (formerly FSRH) clinical guideline Contraception After Pregnancy (2017, amended 2020), UKMEC 2025, and the SmPCs of the products supplied. NICE CKS 'Contraception - assessment' summarises the same sources."),
        ("replace", "NICE CKS Guidance: Postnatal Contraception", "College of Sexual and Reproductive Healthcare (formerly FSRH), Contraception After Pregnancy, January 2017 (amended October 2020); UKMEC 2025; Summaries of Product Characteristics for the products supplied, current versions"),
    ], [
        "The guidance summary and references name CoSRH Contraception After Pregnancy and UKMEC 2025 as the governing sources. There is no NICE CKS topic on postnatal contraception.",
    ]),
    "premature-ejaculation": ("premature-ejaculation-v002.pdf", A("premature-ejaculation-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [
        ("replace", "Summary of NICE / NICE CKS Guidelines for Premature Ejaculation",
         "Summary of the governing guidance for premature ejaculation: the Priligy (dapoxetine) SmPC, the BNF, and the European Association of Urology guidelines on sexual and reproductive health (2024). There is no NICE or NICE CKS topic on premature ejaculation."),
        ("replace", "NICE CKS Guidance: Premature Ejaculation", "European Association of Urology, Guidelines on Sexual and Reproductive Health, 2024 edition, section on premature ejaculation; Priligy Summary of Product Characteristics, current version; BNF, dapoxetine"),
    ], [
        "The guidance summary and references are attributed to the SmPC, the BNF and the EAU guideline. There is no NICE CKS topic on premature ejaculation; the previous version cited one.",
    ]),
    "travellers-diarrhoea-cks": None,  # handled above; the CKS heading is fixed there too
    # --------------------------------------------------------- everything else
    "acne": ("acne-v002.pdf", A("acne-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [], []),
    "alopecia-minoxidil": ("alopecia-minoxidil.pdf", J("Jane 2026 PGD androgenetic alopecia.docx"), "v002", "Version 001, 25 January 2026", [], [
        "First reissue of this document. One document serves both the 'alopecia-minoxidil' and 'hair-loss' catalogue entries.",
    ]),
    "anxiety-propranolol": ("anxiety-propranolol-v003.pdf", A("anxiety-propranolol-v003-SIGNED.docx"), "v004", f"Version 003, {R}", [], []),
    "asthma-rescue": ("asthma-rescue-v004.pdf", A("asthma-rescue-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [], []),
    "bv": ("bv-v002.pdf", A("bv-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [], []),
    "chest-service": ("chest-service-v006.pdf", A("chest-v006-SIGNED.docx"), "v007", f"Version 006, {R}", [], []),
    "covid-booster": ("covid-2026-27-v005.pdf", A("covid-v005-SIGNED.docx"), "v006", f"Version 005, {R9}", [], []),
    "dental-bridging": ("dental-bridging-v006.pdf", A("dental-v006-SIGNED.docx"), "v007", f"Version 006, {R}", [], []),
    "ear-infection": ("ear-infection-v004.pdf", A("ear-infection-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [], []),
    "eczema": ("eczema-v004.pdf", G("eczema-v004-SIGNED.docx"), "v005", f"Version 004, {R9}", [], []),
    "ed": ("ed-v005.pdf", A("ed-v005-SIGNED.docx"), "v006", f"Version 005, {R}", [], []),
    "eye-infections": ("eye-infections.pdf", H("EYE INFECTIONS FINAL V.docx"), "v002", "Version 001, 1 November 2025", [], ["First reissue of this document."]),
    "flu": ("flu-2026-27-v003.pdf", "FLU_PGD_V003_SIGNED_2026-27.docx", "v004", "Version 003, 6 August 2026", [], []),
    "foundayo": ("foundayo-v006.pdf", A("foundayo-v006-SIGNED.docx"), "v007", f"Version 006, {R}", [], []),
    "genital-warts": ("genital-warts-v002.pdf", A("genital-warts-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [], []),
    "gonorrhoea-treatment": ("gonorrhoea-treatment-v002.pdf", A("gonorrhoea-treatment-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [], []),
    "hep-ab-travel": ("hep-ab-travel-v005.pdf", A("hep-ab-travel-v005-SIGNED.docx"), "v006", f"Version 005, {R}", [], [
        "The 'Why this document exists' narrative is removed from the cover. The incident it described is recorded in Get Real Health's governance log, not in the PGD.",
    ]),
    "hpv": ("hpv-v003.pdf", G("hpv-v003-SIGNED.docx"), "v004", "Version 003, 8 September 2026", [], []),
    "impetigo": ("impetigo-v007.pdf", A("impetigo-v007-SIGNED.docx"), "v008", f"Version 007, {R}", [], [
        "The 'What changed, and why' block is removed from the cover and the document carries one validity statement and one dated signature page.",
    ]),
    "japanese-encephalitis": ("japanese-encephalitis-v004.pdf", A("japanese-encephalitis-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [], []),
    "junior-travel": ("junior-travel-v005.pdf", A("junior-travel-v005-SIGNED.docx"), "v006", f"Version 005, {R}", [], []),
    "meningitis-acwy-travel": ("meningitis-acwy-travel-v005.pdf", A("meningitis-acwy-travel-v005-SIGNED.docx"), "v006", f"Version 005, {R}", [], []),
    "mounjaro": ("mounjaro-v006.pdf", A("mounjaro-v006-SIGNED.docx"), "v007", f"Version 006, {R}", [], []),
    "orlistat": ("orlistat.pdf", H("ORLISTAT FINAL V.docx"), "v002", "Version 001, 1 November 2025", [], ["First reissue of this document."]),
    "period-pain": ("period-pain-v002.pdf", A("period-pain-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [], []),
    "psoriasis": ("psoriasis-v003.pdf", G("psoriasis-v003-SIGNED.docx"), "v004", "Version 003, 8 September 2026", [], []),
    "rabies": ("rabies-v004.pdf", G("rabies-v004-SIGNED.docx"), "v005", "Version 004, 8 September 2026", [], []),
    "rosacea": ("rosacea-v002.pdf", A("rosacea-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [], []),
    "saxenda": ("saxenda-v002.pdf", A("saxenda-v002-SIGNED.docx"), "v003", f"Version 002, {R}", [], []),
    "shingles-treatment": ("shingles-treatment-v004.pdf", A("shingles-treatment-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [], []),
    "skin-infection": ("skin-infection-v004.pdf", G("skin-v004-SIGNED.docx"), "v005", f"Version 004, {R9}", [], []),
    "sleep-melatonin": ("sleep-melatonin-v004.pdf", A("sleep-melatonin-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [], []),
    "typhoid": ("typhoid-v004.pdf", A("typhoid-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [], []),
    "uti": ("uti-v004.pdf", A("uti-v004-SIGNED.docx"), "v005", f"Version 004, {R}", [], []),
    "wegovy-oral": ("wegovy-oral-v009.pdf", A("wegovy-oral-v009-SIGNED.docx"), "v010", f"Version 009, {R}", [], []),
    "wound-care": ("wound-care-v006.pdf", A("wound-care-v006-SIGNED.docx"), "v007", f"Version 006, {R}", [], []),
}
JOBS = {k: v for k, v in JOBS.items() if v is not None}

# travellers' diarrhoea: fix its CKS heading too (there is no CKS topic)
JOBS["travellers-diarrhoea"][4].extend([
    ("replace", "Summary of NICE CKS Guidelines for Traveller’s Diarrhoea",
     "Summary of the governing guidance for travellers' diarrhoea: NaTHNaC / TravelHealthPro travellers' diarrhoea factsheet, the BNF, and the SmPCs of the products supplied. There is no NICE CKS topic on travellers' diarrhoea."),
    ("replace", "NICE CKS Guidance", "NaTHNaC TravelHealthPro, Travellers' diarrhoea factsheet; BNF; Summaries of Product Characteristics for the products supplied, current versions"),
])
JOBS["travellers-diarrhoea"][5].append("The guidance summary and references are attributed to NaTHNaC, the BNF and the SmPCs; there is no NICE CKS topic on travellers' diarrhoea.")

# published filenames: the live name with the version token replaced
def out_names(slug, live, version):
    base = re.sub(r"-v\d{3}$", "", live[:-4])
    docx_base = {"chest-service": "chest", "dental-bridging": "dental", "covid-booster": "covid",
                 "skin-infection": "skin", "b12-injection": "b12-folate", "flu": "flu",
                 "sti-testing": "chlamydia", "alopecia-minoxidil": "alopecia"}.get(slug, base)
    return f"{base}-{version}.pdf", f"{docx_base}-{version}-SIGNED.docx"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    outdir = "/tmp/r3out" if dry else APPROVED
    os.makedirs(outdir, exist_ok=True)
    manifest = {}
    for slug, (live, src, version, supersedes, edits, changes) in JOBS.items():
        if args and slug not in args:
            continue
        if not os.path.isabs(src):
            src = os.path.join(PARENT, src)
        pdf_name, docx_name = out_names(slug, live, version)
        out = os.path.join(outdir, docx_name)
        publish = None if dry else os.path.join(PUBLIC, pdf_name)
        remove = None if dry or pdf_name == live else os.path.join(PUBLIC, live)
        pdf = reissue(slug, src, out, version, supersedes, DATE, list(changes) + [STRUCT], edits,
                      publish_to=publish, remove=remove)
        if not dry:
            # the HubRx-branded copy of the November 2025 original, if any
            branded = os.path.join(PUBLIC, live[:-4] + " 2.pdf")
            if os.path.exists(branded):
                os.remove(branded)
        manifest[slug] = pdf_name
        if slug == "alopecia-minoxidil" and not dry:
            shutil.copyfile(pdf, os.path.join(PUBLIC, f"hair-loss-{version}.pdf"))
            for old in ("hair-loss.pdf", "hair-loss 2.pdf", "alopecia-minoxidil 2.pdf"):
                p = os.path.join(PUBLIC, old)
                if os.path.exists(p):
                    os.remove(p)
            manifest["hair-loss"] = f"hair-loss-{version}.pdf"
        if slug == "b12-injection":
            manifest["folic-acid"] = pdf_name
    print()
    for k, v in sorted(manifest.items()):
        print(f'  "{k}": "{v}",')


if __name__ == "__main__":
    main()
