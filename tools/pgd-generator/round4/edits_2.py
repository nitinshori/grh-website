# Round 4, batch 2: document corrections (A items) and decisions (B items)
# for rsv, shingles-vaccine, covid-booster, flu, hpv, shingles-treatment,
# herpes-management, cold-sores, genital-warts, skin-infection, cellulitis,
# impetigo, wound-care, eczema, psoriasis, sore-throat, chest-service,
# dental-bridging.
#
# Every anchor below was checked against the current master docx with
# dump.py and the hit count noted. Edits apply in order; where an anchor
# matches more than one paragraph and nth is not given, every hit is
# intended (the same row appears in each arm).

CHANGE_HISTORY_POINTER = "Later versions: see the Version and change record at the end of this document."

RUN_TOGETHER_RECORDS = [
    ("replace", "date of supply dose, form and route quantity supplied",
     "date of supply, dose, form and route, and quantity supplied"),
    ("replace", "details of any adverse drug reactions and actions taken supplied via PGD",
     "details of any adverse drug reactions and actions taken"),
    ("insert_after", "details of any adverse drug reactions and actions taken",
     ["that the medicine was supplied via PGD"]),
]

EDITS = {
    "rsv": {
        "edits": [
            # Title: prevention, not treatment (2 arms share one cover paragraph)
            ("replace_contains", "for the treatment to delay Respiratory Syncytial Virus",
             "Patient Group Direction\nfor the administration of Abrysvo or Arexvy for active immunisation against Respiratory Syncytial Virus (RSV)"),
            # Guidance summary: nirsevimab is not supplied under this PGD; Arexvy was missing
            ("replace", "1. Long-acting Monoclonal Antibody (nirsevimab – Beyfortus®)",
             "1. Long-acting monoclonal antibody (nirsevimab, Beyfortus): NHS infant programme only, not supplied under this PGD"),
            ("insert_after_contains", "This PGD's inclusion is 28 to 36 weeks; after 36 weeks refer to the maternity service.",
             ["3. Older adult RSV vaccines (Arexvy, adjuvanted RSVPreF3, and Abrysvo, bivalent RSVpreF)",
              "Both are licensed for adults aged 60 years and over as a single 0.5 mL intramuscular dose, and both are supplied under this PGD for that group. Abrysvo is the only one of the two that may be used in pregnancy; Arexvy must not be given to anyone who is pregnant or breastfeeding."]),
            ("replace", "Infants – Nirsevimab",
             "Infants: nirsevimab (NHS programme, not supplied under this PGD)"),
            ("replace", "Older Adults (Awaiting Wider Rollout)", "Older Adults"),
            ("replace", "JCVI supports potential use in adults ≥75 years and 65–74 years with risk factors, but routine vaccination not yet implemented across the UK.",
             "The NHS older adult programme has run since 1 September 2024 and offers a single dose at 75 to 79 years, following the JCVI advice of June 2023 (adults 75 and over, and 65 to 74 with risk factors). Both vaccines are licensed from 60 years, and this PGD supplies privately from 60 years."),
            # Administration table: replace the nirsevimab row with Arexvy and state the Abrysvo volume
            ("replace", "Nirsevimab", "Arexvy (adjuvanted RSVPreF3)"),
            ("replace", "Single 50 mg or 100 mg dose (age/weight-based)", "Single 0.5 mL dose (60 years and over)"),
            ("replace", "Abrysvo (Maternal RSV)", "Abrysvo (bivalent RSVpreF)"),
            ("replace", "Single dose", "Single 0.5 mL dose (60 years and over, or pregnancy at 28 to 36 weeks)"),
            ("replace", "Can be co-administered with other vaccines (e.g. influenza, COVID-19), depending on current UKHSA advice.",
             "Can be co-administered with other vaccines (e.g. influenza, COVID-19), depending on current UKHSA advice; in older adults RSV vaccine is not routinely scheduled at the same appointment as influenza vaccine (see the Abrysvo cautions)."),
            # Abrysvo caution: 24 weeks (SmPC data) and 28 weeks (PGD limit) stated as two separate facts
            ("replace", "- Abrysvo has not been studied in pregnant individuals less than 24 weeks of gestation and should not be used in pregnant individuals less than 28 weeks of gestation.",
             "- Abrysvo has not been studied in pregnant individuals below 24 weeks of gestation (SmPC). Under this PGD it must not be given before 28 weeks of gestation."),
            # Typos
            ("replace_contains", "Ther is no evidence that the Arexvy vaccine is safe in these groups.",
             "- Arexvy should not be administered to those who are pregnant or breastfeeding. There is no evidence that the Arexvy vaccine is safe in these groups."),
            ("replace_contains", "make not have a full immune response",
             "• Immunosuppressed individuals should be advised that they may not have a full immune response to the vaccine."),
            # Follow-up row copied from a treatment template (2 arms)
            ("replace", "• To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 weeks, or they become systemically very unwell.",
             "• To seek medical advice if side effects are severe or last more than a few days, and to seek urgent help for any sign of an allergic reaction after leaving the pharmacy."),
            # Change history tables stop at v001 (2 arms)
            ("insert_after", "Development & issue of new PGD", [CHANGE_HISTORY_POINTER]),
        ],
        "changes": [
            "Cover title corrected from treatment to active immunisation against RSV.",
            "Guidance summary corrected: nirsevimab marked as an NHS infant product not supplied under this PGD, Arexvy added, the older adult NHS programme stated as running since September 2024, and the administration table now lists Arexvy and Abrysvo with the 0.5 mL dose.",
            "Abrysvo pregnancy caution reworded so that the 24 week SmPC statement and the 28 week PGD limit are two separate facts.",
            "Typos corrected in the Arexvy pregnancy exclusion (There is) and the immunosuppression follow-up advice (may not).",
            "Follow-up advice row replaced the treatment template wording (3 to 4 weeks) with vaccination advice in both arms.",
            "Change history tables now point to the version and change record for versions after 001.",
        ],
    },
    "shingles-vaccine": {
        "edits": [
            # Zostavax is withdrawn and not supplied; remove it from the guidance summary
            ("replace", "There are two shingles vaccines currently in use in the UK:",
             "Shingrix is the only shingles vaccine in use in the UK programme. Zostavax (live attenuated) was withdrawn from the programme on 1 September 2023, is no longer supplied, and is not authorised under this PGD."),
            ("delete", "Zostavax® (live attenuated)"),
            ("delete", "Only used if Shingrix is contraindicated or unavailable."),
            ("delete", "Not recommended for immunocompromised individuals."),
            ("delete", "Single subcutaneous dose for those aged 70–79 years (if previously eligible and missed)."),
            ("replace", "Unvaccinated individuals aged 70–79 remain eligible under the original Zostavax® programme if not contraindicated.",
             "Unvaccinated individuals aged 70 to 79 who missed the earlier programme remain eligible for Shingrix on the NHS."),
            ("delete", "Zostavax®:"),
            ("delete", "Single dose only."),
            ("delete", "Zostavax (live vaccine):"),
            ("delete", "Immunosuppressed individuals."),
            ("delete", "Hypersensitivity to gelatin or neomycin (if present in the formulation)."),
            ("delete", "Zostavax: Injection site reactions, mild rash, headache."),
            ("delete", "Zostavax: Around 50–60% effective, lower efficacy in older adults."),
            # Cautions row did not state the 15 minute observation that the safety block requires
            ("replace_contains", "Allow appropriate spacing from other vaccines (e.g., COVID-19 or influenza) based on clinical judgement.",
             "Counsel patient that systemic side effects are common and generally self-limiting.\n \nObserve every patient for 15 minutes after vaccination, seated, and record that the observation period was completed (see Vaccine safety requirements).\n \nAllow appropriate spacing from other vaccines (e.g., COVID-19 or influenza) based on clinical judgement."),
            # Follow-up row copied from a treatment template
            ("replace", "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 weeks, or they become systemically very unwell.",
             "To seek medical advice if side effects are severe or last more than a few days, and to seek urgent help for any sign of an allergic reaction after leaving the pharmacy. Remind the patient of the date the second dose is due."),
            # Change history table stops at v001
            ("insert_after", "Development & issue of new PGD", [CHANGE_HISTORY_POINTER]),
        ],
        "changes": [
            "Guidance summary no longer describes Zostavax, which was withdrawn from the UK programme in September 2023 and is not supplied under this PGD; the 70 to 79 catch-up now refers to Shingrix.",
            "Cautions row now states the 15 minute seated observation that the vaccine safety requirements already impose.",
            "Follow-up advice row replaced the treatment template wording (3 to 4 weeks) with vaccination advice and a reminder of the second dose date.",
            "Change history table now points to the version and change record for versions after 001.",
        ],
    },
    "covid-booster": {
        "edits": [
            # Exclusion header says refer, do not vaccinate; the myocarditis bullet implied Nuvaxovid was acceptable
            ("replace", "History of myocarditis or pericarditis following a previous dose of an mRNA COVID-19 vaccine. Refer for specialist advice. Do not give a further mRNA dose under this PGD.",
             "History of myocarditis or pericarditis following a previous dose of any COVID-19 vaccine. Refer for specialist advice. No further dose of any product, mRNA or Nuvaxovid, is given under this PGD."),
            # Observation: 15 minutes for everyone, as in every other vaccine PGD in the estate
            ("replace", "Observe the individual for 15 minutes after vaccination where there is a history of allergy or previous vaccine reaction. Vaccinate seated and ensure procedures are in place to avoid injury from faints.",
             "Observe every individual for 15 minutes after vaccination, seated, and record that the observation period was completed. Ensure procedures are in place to avoid injury from faints."),
            # Pregnancy is not itself an eligible group; say so rather than imply it
            ("replace", "Pregnancy and breastfeeding. COVID-19 vaccination is recommended in pregnancy for those in an eligible group and is safe while breastfeeding. Where the individual is pregnant, confirm the vaccine and indication against current national guidance before proceeding.",
             "Pregnancy and breastfeeding. Pregnancy is not itself an eligible group in the 2026/27 NHS programme. The Green Book supports COVID-19 vaccination in pregnancy where the individual is otherwise eligible, and vaccination is safe while breastfeeding. Where the individual is pregnant, confirm the vaccine and indication against current national guidance before proceeding."),
        ],
        "changes": [
            "Myocarditis or pericarditis after any previous COVID-19 vaccine dose now excludes every product under this PGD, matching the exclusion header (refer, do not vaccinate); the bullet previously said only that a further mRNA dose was not given.",
            "Observation after vaccination is now 15 minutes seated for every individual, as in the other vaccine PGDs, rather than only where there is a history of allergy.",
            "Pregnancy caution reworded to state that pregnancy is not itself an eligible group in the 2026/27 NHS programme.",
        ],
    },
    "flu": {
        "edits": [
            ("replace", "Recombinant vaccine (IIVr) and egg-cultured vaccine (IIVe) are for adults, with IIVe restricted to 18 to 64 years under this PGD.",
             "Recombinant vaccine (IIVr) and egg-cultured vaccine (IIVe) are for adults, with IIVe restricted to 18 to 64 years under this PGD because from 65 years the adjuvanted, recombinant or cell-based vaccine is used instead, in line with Green Book chapter 19 and JCVI advice for older adults."),
            ("replace", "Observe the individual for 15 minutes after vaccination where there is a history of allergy or previous vaccine reaction. Syncope can occur, particularly in adolescents; vaccinate seated and ensure procedures are in place to avoid injury from faints.",
             "Observe every individual for 15 minutes after vaccination, seated, and record that the observation period was completed. Syncope can occur, particularly in adolescents; ensure procedures are in place to avoid injury from faints."),
            ("replace", "that valid informed consent was given, and by whom where the individual is a child",
             "that valid informed consent was given, and by whom where the individual is a child: where the individual is under 16, the name and relationship of the person with parental responsibility, or the basis of the Gillick competence assessment"),
        ],
        "changes": [
            "Guidance summary now says why IIVe is limited to 18 to 64 years under this PGD (an adjuvanted, recombinant or cell-based vaccine is used from 65).",
            "Observation after vaccination is now 15 minutes seated for every individual, as in the other vaccine PGDs, rather than only where there is a history of allergy.",
            "Records row now requires the name and relationship of the person with parental responsibility, or the basis of the Gillick assessment, for an individual under 16.",
        ],
    },
    "hpv": {
        "edits": [
            ("replace", "for the administration of Gardasil 9 (Human Papillomavirus 9-valent Vaccine) for the treatment of Prevention of HPV-related cancers and genital warts",
             "for the administration of Gardasil 9 (Human Papillomavirus 9-valent Vaccine) for the prevention of HPV-related cancers and genital warts"),
            ("replace", "for the administration, for the treatment of Prevention of HPV-related cancers and genital warts, of:",
             "for the administration, for the prevention of HPV-related cancers and genital warts, of:"),
        ],
        "changes": [
            "Cover and arm titles corrected from 'for the treatment of Prevention of' to 'for the prevention of' HPV-related cancers and genital warts.",
        ],
    },
    "shingles-treatment": {
        "edits": [
            # Cover narration about the slug, which the v005 clean-up said had left every body
            ("delete", "New PGD. Replaces a slug that was serving the Shingrix vaccine document."),
            ("replace", "This PGD is for the TREATMENT of active shingles with oral antivirals. It is not about vaccination. The catalogue slug for shingles treatment was previously serving the Shingrix vaccine PGD, which contains no antiviral at all, so a pharmacist opening what they believed was the treatment document found a vaccination document instead. That is the gap this PGD fills.",
             "This PGD is for the TREATMENT of active shingles with oral antivirals. It is not a vaccination PGD; Shingrix is covered by the separate Shingles vaccination PGD."),
            # Records row: say which renal measure the thresholds use
            ("replace", "renal function and how it was established",
             "renal function as eGFR in mL/min/1.73m2 (the measure used by the thresholds in this PGD), and how it was established"),
        ],
        "changes": [
            "Cover page narration about the catalogue slug removed; the cover now states only that this is a treatment PGD and that Shingrix is covered by the separate vaccination PGD.",
            "Records row now states that renal function is recorded as eGFR in mL/min/1.73m2, the measure the PGD thresholds use.",
        ],
    },
    "herpes-management": {
        "edits": [
            ("replace_contains", "for the administration of Aciclovir and Valaciclovir for the treatment of Genital Herpes Management",
             "Patient Group Direction\nfor the supply of Aciclovir or Valaciclovir tablets for the treatment of Genital Herpes"),
            # Treatment period rows contradicted the dose and quantity rows (2 to 10 days; suppressive 6 to 12 months)
            ("replace", "First episode or recurrence: 2-10 days. Suppressive therapy: ongoing (typically 6-12 months).",
             "First episode: 5 days, extended to 10 days only where new lesions are still forming at day 5. Recurrent episode: 2 days. Suppressive therapy: maximum 3 months (three 28 day supplies) under this PGD, then GP or GUM review before any further supply."),
            ("replace", "First episode or recurrence: 3-10 days. Suppressive therapy: ongoing (typically 6-12 months).",
             "First episode: 5 days, extended to 10 days only where new lesions are still forming at day 5. Recurrent episode: 3 to 5 days. Suppressive therapy: maximum 3 months (three 28 day supplies) under this PGD, then GP or GUM review before any further supply."),
            *RUN_TOGETHER_RECORDS,
        ],
        "changes": [
            "Cover corrected to the supply of aciclovir or valaciclovir tablets for genital herpes (it read administration and Genital Herpes Management).",
            "Maximum or minimum treatment period rows in both arms now match the dose and quantity rows: first episode 5 days extended to 10 only where new lesions form at day 5, recurrence 2 days (aciclovir) or 3 to 5 days (valaciclovir), suppressive therapy capped at 3 months under this PGD.",
            "Records row template text separated into date, dose, form, route and quantity, and the adverse reaction bullet no longer runs into 'supplied via PGD'.",
        ],
    },
    "cold-sores": {
        "edits": [
            ("replace_contains", "for the administration of Aciclovir cream and tablets for the treatment of Cold Sores",
             "Patient Group Direction\nfor the supply of Aciclovir cream and tablets for the treatment of Cold Sores (Herpes Labialis)"),
            ("replace", "for the treatment to", "for the treatment of"),
            ("replace", "for the treament to", "for the treatment of"),
            # Summary names products the PGD does not authorise
            ("replace", "Consider oral antivirals (e.g. aciclovir 200 mg 5 times/day for 5 days or valaciclovir 500 mg BD for 5 days)",
             "Consider oral antivirals (e.g. aciclovir 200 mg 5 times/day for 5 days or valaciclovir 500 mg BD for 5 days). Only aciclovir 200 mg tablets are authorised under this PGD; valaciclovir is not."),
            ("replace", "e.g. aciclovir 400 mg BD",
             "e.g. aciclovir 400 mg BD. Suppressive therapy is not authorised under this PGD: refer."),
            # Exclusions: the cream arm (1st) and tablet arm (2nd) carried the same list; mucous membranes is a route restriction and the prescriber qualifier cannot be exercised under a PGD
            ("replace", "- Known hypersensitivity to aciclovir, valaciclovir, or any excipients.\n- Immunocompromised patients or severe recurrent episodes.\n- Use on mucous membranes (e.g. eyes, inside mouth, genitals).\n- Pregnancy or breastfeeding unless assessed as appropriate by the prescriber.",
             "- Known hypersensitivity to aciclovir, valaciclovir, or any excipients.\n- Immunocompromised patients or severe recurrent episodes.\n- Lesions on mucous membranes (e.g. eyes, inside the mouth, genitals): the cream must not be applied to mucous membranes. Refer.\n- Pregnancy or breastfeeding. Refer to a prescriber.", 1),
            ("replace", "- Known hypersensitivity to aciclovir, valaciclovir, or any excipients.\n- Immunocompromised patients or severe recurrent episodes.\n- Use on mucous membranes (e.g. eyes, inside mouth, genitals).\n- Pregnancy or breastfeeding unless assessed as appropriate by the prescriber.",
             "- Known hypersensitivity to aciclovir, valaciclovir, or any excipients.\n- Immunocompromised patients or severe recurrent episodes.\n- Lesions involving the eyes, the inside of the mouth or the genitals: outside this PGD. Refer.\n- Pregnancy or breastfeeding. Refer to a prescriber."),
            # Tablet arm treatment period contradicted its own exclusions and fixed quantity
            ("replace", "Typically 5 days; may be extended to 10 days in severe or immunocompromised cases.",
             "5 days. No extension under this PGD: severe or immunocompromised cases are excluded and referred."),
            *RUN_TOGETHER_RECORDS,
        ],
        "changes": [
            "Cover corrected to supply (not administration) and the arm titles corrected from 'for the treatment to' and 'for the treament to' to 'for the treatment of'.",
            "Guidance summary now states that valaciclovir and suppressive aciclovir are not authorised under this PGD.",
            "Exclusion rows reworded: mucous membrane involvement is stated as a patient criterion (refer) rather than a route restriction, and pregnancy or breastfeeding is a referral rather than a prescriber assessment that a PGD cannot provide.",
            "Tablet arm treatment period is 5 days with no extension, matching the exclusion of severe and immunocompromised cases and the fixed quantity of 25 tablets.",
            "Records row template text separated into date, dose, form, route and quantity, and the adverse reaction bullet no longer runs into 'supplied via PGD'.",
        ],
    },
    "genital-warts": {
        "edits": [
            ("replace_contains", "for the administration of Podophyllotoxin and Imiquimod for the treatment of Genital Warts",
             "Patient Group Direction\nfor the supply of Podophyllotoxin or Imiquimod for the treatment of Genital Warts"),
            ("replace", "4-5 treatment cycles (each 3 days on, 4 days off); typically 4-5 weeks total.",
             "Up to 4 treatment cycles (each 3 days on, 4 days off); 4 weeks in total, the licensed maximum."),
            # Written information cell: 1st occurrence is the podophyllotoxin arm, 2nd the imiquimod arm
            ("replace", "Supply the patient information leaflet (PIL) provided with podophyllotoxin or imiquimod cream.",
             "Supply the patient information leaflet (PIL) provided with the podophyllotoxin product.", 1),
            ("replace", "Supply the patient information leaflet (PIL) provided with podophyllotoxin or imiquimod cream.",
             "Supply the patient information leaflet (PIL) provided with imiquimod cream."),
            # Each arm carried the other agent's application instructions
            # (delete takes nth as the 4th element; the 3rd is unused)
            ("delete", "For imiquimod: apply 3 times per week at bedtime (e.g., Mon/Wed/Fri), and wash off the next morning after 6-10 hours. Continue for up to 16 weeks.", None, 1),
            ("delete", "For podophyllotoxin: apply twice daily for 3 consecutive days (e.g. Mon-Wed morning and evening), then rest for 4 days (Thu-Sun). Repeat for up to 4 cycles.", None, 2),
            *RUN_TOGETHER_RECORDS,
        ],
        "changes": [
            "Cover corrected to the supply of podophyllotoxin or imiquimod.",
            "Podophyllotoxin treatment period corrected to up to 4 cycles (4 weeks, the licensed maximum), matching the dose row; it read 4 to 5 cycles.",
            "Written information and follow-up rows in each arm now refer only to that arm's product.",
            "Records row template text separated into date, dose, form, route and quantity, and the adverse reaction bullet no longer runs into 'supplied via PGD'.",
        ],
    },
    "skin-infection": {
        "edits": [
            ("replace", "Facial or periorbital cellulitis, or cellulitis in a child under 12. Refer.",
             "Facial, periorbital or hand cellulitis, or cellulitis in a child under 12. Refer."),
            ("replace", "UNDER 2 YEARS OF AGE, or weighing under 12 kg.",
             "UNDER 2 YEARS OF AGE, or weighing under 12 kg. A penicillin-allergic child weighing under 12 kg has no arm in this PGD: refer."),
            ("replace", "This definition applies to the clarithromycin 500mg twice daily dose and the doxycycline 200mg daily dose. Where it is not met, use the standard dose. Where the infection is beyond it, refer.",
             "This definition applies to the clarithromycin 500mg twice daily dose and the doxycycline 200mg daily dose. Where it is not met, use the standard dose. Where the infection is beyond it, refer. Flucloxacillin has no increased dose under this PGD: 500mg four times daily applies to every infection within scope."),
        ],
        "changes": [
            "Scope page 'What it does not cover' now lists hand cellulitis, matching the exclusion rows.",
            "Arm 2 age and weight exclusion now says that a penicillin-allergic child under 12 kg has no arm in this PGD and is referred.",
            "Appendix 2 now states that flucloxacillin has no increased dose under this PGD.",
        ],
    },
    "cellulitis": {
        "edits": [
            # Second breastfeeding line contradicted the exclusion above it; the stricter line stands
            ("replace_contains", "Breastfeeding individuals unless under appropriate supervision",
             "- Hepatic dysfunction or history of flucloxacillin-associated jaundice."),
            # Truncated clarithromycin exclusion
            ("replace", "- Hepatic dysfunction or history",
             "- Hepatic dysfunction, or a history of jaundice or hepatic dysfunction associated with clarithromycin."),
            # Clarithromycin strengths: route, renal halving and quantity rows now say which tablet
            ("replace", "500 mg tablets by oral administration, twice daily for 5 to 7 days",
             "By oral administration, twice daily for 5 to 7 days: 500 mg tablets, or 250 mg tablets where the renal dose reduction below applies."),
            ("replace_contains", "the dosage of clarithromycin should be reduced by one-half,  250 mg twice daily in more severe infections.",
             "In patients with renal impairment with creatinine clearance less than 30 mL/min, halve the dose to 250 mg twice daily, using 250 mg tablets."),
            ("replace", "10 tablets for 5 days or 14 tablets for 7 days.",
             "10 tablets for 5 days or 14 tablets for 7 days, of the strength selected in the dose row (500 mg, or 250 mg where the renal dose reduction applies). Record which."),
            # Change history tables stop at v001 (3 arms)
            ("insert_after", "Development & issue of new PGD", [CHANGE_HISTORY_POINTER]),
        ],
        "changes": [
            "Flucloxacillin arm: the line 'Breastfeeding individuals unless under appropriate supervision' is removed because it contradicted the exclusion of pregnancy or breastfeeding on the line above; the exclusion stands.",
            "Clarithromycin arm: the truncated exclusion 'Hepatic dysfunction or history' completed.",
            "Clarithromycin arm: route, renal dose reduction and quantity rows now state which tablet strength is used (500 mg, or 250 mg where the renal halving applies) and the phrase 'in more severe infections' is removed.",
            "Change history tables now point to the version and change record for versions after 001.",
        ],
    },
    "impetigo": {
        "edits": [
            ("replace", "3 months to 1 year: 62.5mg to 125mg four times a day for 5 days. (Under 3 months is excluded.)",
             "3 months to 1 year (up to the second birthday): 62.5mg to 125mg four times a day for 5 days. (Under 3 months is excluded.)"),
            ("replace", "Bullous impetigo in a baby. Refer or seek specialist advice.",
             "Bullous impetigo in a baby, meaning a child aged 1 year and under (NICE CKS). Refer or seek specialist advice."),
            ("delete_contains", "The practitioner Agreement to practise page, the premises block and the practitioner signature table are restored.", None, 2),
        ],
        "changes": [
            "Flucloxacillin dose table: the first band now states that '3 months to 1 year' runs up to the second birthday, so a child aged 1 has a band.",
            "'Bullous impetigo in a baby' defined as a child aged 1 year and under, per NICE CKS, in all three arms.",
            "Duplicate v004 change history bullet removed.",
        ],
    },
    "wound-care": {
        "edits": [
            # High-risk tetanus-prone wound: UKHSA definition; >6 hours, puncture and burns are tetanus-prone, not high-risk (2 arms)
            ("replace", "High-risk tetanus-prone wound where human tetanus immunoglobulin may be indicated (heavy contamination, devitalised tissue, burns, sepsis, or more than 6 hours to treatment). Refer the same day; HTIG is not covered by this PGD. A wound that needs only a vaccine dose is handled under the Tetanus (Td/IPV) PGD and does not exclude this supply.",
             "HIGH-RISK tetanus-prone wound, where human tetanus immunoglobulin (HTIG) may be indicated: a tetanus-prone wound with heavy contamination by material likely to contain tetanus spores (for example soil or manure) and/or extensive devitalised tissue (UKHSA definition). Refer the same day; HTIG is not covered by this PGD. Presentation more than 6 hours after injury, a puncture wound or a burn make a wound tetanus-prone, not high-risk: a wound that needs only a vaccine dose is handled under the Tetanus (Td/IPV) PGD and does not exclude this supply. Burns and wounds with systemic sepsis are outside this PGD in any case: refer."),
            ("replace", "A HIGH-RISK tetanus-prone wound (heavy contamination, devitalised tissue, burns, sepsis, or more than 6 hours to treatment) needs immunoglobulin: refer the same day. Immunoglobulin is not covered by any GRH PGD.",
             "A HIGH-RISK tetanus-prone wound (a tetanus-prone wound with heavy contamination by material likely to contain tetanus spores, such as soil or manure, and/or extensive devitalised tissue) needs immunoglobulin: refer the same day. Immunoglobulin is not covered by any GRH PGD."),
            ("replace", "Tetanus-prone wounds include puncture wounds, wounds contaminated with soil or manure, wounds with devitalised tissue, and wounds presenting after 6 hours.",
             "Tetanus-prone wounds (UKHSA) include puncture wounds, wounds contaminated with soil or manure, wounds with devitalised tissue, burns, wounds with systemic sepsis, and wounds presenting more than 6 hours after injury."),
            # Consent in under-16s: house wording in both arms
            ("replace", "Valid informed consent given.",
             "Valid informed consent given. Where the patient is under 16, consent from a person with parental responsibility, or from the young person where assessed as Gillick competent, with the basis recorded."),
            ("replace", "Valid informed consent given (from a person with parental responsibility where the patient is a child).",
             "Valid informed consent given. Where the patient is under 16, consent from a person with parental responsibility, or from the young person where assessed as Gillick competent, with the basis recorded."),
            # Retention rule (2 arms)
            ("replace", "Records signed, dated, legible and contemporaneous. Adults: 8 years. Under 18s: until the 25th birthday.",
             "Records signed, dated, legible and contemporaneous. Adults: 8 years. Under 18s: until the 25th birthday, or the 26th birthday where the patient was 17 when treatment finished."),
            # Guidance summary alternatives are not authorised here
            ("replace", "For adults, the alternatives are clarithromycin 500 mg twice a day for 5 to 7 days, erythromycin (in pregnancy) 500 mg four times a day for 5 to 7 days, or doxycycline 200 mg on the first day then 100 mg once a day for 5 to 7 days in total.",
             "For adults, the alternatives are clarithromycin 500 mg twice a day for 5 to 7 days, erythromycin (in pregnancy) 500 mg four times a day for 5 to 7 days, or doxycycline 200 mg on the first day then 100 mg once a day for 5 to 7 days in total. None of these alternatives is authorised under this PGD: refer and name the likely alternative."),
            # Change history table stops at v004
            ("insert_after_contains", "Paediatric flucloxacillin volume corrected. Version 002 read", [CHANGE_HISTORY_POINTER]),
        ],
        "changes": [
            "High-risk tetanus-prone wound is now defined as UKHSA defines it (a tetanus-prone wound with heavy contamination by material likely to contain tetanus spores and/or extensive devitalised tissue); presentation after 6 hours, puncture wounds and burns are listed as tetanus-prone, not high-risk, so the two tetanus lists no longer disagree. Burns and wounds with systemic sepsis remain outside the PGD.",
            "Consent bullet in both arms now carries the house wording for under-16s (parental responsibility or Gillick competence, basis recorded).",
            "Records retention now carries the 26th birthday rule for a patient aged 17 at completion.",
            "Guidance summary now states that the flucloxacillin alternatives it describes are not authorised under this PGD.",
            "Change history table now points to the version and change record for versions after 004.",
        ],
    },
    "eczema": {
        "edits": [
            ("replace", "MILD means limited erythema and scaling, not markedly affecting sleep or daily activity. MODERATE means marked erythema or lichenification, or disease disturbing sleep or daily activity. Excoriation from scratching may be present in either and does not by itself make disease moderate.",
             "MILD means limited erythema and scaling, not markedly affecting sleep or daily activity. MODERATE means marked erythema or lichenification, or disease disturbing sleep or daily activity. SEVERE means widespread erythema with oozing, bleeding or cracking of the skin, or disease seriously disturbing sleep or daily activity (NICE CG57 grading): severe disease is outside this PGD, refer. Excoriation from scratching may be present in either mild or moderate disease and does not by itself make disease moderate."),
            ("replace", "EITHER mild eczema or dermatitis at any permitted site: limited erythema and scaling, not markedly affecting sleep or daily activity.",
             "EITHER mild eczema or dermatitis at any permitted site: limited erythema and scaling, not markedly affecting sleep or daily activity. On the face, flexures or genital skin the 7 day cap applies whatever the severity."),
            ("replace", "Clobetasone butyrate 0.05% cream or ointment. Ointment for dry, lichenified skin; cream for weeping or moist areas and for the face where an ointment is not tolerated.",
             "Clobetasone butyrate 0.05% cream or ointment. Ointment for dry, lichenified skin; cream for moist areas such as the flexures and for the face where an ointment is not tolerated. Weeping skin suggests secondary infection and is handled under the exclusion and concurrent supply provisions, not by choosing the cream."),
            ("replace", "One supply per consultation. A second supply may be made after review, within the 4 week ceiling.",
             "One supply per consultation. A second supply may be made after review, within the 4 week ceiling, using the same area-based quantities as the initial supply and covering no more than the days remaining within that ceiling."),
        ],
        "changes": [
            "Severe eczema is now defined (NICE CG57 grading) as outside this PGD, so the referral has a definition to test against.",
            "Arm 1 mild-disease inclusion bullet now states the 7 day cap on the face, flexures or genital skin whatever the severity, matching the maximum treatment period row.",
            "Clobetasone form row no longer names weeping areas as a reason to choose the cream, since weeping skin is treated as a sign of infection elsewhere in the document.",
            "Second supply after review now uses the same area-based quantities as the initial supply and covers no more than the days remaining within the 4 week ceiling.",
        ],
    },
    "psoriasis": {
        "edits": [
            ("replace", "Topical treatment alone may not give satisfactory control, especially where psoriasis is extensive (for example more than 10% of body surface area) or is at least moderate on the static physician global assessment.",
             "Topical treatment alone may not give satisfactory control, especially where psoriasis is extensive (for example more than 10% of body surface area) or is at least moderate on the static physician global assessment. NICE's 10% figure is a threshold for considering specialist referral; the 30% ceiling in this PGD is the calcipotriol licence limit."),
            ("replace", "Name and brand of the product, quantity supplied, and the date.",
             "Name and brand of the product, formulation, pack size, batch number and expiry date, quantity supplied, and the date."),
            ("delete", "All users must understand capacity and consent and be aware of the Mental Capacity Act 2005."),
            ("delete", "All users must hold appropriate professional indemnity covering this service."),
            ("replace", "All users must understand capacity and consent, including the Mental Capacity Act 2005, and must be able to assess consent in children and young people where this PGD covers them.",
             "All users must understand capacity and consent, including the Mental Capacity Act 2005. This PGD covers adults only."),
            ("replace", "No more than one 15g tube-worth in a day, and not on more than about a third of your body. Your palm is roughly 1% of your skin.",
             "No more than 15 g in a day, which is about half of a 30 g tube, and not on more than about a third of your body. Your palm is roughly 1% of your skin."),
        ],
        "changes": [
            "Guidance summary now distinguishes NICE's 10% referral consideration from the PGD's 30% licence ceiling.",
            "Records row now requires formulation, pack size, batch number and expiry date, as the other topical PGDs do.",
            "Duplicate training bullets (indemnity, capacity and consent) removed, and the consent bullet no longer refers to children and young people in an adult-only PGD.",
            "Counselling row replaced '15g tube-worth' (no 15 g pack exists) with 15 g a day, about half of a 30 g tube.",
        ],
    },
    "sore-throat": {
        "edits": [
            ("replace_contains", "for the administration of Phenoxymethylpenicillin 500mg tablets and Clarithromycin 250mg tablets",
             "Patient Group Direction\nfor the supply of Phenoxymethylpenicillin 500mg tablets or Clarithromycin 250mg tablets for the treatment of Sore Throat Test & Treat"),
            ("replace", "for the supply/administration of", "for the supply of"),
            # Sepsis sentence: fever plus any one marker, or confusion, or looks unwell, whatever the temperature (2 arms)
            ("replace", "Signs of sepsis or systemic illness: temperature 38°C or above together with heart rate above 90, respiratory rate 20 or above, systolic blood pressure below 100, new confusion, or a patient who looks unwell: emergency referral.",
             "Signs of sepsis or systemic illness: temperature 38°C or above together with any one of heart rate above 90, respiratory rate 20 or above or systolic blood pressure below 100; or new confusion; or a patient who looks unwell, whatever the temperature: emergency referral."),
            # Myasthenia gravis is an exclusion in the clarithromycin arm; the caution contradicted it
            ("delete", "Myasthenia gravis: may exacerbate; use with caution and close monitoring"),
            ("replace", "Documented penicillin allergy or intolerance (non-anaphylaxis preferred for macrolide use)",
             "Documented penicillin allergy or intolerance of any severity, including a history of anaphylaxis to penicillin"),
            ("replace", "RAST (rapid antigen test): Can be used in primary care/pharmacy to guide antibiotic use (not part of this PGD).",
             "RAST (rapid antigen test): can be used in primary care or pharmacy to guide antibiotic use. A positive result is an inclusion criterion in both arms of this PGD; the test itself is not supplied under it."),
            *RUN_TOGETHER_RECORDS,
            ("insert_after", "Development & issue of new PGD", [CHANGE_HISTORY_POINTER]),
        ],
        "changes": [
            "Cover and arm titles corrected from administration to supply.",
            "Sepsis exclusion reworded in both arms so that fever with any one marker, new confusion, or a patient who looks unwell each trigger emergency referral.",
            "Clarithromycin arm: the myasthenia gravis caution removed because myasthenia gravis is an exclusion in the same arm.",
            "Clarithromycin arm inclusion no longer says non-anaphylaxis is preferred for macrolide use; penicillin allergy of any severity, including anaphylaxis, qualifies.",
            "Guidance summary now says a positive RAST is an inclusion criterion under this PGD (it said RAST was not part of the PGD).",
            "Records row template text separated into date, dose, form, route and quantity, and the adverse reaction bullet no longer runs into 'supplied via PGD'.",
            "Change history tables now point to the version and change record for versions after 001.",
        ],
    },
    "chest-service": {
        "edits": [
            # Clarithromycin 500 mg: the dose row said those patients are referred, so the dose is withdrawn
            ("replace", "Clarithromycin 250mg or 500mg tablets, in patients aged 12 years and over who are penicillin-allergic and cannot take doxycycline, and who are not pregnant or breastfeeding.",
             "Clarithromycin 250mg tablets, in patients aged 12 years and over who are penicillin-allergic and cannot take doxycycline, and who are not pregnant or breastfeeding."),
            ("replace", "500mg twice daily for 5 days where the infection is more severe: marked systemic upset in a patient who nonetheless has no CRB point and no feature of pneumonia. Those patients are referred, not treated at the higher dose.",
             "500mg twice daily is NOT authorised under this PGD. The SPC's severe infection dose describes marked systemic upset, and a patient with marked systemic upset is referred, not treated at the higher dose."),
            ("replace", "10 tablets at 250mg twice daily, or 20 tablets at 500mg twice daily. Record which.",
             "10 tablets (250mg twice daily for 5 days)."),
            # Warfarin: the caution says refer rather than supply, which is an exclusion
            ("insert_after", "CONCURRENT ISOTRETINOIN. Doxycycline with a retinoid risks benign intracranial hypertension. Refer.",
             ["Taking warfarin or another coumarin anticoagulant. Doxycycline potentiates warfarin. Refer."]),
            ("replace", "Potentiates warfarin; where the patient is anticoagulated, refer rather than supply. The same finding is an EXCLUSION in the Skin and Soft Tissue Infection PGD. The practical outcome is identical in both services: do not supply, refer. The difference in wording is noted here because staff move between the two within a shift.",
             "Warfarin is an exclusion in this arm (above), as it is in the Skin and Soft Tissue Infection PGD: do not supply, refer."),
            # Amoxicillin renal exclusion had no threshold; Arm 3 wording used
            ("replace", "Known significant renal impairment. Refer.",
             "KNOWN RENAL IMPAIRMENT with a creatinine clearance below 30 mL/min, or renal impairment of unknown severity where there is reason to suspect it is significant. Refer."),
            # COPD baseline has no source in a pharmacy
            ("replace", "For a patient with known COPD, refer if SpO2 has fallen below their own documented baseline.",
             "For a patient with known COPD, refer if SpO2 has fallen below their own documented baseline. Where no documented baseline is available to you, apply the 94% threshold."),
            # Retention rule (3 arms)
            ("replace", "Records signed, dated, legible and contemporaneous. Adults 18 and over: 8 years. Under 18s: until the 25th birthday.",
             "Records signed, dated, legible and contemporaneous. Adults 18 and over: 8 years. Under 18s: until the 25th birthday, or the 26th birthday where the patient was 17 when treatment finished."),
        ],
        "changes": [
            "Clarithromycin 500mg twice daily withdrawn: the dose row itself said the patients it described are referred, so the scope page, dose row and quantity row now authorise 250mg twice daily (10 tablets) only.",
            "Doxycycline arm: warfarin moved from a caution that said refer to an exclusion, matching the Skin and Soft Tissue Infection PGD.",
            "Amoxicillin arm renal exclusion now carries the same creatinine clearance threshold (below 30 mL/min) as the clarithromycin arm.",
            "Appendix 1 now says that where no documented COPD baseline is available the 94% SpO2 threshold applies.",
            "Records retention now carries the 26th birthday rule for a patient aged 17 at completion.",
        ],
    },
    "dental-bridging": {
        "edits": [
            ("replace", "Where the exclusion is an interacting medicine, alcohol or pregnancy, say plainly that the issue is the antibiotic and not the dental problem, so the patient does not leave thinking their infection has been dismissed.",
             "Where the exclusion is renal impairment, infectious mononucleosis or an antibiotic already being taken, say plainly that the issue is the antibiotic and not the dental problem, so the patient does not leave thinking their infection has been dismissed.", 1),
            ("replace", "All users must understand capacity and consent, including the Mental Capacity Act 2005, and must be able to assess consent in children and young people where this PGD covers them.",
             "All users must understand capacity and consent, including the Mental Capacity Act 2005. This PGD covers adults only."),
            ("replace", "Penicillin-allergic, so the amoxicillin arm cannot be used.",
             "Penicillin-allergic, including beta-lactam or cephalosporin allergy, so the amoxicillin arm cannot be used."),
            ("replace", "Alcohol is handled as an inclusion criterion in this arm, not as a counselling point, because the reaction can be severe and the patient must be asked before the decision to supply is made.",
             "Alcohol is asked about before the decision to supply is made, and inability or unwillingness to avoid it is an exclusion in this arm (above), not a counselling point, because the reaction can be severe."),
        ],
        "changes": [
            "Amoxicillin arm 'actions if excluded' no longer refers to alcohol or pregnancy, which are metronidazole arm exclusions; it names the amoxicillin arm's own exclusions.",
            "Training bullet no longer refers to consent in children and young people in an adult-only PGD.",
            "Metronidazole arm inclusion now names beta-lactam and cephalosporin allergy alongside penicillin allergy, matching the amoxicillin arm exclusion.",
            "Metronidazole arm caution now says alcohol is an exclusion, matching the exclusion list (it said inclusion criterion).",
        ],
    },
}

