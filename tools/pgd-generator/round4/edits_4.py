#!/usr/bin/env python3
"""
Round 4, batch 4: document corrections (category A) and decisions (category B)
for saxenda, foundayo, mysimba, orlistat, b12-injection / folic-acid (one
document, b12-folate), anxiety-propranolol, sleep-melatonin,
smoking-varenicline, smoking-nrt, hayfever, fungal-infection, acne, rosacea,
eye-infections and alopecia-minoxidil / hair-loss (one document, alopecia).

Every anchor was checked against the current master with dump.py on
11 September 2026 and matches exactly the number of paragraphs intended.
Edits use the grh_reissue format. No em dashes.

Where two arms carry an identical follow-up sentence and each arm needs its
own wording (hayfever, acne, rosacea), the two edits both use nth=1: edits are
applied in sequence, so the first edit consumes the first occurrence and the
second edit's nth=1 is the arm that follows. Dry-run on copies of every master
on 11 September 2026: every anchor hit exactly the count intended.
"""

# Shared record-row fixes: the generic template runs two bullets together and
# loses punctuation. Every arm of a document carries the same text, so these
# match every occurrence on purpose.
_RECORDS_DATE = ("replace", "date of supply dose, form and route quantity supplied",
                 "date of supply, dose, form, route and quantity supplied")
_RECORDS_ADR = ("replace", "details of any adverse drug reactions and actions taken supplied via PGD",
                "details of any adverse drug reactions and actions taken")
_RECORDS_VIA = ("insert_after", "details of any adverse drug reactions and actions taken supplied via PGD",
                ["that the medicine was supplied via PGD"])
_RECORDS_CHANGE = "Records row: the two run-together bullets were separated and punctuated (date of supply, dose, form, route and quantity supplied; adverse reactions and actions taken; supplied via PGD)."

_UNDER18_A = "Children aged under 18 years - keep records until the 25th birthday (if the patient was 17 years when treatment was finished, keep records until the 26th birthday)"
_UNDER18_B = "Children aged under 18 years -keep records until the 25th birthday (if the patient was 17 years when treatment was finished, keep records until the 26th birthday)"
_UNDER18_CHANGE = "Records row: the under-18 record-retention bullet was removed because this PGD does not treat anyone under 18."


def _records(under18=None):
    """Order matters: insert the new bullet first (it clones the anchor), then
    rewrite the anchor paragraph, then fix the date bullet."""
    edits = [_RECORDS_VIA, _RECORDS_ADR, _RECORDS_DATE]
    if under18:
        edits.append(("delete", under18))
    return edits


