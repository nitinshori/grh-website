# Round 5, batch G: decisions 48, 49, 51, 52, 53 and 54.
# Slugs: wegovy, mounjaro, mysimba, orlistat.
# Anchors verified against the masters in masters_r4.json with dump.py and a
# dry run of apply_edits on an in-memory copy of each docx.
#
# Decision 48 (wegovy and mounjaro): the endocrine-cause-of-obesity exclusion
# is removed. Treated hypothyroidism and Cushing's syndrome are fine to treat.
# The only endocrine wording that remains is a caution to inform the GP where
# an endocrine cause is suspected and has not been assessed or treated.
# Decision 49 (mounjaro): SmPC section 6 of the Mounjaro KwikPen SmPC (emc
# product 15481, text revised 29 August 2026, read 11 September 2026) is
# summarised into part 2 and the storage row is aligned to it. The SmPC gives
# 30 days unrefrigerated after first use, not 21 days, and says nothing about
# the carton or light.
# Decisions 51 to 53 (mysimba): age 75 and over excludes; eGFR below 60
# excludes and is referred; head trauma with loss of consciousness within the
# last 12 months excludes (older head trauma is a caution).
# Decision 54 (orlistat): exclusion for antiepileptics, antiretrovirals and
# amiodarone, matching the tool.

ENDOCRINE_CAUTION = (
    "An endocrine cause of obesity is not an exclusion under this PGD: a patient with treated "
    "hypothyroidism or treated Cushing's syndrome may be supplied. Where an endocrine cause is "
    "suspected and has not been assessed or treated, inform the GP so that it can be investigated "
    "and record this in the notes; this is a caution to inform the GP, not a reason to withhold supply."
)

