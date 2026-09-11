# Round 5, batch B: signatories' decisions 10, 13, 14, 15 and 16 (11 September 2026).
# Slugs: pneumococcal (decision 10), shingles-vaccine (decisions 13, 14, 15), covid-booster (decision 16).
# Anchors verified against the masters in masters_r4.json with dump.py / apply_edits.
# Sources used for the drafted text: Green Book chapter 25 (Pneumococcal), 29 July 2026 edition;
# Green Book chapter 28a (Shingles), 12 August 2025 edition (changes from 1 September 2025);
# Shingrix SmPC (emc, current); COVID-19 PGD v007 guideline summary for the 2026/27 cohorts.
#
# shingles-vaccine: the signed document is a single-table PGD, so the new Arm 2 (aged 18 to 49,
# severely immunosuppressed) is written into the same rows as Arm 1, each row stating what applies
# to both arms and what applies to one arm only. The product, route, storage, adverse effects,
# yellow card, written information and reference rows are common to both arms and unchanged.

BOX1_SHORT = (
    "Green Book chapter 28a, Box 1 (severe immunosuppression): acute or chronic leukaemia or clinically aggressive "
    "lymphoma less than 12 months from cure; chronic lymphoproliferative disorder or haematological malignancy under "
    "follow-up (indolent lymphoma, chronic lymphoid leukaemia, myeloma, Waldenstrom's macroglobulinaemia, other plasma "
    "cell dyscrasias); HIV with a current CD4 count below 200 cells per microlitre; primary or acquired cellular or "
    "combined immune deficiency (lymphocytes below 1,000 per microlitre or a functional lymphocyte disorder); stem cell "
    "transplant in the previous 24 months, or longer ago with ongoing immunosuppression or graft versus host disease; "
    "immunosuppressive chemotherapy or radiotherapy in the past 6 months; immunosuppressive therapy for a solid organ "
    "transplant in the past 6 months; targeted therapy for autoimmune disease in the past 3 months (JAK inhibitors, "
    "biologic immune modulators, TNF inhibitors, IL-6, IL-17, IL-12/23 or IL-23 inhibitors; B-cell therapies such as "
    "rituximab count for 6 months); chronic immune-mediated inflammatory disease treated with prednisolone 20mg or more "
    "a day for more than 10 days in the past month, or 10mg or more a day for more than 4 weeks in the past 3 months, "
    "or a non-biological immune-modulating drug above the Box 1 threshold (methotrexate over 20mg a week, azathioprine "
    "over 3mg/kg/day, mercaptopurine over 1.5mg/kg/day, mycophenolate over 1g/day) in the past 3 months, or a Box 1 "
    "combination (prednisolone 7.5mg or more a day with another immunosuppressant other than hydroxychloroquine or "
    "sulfasalazine; methotrexate with leflunomide); or a short course of prednisolone over 40mg a day for more than a "
    "week for any reason in the past month."
)

