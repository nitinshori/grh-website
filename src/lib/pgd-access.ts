// ── pgd-access.ts ──────────────────────────────────────────────
// CLIENT-SAFE module: contains ONLY static constants. No DB code,
// no re-exports from server-only modules — re-exporting from
// `pgd-queries.ts` would still pull `db` into the client bundle.
//
// Server-side query functions (hasPharmacyPgdAccess, getPharmacyPgdSlugs,
// setPharmacyPgds) live in `@/lib/pgd-queries` and must be imported
// from there directly. That module has an `import "server-only"`
// guard that will throw at build time if a client component pulls it in.
//
// Constants below are pure data and safe to use from "use client".

/**
 * Master list of all PGDs available in the system.
 * Slug must match the directory name under /for-pharmacies/epgd/
 */
export const ALL_PGDS: { slug: string; title: string; subtitle: string; category: string }[] = [
  // Men's Health
  { slug: 'ed', title: 'Erectile Dysfunction', subtitle: 'Sildenafil / Tadalafil', category: "Men's Health" },
  { slug: 'hair-loss', title: 'Male Pattern Hair Loss', subtitle: 'Finasteride', category: "Men's Health" },
  { slug: 'premature-ejaculation', title: 'Premature Ejaculation', subtitle: 'Dapoxetine / Priligy', category: "Men's Health" },
  { slug: 'bph', title: 'Benign Prostatic Hyperplasia', subtitle: 'Tamsulosin', category: "Men's Health" },

  // Women's Health
  { slug: 'emergency-contraception', title: 'Emergency Contraception', subtitle: 'Levonorgestrel / Ulipristal', category: "Women's Health" },
  { slug: 'postnatal-contraception', title: 'Postnatal Contraception', subtitle: 'Desogestrel', category: "Women's Health" },
  { slug: 'thrush', title: 'Vaginal Thrush', subtitle: 'Fluconazole', category: "Women's Health" },
  { slug: 'period-delay', title: 'Period Delay', subtitle: 'Norethisterone 5mg', category: "Women's Health" },
  { slug: 'bv', title: 'Bacterial Vaginosis', subtitle: 'Metronidazole', category: "Women's Health" },
  { slug: 'alopecia-minoxidil', title: 'Female Pattern Hair Loss', subtitle: 'Minoxidil', category: "Women's Health" },

  // Sexual Health
  { slug: 'sti-testing', title: 'STI Testing', subtitle: 'Chlamydia / Gonorrhoea / Syphilis / HIV', category: 'Sexual Health' },
  { slug: 'genital-warts', title: 'Genital Warts', subtitle: 'Imiquimod / Podophyllotoxin', category: 'Sexual Health' },
  { slug: 'herpes-management', title: 'Genital Herpes', subtitle: 'Valaciclovir', category: 'Sexual Health' },
  // prep: Retired 8 Sep 2026. See RETIRED_SLUGS.
  { slug: 'gonorrhoea-treatment', title: 'Gonorrhoea Treatment', subtitle: 'Ceftriaxone IM', category: 'Sexual Health' },

  // Weight Management
  { slug: 'wegovy', title: 'Wegovy', subtitle: 'Semaglutide 2.4mg', category: 'Weight Management' },
  { slug: 'mounjaro', title: 'Mounjaro', subtitle: 'Tirzepatide', category: 'Weight Management' },
  { slug: 'wegovy-oral', title: 'Wegovy Tablets (Oral Semaglutide)', subtitle: 'UK-licensed weight management, 1.5/4/9/25 mg once daily, empty-stomach dosing', category: 'Weight Management' },
  { slug: 'saxenda', title: 'Saxenda', subtitle: 'Liraglutide 3.0mg', category: 'Weight Management' },
  { slug: 'mysimba', title: 'Mysimba', subtitle: 'Naltrexone/Bupropion', category: 'Weight Management' },
  { slug: 'orlistat', title: 'Orlistat', subtitle: 'Orlistat 120mg', category: 'Weight Management' },
  { slug: 'foundayo', title: 'Foundayo (Orforglipron) Tablets', subtitle: 'Once-daily oral GLP-1, no food or timing restrictions', category: 'Weight Management' },
  // glp1-monitoring: Retired 8 Sep 2026. See RETIRED_SLUGS.

  // Skin
  { slug: 'acne', title: 'Acne', subtitle: 'Adapalene / Lymecycline', category: 'Skin' },
  // Built from the PPH-signed PGD (J. Wilkins), 29 Jul 2026 — assigned to
  // PPH only via migration 036; no GRH master document yet.
  { slug: 'skin-infection', title: 'Skin Infection', subtitle: 'Flucloxacillin / Clarithromycin / Doxycycline', category: 'Skin' },
  { slug: 'cellulitis', title: 'Cellulitis', subtitle: 'Flucloxacillin / Clarithromycin / Doxycycline', category: 'Skin' },
  { slug: 'fungal-infection', title: 'Fungal Skin Infection', subtitle: 'Miconazole / Trimovate', category: 'Skin' },
  { slug: 'psoriasis', title: 'Psoriasis', subtitle: 'Calcipotriol 50 micrograms/g with betamethasone 0.5 mg/g, stable plaque psoriasis', category: 'Skin' },
  { slug: 'period-pain', title: 'Period Pain', subtitle: "Naproxen / Mefenamic Acid", category: "Women's Health" },
  { slug: 'rosacea', title: 'Rosacea', subtitle: 'Ivermectin / Doxycycline', category: 'Skin' },
  // Subtitle corrected 8 Sep 2026: the v002 document authorises betamethasone
  // and clobetasone. It contains no pimecrolimus (Elidel), no hydrocortisone and
  // no fusidic acid, so the catalogue was advertising a product the PGD does not
  // cover, in the same way the ear service advertised amoxicillin.
  { slug: 'eczema', title: 'Eczema', subtitle: 'Betamethasone / Clobetasone (Eumovate)', category: 'Skin' },
  { slug: 'impetigo', title: 'Impetigo', subtitle: 'Fusidic acid / Flucloxacillin / Clarithromycin (penicillin allergy)', category: 'Skin' },
  { slug: 'cold-sores', title: 'Cold Sores', subtitle: 'Valaciclovir', category: 'Skin' },
  { slug: 'shingles-treatment', title: 'Shingles Treatment', subtitle: 'Valaciclovir', category: 'Skin' },
  { slug: 'wound-care', title: 'Wound Care', subtitle: 'Assessment & Dressing', category: 'Skin' },

  // Acute & Infection
  { slug: 'uti', title: 'Uncomplicated UTI', subtitle: 'Nitrofurantoin / Trimethoprim', category: 'Acute & Infection' },
  { slug: 'sore-throat', title: 'Acute Sore Throat', subtitle: 'Phenoxymethylpenicillin', category: 'Acute & Infection' },
  { slug: 'ear-infection', title: 'Acute Otitis Externa', subtitle: 'Ciprofloxacin ear drops / Dexamethasone-neomycin spray', category: 'Acute & Infection' },
  // eye-infections removed from public catalogue — chloramphenicol OTC (Apr 2026)
  // threadworms: Retired 8 Sep 2026 as a PGD. Mebendazole for threadworm at 2 years and over is a P medicine (Ovex), and a PGD is only required for a POM. Handled as a P sale under pharmacy protocol, following the same ruling made on the ibuprofen arm of the dental PGD. See RETIRED_SLUGS.
  // Corrected 28 Jul 2026: this PGD is the Varivax/Varilrix VACCINATION
  // (matching the signed master document) — an aciclovir label from an
  // early draft had survived here and mis-listed it under Acute & Infection
  // (reported by Jane Wilkins, PPH).
  { slug: 'chickenpox', title: 'Chickenpox (Varicella) Vaccine', subtitle: 'Varivax / Varilrix', category: 'Vaccines' },

  // Respiratory
  { slug: 'asthma-rescue', title: 'Asthma Rescue', subtitle: 'Salbutamol', category: 'Respiratory' },
  { slug: 'copd', title: 'COPD', subtitle: 'Rescue Inhalers & Monitoring', category: 'Respiratory' },
  { slug: 'smoking-nrt', title: 'Smoking Cessation (NRT)', subtitle: 'Patches / Gum / Lozenges', category: 'Respiratory' },
  { slug: 'chest-service', title: 'Chest Infection Service', subtitle: 'Acute Bacterial Bronchitis (Doxycycline / Amoxicillin / Clarithromycin)', category: 'Respiratory' },

  // Cardiovascular
  // hypertension: Retired 8 Sep 2026. See RETIRED_SLUGS.
  // statins: Retired 8 Sep 2026. See RETIRED_SLUGS.
  // diabetes-monitoring: Retired 8 Sep 2026. See RETIRED_SLUGS.

  // Mental Health & Wellbeing
  { slug: 'smoking-varenicline', title: 'Smoking Cessation (Varenicline)', subtitle: 'Champix', category: 'Mental Health & Wellbeing' },
  { slug: 'sleep-melatonin', title: 'Insomnia (Circadin)', subtitle: 'Melatonin 2mg prolonged-release, primary insomnia, 55 and over', category: 'Mental Health & Wellbeing' },
  // adhd-monitoring removed from public catalogue — clinical review (Apr 2026)
  { slug: 'anxiety-propranolol', title: 'Situational Anxiety', subtitle: 'Propranolol', category: 'Mental Health & Wellbeing' },
  { slug: 'hayfever', title: 'Hayfever (Severe)', subtitle: 'Fexofenadine / Mometasone', category: 'Mental Health & Wellbeing' },
  { slug: 'b12-injection', title: 'Vitamin B12 Injection', subtitle: 'Hydroxocobalamin injection and cyanocobalamin tablets (B12 deficiency)', category: 'Mental Health & Wellbeing' },
  { slug: 'folic-acid', title: 'Folate Deficiency', subtitle: 'Folic acid 5mg tablets (B12 status must be checked first)', category: 'Mental Health & Wellbeing' },

  // Vaccines
  { slug: 'flu', title: 'Flu Vaccination', subtitle: 'Seasonal Influenza', category: 'Vaccines' },
  { slug: 'covid-booster', title: 'COVID-19 Booster', subtitle: 'mRNA / Protein Subunit', category: 'Vaccines' },
  { slug: 'shingles-vaccine', title: 'Shingles Vaccine', subtitle: 'Shingrix', category: 'Vaccines' },
  { slug: 'pneumococcal', title: 'Pneumococcal Vaccine', subtitle: 'PCV20 (Prevenar 20)', category: 'Vaccines' },
  // Subtitle corrected 8 Sep 2026: 'Gardasil 9' alone told a pharmacist
  // nothing about who the service is for, and the tool had quietly become
  // female-only. The v002 document covers all sexes from 9 years.
  { slug: 'hpv', title: 'HPV Vaccine', subtitle: 'Gardasil 9, all sexes from 9 years, schedule set by age and immune status', category: 'Vaccines' },
  { slug: 'mmr', title: 'MMR Vaccine', subtitle: 'Measles, Mumps, Rubella', category: 'Vaccines' },
  { slug: 'meningitis-b', title: 'Meningitis B', subtitle: 'Bexsero (from 2 months) and Trumenba (from 10 years)', category: 'Vaccines' },
  { slug: 'meningitis-acwy-travel', title: 'Meningitis ACWY', subtitle: 'MenQuadfi / Nimenrix', category: 'Vaccines' },
  { slug: 'rsv', title: 'RSV Vaccine', subtitle: 'Abrysvo / Arexvy', category: 'Vaccines' },
  { slug: 'hep-ab-travel', title: 'Hepatitis A/B (Travel)', subtitle: 'Twinrix / Havrix / Engerix-B', category: 'Vaccines' },
  { slug: 'typhoid', title: 'Typhoid', subtitle: 'Typhim Vi / Vivotif', category: 'Vaccines' },
  { slug: 'yellow-fever', title: 'Yellow Fever', subtitle: 'Stamaril (registered YFVCs only)', category: 'Vaccines' },

  // Travel Health
  { slug: 'travel-core', title: 'Travel Health Assessment', subtitle: 'Risk Assessment & Advice', category: 'Travel Health' },
  { slug: 'anti-malarials', title: 'Anti-Malarials', subtitle: 'Atovaquone-Proguanil / Doxycycline', category: 'Travel Health' },
  { slug: 'hep-b-occupational', title: 'Hepatitis B', subtitle: 'Engerix-B / Fendrix', category: 'Travel Health' },
  { slug: 'rabies', title: 'Rabies Vaccine', subtitle: 'Pre-exposure Prophylaxis', category: 'Travel Health' },
  { slug: 'tetanus', title: 'Tetanus, Diphtheria and Polio', subtitle: 'Td/IPV (Revaxis), 10 years and over', category: 'Travel Health' },
  { slug: 'junior-travel', title: 'Junior Travel Vaccines', subtitle: 'Paediatric travel vaccines, 12 months to 17 years', category: 'Travel Health' },
  { slug: 'japanese-encephalitis', title: 'Japanese Encephalitis', subtitle: 'Ixiaro', category: 'Travel Health' },
  { slug: 'dengue', title: 'Dengue Vaccine', subtitle: 'Qdenga', category: 'Travel Health' },
  { slug: 'altitude-sickness', title: 'Altitude Sickness', subtitle: 'Acetazolamide', category: 'Travel Health' },
  { slug: 'travellers-diarrhoea', title: "Traveller's Diarrhoea", subtitle: 'Ciprofloxacin / Azithromycin', category: 'Travel Health' },

  // Occupational Health
  // needlestick-pep removed from public catalogue — not suitable for pharmacy-level supply (Apr 2026)
  { slug: 'dental-bridging', title: 'Dental Bridging Rx', subtitle: 'Emergency Dental Treatment', category: 'Occupational Health' },

  // Paediatrics
]