EDITS = {
    "saxenda": {
        "edits": [
            ("replace_contains", "for the administration of Saxenda",
             "Patient Group Direction\nfor the supply of Saxenda (Liraglutide 6mg/ml) solution for injection in pre-filled pen for the treatment of Weight management in adults"),
            ("replace", "Mechanism of action: Acts on GLP-1 receptors in the central nervous system to promote satiety, delay gastric emptying, and improve glycaemic control",
             "Mechanism of action: GLP-1 receptor agonist; promotes satiety, delays gastric emptying and improves glycaemic control"),
            ("replace", "Caution in patients with history of pancreatitis, significant renal or hepatic impairment, inflammatory bowel disease, or gastroparesis",
             "Caution in patients with a history of pancreatitis or with mild to moderate renal or hepatic impairment. Under this PGD inflammatory bowel disease, diabetic gastroparesis, severe renal impairment (eGFR below 30 mL/min/1.73m2) and severe hepatic impairment (Child-Pugh C) are exclusions"),
            ("replace", "History of pancreatitis (risk of pancreatitis recurrence)",
             "History of pancreatitis not caught by the exclusions above (more than 3 months ago, not while taking a GLP-1 receptor agonist, and no ongoing risk factors): risk of recurrence; counsel and consider referral"),
            ("replace", "Acute illness or significant dehydration",
             "Significant dehydration (acute illness is an exclusion, see exclusion criteria)"),
            ("replace", "Titration schedule (over 5 weeks to maintenance dose):",
             "Titration schedule (weekly dose steps; the maintenance dose is reached in week 5):"),
        ] + _records(_UNDER18_A),
        "changes": [
            "Cover title corrected from administration to supply; the service is a supply for self-injection.",
            "Guidance summary: the mechanism line no longer attributes glycaemic control to the central nervous system.",
            "Guidance summary: the caution bullet now states that inflammatory bowel disease, gastroparesis, severe renal and severe hepatic impairment are exclusions under this PGD, as the v002 change made them.",
            "Cautions: the history-of-pancreatitis caution now states which pancreatitis histories it covers, so the boundary with the two pancreatitis exclusions is stated once.",
            "Cautions: acute illness removed from the dehydration caution because acute illness is an exclusion.",
            "Dose row: titration wording corrected (weekly steps, maintenance dose reached in week 5).",
            _RECORDS_CHANGE,
            _UNDER18_CHANGE,
        ],
    },
    "foundayo": {
        "edits": [
            ("replace", "BMI 30 kg/m² or above, or BMI 27 kg/m² or above with at least one weight-related comorbidity (for example hypertension, type 2 diabetes mellitus, dyslipidaemia, obstructive sleep apnoea, established cardiovascular disease).",
             "BMI 30 kg/m² or above, or BMI 27 kg/m² to below 30 kg/m² with at least one weight-related comorbidity (for example hypertension, type 2 diabetes mellitus, dyslipidaemia, obstructive sleep apnoea, established cardiovascular disease)."),
            ("replace_contains", "Concurrent use of any other GLP-1 receptor agonist or insulin secretagogue, FOR ANY INDICATION.",
             "Concurrent use of any other GLP-1 receptor agonist, or of any insulin secretagogue (sulfonylurea or meglitinide), FOR ANY INDICATION. Ask specifically about medicines taken for diabetes and name the products: oral or injectable semaglutide, tirzepatide, orforglipron, liraglutide, dulaglutide, exenatide, and the sulfonylureas and meglitinides. Patients do not always think of a diabetes medicine as the same kind of drug as a weight loss one."),
            ("replace", "Diabetic retinopathy. Treatment may worsen retinopathy; defer or refer to a specialist.",
             "Diabetic retinopathy (treatment may worsen retinopathy). Do not supply; refer to a specialist."),
            ("delete", "Concomitant oral medications: delayed gastric emptying may reduce the absorption of oral medicines, especially those with a narrow therapeutic index. Counsel accordingly."),
            ("replace", "Reassess the benefit-risk balance if there is no clinically meaningful weight loss, typically less than 5%, after 6 months on the maintenance dose.",
             "Reassess the benefit-risk balance if there is no clinically meaningful weight loss, typically less than 5%, after 6 months on the maximum tolerated dose (the dose at which the patient is held, which may be below 17.2 mg)."),
            ("replace_contains", "Advise when to return for review and that treatment will be reassessed if less than 5% of body weight has been lost after 6 months on the maintenance dose.",
             "Explain the expected pattern of weight loss and that the medicine works alongside diet and activity, not instead of them. Counsel on gastrointestinal side effects and how to manage them, on adequate fluid intake, and on the warning symptoms that need urgent attention: severe abdominal pain, persistent vomiting with dehydration, jaundice, sudden visual loss, or a sustained rise in resting heart rate. Advise when to return for review and that treatment will be reassessed if less than 5% of body weight has been lost after 6 months on the maximum tolerated dose."),
            ("replace_contains", "Foundayo (orforglipron) tablets. Strengths: 0.8 mg",
             "Foundayo (orforglipron) film-coated tablets. Strengths: 0.8 mg, 2.5 mg, 5.5 mg, 9 mg, 14.5 mg and 17.2 mg. Confirm the strengths available under the UK licence against the current SPC before supply. Record the product name and batch number for traceability."),
            ("replace_contains", "Very common and common: nausea, diarrhoea, vomiting, constipation, dyspepsia, abdominal pain, decreased appetite, eructation and fatigue.",
             "Very common and common: nausea, diarrhoea, vomiting, constipation, dyspepsia, abdominal pain, eructation and fatigue. Also reported: gallstones, hypoglycaemia when used with a sulfonylurea or insulin, and increases in heart rate. Uncommon or rare: acute pancreatitis, cholecystitis and hypersensitivity reactions including anaphylaxis. Refer to the current SPC for the full list, including any boxed warning carried on the UK licence."),
            ("replace_contains", "those are superseded. No period of validity was stated.",
             "Validity: this version is valid from 10 September 2026 and expires on 31 July 2027. The signed master previously stated no period of validity, or an expiry of 31 October 2026; those are superseded."),
        ],
        "changes": [
            "Inclusion criteria: the overweight band now reads 27 to below 30 kg/m2, matching the PGD Indication row.",
            "Exclusion criteria: the concurrent GLP-1 and insulin secretagogue exclusion now names sulfonylureas and meglitinides in the criterion itself, not only in the ask-about sentence.",
            "Exclusion criteria: diabetic retinopathy is written as an exclusion (do not supply; refer) rather than as a defer-or-refer caution.",
            "Cautions: the duplicated delayed-gastric-emptying bullet was removed; the bullet carrying the warfarin INR point remains.",
            "Cautions and follow-up advice: the 6-month reassessment now says maximum tolerated dose, as the treatment-period row does, and defines it.",
            "Details of the medicine: the form is named (film-coated tablets) so the records row can record it.",
            "Adverse effects: decreased appetite removed because it is not in the SmPC section 4.8 summary in part 2.",
            "Previous version record v005: a duplicated sentence about the period of validity was removed.",
        ],
    },
    "mysimba": {
        "edits": [
            ("replace_contains", "for the administration of Mysimba",
             "Patient Group Direction\nfor the supply of Mysimba (Naltrexone 8mg / Bupropion 90mg) prolonged-release tablets for the treatment of obesity"),
            ("replace", "Mysimba (naltrexone/bupropion combination) is a second-line pharmacological option for weight management in adults with obesity who have not achieved adequate weight loss with lifestyle intervention alone.",
             "Mysimba (naltrexone/bupropion combination) is a pharmacological option, as an adjunct to lifestyle measures, for weight management in adults with obesity who have not achieved adequate weight loss with lifestyle intervention alone."),
            ("replace", "Abrupt discontinuation of alcohol or benzodiazepines, or concurrent use of benzodiazepines or alcohol withdrawal",
             "Abrupt discontinuation (withdrawal) of alcohol or benzodiazepines; current alcohol withdrawal; or concurrent use of benzodiazepines"),
            ("replace", "Hypertension: Monitor blood pressure regularly (at least monthly initially). Bupropion may elevate blood pressure; discontinue if sustained elevation occurs.",
             "Hypertension: Monitor blood pressure regularly (at least monthly initially). Blood pressure must be below 140/90 mmHg at every supply; if 140/90 mmHg or above, do not supply and refer to the GP. Bupropion may elevate blood pressure; discontinue if sustained elevation occurs."),
            ("replace", "Up to 120 tablets (28-day supply at full maintenance dose of 4 tablets daily). Quantity may be adjusted based on individual patient circumstances and treatment duration.",
             "Up to 120 tablets per supply (28-day supply at the full maintenance dose of 4 tablets daily). The titration month needs 70 tablets (7, 14, 21 and 28 in weeks 1 to 4). Supply no more than covers the period to the next review, and nothing beyond the 16-week maximum."),
            ("replace", "Attend all follow-up appointments as scheduled, particularly the review at 16 weeks to assess weight loss and tolerability.",
             "Attend all follow-up appointments as scheduled, particularly the review at 16 weeks to assess weight loss and tolerability. Supply under this PGD stops at 16 weeks; any continuation is by prescription from your GP or a specialist prescriber."),
        ] + _records(_UNDER18_A) + [
            ("insert_after", "name and brand of medication",
             ["weight, blood pressure and pulse recorded at this visit, and the 16-week weight result"]),
        ],
        "changes": [
            "Cover title corrected from administration to supply; the tablets are supplied.",
            "Guidance summary: second-line wording removed so the summary does not read as requiring prior drug treatment, which the inclusion criteria do not require.",
            "Exclusion criteria: the alcohol and benzodiazepine exclusion is rewritten as three clear items with the same scope.",
            "Cautions: the hypertension caution now states the 140/90 mmHg limit that applies at every supply, matching the inclusion and exclusion criteria.",
            "Quantity row: the titration month quantity (70 tablets) is stated and the open-ended adjustment sentence replaced with a supply-to-next-review rule within the 16-week maximum.",
            "Follow-up advice: the patient is told that supply under this PGD stops at 16 weeks and continuation is by prescription.",
            _RECORDS_CHANGE,
            _UNDER18_CHANGE,
            "Records row: weight, blood pressure, pulse and the 16-week weight result added, as the treatment-period row already requires them to be recorded.",
        ],
    },
    "orlistat": {
        "edits": [
            ("replace_contains", "for the administration of Orlistat",
             "Patient Group Direction\nfor the supply of Orlistat 120mg capsules for the treatment of Weight management in Obesity"),
            ("replace", "Anticoagulant therapy (warfarin, edoxaban, dabigatran, rivaroxaban): Enhanced anticoagulant effect; requires GP liaison and INR monitoring if applicable",
             "Anticoagulant therapy other than warfarin (edoxaban, dabigatran, rivaroxaban, apixaban): Enhanced anticoagulant effect possible; requires GP liaison. Warfarin is an exclusion (see exclusion criteria)"),
            ("replace", "If on warfarin or other anticoagulant therapy, ensure GP is aware and INR is monitored as appropriate.",
             "If on anticoagulant therapy, ensure the GP is aware."),
            ("replace", "Common (≥1% in clinical trials): Oily spotting, flatulence with discharge (faecal incontinence), faecal urgency, fatty or oily stool, increased defaecation, abdominal pain, headache, urgency of stool defaecation",
             "Common (≥1% in clinical trials): Oily spotting, flatulence with discharge (faecal incontinence), faecal urgency, fatty or oily stool, increased defaecation, abdominal pain, headache"),
        ] + _records(_UNDER18_A),
        "changes": [
            "Cover title corrected from administration to supply; the capsules are supplied.",
            "Cautions and follow-up advice: warfarin removed from the anticoagulant caution and the patient advice because warfarin therapy is an exclusion; the caution now covers the direct oral anticoagulants only.",
            "Adverse effects: the duplicated faecal urgency entry was removed.",
            _RECORDS_CHANGE,
            _UNDER18_CHANGE,
        ],
    },
    "b12-injection": {
        "edits": [
            ("replace", "Maintenance where the deficiency is NOT diet related: 1 mg intramuscularly every 2 to 3 months, continuing long term. A daily high dose oral alternative (500 to 1000 micrograms) may be considered as an alternative for a patient who prefers it, in line with CKS.",
             "Maintenance where the deficiency is NOT diet related: 1 mg intramuscularly every 2 to 3 months, continuing long term. A daily high dose oral alternative (500 to 1000 micrograms, CKS) is outside this PGD; where a patient prefers it, discuss with the GP."),
            ("replace_contains", "at 1 month if pregnant or breastfeeding), and where the cause was uncertain",
             "Review at 3 months after the loading course (symptoms, response, full blood count; at 1 month if breastfeeding), and where the cause was uncertain decide then whether it is reversible. Thereafter review at least annually with symptoms, adherence and a full blood count. Do NOT repeat serum B12 in a patient on intramuscular maintenance: NICE NG239 says the result is uninformative."),
            ("replace", "Monitor plasma potassium during the initial correction phase in severe deficiency. Rapid haematological response can cause hypokalaemia. Refer any patient who becomes unwell, develops palpitations or muscle weakness during initiation.",
             "Plasma potassium should be monitored during the initial correction phase in severe deficiency, because a rapid haematological response can cause hypokalaemia. The pharmacy cannot take the sample: ask the GP to arrange it at the start of the loading course. Refer any patient who becomes unwell, develops palpitations or muscle weakness during initiation."),
            ("replace", "the blood results relied on, including the date they were taken and the laboratory or device used",
             "the blood results relied on, including the date they were taken and the laboratory or device used (for a patient on established maintenance, the results that established the diagnosis and its dietary cause, and the most recent annual review)", 2),
        ],
        "changes": [
            "PGD 1 of 3 dose row: the high dose oral alternative is now stated to be outside this PGD, matching PGD 2 of 3.",
            "PGD 1 of 3 treatment-period row: the 1-month review now applies to breastfeeding only, because pregnancy is an exclusion.",
            "PGD 1 of 3 cautions: the potassium monitoring caution now says the GP arranges the sample, because the pharmacy cannot.",
            "PGD 2 of 3 records row: states which blood results are relied on for a patient already on established maintenance.",
        ],
    },
    "folic-acid": {
        "edits": [
            ("replace", "Vitamin B12 deficiency has been excluded, OR B12 deficiency is present and treatment with hydroxocobalamin has been started first or at the same time under PGD 1 of 3.",
             "Vitamin B12 deficiency has been excluded on testing (total B12 above 350 nanograms/L (258 picomol/L) or active B12 above 70 picomol/L; an indeterminate result does not exclude deficiency), OR B12 deficiency is present and treatment with hydroxocobalamin has been started first or at the same time under PGD 1 of 3."),
            ("replace", "Establish the cause of the folate deficiency. Poor diet, alcohol excess, malabsorption including coeliac disease, pregnancy, haemolysis and certain medicines are common causes; where the cause is unclear or suggests malabsorption, refer.",
             "Establish the cause of the folate deficiency. Poor diet, alcohol excess, malabsorption including coeliac disease, haemolysis and certain medicines are common causes (pregnancy is an exclusion under this PGD); where the cause is unclear or suggests malabsorption, refer rather than supply."),
            ("replace", "Usually 4 months. Where the underlying cause persists, for example malabsorption, longer treatment may be needed and the patient should be referred to the GP rather than continued indefinitely under this PGD. Repeat full blood count and folate at the end of the course, and refer if not resolved.",
             "Usually 4 months, as a single course. Where the underlying cause persists, longer treatment may be needed: refer to the GP rather than continue under this PGD (suspected malabsorption is a referral before any supply, see cautions). Repeat full blood count and folate at the end of the course, and refer if not resolved."),
            ("replace", "The folic acid SmPC dose for folate-deficient megaloblastic anaemia in adults is 5 mg daily for 4 months, with up to 15 mg daily possibly necessary in malabsorption states; the dose for drug-induced folate deficiency is 5 mg daily.",
             "The folic acid SmPC dose for folate-deficient megaloblastic anaemia in adults is 5 mg daily for 4 months, with up to 15 mg daily possibly necessary in malabsorption states (this PGD authorises 5 mg daily only); the dose for drug-induced folate deficiency is 5 mg daily."),
        ],
        "changes": [
            "PGD 3 of 3 inclusion criteria: B12 deficiency excluded is now defined against the document's own thresholds, and an indeterminate result is stated not to exclude deficiency.",
            "PGD 3 of 3 cautions: pregnancy removed from the list of causes to assess (it is an exclusion) and suspected malabsorption is a referral rather than a supply.",
            "PGD 3 of 3 treatment-period row: no longer implies that a course may be given in malabsorption; refer instead, matching the cautions.",
            "Guidance summary: the SmPC 15 mg statement is marked as outside this PGD, which authorises 5 mg daily only.",
        ],
    },
    "anxiety-propranolol": {
        "edits": [
            ("replace_contains", "for the administration of Propranolol",
             "Patient Group Direction\nfor the supply of Propranolol for the treatment of Anxiety (Situational and Somatic Symptoms)"),
            ("replace", "Review at 4 weeks; ongoing use should be reviewed regularly. Consider gradual dose reduction if discontinuing.",
             "Review before any repeat supply, and in any case at 4 weeks; ongoing use should be reviewed regularly. Consider gradual dose reduction if discontinuing."),
            ("insert_after", "Hepatic/renal impairment",
             ["Thyroid disease or a possible cardiac cause for the physical symptoms (palpitations, tremor, sweating): where either is suspected, refer rather than supply"]),
            ("insert_after", "name and brand of medication",
             ["batch number and expiry date of the pack supplied"]),
        ] + _records(_UNDER18_A),
        "changes": [
            "Cover title corrected from administration to supply; the tablets are supplied.",
            "Treatment-period row: review is now stated as before any repeat supply and in any case at 4 weeks, so it agrees with the 28-tablet single supply in the quantity row.",
            "Cautions: thyroid disease and cardiac causes for the physical symptoms added as a refer-rather-than-supply caution, as the guidance summary already directs.",
            "Records row: batch number and expiry date added, in line with the estate's other POM PGDs.",
            _RECORDS_CHANGE,
            _UNDER18_CHANGE,
        ],
    },
    "sleep-melatonin": {
        "edits": [
            ("replace", "Any previous Circadin supply, and the total weeks of treatment to date.",
             "Any previous Circadin supply, and the total weeks of treatment to date, from the pharmacy's own records and as reported by the patient (ask specifically about supplies made elsewhere)."),
        ],
        "changes": [
            "Records row: states the sources for previous Circadin supply (pharmacy records and patient report, including supplies made elsewhere).",
        ],
    },
    "smoking-varenicline": {
        "edits": [
            ("replace", "Set a quit date within the next 1-2 weeks",
             "Set a quit date 8 to 14 days after the planned start of treatment (within the next 2 weeks where treatment starts on the day of supply)"),
            ("replace", "Starter pack (first 4 weeks) then up to 56 tablets (4-week supply at full dose of 1mg twice daily)",
             "Starter pack covering the first 2 weeks (11 x 0.5mg and 14 x 1mg tablets), then up to 56 tablets of 1mg per supply (4-week supply at 1mg twice daily). Supply no more than covers the period to the next review."),
        ] + _records(_UNDER18_A),
        "changes": [
            "Inclusion criteria: the quit date criterion now matches the dose row (day 8 to 14 of treatment).",
            "Quantity row: the starter pack is described as the UK generic 2-week pack (11 x 0.5mg and 14 x 1mg); a 4-week starter pack does not exist.",
            _RECORDS_CHANGE,
            _UNDER18_CHANGE,
        ],
    },
    "smoking-nrt": {
        "edits": [
            ("replace_contains", "for the administration of Nicotine Replacement Therapy",
             "Patient Group Direction\nfor the supply of Nicotine Replacement Therapy (Patches and Oral Products) for the treatment of Smoking Cessation"),
            ("replace", "Nicotine 24-hour patches 7mg, 14mg, 21mg (e.g. NiQuitin Clear)",
             "Nicotine 24-hour patches 7mg, 14mg, 21mg (NiQuitin Clear)"),
            ("replace", "Nicotine 24-hour transdermal patches 7mg, 14mg, 21mg (e.g. NiQuitin Clear). Nicorette Invisi patches are 16-hour patches of 10mg, 15mg and 25mg and are not the product described here.",
             "Nicotine 24-hour transdermal patches 7mg, 14mg, 21mg (NiQuitin Clear). Nicorette Invisi patches are 16-hour patches of 10mg, 15mg and 25mg and are not the product described here."),
            ("replace", "Lighter smokers (≤10 cigarettes/day): Start 14mg/24-hour patch daily and step down as above",
             "Lighter smokers (≤10 cigarettes/day): Start 14mg/24-hour patch daily for 6 weeks, then 7mg for 2 weeks (NiQuitin Clear SmPC)"),
            ("replace", "28 patches (4-week supply)",
             "Up to 28 patches per supply (4-week supply). Repeat supplies under this PGD only after the scheduled review, and not beyond the 8 to 12 week course total."),
            ("replace", "Up to 4-week supply (maximum 120 pieces depending on daily use)",
             "Up to 120 pieces per supply (about 2 weeks at 8 to 12 pieces a day). Repeat supplies under this PGD only after the scheduled review, and not beyond the 8 to 12 week course total."),
            ("replace", "Supply the Patient Information Leaflet (PIL) for nicotine patches and/or oral products. Discuss the treatment plan, correct usage technique, and importance of combining with behavioural support.",
             "Supply the Patient Information Leaflet (PIL) for each nicotine product supplied. The patch arm and the oral-product arm of this document may be used together as combination therapy; counsel on the technique for each product supplied. Discuss the treatment plan, correct usage technique, and importance of combining with behavioural support."),
        ] + _records(_UNDER18_A),
        "changes": [
            "Cover title corrected from administration to supply; NRT is supplied.",
            "Patch arm title and medicine row: e.g. removed so the 24-hour arm names NiQuitin Clear only, as the v002 change record states.",
            "Patch dose row: the lighter-smoker step-down is stated (14mg for 6 weeks then 7mg for 2 weeks, per the NiQuitin Clear SmPC).",
            "Patch quantity row: 28 patches is stated as a per-supply maximum with repeat supplies only after review and within the course total.",
            "Oral quantity row: the 120-piece maximum is kept and the 4-week description corrected to about 2 weeks at the stated daily use; repeat supplies only after review.",
            "Written information row (both arms): states that the two arms may be used together as combination therapy and that counselling covers each product supplied.",
            _RECORDS_CHANGE,
            _UNDER18_CHANGE,
        ],
    },
    "hayfever": {
        "edits": [
            ("replace", "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 weeks, or they become systemically very unwell.",
             "To seek medical advice if symptoms worsen rapidly or significantly, persist beyond 7 days despite treatment, or they become systemically very unwell.", 1),
            ("replace", "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 weeks, or they become systemically very unwell.",
             "To seek medical advice if symptoms worsen rapidly or significantly, do not improve after 2 to 4 weeks of regular use, or they become systemically very unwell.", 1),
            ("replace", "P (Pharmacy medicine) for fexofenadine 120 mg as Allevia; generic fexofenadine 120 mg tablets remain POM, and this PGD is the legal authority for those. A PGD is not legally required for a P sale; this arm is included so that the supply is assessed and recorded to the same standard as a POM supply. Where the P licence is narrower than this PGD, the P licence governs.",
             "P (Pharmacy medicine) for fexofenadine 120 mg as Allevia; generic fexofenadine 120 mg tablets remain POM, and this PGD is the legal authority for those. Where the P licence is narrower than this PGD, the P licence governs."),
            ("replace", "Use as required; assess effectiveness after 2–4 weeks.",
             "Use as required; assess effectiveness after 2 to 4 weeks. One bottle per supply; reassess the need for continued treatment before any repeat supply and if symptoms persist beyond 4 weeks."),
            ("replace", _UNDER18_B, _UNDER18_A),
        ] + _records(),
        "changes": [
            "Fexofenadine follow-up advice: the 3 to 4 week template line is replaced with the arm's own 7-day referral point from the cautions row.",
            "Dymista follow-up advice: the 3 to 4 week template line is replaced with the arm's own 2 to 4 week effectiveness review.",
            "Fexofenadine legal category: narration about why the P arm is included was removed; the P-licence-governs rule stays.",
            "Dymista treatment-period row: one bottle per supply and reassessment before any repeat supply are stated, matching the 4-week caution.",
            "Records row: spacing typo in the under-18 retention bullet corrected.",
            _RECORDS_CHANGE,
        ],
    },
    "fungal-infection": {
        "edits": [
            ("replace_contains", "- Pregnancy or breastfeeding unless approved by prescriber.",
             "- Known hypersensitivity to miconazole or any of the excipients.\n- Infected, broken, or oozing skin where topical antifungal is inappropriate.\n- Nail or scalp infections (requires systemic or alternative treatment).\n- Pregnancy or breastfeeding. Refer to the GP."),
            ("replace_contains", "- Continue treatment for several days after resolution of symptoms.",
             "- Avoid contact with eyes and mucous membranes.\n- Continue treatment for at least one week after all signs and symptoms have resolved.\n- Wash hands before and after application.\n- Counsel on hygiene to prevent reinfection or spread."),
            ("replace", "Minimum 2 weeks; continue for several days after symptoms resolve. Maximum 4 weeks.",
             "Minimum 2 weeks; continue for at least one week after all signs and symptoms have resolved. Maximum 4 weeks."),
            ("replace", "P (Pharmacy medicine). A PGD is not legally required for a P sale; this arm is included so that the supply is assessed and recorded to the same standard as a POM supply. Where the P licence is narrower than this PGD, the P licence governs.",
             "P (Pharmacy medicine). Where the P licence is narrower than this PGD, the P licence governs."),
            ("replace_contains", "- Localised inflamed skin condition with suspected fungal or bacterial involvement.",
             "- Adults aged 18 years and over.\n- Localised inflamed intertrigo, infected eczema or seborrhoeic dermatitis with a suspected secondary bacterial or candidal component (primary fungal infection excludes; see exclusion criteria).\n- No signs of systemic infection.\n- Informed consent obtained."),
            ("replace_contains", "- Pregnancy or breastfeeding unless deemed appropriate by prescriber.",
             "- Known hypersensitivity to corticosteroids, nystatin, oxytetracycline, or any excipients.\n- Skin infections requiring systemic therapy.\n- Broken, ulcerated, or weeping skin.\n- Use on face, genitals, or long-term use without review.\n- Pregnancy or breastfeeding. Refer to the GP."),
            ("replace", "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 weeks, or they become systemically very unwell.",
             "To seek medical advice if symptoms worsen, do not improve within seven days, or they become systemically very unwell. Do not use for more than 7 to 10 days without review.", 2),
            ("replace", "Wash clothes and bed linen frequently to eradicate the fungus. Avoid sharing towels and wash them regularly.",
             "Wash clothes and bed linen frequently. Avoid sharing towels and wash them regularly."),
        ] + _records(),
        "changes": [
            "Miconazole exclusion criteria: pregnancy or breastfeeding is an exclusion with referral; the unless-approved-by-prescriber wording is removed because there is no prescriber in a PGD supply.",
            "Miconazole cautions and treatment-period row: the post-resolution rule now reads at least one week after all signs and symptoms have resolved in every place it appears, matching the dose row.",
            "Miconazole legal category: narration about why the P arm is included was removed; the P-licence-governs rule stays.",
            "Trimovate inclusion criteria: the indication's own conditions are named (inflamed intertrigo, infected eczema or seborrhoeic dermatitis with a secondary component) and the clash with the primary fungal infection exclusion removed.",
            "Trimovate exclusion criteria: pregnancy or breastfeeding is an exclusion with referral; the unless-deemed-appropriate-by-prescriber wording is removed.",
            "Trimovate follow-up advice: the 3 to 4 week template line is replaced with the arm's own seven-day and 7 to 10 day rules.",
            "Trimovate follow-up advice: the sentence about eradicating the fungus was removed because Trimovate does not treat primary fungal infection.",
            _RECORDS_CHANGE,
        ],
    },
    "acne": {
        "edits": [
            ("replace_contains", "- Safety in human pregnancy is not established.",
             "- Pregnancy or breastfeeding. Refer to the GP (safety in pregnancy is not established; clindamycin is found in breast milk and the product must never be applied to the breast area)."),
            ("replace", "Benzoyl Peroxide plus Clindamycin 10mg/g + 30mg/g and 10mg/g + 50mg/g gel",
             "Clindamycin 10mg/g plus benzoyl peroxide 30mg/g gel, and clindamycin 10mg/g plus benzoyl peroxide 50mg/g gel (Duac)"),
            ("replace", "Maximum of 12 weeks continuous use; review required for repeat courses.",
             "Maximum of 12 weeks continuous use; review required for repeat courses. NICE recommends at least 12 weeks for a first-line course, so a patient who needs the full course is reviewed at 12 weeks before any further supply."),
            ("replace", "Seek advice if the skin reaction is severe (marked redness, peeling, burning or swelling), or if there is no improvement after 8 to 12 weeks of regular use (Duac) or 4 to 8 weeks (Epiduo, per its SmPC). Improvement is not expected before 6 to 8 weeks.",
             "Seek advice if the skin reaction is severe (marked redness, peeling, burning or swelling), or if there is no improvement after 8 to 12 weeks of regular use. Improvement is not expected before 6 to 8 weeks.", 1),
            ("replace", "Seek advice if the skin reaction is severe (marked redness, peeling, burning or swelling), or if there is no improvement after 8 to 12 weeks of regular use (Duac) or 4 to 8 weeks (Epiduo, per its SmPC). Improvement is not expected before 6 to 8 weeks.",
             "Seek advice if the skin reaction is severe (marked redness, peeling, burning or swelling), or if there is no improvement after 4 to 8 weeks of regular use (per the SmPC).", 1),
            ("replace_contains", "- Apply at night and wash hands after use.",
             "- Avoid contact with eyes, mouth, mucous membranes, and broken skin.\n- Advise patient to use sunscreen and limit sun exposure.\n- Apply once daily in the evening and wash hands after use.\n- Discontinue if excessive irritation or allergic reaction occurs."),
            ("replace", _UNDER18_B, _UNDER18_A),
        ] + _records(),
        "changes": [
            "Duac exclusion criteria: the SmPC prose on pregnancy and breastfeeding is replaced by a plain exclusion with referral, which is how it was already applied.",
            "Duac medicine row: each strength now names its components (clindamycin 10mg/g; benzoyl peroxide 30 or 50 mg/g).",
            "Duac treatment-period row: states that the 12-week PGD maximum equals the NICE course minimum, so the 12-week review precedes any further supply.",
            "Follow-up advice: each arm now states only its own review interval (Duac 8 to 12 weeks; Epiduo 4 to 8 weeks).",
            "Epiduo cautions: apply at night changed to once daily in the evening, matching the dose row.",
            "Records row: spacing typo in the under-18 retention bullet corrected.",
            _RECORDS_CHANGE,
        ],
    },
    "rosacea": {
        "edits": [
            ("replace_contains", "- Pregnancy or breastfeeding unless deemed appropriate by prescriber.",
             "- Known hypersensitivity to metronidazole or other nitroimidazoles.\n- Severe rosacea requiring systemic treatment.\n- Broken, irritated, or eczematous skin.\n- Pregnancy or breastfeeding. Refer to the GP."),
            ("replace_contains", "- Pregnancy or breastfeeding unless assessed as appropriate by the prescriber.",
             "- Known hypersensitivity to azelaic acid or any of the excipients.\n- Severe rosacea requiring systemic treatment.\n- Broken, irritated, or eczematous facial skin.\n- Pregnancy or breastfeeding. Refer to the GP."),
            ("replace_contains", "- Monitor for prolonged use; review at 8–12 weeks for effectiveness.",
             "- Avoid contact with eyes, mucous membranes, and broken skin.\n- Use sunscreen and avoid excessive sunlight exposure.\n- Wash hands after application.\n- Monitor for prolonged use; review at 8 weeks for effectiveness."),
            ("replace", "Initial course of up to 8 weeks; reassess continued use beyond 12 weeks.",
             "Course of up to 8 weeks under this PGD (2 x 30 g); review at 8 weeks. Any further course only after that review, and refer to the GP if there is no improvement at 8 weeks or if use would exceed 12 weeks in total."),
            ("replace", "- To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 weeks, or they become systemically very unwell.",
             "- To seek medical advice if symptoms worsen rapidly or significantly, if there is no improvement at the 8-week review, or they become systemically very unwell. Improvement may take several weeks.", 1),
            ("replace", "- To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 weeks, or they become systemically very unwell.",
             "- To seek medical advice if symptoms worsen rapidly or significantly, if there is no improvement after 2 months of regular use (a distinct improvement is generally apparent after 4 weeks), or they become systemically very unwell.", 1),
        ] + _records(_UNDER18_B),
        "changes": [
            "Exclusion criteria, both arms: pregnancy or breastfeeding is an exclusion with referral; the prescriber wording is removed because there is no prescriber in a PGD supply.",
            "Metronidazole cautions and treatment-period row: the course under this PGD is 8 weeks with review at 8 weeks, matching the 2 x 30 g quantity; the 8 to 12 week ambiguity is removed.",
            "Follow-up advice: the 3 to 4 week infection-template line is replaced by each arm's own review point (metronidazole 8 weeks; azelaic acid 2 months).",
            _RECORDS_CHANGE,
            _UNDER18_CHANGE,
        ],
    },
    "eye-infections": {
        "edits": [
            ("replace", "Severe eye pain, photophobia, or reduced vision (suggests more serious pathology - refer urgently to GP/eye casualty)",
             "Eye pain (more than mild grittiness or irritation), photophobia, or reduced vision (suggests more serious pathology - refer urgently to GP/eye casualty)"),
            ("replace", "Severe eye pain, photophobia, or reduced vision (suggests more serious pathology - refer urgently)",
             "Eye pain (more than mild grittiness or irritation), photophobia, or reduced vision (suggests more serious pathology - refer urgently)"),
            ("replace", "Contact lens wearers: advise removal during treatment; ointment may damage or coat lenses",
             "Contact lens wearers: advise removal during treatment and for 48 hours after completion; ointment may damage or coat lenses"),
            ("replace", "Apply four times daily (QDS) if patient unable to use or prefers drops alone",
             "Apply four times daily (QDS) where ointment is used alone (patient unable to use drops, or prefers ointment alone)"),
            ("replace", "Contact lens wearers must remove lenses during treatment and not reinert for 48 hours after completion",
             "Contact lens wearers must remove lenses during treatment and not reinsert them for 48 hours after completion"),
            ("insert_after", "name and brand of medication",
             ["batch number and expiry date of the pack supplied"]),
        ] + _records(),
        "changes": [
            "Exclusion criteria, both arms: the eye pain threshold now matches the follow-up advice (eye pain beyond mild grittiness or irritation), rather than severe pain only.",
            "Ointment cautions: the 48-hour contact lens rule carried by the drops arm and both follow-up rows is added.",
            "Ointment dose row: the QDS-alone wording corrected (patient unable to use drops or prefers ointment alone).",
            "Follow-up advice, both arms: reinert typo corrected to reinsert.",
            "Records row, both arms: batch number and expiry date added, as the consultation record already captures.",
            _RECORDS_CHANGE,
        ],
    },
    "hair-loss": {
        "edits": [
            ("replace_contains", "for the administration of Finasteride",
             "Patient Group Direction\nfor the supply of Finasteride for the treatment of Androgenetic Alopecia"),
            ("replace_contains", "a man being treated with finateride.",
             "- The use of a condom is recommended if a female partner is pregnant or likely to become pregnant - Finasteride is excreted in semen and it is not known if a male fetus may be adversely affected if its mother is exposed to the semen of a man being treated with finasteride."),
            ("replace", "3-12 months of treatment can be supplied between reviews. It is advisable to carry out the first review after 3 – 6 months.",
             "Up to 12 months of treatment per supply, and no more than 12 months without a review. The first review should be at 3 to 6 months, so the first supply should not normally exceed 6 months. Reassess if there is no improvement after 12 months."),
        ] + _records(_UNDER18_B),
        "changes": [
            "Cover title corrected from administration to supply; the tablets are supplied.",
            "Cautions: finateride typo corrected.",
            "Quantity row: 12 months is stated as the maximum supply without a review, with the first review at 3 to 6 months and the 12-month reassessment carried in from the cautions.",
            _RECORDS_CHANGE,
            _UNDER18_CHANGE,
        ],
    },
}

