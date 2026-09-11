# Round 5, batch H: decisions 55 to 58 (anxiety-propranolol, sleep-melatonin, hayfever).
# Anchors verified against the masters in masters_r4.json with dump.py and a dry run of
# grh_reissue.apply_edits on an in-memory copy. Every anchor occurs once unless nth is given.

# hayfever: Dymista arm exclusion row (one paragraph, four bullets on line breaks)
_DYMISTA_EXCL_OLD = (
    "- Known hypersensitivity to azelastine, fluticasone, or any excipients.\n"
    "- Untreated fungal, bacterial, or viral nasal infection.\n"
    "- Recent nasal surgery or trauma.\n"
    "- Children under 12 years of age."
)
_DYMISTA_EXCL_NEW = (
    "- Known hypersensitivity to azelastine, fluticasone, or any excipients.\n"
    "- Untreated fungal, bacterial, or viral nasal infection.\n"
    "- Recent nasal surgery or trauma.\n"
    "- Pregnancy or breastfeeding. Refer to the GP.\n"
    "- Children under 12 years of age."
)

# hayfever: fexofenadine arm cautions row (one paragraph, four bullets on line breaks)
_FEXO_CAUTIONS_OLD = (
    "- Caution in individuals with a history of cardiovascular disease.\n"
    "- Advise avoidance of alcohol and other sedating antihistamines.\n"
    "- If symptoms persist beyond 7 days or worsen, refer to a healthcare provider.\n"
    "- Ensure patients are aware this is a non-sedating antihistamine but occasional drowsiness may still occur."
)
_FEXO_CAUTIONS_NEW = (
    "- Caution in individuals with a history of cardiovascular disease.\n"
    "- Advise avoidance of alcohol and other sedating antihistamines.\n"
    "- If symptoms persist beyond one month of regular use or worsen, refer to a healthcare provider.\n"
    "- Ensure patients are aware this is a non-sedating antihistamine but occasional drowsiness may still occur."
)

EDITS = {
    "anxiety-propranolol": {
        "edits": [
            # Decision 55: dose row becomes as-required only
            ("replace", "10-40mg taken 30-60 minutes before anxiety-provoking situation",
             "10 to 40mg as a single dose, taken 30 to 60 minutes before the anxiety-provoking situation. As-required use only: regular daily dosing is not authorised under this PGD."),
            ("delete", "Alternatively, 10-40mg two to three times daily for ongoing situational anxiety"),
            ("delete", "Maximum 120mg daily"),
            # Decision 55: quantity row no longer speaks of a course
            ("replace", "Up to 28 tablets of 10mg, 280mg of propranolol in total, and no more. Propranolol is cardiotoxic in overdose and the whole supply taken at once must remain below 320mg. One supply per situational event or course. Review before any repeat. The 40mg strength is not authorised under this PGD.",
             "Up to 28 tablets of 10mg, 280mg of propranolol in total, and no more. Propranolol is cardiotoxic in overdose and the whole supply taken at once must remain below 320mg. One supply per situational event. Review before any repeat. The 40mg strength is not authorised under this PGD."),
            # Decision 55: treatment-period row no longer describes ongoing use
            ("replace", "Review before any repeat supply, and in any case at 4 weeks; ongoing use should be reviewed regularly. Consider gradual dose reduction if discontinuing.",
             "As-required use only, before an anxiety-provoking situation. Review before any repeat supply, and in any case at 4 weeks."),
        ],
        "changes": [
            "Decision 55: propranolol is authorised for as-required use only, 10 to 40mg as a single dose 30 to 60 minutes before an anxiety-provoking situation. The regular two-to-three-times-daily regimen and the 120mg daily maximum are removed from the dose row; the quantity row states one supply per situational event; the treatment-period row keeps the review before any repeat supply and at 4 weeks and drops the sentences on ongoing use and gradual dose reduction, which described the regular regimen.",
        ],
    },
    "sleep-melatonin": {
        "edits": [
            # Decision 56: the cimetidine, oestrogen and quinolone caution states when to refer
            ("replace", "Cimetidine, oestrogens including combined contraceptives and HRT, and quinolone antibiotics all raise melatonin levels by inhibiting its metabolism. Where the patient takes one of these, counsel on increased drowsiness and consider referral instead.",
             "Cimetidine, oestrogens including combined contraceptives and HRT, and quinolone antibiotics all raise melatonin levels by inhibiting its metabolism. Where the patient takes one of these, counsel on increased drowsiness. REFER INSTEAD OF SUPPLYING where the patient is also at risk of falls, or takes another sedating medicine (for example an opioid, a sedating antihistamine, a tricyclic antidepressant or a gabapentinoid). Otherwise supply may proceed with that counselling."),
            # Decision 56: the drug interactions row says the same
            ("replace", "Avoid: fluvoxamine, and any benzodiazepine or Z-drug. Caution and consider referral: cimetidine, oestrogens including combined contraceptives and HRT, quinolones, 5- and 8-methoxypsoralen. Reduced effect: carbamazepine, rifampicin, smoking. Alcohol should not be taken with Circadin. Melatonin induces CYP3A in vitro at supratherapeutic concentrations; clinical relevance unknown. Check the current SPC and BNF against the patient’s full medicine list.",
             "Avoid: fluvoxamine, and any benzodiazepine or Z-drug. Caution: cimetidine, oestrogens including combined contraceptives and HRT, and quinolones (refer instead where the patient is also at risk of falls or takes another sedating medicine; see the cautions), 5- and 8-methoxypsoralen. Reduced effect: carbamazepine, rifampicin, smoking. Alcohol should not be taken with Circadin. Melatonin induces CYP3A in vitro at supratherapeutic concentrations; clinical relevance unknown. Check the current SPC and BNF against the patient’s full medicine list."),
        ],
        "changes": [
            "Decision 56: for a patient taking cimetidine, an oestrogen or a quinolone, the cautions row and the drug interactions row now state that the patient is referred instead of supplied where they are also at risk of falls or take another sedating medicine; otherwise the caution stands and supply may proceed with counselling on increased drowsiness.",
        ],
    },
    "hayfever": {
        "edits": [
            # Decision 57: Dymista arm excludes pregnancy and breastfeeding, with referral
            ("replace", _DYMISTA_EXCL_OLD, _DYMISTA_EXCL_NEW),
            # Decision 58: fexofenadine review and referral point is one month, in the cautions
            ("replace", _FEXO_CAUTIONS_OLD, _FEXO_CAUTIONS_NEW),
            # Decision 58: and in the follow-up row
            ("replace", "To seek medical advice if symptoms worsen rapidly or significantly, persist beyond 7 days despite treatment, or they become systemically very unwell.",
             "To seek medical advice if symptoms worsen rapidly or significantly, persist beyond one month of regular use despite treatment, or they become systemically very unwell."),
        ],
        "changes": [
            "Decision 57: pregnancy and breastfeeding are added to the Dymista arm's exclusion criteria, with referral to the GP, so both arms of this PGD now exclude them.",
            "Decision 58: the fexofenadine review and referral point is one month of regular use, stated in the cautions row and in the follow-up advice row in place of 7 days, matching the 30-tablet one-month supply.",
        ],
    },
}
