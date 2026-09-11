# Round 5, batch E: signatory decisions 34, 36, 37, 38, 40 and 42
# (sore-throat, copd, asthma-rescue, thrush, postnatal-contraception).
#
# Every anchor was checked against the current master docx (masters_r4.json)
# with dump.py and the hit count noted. Where an anchor matches more than one
# paragraph and nth is not given, every hit is intended (the same row appears
# in each arm).

UKMEC_POP_EXCLUSION = (
    "UKMEC 2025 category 3 or 4 for the progestogen-only pill. Any of the following excludes; refer to the GP or sexual health service:\n"
    "• current breast cancer (category 4)\n"
    "• past breast cancer, whatever the interval since treatment (category 3)\n"
    "• ischaemic heart disease, current or past, or a history of stroke or transient ischaemic attack (category 3 for continuation; excluded for starts and for continuation under this PGD)\n"
    "• severe (decompensated) cirrhosis (category 3)\n"
    "• hepatocellular adenoma or hepatocellular carcinoma (category 3)\n"
    "• an enzyme-inducing medicine taken now or within the last 28 days: rifampicin, rifabutin, carbamazepine, oxcarbazepine, eslicarbazepine, phenytoin, phenobarbital, primidone, topiramate, St John's wort, efavirenz, nevirapine or a ritonavir-boosted protease inhibitor (category 3)\n"
    "• systemic lupus erythematosus with positive or unknown antiphospholipid antibodies"
)

SALBUTAMOL_LIMITS_DOSE = (
    "Maximum 8 puffs in 24 hours under this PGD. A need for more than this, for relief more often than every 4 hours, "
    "or for the reliever on most days, is uncontrolled asthma: same-day GP or urgent care referral. "
    "In an acute attack, up to 10 puffs through a spacer, one puff at a time, may be taken while help is sought; "
    "this acute-attack step is not barred by the 24 hour maximum. Ten puffs through a spacer with no relief is an emergency: call 999."
)

SALBUTAMOL_LIMITS_ADVICE = (
    "Do not use more than 8 puffs in 24 hours. If you need it more often than every 4 hours, or on most days, see your GP the same day. "
    "In an asthma attack, take up to ten puffs through a spacer, one puff at a time, while help is sought; if ten puffs through a spacer give no relief, call 999."
)