/**
 * PGD slugs where the ePGD tool is still "Coming Soon" (placeholder page only).
 */
// Saxenda, Mysimba and GLP-1 Monitoring came off this list on 26 Aug 2026.
// They were never placeholders: all three were fully built and carried the
// badge only because nobody had removed it. Smoke tested live before the
// badge came off, and all three ran a consultation from step 1 through to
// step 8. Saxenda correctly refused to advance at BMI 20.8 and again when
// pregnancy was ticked; Mysimba refused on a naltrexone hypersensitivity.
//
// The four left are genuine placeholders: a static page with a badge and no
// consultation logic behind it. Each needs building before it can come off.
// TRT came off on 26 Aug 2026 too, for a different reason: it was never
// unbuilt. Four complete consultation tools already existed, one per
// preparation, and nothing linked to any of them. /epgd/trt is now the
// preparation chooser that reaches them.
// Genital warts came off on 26 Aug 2026, on Nitin's instruction, once the
// tool was built from the signed PGD. Its clinical logic is covered by an
// executed test rather than a read-through: a fresh consultation raises no
// stops, and all nine exclusions each block independently.
//
// The two below are still literally placeholder pages: a heading, a badge
// and a paragraph saying the tool is in development. Taking the badge off
// either of them would advertise a dead end as a live service, so they stay
// until each is built.
export const COMING_SOON_SLUGS = new Set([
  'herpes-management',
  'gonorrhoea-treatment',
])

