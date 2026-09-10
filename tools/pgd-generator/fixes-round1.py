#!/usr/bin/env python3
"""
fixes-round1.py  --  clinical review of 10 September 2026, round 1

Two of the five themes from the full review, in Nitin's order:

  THEME 1  the document states no period of validity, or two of them.
           Thirteen live PGDs had no valid-from or expiry date anywhere;
           thirteen more carried 31/10/26 in the expiry cell and would have
           lapsed seven weeks after this review. Every reissue below now
           states "Valid from ... Expiry 31 July 2027" in its change record
           and grh_reissue rewrites any lapsed expiry cell.

  THEME 3  the PGD permits something the product licence contraindicates.
           Each fix below copies the SmPC contraindication into the
           exclusion criteria, in the words of the SmPC, so a pharmacist
           reading only the exclusion list refuses the patient the licence
           refuses. Where the register also found a plain product error in
           the same document (a strength that does not exist, a pen that
           holds four doses not one, a 0.5 mL dose of a 1.0 mL vaccine) it
           is corrected here rather than left for another version.

Every edit is anchored on the exact text of a paragraph in the current
signed master and the run stops if an anchor is not found, so a document
that has moved on since the register was written is not silently half
patched.

Not in this round, because they need a decision from Nitin or Chris and
are recorded in the register: the anti-malarial weight bands (SmPC versus
UKMEAG), tetanus in pregnancy, the pneumococcal guidance summary rewrite
against the July 2026 Green Book chapter, and the chickenpox NHS MMRV
programme wording.

  python3 tools/pgd-generator/fixes-round1.py            all documents
  python3 tools/pgd-generator/fixes-round1.py mysimba    one document
"""

import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from grh_reissue import reissue  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(HERE))
PARENT = os.path.dirname(ROOT)
APPROVED = os.path.join(PARENT, "PGD Rewrite 2026", "02 Approved")
HUBRX = os.path.join(PARENT, "HUB RX LATEST PRESENTATIONS ", "2026 PGD")
PUBLIC = os.path.join(ROOT, "public", "pgd-documents")
DATE = "10 September 2026"

# The estate's injectable safety wording, from the vaccine sweep.
_spec = importlib.util.spec_from_file_location("vsb", os.path.join(HERE, "vaccine-safety-block.py"))
_vsb = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_vsb)
ADRENALINE = _vsb.BLOCKS["adrenaline"][1]
OBSERVATION = _vsb.BLOCKS["observation"][1]


def for_injection(lines):
    """The vaccine wording, said of an antibiotic injection."""
    out = []
    for l in lines:
        l = l.replace("whenever vaccines are given", "whenever this injection is given")
        l = l.replace("where vaccination takes place", "where the injection is given")
        l = l.replace("AFTER VACCINATION", "AFTER THE INJECTION")
        l = l.replace("not to the vaccine", "not to the medicine")
        l = l.replace("every person administering", "every person administering it")
        out.append(l)
    return out

VALIDITY = ("Validity: this version is valid from " + DATE + " and expires on 31 July 2027. "
            "The signed master previously stated no period of validity, or an expiry of "
            "31 October 2026; those are superseded.")

# The v002 safety-sweep reissues headed their appended block with version
# bookkeeping and a disclaimer that the document had not been reviewed. It
# has now, and a pharmacist does not need either in the body.
NARR_CLEAN = [
    ("opt_replace_contains", "VACCINE SAFETY REQUIREMENTS, ADDED AT VERSION", "Vaccine safety requirements"),
    ("opt_replace_contains", "They were absent from the signed document",
     "The requirements on the following pages form part of this Patient Group Direction "
     "and must be met before any vaccine is administered under it."),
    ("opt_delete_contains", "This version REPLACES the correction notice"),
    ("opt_delete_contains", "It is NOT a clinical review of this PGD"),
]

V1_NOV25 = "Version 001, 1 November 2025"
V1_JUN25 = "Version 001, 25 June 2025"
V2_SEP9 = "Version 002, 9 September 2026"


def H(name):
    return os.path.join(HUBRX, name)


def A(name):
    return os.path.join(APPROVED, name)