EDITS = {
    "wegovy": {
        "edits": [
            # Decision 48: exclusion removed; caution to inform the GP added after the renal caution.
            ("delete", "Obesity caused by an endocrinological disorder. If the patient was already overweight prior to that diagnosis, this exclusion may not apply."),
            ("insert_after", "Mild to moderate renal impairment: monitor for dehydration secondary to gastrointestinal side effects.", [
                ENDOCRINE_CAUTION,
            ]),
        ],
        "changes": [
            "Decision 48: the exclusion for obesity caused by an endocrinological disorder is removed. An endocrine cause of obesity does not exclude; treated hypothyroidism and treated Cushing's syndrome may be supplied. A caution now says that where an endocrine cause is suspected and has not been assessed or treated the GP is informed so that it can be investigated.",
        ],
    },
    "mounjaro": {
        "edits": [
            # Decision 48: exclusion removed; caution to inform the GP added after the renal caution.
            ("delete", "Obesity caused by an endocrinological disorder. If the patient was already overweight prior to that diagnosis, this exclusion may not apply."),
            ("insert_after", "Mild to moderate renal impairment: monitor for dehydration secondary to gastrointestinal side effects.", [
                ENDOCRINE_CAUTION,
            ]),
            # Decision 49: part 2 source line now says section 6 was read.
            ("replace_contains", "sections 1 to 4.8 read. Summarised 10 September 2026.",
             "NICE technology appraisal guidance TA1026, Tirzepatide for managing overweight and obesity, published 23 December 2024, last updated 1 September 2025 (overview and recommendations chapter read, including the What this means in practice summary of NHS England's interim commissioning guidance). Mounjaro KwikPen 2.5 mg, 5 mg, 7.5 mg, 10 mg, 12.5 mg and 15 mg solution for injection in pre-filled pen, Summary of Product Characteristics, Eli Lilly and Company Limited, last updated on emc 8 September 2026 (medicines.org.uk product 15481), sections 1 to 4.8 read and summarised 10 September 2026; section 6 (text revised 29 August 2026) read and summarised 11 September 2026."),
            # Decision 49: the presentation block is widened to cover storage, and the section 6 summary
            # is added at the end of that block (insert_after copies the body paragraph formatting).
            ("replace", "Presentation and method of administration (SmPC sections 2 and 4.2)",
             "Presentation, method of administration and storage (SmPC sections 2, 4.2 and 6)"),
            ("insert_after", "The emc search for Mounjaro on 10 September 2026 returned only the six KwikPen products; no vial presentation is listed on emc.", [
                "Storage, shelf life and in-use period (SmPC sections 6.3, 6.4 and 6.6): store in a refrigerator (2°C to 8°C) and do not freeze; Mounjaro that has been frozen must not be used.",
                "The shelf life before first use is 24 months. After first use, the KwikPen may be stored unrefrigerated for up to 30 days at a temperature not above 30°C and must then be discarded.",
                "Each KwikPen contains 4 doses of 0.6 mL; any excess solution in the pen after use should be discarded. Inspect the product visually before use and discard it for particulate matter or discolouration. Needles are not included in the pack; packs contain 1 or 3 pre-filled KwikPens (section 6.5).",
            ]),
            # Decision 49: the 'not summarised' line in What the sources do not say is no longer true.
            ("replace", "The SmPC text retrieved ended within section 5, so storage, shelf life and in-use periods (section 6) are not summarised here.",
             "SmPC section 6 gives no instruction about keeping the pen in the carton or protecting it from light, and says nothing about travel."),
            # Decision 49: storage row aligned to SmPC section 6. The 21 day figure was wrong for the
            # KwikPen (30 days after first use); the carton and light bullet has no SmPC source and is
            # replaced by the inspection and discard instructions from section 6.6. The travel bullet
            # is retained as Get Real Health's practical advice.
            ("replace", "Once removed from refrigeration, may be stored unrefrigerated below 30°C for up to 21 days. Discard if not used within this period.",
             "After first use the KwikPen may be stored unrefrigerated at a temperature not above 30°C for up to 30 days, and must then be discarded (SmPC section 6.4). Before first use keep the pen in the refrigerator and do not use it after the expiry date on the label (shelf life 24 months)."),
            ("replace", "Keep the pen in the outer carton in order to protect from light.",
             "Inspect the solution before each use and do not use the pen if the solution contains particles or is discoloured. Any solution left in the pen after the fourth dose is discarded (SmPC section 6.6)."),
        ],
        "changes": [
            "Decision 48: the exclusion for obesity caused by an endocrinological disorder is removed. An endocrine cause of obesity does not exclude; treated hypothyroidism and treated Cushing's syndrome may be supplied. A caution now says that where an endocrine cause is suspected and has not been assessed or treated the GP is informed so that it can be investigated.",
            "Decision 49: SmPC section 6 (storage, shelf life and in-use period) of the Mounjaro KwikPen SmPC, text revised 29 August 2026, is summarised into part 2, and the storage row is aligned to it: after first use the KwikPen may be kept unrefrigerated at not above 30°C for up to 30 days and is then discarded (the row previously said 21 days, which is not the KwikPen figure); the carton and light bullet, which had no SmPC source, is replaced by the section 6.6 inspection and discard instructions; the travel bullet is kept as practical advice.",
        ],
    },
    "mysimba": {
        "edits": [
            # Decision 51: inclusion age band and a new exclusion at 75 and over.
            ("replace", "Age 18 years and over", "Age 18 to 74 years (inclusive)"),
            ("insert_after", "Uncontrolled hypertension (blood pressure ≥140/90 mmHg) or history of significant cardiovascular disease", [
                "Aged 75 years and over (the SmPC does not recommend Mysimba in patients over 75 years; refer to the GP)",
            ]),
            ("replace", "Elderly patients: Use with caution; dose adjustment may be necessary due to age-related changes in metabolism.",
             "Elderly patients aged 65 to 74 years: use with caution, as the SmPC advises; they may be more sensitive to adverse effects and are more likely to have reduced renal function (see the renal caution). Patients aged 75 years and over are excluded (see exclusion criteria)."),
            # Decision 53: head trauma with loss of consciousness within the last 12 months excludes;
            # older head trauma is a caution under the seizure threshold row.
            ("replace", "Seizure disorders or history of seizures or head trauma with loss of consciousness",
             "Seizure disorders or any history of seizures"),
            ("insert_after", "Seizure disorders or any history of seizures", [
                "Head trauma with loss of consciousness within the last 12 months",
            ]),
            ("replace", "Seizure threshold: Bupropion lowers seizure threshold; avoid concurrent use of medications that lower seizure threshold. Caution in patients with CNS conditions.",
             "Seizure threshold: Bupropion lowers seizure threshold; avoid concurrent use of medications that lower seizure threshold. Caution in patients with CNS conditions, and where there is a history of head trauma with loss of consciousness more than 12 months ago (within the last 12 months excludes; see exclusion criteria)."),
            # Decision 52: eGFR below 60 excludes and is referred; the SmPC reduced dose for eGFR 15 to 59
            # is a prescriber decision, not a pharmacy PGD supply.
            ("replace", "End-stage renal failure (eGFR <15 mL/min/1.73m²)",
             "Moderate or severe renal impairment, or end-stage renal failure (eGFR below 60 mL/min/1.73m²): refer to the GP. The reduced dose that the SmPC gives for eGFR 15 to 59 mL/min/1.73m² is a prescriber decision and is not supplied under this PGD"),
            ("replace", "Renal impairment: Use with caution in moderate to severe renal impairment; dose adjustment may be required.",
             "Renal impairment: eGFR below 60 mL/min/1.73m² excludes (see exclusion criteria). Mild renal impairment (eGFR 60 to 89 mL/min/1.73m²) needs no dose adjustment; use with caution. Ask about kidney disease and check any recent eGFR result. Where the patient has a condition that affects the kidneys (for example diabetes or hypertension) or reports kidney disease and no eGFR result is available, obtain one from the GP before supply."),
            ("insert_after", "weight, blood pressure and pulse recorded at this visit, and the 16-week weight result", [
                "any eGFR result relied on, with its date",
            ]),
        ],
        "changes": [
            "Decision 51: age 75 years and over is now an exclusion (the SmPC does not recommend Mysimba over 75); the inclusion criterion reads age 18 to 74 years and the elderly caution now covers 65 to 74 years.",
            "Decision 52: renal impairment with eGFR below 60 mL/min/1.73m² now excludes and is referred to the GP, because the reduced dose the SmPC gives for eGFR 15 to 59 is a prescriber decision; the renal caution now covers mild impairment (eGFR 60 to 89) and asks for an eGFR result where kidney disease is present or suspected, and the records row asks for any eGFR result relied on.",
            "Decision 53: head trauma with loss of consciousness now excludes only where it occurred within the last 12 months; the seizure exclusion reads seizure disorders or any history of seizures, and older head trauma with loss of consciousness is a caution under the seizure threshold row.",
        ],
    },
    "orlistat": {
        "edits": [
            # Decision 54: interaction exclusion naming antiepileptics, antiretrovirals and amiodarone.
            ("insert_after", "Warfarin therapy (relative contraindication; requires specialist assessment)", [
                "Concurrent antiepileptic medicines, antiretroviral medicines for HIV, or amiodarone, or any other medicine with an SmPC interaction that cannot be managed in a pharmacy setting (orlistat may reduce their absorption or plasma levels and unbalance treatment); refer to the GP or specialist",
            ]),
        ],
        "changes": [
            "Decision 54: an exclusion is added for concurrent antiepileptic medicines, antiretroviral medicines for HIV, amiodarone, or any other medicine with an SmPC interaction that cannot be managed in a pharmacy setting, matching the consultation tool.",
        ],
    },
}