/**
 * PGDs withdrawn from service because the signed document contains a clinical
 * error. Nothing here may be supplied by anyone, under any tenant, until a
 * corrected version has been signed.
 *
 * WHY THIS EXISTS SEPARATELY FROM pharmacy_pgds.status
 *
 * Setting every assignment to 'not_approved' looks like a withdrawal and is
 * not one. mayUseEpgdTool() in src/proxy.ts grants HubRx pharmacies the whole
 * catalogue by partner agreement, matching against ALL_PGDS instead of against
 * their assignments, because they hold no pharmacy_pgds rows at all. So a
 * status change withdraws a tool from GRH pharmacies and leaves it fully open
 * to every HubRx one.
 *
 * That is exactly what happened to threadworms on 7 Sep 2026. Migration 051
 * set it to not_approved for a four-fold mebendazole overdose, the tool went
 * dark for GRH pharmacies, and it stayed reachable for HubRx the whole time.
 * Found on 7 Sep 2026 while withdrawing anti-malarials for the same class of
 * error, which is the only reason it was found at all.
 *
 * This set is checked FIRST in mayUseEpgdTool, before the HubRx branch, so a
 * withdrawal cannot be routed around by tenant. Withdrawing a PGD needs all
 * three of: an entry here, the assignment status, and the served PDF replaced
 * with a withdrawal notice. The document is not withdrawn until the file is,
 * because /pgd-documents is served without authentication.
 */
