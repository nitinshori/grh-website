# Round 5, batch D: signatories' decisions 25, 26, 27, 28, 29, 31 and 32.
# Slugs: genital-warts, cellulitis, skin-infection, wound-care, psoriasis.
# Anchors verified against the masters in masters_r4.json with dump.py and apply_edits.
# Where an anchor text occurs more than once, nth is given (descending order where the
# same anchor is replaced more than once, so each nth refers to the original document),
# or every occurrence is intended (identical rows in more than one arm).

CELLULITIS_REVIEW_CAUTION = (
    "- The 48-hour reassessment is performed in person by a pharmacist at the supplying pharmacy and is booked "
    "as an appointment before the patient leaves; a phone call is not sufficient. At the reassessment record "
    "whether the erythema is within or beyond the mark, the temperature, whether pain has improved, and the "
    "decision. Spread beyond the mark, no improvement, deterioration or an unclear diagnosis is a same-day "
    "referral. If the patient does not attend, contact them the same day; if they cannot be reached, record "
    "the attempt and inform the GP."
)

CELLULITIS_INCLUSION_REVIEW = (
    "- A reassessment at 48 hours at the supplying pharmacy has been booked before the patient leaves, and "
    "the date and time recorded."
)

CELLULITIS_FOLLOW_UP_REVIEW = (
    " Attend the 48-hour reassessment booked at this pharmacy. If the redness spreads beyond the marked edge "
    "before then, seek help the same day."
)

CELLULITIS_RECORDS_REVIEW = (
    "the time the margin of the erythema was marked, the date and time of the booked 48-hour reassessment at "
    "this pharmacy, and its outcome"
)

WOUND_ARM1_TETANUS_RULE = (
    "Arm 1 applies only where tetanus management for this wound, including any human tetanus immunoglobulin "
    "(HTIG), has been completed and is recorded, or the wound is not tetanus-prone; otherwise refer."
)

