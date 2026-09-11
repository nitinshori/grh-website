#!/usr/bin/env python3
"""
Round 4, batch 3: document fixes found while aligning and attacking the tools.

Slugs: copd, asthma-rescue, ear-infection, sti-testing, gonorrhoea-treatment,
bv, thrush, emergency-contraception, postnatal-contraception, uti,
period-delay, period-pain, ed, premature-ejaculation, bph, wegovy,
wegovy-oral, mounjaro.

Every edit is anchored on paragraph text that exists verbatim in the current
master docx (masters_r3.json). Edit kinds are those of grh_reissue.apply_edits.
Where an anchor matches two paragraphs (one per arm) and both are intended,
no nth is given; where only one arm is intended, nth is given.
"""

MPG2_OLD = ("NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions. "
            "Published March 2017 https://www.nice.org.uk/guidance/mg2")
MPG2_NEW = ("NICE Medicines Practice Guideline 2 (MPG2): Patient Group Directions. "
            "Published March 2017 https://www.nice.org.uk/guidance/mpg2")

# Anaphylaxis, observation and sharps block, as written into the ceftriaxone
# document on 10 September 2026, for the Depo-Provera arm.
IM_BLOCK = [
    "ADRENALINE (EPINEPHRINE) 1 IN 1,000 INJECTION must be immediately available in the room where "
    "the injection is given, in date, together with a telephone.",
    "A written anaphylaxis protocol consistent with current Resuscitation Council UK guidance must be "
    "available, and every person administering it must be trained in the recognition and immediate "
    "management of anaphylaxis and hold current basic life support training. The SmPC lists "
    "hypersensitivity reactions including anaphylaxis.",
    "Be able to distinguish a faint and a panic attack from anaphylaxis. Green Book chapter 8 sets out "
    "the clinical features of each. A faint after an injection is common; anaphylaxis is very rare.",
    "Report any suspected anaphylaxis via the Yellow Card Scheme even where the diagnosis is uncertain.",
    "OBSERVE EVERY PATIENT FOR 15 MINUTES AFTER THE INJECTION, SEATED. Record that the observation "
    "period was completed.",
    "Anxiety-related reactions including vasovagal syncope, hyperventilation and transient visual "
    "disturbance or paraesthesia can occur before or after any injection. They are a response to the "
    "needle, not to the medicine. Have procedures in place to prevent injury from a faint.",
    "Users must be competent in intramuscular injection technique. Dispose of sharps in a UN-approved "
    "puncture-resistant container in accordance with HTM 07-01. Never re-sheath a needle.",
]

