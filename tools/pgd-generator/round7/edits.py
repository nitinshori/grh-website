# Round 7 per-document edits (14 September 2026). Anchors verified against the
# masters in masters_r6.json. Every anchor occurs once unless the edit is meant to
# hit both arms, in which case it is applied to every occurrence (no nth).

MEDICINE_TABLE_HEAD = "Vaccines authorised by this PGD: name, form, strength and dose"

EDITS = {
    # ── COVID-19: the medicine particulars belong in the PGD, not an appendix ──
    # The four products, their strengths and dose volumes were only in Appendix 1,
    # and the Dose and Quantity rows said "at the volume stated in Appendix 1".
    # Schedule 16 Part 2 of the Human Medicines Regulations 2012 requires the
    # description of the medicine, and the dose, to be particulars of the direction
    # itself. The table moves under "The medicine" (the hook in fixes-round7.py) and
    # every row states the volumes in full.
    "covid-booster": {
        "edits": [
            ("replace",
             "Spikevax LP.8.1 is for use where Comirnaty is unavailable. Nuvaxovid JN.1 is for use where the mRNA vaccines are unavailable or unsuitable. The dose volume differs between these products and Comirnaty. See Appendix 1.",
             "Spikevax LP.8.1 is for use where Comirnaty is unavailable. Nuvaxovid JN.1 is for use where the mRNA vaccines are unavailable or unsuitable. The dose volume differs between these products and Comirnaty: 0.3 mL for either Comirnaty presentation, 0.5 mL for Spikevax LP.8.1 and for Nuvaxovid JN.1. See the table of vaccines under The medicine."),
            ("replace",
             "Active immunisation of individuals aged 12 years and over for the prevention of COVID-19 caused by SARS-CoV-2, using one of the products listed in Appendix 1, in accordance with the current Summary of Product Characteristics for that product and variant, and the COVID-19 chapter of Immunisation Against Infectious Disease (the Green Book, chapter 14a). Comirnaty is the vaccine of choice, with Spikevax and Nuvaxovid available where Comirnaty stock is unavailable. This PGD covers privately funded vaccination, whether or not the individual is eligible under the NHS programme.",
             "Active immunisation of individuals aged 12 years and over for the prevention of COVID-19 caused by SARS-CoV-2, using one of the four products set out under The medicine below (Comirnaty XFG, Comirnaty LP.8.1, Spikevax LP.8.1 or Nuvaxovid JN.1), in accordance with the current Summary of Product Characteristics for that product and variant, and the COVID-19 chapter of Immunisation Against Infectious Disease (the Green Book, chapter 14a). Comirnaty is the vaccine of choice, with Spikevax and Nuvaxovid available where Comirnaty stock is unavailable. This PGD covers privately funded vaccination, whether or not the individual is eligible under the NHS programme."),
            ("replace",
             "A product listed in Appendix 1 is held, in date, and licensed for the age of the individual.",
             "One of the four products set out under The medicine is held, in date, and licensed for the age of the individual."),
            ("replace",
             "A single dose per campaign, at the volume stated in Appendix 1 for the product held. Minimum interval of 3 months from the previous COVID-19 vaccine dose. This PGD does not cover primary courses in individuals who are unvaccinated and immunosuppressed, or any schedule requiring more than one dose in the season.",
             "A single dose per campaign. Comirnaty XFG or Comirnaty LP.8.1: 30 micrograms in 0.3 mL. Spikevax LP.8.1: 50 micrograms in 0.5 mL (the 12 years and over dose; the 0.25 mL paediatric dose is not authorised). Nuvaxovid JN.1: 5 micrograms in 0.5 mL. All by intramuscular injection. Minimum interval of 3 months from the previous COVID-19 vaccine dose. This PGD does not cover primary courses in individuals who are unvaccinated and immunosuppressed, or any schedule requiring more than one dose in the season."),
            ("replace",
             "One dose of the selected product, at the volume stated in Appendix 1. This PGD does not permit supply of vaccine to the individual for administration elsewhere.",
             "One dose of the selected product: 0.3 mL of Comirnaty XFG or Comirnaty LP.8.1, or 0.5 mL of Spikevax LP.8.1 or Nuvaxovid JN.1. This PGD does not permit supply of vaccine to the individual for administration elsewhere."),
            ("replace", "Appendix 1: Vaccines covered by this PGD", MEDICINE_TABLE_HEAD),
            ("replace",
             "Confirm the presentation, licensed age range and dose volume against the current SPC before administration. The dose volume is not the same for all four products.",
             "Name, form, strength and dose of each vaccine authorised by this PGD. Confirm the presentation, licensed age range and dose volume against the current SPC before administration. The dose volume is not the same for all four products."),
            ("replace", "Appendix 2: Key references", "Appendix 1: Key references"),
        ],
        "changes": [
            "The vaccines authorised by this PGD, with their form, strength and dose volume, are now set out in the body "
            "of the PGD under The medicine, and the Indication, Inclusion, Dose and frequency and Quantity rows state the "
            "products and volumes in full. The earlier version carried these particulars only in an appendix, which does "
            "not meet Schedule 16 Part 2 of the Human Medicines Regulations 2012 (the description of the medicine and the "
            "dose are particulars of the direction itself). The references appendix is renumbered Appendix 1. Raised by an "
            "adopting pharmacy, 14 September 2026.",
        ],
    },

    # ── Eczema: the supply quantities must be marketed packs ──
    # Betamethasone valerate 0.1% cream and ointment are marketed as 30g and 100g
    # tubes; clobetasone butyrate 0.05% POM packs are 30g and 100g (the 15g
    # clobetasone cream is the pharmacy-medicine pack). Neither product exists as a
    # 15g POM pack or a 60g pack, so "SUPPLY 15g" could not be dispensed as written.
    "eczema": {
        "edits": [
            ("replace",
             "UP TO 2 ADULT PALMS, about 2% of body surface. 1 fingertip unit, 0.5g per application, 1g a day. SUPPLY 15g.",
             "UP TO 2 ADULT PALMS, about 2% of body surface. 1 fingertip unit, 0.5g per application, 1g a day. SUPPLY ONE 30g TUBE, the smallest marketed pack."),
            ("replace",
             "2 TO 5 ADULT PALMS. Up to 2.5 fingertip units, 1.25g per application, 2.5g a day. SUPPLY 30g.",
             "2 TO 5 ADULT PALMS. Up to 2.5 fingertip units, 1.25g per application, 2.5g a day. SUPPLY ONE 30g TUBE."),
            ("replace",
             "5 TO 10 ADULT PALMS, up to the 10% maximum. Up to 5 fingertip units, 2.5g per application, 5g a day, so 35g over 7 days. SUPPLY 60g.",
             "5 TO 10 ADULT PALMS, up to the 10% maximum. Up to 5 fingertip units, 2.5g per application, 5g a day, so 35g over 7 days. SUPPLY TWO 30g TUBES (60g)."),
            ("insert_after",
             "5 TO 10 ADULT PALMS, up to the 10% maximum. Up to 5 fingertip units, 2.5g per application, 5g a day, so 35g over 7 days. SUPPLY TWO 30g TUBES (60g).",
             ["Both products are marketed as 30g and 100g tubes. Supply 30g tubes only, one or two by treated area as above; do not supply a 100g tube, and do not record a pack size that does not exist. Record the number of tubes supplied."]),
            ("replace",
             "Up to 2 palms: 1 fingertip unit, 0.5g per application, 1g a day, 7g a week. Supply 15g.",
             "Up to 2 palms: 1 fingertip unit, 0.5g per application, 1g a day, 7g a week. Supply one 30g tube."),
            ("replace",
             "2 to 5 palms: up to 2.5 fingertip units, 1.25g per application, 2.5g a day, 17.5g a week. Supply 30g.",
             "2 to 5 palms: up to 2.5 fingertip units, 1.25g per application, 2.5g a day, 17.5g a week. Supply one 30g tube."),
            ("replace",
             "5 to 10 palms: up to 5 fingertip units, 2.5g per application, 5g a day, 35g a week. Supply 60g.",
             "5 to 10 palms: up to 5 fingertip units, 2.5g per application, 5g a day, 35g a week. Supply two 30g tubes (60g)."),
        ],
        "changes": [
            "Supply quantities in both arms are now stated as marketed packs: one 30g tube for a treated area of up to 5 adult "
            "palms, two 30g tubes for 5 to 10 palms. The earlier version directed a 15g supply for the smallest area and a 60g "
            "supply for the largest; betamethasone valerate 0.1% and clobetasone butyrate 0.05% (POM) are marketed as 30g and "
            "100g tubes only, so neither could be dispensed as written. The 7 day and 4 week treatment ceilings are unchanged. "
            "Raised by an adopting pharmacy, 14 September 2026.",
        ],
    },
}