/**
 * ── Services that are not available, and why ───────────────────────────
 *
 * Split into three sets on 8 September 2026 because they are not the same
 * kind of thing, and the difference matters. A single flat list invited
 * someone to "restore" an instrument that can never lawfully exist.
 *
 * WITHDRAWN_SLUGS is the union of all three and remains the enforcement set:
 * it is what src/proxy.ts and the document route check. Adding a slug to any
 * of the three sets below switches the service off; there is no way to put a
 * slug in one of them and forget to enforce it.
 */

/**
 * RETIRED. Not coming back as a PGD. Do not restore these.
 */
export const RETIRED_SLUGS = new Set([
  // Methylphenidate (Concerta XL / Equasym XL) is a Schedule 2 controlled drug.
  // NHS Specialist Pharmacy Service, "Supply and/or administration of
  // Controlled Drugs under a PGD", updated 1 July 2026: "Unless listed below a
  // CD cannot be administered or supplied under a PGD." The Schedule 2 list is
  // morphine and diamorphine (registered nurses and pharmacists only, for the
  // immediate necessary treatment of a sick or injured person, not for
  // addiction) and ketamine. Methylphenidate is not on it.
  //
  // So no PGD can lawfully supply methylphenidate, by any staff group. The
  // instrument is void rather than defective: there is nothing to rewrite.
  // The document stated its own legal category as "POM, Schedule 2 Controlled
  // Drug", so the fact was on its face throughout.
  // Confirmed permanently retired by Nitin, 8 Sep 2026.
  'adhd-monitoring',

  // Mebendazole for threadworm at 2 years and over is a P medicine (Ovex
  // Suspension, Ovex tablets), and a PGD is only required for a POM. Retired
  // on Nitin's ruling, 8 Sep 2026, following the same reasoning Chris applied
  // to the ibuprofen arm of the dental PGD: handled instead as a P sale under
  // pharmacy protocol with a consultation record.
  //
  // The withdrawn PGD also carried two defects beyond the dosing error that
  // caused the withdrawal. It permitted supply in pregnancy in the second and
  // third trimesters, where the SPC contraindicates mebendazole in pregnancy
  // outright; and it named cimetidine as the only interaction, omitting
  // metronidazole, which the SPC says should be avoided with mebendazole
  // following a Stevens-Johnson syndrome and toxic epidermal necrolysis
  // outbreak. Both are carried into the pharmacy protocol that replaces it.
  //
  // 9 Sep 2026: removed from the platform entirely on Nitin's instruction.
  // Route, documents, catalogue entry, training module and marketing copy
  // all deleted. The slug stays here only so that any stale assignment in a
  // pharmacy's record can never resolve to anything.
  'threadworms',

  // 10 Sep 2026: HRT, TRT and testosterone for women removed from the platform
  // entirely on Nitin's instruction, with the four testosterone brand tools.
  // The controlled drug question is no longer being waited on: the services
  // are gone. Slugs kept as tombstones only.
  'hrt',
  'trt',
  'testosterone-women',

  // 10 Sep 2026: paediatric UTI and recurrent UTI removed entirely. Withdrawn
  // from the catalogue on 26 Aug but their documents stayed published; the
  // clinical review found critical defects in both. Nitin: we are not doing
  // these.
  'paediatric-uti',
  'recurrent-uti',

  // 9 Sep 2026: ADHD, diabetes, GLP-1 monitoring, hypertension, PrEP and
  // statins removed from the platform entirely on Nitin's instruction, the
  // same as threadworms: routes, documents, catalogue entries, training
  // modules, comparison rows. Slugs stay here as tombstones only.
  //
  // The five long-term-condition services, retired on Nitin's ruling,
  // 8 Sep 2026. Withdrawn on 7 Sep on Chris Pilkington's ruling, not because
  // of the medicines but because of the model: a PGD supplies a defined
  // product to a defined group without individual prescriber assessment, and
  // each of these authorised indefinite supply with individual titration and
  // the interpretation of laboratory results, which is ongoing management of
  // a long-term condition and not what the instrument is for.
  //
  //   statins              atorvastatin 20/40/80mg, indefinite, lipid-driven
  //   hypertension         amlodipine with a dose-escalation rule
  //   diabetes-monitoring  titled monitoring; actually initiates and titrates
  //                        metformin
  //   prep                 3-monthly testing, ongoing renal monitoring
  //   glp1-monitoring      titled monitoring; contains a full supply
  //                        authorisation duplicating the Wegovy PGD with
  //                        weaker exclusions and a fourfold pen-count error
  //
  // The option to rebuild them on a prescriber model (a prescription or
  // Patient Specific Direction), which would have kept the consultation
  // tooling and changed only the legal mechanism at the point of supply, was
  // put to Nitin and declined. They are retired.
  //
  // PrEP note retained for the record: stopping HIV pre-exposure prophylaxis
  // abruptly leaves people exposed, so any pharmacy with a patient on it must
  // arrange onward supply through a sexual health service rather than simply
  // stopping. Nitin confirmed on 7 Sep that nobody is currently on PrEP.
  'statins',
  'hypertension',
  'diabetes-monitoring',
  'prep',
  'glp1-monitoring',
])

