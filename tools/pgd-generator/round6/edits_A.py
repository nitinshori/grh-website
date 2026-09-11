# Round 6, batch A. Two decisions signed off jointly by the Medical Director and
# the Head Pharmacist on the evening of 11 September 2026.
#
# uti: the eGFR 45 mL/min gate for women aged 60 to 64 (a seen result within
# 12 months) applies to the nitrofurantoin arm only. The trimethoprim arm keeps
# the renal question as the document otherwise states it (YES or under renal
# follow-up: exclude; NO: proceed; does not know: exclude and refer for a renal
# function check first) without the eGFR 45 requirement. No new rule is added.
# Every renal anchor occurs twice in the document (once per arm): nth=1 is the
# nitrofurantoin arm, nth=2 the trimethoprim arm.
#
# shingles-vaccine: pregnancy and breastfeeding move from the exclusion criteria
# to the cautions, both arms, with a recorded discussion and decision. The
# guidance summary (part 2) is brought into line with Green Book chapter 28a
# (12 August 2025), which it summarises, so the document does not contradict
# itself.

EDITS = {
    "uti": {
        "edits": [
            # ── Trimethoprim arm first (second occurrence of each anchor,
            #    nth=2, counted against the unedited document) ──
            # Inclusion criteria
            ("replace",
             "Renal question answered as set out below; where aged 60 to 64, an eGFR of 45 mL/min or more within the last 12 months seen by the pharmacist and recorded.",
             "Renal question answered as set out below. The eGFR requirement for patients aged 60 to 64 applies to the nitrofurantoin arm only and is not a condition of this arm.",
             2),
            # Exclusion criteria
            ("replace",
             "Known kidney disease; or, in a patient aged 60 to 64, no eGFR result of 45 mL/min or more dated within the last 12 months seen by the pharmacist and recorded. See the renal row below.",
             "Known kidney disease. See the renal row below. The eGFR requirement for patients aged 60 to 64 applies to the nitrofurantoin arm only.",
             2),
            # Renal row
            ("replace",
             "Answer NO and aged 60 to 64: proceed only where an eGFR of 45 mL/min or more, dated within the last 12 months, has been seen by the pharmacist (NHS App, GP summary record or a letter) and the result, its date and where it was seen are recorded. Where no such result can be seen, or the result is below 45 mL/min or more than 12 months old: EXCLUDE. Refer for a renal function check first.\nThe patient does not know, at any age: EXCLUDE. Refer for a renal function check first.",
             "Answer NO and aged 60 to 64: proceed. No eGFR result is required for trimethoprim; the requirement for an eGFR of 45 mL/min or more applies to the nitrofurantoin arm only.\nThe patient does not know, at any age: EXCLUDE. Refer for a renal function check first.",
             2),
            # Records row
            ("replace",
             "The answer given on known kidney disease and, where the patient is aged 60 to 64, the eGFR result relied on, its date and where it was seen; and the answer given on previous episodes in the last 6 and 12 months.",
             "The answer given on known kidney disease (no eGFR result is required for trimethoprim); and the answer given on previous episodes in the last 6 and 12 months.",
             2),

            # ── Nitrofurantoin arm (now the only remaining occurrence of each
            #    anchor; nth=1 for safety) ──
            # Inclusion criteria
            ("replace",
             "Renal question answered as set out below; where aged 60 to 64, an eGFR of 45 mL/min or more within the last 12 months seen by the pharmacist and recorded.",
             "Renal question answered as set out below; where aged 60 to 64, an eGFR of 45 mL/min or more within the last 12 months seen by the pharmacist and recorded. This eGFR requirement applies to nitrofurantoin only.",
             1),
            # Exclusion criteria
            ("replace",
             "Known kidney disease; or, in a patient aged 60 to 64, no eGFR result of 45 mL/min or more dated within the last 12 months seen by the pharmacist and recorded. See the renal row below.",
             "Known kidney disease; or, in a patient aged 60 to 64, no eGFR result of 45 mL/min or more dated within the last 12 months seen by the pharmacist and recorded. The eGFR requirement applies to nitrofurantoin only. See the renal row below.",
             1),
            # Renal row
            ("replace",
             "Answer NO and aged 60 to 64: proceed only where an eGFR of 45 mL/min or more, dated within the last 12 months, has been seen by the pharmacist (NHS App, GP summary record or a letter) and the result, its date and where it was seen are recorded. Where no such result can be seen, or the result is below 45 mL/min or more than 12 months old: EXCLUDE. Refer for a renal function check first.\nThe patient does not know, at any age: EXCLUDE. Refer for a renal function check first.",
             "Answer NO and aged 60 to 64: proceed only where an eGFR of 45 mL/min or more, dated within the last 12 months, has been seen by the pharmacist (NHS App, GP summary record or a letter) and the result, its date and where it was seen are recorded. Where no such result can be seen, or the result is below 45 mL/min or more than 12 months old: EXCLUDE. Refer for a renal function check first. This eGFR requirement applies to the nitrofurantoin arm only; the trimethoprim arm states its own renal rule.\nThe patient does not know, at any age: EXCLUDE. Refer for a renal function check first.",
             1),
            # Records row
            ("replace",
             "The answer given on known kidney disease and, where the patient is aged 60 to 64, the eGFR result relied on, its date and where it was seen; and the answer given on previous episodes in the last 6 and 12 months.",
             "The answer given on known kidney disease and, where the patient is aged 60 to 64, the eGFR result relied on, its date and where it was seen (nitrofurantoin only); and the answer given on previous episodes in the last 6 and 12 months.",
             1),
        ],
        "changes": [
            "Decision, joint sign-off 11 September 2026: the eGFR gate for women aged 60 to 64 (a result of 45 mL/min or more, dated within the last 12 months, seen by the pharmacist and recorded) now applies to the nitrofurantoin arm only, and the nitrofurantoin inclusion, exclusion, renal and records rows say so; in the trimethoprim arm the renal question stands as before without the eGFR requirement (YES or under renal follow-up: exclude; NO: proceed at any age from 16 to 64; does not know: exclude and refer for a renal function check first), stated in its own inclusion, exclusion, renal and records rows, and no new rule is added; the consultation tool asks for the eGFR result, and stops without one, only when nitrofurantoin is the medicine selected.",
        ],
    },
    "shingles-vaccine": {
        "edits": [
            # Guidance summary (part 2): contraindications and precautions,
            # brought into line with Green Book chapter 28a, Pregnancy.
            ("delete", "Pregnancy (defer until after delivery)."),
            ("insert_after", "Check vaccine history prior to administration.", [
                "Pregnancy and breastfeeding: the Green Book states there is no known risk from giving a non-live vaccine in pregnancy or while breastfeeding, and that, if indicated, Shingrix can be considered in pregnancy after full discussion of the risks and benefits with the recipient. Inadvertent administration in pregnancy is reported to UKHSA on the vaccine in pregnancy (ViP) form.",
            ]),
            # Exclusion criteria, both arms: the pregnancy or breastfeeding
            # bullet is removed from the single paragraph of bullets.
            ("replace",
             "Both arms:\n- Hypersensitivity to any component of the vaccine.\n- Pregnancy or breastfeeding (not routinely recommended).\nArm 2 only (refer to the GP or treating specialist):\n- Aged under 18 years.\n- Immunosuppression that does not meet the Green Book Box 1 definition, including short courses of prednisolone up to 40mg a day for acute asthma, COPD or COVID-19, replacement corticosteroids, and topical or inhaled corticosteroids.\n- Primary humoral immunodeficiency (for example X-linked agammaglobulinaemia) without a T-cell defect, unless an immunologist has advised vaccination.\n- Not yet immunosuppressed but about to start immunosuppressive therapy: the treating specialist or GP can start the course before treatment on the Green Book timing (ideally one month, at least 14 days, before therapy).\n- Doubt whether the Box 1 definition is met that the specialist or GP has not resolved.",
             "Both arms:\n- Hypersensitivity to any component of the vaccine.\n- Pregnancy and breastfeeding are not exclusions: see the cautions row.\nArm 2 only (refer to the GP or treating specialist):\n- Aged under 18 years.\n- Immunosuppression that does not meet the Green Book Box 1 definition, including short courses of prednisolone up to 40mg a day for acute asthma, COPD or COVID-19, replacement corticosteroids, and topical or inhaled corticosteroids.\n- Primary humoral immunodeficiency (for example X-linked agammaglobulinaemia) without a T-cell defect, unless an immunologist has advised vaccination.\n- Not yet immunosuppressed but about to start immunosuppressive therapy: the treating specialist or GP can start the course before treatment on the Green Book timing (ideally one month, at least 14 days, before therapy).\n- Doubt whether the Box 1 definition is met that the specialist or GP has not resolved."),
            # Cautions row, both arms: the pregnancy and breastfeeding caution
            # is appended to the single multi-paragraph cell.
            ("replace",
             "Counsel patient that systemic side effects are common and generally self-limiting. In Arm 2 (and in immunosuppressed patients aged 50 and over) injection site pain, fatigue, myalgia, headache, shivering and fever are reported more often.\n\nObserve every patient for 15 minutes after vaccination, seated, and record that the observation period was completed (see Vaccine safety requirements).\n\nAllow appropriate spacing from other vaccines (e.g., COVID-19 or influenza) based on clinical judgement.\n\nArm 2: the immune response may be reduced; advise that protection may be limited. Give the second dose 8 weeks to 6 months after the first so that protection is not delayed.\n\nA second dose more than 6 months after the first is given as soon as possible; the course is not restarted and dose 1 is not repeated (Green Book chapter 28a).",
             "Counsel patient that systemic side effects are common and generally self-limiting. In Arm 2 (and in immunosuppressed patients aged 50 and over) injection site pain, fatigue, myalgia, headache, shivering and fever are reported more often.\n\nObserve every patient for 15 minutes after vaccination, seated, and record that the observation period was completed (see Vaccine safety requirements).\n\nAllow appropriate spacing from other vaccines (e.g., COVID-19 or influenza) based on clinical judgement.\n\nArm 2: the immune response may be reduced; advise that protection may be limited. Give the second dose 8 weeks to 6 months after the first so that protection is not delayed.\n\nA second dose more than 6 months after the first is given as soon as possible; the course is not restarted and dose 1 is not repeated (Green Book chapter 28a).\n\nPregnancy and breastfeeding, both arms: Shingrix is a non-live vaccine; the Green Book states it may be considered in pregnancy after discussion of the benefit and the lack of data; breastfeeding is not a contraindication. Record the discussion and the decision."),
            # Records row: the discussion and decision are recorded.
            ("insert_after",
             "where the patient is eligible for Shingrix on the NHS, that they were told it is free of charge on the NHS before the private supply",
             [
                 "where the patient is pregnant or breastfeeding, the discussion held under the cautions row and the decision reached",
             ]),
        ],
        "changes": [
            "Decision, joint sign-off 11 September 2026: pregnancy and breastfeeding move from the exclusion criteria to the cautions in both arms: Shingrix is a non-live vaccine; the Green Book states it may be considered in pregnancy after discussion of the benefit and the lack of data; breastfeeding is not a contraindication; the discussion and the decision are recorded, with a matching records bullet; the guidance summary no longer lists pregnancy as a contraindication and instead summarises Green Book chapter 28a (12 August 2025) on pregnancy and breastfeeding, including reporting of inadvertent administration in pregnancy to UKHSA; nothing else in the exclusion criteria changes; the consultation tool no longer stops on pregnancy or breastfeeding and instead requires the discussion and decision to be recorded and prints them on the record.",
        ],
    },
}