EDITS = {
    "genital-warts": {
        "edits": [
            # Decision 25: quantity row, podophyllotoxin arm
            ("replace", "1 bottle of solution (15mL) OR 1 tube of cream (5g) per treatment cycle",
             "One pack per course: 1 bottle of 0.5% solution (Warticon 3mL or Condyline 3.5mL) OR 1 tube of 0.15% "
             "cream (Warticon 5g). One pack covers the licensed course of up to 4 weekly cycles. A second pack may be "
             "supplied only at the review after 2 cycles, where warts persist and the first pack has been used; no "
             "more than 2 packs per course."),
            # Decision 25: dose row review line
            ("replace", "Review progress after 2 cycles; if warts persist, repeat for additional 2 cycles",
             "Review progress after 2 cycles; if warts persist, repeat for additional 2 cycles (a second pack may be "
             "supplied at this review only, and only where the first pack has been used)"),
            # Decision 25: name, form and strength names the marketed packs
            ("replace", "Podophyllotoxin 0.5% solution OR Podophyllotoxin 0.15% cream",
             "Podophyllotoxin 0.5% cutaneous solution (Warticon 3mL, Condyline 3.5mL) OR Podophyllotoxin 0.15% "
             "cream (Warticon 5g)"),
            # Decision 25: follow-up advice, podophyllotoxin arm
            ("replace", "For podophyllotoxin: apply twice daily for 3 consecutive days (e.g. Mon-Wed morning and evening), then rest for 4 days (Thu-Sun). Repeat for up to 4 cycles.",
             "For podophyllotoxin: apply twice daily for 3 consecutive days (e.g. Mon-Wed morning and evening), then "
             "rest for 4 days (Thu-Sun). Repeat for up to 4 cycles. One pack normally lasts the whole course; a "
             "second pack is supplied only at your review after 2 cycles if the warts persist."),
        ],
        "changes": [
            "Decision 25: podophyllotoxin is now one pack per course (one 3mL Warticon or 3.5mL Condyline bottle, or one 5g Warticon tube), with a second pack only at the review after 2 cycles where warts persist; the quantity row, the dose row, the medicine row and the follow-up advice all say so, and the 15mL bottle that is not marketed is no longer named.",
        ],
    },
    "cellulitis": {
        "edits": [
            # Decision 26: flucloxacillin arm exclusion list loses pregnancy and breastfeeding
            ("replace_contains", "- Known allergy or hypersensitivity to penicillins or beta-lactam antibiotics.",
             "- Known allergy or hypersensitivity to penicillins or beta-lactam antibiotics.\n"
             "- Any sign of systemic illness or sepsis: temperature 38°C or above or below 36°C, heart rate above 90, respiratory rate 20 or above, systolic blood pressure below 100, new confusion, or rigors (call 999 or send to A&E).\n"
             "- Suspected necrotising fasciitis: pain out of proportion to the appearance, rapid spread, skin discolouration, crepitus or blistering (999).\n"
             "- Periorbital, orbital or facial cellulitis (same-day urgent referral).\n"
             "- Cellulitis of a diabetic foot, or in a limb with lymphoedema or chronic venous ulceration (same-day GP referral).\n"
             "- Immunosuppression, including chemotherapy, biologics, long-term oral steroids, or poorly controlled diabetes.\n"
             "- Cellulitis following an animal or human bite, or with fresh water or sea water exposure (different organisms; refer).\n"
             "- Suspected deep vein thrombosis, or redness of both legs (usually not cellulitis; refer).\n"
             "- Abscess requiring drainage or infected wound needing surgical review.\n"
             "- Not improving after 48 hours of an antibiotic, or a second episode at the same site within 3 months (refer)."),
            # Decision 26: clarithromycin and doxycycline arms keep the exclusion and point to the flucloxacillin arm
            ("replace_contains", "- Known allergy or hypersensitivity to macrolides.",
             "- Known allergy or hypersensitivity to macrolides.\n"
             "- Any sign of systemic illness or sepsis: temperature 38°C or above or below 36°C, heart rate above 90, respiratory rate 20 or above, systolic blood pressure below 100, new confusion, or rigors (call 999 or send to A&E).\n"
             "- Suspected necrotising fasciitis: pain out of proportion to the appearance, rapid spread, skin discolouration, crepitus or blistering (999).\n"
             "- Periorbital, orbital or facial cellulitis (same-day urgent referral).\n"
             "- Cellulitis of a diabetic foot, or in a limb with lymphoedema or chronic venous ulceration (same-day GP referral).\n"
             "- Immunosuppression, including chemotherapy, biologics, long-term oral steroids, or poorly controlled diabetes.\n"
             "- Cellulitis following an animal or human bite, or with fresh water or sea water exposure (different organisms; refer).\n"
             "- Suspected deep vein thrombosis, or redness of both legs (usually not cellulitis; refer).\n"
             "- Abscess requiring drainage or infected wound needing surgical review.\n"
             "- Not improving after 48 hours of an antibiotic, or a second episode at the same site within 3 months (refer).\n"
             "- Pregnant or breastfeeding individuals (use the flucloxacillin arm where there is no penicillin allergy; otherwise refer)."),
            ("replace_contains", "- Known allergy or hypersensitivity to doxycycline or other tetracycline antibiotics.",
             "- Known allergy or hypersensitivity to doxycycline or other tetracycline antibiotics.\n"
             "- Any sign of systemic illness or sepsis: temperature 38°C or above or below 36°C, heart rate above 90, respiratory rate 20 or above, systolic blood pressure below 100, new confusion, or rigors (call 999 or send to A&E).\n"
             "- Suspected necrotising fasciitis: pain out of proportion to the appearance, rapid spread, skin discolouration, crepitus or blistering (999).\n"
             "- Periorbital, orbital or facial cellulitis (same-day urgent referral).\n"
             "- Cellulitis of a diabetic foot, or in a limb with lymphoedema or chronic venous ulceration (same-day GP referral).\n"
             "- Immunosuppression, including chemotherapy, biologics, long-term oral steroids, or poorly controlled diabetes.\n"
             "- Cellulitis following an animal or human bite, or with fresh water or sea water exposure (different organisms; refer).\n"
             "- Suspected deep vein thrombosis, or redness of both legs (usually not cellulitis; refer).\n"
             "- Abscess requiring drainage or infected wound needing surgical review.\n"
             "- Not improving after 48 hours of an antibiotic, or a second episode at the same site within 3 months (refer).\n"
             "- Pregnancy or breastfeeding (doxycycline is contraindicated; use the flucloxacillin arm where there is no penicillin allergy; otherwise refer)."),
            # Decisions 26 and 28: cautions. The flucloxacillin and clarithromycin cautions rows are identical,
            # so the clarithromycin row (nth 2) is replaced first, then the flucloxacillin row (nth 1).
            ("replace",
             "- Use with caution in patients with renal impairment or history of hepatic issues.\n"
             "- Advise patients to complete the full course and report any side effects.\n"
             "- Consider Clostridioides difficile risk in patients with recent antibiotic use or hospitalisation.",
             "- Use with caution in patients with renal impairment or history of hepatic issues.\n"
             "- Advise patients to complete the full course and report any side effects.\n"
             "- Consider Clostridioides difficile risk in patients with recent antibiotic use or hospitalisation.\n"
             + CELLULITIS_REVIEW_CAUTION, 2),
            ("replace",
             "- Use with caution in patients with renal impairment or history of hepatic issues.\n"
             "- Advise patients to complete the full course and report any side effects.\n"
             "- Consider Clostridioides difficile risk in patients with recent antibiotic use or hospitalisation.",
             "- Use with caution in patients with renal impairment or history of hepatic issues.\n"
             "- Advise patients to complete the full course and report any side effects.\n"
             "- Consider Clostridioides difficile risk in patients with recent antibiotic use or hospitalisation.\n"
             "- Pregnancy and breastfeeding: flucloxacillin may be supplied where clinically indicated. Flucloxacillin is "
             "the NICE NG141 first-line choice in pregnancy and the SmPC does not contraindicate it in pregnancy or "
             "breastfeeding; this matches the Skin and Soft Tissue Infection PGD. Record that the patient is pregnant "
             "or breastfeeding and the indication. The clarithromycin and doxycycline arms remain excluded in "
             "pregnancy and breastfeeding.\n"
             + CELLULITIS_REVIEW_CAUTION, 1),
            ("replace",
             "- Use with caution in patients with renal impairment or history of hepatic issues (or concurrently receiving potentially hepatotoxic drugs).\n"
             "- Advise patients to complete the full course and report any side effects.\n"
             "- Consider Clostridioides difficile risk in patients with recent antibiotic use or hospitalisation.",
             "- Use with caution in patients with renal impairment or history of hepatic issues (or concurrently receiving potentially hepatotoxic drugs).\n"
             "- Advise patients to complete the full course and report any side effects.\n"
             "- Consider Clostridioides difficile risk in patients with recent antibiotic use or hospitalisation.\n"
             + CELLULITIS_REVIEW_CAUTION),
            # Decision 28: inclusion criteria in all three arms require the booked reassessment
            ("replace_contains", "- No known allergy to penicillins.",
             "- Adults aged 18 years or older.\n"
             "- MILD cellulitis (Eron class I) of a limb or the trunk: localised erythema, warmth, swelling and pain, with NO fever, NO tachycardia, NO hypotension, NO confusion and NO rapidly spreading margin.\n"
             "- The margin of the erythema has been marked and the time recorded, so that spread can be judged at review.\n"
             + CELLULITIS_INCLUSION_REVIEW + "\n"
             "- No known allergy to penicillins.\n"
             "- Informed consent obtained."),
            ("replace_contains", "- No known allergy to macrolides.",
             "- Adults aged 18 years or older.\n"
             "- MILD cellulitis (Eron class I) of a limb or the trunk: localised erythema, warmth, swelling and pain, with NO fever, NO tachycardia, NO hypotension, NO confusion and NO rapidly spreading margin.\n"
             "- The margin of the erythema has been marked and the time recorded, so that spread can be judged at review.\n"
             + CELLULITIS_INCLUSION_REVIEW + "\n"
             "- No known allergy to macrolides.\n"
             "- Informed consent obtained."),
            ("replace_contains", "- No known allergy to doxycycline or other tetracyclines.",
             "- Adults aged 18 years or older.\n"
             "- MILD cellulitis (Eron class I) of a limb or the trunk: localised erythema, warmth, swelling and pain, with NO fever, NO tachycardia, NO hypotension, NO confusion and NO rapidly spreading margin.\n"
             "- The margin of the erythema has been marked and the time recorded, so that spread can be judged at review.\n"
             + CELLULITIS_INCLUSION_REVIEW + "\n"
             "- No known allergy to doxycycline or other tetracyclines.\n"
             "- Informed consent obtained."),
            # Decision 28: follow-up advice in all three arms (the flucloxacillin and doxycycline rows are identical;
            # the clarithromycin row differs by one word)
            ("replace",
             "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 2-3 days, if they have severe pain out of proportion to the infection or if the redness and swelling continues to develop beyond the initial presentation, or they become systemically very unwell.",
             "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 2-3 days, if they have severe pain out of proportion to the infection or if the redness and swelling continues to develop beyond the initial presentation, or they become systemically very unwell."
             + CELLULITIS_FOLLOW_UP_REVIEW),
            ("replace",
             "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 2-3 days, if they have severe pain out of proportion to the infection or if the redness and swelling continue to develop beyond the initial presentation, or they become systemically very unwell.",
             "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 2-3 days, if they have severe pain out of proportion to the infection or if the redness and swelling continue to develop beyond the initial presentation, or they become systemically very unwell."
             + CELLULITIS_FOLLOW_UP_REVIEW),
            # Decision 28: records row in all three arms
            ("insert_after", "advice given, including advice given if excluded or declines treatment",
             [CELLULITIS_RECORDS_REVIEW]),
            # Decision 28: guidance summary names the owner of the reassessment
            ("replace", "Reassess within 48 hours to check response to antibiotics.",
             "Reassess within 48 hours to check response to antibiotics. Under this PGD the reassessment is booked at the supplying pharmacy before the patient leaves and is performed in person by a pharmacist."),
        ],
        "changes": [
            "Decision 26: pregnancy and breastfeeding are no longer exclusions in the flucloxacillin arm; flucloxacillin may be supplied where clinically indicated (NICE NG141 first line in pregnancy; SmPC), matching the Skin and Soft Tissue Infection PGD, with a caution to record the indication. The clarithromycin and doxycycline arms keep the exclusion and point to the flucloxacillin arm where there is no penicillin allergy.",
            "Decision 28: a reassessment at 48 hours at the supplying pharmacy, booked before the patient leaves, is now an inclusion criterion in all three arms; the cautions state who performs it, what is recorded and what happens if the patient does not attend; the follow-up advice, the records row and the guidance summary say so.",
        ],
    },
    "skin-infection": {
        "edits": [
            # Decision 27: Appendix 1, age 12 and over, pulse threshold matches the Cellulitis PGD
            ("replace", "Pulse: REFER if above 110 at rest.",
             "Pulse: REFER if above 90 at rest. (This matches the Cellulitis PGD, which is used by the same staff for the same presentation.)"),
            ("replace", "These match the Acute Bacterial Bronchitis PGD, which starts at 12, so the two documents agree for the ages they share.",
             "The respiratory rate, temperature, blood pressure, oxygen saturation and consciousness thresholds match the Acute Bacterial Bronchitis PGD, which starts at 12, so the two documents agree for the ages they share. The pulse threshold of 90 is the stricter figure from the Cellulitis PGD."),
        ],
        "changes": [
            "Decision 27: the Appendix 1 pulse threshold for patients aged 12 and over is now above 90 at rest, matching the Cellulitis PGD; the note on agreement with the Acute Bacterial Bronchitis PGD is qualified accordingly.",
        ],
    },
    "wound-care": {
        "edits": [
            # Decision 29: Arm 1 introduction and indication
            ("replace", "Choose this arm where the wound is a bite, or is heavily contaminated with soil or organic material. Pasteurella and Eikenella are not reliably covered by flucloxacillin.",
             "Choose this arm where the wound is a bite, or is heavily contaminated with soil or organic material. Pasteurella and Eikenella are not reliably covered by flucloxacillin. "
             + WOUND_ARM1_TETANUS_RULE + " A heavily contaminated wound is tetanus-prone and usually high-risk, so HTIG will often have been needed: it is not supplied under this or any GRH PGD."),
            ("replace", "Infected animal or human bite wounds, and infected heavily contaminated wounds, in patients aged 12 years and over.",
             "Infected animal or human bite wounds, and infected heavily contaminated wounds, in patients aged 12 years and over, where tetanus management for the wound, including any HTIG, has been completed and recorded, or the wound is not tetanus-prone."),
            # Decision 29: Arm 1 inclusion criterion (nth 1: the Arm 2 row is identical and is not changed)
            ("replace", "Tetanus immunisation status established and up to date, or the patient referred for it separately.",
             "Tetanus status resolved, and recorded, as ONE of: (a) the wound is not tetanus-prone (UKHSA definition, Appendix 1); or (b) tetanus management for this wound, including any human tetanus immunoglobulin (HTIG) and any vaccine dose, has been completed and is recorded (for example HTIG and Td/IPV given at an emergency department at the time of injury, or a Td/IPV dose given today under the Tetanus (Td/IPV) PGD, or immunisation up to date with nothing further indicated). Where HTIG or a vaccine dose is indicated and has not been given, refer; do not supply under this arm.", 1),
            # Decision 29: Arm 1 exclusion bullet (nth 1)
            ("replace",
             "HIGH-RISK tetanus-prone wound, where human tetanus immunoglobulin (HTIG) may be indicated: a tetanus-prone wound with heavy contamination by material likely to contain tetanus spores (for example soil or manure) and/or extensive devitalised tissue (UKHSA definition). Refer the same day; HTIG is not covered by this PGD. Presentation more than 6 hours after injury, a puncture wound or a burn make a wound tetanus-prone, not high-risk: a wound that needs only a vaccine dose is handled under the Tetanus (Td/IPV) PGD and does not exclude this supply. Burns and wounds with systemic sepsis are outside this PGD in any case: refer.",
             "HIGH-RISK tetanus-prone wound, where human tetanus immunoglobulin (HTIG) may be indicated: a tetanus-prone wound with heavy contamination by material likely to contain tetanus spores (for example soil or manure) and/or extensive devitalised tissue (UKHSA definition), UNLESS tetanus management for this wound, including HTIG, has already been completed and is recorded (for example at an emergency department at the time of injury). Where it has not, refer the same day; HTIG is not covered by this PGD. Presentation more than 6 hours after injury, a puncture wound or a burn make a wound tetanus-prone, not high-risk: a wound that needs only a vaccine dose is handled under the Tetanus (Td/IPV) PGD and does not exclude this supply. Burns and wounds with systemic sepsis are outside this PGD in any case: refer.", 1),
            # Decision 29: actions if excluded, tetanus paragraph (Arm 1; Arm 2 says "As Arm 1")
            ("replace", "FOR TETANUS: where the wound is high risk and immunoglobulin may be indicated, refer the same day; immunoglobulin is not covered by this or any GRH PGD. Where a vaccine dose is all that is needed (last dose more than 10 years ago whatever the dose count, or an incomplete history) and the patient is aged 10 or over, the Tetanus (Td/IPV) PGD may be used.",
             "FOR TETANUS: where the wound is high risk and immunoglobulin may be indicated, refer the same day; immunoglobulin is not covered by this or any GRH PGD. Where a vaccine dose is all that is needed (last dose more than 10 years ago whatever the dose count, or an incomplete history) and the patient is aged 10 or over, the Tetanus (Td/IPV) PGD may be used. Arm 1 (bites and heavily contaminated wounds) applies only where tetanus management for the wound, including any HTIG, has been completed and recorded, or the wound is not tetanus-prone: a patient referred for HTIG may return for the antibiotic once that management is complete and recorded."),
            # Decision 29: Arm 1 records row (nth 1)
            ("replace", "Tetanus immunisation status and the action taken.",
             "Tetanus immunisation status and the action taken, including that tetanus management for this wound (any HTIG and any vaccine dose) was completed and where and when, or that the wound is not tetanus-prone.", 1),
            # Decision 29: Appendix 1 tetanus bullet
            ("replace", "A HIGH-RISK tetanus-prone wound (a tetanus-prone wound with heavy contamination by material likely to contain tetanus spores, such as soil or manure, and/or extensive devitalised tissue) needs immunoglobulin: refer the same day. Immunoglobulin is not covered by any GRH PGD.",
             "A HIGH-RISK tetanus-prone wound (a tetanus-prone wound with heavy contamination by material likely to contain tetanus spores, such as soil or manure, and/or extensive devitalised tissue) needs immunoglobulin: refer the same day. Immunoglobulin is not covered by any GRH PGD. Where immunoglobulin and any vaccine dose have already been given for this wound and are recorded, tetanus management is complete and an infected bite or heavily contaminated wound may be treated under Arm 1 if otherwise eligible."),
            # Decision 31: Arm 2 dose and quantity for 10 to 17 unable to swallow capsules
            ("replace", "Adults and children 10 years and over: 500mg four times daily.",
             "Adults and children 10 years and over: 500mg four times daily. A child aged 10 to 17 who cannot swallow capsules takes the same 500mg dose as 10 mL of the 250mg/5mL suspension four times daily. CHECK THE VOLUME AGAINST THE STRENGTH BEFORE SUPPLY: the 250mg/5mL suspension delivers 50mg per mL."),
            ("replace", "Suspension: 100mL for 5 days, 140mL for 7 days.",
             "Suspension, 2 to 9 years (250mg, 5 mL four times daily): 100mL for 5 days, 140mL for 7 days.\n"
             "Suspension, 10 to 17 years unable to swallow capsules (500mg, 10 mL four times daily): 200mL for 5 days, 280mL for 7 days."),
        ],
        "changes": [
            "Decision 29: Arm 1 (co-amoxiclav) applies only where tetanus management for the wound, including any HTIG, has been completed and recorded, or the wound is not tetanus-prone; otherwise refer. The Arm 1 introduction, indication, inclusion criterion, HTIG exclusion, tetanus action, records row and the Appendix 1 tetanus bullet state this, so a heavily contaminated wound whose HTIG was given at an emergency department can be treated.",
            "Decision 31: the flucloxacillin arm now states the suspension dose and quantity for a child aged 10 to 17 who cannot swallow capsules: 500mg as 10 mL of the 250mg/5mL suspension four times daily, 200mL for 5 days or 280mL for 7 days.",
        ],
    },
    "psoriasis": {
        "edits": [
            # Decision 32: body surface ceiling lowered from 30% to 10%
            ("replace", "Psoriasis affecting more than 30% of the body surface, or needing more than 15g of product in a day. Refer.",
             "Psoriasis affecting more than 10% of the body surface (NICE's threshold for extensive disease), or needing more than 15g of product in a day. Refer."),
            ("replace", "MAXIMUM 15 g A DAY of calcipotriol containing products in total, across all such products the person is using. THE TOTAL BODY SURFACE AREA TREATED SHOULD NOT EXCEED 30%.",
             "MAXIMUM 15 g A DAY of calcipotriol containing products in total, across all such products the person is using. THE TOTAL BODY SURFACE AREA TREATED SHOULD NOT EXCEED 30% (the licence limit). THIS PGD APPLIES A LOWER CEILING OF 10% OF BODY SURFACE; ABOVE THAT, REFER."),
            ("replace", "Topical treatment alone may not give satisfactory control, especially where psoriasis is extensive (for example more than 10% of body surface area) or is at least moderate on the static physician global assessment. NICE's 10% figure is a threshold for considering specialist referral; the 30% ceiling in this PGD is the calcipotriol licence limit.",
             "Topical treatment alone may not give satisfactory control, especially where psoriasis is extensive (for example more than 10% of body surface area) or is at least moderate on the static physician global assessment. NICE's 10% figure is a threshold for considering specialist referral, and it is the ceiling applied in this PGD: psoriasis affecting more than 10% of body surface is referred, not supplied. The calcipotriol licence limit of 30% is not the PGD ceiling."),
            ("replace", "Tell the person not to exceed 15 g a day in total from all calcipotriol containing products, not to treat more than 30% of the body surface area, and not to use occlusive dressings.",
             "Tell the person not to exceed 15 g a day in total from all calcipotriol containing products, not to treat more than 10% of the body surface area (the ceiling applied under this PGD; the licence limit is 30%), and not to use occlusive dressings."),
            ("replace", "MAXIMUM 30% OF BODY SURFACE treated. Above that, refer; do not supply and advise partial use.",
             "MAXIMUM 10% OF BODY SURFACE affected (NICE's threshold for extensive disease). Above that, refer; do not supply and advise partial use. The calcipotriol licence limit of 30% is not the ceiling for this PGD."),
            ("replace", "All users must be able to estimate body surface area using the patient’s palm as roughly 1%, and to apply the 30% limit.",
             "All users must be able to estimate body surface area using the patient’s palm as roughly 1%, and to apply the 10% limit."),
            ("replace", "Affected area 30% of body surface or less. Use the patient’s palm as roughly 1%.",
             "Affected area 10% of body surface or less. Use the patient’s palm as roughly 1%."),
            ("replace", "More than 30% of body surface affected, or the patient would need more than 15g in a day.",
             "More than 10% of body surface affected (extensive disease on NICE's definition: refer for specialist advice), or the patient would need more than 15g in a day."),
            ("replace", "Apply once daily to affected areas. MAXIMUM 15g IN ANY ONE DAY. Body surface treated must not exceed 30%.",
             "Apply once daily to affected areas. MAXIMUM 15g IN ANY ONE DAY. Body surface treated must not exceed 10% (the PGD ceiling; the licence limit is 30%)."),
            ("replace", "30% is roughly thirty palms. In practice, if psoriasis covers more than about a third of the body, refer.",
             "10% is roughly ten palms, about one arm's worth of skin (rule of nines: one arm is about 9%). In practice, if psoriasis covers more than about one arm's worth of skin, refer."),
            ("replace", "The 30% limit exists because of calcipotriol and the risk of hypercalcaemia, not because of the steroid.",
             "The 10% ceiling is NICE's threshold for extensive psoriasis, where topical treatment alone is unlikely to give satisfactory control and specialist referral should be considered. The calcipotriol licence limit of 30% (hypercalcaemia risk) still applies to any use and is never reached under this PGD."),
        ],
        "changes": [
            "Decision 32: the body surface ceiling is lowered from 30% to 10% (NICE's threshold for extensive disease), with referral above it; the guidance summary, the SmPC summary, the training requirement, the inclusion and exclusion criteria, the dose row, the counselling and Appendix 2 all state 10%, and the 30% calcipotriol licence limit is described as a licence limit that is never reached under this PGD.",
        ],
    },
}