/**
 * PAUSED pending an answer from outside this organisation. Do not restore on
 * anyone's reading of the guidance, including mine.
 */
export const PAUSED_SLUGS = new Set([
  // Paused 7 Sep 2026 on Nitin's instruction, "safety first", while the legal
  // position is confirmed. REVERSIBLE: if testosterone turns out to be
  // permitted under a PGD, move these two out and re-approve.
  //
  // Testosterone is a Schedule 4 Part II controlled drug. Part II is the
  // anabolic and androgenic steroids part; Part I is the benzodiazepines and
  // z-drugs.
  //
  // NHS Specialist Pharmacy Service, updated 1 July 2026: "Unless listed below
  // a CD cannot be administered or supplied under a PGD", and for Schedule 4,
  // "All drugs except anabolic steroids and injectable medications used for
  // treating addiction." On that reading testosterone is excluded.
  //
  // A Claude conversation in May 2026 advised Nitin the opposite, that
  // Schedule 4 Part I is excluded and Part II permitted. That is inverted
  // relative to the SPS page. Neither that answer nor this one is a source;
  // the question is with a human authority, meaning the indemnity provider or
  // the RPS. Pending that answer the service stays paused rather than running
  // on a disputed basis.
  //
  // Left paused on 8 Sep 2026: it was put to Nitin alongside the other
  // withdrawn services and he did not move it.
])