EDITS = {
    # ---------------------------------------------------------------- 34
    "sore-throat": {
        "edits": [
            # Guidance summary (1 hit)
            ("replace", "First-line (FeverPAIN ≥4 or RAST+): Phenoxymethylpenicillin 500mg QDS for 5-10 days.",
             "First-line (FeverPAIN ≥4 or RAST+): Phenoxymethylpenicillin 500mg QDS for 5 days."),
            # Phenoxymethylpenicillin arm dose row (1 hit)
            ("replace", "Continue for 5-10 days (typically 5 days minimum for GAS; longer courses sometimes used)",
             "Continue for 5 days"),
            # Quantity row (1 hit)
            ("replace", "20-40 tablets (5-10 day course)", "20 tablets (5-day course)"),
            # Maximum or minimum treatment period (1 hit; the clarithromycin arm already reads '5 days')
            ("replace", "5-10 days", "5 days"),
        ],
        "changes": [
            "Decision 34: phenoxymethylpenicillin course fixed at 5 days, 20 tablets, as the one quantity for the arm; the 5 to 10 day range and the 20 to 40 tablet range are removed from the guidance summary, dose row, quantity row and treatment period.",
        ],
    },
    # ---------------------------------------------------------------- 36
    "copd": {
        "edits": [
            # Guidance summary (1 hit)
            ("replace", "Severity: Assess SpO2, RR, accessory muscle use; consider hospital referral if severe (SpO2 <88%, RR >25, inability to speak).",
             "Severity: Assess SpO2, RR, accessory muscle use; consider hospital referral if severe (SpO2 <88%, RR 25 or more, inability to speak). A respiratory rate of 25 or more excludes from both arms of this PGD."),
            # Salbutamol arm exclusion (1 hit)
            ("insert_after", "Acute distress with inability to speak, cyanosis, or signs of respiratory failure",
             ["Respiratory rate 25 breaths per minute or more: emergency referral. Respiratory rate must be measured and recorded before any supply; if it has not been measured, do not supply."]),
            # Amoxicillin arm exclusion (1 hit)
            ("insert_after", "Antibiotic resistance suspected in local resistance patterns - check local microbiology guidance",
             ["Respiratory rate 25 breaths per minute or more: emergency referral. Respiratory rate must be measured and recorded before any supply; if it has not been measured, do not supply."]),
            # Records row, both arms (2 hits, both intended)
            ("insert_after", "name of healthcare practitioner",
             ["respiratory rate measured at the consultation (breaths per minute)"]),
        ],
        "changes": [
            "Decision 36: respiratory rate 25 breaths per minute or more added as an exclusion in both arms, with the respiratory rate measured and recorded before any supply and added to the records row of both arms; the guidance summary severity line now reads RR 25 or more.",
        ],
    },
    # ------------------------------------------------------------ 37, 38
    "asthma-rescue": {
        "edits": [
            # 37: guidance summary (1 hit)
            ("insert_after", "Response monitoring: Assess response at 15-30 minutes; if insufficient relief, refer for emergency assessment.",
             ["Salbutamol limits under this PGD: maximum 8 puffs in 24 hours; relief needed more often than every 4 hours, or on most days, is a same-day GP referral; in an acute attack up to 10 puffs through a spacer, and no relief after 10 puffs is 999."]),
            # 37: salbutamol dose row (1 hit)
            ("insert_after", "May repeat after 15-30 minutes if inadequate response", [SALBUTAMOL_LIMITS_DOSE]),
            # 37: salbutamol treatment period (1 hit)
            ("replace", "As needed during acute exacerbation",
             "As needed during the acute exacerbation, within the maximum of 8 puffs in 24 hours. One inhaler (200 actuations) per supply; no more than one rescue course in any 12 months under this PGD (see inclusion criteria)."),
            # 37: follow-up advice, both arms carry the salbutamol lines (2 hits, both intended)
            ("insert_after", "If symptoms do not improve within 15-30 minutes of salbutamol use, seek emergency medical attention.",
             [SALBUTAMOL_LIMITS_ADVICE]),
            # 38: guidance summary (1 hit)
            ("replace", "Oral corticosteroids: For acute exacerbations to reduce airway inflammation (prednisolone).",
             "Oral corticosteroids: For acute exacerbations to reduce airway inflammation (prednisolone 40mg once daily for 5 days)."),
            # 38: prednisolone dose row (1 hit each)
            ("replace", "40mg to 50mg once daily, taken as a single dose in the morning, for acute exacerbation. Record the dose chosen.",
             "40mg once daily, taken as a single dose in the morning, for 5 days. This is the only dose and course under this PGD."),
            ("delete", "Typical: 40mg daily for 5-7 days for acute exacerbation"),
            ("replace", "Prednisolone 5mg tablets: 40mg daily is EIGHT tablets a day and 50mg daily is TEN tablets a day. Eight to ten tablets is one day of treatment, not a course.",
             "Prednisolone 5mg tablets: 40mg daily is EIGHT tablets a day. Eight tablets is one day of treatment, not a course."),
            # 38: quantity row (1 hit)
            ("replace", "40 tablets of 5mg for 40mg daily for 5 days. Where the course is 7 days or the dose is 50mg, supply the number of tablets the course needs, to a maximum of 70 (50mg daily for 7 days). Check the arithmetic against the dose before supply.",
             "40 tablets of 5mg (40mg daily, eight tablets a day, for 5 days). No other quantity is supplied under this PGD. Check the tablet count against the dose before supply."),
            # 38: treatment period (1 hit)
            ("replace", "5-7 days for acute exacerbation", "5 days"),
            # 38: follow-up advice, prednisolone arm (1 hit)
            ("replace", "Take the full course of prednisolone as prescribed, even if symptoms improve.",
             "Take the full 5 day course of prednisolone (eight 5mg tablets once each morning), even if symptoms improve."),
        ],
        "changes": [
            "Decision 37: the salbutamol arm now carries the COPD limits: maximum 8 puffs in 24 hours; relief needed more often than every 4 hours or on most days is a same-day GP or urgent care referral; up to 10 puffs through a spacer is kept as the acute-attack step and 10 puffs without relief is 999; stated in the guidance summary, dose row, treatment period and follow-up advice.",
            "Decision 38: prednisolone fixed at 40mg once daily as a single morning dose for 5 days, 40 tablets of 5mg, as the only regimen; the 50mg option, the 7 day course and the 70 tablet maximum are removed from the guidance summary, dose row, quantity row, treatment period and follow-up advice.",
        ],
    },
    # ---------------------------------------------------------------- 40
    "thrush": {
        "edits": [
            # Guidance summary (1 hit)
            ("insert_after", "Symptoms: Vulval itching, vaginal discharge (typically thick, white, curdy), vaginal soreness, vulval erythema, and pain during intercourse or micturition.",
             ["Dysuria: external stinging as urine passes over inflamed vulval skin is a symptom of thrush. Internal dysuria (pain inside the urethra or bladder), or dysuria of any kind with urinary frequency, urgency or fever, points to a urinary tract infection and is an exclusion under this PGD."]),
            # Exclusion row, both arms (2 hits, both intended)
            ("replace", "Lower abdominal pain, dysuria, fever or systemic upset, or foul-smelling discharge",
             "Lower abdominal pain, fever or systemic upset, or foul-smelling discharge"),
            ("insert_after", "Lower abdominal pain, fever or systemic upset, or foul-smelling discharge",
             ["Internal dysuria (pain felt inside the urethra or bladder on passing urine), or dysuria of any kind together with urinary frequency, urgency or fever: possible urinary tract infection, refer. External dysuria alone (stinging as urine passes over the sore vulva), with the other features of thrush, is not an exclusion."]),
        ],
        "changes": [
            "Decision 40: the dysuria exclusion in both arms narrowed to internal dysuria, or dysuria with urinary frequency, urgency or fever; external dysuria alone with the other features of thrush no longer excludes, and the guidance summary states the distinction.",
        ],
    },
    # ---------------------------------------------------------------- 42
    "postnatal-contraception": {
        "edits": [
            # Guidance summary (1 hit)
            ("replace", "UKMEC criteria apply.",
             "UKMEC 2025 criteria apply. For the progestogen-only pill the category 4 condition is current breast cancer; the category 3 conditions are past breast cancer, ischaemic heart disease or stroke (continuation), severe cirrhosis, liver tumours (hepatocellular adenoma or carcinoma) and enzyme-inducing medicines. These are named exclusions in the desogestrel arm, which also excludes SLE with antiphospholipid antibodies."),
            # Desogestrel arm inclusion (2 hits; nth=1 is the desogestrel arm, the Depo-Provera arm is unchanged)
            ("replace", "UKMEC 1 or 2 criteria met",
             "UKMEC 2025 category 1 or 2 for the progestogen-only pill met: none of the category 3 or 4 conditions named under exclusion criteria is present", 1),
            # Desogestrel arm exclusion (1 hit)
            ("insert_after", "Hypersensitivity to desogestrel or any excipients", [UKMEC_POP_EXCLUSION]),
            # Desogestrel arm caution now contradicted by the exclusion (1 hit; the Depo-Provera arm's 'Breast cancer history' caution is untouched)
            ("delete", "History of breast cancer (more than 5 years ago)"),
        ],
        "changes": [
            "Decision 42: the desogestrel arm names the UKMEC 2025 progestogen-only pill category 3 and 4 conditions as exclusions (current breast cancer; past breast cancer; ischaemic heart disease, stroke or TIA; severe cirrhosis; hepatocellular adenoma or carcinoma; enzyme-inducing medicines now or within 28 days; SLE with antiphospholipid antibodies), the inclusion line refers to that list, the caution for breast cancer more than 5 years ago is removed as contradicted, and the guidance summary states the categories. List drafted from UKMEC 2016 (amended 2019) as carried into UKMEC 2025, the UKMEC 2025 summary sheet could not be fetched, for Chris Pilkington to confirm; SLE with antiphospholipid antibodies is included on the safer reading and its category should be confirmed.",
        ],
    },
}