EDITS = {
    # ------------------------------------------------------------------ decision 10
    "pneumococcal": {
        "edits": [
            ("replace", "Summary of the governing guidance for pneumococcal vaccination: Green Book chapter 25 (Pneumococcal), the JCVI advice on PCV20 and the Prevenar 20, Prevenar 13 and Pneumovax 23 SmPCs. NICE CKS 'Immunizations - pneumococcal' summarises the same programme.",
             "Summary of the governing guidance for pneumococcal vaccination: Green Book chapter 25 (Pneumococcal), edition of 29 July 2026, the JCVI advice of June 2023 that PPV23 or PCV20 may be used in the adult and at-risk programmes, the JCVI advice of June 2024 on people experiencing homelessness, and the Prevenar 20, Prevenar 13 and Pneumovax 23 SmPCs. NICE CKS 'Immunizations - pneumococcal' summarises the same programme."),
            ("replace", "Note: this summary describes the national programme, which uses Prevenar 20 (PCV20) from July 2026 and previously PCV15 or PCV13, and includes the infant schedule. The products authorised under this PGD are Prevenar 13 and Pneumovax 23 only, for individuals aged 2 years and over; the infant schedule is outside this PGD.",
             "Note: this summary describes the national programme as set out in the July 2026 Green Book chapter, which moved adults at 65 and the clinical risk groups from PPV23 to Prevenar 20 (PCV20) in early 2026 and includes the infant schedule. The products authorised under this PGD are Prevenar 13 and Pneumovax 23 only, for individuals aged 2 years and over. Prevenar 20 and the infant schedule are outside this PGD: where national guidance indicates PCV20 for the individual and it is not held, refer to the GP."),
            ("replace", "Types of Pneumococcal Vaccines Used in the UK", "Pneumococcal Vaccines Available in the UK (Green Book Table 1)"),
            ("replace", "PCV15 or PCV13 (Prevenar 15 / 13):", "Pneumococcal conjugate vaccines (PCV): Prevenar 13 (PCV13), Vaxneuvance (PCV15), Prevenar 20 (PCV20) and Capvaxive (PCV21):"),
            ("replace", "Conjugate vaccines, used in infants and selected high-risk groups.",
             "Prevenar 13 is the routine infant vaccine. Prevenar 20 has been used in the adult (65 years) and at-risk programmes since early 2026 and replaces PPV23 as national stock. Vaxneuvance (from 6 weeks) and Capvaxive (from 2 years, approved by the MHRA in 2026) are licensed but not in the national programme."),
            ("replace", "PPSV23 (Pneumovax 23):", "Pneumococcal polysaccharide vaccine (PPV23, Pneumovax 23):"),
            ("replace", "Polysaccharide vaccine, protects against 23 serotypes.",
             "Protects against 23 serotypes. Children under 2 years respond poorly and there is no evidence of effectiveness below that age."),
            ("replace", "Used in adults and older children at risk of IPD.",
             "Recommended for risk groups since 1992 and for everyone aged 65 and over since 2003. PPV23 is no longer available to order through the national programme; locally held stocks are used up first, then PCV20."),
            ("replace", "PCV15 (or PCV13) is given as:", "PCV13 (Prevenar 13) is given as:"),
            ("replace", "First dose at 12 weeks",
             "A single priming dose at 16 weeks of age (moved from 12 weeks on 1 July 2025 so that the second MenB dose can be given at 12 weeks)"),
            ("replace", "Booster at 1 year (as part of routine infant immunisation)",
             "A booster dose at 1 year of age (on or after the first birthday), with the other vaccines due at that age"),
            ("replace", "Note: The exact schedule may vary based on updated UKHSA recommendations.",
             "Doses of any PCV given before 12 weeks of age are discounted. An unimmunised or partially immunised child aged 1 to under 2 years has a single dose of PCV13; routine PCV is not offered after the second birthday. The infant schedule is outside this PGD."),
            ("replace", "At-Risk Groups (Eligible for Additional Vaccination)", "Clinical Risk Groups (Green Book Table 2)"),
            ("replace", "Offer PPSV23 (or PCV plus PPSV23) to individuals aged 2 years and over with:",
             "Offer a single dose of PPV23 or PCV20 to individuals aged 2 years and over with:"),
            ("replace", "Chronic respiratory, heart, kidney, liver or neurological conditions",
             "Asplenia or splenic dysfunction (including homozygous sickle cell disease, hereditary spherocytosis, thalassaemia major and coeliac disease with splenic dysfunction); chronic respiratory disease (COPD, bronchiectasis, cystic fibrosis, interstitial lung fibrosis, pneumoconiosis, bronchopulmonary dysplasia, and neurological or neuromuscular disease that compromises respiratory function; asthma only where it needs continuous or frequently repeated systemic steroids); chronic heart disease; chronic kidney disease (nephrotic syndrome, CKD stage 4 or 5, dialysis or kidney transplant); chronic liver disease (cirrhosis, biliary atresia, chronic hepatitis)"),
            ("replace", "Diabetes", "Diabetes mellitus requiring insulin or anti-diabetic medication (not diabetes that is diet controlled only)"),
            ("replace", "Immunosuppression (e.g. HIV, chemotherapy, asplenia)",
             "Immunosuppression due to disease or treatment, including chemotherapy, bone marrow transplant, asplenia or splenic dysfunction, complement disorder, HIV infection at all stages, multiple myeloma, genetic disorders affecting the immune system (IRAK-4, NEMO), and systemic steroids for more than a month at a dose equivalent to prednisolone 20mg or more a day (or 1mg/kg a day in a child under 20kg)"),
            ("replace", "Cochlear implants", "Cochlear implants (immunisation must not delay the implantation)"),
            ("replace", "CSF leaks", "Cerebrospinal fluid leaks following trauma or major skull surgery (not CSF shunts)"),
            ("replace", "Sickle cell disease or other haemoglobinopathies",
             "Occupational risk from frequent or continuous exposure to metal fumes, such as welders (PPV23, PCV20 or PCV21, one dose if none given before); and people experiencing homelessness (rough sleepers and those using homeless hostels or night shelters, JCVI June 2024)"),
            ("replace", "High-risk children under 2 years may receive additional PCV doses on a tailored schedule.",
             "Children under 2 years in a clinical risk group receive additional PCV doses on the Green Book Table 3 schedule (PCV20 for asplenia, splenic dysfunction, complement disorder or severe immunocompromise); this is outside this PGD."),
            ("replace", "All adults aged 65 years are offered a single dose of PPSV23, unless already vaccinated.",
             "All adults are offered a single dose of PPV23 or PCV20 at 65 years of age. An individual who has already received PPV23 or PCV20 because they are in a clinical risk group does not need another dose at 65, whatever the interval. Revaccination every 5 years with PPV23 or PCV20 is recommended only for asplenia, splenic dysfunction (including sickle cell disease) and chronic kidney disease; it is not recommended for any other risk or age group. Antibody testing before vaccination is not required."),
            ("replace", "Vaccination Schedule by Risk Group (Simplified)", "Vaccination Schedule by Group (Green Book chapter 25, July 2026, simplified)"),
            ("replace", "PCV15/13 at 12 weeks + booster at 1 year", "PCV13 at 16 weeks and a booster at 1 year (on or after the first birthday)"),
            ("replace", "Routine", "Routine; outside this PGD"),
            ("replace", "Adults ≥65", "Adults aged 65 and over"),
            ("replace", "PPSV23 (one-off)", "PPV23 or PCV20, single dose"),
            ("replace", "Even if healthy", "Even if healthy. No dose at 65 where PPV23 or PCV20 was already given for a risk group"),
            ("replace", "At-risk ≥2 years", "Clinical risk groups aged 2 years and over (other than the next row)"),
            ("replace", "PPSV23", "One PPV23 or one PCV20"),
            ("replace", "May also need PCV if never received",
             "No further PCV13 is needed from 2 years of age, whatever the earlier PCV history (Green Book Table 3). Repeat every 5 years only for asplenia, splenic dysfunction or chronic kidney disease"),
            ("replace", "Severely immunocompromised", "Asplenia, splenic dysfunction, complement disorder or severe immunocompromise, aged 2 years and over"),
            ("replace", "PCV followed by PPSV23 after ≥8 weeks",
             "Asplenia, splenic dysfunction or complement disorder: one PPV23 or PCV20. Severe immunocompromise (bone marrow transplant, acute or chronic leukaemia, multiple myeloma, genetic immune disorders): one dose of PCV20 whatever the previous PCV history, then PPV23 or PCV20 at least 4 weeks later; bone marrow transplant recipients have two PCV20 doses at least 4 weeks apart"),
            ("replace", "Requires specialist input",
             "Requires specialist input. Prevenar 20 is not authorised under this PGD: refer. Where Prevenar 13 is given under this PGD and PPV23 is also indicated, this PGD keeps the 8 week interval stated in the Prevenar 13 arm, which is longer than the Green Book minimum of 4 weeks"),
            ("replace", "Severe allergic reaction to previous dose or vaccine component.",
             "Confirmed anaphylactic reaction to a previous dose of a pneumococcal vaccine, or to any component or residue from the manufacturing process. When in doubt seek specialist advice rather than withholding vaccine."),
            ("replace", "Acute febrile illness (defer until recovery).",
             "Acute illness: postpone until fully recovered. Minor illness without fever or systemic upset is not a reason to postpone."),
            ("insert_after", "Acute illness: postpone until fully recovered. Minor illness without fever or systemic upset is not a reason to postpone.", [
                "Pregnancy and breastfeeding: pneumococcal vaccines may be given in pregnancy when protection is needed without delay; there is no evidence of risk from inactivated vaccines in pregnancy or breastfeeding.",
                "Timing around splenectomy or immunosuppressive treatment: vaccinate ideally 4 to 6 weeks, and at least 2 weeks, before elective splenectomy, chemotherapy or radiotherapy; where that is not possible, vaccinate at least 2 weeks after splenectomy or at least 3 months after completing chemotherapy or radiotherapy (leukaemia: 6 months after chemotherapy; bone marrow transplant: from 9 to 12 months after transplant). Treatment is never delayed for vaccination, and vaccination is not delayed where that would mean it never happens.",
            ]),
            ("replace", "Mild: redness, swelling, pain at injection site; low-grade fever",
             "PPV23: mild soreness and induration at the injection site for 1 to 3 days, less commonly a low-grade fever; reactions are commoner in people with high existing antibody levels. PCV13 (children): injection site reactions, fever, irritability, decreased appetite, sleep changes. PCV20 (adults): injection site pain, muscle pain, fatigue, headache, joint pain."),
            ("replace", "Rare: allergic reaction", "Rare: allergic reaction including anaphylaxis."),
            ("replace", "Can be given with other vaccines (e.g. flu, COVID-19), in a different limb or site.",
             "Pneumococcal vaccines can be given at the same time as any other vaccine (including influenza and COVID-19) at a separate site, preferably a different limb, or at least 2.5cm apart in the same limb. Record the site of each vaccine."),
            ("replace", "Record vaccine name, batch number, site, date, and route.",
             "Record the vaccine name and brand, batch number, expiry date, site, date and route."),
        ],
        "changes": [
            "Decision 10: the guidance summary was rewritten against Green Book chapter 25 of 29 July 2026 (Prevenar 20 in the adult and at-risk programmes from early 2026 with PPV23 stock used up first, Capvaxive licensed but not in the programme, infant PCV13 at 16 weeks and 1 year, the Table 2 clinical risk groups including occupational metal fume exposure and people experiencing homelessness, no further PCV13 from 2 years of age, PCV20 for severe immunocompromise, 5-yearly revaccination only for asplenia, splenic dysfunction and chronic kidney disease, contraindications, timing around splenectomy and immunosuppressive treatment, pregnancy, side effects by product and co-administration); the Pneumovax 23 and Prevenar 13 arms are unchanged and the summary states that Prevenar 20 is not authorised under this PGD and that the Prevenar 13 arm keeps its 8 week interval before PPV23.",
        ],
    },

    # ------------------------------------------------------------------ decisions 13, 14, 15
    "shingles-vaccine": {
        "edits": [
            # Guidance summary
            ("replace", "Suitable for people aged 50 years and older, or 18 and over if immunocompromised (the latter group is not covered by this PGD: refer).",
             "Licensed for adults aged 50 years and older, and for adults aged 18 years and older at increased risk of shingles. This PGD covers adults aged 50 and over (Arm 1) and adults aged 18 to 49 who are severely immunosuppressed as defined in Green Book chapter 28a, Box 1 (Arm 2)."),
            ("replace", "All individuals aged 65 years, starting from 1 September 2023.",
             "Routine offer at 65 and 70 years of age from 1 September 2023, moving in stages towards a routine offer at 60. Anyone previously eligible remains eligible until their 80th birthday; where the first dose was given before 80, the second dose is given before the 81st birthday."),
            ("replace", "Immunocompromised individuals:", "Severely immunosuppressed individuals:"),
            ("replace", "Aged 18 years and over are eligible for Shingrix® under the Green Book and SmPC, but THIS PGD covers individuals aged 50 and over only; an immunosuppressed adult under 50 is referred.",
             "From 1 September 2025 all severely immunosuppressed individuals aged 18 years and over are eligible for Shingrix on the NHS, with no upper age limit. This PGD covers them from 18 to 49 under Arm 2 and from 50 under Arm 1."),
            ("replace", "Includes those with conditions such as leukaemia, HIV, or on immunosuppressive therapy.",
             BOX1_SHORT + " Short high-dose courses of up to 40mg prednisolone a day for acute asthma, COPD or COVID-19, replacement corticosteroids, and topical or inhaled corticosteroids do not count. Primary humoral immunodeficiencies without a T-cell defect are not an indication without immunologist advice. If in doubt, discuss with the specialist. A patient who has had 2 doses of Shingrix does not need the course repeated on becoming immunosuppressed; a Zostavax recipient who becomes severely immunosuppressed is offered 2 doses of Shingrix."),
            ("replace", "Two doses given 2 to 6 months apart.",
             "Two doses of 0.5 mL. Aged 50 and over: second dose 2 to 6 months after the first (SmPC). Severely immunosuppressed: second dose 8 weeks to 6 months after the first (Green Book; the SmPC permits 1 to 2 months). If the course is interrupted or delayed, give the second dose as soon as possible and do not repeat the first dose (Green Book, previous incomplete vaccination)."),
            ("insert_after", "Two doses of 0.5 mL. Aged 50 and over: second dose 2 to 6 months after the first (SmPC). Severely immunosuppressed: second dose 8 weeks to 6 months after the first (Green Book; the SmPC permits 1 to 2 months). If the course is interrupted or delayed, give the second dose as soon as possible and do not repeat the first dose (Green Book, previous incomplete vaccination).", [
                "NHS entitlement: a patient who is eligible for Shingrix on the NHS (aged 65 to 79, or severely immunosuppressed and aged 18 or over) is told so before a private supply proceeds, and the record shows this. NHS eligibility is not a condition of supply under this PGD, which follows the licensed indication.",
            ]),
            ("replace", "Record date, site, batch number, and brand of vaccine.",
             "Record date, site, batch number, expiry date and brand of vaccine, the dose number and the arm; for Arm 2 the Box 1 category and the condition or therapy relied on."),
            # PGD table
            ("replace", "Shingrix is indicated for the prevention of herpes zoster (shingles) and herpes zoster-related postherpetic neuralgia in individuals aged 50 years and older.",
             "Shingrix is indicated for the prevention of herpes zoster (shingles) and herpes zoster-related postherpetic neuralgia in adults aged 50 years and older, and in adults aged 18 years and older at increased risk of herpes zoster. This PGD has two arms.\nArm 1: adults aged 50 years and over.\nArm 2: adults aged 18 to 49 years who are severely immunosuppressed as defined in Green Book chapter 28a, Box 1."),
            ("replace_contains", "Patient is eligible under national immunisation guidelines.",
             "Both arms:\n- Has not completed a two-dose course of Shingrix. Dose 2 may be given under this PGD where dose 1 was given elsewhere; record the date of dose 1. Previous Zostavax is not an exclusion.\n- No history of shingles in the past 12 months.\n- Informed consent obtained.\n- Where the patient is eligible for Shingrix on the NHS (aged 65 to 79, or severely immunosuppressed and aged 18 or over), they have been told so before a private supply proceeds, and this is recorded. NHS eligibility is not otherwise a condition of supply.\nArm 1 (aged 50 and over):\n- Individuals aged 50 years or older, within the licensed indication.\nArm 2 (aged 18 to 49, severely immunosuppressed):\n- Individuals aged 18 to 49 years who are severely immunosuppressed as defined in " + BOX1_SHORT + "\n- The condition or therapy relied on, and its dates, are documented in the record. Where there is any doubt whether the Box 1 definition is met, the treating specialist or GP has confirmed it before vaccination."),
            ("replace_contains", "Hypersensitivity to any component of the vaccine.",
             "Both arms:\n- Hypersensitivity to any component of the vaccine.\n- Pregnancy or breastfeeding (not routinely recommended).\nArm 2 only (refer to the GP or treating specialist):\n- Aged under 18 years.\n- Immunosuppression that does not meet the Green Book Box 1 definition, including short courses of prednisolone up to 40mg a day for acute asthma, COPD or COVID-19, replacement corticosteroids, and topical or inhaled corticosteroids.\n- Primary humoral immunodeficiency (for example X-linked agammaglobulinaemia) without a T-cell defect, unless an immunologist has advised vaccination.\n- Not yet immunosuppressed but about to start immunosuppressive therapy: the treating specialist or GP can start the course before treatment on the Green Book timing (ideally one month, at least 14 days, before therapy).\n- Doubt whether the Box 1 definition is met that the specialist or GP has not resolved."),
            ("replace_contains", "Counsel patient that systemic side effects are common and generally self-limiting.",
             "Counsel patient that systemic side effects are common and generally self-limiting. In Arm 2 (and in immunosuppressed patients aged 50 and over) injection site pain, fatigue, myalgia, headache, shivering and fever are reported more often.\n\nObserve every patient for 15 minutes after vaccination, seated, and record that the observation period was completed (see Vaccine safety requirements).\n\nAllow appropriate spacing from other vaccines (e.g., COVID-19 or influenza) based on clinical judgement.\n\nArm 2: the immune response may be reduced; advise that protection may be limited. Give the second dose 8 weeks to 6 months after the first so that protection is not delayed.\n\nA second dose more than 6 months after the first is given as soon as possible; the course is not restarted and dose 1 is not repeated (Green Book chapter 28a)."),
            ("replace", "0.5 mL dose given twice, with the second dose 2 to 6 months after the first.",
             "0.5 mL dose given twice.\nArm 1 (aged 50 and over): second dose 2 to 6 months after the first.\nArm 2 (aged 18 to 49, severely immunosuppressed): second dose 8 weeks to 6 months after the first (Green Book chapter 28a; the Shingrix SmPC permits 1 to 2 months for immunosuppressed patients, but this PGD uses the Green Book interval).\nBoth arms: where more than 6 months have elapsed since dose 1, give dose 2 as soon as possible and do not restart the course (Green Book). Record the interval."),
            ("replace", "Two doses required, spaced 2–6 months apart.",
             "Two doses. Minimum interval after dose 1: 2 months (Arm 1) or 8 weeks (Arm 2); intended maximum 6 months. A second dose more than 6 months after the first is still given under this PGD, as soon as possible; the course is not restarted."),
            ("insert_after", "details of any adverse drug reactions and actions taken supplied via PGD", [
                "the arm under which the vaccine was given (Arm 1, aged 50 and over; Arm 2, aged 18 to 49 severely immunosuppressed), the dose number, the date of dose 1 and the interval between doses, and batch number and expiry date",
                "for Arm 2, the Green Book chapter 28a Box 1 category that applies and the condition or therapy relied on with its dates, and where there was doubt, the specialist or GP who confirmed it and when",
                "where the patient is eligible for Shingrix on the NHS, that they were told it is free of charge on the NHS before the private supply",
            ]),
            ("replace", "To seek medical advice if side effects are severe or last more than a few days, and to seek urgent help for any sign of an allergic reaction after leaving the pharmacy. Remind the patient of the date the second dose is due.",
             "To seek medical advice if side effects are severe or last more than a few days, and to seek urgent help for any sign of an allergic reaction after leaving the pharmacy. Remind the patient of the date the second dose is due (2 to 6 months after dose 1 in Arm 1; 8 weeks to 6 months in Arm 2), and that a late second dose should still be given as soon as possible without restarting the course."),
        ],
        "changes": [
            "Decision 13: a second dose more than 6 months after the first is now given as soon as possible without restarting the course (Green Book chapter 28a, previous incomplete vaccination), stated in the guidance summary, cautions, dose and frequency, treatment period, records and follow-up rows; the tool no longer stops on a late second dose and instead records the interval.",
            "Decision 14: the inclusion bullet 'eligible under national immunisation guidelines' is replaced by the licensed indication (50 and over) with a requirement that an NHS-eligible patient (aged 65 to 79, or severely immunosuppressed and aged 18 or over) is told Shingrix is free on the NHS before a private supply, with a matching records bullet and guidance summary note.",
            "Decision 15: Arm 2 added for adults aged 18 to 49 who are severely immunosuppressed as defined in Green Book chapter 28a Box 1 (inclusion listing the Box 1 categories, exclusions for immunosuppression outside Box 1, primary humoral immunodeficiency without a T-cell defect, anticipated therapy and unresolved doubt, two 0.5 mL doses 8 weeks to 6 months apart per the Green Book and the Shingrix SmPC, cautions on reduced response, and records of the Box 1 category and the condition or therapy relied on), written into the indication, inclusion, exclusion, cautions, dose, treatment period, records, follow-up and guidance summary rows; drafted from Green Book chapter 28a (12 August 2025) and the Shingrix SmPC for Chris Pilkington to confirm.",
        ],
    },

    # ------------------------------------------------------------------ decision 16
    "covid-booster": {
        "edits": [
            ("insert_after", "This PGD covers privately funded vaccination, whether or not the individual is eligible under the NHS programme. It does not replace the national programme. Individuals who are eligible must be told they can be vaccinated free of charge on the NHS before any private supply proceeds.", [
                "Pregnancy is not itself an eligible group. A pregnant individual is vaccinated under this PGD only where they are in one of the NHS-eligible groups above (aged 75 and over, resident in a care home for older adults, or immunosuppressed); otherwise refer to the GP or maternity service.",
            ]),
            ("insert_after", "A primary course in an individual who is unvaccinated and immunosuppressed, or any schedule requiring more than one dose in the season. Refer.", [
                "Pregnancy, where the individual is not in an NHS-eligible group (aged 75 years and over, resident in a care home for older adults, or immunosuppressed as defined in the COVID-19 chapter of the Green Book). Pregnancy is not itself an eligible group in the 2026/27 programme. Refer to the GP or maternity service. A pregnant individual who is in an NHS-eligible group may be vaccinated under this PGD with an mRNA vaccine, Comirnaty XFG in preference, having been told of their NHS entitlement (see Cautions).",
            ]),
            ("replace", "Pregnancy and breastfeeding. Pregnancy is not itself an eligible group in the 2026/27 NHS programme. The Green Book supports COVID-19 vaccination in pregnancy where the individual is otherwise eligible, and vaccination is safe while breastfeeding. Where the individual is pregnant, confirm the vaccine and indication against current national guidance before proceeding.",
             "Pregnancy and breastfeeding. Pregnancy is not itself an eligible group in the 2026/27 NHS programme. A pregnant individual who is not in an NHS-eligible group is excluded under this PGD: refer (see Exclusion criteria). Where the pregnant individual is in an NHS-eligible group (aged 75 and over, care home resident, or immunosuppressed), the Green Book supports COVID-19 vaccination in pregnancy: tell them of their NHS entitlement, give an mRNA vaccine (Comirnaty XFG in preference; not Nuvaxovid), and record the eligible group that applies. Vaccination is safe while breastfeeding, which is not an exclusion."),
            ("insert_after", "The date of the previous COVID-19 vaccine dose, where known.", [
                "Where the individual is pregnant, the NHS-eligible group that applies and that they were told of their NHS entitlement.",
            ]),
        ],
        "changes": [
            "Decision 16: pregnancy outside an NHS-eligible group (aged 75 and over, care home resident, or immunosuppressed) is now an exclusion with referral to the GP or maternity service, stated in the guideline summary, exclusion criteria, cautions and records rows; a pregnant individual in an NHS-eligible group may still be vaccinated with an mRNA vaccine, Comirnaty XFG in preference, and the tool stops for pregnancy unless an eligible group is recorded and does not offer Nuvaxovid in pregnancy.",
        ],
    },
}