/**
 * BEING REBUILT. Off now, expected back in a different form.
 */
export const REBUILDING_SLUGS = new Set<string>([
  // Empty as at 8 September 2026.
  //
  // sleep-melatonin was here. Restored the same day at v002, rebuilt around
  // Circadin only. The unlicensed melatonin arm was removed rather than
  // corrected, because the Human Medicines Regulations 2012 do not permit an
  // unlicensed medicine to be supplied under a PGD at all, and the age floor
  // was set to 55, which is the licensed indication, rather than the 18 that
  // v001 asserted. See REISSUED_PGDS.
])

/**
 * The enforcement set. Union of the three above; do not add slugs here
 * directly, add them to whichever set describes the reason.
 */
export const WITHDRAWN_SLUGS = new Set([
  ...RETIRED_SLUGS,
  ...PAUSED_SLUGS,
  ...REBUILDING_SLUGS,
])

/**
 * ── Route-level access control for ePGD tools ──────────────────────
 *
 * Until 26 Aug 2026 only 7 of the 95 tool routes checked whether the
 * pharmacy actually held that PGD. The middleware checked for a session and
 * nothing more, so any signed-in pharmacy user could open almost any tool by
 * typing the URL. The check now lives in src/proxy.ts and covers every tool.
 *
 * These two constants are the exceptions to it. They are here, next to
 * ALL_PGDS, because this file is the client-safe source of truth for what a
 * PGD is, and because getting either of them wrong locks real pharmacies out
 * of services they pay for.
 */

/**
 * Route segments under /for-pharmacies/epgd/ that are not a PGD and must
 * never be gated on an assignment.
 *
 *   shared       shared step components, no page of its own
 *   certificate  patient certificate printing, reached from inside a tool
 *                that has already passed its own check
 *   custom       custom-built PGDs, which carry their own PgdGate
 */
export const EPGD_UNGATED_SEGMENTS = new Set([
  'shared',
  'certificate',
  'custom',
])

