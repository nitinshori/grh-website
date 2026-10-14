/**
 * Minor reissues: earlier master files whose signatures still count.
 *
 * Two reissues were ruled MINOR by the Medical Director, so a signature
 * given on the earlier file carries over to the new one and nobody is asked
 * to sign again:
 *
 *   - 30 Sep 2026, round 9: every live PGD reissued to add a sentence on
 *     training before first use (round 7 file of 14 Sep 2026 carries over).
 *   - 14 Oct 2026, COVID v011: routine 15-minute observation removed, in
 *     line with Green Book chapter 14a (v010 and v009 carry over).
 *
 * Keyed by the CURRENT master filename (PGD_MASTER_FILES value); each value
 * lists earlier master filenames treated as the same document for practitioner
 * authorisation (src/lib/authorisations.ts) and clinical sign-off
 * (src/app/clinical-sign-off/page.tsx). A file that is not a key here has no
 * carry-over: a change of filename lapses signatures as before. Add an entry
 * only on a Medical Director ruling that the reissue is minor.
 *
 * period-delay-v012.pdf is not listed: it was already live in round 7, so
 * signatures on it are current anyway.
 */
export const PGD_MINOR_REISSUES: Record<string, readonly string[]> = {
  "acne-v006.pdf": ["acne-v005.pdf"],
  "alopecia-minoxidil-v005.pdf": ["alopecia-minoxidil-v004.pdf"],
  "altitude-sickness-v006.pdf": ["altitude-sickness-v005.pdf"],
  "anti-malarials-v012.pdf": ["anti-malarials-v011.pdf"],
  "anxiety-propranolol-v008.pdf": ["anxiety-propranolol-v007.pdf"],
  "asthma-rescue-v009.pdf": ["asthma-rescue-v008.pdf"],
  "b12-folate-v011.pdf": ["b12-folate-v010.pdf"],
  "bph-v006.pdf": ["bph-v005.pdf"],
  "bv-v006.pdf": ["bv-v005.pdf"],
  "cellulitis-v007.pdf": ["cellulitis-v006.pdf"],
  "chest-service-v010.pdf": ["chest-service-v009.pdf"],
  "chickenpox-v007.pdf": ["chickenpox-v006.pdf"],
  "cold-sores-v005.pdf": ["cold-sores-v004.pdf"],
  "copd-v006.pdf": ["copd-v005.pdf"],
  "covid-2026-27-v011.pdf": ["covid-2026-27-v010.pdf", "covid-2026-27-v009.pdf"],
  // Round 9 COVID file, in case it is live before v011 is published.
  "covid-2026-27-v010.pdf": ["covid-2026-27-v009.pdf"],
  "dengue-v008.pdf": ["dengue-v007.pdf"],
  "dental-bridging-v010.pdf": ["dental-bridging-v009.pdf"],
  "ear-infection-v008.pdf": ["ear-infection-v007.pdf"],
  "eczema-v008.pdf": ["eczema-v007.pdf"],
  "ed-v010.pdf": ["ed-v009.pdf"],
  "emergency-contraception-v006.pdf": ["emergency-contraception-v005.pdf"],
  "eye-infections-v005.pdf": ["eye-infections-v004.pdf"],
  "flu-2026-27-v007.pdf": ["flu-2026-27-v006.pdf"],
  "foundayo-v010.pdf": ["foundayo-v009.pdf"],
  "fungal-infection-v006.pdf": ["fungal-infection-v005.pdf"],
  "genital-warts-v007.pdf": ["genital-warts-v006.pdf"],
  "gonorrhoea-treatment-v006.pdf": ["gonorrhoea-treatment-v005.pdf"],
  "hair-loss-v005.pdf": ["hair-loss-v004.pdf"],
  "hayfever-v007.pdf": ["hayfever-v006.pdf"],
  "hep-ab-travel-v010.pdf": ["hep-ab-travel-v009.pdf"],
  "hep-b-occupational-v007.pdf": ["hep-b-occupational-v006.pdf"],
  "hepatitis-a-v002.pdf": ["hepatitis-a-v001.pdf"],
  "herpes-management-v007.pdf": ["herpes-management-v006.pdf"],
  "hpv-v008.pdf": ["hpv-v007.pdf"],
  "impetigo-v011.pdf": ["impetigo-v010.pdf"],
  "japanese-encephalitis-v008.pdf": ["japanese-encephalitis-v007.pdf"],
  "junior-travel-v009.pdf": ["junior-travel-v008.pdf"],
  "meningitis-acwy-travel-v009.pdf": ["meningitis-acwy-travel-v008.pdf"],
  "meningitis-b-v008.pdf": ["meningitis-b-v007.pdf"],
  "mmr-v007.pdf": ["mmr-v006.pdf"],
  "mounjaro-v011.pdf": ["mounjaro-v010.pdf"],
  "mysimba-v007.pdf": ["mysimba-v006.pdf"],
  "oral-minoxidil-v002.pdf": ["oral-minoxidil-v001.pdf"],
  "orlistat-v006.pdf": ["orlistat-v005.pdf"],
  "period-pain-v007.pdf": ["period-pain-v006.pdf"],
  "pneumococcal-v009.pdf": ["pneumococcal-v008.pdf"],
  "postnatal-contraception-v008.pdf": ["postnatal-contraception-v007.pdf"],
  "premature-ejaculation-v007.pdf": ["premature-ejaculation-v006.pdf"],
  "psoriasis-v008.pdf": ["psoriasis-v007.pdf"],
  "rabies-v008.pdf": ["rabies-v007.pdf"],
  "rosacea-v006.pdf": ["rosacea-v005.pdf"],
  "rsv-v008.pdf": ["rsv-v007.pdf"],
  "saxenda-v006.pdf": ["saxenda-v005.pdf"],
  "shingles-treatment-v009.pdf": ["shingles-treatment-v008.pdf"],
  "shingles-vaccine-v010.pdf": ["shingles-vaccine-v009.pdf"],
  "skin-infection-v009.pdf": ["skin-infection-v008.pdf"],
  "sleep-melatonin-v010.pdf": ["sleep-melatonin-v009.pdf"],
  "smoking-nrt-v005.pdf": ["smoking-nrt-v004.pdf"],
  "smoking-varenicline-v006.pdf": ["smoking-varenicline-v005.pdf"],
  "sore-throat-v007.pdf": ["sore-throat-v006.pdf"],
  "sti-testing-v005.pdf": ["sti-testing-v004.pdf"],
  "tetanus-v011.pdf": ["tetanus-v010.pdf"],
  "thrush-v007.pdf": ["thrush-v006.pdf"],
  "travel-core-v008.pdf": ["travel-core-v007.pdf"],
  "travellers-diarrhoea-v007.pdf": ["travellers-diarrhoea-v006.pdf"],
  "typhoid-v008.pdf": ["typhoid-v007.pdf"],
  "uti-v010.pdf": ["uti-v009.pdf"],
  "wegovy-oral-v013.pdf": ["wegovy-oral-v012.pdf"],
  "wegovy-v011.pdf": ["wegovy-v010.pdf"],
  "wound-care-v011.pdf": ["wound-care-v010.pdf"],
  "yellow-fever-v007.pdf": ["yellow-fever-v006.pdf"],
}

/** Earlier master filenames whose signatures count for this current file. */
export function equivalentMasterFiles(currentFile: string): readonly string[] {
  return PGD_MINOR_REISSUES[currentFile] ?? []
}

/** True if a signature on signedFile counts for currentFile. */
export function isEquivalentMasterFile(currentFile: string, signedFile: string | null | undefined): boolean {
  if (!signedFile) return false
  return signedFile === currentFile || equivalentMasterFiles(currentFile).includes(signedFile)
}

/** Version label from a master filename: acne-v006.pdf is "v006". */
export function versionFromMasterFile(file: string): string {
  const m = /-v(\d{3})\.pdf$/i.exec(file)
  return m ? `v${m[1]}` : file.replace(/\.pdf$/i, '')
}
