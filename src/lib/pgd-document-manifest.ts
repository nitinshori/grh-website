// AUTO-GENERATED from public/pgd-documents (updated 11 Jul 2026).
// Maps PGD slug -> filename of the signed master PDF served from /pgd-documents/.
// The " 2" variants are the HubRx-branded signed copies.
export const PGD_MASTER_FILES: Record<string, string> = {
  "acne": "acne.pdf",
  "adhd-monitoring": "adhd-monitoring.pdf",
  "alcohol-reduction": "alcohol-reduction.pdf",
  "alopecia-minoxidil": "alopecia-minoxidil.pdf",
  "altitude-sickness": "altitude-sickness.pdf",
  "anti-malarials": "anti-malarials.pdf",
  "anxiety-propranolol": "anxiety-propranolol.pdf",
  "asthma-rescue": "asthma-rescue.pdf",
  // v004 signed 6 Aug 2026: one document covering hydroxocobalamin injection,
  // cyanocobalamin tablets and folic acid, so both slugs point at it
  "b12-injection": "b12-folate-v004.pdf",
  "folic-acid": "b12-folate-v004.pdf",
  "bph": "bph.pdf",
  "bv": "bv.pdf",
  "chest-service": "chest-service.pdf",
  "chickenpox": "chickenpox.pdf",
  "cold-sores": "cold-sores.pdf",
  "copd": "copd.pdf",
  // 2026/27 season v003, signed 6 Aug 2026 with C. Pilkington's review edits
  "covid-booster": "covid-2026-27-v003.pdf",
  "dengue": "dengue.pdf",
  "dental-bridging": "dental-bridging.pdf",
  "diabetes-monitoring": "diabetes-monitoring.pdf",
  "ear-infection": "ear-infection.pdf",
  "eczema": "eczema.pdf",
  "ed": "ed.pdf",
  "emergency-contraception": "emergency-contraception.pdf",
  "eye-infections": "eye-infections.pdf",
  // 2026/27 season v003, signed 6 Aug 2026 with C. Pilkington's review edits
  "flu": "flu-2026-27-v003.pdf",
  "genital-warts": "genital-warts.pdf",
  "glp1-monitoring": "glp1-monitoring.pdf",
  "gonorrhoea-treatment": "gonorrhoea-treatment.pdf",
  "hair-loss": "hair-loss.pdf",
  "hayfever": "hayfever.pdf",
  "hep-b-occupational": "hep-b-occupational.pdf",
  "herpes-management": "herpes-management.pdf",
  "hpv": "hpv.pdf",
  "hrt": "hrt.pdf",
  "hypertension": "hypertension.pdf",
  "impetigo": "impetigo.pdf",
  // Split apart 21 Aug 2026. These three slugs previously all resolved to a
  // single combined Ixiaro / Rabies / MenACWY document, so a pharmacy
  // adopting one was signing for all three. Raised by PPH.
  "japanese-encephalitis": "japanese-encephalitis-v001.pdf",
  "meningitis-acwy-travel": "meningitis-acwy-travel-v001.pdf",
  // v002 signed 14 Aug 2026: covers Bexsero and Trumenba
  "meningitis-b": "meningitis-b-v002.pdf",
  "mmr": "mmr.pdf",
  // v002 signed 6 Aug 2026 (PPH clinical review)
  "mounjaro": "mounjaro-v002.pdf",
  "mysimba": "mysimba.pdf",
  "orlistat": "orlistat.pdf",
  // v002, 21 Aug 2026: restricted to lower UTI. Upper UTI and pyelonephritis
  // in children are now same-day referral, not a PGD supply.
  "paediatric-uti": "paediatric-uti-v002.pdf",
  "period-delay": "period-delay.pdf",
  "pneumococcal": "pneumococcal.pdf",
  "postnatal-contraception": "postnatal-contraception.pdf",
  "premature-ejaculation": "premature-ejaculation.pdf",
  "prep": "prep.pdf",
  "rabies": "rabies-v001.pdf",
  "recurrent-uti": "recurrent-uti.pdf",
  "rosacea": "rosacea.pdf",
  "rsv": "rsv.pdf",
  "saxenda": "saxenda.pdf",
  // GRH-signed masters (Nitin Shori + Chris Pilkington). Originally issued
  // to PPH; promoted to masters Aug 2026 so all pharmacies can use them.
  "skin-infection": "skin-infection.pdf",
  "cellulitis": "cellulitis.pdf",
  "fungal-infection": "fungal-infection.pdf",
  "psoriasis": "psoriasis.pdf",
  "period-pain": "period-pain.pdf",
  // shingles-treatment previously served the Shingrix VACCINE document, which
  // contains no antiviral at all. Now a genuine antiviral treatment PGD.
  "shingles-treatment": "shingles-treatment-v001.pdf",
  "shingles-vaccine": "shingles-vaccine.pdf",
  "sleep-melatonin": "sleep-melatonin.pdf",
  "smoking-nrt": "smoking-nrt.pdf",
  "smoking-varenicline": "smoking-varenicline.pdf",
  "sore-throat": "sore-throat.pdf",
  "statins": "statins.pdf",
  "sti-testing": "sti-testing.pdf",
  "threadworms": "threadworms.pdf",
  "thrush": "thrush.pdf",
  "travel-core": "travel-core.pdf",
  // typhoid is covered by the signed Travel Health Core Package PGD (Hep A + Typhoid + Cholera)
  "typhoid": "travel-core.pdf",
  // v002 signed 6 Aug 2026 (Nitin Shori + Chris Pilkington)
  "tetanus": "tetanus-v002.pdf",
  "junior-travel": "junior-travel-v002.pdf",
  // signed 13 Jul 2026 (Nitin Shori + Chris Pilkington)
  "trt": "trt.pdf",
  "travellers-diarrhoea": "travellers-diarrhoea.pdf",
  // testosterone for women (postmenopausal HSDD) is covered by the signed HRT/Menopause PGD
  "testosterone-women": "hrt.pdf",
  "uti": "uti.pdf",
  "wegovy": "wegovy-v002.pdf",
  "wegovy-oral": "wegovy-oral-v003.pdf",
  // signed 14 Aug 2026 (Nitin Shori + Chris Pilkington)
  "yellow-fever": "yellow-fever.pdf",
  "foundayo": "foundayo-v002.pdf",
  "wound-care": "wound-care.pdf"
};