/**
 * Tools that live at a route which is not the slug they are supplied under.
 * The four testosterone brands are all dispensed under the 'trt' PGD, and the
 * two thrush combination packs under 'thrush'.
 *
 * The check passes if the pharmacy holds EITHER the route name or the parent
 * slug. Both are matched rather than just one because the database contains
 * assignments under both spellings: there are pharmacy_pgds rows for 'trt'
 * and separate rows for 'tostran', 'testogel', 'sustanon' and 'nebido'.
 * Matching both means this check cannot take access away from a pharmacy
 * that has it today, which was the whole risk in adding it.
 */
export const EPGD_SEGMENT_ALIASES: Record<string, string[]> = {
  'thrush-combi': ['thrush'],
  'thrush-duo': ['thrush'],
}

/**
 * All unique categories in display order.
 */
export const PGD_CATEGORIES = [
  "Men's Health",
  "Women's Health",
  'Sexual Health',
  'Weight Management',
  'Skin',
  'Acute & Infection',
  'Respiratory',
  'Cardiovascular',
  'Mental Health & Wellbeing',
  'Vaccines',
  'Travel Health',
  'Occupational Health',
  'Paediatrics',
] as const

/**
 * PGDs reissued at a new version, with the date the new version took effect.
 *
 * Surfaced as a notice on the pharmacy dashboard so that a pharmacist opening
 * one of these sees that the document has changed since they last read it,
 * rather than discovering it mid-consultation. Nitin's decision on 7 Sep 2026
 * was to replace the files silently and notify at next login rather than
 * emailing every holder.
 *
 * The practical reason this matters: several of these changed their INCLUSION
 * criteria, not just their wording. A pharmacist working from memory of v001
 * would supply patients v002 excludes. Dental no longer covers ibuprofen at
 * all, and any facial swelling now refers; bronchitis now requires purulent
 * sputum plus a risk factor or duration; betamethasone is off the face and
 * flexures; the second-line skin antibiotics are gated on penicillin allergy.
 *
 * Remove an entry once it is no longer newsworthy, roughly 3 months.
 */