DECISIONS = [
    ("foundayo",
     "Keep the personal or family history of MTC or MEN 2 exclusion, which the orforglipron SmPC does not list?",
     "(a) keep it as a class precaution carried from the injectable GLP-1 PGDs; (b) remove it as unsourced.",
     "Keep (a): it excludes a small group and removal would widen eligibility without an SmPC basis."),
    ("mysimba",
     "Should age 75 and over be an exclusion, as the SmPC (not recommended over 75) and the Saxenda v002 change already do?",
     "(a) add an exclusion at 75 and over; (b) keep elderly as an undefined caution.",
     "Add the exclusion (a), for consistency with Saxenda and the SmPC."),
    ("mysimba",
     "Moderate to severe renal impairment: the SmPC limits the dose to 2 tablets daily, which the PGD dose row does not provide for.",
     "(a) exclude eGFR below 60 mL/min/1.73m2 and refer; (b) write the SmPC 2-tablet maximum into the dose row for eGFR 15 to 59.",
     "Exclude (a): a reduced-dose regimen is a prescriber decision, not a pharmacy PGD supply."),
    ("mysimba",
     "Head trauma with loss of consciousness has no time frame in the exclusion.",
     "(a) keep any history; (b) limit to a defined period, for example within 12 months.",
     "Keep any history (a); the SmPC lists it as a predisposing factor without a time limit."),
    ("orlistat",
     "The tool stops on 'clinically significant drug interaction' (antiepileptics, antiretrovirals, amiodarone), which the signed document does not list.",
     "(a) add an exclusion for medicines with an SmPC interaction that cannot be managed in a pharmacy setting; (b) downgrade the tool alert to a caution.",
     "Add the exclusion (a), naming antiepileptics, antiretrovirals and amiodarone, so the tool and the document agree."),
    ("anxiety-propranolol",
     "Is the regular regimen (10 to 40mg two to three times daily, maximum 120mg daily) intended under this PGD when a supply is capped at 28 x 10mg?",
     "(a) restrict the PGD to as-required use before an anxiety-provoking situation; (b) keep the regular regimen and state that one supply covers the days the dose allows, with review before repeat.",
     "Restrict to as-required use (a): 28 tablets cannot deliver a regular course and repeated supplies of a cardiotoxic drug without prescriber review is not a pharmacy service."),
    ("sleep-melatonin",
     "What tips the 'consider referral instead' decision for patients on cimetidine, oestrogens or quinolones?",
     "(a) leave to judgement; (b) state referral where the patient also drives, is frail or at risk of falls, or takes another sedating medicine.",
     "State the criteria (b)."),
    ("hayfever",
     "The Dymista arm is silent on pregnancy and breastfeeding while the fexofenadine arm excludes both; the SmPC advises use only if benefit outweighs risk.",
     "(a) add pregnancy and breastfeeding as Dymista exclusions with referral; (b) leave the arm silent.",
     "Add the exclusion (a): benefit-risk judgement in pregnancy is a prescriber decision."),
    ("hayfever",
     "The fexofenadine referral point is 7 days (now applied in both the cautions and the follow-up row); for seasonal symptoms a 2-week trial of regular use is the usual review point.",
     "(a) keep 7 days; (b) change both rows to 2 weeks of regular use.",
     "Keep 7 days unless the clinical leads prefer 2 weeks; either is fine provided both rows agree."),
    ("acne",
     "Should planning pregnancy exclude the Duac (clindamycin and benzoyl peroxide) arm as it does the Epiduo (adapalene) arm?",
     "(a) add planning pregnancy to the Duac exclusion for consistency; (b) leave it to pregnancy and breastfeeding only, as the SmPC has no retinoid-type restriction.",
     "Leave as is (b); adapalene is the reason for the Epiduo restriction."),
    ("alopecia-minoxidil",
     "The catalogue sells this slug as Female Pattern Hair Loss (Minoxidil) under Women's Health, but the document is finasteride for men only and excludes women.",
     "(a) rename the catalogue entry to Finasteride 1 mg (androgenetic alopecia, men) and remove it from Women's Health; (b) commission a topical minoxidil PGD for women to serve the entry as titled.",
     "Rename now (a); commission (b) separately if the women's service is wanted."),
]
