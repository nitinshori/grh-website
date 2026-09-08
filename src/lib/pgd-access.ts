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
  { slug: 'trt', title: 'Testosterone Replacement', subtitle: 'Testosterone Undecanoate', category: "Men's Health" },
  { slug: 'hair-loss', title: 'Male Pattern Hair Loss', subtitle: 'Finasteride', category: "Men's Health" },
  { slug: 'premature-ejaculation', title: 'Premature Ejaculation', subtitle: 'Dapoxetine / Priligy', category: "Men's Health" },
  { slug: 'bph', title: 'Benign Prostatic Hyperplasia', subtitle: 'Tamsulosin', category: "Men's Health" },

  // Women's Health
  { slug: 'emergency-contraception', title: 'Emergency Contraception', subtitle: 'Levonorgestrel / Ulipristal', category: "Women's Health" },
  { slug: 'postnatal-contraception', title: 'Postnatal Contraception', subtitle: 'Desogestrel', category: "Women's Health" },
  { slug: 'hrt', title: 'HRT', subtitle: 'Estradiol / Utrogestan', category: "Women's Health" },
  { slug: 'thrush', title: 'Vaginal Thrush', subtitle: 'Fluconazole', category: "Women's Health" },
  { slug: 'period-delay', title: 'Period Delay', subtitle: 'Norethisterone 5mg', category: "Women's Health" },
  { slug: 'bv', title: 'Bacterial Vaginosis', subtitle: 'Metronidazole', category: "Women's Health" },
  { slug: 'testosterone-women', title: 'Testosterone for Women', subtitle: 'Androfeme / Testogel (off-label)', category: "Women's Health" },
  { slug: 'alopecia-minoxidil', title: 'Female Pattern Hair Loss', subtitle: 'Minoxidil', category: "Women's Health" },

  // Sexual Health
  { slug: 'sti-testing', title: 'STI Testing', subtitle: 'Chlamydia / Gonorrhoea / Syphilis / HIV', category: 'Sexual Health' },
  { slug: 'genital-warts', title: 'Genital Warts', subtitle: 'Imiquimod / Podophyllotoxin', category: 'Sexual Health' },
  { slug: 'herpes-management', title: 'Genital Herpes', subtitle: 'Valaciclovir', category: 'Sexual Health' },
  { slug: 'prep', title: 'PrEP', subtitle: 'Emtricitabine/Tenofovir', category: 'Sexual Health' },
  { slug: 'gonorrhoea-treatment', title: 'Gonorrhoea Treatment', subtitle: 'Ceftriaxone IM', category: 'Sexual Health' },

  // Weight Management
  { slug: 'wegovy', title: 'Wegovy', subtitle: 'Semaglutide 2.4mg', category: 'Weight Management' },
  { slug: 'mounjaro', title: 'Mounjaro', subtitle: 'Tirzepatide', category: 'Weight Management' },
  { slug: 'wegovy-oral', title: 'Wegovy Tablets (Oral Semaglutide)', subtitle: 'UK-licensed weight management — 1.5/4/9/25 mg once daily, empty-stomach dosing', category: 'Weight Management' },
  { slug: 'saxenda', title: 'Saxenda', subtitle: 'Liraglutide 3.0mg', category: 'Weight Management' },
  { slug: 'mysimba', title: 'Mysimba', subtitle: 'Naltrexone/Bupropion', category: 'Weight Management' },
  { slug: 'orlistat', title: 'Orlistat', subtitle: 'Orlistat 120mg', category: 'Weight Management' },
  { slug: 'foundayo', title: 'Foundayo (Orforglipron) Tablets', subtitle: 'Once-daily oral GLP-1, no food or timing restrictions', category: 'Weight Management' },
  { slug: 'glp1-monitoring', title: 'GLP-1 Monitoring', subtitle: 'Ongoing Monitoring', category: 'Weight Management' },

  // Skin
  { slug: 'acne', title: 'Acne', subtitle: 'Adapalene / Lymecycline', category: 'Skin' },
  // Built from the PPH-signed PGD (J. Wilkins), 29 Jul 2026 — assigned to
  // PPH only via migration 036; no GRH master document yet.
  { slug: 'skin-infection', title: 'Skin Infection', subtitle: 'Flucloxacillin / Clarithromycin / Doxycycline', category: 'Skin' },
  { slug: 'cellulitis', title: 'Cellulitis', subtitle: 'Flucloxacillin / Clarithromycin / Doxycycline', category: 'Skin' },
  { slug: 'fungal-infection', title: 'Fungal Skin Infection', subtitle: 'Miconazole / Trimovate', category: 'Skin' },
  { slug: 'psoriasis', title: 'Psoriasis', subtitle: 'Calcipotriol / Betamethasone', category: 'Skin' },
  { slug: 'period-pain', title: 'Period Pain', subtitle: "Naproxen / Mefenamic Acid", category: "Women's Health" },
  { slug: 'rosacea', title: 'Rosacea', subtitle: 'Ivermectin / Doxycycline', category: 'Skin' },
  { slug: 'eczema', title: 'Eczema', subtitle: 'Betamethasone / Elidel', category: 'Skin' },
  { slug: 'impetigo', title: 'Impetigo', subtitle: 'Fusidic Acid / Flucloxacillin', category: 'Skin' },
  { slug: 'cold-sores', title: 'Cold Sores', subtitle: 'Valaciclovir', category: 'Skin' },
  { slug: 'shingles-treatment', title: 'Shingles Treatment', subtitle: 'Valaciclovir', category: 'Skin' },
  { slug: 'wound-care', title: 'Wound Care', subtitle: 'Assessment & Dressing', category: 'Skin' },

  // Acute & Infection
  { slug: 'uti', title: 'Uncomplicated UTI', subtitle: 'Nitrofurantoin / Trimethoprim', category: 'Acute & Infection' },
  { slug: 'sore-throat', title: 'Acute Sore Throat', subtitle: 'Phenoxymethylpenicillin', category: 'Acute & Infection' },
  { slug: 'ear-infection', title: 'Acute Otitis Media', subtitle: 'Amoxicillin', category: 'Acute & Infection' },
  // eye-infections removed from public catalogue — chloramphenicol OTC (Apr 2026)
  { slug: 'threadworms', title: 'Threadworms', subtitle: 'Mebendazole', category: 'Acute & Infection' },
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
  { slug: 'hypertension', title: 'Hypertension Monitoring', subtitle: 'Ambulatory BP Monitoring', category: 'Cardiovascular' },
  { slug: 'statins', title: 'Statins', subtitle: 'Atorvastatin', category: 'Cardiovascular' },
  { slug: 'diabetes-monitoring', title: 'Diabetes Monitoring', subtitle: 'HbA1c & Review', category: 'Cardiovascular' },

  // Mental Health & Wellbeing
  { slug: 'smoking-varenicline', title: 'Smoking Cessation (Varenicline)', subtitle: 'Champix', category: 'Mental Health & Wellbeing' },
  { slug: 'sleep-melatonin', title: 'Sleep (Melatonin)', subtitle: 'Circadin / Melatonin', category: 'Mental Health & Wellbeing' },
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
  { slug: 'hpv', title: 'HPV Vaccine', subtitle: 'Gardasil 9', category: 'Vaccines' },
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
export const WITHDRAWN_SLUGS = new Set([
  // Mebendazole suspension stated as 5mg/mL. UK product is 100mg/5mL, i.e.
  // 20mg/mL, so the stated 20mL dose is 400mg, four times intended, in a
  // predominantly paediatric service. Withdrawn 7 Sep 2026.
  'threadworms',
  // Only the adult Malarone tablet (atovaquone 250mg/proguanil 100mg) is
  // named, and it is authorised from 11kg. An 11-20kg child needs ONE
  // RESTORED 7 Sep 2026 at v002, which carries full weight bands
  // (11-20kg one paediatric 62.5/25mg tablet, 21-30kg two, 31-40kg three,
  // adult tablet above 40kg only) and worked quantity examples including the
  // post-travel tail. The ePGD tool still collects no weight, so it now hard
  // stops on anyone under 18 and tells the pharmacist to work from Appendix 1
  // of the PGD instead. Remove that stop when the tool captures weight.
  // Withdrawn on a legal basis rather than a clinical one, 7 Sep 2026.
  // Arm 2 supplies "Melatonin 1mg, 3mg, 5mg tablets (unlicensed preparations)".
  // The Human Medicines Regulations 2012 do not permit an unlicensed medicine
  // to be supplied under a PGD at all, so that arm has never had a lawful
  // basis and cannot be fixed by editing: it needs a licensed product.
  // Arm 1 supplies Circadin and states it is indicated "in patients aged 18
  // years and over". Circadin is licensed for patients aged 55 or over.
  // Off-label supply under a PGD is permitted where clearly stated and
  // justified; this arm instead asserts a licence it does not have, so every
  // patient aged 18 to 54 was supplied off-label without being told.
  'sleep-melatonin',
  // Withdrawn 7 Sep 2026 on legal grounds. Methylphenidate (Concerta XL /
  // Equasym XL) is a Schedule 2 controlled drug.
  //
  // NHS Specialist Pharmacy Service, "Supply and/or administration of
  // Controlled Drugs under a PGD", updated 1 July 2026: "Unless listed below a
  // CD cannot be administered or supplied under a PGD." The Schedule 2 list is
  // morphine and diamorphine (registered nurses and pharmacists only, for the
  // immediate necessary treatment of a sick or injured person, not for
  // addiction) and ketamine. Methylphenidate is not on it.
  //
  // So no PGD can lawfully supply methylphenidate, by any staff group. This is
  // not the pharmacy-technician point raised earlier the same day; that was a
  // narrower defect and the correction notice issued for it wrongly implied
  // the rest of the document remained in force. It did not. The instrument
  // itself cannot carry this medicine.
  //
  // The document also states its own legal category as "POM (Prescription Only
  // Medicine), Schedule 2 Controlled Drug", so the fact was on its face
  // throughout.
  'adhd-monitoring',
  // Withdrawn 7 Sep 2026 on Nitin's instruction, "safety first", while the
  // legal position is confirmed. REVERSIBLE: if testosterone turns out to be
  // permitted under a PGD, remove these two lines and re-approve.
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
  // the question is with a human authority. Pending that answer the service is
  // paused rather than run on a disputed basis.
  'trt',
  'testosterone-women',
  // Withdrawn 7 Sep 2026 on Chris Pilkington's ruling, with Nitin present.
  // Not because of the medicine, but because of the model.
  //
  // A PGD supplies a defined product to a defined group without individual
  // prescriber assessment. Each of these authorises indefinite supply with
  // individual titration and the interpretation of laboratory results, which
  // is ongoing management of a long-term condition and not what the
  // instrument is for.
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
  // REVERSIBLE if these services are rebuilt on a prescriber model (a
  // prescription or Patient Specific Direction), which keeps the consultation
  // tooling and changes only the legal mechanism at the point of supply.
  //
  // PrEP carries continuity language in its notice. Stopping HIV pre-exposure
  // prophylaxis abruptly leaves people exposed, so pharmacies are told to
  // arrange onward supply through a sexual health service rather than simply
  // stopping.
  'statins',
  'hypertension',
  'diabetes-monitoring',
  'prep',
  'glp1-monitoring',
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
  tostran: ['trt'],
  testogel: ['trt'],
  sustanon: ['trt'],
  nebido: ['trt'],
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
  'dental-bridging': { version: 'v002', date: '7 September 2026' },
  'meningitis-acwy-travel': { version: 'v002', date: '7 September 2026' },
  'anti-malarials': { version: 'v002', date: '7 September 2026' },
  typhoid: { version: 'v002', date: '7 September 2026' },
  eczema: { version: 'v002', date: '7 September 2026' },
  'chest-service': { version: 'v002', date: '7 September 2026' },
  'skin-infection': { version: 'v002', date: '7 September 2026' },
  'wound-care': { version: 'v002', date: '7 September 2026' },
  // COVID: v003 named "Comirnaty JN.1" in its operative vaccines table while
  // its own summary page said the 2026/27 formulation was XFG. No pharmacy
  // held JN.1. v004 names Comirnaty XFG as the vaccine of choice and adds
  // Comirnaty LP.8.1 as an existing-stock-only arm for the changeover.
  'covid-booster': { version: 'v004', date: '8 September 2026' },
  uti: { version: 'v002', date: '8 September 2026' },
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