DECISIONS = [
    ("rsv", "Should the PGD supply Abrysvo or Arexvy to adults aged 60 to 74 who are outside JCVI advice (75 and over, or 65 to 74 with risk factors)?",
     "(a) keep 60 and over, the licensed indication, for private supply; (b) restrict to 65 and over with risk factors and 75 and over",
     "(a): both products are licensed from 60 and the PGD is a private service; the guidance summary now states the NHS cohorts so the patient can be told their NHS entitlement."),
    ("rsv", "Should Abrysvo be supplied after 36 weeks of pregnancy (Green Book: vaccination up to delivery is still recommended)? Carried over from the v004 record.",
     "(a) keep the 28 to 36 week window and refer later presentations to maternity; (b) extend to any time from 28 weeks up to delivery",
     "(b) would follow the Green Book, but it widens the indication and is for the signatories."),
    ("shingles-vaccine", "What should happen when the second Shingrix dose is more than 6 months after the first? The tool currently stops and refers.",
     "(a) add 'if more than 6 months have elapsed, give dose 2 as soon as possible and do not restart the course' (Green Book); (b) keep the stop and refer",
     "(a): it is the Green Book position, but it relaxes the stated interval so it is a signatory decision."),
    ("shingles-vaccine", "The inclusion 'eligible under national immunisation guidelines' sits beside 'aged 50 or older'; NHS eligibility is 65 plus catch-up, 70 to 79 and immunosuppressed 18 and over, so a private 50 to 64 year old is within the age line but not the national line.",
     "(a) replace the national eligibility bullet with 'within the licensed indication (50 and over); where the patient is NHS-eligible, tell them so before a private supply'; (b) restrict the PGD to NHS-eligible cohorts",
     "(a): the PGD is a private service and the licence is 50 and over; the bullet as written excludes most private patients."),
    ("shingles-vaccine", "Should an 18 to 49 immunosuppressed arm be added (licensed and Green Book supported)? Carried over from the v004 record.",
     "(a) no, keep 50 and over and refer; (b) add an 18 to 49 immunosuppressed arm",
     "(a) for now: immunosuppressed adults under 50 are NHS-eligible and the referral route exists."),
    ("covid-booster", "May a pregnant private patient who is not in an NHS-eligible group be vaccinated under this PGD?",
     "(a) yes, within the licence, using an mRNA product and current Green Book advice; (b) no, refer unless in an eligible group",
     "(a): the PGD already covers anyone 12 and over regardless of NHS eligibility and the Green Book supports vaccination in pregnancy; the caution now says pregnancy is not itself an eligible group."),
    ("hpv", "An immunosuppressed or HIV-positive adult who had a single dose before 25 is 'course complete' under the exclusion but 'needs three doses' under the schedule row. Which applies?",
     "(a) the single-dose-before-25 rule applies only to immunocompetent patients; immunosuppressed or HIV-positive patients complete a three dose course whatever their age at dose 1 (Green Book); (b) keep the exclusion as written",
     "(a): it is the Green Book position and matches the exclusion's own words 'appropriate to their age and immune status', but it adds doses for a group so it is a signatory decision."),
    ("shingles-treatment", "The 72 hour inclusion says 'age over 50' while the NICE CKS summary in part 2 says 50 years and over.",
     "(a) align to 'aged 50 years or over' (NICE CKS); (b) keep 'over 50'",
     "(a): the one year difference is a copying error against the cited source, but it widens by a year so it is recorded here."),
    ("shingles-treatment", "'Moderate or severe pain' and 'elderly' have no numeric definition; the tool has had to choose thresholds.",
     "(a) define moderate or severe pain as 4 or more on a 0 to 10 scale and elderly as 65 and over; (b) leave to clinical judgement and record the scale used",
     "(a): the training row already requires a validated pain scale, so state the threshold."),
    ("shingles-treatment", "Sacral dermatomes (buttocks) are neither clearly truncal nor listed under 'non-truncal involvement of the limbs or perineum'.",
     "(a) state that sacral dermatomes count as truncal; (b) list sacral involvement with the perineum as non-truncal",
     "(a): matches the tool and does not widen the 72 hour criterion."),
    ("shingles-treatment", "'Any underlying neurological condition' is an absolute exclusion (SmPC basis is caution), which excludes controlled migraine or a remote stroke.",
     "(a) keep as an exclusion; (b) narrow to conditions that would mask or mimic neurological adverse effects, or to significant neurological abnormality, with the rest as a caution",
     "(a) unless the signatories want to relax it; it is safe as written."),
    ("shingles-treatment", "The PGD allows treatment of a breastfeeding woman without sores on the breast, while NICE CKS (quoted in part 2) says seek specialist advice before treating any breastfeeding woman.",
     "(a) refer all breastfeeding women; (b) keep the current position (exclude only where there are sores on the breast)",
     "(a): the more conservative reading and the one the summary cites."),
    ("shingles-treatment", "Famciclovir is dosed and gated in the PGD but its SmPC was not fetched or summarised in part 2.",
     "(a) fetch the famciclovir SmPC and add it to the summary; (b) remove famciclovir from the PGD",
     "(a): the eGFR 60 threshold and the 10 day immunosuppressed course should be checked against the SmPC before the next reissue."),
    ("herpes-management", "Valaciclovir recurrent episode quantity is '6 to 10 tablets (3 to 5 days)' with no criterion for choosing the course length.",
     "(a) fix the course at 5 days (10 tablets) as the upper end of the SmPC range; (b) 3 days (6 tablets) unless the last recurrence needed longer; (c) leave to judgement and record the reason",
     "(a): one quantity per regimen, as the v002 change record intended."),
    ("genital-warts", "Podophyllotoxin quantity is '1 bottle (15 mL) or 1 tube (5 g) per treatment cycle', which allows up to four packs for a 4 week course; one pack normally covers the licensed course. Also the marketed solution packs are 3 mL (Warticon) and 3.5 mL (Condyline), not 15 mL.",
     "(a) one pack per course, a second only at the 2 cycle review if warts persist, and state the marketed pack sizes; (b) leave per cycle",
     "(a): matches the licence and the review step already in the dose row."),
    ("skin-infection", "Flucloxacillin may be supplied in pregnancy and breastfeeding here, but the Cellulitis PGD (same drug, same day) excludes both from its flucloxacillin arm.",
     "(a) amend the Cellulitis PGD to allow flucloxacillin in pregnancy and breastfeeding (NICE NG141 and the SmPC support it); (b) exclude pregnancy and breastfeeding from Arm 1 here as well",
     "(a): flucloxacillin is the NICE first line in pregnancy; (b) would leave a pregnant patient with mild cellulitis no route in either document."),
    ("skin-infection", "Sepsis pulse threshold is above 110 here and above 90 in the Cellulitis PGD for the same adult patient.",
     "(a) adopt the stricter 90 in this document; (b) adopt 110 in the Cellulitis PGD; (c) leave both",
     "(a): the two documents are used by the same staff for the same presentation and the stricter figure is the NEWS2 based one."),
    ("cellulitis", "The NICE summary says review at 48 hours; the body only requires the margin marked and time recorded. Who does the 48 hour reassessment and should the body require it to be booked?",
     "(a) require a booked 48 hour reassessment at the pharmacy, as the Skin and Soft Tissue Infection PGD does; (b) advise the patient to return or see the GP at 48 hours without a booked review",
     "(a): the tool already books it and it matches the sister document."),
    ("wound-care", "Heavy contamination is both the Arm 1 (co-amoxiclav) indication and part of the high-risk tetanus (HTIG) referral, so read literally Arm 1 has no patients.",
     "(a) state that Arm 1 applies where tetanus management, including any HTIG, was completed at the time of injury and is recorded, or the wound is not tetanus-prone; otherwise refer; (b) remove heavily contaminated wounds from Arm 1 and keep it for bites only",
     "(a): keeps the NICE bite and contaminated wound indication while making the HTIG referral explicit; the tool already records the HTIG reasoning."),
    ("wound-care", "Are minor infected burns intended to be within the flucloxacillin arm? The tool refers all burns and the document now says burns are outside the PGD.",
     "(a) keep burns outside the PGD; (b) add minor infected burns to Arm 2 with a size limit",
     "(a): burns need their own assessment and the document has never stated a burn criterion."),
    ("wound-care", "The flucloxacillin arm names the suspension for children unable to swallow capsules but states suspension quantities for the 250 mg dose only, so a 10 to 17 year old who cannot swallow capsules has no stated quantity.",
     "(a) add a 500 mg (10 mL) suspension quantity for 10 to 17 (200 mL for 5 days, 280 mL for 7 days); (b) refer that patient",
     "(a): it is the same dose the arm already authorises in capsule form."),
    ("psoriasis", "The inclusion allows up to 30% body surface (calcipotriol licence limit) while NICE positions more than 10% as extensive disease for specialist referral.",
     "(a) keep 30%; (b) lower the PGD ceiling to 10% and refer above it",
     "(b) is the safer reading of NICE for a pharmacy supply; recorded for the signatories."),
    ("psoriasis", "NICE positions the combined calcipotriol and betamethasone product after a potent steroid or coal tar cannot be used (and for the scalp after two failed steroid steps); the PGD requires no prior treatment.",
     "(a) add a prior treatment or adherence criterion; (b) keep first-line use under the PGD",
     "(b) with the NICE positioning stated in part 2 as it now is; a prior treatment criterion would need a record the pharmacy cannot verify."),
    ("sore-throat", "Phenoxymethylpenicillin course is 5 to 10 days with no criterion for choosing; NICE NG84 gives 5 to 10 days.",
     "(a) fix the course at 10 days (40 tablets) for microbiological cure; (b) fix at 5 days (20 tablets); (c) state a criterion for the longer course",
     "(a): one quantity per arm, consistent with the house approach elsewhere."),
    ("chest-service", "The v004 record says the renal referral was restored to the doxycycline arm, but the v007 doxycycline arm has no renal criterion (doxycycline needs no renal adjustment).",
     "(a) leave the doxycycline arm without a renal criterion and correct nothing (the record is historical); (b) add a renal referral to the doxycycline arm for consistency",
     "(a): doxycycline is not renally cleared to a clinically relevant degree."),
]