// HubRx-branded copies. Used ONLY by the admin document listing: pharmacy
// downloads resolve through PGD_MASTER_FILES via pgd-documents.ts, so
// nothing in this map has ever been served to a pharmacy. It still matters,
// because these are the links used when someone sends a document to a HubRx
// pharmacy by hand.
//
// 21 Aug 2026: five entries were stale copies of masters that had since been
// reissued. The flu one stated no season at all, the COVID one predated the
// 2026/27 strains, and the MenB one contained no Trumenba. Reissuing a master
// had never included refreshing its branded copy, so those five now point at
// the master. A branded copy that goes stale silently is worse than no
// branding.
export const PGD_HUBRX_FILES: Record<string, string> = {
  "acne": "acne 2.pdf",
  "adhd-monitoring": "adhd-monitoring 2.pdf",
  "alcohol-reduction": "alcohol-reduction 2.pdf",
  "alopecia-minoxidil": "alopecia-minoxidil 2.pdf",
  "altitude-sickness": "altitude-sickness 2.pdf",
  "anti-malarials": "anti-malarials 2.pdf",
  "anxiety-propranolol": "anxiety-propranolol 2.pdf",
  "asthma-rescue": "asthma-rescue 2.pdf",
  "bph": "bph 2.pdf",
  "bv": "bv 2.pdf",
  "chickenpox": "chickenpox 2.pdf",
  "cold-sores": "cold-sores 2.pdf",
  "copd": "copd 2.pdf",
  "covid-booster": "covid-2026-27-v003.pdf",
  "dengue": "dengue 2.pdf",
  "dental-bridging": "dental-bridging 2.pdf",
  "diabetes-monitoring": "diabetes-monitoring 2.pdf",
  "ear-infection": "ear-infection 2.pdf",
  "eczema": "eczema 2.pdf",
  "ed": "ed 2.pdf",
  "emergency-contraception": "emergency-contraception 2.pdf",
  "eye-infections": "eye-infections 2.pdf",
  "flu": "flu-2026-27-v003.pdf",
  "genital-warts": "genital-warts 2.pdf",
  "glp1-monitoring": "glp1-monitoring 2.pdf",
  "gonorrhoea-treatment": "gonorrhoea-treatment 2.pdf",
  "hair-loss": "hair-loss 2.pdf",
  "hayfever": "hayfever 2.pdf",
  "hep-b-occupational": "hep-b-occupational 2.pdf",
  "herpes-management": "herpes-management 2.pdf",
  "hpv": "hpv 2.pdf",
  "hrt": "hrt 2.pdf",
  "hypertension": "hypertension 2.pdf",
  "impetigo": "impetigo 2.pdf",
  // Split 21 Aug 2026: the HubRx copies were duplicates of the same combined
  // document, so they point at the new standalone masters rather than being
  // re-branded copies of content that was wrong.
  "japanese-encephalitis": "japanese-encephalitis-v001.pdf",
  "meningitis-acwy-travel": "meningitis-acwy-travel-v001.pdf",
  "meningitis-b": "meningitis-b-v002.pdf",
  "mmr": "mmr 2.pdf",
  "mounjaro": "mounjaro-v002.pdf",
  "mysimba": "mysimba 2.pdf",
  "orlistat": "orlistat 2.pdf",
  "paediatric-uti": "paediatric-uti-v002.pdf",
  "period-delay": "period-delay 2.pdf",
  "pneumococcal": "pneumococcal 2.pdf",
  "postnatal-contraception": "postnatal-contraception 2.pdf",
  "premature-ejaculation": "premature-ejaculation 2.pdf",
  "prep": "prep 2.pdf",
  "rabies": "rabies-v001.pdf",
  "recurrent-uti": "recurrent-uti 2.pdf",
  "rosacea": "rosacea 2.pdf",
  "rsv": "rsv 2.pdf",
  "saxenda": "saxenda 2.pdf",
  "shingles-treatment": "shingles-treatment-v001.pdf",
  "shingles-vaccine": "shingles-vaccine 2.pdf",
  "sleep-melatonin": "sleep-melatonin 2.pdf",
  "smoking-nrt": "smoking-nrt 2.pdf",
  "smoking-varenicline": "smoking-varenicline 2.pdf",
  "sore-throat": "sore-throat 2.pdf",
  "statins": "statins 2.pdf",
  "sti-testing": "sti-testing 2.pdf",
  "threadworms": "threadworms 2.pdf",
  "thrush": "thrush 2.pdf",
  "travel-core": "travel-core 2.pdf",
  "typhoid": "travel-core 2.pdf",
  "testosterone-women": "hrt 2.pdf",
  "uti": "uti 2.pdf",
  "wegovy": "wegovy-v002.pdf",
  "wound-care": "wound-care 2.pdf"
};
