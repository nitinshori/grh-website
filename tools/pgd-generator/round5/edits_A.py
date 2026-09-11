# Round 5, batch A: decisions 1, 2, 4, 6 and 9 (DECISIONS-ANSWERS.md, 11 September 2026).
# Slugs: anti-malarials, travellers-diarrhoea, travel-core, hep-ab-travel, meningitis-b.
# Anchors verified against the masters in masters_r4.json with dump.py and a dry run of
# grh_reissue.apply_edits on an in-memory copy. Every anchor below occurs exactly once in
# its document unless nth is given.

EDITS = {
    # ── Decision 1: UKMEAG weight bands with decimal boundaries, adult tablet from 40 kg ──
    "anti-malarials": {
        "edits": [
            # Arm 1 preamble (the two-strengths warning)
            ("replace",
             "TWO STRENGTHS. Malarone Paediatric 62.5mg/25mg is used from 11kg to 40kg. The adult 250mg/100mg tablet is used only above 40kg. Supplying the adult tablet to a child in the 11 to 20kg band gives four times the intended atovaquone dose.",
             "TWO STRENGTHS. Malarone Paediatric 62.5mg/25mg is used from 11kg to 39.9kg. The adult 250mg/100mg tablet is used only from 40kg. Supplying the adult tablet to a child in the 11 to 19.9kg band gives four times the intended atovaquone dose."),
            # Arm 1 dose row: UKMEAG Table 5 bands (x to y.9 kg), adult tablet from 40 kg
            ("replace", "11 to 20kg: ONE paediatric tablet (62.5/25mg) once daily.",
             "11 to 19.9kg: ONE paediatric tablet (62.5/25mg) once daily."),
            ("replace", "21 to 30kg: TWO paediatric tablets once daily.",
             "20 to 29.9kg: TWO paediatric tablets once daily."),
            ("replace", "31 to 40kg: THREE paediatric tablets once daily.",
             "30 to 39.9kg: THREE paediatric tablets once daily."),
            ("replace", "Over 40kg: ONE adult tablet (250/100mg) once daily.",
             "40kg and over: ONE adult tablet (250/100mg) once daily."),
            ("insert_after", "40kg and over: ONE adult tablet (250/100mg) once daily.", [
                "The bands are the UKMEAG 2026 bands (Table 5) and run to x.9kg, so every measured weight falls in exactly one band: 19.9kg is one paediatric tablet and 20.0kg is two; 39.9kg is three paediatric tablets and 40.0kg is one adult tablet. Weights are read to one decimal place as measured.",
            ]),
            # Arm 3 dose row: UKMEAG Table 3 bands
            ("replace", "Over 45kg: ONE tablet (250mg) once weekly.",
             "45kg and over: ONE tablet (250mg) once weekly."),
            ("replace", "31 to 45kg: THREE QUARTERS of a tablet once weekly.",
             "25 to 44.9kg: THREE QUARTERS of a tablet once weekly."),
            ("replace", "21 to 30kg: HALF a tablet once weekly.",
             "16 to 24.9kg: HALF a tablet once weekly."),
            ("replace", "5 to 20kg: ONE QUARTER of a tablet once weekly.",
             "5 to 15.9kg: ONE QUARTER of a tablet once weekly."),
            ("insert_after", "5 to 15.9kg: ONE QUARTER of a tablet once weekly.", [
                "The bands are the UKMEAG 2026 bands (Table 3) and run to x.9kg: 24.9kg is half a tablet and 25.0kg is three quarters; 44.9kg is three quarters and 45.0kg is one tablet.",
            ]),
            # Arm 3 records row: the adult dose now starts at 45 kg, so the band is recorded below 45 kg
            ("replace", "BODY WEIGHT in kilograms for every patient of 45kg or under, and the weight band applied.",
             "BODY WEIGHT in kilograms for every patient under 45kg, and the weight band applied."),
            # Appendix 1
            ("replace", "Weight, not age, determines the dose AND the product strength. Weigh every child.",
             "Weight, not age, determines the dose AND the product strength. Weigh every child. The bands are the UKMEAG 2026 bands and run to x.9 kg, so every weight has one band: 19.9 kg is one paediatric tablet and 20.0 kg is two; the adult tablet is used from 40 kg."),
            ("insert_after", "Weight, not age, determines the dose AND the product strength. Weigh every child. The bands are the UKMEAG 2026 bands and run to x.9 kg, so every weight has one band: 19.9 kg is one paediatric tablet and 20.0 kg is two; the adult tablet is used from 40 kg.", [
                "Mefloquine bands (UKMEAG Table 3) are in the Arm 3 dose row: 5 to 15.9 kg one quarter of a tablet, 16 to 24.9 kg half, 25 to 44.9 kg three quarters, 45 kg and over one tablet, once weekly.",
            ]),
            ("replace", "11 to 20 kg", "11 to 19.9 kg"),
            ("replace", "21 to 30 kg", "20 to 29.9 kg"),
            ("replace", "31 to 40 kg", "30 to 39.9 kg"),
            ("replace", "Over 40 kg", "40 kg and over"),
        ],
        "changes": [
            "Decision 1: the atovaquone/proguanil weight bands in the Arm 1 dose row and Appendix 1 were rewritten to the UKMEAG 2026 Table 5 bands with decimal boundaries (11 to 19.9 kg one paediatric tablet, 20 to 29.9 kg two, 30 to 39.9 kg three, 40 kg and over one adult tablet), the adult tablet is stated as used from 40 kg rather than above 40 kg, and the two-strengths warning names the 11 to 19.9 kg band; every measured weight now falls in exactly one band.",
            "Decision 1: the mefloquine dose bands in the Arm 3 dose row were rewritten to the UKMEAG 2026 Table 3 bands (5 to 15.9 kg one quarter, 16 to 24.9 kg half, 25 to 44.9 kg three quarters, 45 kg and over one tablet), the Arm 3 records row now records the band for every patient under 45 kg, and Appendix 1 cross-refers to the mefloquine bands.",
        ],
    },

    # ── Decision 2: high fever defined as 38 C or above ──
    "travellers-diarrhoea": {
        "edits": [
            ("replace",
             "- Known allergy to azithromycin or other macrolide antibiotics.\n- Severe liver disease or significant hepatic dysfunction.\n- Concomitant medications known to prolong the QT interval.\n- Bloody diarrhoea, high fever, or signs of systemic illness.\n- Current symptoms that have lasted more than 72 hours without improvement: refer, do not supply. A standby course is not for a patient who is already unwell.",
             "- Known allergy to azithromycin or other macrolide antibiotics.\n- Severe liver disease or significant hepatic dysfunction.\n- Concomitant medications known to prolong the QT interval.\n- Bloody diarrhoea, high fever (a temperature of 38 C or above), or signs of systemic illness.\n- Current symptoms that have lasted more than 72 hours without improvement: refer, do not supply. A standby course is not for a patient who is already unwell."),
        ],
        "changes": [
            "Decision 2: high fever in the exclusion criteria is now defined as a temperature of 38 C or above, the sepsis threshold used across the Get Real Health PGDs; the consultation tool applies the same figure.",
        ],
    },

    # ── Decision 4: Dukoral severe immunocompromise defined; other immunosuppression a caution ──
    "travel-core": {
        "edits": [
            ("replace", "Severe immunocompromise (though vaccine is inactivated)",
             "Severe immunocompromise: current chemotherapy or other immunosuppressive therapy for malignancy; a solid organ or bone marrow transplant within the previous 6 months; or systemic corticosteroids at 20 mg/day prednisolone (or 2 mg/kg/day) or more for 2 weeks or longer within the previous 4 weeks. The vaccine is inactivated and cannot cause infection, but the response is likely to be inadequate: refer for specialist advice rather than supplying."),
            ("replace", "Caution with immunocompromised patients (may have reduced response)",
             "Other immunosuppression below the exclusion threshold (for example HIV infection, immunosuppressive medicines at a lower dose, or a transplant more than 6 months ago): the vaccine may be given but the response may be reduced. Seek specialist advice where the degree of immunosuppression is uncertain, and advise that food and water precautions remain essential."),
        ],
        "changes": [
            "Decision 4: the Dukoral exclusion for severe immunocompromise is now defined (current chemotherapy or other immunosuppressive therapy for malignancy, a transplant within the previous 6 months, or systemic corticosteroids at 20 mg/day prednisolone or 2 mg/kg/day or more for 2 weeks or longer within the previous 4 weeks, the definition used in the dengue PGD), and the Dukoral caution now covers other immunosuppression below that threshold, so the boundary between the exclusion and the caution is stated.",
        ],
    },

    # ── Decision 6: standard consent in children block (parental responsibility or Gillick) ──
    "hep-ab-travel": {
        "edits": [
            # Training row: the estate's standard bullet (wording from the rabies PGD), after the travel risk assessment bullet
            ("insert_after", "All users must be competent in travel risk assessment, including destination, duration and activity", [
                "All users must be competent in assessing consent in children and young people, including parental responsibility and Gillick competence. This PGD is available from 1 year of age, so children are in scope",
            ]),
            ("replace", "All users must understand the concepts of capacity and consent and be aware of the Mental Capacity Act 2005",
             "All users must understand capacity and consent, including the Mental Capacity Act 2005, and must be able to assess consent in children and young people where this PGD covers them"),
            # Inclusion criterion (both vaccines)
            ("replace", "Valid informed consent obtained: from the patient where aged 16 or over, and from a person with parental responsibility where the patient is under 16.",
             "Valid informed consent obtained. Where the individual is under 16, from a person with parental responsibility, or from the young person where assessed as Gillick competent, with the basis of that assessment recorded. A parent accompanying a child does not automatically hold parental responsibility; ask."),
            # Exclusion criterion
            ("insert_after", "The patient requires proof of immunity, since serology is out of scope.", [
                "Under 16 and valid consent cannot be obtained from a person with parental responsibility, and the young person is not assessed as Gillick competent.",
            ]),
            # Records row
            ("replace", "that valid informed consent was given, and by whom where the patient is under 16",
             "that valid informed consent was given, and from whom. Where the individual is under 16, the name and relationship of the person with parental responsibility, or the basis of the Gillick assessment"),
        ],
        "changes": [
            "Decision 6: the estate's standard consent in children and young people block was added, in the wording used by the rabies PGD: a training requirement to assess consent in children including parental responsibility and Gillick competence, an inclusion criterion that consent for a patient under 16 comes from a person with parental responsibility or from the young person where assessed as Gillick competent with the basis recorded, a matching exclusion where neither is available, and a records requirement for the name and relationship of the consenting adult or the basis of the Gillick assessment; the consultation tool offers Gillick competence from 12 to 15 years.",
        ],
    },

    # ── Decision 9: Bexsero 12 to 23 months rewritten to the SmPC schedule ──
    "meningitis-b": {
        "edits": [
            ("replace",
             "Infants under 12 months outside the NHS programme: 2 doses at least 4 weeks apart, followed by a booster at 12 months. Children 12 months to under 2 years who had fewer than 2 doses in the first year: 2 further doses at least 4 weeks apart. Aged 2 years and over, including adolescents and adults: 2 doses at least 1 month apart.",
             "Infants under 12 months outside the NHS programme: 2 doses at least 4 weeks apart, followed by a booster at 12 months. "
             "Children 12 months to under 2 years, according to the Bexsero doses given in the first year (Bexsero SmPC section 4.2, Table 1): "
             "none, 2 doses at least 2 months apart, followed by a booster 12 to 23 months after the second dose; "
             "one, one further dose at least 2 months after it to complete the primary course, followed by a booster 12 to 23 months after that dose; "
             "two, a single booster dose at least 2 months after the second primary dose (at least 6 months where the primary course was given at 2 to 5 months of age) and before the second birthday. "
             "Aged 2 years and over, including adolescents and adults: 2 doses at least 1 month apart; a child whose 2 dose primary course was completed at 12 to 23 months of age has the booster 12 to 23 months after the second primary dose."),
        ],
        "changes": [
            "Decision 9: the Bexsero schedule for children aged 12 months to under 2 years was rewritten to the Bexsero SmPC (section 4.2, Table 1, revised 14 March 2025): an unvaccinated child has 2 doses at least 2 months apart followed by a booster 12 to 23 months after the second dose; a child with one dose in the first year completes the primary course with one further dose at least 2 months later and then has the same booster; a child with two doses in the first year has a single booster before the second birthday; and the 2 years and over row now carries the booster for a primary course completed at 12 to 23 months. The consultation tool's doses-in-first-year field drives the same schedule. The one-dose-in-the-first-year arm interpolates between the SmPC rows and is for Chris Pilkington to confirm.",
        ],
    },
}
