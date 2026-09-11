# Round 5, batch F: decisions 43 to 47 (uti, period-pain, ed, premature-ejaculation, bph).
# Anchors verified against the masters in masters_r4.json with dump.py / apply_edits.
# Where an anchor occurs in both arms of a document (uti), every occurrence is intended:
# the renal row, its inclusion and exclusion lines and the records row are identical in
# the nitrofurantoin and trimethoprim arms and the decision applies to both.

EDITS = {
    "uti": {
        "edits": [
            # Inclusion criteria, both arms
            ("replace", "Renal question answered as set out below.",
             "Renal question answered as set out below; where aged 60 to 64, an eGFR of 45 mL/min or more within the last 12 months seen by the pharmacist and recorded."),
            # Exclusion criteria, both arms
            ("replace", "Known kidney disease, or renal function unknown in a patient aged 60 to 64. See the renal row below.",
             "Known kidney disease; or, in a patient aged 60 to 64, no eGFR result of 45 mL/min or more dated within the last 12 months seen by the pharmacist and recorded. See the renal row below."),
            # Renal row, both arms: the 60 to 64 line
            ("replace", "Answer NO but aged 60 to 64, or the patient does not know: EXCLUDE. Refer for a renal function check first.",
             "Answer NO and aged 60 to 64: proceed only where an eGFR of 45 mL/min or more, dated within the last 12 months, has been seen by the pharmacist (NHS App, GP summary record or a letter) and the result, its date and where it was seen are recorded. Where no such result can be seen, or the result is below 45 mL/min or more than 12 months old: EXCLUDE. Refer for a renal function check first.\nThe patient does not know, at any age: EXCLUDE. Refer for a renal function check first."),
            # Records row, both arms
            ("replace", "The answer given on known kidney disease and, where the patient is aged 60 to 64, the outcome of the renal question; and the answer given on previous episodes in the last 6 and 12 months.",
             "The answer given on known kidney disease and, where the patient is aged 60 to 64, the eGFR result relied on, its date and where it was seen; and the answer given on previous episodes in the last 6 and 12 months."),
        ],
        "changes": [
            "Decision 43: a woman aged 60 to 64 who answers NO to the kidney question now proceeds where an eGFR of 45 mL/min or more, dated within the last 12 months, has been seen by the pharmacist and the result, its date and where it was seen are recorded; the figure is stated in the renal row, the inclusion and exclusion criteria and the records row of both arms, and a patient with no such result is still excluded and referred for a renal function check first.",
        ],
    },
    "period-pain": {
        "edits": [
            # Inclusion criteria, both arms (one paragraph of bullets in each arm)
            ("replace",
             "- Female patients aged 16 years or older.\n- Presenting with symptoms of primary dysmenorrhoea.\n- No contraindications to NSAID therapy.\n- Informed consent obtained.\n- Requesting treatment for period-related pain management.",
             "- Female patients aged 16 years or older.\n- Presenting with symptoms of primary dysmenorrhoea.\n- Paracetamol or an antispasmodic has been tried for at least one cycle and was insufficient, or is unsuitable for this patient, with the answer recorded.\n- No contraindications to NSAID therapy.\n- Informed consent obtained.\n- Requesting treatment for period-related pain management."),
            # Records row, both arms
            ("insert_after", "date of supply, dose, form and route, quantity supplied, the date the period started and the number of days supplied", [
                "the answer given on paracetamol or an antispasmodic: what was tried and for how many cycles and that it was insufficient, or why it is unsuitable",
            ]),
        ],
        "changes": [
            "Decision 44: both arms now carry the inclusion criterion that paracetamol or an antispasmodic has been tried for at least one cycle and was insufficient, or is unsuitable for this patient, with the answer recorded, so the indication's wording gates supply; the records row asks for that answer.",
        ],
    },
    "ed": {
        "edits": [
            # Tadalafil arm cautions
            ("replace", "Potent CYP3A4 inhibitors, for example ketoconazole or ritonavir. On-demand dose must not exceed 10mg in any 72 hour period.",
             "Potent CYP3A4 inhibitors, including ritonavir and cobicistat, and for example ketoconazole, itraconazole or clarithromycin. On-demand dose must not exceed 10mg in any 72 hour period. Ritonavir and cobicistat do not exclude in this arm (they exclude in the sildenafil arm, where the dose cannot be titrated within its cap); the 10mg in 72 hours limit applies."),
            # Tadalafil arm dose row
            ("replace", "With a potent CYP3A4 inhibitor, on-demand use must not exceed 10mg in 72 hours.",
             "With a potent CYP3A4 inhibitor, including ritonavir or cobicistat, on-demand use must not exceed 10mg in 72 hours."),
        ],
        "changes": [
            "Decision 45: the tadalafil caution and dose row now name ritonavir and cobicistat among the potent CYP3A4 inhibitors that cap on-demand use at 10mg in any 72 hour period, and state that these two medicines exclude in the sildenafil arm but not in the tadalafil arm; the arms are otherwise unchanged.",
        ],
    },
    "premature-ejaculation": {
        "edits": [
            # Exclusion criteria: the guidance summary red flags become exclusions
            ("insert_after", "History of bipolar disorder or mania", [
                "Symptoms suggesting prostatitis (perineal, pelvic or genital pain, painful ejaculation, dysuria or lower urinary tract symptoms), thyroid dysfunction (weight change, heat or cold intolerance, palpitations, tremor, marked fatigue) or a neurological cause (new numbness, weakness, or bladder or bowel symptoms): refer for a diagnosis before any SSRI is supplied",
                "Premature ejaculation of recent onset together with another new symptom: refer for a diagnosis",
            ]),
            # Guidance summary red flags: say that they are exclusions under this PGD
            ("insert_after", "Severe relationship distress - consider psychological/couples therapy referral", [
                "Under this PGD, symptoms suggesting prostatitis, thyroid dysfunction or a neurological cause, and premature ejaculation of recent onset with another new symptom, are exclusion criteria: refer for a diagnosis, do not supply.",
            ]),
            # Records row
            ("insert_after", "date of supply dose, form and route quantity supplied", [
                "that the exclusion questions on symptoms suggesting prostatitis, thyroid dysfunction or a neurological cause, and on recent onset with another new symptom, were asked and the answers given",
            ]),
        ],
        "changes": [
            "Decision 46: the guidance summary red flags are now exclusion criteria: symptoms suggesting prostatitis, thyroid dysfunction or a neurological cause, or premature ejaculation of recent onset together with another new symptom, refer for a diagnosis before any SSRI is supplied; the guidance summary says so and the records row asks for the answers given.",
        ],
    },
    "bph": {
        "edits": [
            # Inclusion criteria
            ("insert_after", "Informed consent obtained after discussion of benefits, risks, and alternatives", [
                "Blood pressure measured lying and standing at every supply, first and repeat, with both readings recorded and neither exclusion threshold below met",
            ]),
            # Exclusion criteria: orthostatic hypotension, now measured as well as by history
            ("replace", "History of orthostatic hypotension (blood pressure drop on standing)",
             "Orthostatic hypotension: a history of blood pressure drop on standing, or a fall in systolic blood pressure of 20 mmHg or more on standing measured at this consultation (lying or seated for at least 5 minutes, then standing for 1 to 3 minutes)"),
            # Exclusion criteria: uncontrolled hypertension, now with a threshold
            ("replace", "Uncontrolled hypertension",
             "Uncontrolled hypertension: a blood pressure of 160/100 mmHg or above (systolic 160 or above, or diastolic 100 or above), lying or standing, measured at this consultation, whether or not the patient is on treatment. Refer to the GP"),
            # Maximum treatment period: the measurement applies at every supply
            ("insert_after_contains", "Maximum under this PGD: an initial supply of 4 weeks", [
                "Blood pressure is measured lying and standing at every supply, first and repeat, and both readings recorded. A reading of 160/100 mmHg or above, or a postural systolic fall of 20 mmHg or more, ends supply under this PGD and the patient is referred.",
            ]),
            # Records row
            ("insert_after", "date of supply dose, form and route quantity supplied", [
                "blood pressure measured at this supply, lying and standing, both readings and the postural change in systolic pressure",
            ]),
        ],
        "changes": [
            "Decision 47: blood pressure is now measured lying and standing at every supply, first and repeat, with both readings recorded; the exclusions state the thresholds, 160/100 mmHg or above or a postural fall in systolic pressure of 20 mmHg or more, in place of the unmeasured history questions, and the inclusion criteria, treatment period row and records row carry the requirement.",
        ],
    },
}
