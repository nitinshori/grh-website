# Round 6, batch B: joint sign-off of 11 September 2026 (evening).
# Slugs: sleep-melatonin (document and tool), wound-care (tool only; no document edit).
# Anchors verified against the masters in masters_r5.json with dump.py / apply_edits.

EDITS = {
    "sleep-melatonin": {
        "edits": [
            # Guidance summary (SmPC interactions paragraph): keep the SmPC statement but say what this PGD does.
            ("replace",
             "Caution should be exercised with 5- or 8-methoxypsoralen and with cimetidine, both of which increase melatonin levels by inhibiting its metabolism.",
             "Caution should be exercised with 5- or 8-methoxypsoralen and with cimetidine, both of which increase melatonin levels by inhibiting its metabolism. Under this PGD, 5- and 8-methoxypsoralen are an exclusion (see the exclusion criteria); cimetidine is a caution."),
            # Drug interactions row: 5- and 8-methoxypsoralen removed from the caution list and stated as an exclusion.
            ("replace",
             "Avoid: fluvoxamine, and any benzodiazepine or Z-drug. Caution: cimetidine, oestrogens including combined contraceptives and HRT, and quinolones (refer instead where the patient is also at risk of falls or takes another sedating medicine; see the cautions), 5- and 8-methoxypsoralen. Reduced effect: carbamazepine, rifampicin, smoking. Alcohol should not be taken with Circadin. Melatonin induces CYP3A in vitro at supratherapeutic concentrations; clinical relevance unknown. Check the current SPC and BNF against the patient’s full medicine list.",
             "Avoid: fluvoxamine, and any benzodiazepine or Z-drug. Exclusion: 5-methoxypsoralen and 8-methoxypsoralen (listed in the exclusion criteria; do not supply). Caution: cimetidine, oestrogens including combined contraceptives and HRT, and quinolones (refer instead where the patient is also at risk of falls or takes another sedating medicine; see the cautions). Reduced effect: carbamazepine, rifampicin, smoking. Alcohol should not be taken with Circadin. Melatonin induces CYP3A in vitro at supratherapeutic concentrations; clinical relevance unknown. Check the current SPC and BNF against the patient’s full medicine list."),
        ],
        "changes": [
            "Decision, joint sign-off 11 September 2026: 5- and 8-methoxypsoralen are an exclusion only; the drug interactions row no longer lists them under caution and states that they are an exclusion, the guidance summary notes that this PGD treats them as an exclusion, and the exclusion criterion is unchanged.",
        ],
    },
    # Tool only: the 'more than 6 hours' alert and the high-risk wording were reworded to the v009 document. No document edit.
    "wound-care": {},
}
