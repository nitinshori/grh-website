# Round 5, batch C: decisions 17 (hpv), 18, 19, 20, 22, 23 (shingles-treatment)
# and 24 (herpes-management), taken by Nitin on 11 September 2026
# (align/DECISIONS-ANSWERS.md).
#
# Every anchor was checked against the current master docx with dump.py and
# matches exactly one paragraph. Edits apply in order.
#
# Famciclovir source for decision 23: Famvir 500 mg film-coated tablets
# (famciclovir), Summary of Product Characteristics, Phoenix Labs
# (PL 35104/0027), text revised 18 March 2019, emc last updated 27 August 2020,
# fetched from medicines.org.uk/emc/product/11712/smpc on 11 September 2026.

EDITS = {
    "hpv": {
        "edits": [
            # Guidance summary: the single-dose rule is qualified so that the
            # summary does not contradict the amended PGD body.
            ("replace",
             "UNDER 25 AT VACCINATION: JCVI recommends a single dose schedule for all HPV vaccines. Anyone who received one dose before reaching 25 does not require any further doses.",
             "UNDER 25 AT VACCINATION: JCVI recommends a single dose schedule for all HPV vaccines. Anyone immunocompetent who received one dose before reaching 25 does not require any further doses. The three dose schedule below applies to immunosuppressed and HIV positive individuals whatever their age."),
            # "What this PGD is for": schedule bullets
            ("replace",
             "UNDER 25 at the time of vaccination: ONE dose. That is the whole course. Do not book further doses.",
             "IMMUNOCOMPETENT and UNDER 25 at the time of vaccination: ONE dose. That is the whole course. Do not book further doses."),
            ("replace",
             "A person who had one dose before their 25th birthday needs no further doses, whatever their age now.",
             "An immunocompetent person who had one dose before their 25th birthday needs no further doses, whatever their age now. A person who is immunosuppressed or known HIV positive completes the three dose course whatever their age at the first dose: a single dose given before 25 is counted as the first dose, not repeated, and the remaining doses are given at the three dose intervals."),
            # Exclusion criteria
            ("replace",
             "Has already completed a full course of HPV vaccine appropriate to their age and immune status, including anybody who received a single dose before their 25th birthday.",
             "Has already completed a full course of HPV vaccine appropriate to their age and immune status. For an immunocompetent individual this includes anybody who received a single dose before their 25th birthday. An immunosuppressed or HIV positive individual has completed the course only after three doses, whatever their age at the first dose."),
            # Cautions
            ("replace",
             "Immunosuppression and HIV. Not a reason to withhold the vaccine, but it changes the schedule to three doses. Eligible GBMSM known to be HIV positive should be offered the vaccine regardless of CD4 count, antiretroviral therapy or viral load. The response may still be suboptimal, and in transplant recipients additional doses may be considered after treatment finishes; that is a specialist decision, not one for this PGD.",
             "Immunosuppression and HIV. Not a reason to withhold the vaccine, but it changes the schedule to three doses, whatever the patient's age at the first dose and even where a single dose was given before the 25th birthday: that dose is counted and the remaining doses are given. Eligible GBMSM known to be HIV positive should be offered the vaccine regardless of CD4 count, antiretroviral therapy or viral load. The response may still be suboptimal, and in transplant recipients additional doses may be considered after treatment finishes; that is a specialist decision, not one for this PGD."),
            # Dose and frequency row
            ("replace",
             "IMMUNOSUPPRESSED OR KNOWN HIV POSITIVE, any age: THREE doses of 0.5 mL at 0, 1, and 4 to 6 months. All three ideally within 12 months.",
             "IMMUNOSUPPRESSED OR KNOWN HIV POSITIVE, any age: THREE doses of 0.5 mL at 0, 1, and 4 to 6 months. All three ideally within 12 months. This applies whatever the patient's age at the first dose, including a patient who received a single dose before their 25th birthday, who completes the remaining doses."),
            ("replace",
             "A person who received a single dose before their 25th birthday requires no further doses.",
             "An immunocompetent person who received a single dose before their 25th birthday requires no further doses. An immunosuppressed or HIV positive person who received a single dose at any age completes the three dose course: give the second dose now and the third at least three months after it."),
        ],
        "changes": [
            "Decision 17: a single dose received before the 25th birthday completes the course for an immunocompetent patient only. An immunosuppressed or HIV positive patient completes the three dose course whatever their age at the first dose, with the earlier dose counted and not repeated. The schedule bullets, exclusion criteria, cautions, dose and frequency row and the guidance summary now say the same thing (Green Book chapter 18a).",
        ],
    },
    "shingles-treatment": {
        "edits": [
            # Decision 23: source header for part 2
            ("replace_contains",
             "Summarised 10 September 2026.",
             "Immunisation against infectious disease (the Green Book), chapter 28a Shingles (herpes zoster), UK Health Security Agency, chapter dated 12 August 2025, page last updated 19 August 2025. NICE Clinical Knowledge Summary: Shingles (Scenario: Management), last revised January 2026. Aciclovir 800mg Tablets, Summary of Product Characteristics, Wockhardt UK Ltd (PL 29831/0003), text revised 14 April 2026, emc updated 27 April 2026. Valtrex 500 mg film-coated tablets (valaciclovir), Summary of Product Characteristics, GlaxoSmithKline UK (PL 00003/0352), text revised 18 June 2026, emc updated 30 June 2026. Famvir 500 mg film-coated tablets (famciclovir), Summary of Product Characteristics, Phoenix Labs (PL 35104/0027), text revised 18 March 2019, emc updated 27 August 2020. Summarised 10 September 2026; famciclovir added 11 September 2026."),
            # Decision 23: doses and indication
            ("insert_after",
             "For immunocompromised adults the valaciclovir dose is 1000 mg three times daily for at least seven days and for 2 days following crusting of lesions.",
             ["The famciclovir SmPC dose for herpes zoster and ophthalmic zoster in immunocompetent adults is 500 mg three times daily for seven days, and for herpes zoster in immunocompromised adults 500 mg three times daily for ten days; in both cases treatment should be initiated as soon as possible after diagnosis. Famciclovir can be taken without regard to meals.",
              "The famciclovir SmPC indication covers the treatment of herpes zoster and ophthalmic zoster in immunocompetent adults and of herpes zoster in immunocompromised adults; the SmPC states that its safety and efficacy in children and adolescents under 18 have not been established."]),
            # Decision 23: renal, elderly, interactions, hepatic
            ("insert_after",
             "The valaciclovir SmPC states that dose modification is not required in mild or moderate cirrhosis.",
             ["The famciclovir SmPC states that reduced clearance of penciclovir is related to reduced renal function as measured by creatinine clearance, and its table for herpes zoster gives the full dose of 500 mg three times daily only where creatinine clearance is 60 ml/min or above; below that it gives 500 mg twice daily for 40 to 59 ml/min, 500 mg once daily for 20 to 39 ml/min and 250 mg once daily below 20 ml/min, each for 7 days in immunocompetent and 10 days in immunocompromised adults, with 250 mg after each dialysis for haemodialysis patients.",
              "The famciclovir SmPC states that in the elderly (65 years and over) dose modification is not required unless renal function is impaired, that penciclovir exposure is about 30% higher in older volunteers, and that acute renal failure has been reported rarely in patients with underlying renal disease where the dose was not reduced for the level of renal function.",
              "The famciclovir SmPC states that concurrent probenecid may increase penciclovir concentrations, so patients taking 500 mg three times daily with probenecid should be monitored for toxicity, and that raloxifene, a potent inhibitor of the aldehyde oxidase that converts famciclovir to penciclovir, could affect efficacy, so the clinical response should be monitored when the two are co-administered.",
              "The famciclovir SmPC states that no dose adjustment is required in mild or moderate hepatic impairment, and that famciclovir has not been studied in severe hepatic impairment, where conversion to penciclovir may be impaired and efficacy may be reduced."]),
            # Decision 23: contraindications and warnings
            ("insert_after_contains",
             "patients who have had such a reaction with aciclovir or valaciclovir must not receive either drug again",
             ["The famciclovir SmPC contraindicates use in patients hypersensitive to famciclovir, to penciclovir or to any excipient. Its post-marketing reactions of unknown frequency include serious skin reactions (erythema multiforme, Stevens-Johnson syndrome, toxic epidermal necrolysis), hypersensitivity vasculitis, anaphylactic reaction and seizure, and it advises that patients who experience dizziness, somnolence, confusion or other central nervous system disturbances should not drive or operate machinery."]),
            ("insert_after",
             "The aciclovir SmPC advises caution in nursing women because aciclovir is detected in breast milk; the valaciclovir SmPC says valaciclovir should be used with caution during breastfeeding and only when clinically indicated.",
             ["The famciclovir SmPC states that limited data (fewer than 300 pregnancy outcomes) have not indicated a specific foetal defect or congenital anomaly, that famciclovir should only be used in pregnancy when the potential benefits outweigh the potential risks, and that it is unknown whether famciclovir is excreted in human breast milk; if the woman's condition mandates treatment, discontinuation of breastfeeding may be considered."]),
            ("insert_after",
             "Common adverse effects in the aciclovir SmPC are headache, dizziness, nausea, vomiting, diarrhoea, abdominal pain, pruritus, rashes including photosensitivity, fever and fatigue; the valaciclovir SmPC lists headache as very common and nausea, dizziness, vomiting, diarrhoea, rashes and pruritus as common.",
             ["The famciclovir SmPC lists headache as very common and dizziness, nausea, vomiting, abdominal pain, diarrhoea, abnormal liver function tests, rash and pruritus as common, with confusional state and somnolence (predominantly in the elderly), angioedema and urticaria uncommon, and hallucinations, palpitations, thrombocytopenia and cholestatic jaundice rare."]),
            # Decision 23: zoster warnings
            ("insert_after",
             "The valaciclovir SmPC says clinical response should be closely monitored, particularly in immunocompromised patients, with intravenous therapy considered when response to oral therapy is insufficient.",
             ["The famciclovir SmPC carries the same warnings for zoster treatment: clinical response should be closely monitored, particularly in immunocompromised patients, with intravenous antiviral therapy considered when response to oral therapy is insufficient; patients with complicated herpes zoster (visceral involvement, disseminated zoster, motor neuropathies, encephalitis and cerebrovascular complications), and immunocompromised patients with ophthalmic zoster or a high risk of dissemination and visceral involvement, should be treated with intravenous antiviral therapy."]),
            # Decision 23: what the sources do not say
            ("replace",
             "NICE CKS does not give the antiviral doses or renal dose adjustments in its management scenario; those are taken from the two SmPCs.",
             "NICE CKS does not give the antiviral doses or renal dose adjustments in its management scenario; those are taken from the three SmPCs."),
            ("replace",
             "Neither SmPC gives a specific age threshold (such as 50 years) for deciding who should receive treatment; that threshold comes from NICE CKS.",
             "None of the three SmPCs gives a specific age threshold (such as 50 years) for deciding who should receive treatment; that threshold comes from NICE CKS."),
            ("replace",
             "Famciclovir is named by NICE CKS as an alternative but was not fetched and is not summarised here.",
             "The famciclovir SmPC gives no treatment window in hours; it says treatment should be initiated as soon as possible after diagnosis. It does not list drug reaction with eosinophilia and systemic symptoms (DRESS) among famciclovir's adverse reactions; the adverse effects row and the exclusion for a previous DRESS reaction in this PGD are retained as the conservative position."),
            # Decision 18, 19, 20: inclusion criteria
            ("replace",
             "Rash onset within 72 hours, AND at least one of: age over 50; non-truncal involvement of the limbs or perineum (head or neck involvement excludes: see below); moderate or severe pain; or moderate or severe rash with confluent lesions.",
             "Rash onset within 72 hours, AND at least one of: aged 50 years or over; non-truncal involvement of the limbs or perineum (sacral dermatomes, including the buttocks, count as truncal; head or neck involvement excludes: see below); moderate or severe pain, meaning a score of 4 or more on a 0 to 10 scale; or moderate or severe rash with confluent lesions."),
            ("replace",
             "OR rash onset within 7 days, AND at least one of: continued formation of new vesicles; severe pain; age 70 or over; or a high risk of severe shingles, for example severe atopic eczema.",
             "OR rash onset within 7 days, AND at least one of: continued formation of new vesicles; severe pain, meaning a score of 7 or more on a 0 to 10 scale; age 70 or over; or a high risk of severe shingles, for example severe atopic eczema."),
            # Decision 19: training row names the scale and the thresholds
            ("replace",
             "All users must be able to assess pain using a validated scale and to recognise the features of ophthalmic involvement, including Hutchinson’s sign",
             "All users must be able to assess pain using a validated 0 to 10 scale (this PGD treats a score of 4 or more as moderate or severe pain and 7 or more as severe pain) and to recognise the features of ophthalmic involvement, including Hutchinson’s sign"),
            # Decision 19: elderly defined
            ("replace",
             "Elderly patients. Renal function declines with age, often without a formal diagnosis of chronic kidney disease, and all three antivirals carry a higher risk of neurological adverse effects in this group, including confusion, hallucinations and somnolence. Check renal function before supply.",
             "Elderly patients, meaning those aged 65 years and over. Renal function declines with age, often without a formal diagnosis of chronic kidney disease, and all three antivirals carry a higher risk of neurological adverse effects in this group, including confusion, hallucinations and somnolence. Check renal function before supply."),
            ("replace",
             "Where renal function is unknown and the patient is elderly or has risk factors for renal impairment, refer rather than assume.",
             "Where renal function is unknown and the patient is elderly (aged 65 years and over) or has risk factors for renal impairment, refer rather than assume."),
            # Decision 19: records row names the scale
            ("replace",
             "the dermatome affected and the pain score recorded",
             "the dermatome affected and the pain score recorded on the 0 to 10 scale"),
            # Decision 22: breastfeeding refer all
            ("replace",
             "Breastfeeding where there are sores on the breast. Sores elsewhere are a caution rather than an exclusion.",
             "Breastfeeding. Refer to a prescriber. NICE CKS advises specialist advice before antiviral treatment in a breastfeeding woman."),
            # Decision 23: dose row and renal threshold row
            ("replace",
             "Famciclovir, non-severe immunosuppression: 500 mg three times daily for 10 days.",
             "Famciclovir, non-severe immunosuppression: 500 mg three times daily for 10 days, which is the famciclovir SmPC course for herpes zoster in immunocompromised adults."),
            ("replace_contains",
             "Famciclovir: do not supply under this PGD where eGFR is below 60",
             "Famciclovir: do not supply under this PGD where eGFR is below 60 mL/min/1.73m². The famciclovir SmPC gives the full dose of 500 mg three times daily only at creatinine clearance 60 ml/min or above and reduces the dose below that, so 60 is the point at which the SmPC dosing ladder begins; it is also the valaciclovir threshold in this PGD and in the national Pharmacy First PGD."),
        ],
        "changes": [
            "Decision 18: the 72 hour inclusion criterion now reads aged 50 years or over, matching NICE CKS as summarised in part 2; it previously read age over 50.",
            "Decision 19: moderate or severe pain is defined as a score of 4 or more on a 0 to 10 scale and severe pain as 7 or more; elderly is defined as 65 years and over in the cautions and renal threshold rows; the training and records rows name the 0 to 10 scale.",
            "Decision 20: sacral dermatomes, including the buttocks, are stated to count as truncal, so sacral involvement does not meet the non-truncal criterion of the 72 hour window.",
            "Decision 22: breastfeeding is an exclusion in every case, referred to a prescriber, in line with the NICE CKS advice quoted in part 2; the previous distinction between sores on the breast and sores elsewhere is removed.",
            "Decision 23: the famciclovir SmPC (Famvir 500 mg film-coated tablets, Phoenix Labs, text revised 18 March 2019) is fetched and summarised in part 2 (dose and indication, renal dosing table, elderly, interactions, hepatic impairment, contraindications, pregnancy and breastfeeding, adverse effects and zoster warnings). The eGFR 60 threshold is confirmed against it: the SmPC gives the full 500 mg three times daily dose only at creatinine clearance 60 ml/min or above and reduces the dose below that, so the renal threshold row no longer describes it as an analogy. The 10 day course in non-severe immunosuppression is confirmed as the SmPC regimen for herpes zoster in immunocompromised adults.",
        ],
    },
    "herpes-management": {
        "edits": [
            ("replace",
             "Recurrent episode: 500mg twice daily for 3-5 days (starting within 48 hours of symptom onset)",
             "Recurrent episode: 500mg twice daily for 5 days (starting within 48 hours of symptom onset)"),
            ("replace",
             "First episode: 10 tablets (500mg twice daily for 5 days); a further 10 tablets, to 10 days, only where new lesions are still forming at day 5. Recurrent episode: 6 to 10 tablets (500mg twice daily for 3 to 5 days). Suppressive therapy: 28 tablets per 28 days, maximum 3 supplies (84 tablets) under this PGD before review",
             "First episode: 10 tablets (500mg twice daily for 5 days); a further 10 tablets, to 10 days, only where new lesions are still forming at day 5. Recurrent episode: 10 tablets (500mg twice daily for 5 days). Suppressive therapy: 28 tablets per 28 days, maximum 3 supplies (84 tablets) under this PGD before review"),
            ("replace",
             "First episode: 5 days, extended to 10 days only where new lesions are still forming at day 5. Recurrent episode: 3 to 5 days. Suppressive therapy: maximum 3 months (three 28 day supplies) under this PGD, then GP or GUM review before any further supply.",
             "First episode: 5 days, extended to 10 days only where new lesions are still forming at day 5. Recurrent episode: 5 days. Suppressive therapy: maximum 3 months (three 28 day supplies) under this PGD, then GP or GUM review before any further supply."),
        ],
        "changes": [
            "Decision 24: the valaciclovir recurrent episode course is fixed at 5 days, 10 tablets (500 mg twice daily), the upper end of the SmPC range, in the dose, quantity and treatment period rows; the previous 3 to 5 day range with no criterion for choosing is removed.",
        ],
    },
}