export const REISSUED_PGDS: Record<string, { version: string; date: string }> = {
  // 11 Sep 2026, round 3: every live document reissued after the adversarial
  // review of 10 Sep. Structural clean-up in all 70; clinical criticals fixed in
  // 24 (see tools/pgd-generator/fixes-round3.py for the per-document list).
  acne: { version: 'v003', date: '11 September 2026' },
  'alopecia-minoxidil': { version: 'v002', date: '11 September 2026' },
  'altitude-sickness': { version: 'v003', date: '11 September 2026' },
  'anti-malarials': { version: 'v008', date: '11 September 2026' },
  'anxiety-propranolol': { version: 'v004', date: '11 September 2026' },
  'asthma-rescue': { version: 'v005', date: '11 September 2026' },
  'b12-injection': { version: 'v008', date: '11 September 2026' },
  bph: { version: 'v002', date: '11 September 2026' },
  bv: { version: 'v003', date: '11 September 2026' },
  cellulitis: { version: 'v002', date: '11 September 2026' },
  'chest-service': { version: 'v007', date: '11 September 2026' },
  chickenpox: { version: 'v004', date: '11 September 2026' },
  'cold-sores': { version: 'v002', date: '11 September 2026' },
  copd: { version: 'v002', date: '11 September 2026' },
  'covid-booster': { version: 'v006', date: '11 September 2026' },
  dengue: { version: 'v005', date: '11 September 2026' },
  'dental-bridging': { version: 'v007', date: '11 September 2026' },
  'ear-infection': { version: 'v005', date: '11 September 2026' },
  eczema: { version: 'v005', date: '11 September 2026' },
  ed: { version: 'v006', date: '11 September 2026' },
  'emergency-contraception': { version: 'v003', date: '11 September 2026' },
  'eye-infections': { version: 'v002', date: '11 September 2026' },
  flu: { version: 'v004', date: '11 September 2026' },
  'folic-acid': { version: 'v008', date: '11 September 2026' },
  foundayo: { version: 'v007', date: '11 September 2026' },
  'fungal-infection': { version: 'v003', date: '11 September 2026' },
  'genital-warts': { version: 'v003', date: '11 September 2026' },
  'gonorrhoea-treatment': { version: 'v003', date: '11 September 2026' },
  'hair-loss': { version: 'v002', date: '11 September 2026' },
  hayfever: { version: 'v003', date: '11 September 2026' },
  'hep-ab-travel': { version: 'v006', date: '11 September 2026' },
  'hep-b-occupational': { version: 'v004', date: '11 September 2026' },
  'herpes-management': { version: 'v003', date: '11 September 2026' },
  hpv: { version: 'v004', date: '11 September 2026' },
  impetigo: { version: 'v008', date: '11 September 2026' },
  'japanese-encephalitis': { version: 'v005', date: '11 September 2026' },
  'junior-travel': { version: 'v006', date: '11 September 2026' },
  'meningitis-acwy-travel': { version: 'v006', date: '11 September 2026' },
  'meningitis-b': { version: 'v004', date: '11 September 2026' },
  mmr: { version: 'v004', date: '11 September 2026' },
  mounjaro: { version: 'v007', date: '11 September 2026' },
  mysimba: { version: 'v003', date: '11 September 2026' },
  orlistat: { version: 'v002', date: '11 September 2026' },
  'period-delay': { version: 'v008', date: '11 September 2026' },
  'period-pain': { version: 'v003', date: '11 September 2026' },
  pneumococcal: { version: 'v004', date: '11 September 2026' },
  'postnatal-contraception': { version: 'v004', date: '11 September 2026' },
  'premature-ejaculation': { version: 'v003', date: '11 September 2026' },
  psoriasis: { version: 'v004', date: '11 September 2026' },
  rabies: { version: 'v005', date: '11 September 2026' },
  rosacea: { version: 'v003', date: '11 September 2026' },
  rsv: { version: 'v005', date: '11 September 2026' },
  saxenda: { version: 'v003', date: '11 September 2026' },
  'shingles-treatment': { version: 'v005', date: '11 September 2026' },
  'shingles-vaccine': { version: 'v005', date: '11 September 2026' },
  'skin-infection': { version: 'v005', date: '11 September 2026' },
  'sleep-melatonin': { version: 'v005', date: '11 September 2026' },
  'smoking-nrt': { version: 'v002', date: '11 September 2026' },
  'smoking-varenicline': { version: 'v003', date: '11 September 2026' },
  'sore-throat': { version: 'v003', date: '11 September 2026' },
  'sti-testing': { version: 'v002', date: '11 September 2026' },
  tetanus: { version: 'v008', date: '11 September 2026' },
  thrush: { version: 'v003', date: '11 September 2026' },
  'travel-core': { version: 'v004', date: '11 September 2026' },
  'travellers-diarrhoea': { version: 'v003', date: '11 September 2026' },
  typhoid: { version: 'v005', date: '11 September 2026' },
  uti: { version: 'v005', date: '11 September 2026' },
  wegovy: { version: 'v007', date: '11 September 2026' },
  'wegovy-oral': { version: 'v010', date: '11 September 2026' },
  'wound-care': { version: 'v007', date: '11 September 2026' },
  'yellow-fever': { version: 'v004', date: '11 September 2026' },
}

/**
 * Version string for a signed-off master document.
 *
 * A clinical sign-off only stands for the version that was actually read and
 * signed. The register already compares the stored itemVersion against the
 * current one and re-presents the item when they differ, but it was comparing
 * strings that never changed on reissue:
 *
 *   - the pharmacy view used the constant 'GRH master' for every master PGD;
 *   - the GRH clinician view used the PDF filename, and five of the September
 *     reissues (dental-bridging, eczema, chest-service, skin-infection,
 *     wound-care) were published over the same filename.
 *
 * So a signature given against v001 kept showing as current after v002 went
 * live. That matters because several of those reissues changed INCLUSION
 * criteria rather than wording: dental no longer covers ibuprofen at all,
 * bronchitis needs purulent sputum plus a risk factor or duration, and
 * betamethasone came off the face and flexures. A pharmacist working from
 * memory of v001 will supply patients v002 excludes.
 *
 * Appending the reissue version makes those signatures differ, which puts the
 * item back in front of the pharmacy to be re-signed. Slugs that have not been
 * reissued keep their existing string untouched, so signatures already held
 * across the rest of the estate are not disturbed.
 */
export function withReissueVersion(slug: string, base: string): string {
  const reissued = REISSUED_PGDS[slug]
  if (!reissued) return base
  if (base.includes(reissued.version)) return base
  return `${base} ${reissued.version}`
}