JOBS = [
    # ------------------------------------------------------------------ mysimba
    dict(slug="mysimba", src=H("MYSIMBA FINAL V.docx"), version="v002", supersedes=V1_NOV25,
         remove="mysimba.pdf",
         changes=[
             VALIDITY,
             "Exclusion criteria: 'Bipolar disorder or major depressive disorder with suicidal ideation' "
             "read as excluding bipolar disorder only where suicidal ideation was present. The SmPC (4.3) "
             "contraindicates any history of bipolar disorder. Split into two exclusions.",
             "Exclusion added: any other product containing bupropion (for example Zyban) or naltrexone, "
             "which the SmPC contraindicates and the previous version did not mention.",
         ],
         edits=[
             ("replace", "Bipolar disorder or major depressive disorder with suicidal ideation",
              "Any history of bipolar disorder"),
             ("insert_after", "Any history of bipolar disorder", [
                 "Current depression, suicidal ideation, or any history of suicide attempt",
                 "Currently taking any other product containing bupropion (for example Zyban) or naltrexone",
             ]),
         ]),
    # ------------------------------------------------------ premature-ejaculation
    dict(slug="premature-ejaculation", src=H("PREMATURE EJACULATION FINAL V.docx"), version="v002",
         supersedes=V1_NOV25, remove="premature-ejaculation.pdf",
         changes=[
             VALIDITY,
             "Hepatic impairment: the Priligy SmPC contraindicates moderate as well as severe impairment "
             "(Child-Pugh B and C). The previous version excluded class C only and permitted moderate "
             "impairment under a caution. Now excluded; caution applies to mild (class A) only.",
             "Serotonergic medicines: the exclusion named MAOIs, thioridazine, SSRIs, SNRIs and tricyclics. "
             "The SmPC contraindication covers all serotonergic medicines and applies for 14 days after "
             "stopping them. Tramadol, triptans, linezolid, lithium, L-tryptophan and St John's wort added, "
             "with the 14 day washout.",
         ],
         edits=[
             ("replace", "Severe hepatic impairment (Child-Pugh class C)",
              "Moderate or severe hepatic impairment (Child-Pugh class B or C)"),
             ("replace", "Mild to moderate hepatic impairment - use with caution and monitor closely",
              "Mild hepatic impairment (Child-Pugh class A) - use with caution; moderate or severe impairment excludes"),
             ("replace", "Concurrent use of MAOIs, thioridazine, or other SSRIs/SNRIs/tricyclic antidepressants",
              "Concurrent use of MAOIs, thioridazine, SSRIs, SNRIs, tricyclic antidepressants, or any other "
              "serotonergic medicine including tramadol, triptans, linezolid, lithium, L-tryptophan and "
              "St John's wort, or use of any of these within the last 14 days"),
         ]),
    # ---------------------------------------------------- postnatal-contraception
    dict(slug="postnatal-contraception", src=H("POSTNATAL CONTRACEPTION FINAL V.docx"), version="v002",
         supersedes=V1_NOV25, remove="postnatal-contraception.pdf",
         changes=[
             VALIDITY,
             "Depo-Provera arm, exclusion added: meningioma, current or previous. The Depo-Provera SmPC "
             "(September 2025) contraindicates medroxyprogesterone in patients with meningioma or a history "
             "of meningioma; the previous version did not mention it.",
         ],
         edits=[
             ("insert_after", "Severe cardiovascular disease", ["Meningioma, current or previous"]),
         ]),
    # -------------------------------------------------------------- sore-throat
    dict(slug="sore-throat", src=H("SORE THROAT TEST AND TREAT FINAL V.docx"), version="v002",
         supersedes=V1_NOV25, remove="sore-throat.pdf",
         changes=[
             VALIDITY,
             "Clarithromycin arm, exclusion criteria: the SmPC (4.3) contraindicates clarithromycin with "
             "colchicine, ticagrelor, ranolazine, ivabradine, domperidone, pimozide, astemizole, cisapride, "
             "terfenadine, oral midazolam and lomitapide, and in severe hepatic failure combined with renal "
             "impairment. None was an exclusion. All added, in the words of the SmPC.",
         ],
         edits=[
             ("insert_after", "QT prolongation or risk factors (hypokalaemia, hypomagnesaemia, cardiac arrhythmia history)", [
                 "Concurrent use of colchicine, ticagrelor, ranolazine, ivabradine, domperidone, pimozide, "
                 "astemizole, cisapride, terfenadine, oral midazolam or lomitapide (SmPC contraindications)",
                 "Severe hepatic failure in combination with renal impairment",
             ]),
             ("replace", "Drug interactions: significant interactions with statins, ergotamines, antiarrhythmics; check before prescribing",
              "Drug interactions: check every current medicine against the clarithromycin SmPC before supply. "
              "The contraindicated combinations listed under exclusion criteria exclude; they are not cautions."),
         ]),
    # ----------------------------------------------------------- gonorrhoea
    dict(slug="gonorrhoea-treatment", src=H("GONORRHOEA TREATMENT FINAL V.docx"), version="v002",
         supersedes=V1_NOV25, remove="gonorrhoea-treatment.pdf",
         changes=[
             VALIDITY,
             "Lidocaine 1% injection is now named as a medicine supplied and administered under this PGD. "
             "The previous version directed reconstitution with lidocaine but named ceftriaxone only, so "
             "the lidocaine had no authority. Lidocaine hypersensitivity and the lidocaine SmPC "
             "contraindications are now exclusions, and the reconstituted solution is stated never to be "
             "given intravenously.",
             "Anaphylaxis provision added: adrenaline immediately available, anaphylaxis and basic life "
             "support training, 15 minute seated observation, intramuscular injection competence and sharps "
             "disposal. An intramuscular beta-lactam carries a recognised risk of anaphylaxis (SmPC 4.4) and "
             "the previous version made no provision for it.",
         ],
         edits=[
             ("replace", "Ceftriaxone 1g powder for reconstitution for injection",
              "Ceftriaxone 1g powder for solution for injection, reconstituted with 3.5 mL of lidocaine 1% "
              "solution for injection. Both ceftriaxone and lidocaine 1% are supplied and administered under "
              "this PGD."),
             ("insert_after", "Severe penicillin allergy (anaphylaxis; cross-reactivity ~1-2%)", [
                 "Known hypersensitivity to lidocaine or any other amide local anaesthetic, or any other "
                 "contraindication to lidocaine in its SmPC (including severe heart block without a pacemaker, "
                 "hypovolaemia and porphyria)",
             ]),
             ("insert_after", "Administer as single IM injection into gluteal muscle", [
                 "The lidocaine-reconstituted solution must NEVER be given intravenously.",
             ]),
             ("insert_after", "Renal impairment: Standard dose suitable for eGFR >30; no dose adjustment needed for mild-moderate impairment",
              for_injection(ADRENALINE + OBSERVATION) + [
                  "Users must be competent in intramuscular injection technique. Dispose of sharps in a "
                  "UN-approved puncture-resistant container in accordance with HTM 07-01. Never re-sheath a needle.",
              ]),
         ]),
    # -------------------------------------------------------- fungal-infection
    dict(slug="fungal-infection", src=H("FUNGAL INFECTION FINAL V.docx"), version="v002",
         supersedes=V1_NOV25, remove="fungal-infection.pdf",
         changes=[
             VALIDITY,
             "Trimovate arm: the previous version framed Trimovate as a treatment for fungal skin infection "
             "and sat it under a guidance summary about tinea. The Trimovate SmPC contraindicates primary "
             "fungal, bacterial and viral skin infection. The indication now names inflamed intertrigo, "
             "infected eczema and seborrhoeic dermatitis with a suspected secondary component, states that "
             "Trimovate is not a treatment for ringworm or athlete's foot, and primary fungal, bacterial and "
             "viral infection are exclusions. The document title says which arm treats which.",
         ],
         edits=[
             ("replace_contains", "for the administration of Miconazole 2% cream and Trimovate cream for the treatment of Fungal Skin Infections",
              "Patient Group Direction\nfor the administration of Miconazole 2% cream for the treatment of "
              "Fungal Skin Infections, and Trimovate cream for inflamed intertrigo or infected eczema with a "
              "suspected secondary bacterial or candidal component"),
             ("replace_contains", "Trimovate cream is indicated for short-term treatment of inflammatory skin conditions suspected to have a secondary fungal or bacterial infection",
              "Trimovate cream is indicated for short-term treatment of inflamed intertrigo, infected eczema "
              "or seborrhoeic dermatitis where a secondary bacterial or candidal component is suspected and "
              "combined topical therapy is appropriate. It is NOT a treatment for ringworm (tinea of any "
              "site), athlete's foot or any other primary fungal infection: those are treated with "
              "miconazole under the first arm of this document, or referred."),
             ("insert_after_contains", "Known hypersensitivity to corticosteroids, nystatin, oxytetracycline, or any excipients", [
                 "- Primary fungal infection of the skin (tinea of any site, including ringworm and athlete's "
                 "foot), primary bacterial skin infection (impetigo, cellulitis), or viral skin infection "
                 "(herpes simplex, chickenpox, shingles, warts, molluscum). Trimovate is contraindicated in "
                 "all of these (SmPC 4.3).",
             ]),
         ]),
    # ------------------------------------------------------- herpes-management
    dict(slug="herpes-management", src=H("HERPES MANAGEMENT FINAL V.docx"), version="v002",
         supersedes=V1_NOV25, remove="herpes-management.pdf",
         changes=[VALIDITY + " The two arms previously carried different validity periods."],
         edits=[]),
    # ----------------------------------------------------------------- hayfever
    dict(slug="hayfever", src=H("ALLERGIC RHINITIS FINAL V.docx"), version="v002",
         supersedes=V1_JUN25, remove="hayfever.pdf",
         changes=[VALIDITY + " The previous version carried three different dates for one version "
                  "(issued 25 June 2025, signed 25 August 2025, valid from 25 August 2026) and empty "
                  "validity cells."],
         edits=[]),
    # -------------------------------------------------------- altitude-sickness
    dict(slug="altitude-sickness", src=H("ALTITUDE SICKNESS FINAL V.docx"), version="v002",
         supersedes=V1_JUN25, remove="altitude-sickness.pdf",
         changes=[
             VALIDITY,
             "Off-label use declared: acetazolamide is not licensed for acute mountain sickness. The "
             "indication now says so, names the supporting guidance, and requires the patient to be told.",
             "Exclusion criteria: SmPC contraindications added (adrenal insufficiency, hyperchloraemic "
             "acidosis, hepatic cirrhosis, previous pulmonary oedema on acetazolamide) and the undefined "
             "'other interacting medications' replaced by the SmPC list (lithium, phenytoin, high-dose "
             "aspirin, potassium-depleting diuretics).",
             "Details of the medicine: the form and strength (250 mg scored tablets), the quantity and the "
             "maximum treatment period were absent, which Schedule 16 requires. The prevention dose of 125 "
             "mg is now stated to be half a tablet.",
             "Follow-up advice: the previous text was a skin-infection template ('do not improve in 3 to 4 "
             "weeks'). Replaced with the altitude advice from the document's own guidance summary: do not "
             "ascend while symptomatic, descend for symptoms not improving in 24 hours or for any sign of "
             "HACE or HAPE, acetazolamide is not a substitute for descent.",
         ],
         edits=[
             ("replace_contains", "Acetazolamide is indicated for the prevention and treatment of acute mountain sickness (AMS) in adults",
              "Acetazolamide is indicated for the prevention and treatment of acute mountain sickness (AMS) "
              "in adults travelling to altitudes above 2,500 metres. For prevention, treatment is started "
              "before ascent. For treatment, it is started at symptom onset. Use for AMS is OUTSIDE the "
              "marketing authorisation (the SmPC indications are glaucoma, fluid retention and epilepsy); "
              "it is supported by the BNF and Wilderness Medical Society guidance and is supplied off-label "
              "under this PGD. Tell the patient this as part of consent and record that you did."),
             ("replace_contains", "Known hypersensitivity to acetazolamide or sulfonamides.",
              "- Known hypersensitivity to acetazolamide or sulfonamides.\n"
              "- Severe renal or hepatic impairment, or hepatic cirrhosis.\n"
              "- Adrenal insufficiency (Addison's disease).\n"
              "- Hyperchloraemic (metabolic) acidosis, hypokalaemia or hyponatraemia, or a history of "
              "electrolyte imbalance.\n"
              "- Previous non-cardiogenic pulmonary oedema after acetazolamide.\n"
              "- Pregnancy or breastfeeding.\n"
              "- Taking lithium, phenytoin, high-dose aspirin or a potassium-depleting diuretic. Refer."),
             ("replace", "Acetazolamide", "Acetazolamide 250 mg tablets (scored)", 2),
             ("replace_contains", "Prevention: 125 mg twice daily starting",
              "Prevention: 125 mg (half a 250 mg tablet) twice daily, starting 1 to 2 days before ascent "
              "and continuing for 2 days after reaching the highest altitude, or until descent begins. "
              "Treatment: 250 mg twice daily for up to 3 days. Acetazolamide is not a substitute for descent."),
             ("replace", "As required based on prevention or treatment protocol",
              "Prevention: half a tablet twice daily for (2 lead-in days + days ascending + 2 days), rounded "
              "up to whole tablets, maximum 28 tablets. Treatment: 6 tablets (250 mg twice daily for 3 days)."),
             ("replace", "Duration depends on altitude exposure and clinical need.",
              "Prevention: maximum 14 days per supply without review. Treatment: maximum 3 days."),
             ("replace_contains", "do not improve in 3–4 weeks",
              "Do not ascend further while symptomatic. Descend and seek help urgently for symptoms not "
              "improving within 24 hours, or for confusion, unsteadiness, severe headache, breathlessness "
              "at rest, cough with frothy sputum or reduced consciousness (possible HACE or HAPE). "
              "Acetazolamide is not a substitute for descent."),
         ]),
    # ------------------------------------------------- emergency-contraception
    dict(slug="emergency-contraception", src=H("EMERGENCY CONTRACEPTION FINAL V.docx"), version="v002",
         supersedes=V1_NOV25, remove="emergency-contraception.pdf",
         changes=[
             VALIDITY + " The ulipristal arm previously carried two expiry dates (31/7/27 and 31/10/26).",
             "Safeguarding: the inclusion criterion admitted girls from age 11 with no safeguarding "
             "provision. Under 13 now carries a mandatory safeguarding referral; 13 to 15 requires a "
             "recorded Fraser competence assessment and safeguarding questions.",
             "Enzyme inducers: the levonorgestrel caution told the pharmacist to consider switching to "
             "ulipristal, which the ellaOne SmPC says is not recommended after enzyme inducer use in the "
             "previous 4 weeks. Both arms now direct to a copper IUD or levonorgestrel 3 mg (licensed). "
             "Enzyme inducer use is an exclusion for ulipristal.",
             "Ulipristal: 'concurrent or recent use of hormonal contraceptives' was an exclusion while "
             "'contraceptive failure' was an inclusion, so every woman presenting after a pill failure was "
             "both included and excluded. Replaced with the FSRH position as a caution.",
             "Vomiting: both SmPCs require another tablet if vomiting occurs within 3 hours; the document "
             "said 2 hours in three places. Corrected.",
             "Weight-based 3 mg levonorgestrel is now labelled as off-label per FSRH, with ulipristal "
             "preferred at 70 kg or over or BMI 26 or over.",
         ],
         edits=[
             ("replace", "Females of reproductive age (typically 11-55 years)",
              "Females of reproductive age. Under 13: any sexual activity is a safeguarding concern; supply "
              "may still be appropriate but a safeguarding referral is MANDATORY. Aged 13 to 15: assess and "
              "record Fraser competence, ask about coercion, the age of the partner and any safeguarding "
              "concern, and follow the local safeguarding pathway. Record the assessment."),
             ("replace_contains", "efficacy may be reduced; consider double dose (3mg) or use ulipristal as alternative",
              "Enzyme-inducing drugs in the last 4 weeks (anticonvulsants, rifampicin, antiretrovirals, "
              "St John's Wort): offer a copper IUD; if declined give levonorgestrel 3 mg (two tablets, "
              "licensed). Do NOT switch to ulipristal, which is not recommended in these women."),
             ("replace", "Weight ≥70kg or BMI ≥26 - consider double dose (3mg) or ulipristal as alternative",
              "Weight 70 kg or over, or BMI 26 or over: ulipristal is preferred (FSRH) unless unsuitable; "
              "where levonorgestrel is used give 3 mg (double dose), which is off-label per FSRH guidance. "
              "Explain this and record it."),
             ("replace", "Double dose: 3mg may be considered if weight ≥70kg, BMI ≥26, or taking enzyme-inducing drugs",
              "Double dose: 3 mg where taking enzyme-inducing drugs (licensed), or where weight is 70 kg or "
              "over or BMI 26 or over (off-label, FSRH). Record the reason."),
             ("replace", "Nausea and vomiting (if vomiting occurs within 2 hours of taking the tablet, re-dosing should be considered)",
              "Nausea and vomiting (if vomiting occurs within 3 hours of taking the tablet, another tablet must be taken)"),
             ("replace", "If vomiting occurs within 2 hours of taking the tablet, contact your healthcare provider for advice as re-dosing may be needed.",
              "If vomiting occurs within 3 hours of taking the tablet, return immediately as another tablet is needed."),
             ("replace", "Concurrent or recent use of hormonal contraceptives (hormonal contraception must not be started until 5 days after taking ulipristal)",
              "Enzyme-inducing drugs in the last 4 weeks (anticonvulsants, rifampicin, antiretrovirals, "
              "St John's Wort): ulipristal is not recommended (SmPC). Offer a copper IUD or levonorgestrel 3 mg."),
             ("replace_contains", "efficacy may be reduced; consider copper IUD as alternative",
              "Progestogen-containing contraceptive taken in the previous 7 days: may reduce ulipristal "
              "efficacy; consider levonorgestrel instead. Hormonal contraception must not be restarted until "
              "5 days after ulipristal, with condoms until it is reliable again."),
         ]),
    # ------------------------------------------------------------------ dengue
    dict(slug="dengue", src=A("dengue-v002-SIGNED.docx"), version="v003", supersedes=V2_SEP9,
         remove="dengue-v002.pdf",
         changes=[
             VALIDITY,
             "Exclusion criteria: the previous version excluded severe immunocompromise only and permitted "
             "mild to moderate immunosuppression under a caution. The Qdenga SmPC (4.3) contraindicates any "
             "congenital or acquired immune deficiency, immunosuppressive therapy including systemic "
             "corticosteroids at 20 mg/day prednisolone or more for 2 weeks or more within the previous 4 "
             "weeks, and symptomatic HIV or asymptomatic HIV with impaired immune function. The exclusion "
             "now says that; the caution is gone.",
         ],
         edits=[
             ("replace", "Not severely immunocompromised", "No immune deficiency of any cause (see exclusion criteria)"),
             ("replace", "Severe immunocompromise (including HIV with CD4 count < 200, active malignancy, prolonged high-dose corticosteroids)",
              "Any congenital or acquired immune deficiency, including: immunosuppressive therapy such as "
              "chemotherapy, or systemic corticosteroids at 20 mg/day prednisolone (or 2 mg/kg/day) or more "
              "for 2 weeks or longer, within the previous 4 weeks; active malignancy; symptomatic HIV "
              "infection, or asymptomatic HIV infection with evidence of impaired immune function "
              "(SmPC 4.3)"),
             ("replace", "Use with caution in patients with mild to moderate immunosuppression",
              "Immune deficiency of any degree excludes (see exclusion criteria); there is no "
              "immunocompromised group in whom Qdenga is given under this PGD"),
             ("replace", "Live vaccine - not suitable for severely immunocompromised individuals",
              "Live vaccine: contraindicated in any immune deficiency"),
         ] + NARR_CLEAN),
    # -------------------------------------------------------------- chickenpox
    dict(slug="chickenpox", src=A("chickenpox-v002-SIGNED.docx"), version="v003", supersedes=V2_SEP9,
         remove="chickenpox-v002.pdf",
         changes=[
             VALIDITY + " No period of validity was stated in either arm.",
             "Exclusion criteria, both arms: 'Immunocompromised individuals unless under specialist advice' "
             "replaced by the SmPC contraindications: immunosuppression of any cause, blood dyscrasias, "
             "leukaemia, lymphoma or other malignancy of the blood or lymphatic system, and family history "
             "of congenital or hereditary immunodeficiency unless immune competence is demonstrated.",
             "Dose: both SmPCs and the Green Book require two doses. The previous text made the second dose "
             "optional. Now two 0.5 mL doses: Varivax at least 4 weeks apart (13 years and over: 4 to 8 "
             "weeks); Varilrix at least 6 weeks apart and never less than 4. Inclusion no longer excludes "
             "a patient attending for dose 2.",
             "Cautions: MMR and other live vaccines must be given on the same day or 4 weeks apart; blood "
             "products or immunoglobulin in the previous 3 months handled per the Green Book. 'Recently' "
             "was undefined.",
         ],
         edits=[
             ("replace_contains", "- No previous varicella vaccination.",
              "- Individuals aged 12 months and older.\n"
              "- No history of chickenpox infection.\n"
              "- Has not completed a two-dose varicella course. Dose 2 may be given under this PGD where "
              "dose 1 was given elsewhere; record the date and brand of dose 1.\n"
              "- Informed consent given.\n"
              "- Suitable for vaccination in accordance with national immunisation guidelines."),
             ("replace_contains", "- Immunocompromised individuals unless under specialist advice.",
              "- History of chickenpox infection.\n"
              "- Completed two-dose varicella course.\n"
              "- Hypersensitivity to neomycin, gelatin, or any component of the vaccine.\n"
              "- Immunosuppression of any cause, including immunosuppressive therapy or high-dose systemic "
              "corticosteroids; blood dyscrasias, leukaemia, lymphoma or other malignancy of the blood or "
              "lymphatic system; family history of congenital or hereditary immunodeficiency unless immune "
              "competence has been demonstrated. Refer.\n"
              "- Pregnancy or planning pregnancy within one month.\n"
              "- Acute febrile illness or active untreated tuberculosis.\n"
              "- MMR or another live vaccine within the previous 4 weeks, unless given on the same day."),
             ("replace_contains", "- Consider delaying vaccination if the individual received blood products recently.",
              "- Avoid contact with high-risk individuals (e.g. immunosuppressed) for 4 to 6 weeks if a rash "
              "develops post-vaccination.\n"
              "- Pregnancy must be avoided for one month post-vaccination.\n"
              "- Postpone in the case of moderate or severe illness with fever.\n"
              "- Give on the same day as MMR or other live vaccines, or 4 weeks apart.\n"
              "- Immunoglobulin or blood products in the previous 3 months may reduce the response: where "
              "protection is needed vaccinate now and consider a further dose after 3 months (Green Book); "
              "record the reason."),
             ("replace", "Single 0.5 mL dose. A second dose may be given after at least 4 weeks if needed.",
              "Two 0.5 mL doses. Varivax: second dose at least 4 weeks after the first (13 years and over: "
              "4 to 8 weeks)."),
             ("replace", "0.5 mL dose. A second dose may be administered at least 6 weeks after the first if required.",
              "Two 0.5 mL doses. Varilrix: second dose at least 6 weeks after the first, and never less than 4 weeks."),
             ("replace", "Single 0.5ml dose", "0.5 mL per dose; course of two doses"),
             ("replace", "0.5ml dose", "0.5 mL per dose; course of two doses"),
         ] + NARR_CLEAN),
    # --------------------------------------------------------------------- mmr
    dict(slug="mmr", src=A("mmr-v002-SIGNED.docx"), version="v003", supersedes=V2_SEP9,
         remove="mmr-v002.pdf",
         changes=[
             VALIDITY + " No period of validity was stated.",
             "Inclusion: the previous version covered only children eligible under the NHS childhood "
             "programme, contradicting its own guidance summary and excluding the adults, healthcare "
             "workers, students and travellers a pharmacy service sees. Now any individual from 12 months "
             "without two documented doses. NHS-eligible children must be told the vaccine is free from "
             "their GP before any private supply.",
             "Exclusion criteria, both arms: SmPC contraindications added: anaphylaxis to a previous MMR-"
             "containing vaccine, active untreated tuberculosis, blood dyscrasias, leukaemia, lymphoma or "
             "other malignancy of the haematopoietic or lymphatic system, family history of congenital or "
             "hereditary immunodeficiency unless immune competence demonstrated, and yellow fever or "
             "varicella vaccine in the previous 4 weeks.",
             "Dose: two doses of 0.5 mL at least 4 weeks apart (3 months where both are given under 18 "
             "months), doses before the first birthday not counted. The previous text gave no interval.",
             "Cautions: blood products or immunoglobulin in the previous 3 months handled per the SmPC and "
             "Green Book. Records: batch number, expiry, site, dose number and next dose date added.",
         ],
         edits=[
             ("replace_contains", "MMRVaxPRO is indicated for active immunisation against measles, mumps and rubella in children from 12 months of age",
              "MMRVaxPRO is indicated for active immunisation against measles, mumps and rubella in "
              "individuals from 12 months of age."),
             ("replace_contains", "Priorix is indicated for active immunisation against measles, mumps and rubella in children from 12 months of age",
              "Priorix is indicated for active immunisation against measles, mumps and rubella in "
              "individuals from 12 months of age."),
             ("replace_contains", "- Children aged 12 months and over who are eligible under the national childhood immunisation programme.",
              "- Individuals aged 12 months and over without two documented doses of MMR (catch-up, "
              "healthcare workers, students, travellers), or where protection is otherwise required.\n"
              "- Children eligible for the NHS childhood programme must be told they can be vaccinated free "
              "by their GP before any private supply; record that this was done.\n"
              "- Informed consent obtained, from a person with parental responsibility or from the young "
              "person where Gillick competent.\n"
              "- No contraindications to MMR vaccination."),
             ("replace_contains", "- Immunocompromised individuals or those receiving immunosuppressive therapy.",
              "- Known hypersensitivity to neomycin, gelatin, or any other component of the vaccine, or "
              "anaphylaxis to a previous measles, mumps or rubella containing vaccine.\n"
              "- Immunocompromised individuals or those receiving immunosuppressive therapy.\n"
              "- Blood dyscrasias, leukaemia, lymphoma or other malignant neoplasm of the haematopoietic or "
              "lymphatic system.\n"
              "- Family history of congenital or hereditary immunodeficiency, unless immune competence has "
              "been demonstrated.\n"
              "- Active untreated tuberculosis.\n"
              "- Pregnancy or planning pregnancy within one month.\n"
              "- Yellow fever or varicella vaccine within the previous 4 weeks: defer. Never give yellow "
              "fever vaccine and MMR on the same day.\n"
              "- Acute febrile illness (vaccination should be postponed)."),
             ("replace_contains", "- Defer vaccination if the child has received blood products or immunoglobulins recently.",
              "- Blood products or immunoglobulin in the previous 3 months: defer where possible; where "
              "protection is needed now, give and repeat after 3 months (Green Book). Record which applied.\n"
              "- Use caution in children with a history of thrombocytopenia or febrile seizures.\n"
              "- Observe the patient for 15 minutes post-vaccination.\n"
              "- Provide information on common side effects and when to seek further medical advice."),
             ("replace", "0.5 mL per dose according to the national immunisation schedule (typically 2 doses).",
              "Two doses of 0.5 mL, at least 4 weeks apart (at least 3 months apart where both doses are "
              "given under 18 months of age). Doses given before the first birthday do not count towards "
              "the course."),
             ("insert_after", "Records should be signed and dated. All records should be clear, legible and contemporaneous. Electronic records can be made.", [
                 "Record also the vaccine brand, batch number, expiry date, anatomical site, dose number "
                 "(1 or 2) and the date the next dose is due.",
             ]),
         ] + NARR_CLEAN),
    # ------------------------------------------------------------ pneumococcal
    dict(slug="pneumococcal", src=A("pneumococcal-v002-SIGNED.docx"), version="v003", supersedes=V2_SEP9,
         remove="pneumococcal-v002.pdf",
         changes=[
             VALIDITY + " No period of validity was stated.",
             "Pneumovax 23: exclusion added for PPV23 or PCV20 received within the last 5 years. The SmPC "
             "says revaccination within 3 years is not recommended and the Green Book restricts 5-yearly "
             "revaccination to asplenia, splenic dysfunction and chronic kidney disease. The vague "
             "'may be considered' line is replaced with that rule.",
             "Prevenar 13: hypersensitivity to diphtheria toxoid (the CRM197 carrier) added as an SmPC "
             "contraindication. Inclusion restricted to 2 years and over; infant primary immunisation is "
             "not given under this PGD and 'according to the national immunisation schedule' is replaced "
             "by a stated dose.",
             "The guidance summary has not yet been rewritten against the July 2026 Green Book chapter "
             "(Prevenar 20, infant dose at 16 weeks). That is recorded in the review register for the next "
             "version.",
         ],
         edits=[
             ("replace_contains", "- Known hypersensitivity to Pneumovax 23 or any of its components.",
              "- Known hypersensitivity to Pneumovax 23 or any of its components.\n"
              "- Previous severe allergic reaction to any pneumococcal vaccine.\n"
              "- PPV23 or PCV20 received within the last 5 years, unless the individual has asplenia, "
              "splenic dysfunction or chronic kidney disease and 5 years have elapsed. Revaccination is "
              "not recommended for any other group.\n"
              "- Acute illness with fever (postpone until recovered)."),
             ("replace", "Single 0.5 mL dose. Revaccination may be considered after 5 years in high-risk individuals.",
              "Single 0.5 mL dose. Revaccination every 5 years ONLY for asplenia, splenic dysfunction or "
              "chronic kidney disease (Green Book chapter 25); not recommended for any other group, and "
              "never within 3 years of a previous dose."),
             ("replace_contains", "- Individuals eligible for pneumococcal vaccination under national childhood or adult immunisation programmes.",
              "- Individuals aged 2 years and over who are eligible for pneumococcal vaccination under "
              "national guidance and in whom a conjugate vaccine is indicated.\n"
              "- Infant primary immunisation (under 2 years) is NOT given under this PGD.\n"
              "- Informed consent obtained from the individual or guardian.\n"
              "- No contraindications to Prevenar 13."),
             ("replace_contains", "- Severe allergic reaction to a previous pneumococcal conjugate vaccine.",
              "- Known hypersensitivity to the active substance or any component of the vaccine, "
              "including hypersensitivity to diphtheria toxoid (CRM197 carrier protein).\n"
              "- Severe allergic reaction to a previous pneumococcal conjugate vaccine.\n"
              "- Aged under 2 years.\n"
              "- Acute febrile illness (postpone vaccination until recovery)."),
             ("replace", "0.5 mL per dose according to the national immunisation schedule.",
              "Single 0.5 mL dose for individuals aged 2 years and over who have not previously received a "
              "pneumococcal conjugate vaccine. Where PPV23 is also indicated, give it at least 8 weeks after "
              "the conjugate vaccine."),
         ] + NARR_CLEAN),
    # ------------------------------------------------------ hep-b-occupational
    dict(slug="hep-b-occupational", src=A("hep-b-occupational-v002-SIGNED.docx"), version="v003",
         supersedes=V2_SEP9, remove="hep-b-occupational-v002.pdf",
         changes=[
             VALIDITY + " No period of validity was stated.",
             "Inclusion, both arms: 'individuals of any age' with only the adult dose authorised meant a "
             "child received double the licensed dose or no valid dose. Restricted to 16 years and over; "
             "under 16 refers.",
             "HBVAXPRO: the dose row named a 20 microgram strength that does not exist and a 0.5 mL volume "
             "that belongs to the paediatric product. Now HBVAXPRO 10 micrograms/1 mL for 16 years and "
             "over; dialysis patients (40 microgram product) refer.",
             "Records: brand, batch number, expiry, dose number, site and next dose date added, as the "
             "document's own summary and both SmPCs require.",
         ],
         edits=[
             ("replace_contains", "- Individuals of any age who are at increased risk of hepatitis B infection.",
              "- Individuals aged 16 years and over at increased risk of hepatitis B infection "
              "(occupational, travel or lifestyle risk). Children under 16 are not vaccinated under this "
              "PGD; refer.\n"
              "- Eligible under national immunisation or occupational health guidance.\n"
              "- Informed consent obtained.\n"
              "- No contraindications to the vaccine."),
             ("replace_contains", "- Previous allergic reaction to any hepatitis B vaccine.",
              "- Known hypersensitivity to the active substance or any excipients.\n"
              "- Previous allergic reaction to any hepatitis B vaccine.\n"
              "- Aged under 16 years.\n"
              "- Acute severe febrile illness (postpone until recovered)."),
             ("replace_contains", "Adults and adolescents (16+): 10 or 20 micrograms per dose depending on age and risk group.",
              "HBVAXPRO 10 micrograms/1 mL: one dose per injection, individuals 16 years and over.\n"
              "Standard schedule: 0, 1, and 6 months.\n"
              "Accelerated schedule: 0, 1, 2, and 12 months.\n"
              "Pre-dialysis and dialysis patients (40 microgram presentation) are not covered by this PGD; refer."),
             ("replace", "0.5 or 1 mL per dose depending on age and indication.", "1 mL (10 micrograms) per dose."),
             ("insert_after", "Records should be signed and dated. All records should be clear, legible and contemporaneous. Electronic records can be made.", [
                 "Record also the vaccine brand, batch number, expiry date, dose number, anatomical site and "
                 "the date the next dose is due.",
             ]),
         ] + NARR_CLEAN),
    # --------------------------------------------------------------------- rsv
    dict(slug="rsv", src=A("rsv-v002-SIGNED.docx"), version="v003", supersedes=V2_SEP9,
         remove="rsv-v002.pdf",
         changes=[
             VALIDITY + " The expiry cells read 31 October 2026.",
             "Abrysvo arm: the adrenaline, anaphylaxis-recognition and resuscitation-training requirement "
             "that the Arexvy arm carries was absent from the Abrysvo arm. Added.",
         ],
         edits=[
             ("insert_after_contains", "- Observe for 15 minutes post-vaccination.", [
                 "- Adrenaline injection 1mg/ml (1:1000) must always be available whenever vaccines are "
                 "given. Immediate treatment for anaphylaxis should include early administration of "
                 "intramuscular adrenaline and a call to the emergency services. The healthcare "
                 "professional delivering the service must be trained to recognise an anaphylactic "
                 "reaction and be familiar with techniques for resuscitation of a patient with anaphylaxis.",
                 "- Fainting can occur following, or even before, any vaccination especially in "
                 "adolescents. It is important that procedures are in place to avoid injury from faints.",
             ]),
         ] + NARR_CLEAN),
    # -------------------------------------------------------------- travel-core
    dict(slug="travel-core", src=A("travel-core-v002-SIGNED.docx"), version="v003", supersedes=V2_SEP9,
         remove="travel-core-v002.pdf",
         changes=[
             VALIDITY + " The document would otherwise have expired on 31 October 2026.",
             "Hepatitis A: Havrix Monodose is 1440 EL.U in a 1.0 mL dose; the document said 0.5 mL in "
             "three places, which is half a dose. Corrected to Havrix 1.0 mL, Avaxim 0.5 mL.",
             "Hepatitis A and typhoid: thrombocytopenia was both an exclusion and a caution. Neither SmPC "
             "contraindicates it. Removed from exclusions; the caution now states the technique.",
             "Cholera (Dukoral): a dose is a 3 mL vial, not 1.5 mL; gentamicin is not an excipient; the "
             "administration instruction now follows SmPC 4.2 and 6.6 (buffer in 150 mL water, whole vial, "
             "drink within 2 hours, nothing by mouth for 1 hour either side, complete 1 week before exposure).",
         ],
         edits=[
             ("delete", "Thrombocytopenia or coagulation disorders (risk of bleeding from intramuscular injection)"),
             ("delete", "Thrombocytopenia or coagulation disorders"),
             ("replace", "Caution in patients with thrombocytopenia (small needle preferred)",
              "Thrombocytopenia, a bleeding disorder or anticoagulation: not a contraindication. Use a fine "
              "needle and apply firm pressure for 2 minutes; Havrix may be given deep subcutaneous where "
              "local guidance requires."),
             ("replace", "Caution in patients with thrombocytopenia",
              "Thrombocytopenia, a bleeding disorder or anticoagulation: not a contraindication. Use a fine "
              "needle and apply firm pressure for 2 minutes."),
             ("replace", "Havrix 1440 or Avaxim 160 - Inactivated Hepatitis A vaccine injection (1440 ELISA Units/0.5 mL or 160 antigen units/0.5 mL)",
              "Havrix Monodose 1440 EL.U/1.0 mL, or Avaxim 160 U/0.5 mL: inactivated hepatitis A vaccine injection"),
             ("replace", "Primary course: 0.5 mL single dose",
              "Primary course: one dose. Havrix: 1.0 mL. Avaxim: 0.5 mL.", 1),
             ("replace", "1 × 0.5 mL dose per visit",
              "One dose per visit (1.0 mL Havrix, or 0.5 mL Avaxim)", 1),
             ("replace", "Known hypersensitivity to vaccine or any excipients (including formaldehyde, gentamicin)",
              "Known hypersensitivity to the vaccine or any excipient (including formaldehyde)"),
             ("replace", "Oral administration. Mix vaccine suspension with buffer solution; take on empty stomach.",
              "Oral. Dissolve the buffer sachet in about 150 mL of cool water, add the whole 3 mL vial of "
              "vaccine suspension, and drink within 2 hours. No food or drink for 1 hour before and 1 hour "
              "after; no other oral medicines within 1 hour either side. Complete the course at least 1 "
              "week before potential exposure."),
             ("replace", "2 × doses for primary course (each course: 1 × 1.5 mL dose mixed with buffer)",
              "2 doses for the primary course (each dose: one 3 mL vial mixed with buffer)"),
         ] + NARR_CLEAN),
    # ------------------------------------------------------- anxiety-propranolol
    dict(slug="anxiety-propranolol", src=A("anxiety-propranolol-v002-SIGNED.docx"), version="v003",
         supersedes=V2_SEP9, remove="anxiety-propranolol-v002.pdf",
         changes=[
             VALIDITY + " The expiry cell read 31 October 2026.",
             "Exclusion criteria: the SmPC contraindicates propranolol in severe peripheral arterial "
             "disease, after prolonged fasting and in patients prone to hypoglycaemia; the previous "
             "version had these as cautions. Now exclusions. Pregnancy and breastfeeding, which the "
             "document did not mention, are exclusions with referral.",
         ],
         edits=[
             ("insert_after", "Already taking another beta-blocker.", [
                 "Severe peripheral arterial disease (rest pain, ulceration or critical ischaemia).",
                 "Prolonged fasting, or any other risk of hypoglycaemia, including insulin-treated diabetes "
                 "with hypoglycaemia unawareness.",
                 "Pregnancy, or planning pregnancy. Refer.",
                 "Breastfeeding. Refer to GP.",
             ]),
             ("replace", "Peripheral vascular disease",
              "Mild peripheral vascular disease (severe peripheral arterial disease excludes)"),
         ]),
    # ------------------------------------------------------------ asthma-rescue
    dict(slug="asthma-rescue", src=A("asthma-rescue-v002-SIGNED.docx"), version="v003",
         supersedes=V2_SEP9, remove="asthma-rescue-v002.pdf",
         changes=[
             VALIDITY + " The expiry cells read 31 October 2026.",
             "Exclusion criteria, both arms: the previous version excluded a severe attack only where SpO2 "
             "was below 92%, which is the life-threatening threshold. The BTS/SIGN acute severe criteria "
             "(cannot complete sentences, RR 25 or more, HR 110 or more, PEF 33 to 50%) now exclude, and "
             "pulse oximetry, respiratory rate and pulse must be measured and recorded before any supply.",
         ],
         edits=[
             ("replace", "Severe exacerbation with hypoxia (SpO2 <92%) - refer for emergency assessment",
              "Acute severe or life-threatening asthma: any of unable to complete sentences in one breath, "
              "respiratory rate 25/min or more, heart rate 110/min or more, PEF 33 to 50% of best or "
              "predicted, SpO2 below 92%, silent chest, cyanosis, exhaustion, confusion or poor respiratory "
              "effort. Refer for emergency assessment (999 where life-threatening). Do not supply."),
             ("replace", "Silent chest, exhaustion, confusion - refer for emergency assessment",
              "Pulse oximetry, respiratory rate and pulse must be measured and recorded before any supply; "
              "where a peak flow meter is available, record PEF. If any observation is missing, do not supply."),
             ("replace", "Severe exacerbation with hypoxia (SpO2 below 92%). Refer for emergency assessment. Do not supply.",
              "Acute severe or life-threatening asthma: any of unable to complete sentences in one breath, "
              "respiratory rate 25/min or more, heart rate 110/min or more, PEF 33 to 50% of best or "
              "predicted, SpO2 below 92%, silent chest, cyanosis, exhaustion, confusion or poor respiratory "
              "effort. Refer for emergency assessment (999 where life-threatening). Do not supply."),
             ("replace", "Silent chest, exhaustion or confusion. Refer for emergency assessment. Do not supply.",
              "Pulse oximetry, respiratory rate and pulse must be measured and recorded before any supply; "
              "where a peak flow meter is available, record PEF. If any observation is missing, do not supply."),
         ]),
    # ------------------------------------------------------------- yellow-fever
    dict(slug="yellow-fever", src=A("yellow-fever-v002-SIGNED.docx"), version="v003", supersedes=V2_SEP9,
         remove="yellow-fever-v002.pdf",
         changes=[
             VALIDITY + " No period of validity was stated.",
             "Pharmacy technicians removed from the professionals covered: the NaTHNaC conditions of "
             "designation restrict administration to registered doctors, nurses and pharmacists, as the "
             "document's own guidance summary states.",
             "Egg allergy: the Stamaril SmPC contraindicates any hypersensitivity to egg or chicken protein, "
             "not only anaphylaxis. The exclusion now says so and directs to a specialist clinic.",
             "Aged 60 or over travelling only to areas where vaccination is not recommended: moved from a "
             "caution to an exclusion, as the Green Book lists it as a contraindication.",
             "Last-minute travellers: the 10-day rule was written as an inclusion criterion, which barred "
             "them. The Green Book says vaccinate and counsel. Reworded.",
             "MMR: the Green Book requires yellow fever and MMR to be given 28 days apart and never on the "
             "same day; the previous text said the opposite. Other vaccines may be given at any interval.",
             "Reinforcing doses: all five Green Book groups now listed (first dose under 2 years, in "
             "pregnancy, with HIV, when immunosuppressed, before bone marrow transplant).",
             "Women of childbearing potential: avoid pregnancy for one month after vaccination (SmPC 4.6). Added.",
         ],
         edits=[
             ("delete", "Pharmacy technician registered and practicing with the GPhC"),
             ("insert_after", "Pharmacist registered and practicing with the GPhC", [
                 "Pharmacists only. Pharmacy technicians may not administer yellow fever vaccine under the "
                 "NaTHNaC conditions of designation.",
             ]),
             ("replace", "Pharmacists and Pharmacy Technicians must have completed training relevant to this condition to use this PGD. This training will be documented and overseen by the Get Real Health team.",
              "Pharmacists must have completed training relevant to this condition, and the NaTHNaC yellow "
              "fever training required for the designated centre, to use this PGD. This training will be "
              "documented and overseen by the Get Real Health team."),
             ("replace_contains", "so vaccination must be at least 10 days before travel where a certificate is required",
              "The International Certificate of Vaccination or Prophylaxis (ICVP) becomes valid 10 days after "
              "a first dose. A traveller vaccinated less than 10 days before departure may be refused entry "
              "or quarantined where a certificate is required, and must be told so; the vaccine itself "
              "protects from about day 10 regardless."),
             ("replace", "Vaccination at least 10 days before travel where a certificate is required, so the certificate is valid in time.",
              "Travelling at any interval before departure. Where a certificate is required and will not be "
              "valid in time (it becomes valid 10 days after vaccination), explain that the destination may "
              "refuse entry or quarantine, reinforce bite avoidance, and vaccinate if the traveller wishes. "
              "Record the advice."),
             ("replace_contains", "Confirmed anaphylactic reaction to any component of the vaccine, or to egg.",
              "Any immediate-type (IgE-mediated) allergy to egg or chicken protein, or to any component of "
              "the vaccine, that has not been shown to be outgrown. Refer to an allergy specialist or "
              "hospital-based clinic; do not vaccinate under this PGD."),
             ("insert_after", "Acute severe febrile illness. Postpone until recovered, allowing 10 days before travel for the certificate to become valid.", [
                 "Aged 60 years or over and travelling only to areas where WHO designates yellow fever "
                 "vaccination as generally not recommended or not recommended (Green Book chapter 35 "
                 "contraindication).",
             ]),
             ("replace_contains", "Aged 60 years and over: the risk of YEL-AND and YEL-AVD rises with age",
              "Aged 60 years and over: the risk of YEL-AND and YEL-AVD rises with age, and almost all cases "
              "occur with a first dose. Vaccinate only where there is significant and unavoidable risk "
              "after a detailed risk assessment. Travel only to areas where vaccination is not recommended "
              "is an exclusion (above)."),
             ("insert_after_contains", "Pregnancy: advise against travel to a yellow fever risk area.", [
                 "Women of childbearing potential: advise avoiding pregnancy for one month after "
                 "vaccination (Stamaril SmPC 4.6). Record that this advice was given.",
             ]),
             ("replace_contains", "so routine revaccination is not required.",
              "A single 0.5 ml dose. The certificate becomes valid 10 days after a first dose and then "
              "lasts for the life of the person vaccinated, so routine revaccination is not required. A "
              "reinforcing dose may be given under this PGD, where there is no current contraindication, to "
              "a person whose first dose was given when aged under 2 years, during pregnancy, while infected "
              "with HIV, while immunosuppressed, or before a bone marrow transplant (Green Book chapter 35). "
              "A booster may be considered after 10 years for prolonged high-risk exposure. Record which "
              "applied."),
             ("replace_contains", "May be given at the same time as inactivated vaccines at a separate site.",
              "Do not give on the same day as MMR; separate yellow fever and MMR by 28 days unless "
              "protection is needed rapidly, in which case give at any interval and consider an additional "
              "MMR dose. Other live and inactivated vaccines may be given at any interval, at separate "
              "sites. The immune response may be reduced in individuals on immune modulating therapy."),
         ]),
    # --------------------------------------------------------- shingles-vaccine
    dict(slug="shingles-vaccine", src=A("shingles-vaccine-v002-SIGNED.docx"), version="v003",
         supersedes=V2_SEP9, remove="shingles-vaccine-v002.pdf",
         changes=[
             VALIDITY + " No PGD-level period of validity was stated.",
             "Inclusion: 'no previous shingles vaccination' excluded every patient attending for dose 2 of "
             "the two-dose course the PGD authorises, and any Zostavax recipient who now needs Shingrix. "
             "Reworded.",
         ],
         edits=[
             ("replace_contains", "- No previous shingles vaccination.",
              "- Individuals aged 50 years or older.\n"
              "- Has not completed a two-dose course of Shingrix. Dose 2 may be given under this PGD where "
              "dose 1 was given elsewhere; record the date of dose 1. Previous Zostavax is not an exclusion.\n"
              "- No history of shingles in the past 12 months.\n"
              "- Informed consent obtained.\n"
              "- Patient is eligible under national immunisation guidelines."),
         ] + NARR_CLEAN),
    # ---------------------------------------------------------------- mounjaro
    dict(slug="mounjaro", src=A("mounjaro-v004-SIGNED.docx"), version="v005",
         supersedes="Version 004, 10 September 2026", remove="mounjaro-v004.pdf",
         changes=[
             VALIDITY + " No period of validity was stated in any version block.",
             "Quantity: the document said one pen holds one weekly dose and to supply 4 pens a month. The "
             "only Mounjaro presentation on the UK market is the KwikPen holding four 0.6 mL doses, as the "
             "guidance summary states, so 4 pens was four months' supply. Now one KwikPen (4 doses) per "
             "4-week period.",
         ],
         edits=[
             ("replace_contains", "Mounjaro (tirzepatide) solution for injection in pre-filled pen (KwikPen or single-dose pen depending on the product supplied).",
              "Mounjaro (tirzepatide) solution for injection in a multi-dose pre-filled pen (KwikPen). "
              "Available strengths: 2.5 mg, 5 mg, 7.5 mg, 10 mg, 12.5 mg and 15 mg per 0.6 mL dose; each "
              "pen contains 4 doses (2.4 mL)."),
             ("replace", "One pre-filled pen contains one weekly dose at the prescribed strength.",
              "One KwikPen contains four weekly doses (4 x 0.6 mL) at the prescribed strength."),
             ("replace", "Supply 4 pens (one month of treatment) per patient appointment.",
              "Supply ONE pen (4 weeks of treatment) per patient appointment."),
         ]),
    # -------------------------------------------------------- dates-only reissues
    dict(slug="wegovy", src=A("wegovy-v004-SIGNED.docx"), version="v005",
         supersedes="Version 004, 10 September 2026", remove="wegovy-v004.pdf",
         changes=[VALIDITY + " No period of validity was stated."], edits=[]),
    dict(slug="foundayo", src=A("foundayo-v004-SIGNED.docx"), version="v005",
         supersedes="Version 004, 10 September 2026", remove="foundayo-v004.pdf",
         changes=[VALIDITY + " No period of validity was stated."], edits=[]),
    dict(slug="b12-folate", src=A("b12-folate-v005-SIGNED.docx"), version="v006",
         supersedes="Version 005, 10 September 2026", remove="b12-folate-v005.pdf",
         changes=[VALIDITY + " No expiry or review date was stated."], edits=[]),
    dict(slug="japanese-encephalitis", src=A("japanese-encephalitis-v003-SIGNED.docx"), version="v004",
         supersedes="Version 003, 10 September 2026", remove="japanese-encephalitis-v003.pdf",
         changes=[VALIDITY + " No period of validity was stated."], edits=NARR_CLEAN),
    dict(slug="junior-travel", src=A("junior-travel-v003-SIGNED.docx"), version="v004",
         supersedes="Version 003, 9 September 2026", remove="junior-travel-v003.pdf",
         changes=[VALIDITY + " No period of validity was stated."], edits=NARR_CLEAN),
    dict(slug="hep-ab-travel", src=A("hep-ab-travel-v004-SIGNED.docx"), version="v005",
         supersedes="Version 004, 10 September 2026", remove="hep-ab-travel-v004.pdf",
         changes=[VALIDITY + " No expiry date was stated in any version."], edits=NARR_CLEAN),
    dict(slug="shingles-treatment", src=A("shingles-treatment-v002-SIGNED.docx"), version="v003",
         supersedes="Version 002, 10 September 2026", remove="shingles-treatment-v002.pdf",
         changes=[VALIDITY + " No period of validity was stated."], edits=[]),
    # ----------------------------------------------------------------- saxenda
    dict(slug="saxenda", src=H("SAXENDA FINAL V.docx"), version="v002", supersedes=V1_NOV25,
         remove="saxenda.pdf",
         changes=[
             VALIDITY,
             "Exclusion criteria: the Saxenda SmPC states use is not recommended at 75 years and over, in "
             "inflammatory bowel disease and diabetic gastroparesis, with other weight-management medicines, "
             "in secondary obesity, and that liraglutide must not be restarted after pancreatitis; type 1 "
             "and insulin-treated diabetes cannot be managed in a pharmacy service. The previous version "
             "had these as cautions or did not mention them. All now exclusions.",
         ],
         edits=[
             ("insert_after", "Concurrent use of other GLP-1 receptor agonists", [
                 "Any other weight-management medicine, current: tirzepatide, semaglutide, orlistat or naltrexone/bupropion",
                 "Current or previous eating disorder",
                 "Obesity secondary to an endocrine disorder, or to a medicine that causes weight gain",
                 "Aged 75 years or over (use not recommended, SmPC)",
                 "Type 1 diabetes, or insulin-treated diabetes. Refer.",
                 "Any history of pancreatitis while taking a GLP-1 receptor agonist",
                 "Inflammatory bowel disease, or diabetic gastroparesis (use not recommended, SmPC)",
             ]),
             ("delete", "Inflammatory bowel disease (may be exacerbated)"),
             ("replace", "Gastroparesis or other gastrointestinal disorders",
              "Other gastrointestinal disorders (diabetic gastroparesis and inflammatory bowel disease exclude)"),
             ("replace", "Concomitant medications that affect blood glucose control (insulin, sulfonylureas) - hypoglycaemia risk",
              "Sulfonylureas - hypoglycaemia risk; inform the prescriber (insulin-treated diabetes excludes)"),
         ]),
    # ------------------------------------------------------------------ thrush
    dict(slug="thrush", src=H("THRUSH FINAL V.docx"), version="v002", supersedes=V1_NOV25,
         remove="thrush.pdf",
         changes=[
             VALIDITY,
             "Fluconazole arm: quinidine and erythromycin added to the QT exclusion, as the SmPC contraindicates both.",
             "Both arms: the red flags in the guidance summary and the Canesten SmPC's own 'seek medical "
             "advice' list (first episode, recurrent infection, immunosuppression, abnormal bleeding, "
             "ulcers, abdominal pain or dysuria, fever, possible STI, under 16 or over 60) were not "
             "exclusions in either arm. Added to both.",
         ],
         edits=[
             ("replace", "Concurrent use of terfenadine, astemizole, cisapride, or pimozide (risk of QT prolongation and torsades de pointes)",
              "Concurrent use of terfenadine, astemizole, cisapride, pimozide, quinidine or erythromycin "
              "(risk of QT prolongation and torsades de pointes)"),
             ("insert_after", "Concurrent use of terfenadine, astemizole, cisapride, pimozide, quinidine or erythromycin (risk of QT prolongation and torsades de pointes)",
              [
                  "First episode of symptoms (needs a diagnosis; refer)",
                  "4 or more episodes in 12 months, or 2 in the last 6 months (recurrent candidiasis; refer)",
                  "Immunosuppression, or diabetes that is poorly controlled",
                  "Abnormal or blood-stained vaginal bleeding, vulval ulcers, sores or blisters",
                  "Lower abdominal pain, dysuria, fever or systemic upset, or foul-smelling discharge",
                  "Possible exposure to a sexually transmitted infection, or a partner with an STI",
                  "Aged under 16 or over 60",
              ]),
             ("insert_after", "Known hypersensitivity to clotrimazole or imidazoles", [
                 "First episode of symptoms (needs a diagnosis; refer)",
                 "4 or more episodes in 12 months, or 2 in the last 6 months (recurrent candidiasis; refer)",
                 "Immunosuppression, or diabetes that is poorly controlled",
                 "Abnormal or blood-stained vaginal bleeding, vulval ulcers, sores or blisters",
                 "Lower abdominal pain, dysuria, fever or systemic upset, or foul-smelling discharge",
                 "Possible exposure to a sexually transmitted infection, or a partner with an STI",
                 "Aged under 16 or over 60",
             ]),
         ]),
    # ---------------------------------------------------- smoking-varenicline
    dict(slug="smoking-varenicline", src=H("SMOKING CESSATION VARENICLINE FINAL V.docx"), version="v002",
         supersedes=V1_NOV25, remove="smoking-varenicline.pdf",
         changes=[
             VALIDITY,
             "Renal impairment: eGFR under 30 was both an exclusion and a caution carrying a dose the SmPC "
             "does not give. Now an exclusion only; eGFR 30 to 50 carries the SmPC advice (no adjustment; "
             "reduce to 1 mg once daily if not tolerated).",
         ],
         edits=[
             ("replace", "End-stage renal disease (eGFR <30 ml/min/1.73m²)",
              "Severe renal impairment (eGFR below 30 mL/min/1.73m2) or end-stage renal disease. Refer to GP."),
             ("replace", "Renal impairment: eGFR 30-50 ml/min/1.73m² - maximum dose 1mg twice daily; eGFR <30 - maximum dose 0.5mg twice daily",
              "Renal impairment, eGFR 30 to 50 mL/min/1.73m2: no dose adjustment; if adverse effects are "
              "not tolerated reduce to 1 mg once daily. eGFR below 30 excludes."),
         ]),
    # ----------------------------------------------------------- genital-warts
    dict(slug="genital-warts", src=H("GENITAL WARTS FINAL V.docx"), version="v002", supersedes=V1_NOV25,
         remove="genital-warts.pdf",
         changes=[
             VALIDITY,
             "Podophyllotoxin: the Warticon SmPC limits unsupervised application to an area of 4 cm2 and "
             "treatment to 4 weekly cycles. The previous version allowed 10 cm2 and up to 5 cycles, and "
             "quoted a 50-wart figure with no source. Corrected throughout.",
             "Imiquimod: the Aldara SmPC warns that the cream weakens condoms and diaphragms and must be "
             "washed off before sex. The follow-up advice told patients to rely on condoms. Corrected.",
         ],
         edits=[
             ("replace", "Small warts suitable for patient application (typically <50 warts or treatment area <10cm²)",
              "Small warts suitable for patient application: total treatment area up to and including "
              "4 cm2 (the SmPC limit for unsupervised use)"),
             ("replace", "Large treatment area (>10cm²) or >50 warts",
              "Treatment area more than 4 cm2 (needs healthcare professional supervision; refer)"),
             ("replace", "Do not exceed maximum: 50 warts per session or treatment area 10cm²",
              "Do not exceed a treatment area of 4 cm2 for unsupervised application"),
             ("replace", "Repeat cycle: continue for up to 4-5 cycles (4-5 weeks total treatment)",
              "Repeat cycle: continue for up to 4 cycles (4 weeks total treatment, the licensed maximum)"),
             ("replace", "For podophyllotoxin: apply twice daily for 3 consecutive days (e.g., Mon-Wed morning and evening), then rest for 4 days (Thu-Sun). Repeat for up to 4-5 cycles.",
              "For podophyllotoxin: apply twice daily for 3 consecutive days (e.g. Mon-Wed morning and "
              "evening), then rest for 4 days (Thu-Sun). Repeat for up to 4 cycles."),
             ("replace", "Use condoms consistently with partners, even if warts are treated, to reduce transmission risk.",
              "Avoid sexual contact while the treatment is on the skin. Use condoms consistently with "
              "partners at other times, even if warts are treated, to reduce transmission risk.", 1),
             ("replace", "Use condoms consistently with partners, even if warts are treated, to reduce transmission risk.",
              "Wash the cream off the skin before sexual activity. Imiquimod can weaken condoms and "
              "diaphragms, so they cannot be relied on while cream is on the skin; use condoms consistently "
              "at other times to reduce transmission.", 1),
         ]),
    # ---------------------------------------------------------------------- bv
    dict(slug="bv", src=H("BACTERIAL VAGINOSIS FINAL V.docx"), version="v002", supersedes=V1_NOV25,
         remove="bv.pdf",
         changes=[
             VALIDITY,
             "Gel arm: the Zidoval SmPC does not recommend use under 18 and says only that caution should be "
             "exercised in pregnancy; the previous version admitted 16 and 17 year olds without an "
             "off-label statement and called the gel 'safe' in pregnancy while the oral arm and the "
             "guidance summary treated pregnancy as a referral. The gel arm is now 18 to 65 and "
             "non-pregnant, matching the oral arm; 16 and 17 year olds use the oral arm.",
         ],
         edits=[
             ("replace", "Treatment of bacterial vaginosis in women aged 16-65 years",
              "Treatment of bacterial vaginosis in non-pregnant women aged 18-65 years"),
             ("replace", "Women aged 16-65 years",
              "Women aged 18-65 years (Zidoval is not recommended under 18 by its SmPC; 16 and 17 year olds "
              "are treated under the oral arm)", 2),
             ("insert_after", "Known hypersensitivity to metronidazole or nitroimidazoles", [
                 "Pregnancy, known or suspected. Refer to GP or midwife.",
             ], 2),
             ("replace", "Pregnancy (safe to use; however, confirm diagnosis and consider referral to GP)",
              "Pregnancy is an exclusion (above). Refer to GP or midwife."),
         ]),
    # ---------------------------------------------------------------------- ed
    dict(slug="ed", src=A("ed-v004-SIGNED.docx"), version="v005",
         supersedes="Version 004, 10 September 2026", remove="ed-v004.pdf",
         changes=[
             VALIDITY,
             "Exclusion criteria, both arms: heart failure NYHA class 2 or greater in the last 6 months "
             "(Cialis SmPC 4.3), hypertrophic cardiomyopathy, significant aortic stenosis or other moderate "
             "to severe valve disease, and a murmur of unknown cause (BSSM high-risk group, sildenafil SmPC "
             "4.4) added. The previous text excluded 'severe heart failure' only.",
             "Sildenafil: ritonavir and cobicistat are exclusions. The SmPC caps sildenafil at 25 mg in 48 "
             "hours with ritonavir; the previous version allowed titration to 100 mg.",
             "Tadalafil: doxazosin is an exclusion (SmPC: combination not recommended); severe renal "
             "impairment now caps on-demand dosing at 10 mg as well as excluding once-daily dosing.",
         ],
         edits=[
             ("replace", "Unstable angina, angina occurring during sexual activity, severe heart failure, or uncontrolled arrhythmia.",
              "Unstable angina, angina during sexual activity, heart failure of NYHA class 2 or greater in "
              "the last 6 months, uncontrolled arrhythmia, hypertrophic cardiomyopathy, significant aortic "
              "stenosis or other moderate to severe valve disease, or a murmur of unknown cause."),
             ("insert_after", "Known hereditary degenerative retinal disorder, for example retinitis pigmentosa.",
              ["Taking ritonavir or cobicistat. Refer (the sildenafil dose must not exceed 25mg in 48 hours "
               "and cannot be titrated under this PGD)."], 1),
             ("insert_after", "Known hereditary degenerative retinal disorder, for example retinitis pigmentosa.",
              ["Taking doxazosin. The combination with tadalafil is not recommended in the SmPC; use the "
               "sildenafil arm or refer."], 2),
             ("replace", "CYP3A4 inhibitors, for example erythromycin, clarithromycin, ketoconazole, itraconazole or ritonavir. Start at 25mg.",
              "CYP3A4 inhibitors, for example erythromycin, clarithromycin, ketoconazole or itraconazole. "
              "Start at 25mg. Ritonavir and cobicistat exclude."),
             ("replace", "Severe renal impairment, creatinine clearance below 30 mL/min, for once-daily dosing.",
              "Severe renal impairment, creatinine clearance below 30 mL/min: once-daily dosing is "
              "excluded, and on-demand dosing must not exceed 10mg."),
         ]),
    # ---------------------------------------------------------------- impetigo
    dict(slug="impetigo", src=A("impetigo-v005-SIGNED.docx"), version="v006",
         supersedes="Version 005, 10 September 2026", remove="impetigo-v005.pdf",
         changes=[
             VALIDITY,
             "Clarithromycin arm: oral midazolam, lomitapide, ivabradine, ranolazine, domperidone and "
             "pimozide added by name as SmPC 4.3 contraindications (none is QT-prolonging in a way the "
             "catch-all caught), and hypomagnesaemia added alongside hypokalaemia.",
         ],
         edits=[
             ("insert_after", "Taking TICAGRELOR.", [
                 "Taking ORAL MIDAZOLAM, LOMITAPIDE, IVABRADINE, RANOLAZINE, DOMPERIDONE or PIMOZIDE "
                 "(clarithromycin SmPC contraindications).",
             ]),
             ("replace", "Taking any other medicine known to prolong the QT interval, or with hypokalaemia.",
              "Taking any other medicine known to prolong the QT interval, or with hypokalaemia or hypomagnesaemia."),
         ]),
    # ----------------------------------------------------------------- tetanus
    dict(slug="tetanus", src=A("tetanus-v005-SIGNED.docx"), version="v006",
         supersedes="Version 005, 10 September 2026", remove="tetanus-v005.pdf",
         changes=[
             VALIDITY,
             "Exclusion added: neurological complications (including Guillain-Barre syndrome or brachial "
             "neuritis) following a previous diphtheria or tetanus containing vaccine, which the Revaxis "
             "SmPC contraindicates and the previous version did not mention.",
             "The 12-month exclusion now carves out the second and third doses of a primary course given "
             "under this PGD at the scheduled one-month interval. As written it excluded the course the "
             "PGD says it supports.",
             "Off-label statement restored: the Revaxis SmPC (4.4) still says the vaccine should not be "
             "given within 5 years of a previous diphtheria or tetanus toxoid containing vaccine. A dose "
             "between 12 months and 5 years is off-label and is given in accordance with the Green Book; "
             "this must be explained and recorded. Version narration removed from the cover and the "
             "off-label section.",
         ],
         edits=[
             ("replace_contains", "A DOSE WITHIN THE LAST 12 MONTHS EXCLUDES. Version 002 handled",
              "A DOSE WITHIN THE LAST 12 MONTHS EXCLUDES, except the second or third dose of a primary "
              "course being given under this PGD at the scheduled one-month interval."),
             ("replace", "No tetanus, diphtheria or polio containing vaccine received in the last 12 months.",
              "No tetanus, diphtheria or polio containing vaccine received in the last 12 months, unless "
              "the dose being given is the second or third dose of a primary course under this PGD at the "
              "scheduled one-month interval."),
             ("replace", "A tetanus, diphtheria or polio containing vaccine received within the last 12 months. Refer to establish what was given and when.",
              "A tetanus, diphtheria or polio containing vaccine received within the last 12 months, EXCEPT "
              "where the dose is the second or third dose of a primary course being given under this PGD "
              "at the scheduled one-month interval. Otherwise refer to establish what was given and when."),
             ("replace", "In every case: no dose if a tetanus, diphtheria or polio containing vaccine has been given in the last 12 months.",
              "In every case: no dose if a tetanus, diphtheria or polio containing vaccine has been given in "
              "the last 12 months, other than the scheduled second and third doses of a primary course "
              "under this PGD."),
             ("insert_after", "Current neurological deterioration. Defer and seek advice so that any change is not incorrectly attributed to the vaccine.", [
                 "Neurological complications, including Guillain-Barre syndrome or brachial neuritis, "
                 "following a previous diphtheria or tetanus containing vaccine. Refer.",
             ]),
             ("replace_contains", "Version 002 also treated administration within 5 years",
              "Administration within 5 years of a previous diphtheria or tetanus toxoid containing vaccine "
              "is outside the SmPC (section 4.4) and is given in accordance with the Green Book. Explain "
              "this as part of consent and record it. A dose within the last 12 months excludes outright."),
         ]),
    # ---------------------------------------------------------- anti-malarials
    dict(slug="anti-malarials", src=A("antimalarials-v005-SIGNED.docx"), version="v006",
         supersedes="Version 005, 10 September 2026", remove="anti-malarials-v005.pdf",
         changes=[
             VALIDITY,
             "Atovaquone/proguanil arm: antiretroviral therapy (efavirenz, other NNRTIs, boosted protease "
             "inhibitors) and pyrimethamine added to the exclusions. The SmPC says these should be avoided "
             "and the guidance summary named them; the exclusion did not.",
             "Mefloquine arm: bupropion and other seizure-threshold-lowering medicines, halofantrine, "
             "ketoconazole and a history of Blackwater fever added as exclusions (SmPC 4.3 and 4.4); "
             "quinidine added to the hypersensitivity exclusion.",
             "The weight bands (SmPC versus UKMEAG) are unchanged pending a decision and remain in the review register.",
         ],
         edits=[
             ("insert_after", "Taking rifampicin, rifabutin, metoclopramide or tetracycline, which reduce atovaquone concentrations. Refer.", [
                 "Taking antiretroviral therapy (efavirenz, other NNRTIs or boosted protease inhibitors), "
                 "or pyrimethamine. Refer.",
             ]),
             ("insert_after", "Epilepsy or any seizure disorder, or taking an anticonvulsant.", [
                 "Taking bupropion, or any other medicine that lowers the seizure threshold. Refer.",
                 "Taking, or planning to take, halofantrine or ketoconazole.",
                 "History of Blackwater fever.",
             ]),
             ("replace", "Known hypersensitivity to mefloquine or quinine.",
              "Known hypersensitivity to mefloquine, quinine or quinidine."),
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