EDITS = {

    # ------------------------------------------------------------------ copd
    "copd": {
        "edits": [
            ("replace_contains",
             "for the administration of Salbutamol 100mcg MDI and Amoxicillin 500mg capsules",
             "Patient Group Direction\nfor the supply of Salbutamol 100mcg MDI and Amoxicillin 500mg "
             "capsules for the treatment of COPD Management"),
            ("replace", "for the supply/administration of", "for the supply of"),
            # both arms together
            ("insert_after",
             "Acute symptom relief in adults with COPD presenting with acute exacerbation or breathlessness",
             ["Where the patient also meets the criteria of the amoxicillin arm, both medicines may be "
              "supplied at the same consultation. Each arm's inclusion and exclusion criteria, dose, "
              "quantity and records apply independently."]),
            ("insert_after",
             "Treatment of infective acute exacerbations of COPD characterised by purulent sputum "
             "(bacterial lower respiratory tract infection)",
             ["Where the patient also meets the criteria of the salbutamol arm, both medicines may be "
              "supplied at the same consultation. Each arm's inclusion and exclusion criteria, dose, "
              "quantity and records apply independently."]),
            # inclusion consistency: the stricter wording in both arms
            ("replace", "Confirmed diagnosis of COPD with spirometry evidence",
             "Confirmed diagnosis of COPD (documented spirometry and GOLD classification)"),
            # salbutamol cautions a pharmacy can act on
            ("replace", "Diabetes mellitus: monitor blood glucose (hyperglycaemia possible)",
             "Diabetes mellitus: hyperglycaemia is possible. Advise a patient who self-monitors to check "
             "blood glucose more often during the exacerbation and to report readings higher than usual "
             "to the GP or diabetes team."),
            ("replace", "Hypokalaemia: may be worsened; monitor K+ levels",
             "Hypokalaemia: may be worsened by beta-2 agonists, particularly with diuretics, "
             "corticosteroids or theophylline. Potassium cannot be measured in the pharmacy; where the "
             "patient is known to have low potassium, inform the GP so that it can be checked."),
            # amoxicillin cautions a pharmacy can act on; no wider-spectrum agent under a PGD
            ("replace", "Mild to moderate renal impairment: monitor renal function; dose adjustment may be needed",
             "Mild to moderate renal impairment (eGFR 30 mL/min/1.73m2 or above): the standard dose is "
             "suitable. Renal function is not monitored under this PGD."),
            ("replace", "Hepatic impairment: generally safe but monitor liver function",
             "Hepatic impairment: generally safe. Liver function is not monitored under this PGD; advise "
             "the patient to seek medical advice if jaundice or dark urine develops during or after the course."),
            ("replace",
             "Check local antibiotic resistance patterns before prescribing (Haemophilus influenzae, "
             "Moraxella catarrhalis, Streptococcus pneumoniae coverage)",
             "Check local antibiotic resistance patterns before supply (Haemophilus influenzae, "
             "Moraxella catarrhalis, Streptococcus pneumoniae coverage)"),
            ("replace", "Use wider-spectrum antibiotics if resistance is a concern in the area",
             "This PGD authorises amoxicillin only. Where local resistance makes amoxicillin unsuitable, "
             "do not supply under this PGD; refer to the GP for an alternative."),
            # follow-up: salbutamol arm loses the amoxicillin lines and gains the reliever limits
            ("insert_after", "Use the rescue inhaler (salbutamol) as needed when you experience breathlessness.",
             ["Do not use more than 8 puffs in 24 hours. If you need it more often than every 4 hours, or "
              "on most days, see your GP the same day. If ten puffs through a spacer give no relief, call 999."],
             1),
            ("delete", "Complete the full course of amoxicillin even if symptoms improve.", None, 1),
            ("delete", "Take amoxicillin at regular intervals, ideally 1 hour before or 2 hours after meals for best absorption.", None, 1),
            ("delete", "If using oral contraception, use additional contraceptive methods during and for 7 days after the antibiotic course.", None, 1),
            # follow-up: amoxicillin arm loses the salbutamol lines (now the second occurrence)
            ("delete", "Use the rescue inhaler (salbutamol) as needed when you experience breathlessness.", None, 2),
            ("delete", "Use a spacer device if you have difficulty coordinating MDI actuation.", None, 2),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Cover and arm headings corrected from administration to supply; both arms are supply.",
            "Both arms state that salbutamol and amoxicillin may be supplied at the same consultation, each on its own criteria and records.",
            "Amoxicillin arm inclusion aligned to the salbutamol arm: documented spirometry and GOLD classification.",
            "Cautions that asked the pharmacy to monitor potassium, blood glucose, renal function or liver function are reworded as actions a pharmacy can take.",
            "The caution permitting wider-spectrum antibiotics is replaced: this PGD authorises amoxicillin only, and a resistance concern is a referral.",
            "Follow-up advice is split by arm: the salbutamol arm no longer tells the patient to complete a course of amoxicillin, and it now carries the 8 puffs in 24 hours limit and the 999 threshold; the amoxicillin arm no longer carries the inhaler lines.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # --------------------------------------------------------- asthma-rescue
    "asthma-rescue": {
        "edits": [
            ("replace_contains",
             "for the administration of Salbutamol 100mcg MDI inhaler and Prednisolone 5mg tablets",
             "Patient Group Direction\nfor the supply of Salbutamol 100mcg MDI inhaler and Prednisolone "
             "5mg tablets for the treatment of Asthma Rescue"),
            ("replace", "for the supply/administration of", "for the supply of"),
            # PEF: 50% or below excludes; below 33% was not literally listed (both arms)
            ("replace",
             "Acute severe or life-threatening asthma: any of unable to complete sentences in one breath, "
             "respiratory rate 25/min or more, heart rate 110/min or more, PEF 33 to 50% of best or "
             "predicted, SpO2 below 92%, silent chest, cyanosis, exhaustion, confusion or poor respiratory "
             "effort. Refer for emergency assessment (999 where life-threatening). Do not supply.",
             "Acute severe or life-threatening asthma: any of unable to complete sentences in one breath, "
             "respiratory rate 25/min or more, heart rate 110/min or more, PEF 50% of best or predicted or "
             "below (33 to 50% is acute severe; below 33% is life-threatening), SpO2 below 92%, silent "
             "chest, cyanosis, exhaustion, confusion or poor respiratory effort. Refer for emergency "
             "assessment (999 where life-threatening). Do not supply."),
            # a relative exclusion is not a PGD exclusion: the safer reading
            ("replace", "Uncontrolled hypertension or cardiac disease (relative - discuss risk/benefit)",
             "Uncontrolled hypertension or unstable cardiac disease. Do not supply under this PGD; refer "
             "to the GP or urgent care."),
            # salbutamol cautions a pharmacy can act on
            ("replace", "Diabetes mellitus: monitor blood glucose (hyperglycaemia can occur)",
             "Diabetes mellitus: hyperglycaemia can occur. Advise a patient who self-monitors to check "
             "blood glucose more often during the exacerbation and to report readings higher than usual "
             "to the GP or diabetes team."),
            ("replace", "Hypokalaemia: may be worsened by beta-2 agonists; monitor potassium levels",
             "Hypokalaemia: may be worsened by beta-2 agonists, particularly with diuretics, "
             "corticosteroids or theophylline. Potassium cannot be measured in the pharmacy; where the "
             "patient is known to have low potassium, inform the GP so that it can be checked."),
            # prednisolone cautions a pharmacy can act on
            ("replace",
             "Diabetes mellitus: corticosteroids can increase blood glucose; monitor BM and adjust "
             "diabetes medication if needed",
             "Diabetes mellitus: corticosteroids raise blood glucose. Advise the patient to check glucose "
             "more often during the course and to contact the GP or diabetes team about readings higher "
             "than usual. Diabetes medicines are not adjusted under this PGD."),
            ("replace", "Peptic ulcer disease or GI upset: consider gastroprotection",
             "Peptic ulcer disease or GI upset: take with food. Gastroprotection is not supplied under "
             "this PGD; where there is a history of peptic ulcer or gastrointestinal bleeding, inform the GP."),
            # one regimen: single daily dose, no divided doses
            ("replace", "40-50mg as a single dose or in divided doses for acute exacerbation",
             "40mg to 50mg once daily, taken as a single dose in the morning, for acute exacerbation. "
             "Record the dose chosen."),
            # follow-up: salbutamol arm loses the prednisolone lines
            ("delete", "Take the full course of prednisolone as prescribed, even if symptoms improve.", None, 1),
            ("delete", "Take prednisolone with food if it causes stomach upset.", None, 1),
            ("delete", "Do not stop prednisolone abruptly; follow the course as directed.", None, 1),
            ("delete", "If diabetic, monitor blood glucose more frequently as prednisolone may raise levels; inform your GP.", None, 1),
            ("delete", "If taking other medications, inform your healthcare provider of steroid use.", None, 1),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Cover and arm headings corrected from administration to supply; both arms are supply.",
            "PEF exclusion in both arms now reads 50% of best or predicted or below, so that a PEF below 33% is excluded in terms and a PEF of exactly 50% is excluded by the inclusion and the exclusion alike.",
            "The relative exclusion for uncontrolled hypertension or cardiac disease in the prednisolone arm is a firm exclusion with a referral; a PGD cannot carry a discuss-risk-benefit exclusion.",
            "Cautions that asked the pharmacy to monitor potassium or blood glucose, adjust diabetes medication or consider gastroprotection are reworded as actions a pharmacy can take.",
            "Prednisolone dose fixed as a single morning dose of 40mg to 50mg daily; divided doses removed.",
            "Salbutamol arm follow-up no longer tells the patient to take a course of prednisolone.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # --------------------------------------------------------- ear-infection
    "ear-infection": {
        "edits": [
            # age boundary in months, matching the licence (one year and older), the cover and the spray arm
            ("replace", "Aged more than 1 year. There is no upper age limit.",
             "Aged 12 months or over (the drops are licensed from the first birthday). There is no upper age limit."),
            ("replace", "Aged 1 year or under. Safety and efficacy below 1 year have not been established.",
             "Aged under 12 months. Safety and efficacy below 1 year of age have not been established."),
            # spray: 7 days fixed, no extension the quantity and course rules cannot support
            ("replace",
             "7 days, extended to a maximum of 14 days only where the patient has clearly improved but "
             "not resolved and the ear has been re-examined. One course per episode.",
             "7 days. One course per episode. A patient not improving at the end of the course is "
             "referred, not re-supplied."),
            ("replace", "Shake the bottle well. One spray into the sore ear, three times a day.",
             "Shake the bottle well. One spray into the sore ear, three times a day, for 7 days."),
            # batch number in both arms' records
            ("insert_after", "Name, form, strength, dose, quantity and date of supply.",
             ["Batch number and expiry date of the product supplied."]),
        ],
        "changes": [
            "Ciprofloxacin arm age boundary stated in months: 12 months or over included, under 12 months excluded, matching the licence, the cover and the spray arm; the whole-year wording admitted and excluded a child aged 1 at the same time.",
            "Spray maximum treatment period fixed at 7 days, one course per episode; the 14 day extension contradicted the one bottle, no repeat supply and one course per episode rules.",
            "Spray counselling states the 7 day course length.",
            "Batch number and expiry date added to the records of both arms.",
        ],
    },

    # ----------------------------------------------------------- sti-testing
    "sti-testing": {
        "edits": [
            ("replace_contains", "for the administration of Doxycycline or Azithromycin",
             "Patient Group Direction\nfor the supply of Doxycycline or Azithromycin for the treatment of Chlamydia"),
            ("replace", "for the supply/administration of", "for the supply of"),
            ("replace", "Doxycycline 100mg", "Doxycycline 100mg capsules"),
            ("replace", "Azithromycin 500mg", "Azithromycin 500mg tablets"),
            ("replace",
             "Doxycycline is indicated for the treatment of uncomplicated genital chlamydia trachomatis "
             "infection in adults and adolescents aged 15 years and over.",
             "Doxycycline is indicated for the treatment of uncomplicated genital chlamydia trachomatis "
             "infection in individuals aged 16 years and over, or aged 13 to 15 where Fraser competence "
             "and a safeguarding assessment are recorded, as set out in the inclusion criteria."),
            ("replace",
             "Azithromycin is indicated for the treatment of uncomplicated genital chlamydia trachomatis "
             "infection in adults and adolescents aged 15 years and over where doxycycline is unsuitable "
             "or contraindicated.",
             "Azithromycin is indicated for the treatment of uncomplicated genital chlamydia trachomatis "
             "infection in individuals aged 16 years and over, or aged 13 to 15 where Fraser competence "
             "and a safeguarding assessment are recorded, as set out in the inclusion criteria, where "
             "doxycycline is unsuitable or contraindicated."),
            ("replace", "14 capsules or tablets.", "14 capsules."),
            ("replace",
             "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 "
             "weeks, or they become systemically very unwell.",
             "Do not have sex, including oral sex and sex with a condom, until 7 days after you and your "
             "partner(s) have completed treatment. Your sexual partners from the last 6 months need to be "
             "tested and treated. Seek medical advice if symptoms worsen, have not settled within 2 weeks "
             "of finishing treatment, or you become systemically unwell. A test of cure is needed at least "
             "3 weeks after treatment if you are pregnant, had rectal infection, had non-standard treatment "
             "or symptoms persist. Retest for reinfection at 3 months."),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Indication rows in both arms updated to 16 and over, or 13 to 15 with recorded Fraser competence and safeguarding assessment; they still said 15 and over after the safeguarding change.",
            "Cover and arm headings corrected from administration to supply.",
            "Doxycycline quantity states 14 capsules; the product is capsules. Azithromycin named as 500mg tablets.",
            "Follow-up advice replaced with chlamydia-specific advice: abstinence for 7 days after both partners are treated, partner notification, test of cure at 3 weeks where indicated, and retest at 3 months.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # -------------------------------------------------- gonorrhoea-treatment
    "gonorrhoea-treatment": {
        "edits": [
            ("replace_contains", "for the treatment of Gonorrhoea Treatment",
             "Patient Group Direction\nfor the administration of Ceftriaxone 1g powder for injection for the treatment of Gonorrhoea"),
            ("replace", "Summary of NICE / NICE CKS Guidelines for Gonorrhoea Treatment",
             "Summary of NICE / NICE CKS Guidelines for Gonorrhoea"),
            ("replace", "Gonorrhoea Treatment", "Gonorrhoea"),
            ("replace",
             "Store reconstituted solution below 25°C. Reconstitute immediately before use with 3.5mL of "
             "1% lidocaine solution for injection.",
             "Unopened vials: store below 25°C in the outer carton to protect from light. Reconstitute "
             "immediately before use with 3.5mL of 1% lidocaine solution for injection and administer at "
             "once; do not store the reconstituted solution."),
            ("replace",
             "Renal impairment: Standard dose suitable for eGFR >30; no dose adjustment needed for "
             "mild-moderate impairment",
             "Renal impairment: no dose adjustment is needed for a single 1g dose (SmPC). Where renal "
             "impairment is severe (eGFR below 30) and there is also hepatic impairment, do not "
             "administer under this PGD; refer."),
            ("replace", "Hepatic impairment: Standard dose acceptable; monitor in severe impairment",
             "Hepatic impairment: the standard single dose is acceptable. Where hepatic impairment is "
             "severe, or renal and hepatic impairment coexist, refer."),
            ("replace", "Anticoagulant therapy: Cephalosporins may potentiate warfarin effect; monitor INR",
             "Anticoagulant therapy: cephalosporins may potentiate the effect of warfarin. Advise the "
             "patient to tell their anticoagulant clinic so that the INR can be checked."),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Title corrected: for the treatment of Gonorrhoea, not Gonorrhoea Treatment.",
            "Storage row states the unopened vial condition and that the reconstituted solution is given at once and not stored.",
            "Renal and hepatic cautions state what to do below eGFR 30 and in severe hepatic impairment, and the warfarin caution is an action the pharmacy can take.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # ------------------------------------------------------------------ bv
    "bv": {
        "edits": [
            ("replace_contains", "for the administration of Metronidazole (oral or vaginal)",
             "Patient Group Direction\nfor the supply of Metronidazole (oral or vaginal) for the treatment of Bacterial Vaginosis"),
            ("replace", "for the supply/administration of", "for the supply of"),
            ("replace", "10-14 tablets (400mg each)",
             "10 to 14 tablets of 400mg for the 5 to 7 day course (10 for 5 days, 12 for 6 days, 14 for "
             "7 days), or 5 tablets of 400mg for the 2g single dose."),
            # oral arm: pregnancy is an exclusion, as the indication says
            ("insert_after", "Active CNS disease or blood dyscrasia",
             ["Pregnancy, known or suspected. Refer to GP or midwife."]),
            ("replace", "Pregnancy (avoid high-dose regimen in first trimester; seek GP guidance)",
             "Pregnancy is an exclusion (above). Refer to GP or midwife."),
            # follow-up split by arm
            ("delete",
             "If using the vaginal gel: You may use the applicator for insertion, but note that it may "
             "damage latex condoms and diaphragms - use alternative contraception.", None, 1),
            ("delete",
             "If taking oral metronidazole: Avoid all alcohol during the course of treatment and for 48 "
             "hours after the last dose. Alcohol can cause a disulfiram-like reaction (flushing, nausea, "
             "vomiting, abdominal pain, headache).", None, 2),
            ("replace",
             "Bacterial vaginosis is not a sexually transmitted infection, but your sexual partner(s) "
             "may not require treatment unless they develop symptoms.",
             "Bacterial vaginosis is not a sexually transmitted infection. Your sexual partner(s) do not "
             "routinely require treatment unless they develop symptoms."),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Cover and arm headings corrected from administration to supply.",
            "Oral arm quantity reconciled with the dose row: 10, 12 or 14 tablets for the 5 to 7 day course, or 5 tablets for the 2g single dose.",
            "Oral arm: pregnancy is an exclusion with a referral, as its indication (non-pregnant women), the gel arm and the guidance summary already said; it was a caution.",
            "Follow-up advice split by arm: the oral arm no longer carries the gel line and the gel arm no longer carries the alcohol line.",
            "Partner advice now reads do not routinely require treatment.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # ---------------------------------------------------------------- thrush
    "thrush": {
        "edits": [
            ("replace_contains", "for the administration of Fluconazole or Clotrimazole",
             "Patient Group Direction\nfor the supply of Fluconazole or Clotrimazole for the treatment of "
             "Vaginal Thrush (Vulvovaginal Candidiasis)"),
            ("replace", "for the supply/administration of", "for the supply of"),
            ("replace", "Treatment of uncomplicated vulvovaginal candidiasis in non-pregnant women aged 16-65 years",
             "Treatment of uncomplicated vulvovaginal candidiasis in non-pregnant women aged 16 to 60 years"),
            ("replace", "Women aged 16-65 years", "Women aged 16 to 60 years"),
            ("replace", "Complete the full course of treatment as prescribed.",
             "This is a single-dose treatment. No further doses are needed unless you are advised otherwise."),
            # pessary arm: pregnancy is an exclusion, as the indication says (second arm only)
            ("insert_after", "Aged under 16 or over 60",
             ["Pregnancy, known or suspected. The indication for this arm is non-pregnant women; refer to the GP or midwife."],
             2),
            ("replace",
             "Pregnancy (topical antifungals are safe in pregnancy, but applicator should not be used; "
             "advise to insert pessary with fingers)",
             "Pregnancy is an exclusion (above). Refer to the GP or midwife. Where a topical antifungal "
             "is prescribed in pregnancy the applicator should not be used."),
            ("replace",
             "P (Pharmacy medicine) for women aged 16 to 60. A PGD is not legally required for a P sale; "
             "this arm is included so that the supply is assessed and recorded to the same standard as a "
             "POM supply. Where the P licence is narrower than this PGD, the P licence governs.",
             "P (Pharmacy medicine) for women aged 16 to 60, which is the age range this PGD covers. A "
             "PGD is not legally required for a P sale; this arm is included so that the supply is "
             "assessed and recorded to the same standard as a POM supply. The conditions of the P "
             "licence (first episode, 2 or more episodes in 6 months, pregnancy, under 16 or over 60, "
             "and the other seek-advice features) are carried in the exclusion criteria above."),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Indication and inclusion rows in both arms now say 16 to 60, matching the exclusion row and the P licence; they said 16 to 65.",
            "Cover and arm headings corrected from administration to supply.",
            "Follow-up advice no longer tells the patient to complete a course; both products are single dose.",
            "Pessary arm: pregnancy is an exclusion with a referral, as its indication (non-pregnant women) says; the caution that allowed the pessary in pregnancy with finger insertion is replaced.",
            "Pessary legal category states which P licence conditions are carried in the exclusion criteria.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # ------------------------------------------------ emergency-contraception
    "emergency-contraception": {
        "edits": [
            ("replace_contains", "for the administration of Levonorgestrel 1.5mg tablets (Levonelle)",
             "Patient Group Direction\nfor the supply of Levonorgestrel 1.5mg tablets (Levonelle) and "
             "Ulipristal acetate 30mg tablets (ellaOne) for Emergency Contraception"),
            ("replace", "for the supply/administration of", "for the supply of"),
            ("replace", "Severe asthma (ulipristal)",
             "Severe asthma insufficiently controlled by oral glucocorticoids (ulipristal)"),
            # under 13: not supplied under this PGD (both arms)
            ("replace",
             "Females of reproductive age. Under 13: any sexual activity is a safeguarding concern; supply "
             "may still be appropriate but a safeguarding referral is MANDATORY. Aged 13 to 15: assess and "
             "record Fraser competence, ask about coercion, the age of the partner and any safeguarding "
             "concern, and follow the local safeguarding pathway. Record the assessment.",
             "Females of reproductive age, aged 13 and over. Under 13: any sexual activity is a "
             "safeguarding concern; do not supply under this PGD, refer to the GP or sexual health service "
             "the same day (emergency contraception is time critical) and make a safeguarding referral. "
             "Aged 13 to 15: assess and record Fraser competence, ask about coercion, the age of the "
             "partner and any safeguarding concern, and follow the local safeguarding pathway. Record "
             "the assessment."),
            ("insert_after", "Known or suspected pregnancy",
             ["Aged under 13. Not supplied under this PGD: same-day referral and a safeguarding referral."]),
            # weight direction visible in the ulipristal arm
            ("insert_after", "Repeated use in the same cycle not recommended",
             ["Weight 70 kg or over, or BMI 26 or over: ulipristal is the preferred oral option (FSRH). "
              "No dose adjustment is needed."]),
            ("delete", "Hormonal contraception should not be started until 5 days after taking ulipristal"),
            # follow-up split by arm
            ("replace",
             "Consider starting or continuing regular contraception (after waiting 5 days if you have "
             "taken ulipristal) - discuss options with your doctor or healthcare provider.",
             "Consider starting or continuing regular contraception straight away; use condoms until it "
             "is reliable. Discuss options with your doctor or healthcare provider.", 1),
            ("replace",
             "Consider starting or continuing regular contraception (after waiting 5 days if you have "
             "taken ulipristal) - discuss options with your doctor or healthcare provider.",
             "Do not start or restart hormonal contraception until 5 days after taking ulipristal, and "
             "use condoms until it is reliable. Discuss options with your doctor or healthcare provider."),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Under 13 is not supplied under this PGD in either arm: same-day referral to the GP or sexual health service and a safeguarding referral. The previous text said supply may still be appropriate.",
            "Guidance summary red flag for ulipristal now matches the exclusion: severe asthma insufficiently controlled by oral glucocorticoids.",
            "Ulipristal arm now carries the weight and BMI direction that only the levonorgestrel arm stated.",
            "Duplicate 5 day line removed from the ulipristal cautions.",
            "Follow-up advice on restarting contraception written per arm.",
            "Cover and arm headings corrected from administration to supply.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # ------------------------------------------------ postnatal-contraception
    "postnatal-contraception": {
        "edits": [
            ("replace_contains",
             "for the administration of Postnatal Contraception for the treatment of Postnatal Contraception",
             "Patient Group Direction\nfor the supply of Desogestrel 75 microgram tablets and the "
             "administration of Medroxyprogesterone acetate 150mg/ml injection (Depo-Provera) for "
             "Postnatal Contraception"),
            ("replace", "for the supply/administration of", "for the supply of", 1),
            ("replace", "for the supply/administration of", "for the administration of", 1),
            # Depo-Provera arm: the intramuscular injection block replaces the redundant adolescent caution
            ("replace", "Adolescents (bone mineral density concern)", IM_BLOCK[0]),
            ("insert_after", IM_BLOCK[0], IM_BLOCK[1:]),
            ("insert_after", "date of supply dose, form and route quantity supplied",
             ["batch number and expiry date of the injection, and the injection site",
              "that the 15 minute observation period was completed"],
             2),
            # follow-up split by arm
            ("delete", "With Depo-Provera, explain that fertility may take 5-6 months to return after the last injection.", None, 1),
            ("delete", "Return for repeat injection every 12 weeks (Depo-Provera).", None, 1),
            ("delete", "Take the tablet at the same time each day (Desogestrel) to maintain effectiveness.", None, 2),
            ("replace",
             "Discuss and explain that irregular bleeding is common with both methods, particularly in the first few months.",
             "Irregular bleeding is common with this method, particularly in the first few months."),
            ("replace", "Both methods are safe during breastfeeding.", "This method is safe during breastfeeding."),
            ("replace", "Take the tablet at the same time each day (Desogestrel) to maintain effectiveness.",
             "Take the tablet at the same time each day. If you are more than 12 hours late, take it as "
             "soon as you remember and use condoms for the next 2 days."),
            ("replace", "With Depo-Provera, explain that fertility may take 5-6 months to return after the last injection.",
             "Fertility may take 5 to 6 months, and sometimes up to a year, to return after the last injection."),
            ("replace", "Return for repeat injection every 12 weeks (Depo-Provera).",
             "Return for the repeat injection every 12 weeks, no more than 5 days early or late."),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Title corrected: supply of desogestrel and administration of Depo-Provera for postnatal contraception; it read for the administration of Postnatal Contraception for the treatment of Postnatal Contraception.",
            "Depo-Provera arm now carries the intramuscular injection provisions written into the other injection documents on 10 September 2026: adrenaline immediately available, anaphylaxis and basic life support training, 15 minute seated observation, faint procedures, injection competence and sharps disposal. The redundant adolescent caution in an 18 and over arm is replaced by it.",
            "Depo-Provera records now require the batch number, expiry date, injection site and completion of the observation period.",
            "Follow-up advice written per arm; each arm carried the other arm's advice.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # ------------------------------------------------------------------- uti
    "uti": {
        "edits": [
            ("replace",
             "Treatment of uncomplicated lower urinary tract infection in a non-pregnant woman aged 16 to "
             "64 years, presenting with dysuria, urinary frequency, urgency or suprapubic discomfort, in "
             "the absence of any red flag in Appendix 1. This is the first line medicine under this PGD.",
             "Treatment of uncomplicated lower urinary tract infection in a non-pregnant woman aged 16 to "
             "64 years, presenting with two or more of dysuria, new nocturia, urinary frequency or "
             "urgency, in the absence of any red flag in Appendix 1. This is the first line medicine "
             "under this PGD."),
            ("insert_after", "No red flag in Appendix 1 present.",
             ["No antibiotic already taken for this episode.",
              "Renal question answered as set out below."],
             2),
            ("replace",
             "Encourage fluids and offer paracetamol or ibuprofen for pain as a separate pharmacy sale, "
             "subject to the usual checks.",
             "Encourage fluids and offer paracetamol, or ibuprofen if preferred and suitable, for pain as "
             "a separate pharmacy sale, subject to the usual checks."),
            ("replace",
             "The answer given on known kidney disease, and the answer given on previous episodes in the "
             "last 6 and 12 months.",
             "The answer given on known kidney disease and, where the patient is aged 60 to 64, the "
             "outcome of the renal question; and the answer given on previous episodes in the last 6 and "
             "12 months."),
        ],
        "changes": [
            "Nitrofurantoin indication row now lists the same symptoms as the inclusion row: two or more of dysuria, new nocturia, frequency or urgency.",
            "Trimethoprim inclusion criteria now carry the no antibiotic already taken and renal question lines that its exclusion list already relied on.",
            "Analgesia caution carries the NICE suitability caveat for ibuprofen in both arms.",
            "Records in both arms include the outcome of the renal question for patients aged 60 to 64.",
        ],
    },

    # ---------------------------------------------------------- period-delay
    "period-delay": {
        "edits": [
            ("delete", "That gates nothing and is not auditable."),
            ("replace",
             "Stop the medicine and seek medical advice at once for: jaundice, a significant rise in "
             "blood pressure, a new migraine-type headache, sudden visual or hearing disturbance, or any "
             "possible clot symptom.",
             "Stop the medicine and seek medical advice at once for: jaundice, a significant rise in "
             "blood pressure, a new migraine-type headache, sudden visual or hearing disturbance, any "
             "possible clot symptom, or suspected pregnancy."),
            ("insert_after", "If your period does not come within a few days of finishing, do a pregnancy test.",
             ["If you think you could be pregnant while taking the tablets, stop them and do a pregnancy test."]),
            ("replace", "Smoking status, and the answer to the question about a journey of 4 hours or more.",
             "The answers to all eight Appendix 1 questions, including smoking status (and whether the "
             "patient stopped smoking less than a year ago) and the answer to the question about a "
             "journey of 4 hours or more, and the blood pressure measured today."),
            ("replace",
             "Records signed, dated, legible and contemporaneous. Adults 18 and over: 8 years. Under 18s: "
             "until the 25th birthday, or the 26th where the patient was 17 when treatment finished.",
             "Records signed, dated, legible and contemporaneous. Electronic records are acceptable. "
             "Adults 18 and over: 8 years. Under 18s: until the 25th birthday, or the 26th where the "
             "patient was 17 when treatment finished."),
            ("replace", "3. Do you smoke at all?",
             "3. Do you smoke at all, or did you stop smoking less than a year ago?"),
            ("replace", "Any amount, any age.",
             "Any amount, any age. Stopping less than a year ago excludes as well."),
            ("replace",
             "6. Have you had an operation under general anaesthetic in the last 6 weeks, or do you have one planned?",
             "6. Have you had an operation under general anaesthetic in the last 6 weeks, or do you have "
             "one planned during the course or within 2 weeks of finishing it?"),
            # duplicated change history entry
            ("delete",
             "The practitioner Agreement to practise page, the premises block and the practitioner "
             "signature table are restored. Every version 001 document carried them; no document produced "
             "by the current generator did, through one omission in one function, which left 15 live "
             "documents with no page for an individual practitioner to sign. Raised as blocking by an "
             "adopting pharmacy: NICE MPG2 expects a record of the individuals authorised to work under a "
             "PGD. The standard governance requirements are restored at the same time: SPC and BNF "
             "familiarity, MHRA safety alerts, CPD and appraisal, indemnity, and capacity and consent, all "
             "of which were in version 001 and were lost in the rewrite. This version changes no clinical "
             "content.", None, 2),
        ],
        "changes": [
            "Orphaned cover sentence (That gates nothing and is not auditable) removed; the sentence it referred to left in an earlier version.",
            "Suspected pregnancy during the course is a stop-and-test instruction in the cautions and in the patient follow-up.",
            "Records now require the answers to all eight Appendix 1 questions, the recent-quitter answer and the blood pressure measured today, and state that electronic records are acceptable.",
            "Appendix 1 question 3 asks about stopping smoking less than a year ago, and question 6 carries the same time window as the exclusion (during the course or within 2 weeks of finishing).",
            "Duplicated paragraph in the v004 change history entry removed.",
        ],
    },

    # ----------------------------------------------------------- period-pain
    "period-pain": {
        "edits": [
            ("replace_contains", "for the administration of Naproxen or Mefenamic acid",
             "Patient Group Direction\nfor the supply of Naproxen or Mefenamic acid for Period Pain (Dysmenorrhoea)"),
            ("replace", "for the supply/administration of", "for the supply of"),
            ("replace", "Naproxen 250 mg or 500 mg tablets.", "Naproxen 250 mg tablets."),
            ("replace", "28 Tablets of 250mg or 14 tablets of 500mg",
             "One cycle per supply: up to 14 tablets of 250 mg (500 mg then 250 mg every 6 to 8 hours, "
             "maximum 1250 mg on day 1 and 1000 mg daily thereafter, for up to 3 days, is 13 tablets). "
             "The 500 mg tablet is not supplied under this PGD because the 250 mg maintenance dose "
             "cannot be taken from it. A further supply needs a further consultation."),
            # inflammatory bowel disease: exclusion in both arms
            ("insert_after",
             "- Patients who have coagulation disorders or are receiving drug therapy that interferes with haemostasis",
             ["- Inflammatory bowel disease (ulcerative colitis or Crohn's disease)."]),
            # coagulation disorders: exclusion in both arms
            ("insert_after", "- Inflammatory bowel disease.",
             ["- Patients who have coagulation disorders or are receiving drug therapy that interferes with haemostasis."]),
            ("replace",
             "To seek medical advice if symptoms worsen rapidly or significantly, do not improve in 3–4 "
             "weeks, or they become systemically very unwell.",
             "Seek medical advice if the pain is not controlled by the treatment, is getting worse each "
             "cycle, or is accompanied by bleeding between periods or after sex, pain during sex or an "
             "abnormal discharge, or if you feel systemically unwell. If the pain has not responded over "
             "3 to 6 cycles, see your GP so that other causes can be considered."),
            ("replace", "date of supply dose, form and route quantity supplied",
             "date of supply, dose, form and route, quantity supplied, the date the period started and "
             "the number of days supplied"),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Cover and arm headings corrected from administration to supply.",
            "Naproxen quantity reconciled with the dose row: one cycle per supply, up to 14 tablets of 250 mg; the 500 mg tablet is withdrawn from this arm because the 250 mg maintenance dose cannot be taken from it. The previous 28 x 250 mg or 14 x 500 mg was about two cycles.",
            "Inflammatory bowel disease is an exclusion in the naproxen arm as it already was for mefenamic acid; coagulation disorders and drugs interfering with haemostasis are an exclusion in the mefenamic acid arm as they already were for naproxen.",
            "Follow-up advice replaced: the 3 to 4 weeks template line cannot apply to a 3 day course for a monthly symptom.",
            "Records row punctuation corrected and the cycle date and number of days supplied added.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # -------------------------------------------------------------------- ed
    "ed": {
        "edits": [
            ("replace",
             "No maximum treatment period. Review effectiveness, blood pressure and cardiovascular fitness "
             "at least annually. For once-daily dosing, reassess periodically whether continued daily use "
             "remains appropriate.",
             "No maximum treatment period. Review effectiveness, blood pressure and cardiovascular fitness "
             "at least annually, and reassess where there has been no improvement after 6 to 8 attempts at "
             "the maximum tolerated dose. For once-daily dosing, reassess periodically whether continued "
             "daily use remains appropriate."),
            # 65 or over, the SmPC and BSSM basis, in both arms
            ("replace", "AGED OVER 65. Start at 25mg.", "AGED 65 OR OVER. Start at 25mg."),
            ("replace", "AGED OVER 65. Start on-demand dosing at 10mg rather than escalating, and once-daily dosing at 2.5mg.",
             "AGED 65 OR OVER. Start on-demand dosing at 10mg rather than escalating, and once-daily dosing at 2.5mg."),
            ("replace",
             "START AT 25mg where the patient is over 65, on an alpha-blocker, on a CYP3A4 inhibitor, or "
             "has hepatic or severe renal impairment.",
             "START AT 25mg where the patient is aged 65 or over, on an alpha-blocker, on a CYP3A4 "
             "inhibitor, or has hepatic or severe renal impairment."),
            ("replace", "Age, and where over 65, the starting dose chosen.",
             "Age, and where aged 65 or over, the starting dose chosen."),
            # tadalafil: the exclusion is the once-daily regimen; the 10mg cap is a caution
            ("replace",
             "Severe renal impairment, creatinine clearance below 30 mL/min: once-daily dosing is "
             "excluded, and on-demand dosing must not exceed 10mg.",
             "Severe renal impairment, creatinine clearance below 30 mL/min: once-daily dosing is "
             "excluded. On-demand dosing is permitted at a maximum of 10mg (see cautions)."),
            ("insert_after", "Moderate renal impairment, creatinine clearance 30 to 50 mL/min. For once-daily dosing start at 2.5mg.",
             ["Severe renal impairment, creatinine clearance below 30 mL/min. On-demand dosing only; "
              "the dose must not exceed 10mg."]),
            ("replace", "Unstable angina, angina during sex, severe heart failure or uncontrolled arrhythmia: exclude.",
             "Unstable angina, angina during sex, heart failure of NYHA class 2 or greater in the last 6 "
             "months, or uncontrolled arrhythmia: exclude."),
        ],
        "changes": [
            "Tadalafil arm now carries the same 6 to 8 attempts reassessment rule as the sildenafil arm.",
            "Age-related starting dose applies at 65 or over in both arms and in the records, which is the SmPC and BSSM basis; the previous wording was over 65.",
            "Tadalafil severe renal impairment: the exclusion is the once-daily regimen; the 10mg on-demand cap now sits in the cautions where a dose cap belongs.",
            "Appendix 1 question 4 now uses the exclusion criterion it summarises: heart failure of NYHA class 2 or greater in the last 6 months, not severe heart failure.",
        ],
    },

    # ------------------------------------------------- premature-ejaculation
    "premature-ejaculation": {
        "edits": [
            ("replace_contains", "for the administration of Dapoxetine 30mg/60mg tablets (Priligy)",
             "Patient Group Direction\nfor the supply of Dapoxetine 30mg/60mg tablets (Priligy) for the "
             "treatment of Premature Ejaculation"),
            ("replace", "for the supply/administration of", "for the supply of"),
            ("replace", "Moderate or severe renal impairment (creatinine clearance <30 mL/min)",
             "Moderate or severe renal impairment (creatinine clearance below 50 mL/min; severe is below 30 mL/min)"),
            ("replace", "Moderate CYP3A4 inhibitors - may increase dapoxetine concentrations",
             "Moderate CYP3A4 inhibitors (for example erythromycin, clarithromycin, fluconazole, "
             "diltiazem, verapamil) - increase dapoxetine concentrations; 30mg only, do not increase to 60mg"),
            ("replace", "CYP2D6 poor metabolisers - may require dose adjustment",
             "CYP2D6 poor metabolisers, known or suspected - 30mg only, do not increase to 60mg (SmPC)"),
            ("replace", "that valid informed consent was given", "that valid informed written consent was given"),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Cover and arm heading corrected from administration to supply.",
            "Renal exclusion threshold matches its label: moderate or severe impairment is creatinine clearance below 50 mL/min; the previous figure (below 30) was severe only.",
            "Moderate CYP3A4 inhibitors and CYP2D6 poor metabolisers: the dose adjustment is stated, 30mg only, as the SmPC directs.",
            "Records require written consent, matching the inclusion criterion.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # ------------------------------------------------------------------- bph
    "bph": {
        "edits": [
            ("replace_contains", "for the administration of Tamsulosin 400mcg MR capsules",
             "Patient Group Direction\nfor the supply of Tamsulosin 400mcg MR capsules for the treatment "
             "of Benign Prostatic Hyperplasia (BPH)"),
            ("replace", "for the supply/administration of", "for the supply of"),
            ("replace", "Male patients aged 18 years and above", "Male patients aged 45 years and above"),
            ("replace", "Renal Function: Check baseline renal function (eGFR) before initiating treatment.",
             "Renal Function: check where renal impairment secondary to obstruction is suspected. This "
             "PGD does not require an eGFR result; suspected renal impairment from obstruction is a red flag and a referral."),
            ("replace", "Renal impairment: use with caution in patients with eGFR <10 mL/min/1.73m²",
             "Renal impairment: no dose adjustment is needed (SmPC); the SmPC advises caution below eGFR "
             "10 mL/min/1.73m². Renal function is not measured under this PGD; a patient with known "
             "severe renal impairment or on dialysis is referred."),
            ("replace", "Up to 28 capsules per prescription (28-day supply)",
             "28 capsules per supply (4 weeks). No larger supply under this PGD."),
            ("replace",
             "Maximum under this PGD: an initial supply of 4 weeks, then, where the IPSS has improved by 3 "
             "points or more at the 4 to 6 week review and the patient has been examined by the GP, "
             "further supplies of up to 12 weeks each to a maximum of 12 months' continuous treatment, "
             "after which the GP takes over prescribing. No improvement at 4 to 6 weeks, or any new "
             "exclusion, ends supply under this PGD and the patient is referred.",
             "Maximum under this PGD: an initial supply of 4 weeks, then, where the IPSS has improved by 3 "
             "points or more at the 4 to 6 week review and the patient has been examined by the GP since "
             "the first supply under this PGD (an assessment before the first supply does not count), "
             "further supplies of 28 capsules (4 weeks) each to a maximum of 12 months' continuous "
             "treatment, after which the GP takes over prescribing. No improvement at 4 to 6 weeks, or "
             "any new exclusion, ends supply under this PGD and the patient is referred."),
            ("replace", "Report any signs of priapism (erection lasting longer than 4 hours) immediately to A&E or your GP",
             "An erection lasting longer than 4 hours (priapism) is an emergency: go to A&E immediately"),
            ("replace", MPG2_OLD, MPG2_NEW),
        ],
        "changes": [
            "Cover and arm heading corrected from administration to supply.",
            "Inclusion age is 45 and above, matching the under 45 exclusion; it said 18.",
            "Quantity and maximum treatment period reconciled: 28 capsules (4 weeks) per supply throughout; the maximum period row allowed 12 week supplies.",
            "Continuation requires a GP examination since the first supply under this PGD; the row did not say whether an earlier assessment counted.",
            "Renal caution and the guidance summary renal line state that no eGFR result is required and what is referred.",
            "Priapism advice is go to A&E immediately, matching the ED PGD.",
            "Broken NICE MPG2 link corrected.",
        ],
    },

    # ---------------------------------------------------------------- wegovy
    "wegovy": {
        "edits": [
            ("replace", "Adults under 18 years of age.", "Patients under 18 years of age."),
            ("replace",
             "Pregnancy, breastfeeding, or planning pregnancy. Effective contraception is required; advise "
             "discontinuation at least 2 months before planned conception for semaglutide and 1 month for tirzepatide.",
             "Pregnancy, breastfeeding, or planning pregnancy. Effective contraception is required; advise "
             "discontinuation at least 2 months before a planned conception (SmPC)."),
            ("replace",
             "Personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine "
             "Neoplasia syndrome type 2 (MEN 2).",
             "Personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine "
             "Neoplasia syndrome type 2 (MEN 2). This exclusion, like pancreatitis, is stricter than the "
             "UK SmPC, which lists no contraindication other than hypersensitivity; it follows the US "
             "labelling and is a deliberate service restriction."),
            # the mental health exclusion sits in the exclusion list
            ("insert_after",
             "Adults aged over 75 years (upper age limit under this PGD; refer to a specialist if treatment is being considered).",
             ["History of suicidal ideation or active severe mental illness where psychiatric oversight is "
              "absent and there is current concern about mood or risk (see cautions)."]),
            ("replace",
             "History of suicidal ideation, or active severe mental illness. Ensure appropriate psychiatric "
             "oversight is in place, monitor mood at review, and refer if there is any concern. Do not "
             "supply where oversight is absent and concern exists.",
             "History of suicidal ideation, or active severe mental illness: supply only where appropriate "
             "psychiatric oversight is in place; monitor mood at review and refer if there is any concern. "
             "Where oversight is absent and concern exists, the exclusion criteria apply."),
            # duplicate gastric emptying caution
            ("delete",
             "Concomitant oral medications: delayed gastric emptying may reduce the absorption of oral "
             "medicines, especially those with a narrow therapeutic index. Counsel accordingly."),
            # the 5% rule, one way: stop, maximum tolerated dose (the authorised v002 change)
            ("replace",
             "Reassess the benefit-risk balance if there is no clinically meaningful weight loss, typically "
             "less than 5%, after 6 months on the maintenance dose.",
             "Treatment under this PGD is stopped where less than 5% of initial body weight has been lost "
             "after 6 months on the maximum tolerated dose; refer to the GP or a specialist prescriber for "
             "a decision on any continuation (see maximum treatment period)."),
            ("replace",
             "If the patient has not lost at least 5% of their initial body weight after 6 months on the "
             "maximum tolerated dose, a decision is required on whether to continue treatment.",
             "If the patient has not lost at least 5% of their initial body weight after 6 months on the "
             "maximum tolerated dose, treatment under this PGD is stopped and the patient is referred to "
             "the GP or a specialist prescriber for a decision on any continuation. Record the weights, "
             "the percentage lost and the decision."),
            ("replace_contains",
             "Advise when to return for review and that treatment will be reassessed if less than 5% of "
             "body weight has been lost after 6 months on the maintenance dose.",
             "Explain the expected pattern of weight loss and that the medicine works alongside diet and "
             "activity, not instead of them. Counsel on gastrointestinal side effects and how to manage "
             "them, on adequate fluid intake, and on the warning symptoms that need urgent attention: "
             "severe abdominal pain, persistent vomiting with dehydration, jaundice, sudden visual loss, "
             "or a sustained rise in resting heart rate. Advise the patient that review is at each monthly "
             "supply, and that treatment under this PGD will stop if less than 5% of body weight has been "
             "lost after 6 months on the maximum tolerated dose."),
            # 7.2 mg: the single use pen only, matching the quantity row
            ("replace",
             "For the 7.2 mg dose using the single use pen, follow the instructions for that presentation. "
             "Where the 7.2 mg dose is given using 2.4 mg FlexTouch pens, inject three doses of 2.4 mg one "
             "after another; injections can be given in the same body area but should be at least 5 cm "
             "apart, changing the needle between each dose.",
             "For the 7.2 mg dose, use the Wegovy 7.2 mg single use pen and follow the instructions for "
             "that presentation. The 7.2 mg dose is not made up from three 2.4 mg FlexTouch injections "
             "under this PGD."),
            # records: nature of the supply
            ("insert_after", "date of supply, dose, form, route and quantity supplied",
             ["whether the supply is a start, a restart, a dose escalation, a dose reduction or a "
              "continuation, and the previous dose"]),
        ],
        "changes": [
            "Exclusion wording corrected: patients under 18, not adults under 18.",
            "Pregnancy exclusion no longer mentions tirzepatide, which is not a product under this PGD.",
            "The medullary thyroid carcinoma and MEN 2 exclusion states its basis (US labelling; stricter than the UK SmPC).",
            "The mental health rule that ended the cautions row (do not supply where oversight is absent and concern exists) is now an exclusion criterion, with the caution pointing to it.",
            "Duplicate delayed gastric emptying caution removed.",
            "The 5% rule is stated one way in the cautions, monitoring and follow-up rows: treatment under this PGD stops after 6 months on the maximum tolerated dose without 5% loss, with referral, as the maximum treatment period row and the version 002 change record already said.",
            "The 7.2 mg dose is given with the 7.2 mg single use pen only; the route row no longer permits three 2.4 mg injections, which did not fit the one pen per month quantity row.",
            "Records include the nature of the supply (start, restart, escalation, reduction, continuation) and the previous dose.",
        ],
    },

    # ----------------------------------------------------------- wegovy-oral
    "wegovy-oral": {
        "edits": [
            ("replace", "BMI 30 kg/m2 or above, or BMI 27 kg/m2 or above with at least one weight-related comorbidity.",
             "BMI 30 kg/m2 or above, or BMI 27 to below 30 kg/m2 with at least one weight-related comorbidity."),
            ("replace_contains",
             "CONCURRENT USE OF ANY OTHER GLP-1 RECEPTOR AGONIST OR INSULIN SECRETAGOGUE, FOR ANY INDICATION.",
             "CONCURRENT USE OF ANY OTHER GLP-1 RECEPTOR AGONIST, OR OF ANY INSULIN SECRETAGOGUE "
             "(SULFONYLUREA OR MEGLITINIDE), FOR ANY INDICATION. Ask specifically whether the patient takes "
             "anything for diabetes, and name the products. Several GLP-1 medicines are licensed for type "
             "2 diabetes as well as for weight management: orforglipron for both, oral semaglutide "
             "separately for diabetes at 3mg, 7mg and 14mg, and semaglutide and tirzepatide injections in "
             "diabetes. A patient does not always think of a diabetes medicine as the same kind of drug."),
            ("replace",
             "For patients who take HRT, given the lack of absorption data, non-oral products such as a "
             "patch, gel or levonorgestrel intrauterine device may be considered.",
             "For patients who take oral HRT: the SmPC reports no clinically relevant change in exposure "
             "for an ethinylestradiol and levonorgestrel oral contraceptive, but has no data on HRT "
             "products; non-oral HRT such as a patch, gel or levonorgestrel intrauterine device may be considered."),
            ("insert_after", "Advice given, including advice given if the patient is excluded or declines.",
             ["Where no supply is made, the record still carries the patient details, the exclusion or "
              "the reason, and the advice given."]),
        ],
        "changes": [
            "Inclusion BMI band stated as 27 to below 30 with a comorbidity, the SmPC phrasing used elsewhere in the document.",
            "Concurrent-use exclusion names sulfonylureas and meglitinides, matching the cautions row.",
            "HRT caution explains that the SmPC oral contraceptive finding does not cover HRT products, so it no longer reads as a contradiction.",
            "Records row states what is recorded when no supply is made.",
        ],
    },

    # -------------------------------------------------------------- mounjaro
    "mounjaro": {
        "edits": [
            ("replace", "Adults under 18 years of age.", "Patients under 18 years of age."),
            ("replace",
             "Pregnancy, breastfeeding, or planning pregnancy. Effective contraception is required; advise "
             "discontinuation at least 2 months before planned conception for semaglutide and 1 month for tirzepatide.",
             "Pregnancy, breastfeeding, or planning pregnancy. Effective contraception is required; advise "
             "discontinuation at least 1 month before a planned conception (SmPC)."),
            ("replace",
             "Personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine "
             "Neoplasia syndrome type 2 (MEN 2).",
             "Personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine "
             "Neoplasia syndrome type 2 (MEN 2). This exclusion, like pancreatitis, is stricter than the "
             "UK SmPC, which lists no contraindication other than hypersensitivity; it follows the US "
             "labelling and is a deliberate service restriction."),
            ("insert_after",
             "Adults aged over 75 years (upper age limit under this PGD; refer to a specialist if treatment is being considered).",
             ["History of suicidal ideation or active severe mental illness where psychiatric oversight is "
              "absent and there is current concern about mood or risk (see cautions)."]),
            ("replace",
             "History of suicidal ideation, or active severe mental illness. Ensure appropriate psychiatric "
             "oversight is in place, monitor mood at review, and refer if there is any concern. Do not "
             "supply where oversight is absent and concern exists.",
             "History of suicidal ideation, or active severe mental illness: supply only where appropriate "
             "psychiatric oversight is in place; monitor mood at review and refer if there is any concern. "
             "Where oversight is absent and concern exists, the exclusion criteria apply."),
            # the 5% rule, one way: maximum tolerated dose, a recorded decision (SmPC and NICE)
            ("replace",
             "Reassess the benefit-risk balance if there is no clinically meaningful weight loss, typically "
             "less than 5%, after 6 months on the maintenance dose.",
             "If less than 5% of initial body weight has been lost after 6 months on the maximum tolerated "
             "dose, a decision on whether to continue is required and recorded (see monitoring and review)."),
            ("replace", "Reassess clinical benefit, tolerability and target weight at each visit.",
             "Reassess clinical benefit, tolerability and target weight at each visit. Review is every 4 "
             "weeks, at each pen supply."),
            ("replace_contains",
             "Advise when to return for review and that treatment will be reassessed if less than 5% of "
             "body weight has been lost after 6 months on the maintenance dose.",
             "Explain the expected pattern of weight loss and that the medicine works alongside diet and "
             "activity, not instead of them. Counsel on gastrointestinal side effects and how to manage "
             "them, on adequate fluid intake, and on the warning symptoms that need urgent attention: "
             "severe abdominal pain, persistent vomiting with dehydration, jaundice, sudden visual loss, "
             "or a sustained rise in resting heart rate. Advise the patient that review is every 4 weeks "
             "at each pen supply, and that treatment will be reassessed if less than 5% of body weight "
             "has been lost after 6 months on the maximum tolerated dose."),
            # adverse effects frequencies per SmPC 4.8 (weight management)
            ("replace_contains",
             "Very common: nausea, diarrhoea, vomiting, constipation and decreased appetite. Common: "
             "abdominal pain, dyspepsia",
             "Very common: nausea, diarrhoea, vomiting, constipation, abdominal pain, decreased appetite "
             "and fatigue. Common: hypersensitivity reactions, dyspepsia, eructation, flatulence, "
             "abdominal distension, gastro-oesophageal reflux, cholelithiasis, cholecystitis, injection "
             "site reactions, hypoglycaemia when used with a sulfonylurea or insulin, dizziness, "
             "hypotension-related events, hair loss and tachycardia. Uncommon or rare: acute pancreatitis, "
             "delayed gastric emptying, anaphylactic reaction, angioedema, and acute kidney injury usually "
             "secondary to dehydration. Counsel on warning symptoms, particularly severe abdominal pain, "
             "severe vomiting with dehydration and jaundice. Refer to the current SmPC for full safety "
             "information."),
            # records: nature of the supply and the injection site
            ("insert_after", "date of supply, dose, form, route and quantity supplied",
             ["whether the supply is a start, a restart, a dose escalation, a dose reduction or a "
              "continuation, and the previous dose",
              "the injection site, where the injection is given in the pharmacy"]),
        ],
        "changes": [
            "Exclusion wording corrected: patients under 18, not adults under 18.",
            "Pregnancy exclusion no longer mentions semaglutide; tirzepatide is stopped at least 1 month before a planned conception (SmPC).",
            "The medullary thyroid carcinoma and MEN 2 exclusion states its basis (US labelling; stricter than the UK SmPC).",
            "The mental health rule that ended the cautions row (do not supply where oversight is absent and concern exists) is now an exclusion criterion, with the caution pointing to it.",
            "The 6 month reassessment is stated one way: 6 months on the maximum tolerated dose, with a recorded decision; the rows said highest tolerated, maximum tolerated and maintenance dose.",
            "A review interval is stated: every 4 weeks at each pen supply.",
            "Adverse effects frequencies corrected to the SmPC: fatigue very common; hypersensitivity, cholelithiasis and cholecystitis common.",
            "Records include the nature of the supply, the previous dose and the injection site where given in the pharmacy.",
        ],
    },
}

DECISIONS = [
    ("copd",
     "The guidance summary says consider hospital referral at RR over 25 but the exclusion criteria carry only SpO2 below 88% and inability to speak; should respiratory rate be a criterion?",
     "(a) add respiratory rate 25/min or more as an exclusion in both arms, with RR measured and recorded before supply; (b) leave RR out of the criteria",
     "(a): it is the document's own severity marker and the asthma PGD already excludes at RR 25 or more."),
    ("asthma-rescue",
     "The salbutamol arm has no daily maximum or referral threshold (dose row 2 to 4 puffs as required, repeat after 15 to 30 minutes; maximum period as needed), while the sibling COPD PGD sets 8 puffs in 24 hours; should the asthma arm carry the same limits?",
     "(a) add the COPD limits (8 puffs in 24 hours; relief needed more often than 4 hourly or on most days is a same-day GP referral; 10 puffs through a spacer without relief is 999); (b) keep the acute-episode wording with the one rescue course in 12 months as the only quantity control",
     "(a), with the 10 puffs through a spacer instruction kept as the acute-attack step so the limits do not read as a bar to emergency use."),
    ("asthma-rescue",
     "The prednisolone dose row now allows 40mg or 50mg daily for 5 to 7 days; should the PGD fix one regimen?",
     "(a) 40mg daily for 5 days only (BTS/SIGN adult dose, 40 tablets); (b) keep 40mg to 50mg for 5 to 7 days with the dose and course recorded",
     "(a): one regimen removes the arithmetic risk the quantity row already warns about."),
    ("ear-infection",
     "The ciprofloxacin arm's whole-year age wording (more than 1 year included, 1 year or under excluded) contradicted the cover and the spray arm (from 1 year); the batch 3 edit states the boundary as 12 months, following the licence (aged one year and older). Confirm the boundary.",
     "(a) 12 months and over, as edited; (b) 24 months and over for the drops as well (referring children aged 1)",
     "(a): the SmPC dose line is one year and older and the cover was written on that basis."),
    ("thrush",
     "Dysuria is in the exclusion list (Canesten P licence seek-advice list) while the guidance summary lists pain on micturition as a presenting symptom of thrush; keep the exclusion?",
     "(a) keep dysuria as an exclusion (P licence condition; the tool follows it); (b) narrow it to internal dysuria or dysuria with frequency, urgency or fever",
     "(a): the P licence governs the pessary and fluconazole sales and the safer reading excludes."),
    ("thrush",
     "The pessary caution said pregnancy was acceptable with finger insertion while the arm's indication is non-pregnant women; the batch 3 edit makes pregnancy an exclusion in the pessary arm (the tool already stops). Should the pessary arm be reopened to pregnancy?",
     "(a) keep pregnancy as a referral for both arms; (b) reissue the pessary arm with pregnancy in its indication, applicator not used, first episode and recurrent infection still excluded",
     "(a) for now; (b) needs the signatories to accept the Canesten licence condition (consult a doctor if pregnant) as satisfied by the pharmacist assessment."),
    ("postnatal-contraception",
     "Desogestrel inclusion says UKMEC 1 or 2 met but the exclusion and caution rows do not list every UKMEC 3 or 4 condition for the progestogen-only pill (for example ischaemic heart disease and stroke, UKMEC 3 for continuation; SLE with antiphospholipid antibodies; severe cirrhosis); which conditions should the document name?",
     "(a) add the UKMEC 2025 POP category 3 and 4 conditions as named exclusions; (b) leave the UKMEC 1 or 2 attestation as the gate",
     "(a): a named list is auditable and the tool can only enforce what is listed."),
    ("uti",
     "The renal row excludes every woman aged 60 to 64 who answers NO (refer for a renal function check first), which contradicts the inclusion of 16 to 64 and the exclusion wording (renal function unknown in a patient aged 60 to 64); what result, and how recent, lets a 60 to 64 year old proceed?",
     "(a) proceed where an eGFR of 45 mL/min or more within the last 12 months has been seen by the pharmacist (NHS App, GP summary or a letter) and is recorded; (b) restrict the PGD to 16 to 59 and say so in the indication",
     "(a): NICE NG109 sets 45 as the nitrofurantoin threshold and a seen result is auditable; the eGFR figure should be stated in the renal row and the exclusion list."),
    ("period-pain",
     "Both indications say where paracetamol or antispasmodics are insufficient but nothing in the inclusion or exclusion criteria asks it; should it gate?",
     "(a) add an inclusion criterion: paracetamol or an antispasmodic tried for at least one cycle and insufficient, or unsuitable, with the answer recorded; (b) remove the phrase from the indication (NICE CKS puts NSAIDs first line), which widens the indication",
     "(a): it makes the indication auditable without widening it."),
    ("ed",
     "Ritonavir and cobicistat exclude in the sildenafil arm but are only a caution (10mg in 72 hours) in the tadalafil arm; should the arms match?",
     "(a) leave as is: the tadalafil SmPC permits use with a potent CYP3A4 inhibitor at a capped dose, whereas sildenafil cannot be titrated within its 25mg in 48 hours cap; (b) exclude ritonavir and cobicistat in both arms",
     "(a), naming ritonavir and cobicistat in the tadalafil caution so the difference is visible."),
    ("premature-ejaculation",
     "The guidance summary red flags (prostatitis, thyroid dysfunction, neurological conditions, severe relationship distress) gate nothing in the PGD; should they be exclusions?",
     "(a) add an exclusion: symptoms suggesting prostatitis, thyroid dysfunction or a neurological cause, or premature ejaculation of recent onset with another new symptom, refer for diagnosis; (b) leave them as summary red flags",
     "(a): acquired premature ejaculation with a plausible organic cause needs a diagnosis before an SSRI."),
    ("bph",
     "Uncontrolled hypertension excludes but has no threshold and no requirement to measure blood pressure; and orthostatic hypotension excludes on history only.",
     "(a) measure blood pressure at every supply, lying and standing; exclude at 160/100 or above, or a postural systolic drop of 20 mmHg or more, and record the readings; (b) keep the exclusions as unmeasured history questions",
     "(a): tamsulosin's main risk is postural hypotension and the reading is the only auditable evidence."),
    ("wegovy",
     "The exclusion for obesity caused by an endocrinological disorder says the exclusion may not apply if the patient was overweight before the diagnosis, which leaves the decision undefined (same wording in mounjaro).",
     "(a) exclude where the disorder is untreated or unassessed (for example untreated hypothyroidism or Cushing's), and do not exclude where it is diagnosed, treated and stable, with the basis recorded; (b) exclude every endocrinological cause and refer",
     "(a), applied to wegovy and mounjaro alike."),
    ("mounjaro",
     "The storage row (21 days unrefrigerated below 30 degrees, carton, travel) has no source in the document because SmPC section 6 was not summarised; confirm the in-use and out-of-fridge periods for the KwikPen against the current SmPC before the next reissue.",
     "(a) summarise SmPC section 6 into part 2 and align the storage row to it; (b) leave the storage row as is",
     "(a)."),
]
