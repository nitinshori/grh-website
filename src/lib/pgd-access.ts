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
  { slug: 'recurrent-uti', title: 'Recurrent UTI Prevention', subtitle: 'Nitrofurantoin Prophylaxis', category: "Women's Health" },
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
  { slug: 'alcohol-reduction', title: 'Alcohol Reduction', subtitle: 'Nalmefene', category: 'Mental Health & Wellbeing' },
  { slug: 'sleep-melatonin', title: 'Sleep (Melatonin)', subtitle: 'Circadin / Melatonin', category: 'Mental Health & Wellbeing' },
  // adhd-monitoring removed from public catalogue — clinical review (Apr 2026)
  { slug: 'anxiety-propranolol', title: 'Situational Anxiety', subtitle: 'Propranolol', category: 'Mental Health & Wellbeing' },
  { slug: 'hayfever', title: 'Hayfever (Severe)', subtitle: 'Fexofenadine / Mometasone', category: 'Mental Health & Wellbeing' },
  { slug: 'b12-injection', title: 'Vitamin B12 Injection', subtitle: 'Hydroxocobalamin (B12 Deficiency)', category: 'Mental Health & Wellbeing' },

  // Vaccines
  { slug: 'flu', title: 'Flu Vaccination', subtitle: 'Seasonal Influenza', category: 'Vaccines' },
  { slug: 'covid-booster', title: 'COVID-19 Booster', subtitle: 'mRNA / Protein Subunit', category: 'Vaccines' },
  { slug: 'shingles-vaccine', title: 'Shingles Vaccine', subtitle: 'Shingrix', category: 'Vaccines' },
  { slug: 'pneumococcal', title: 'Pneumococcal Vaccine', subtitle: 'PCV20 (Prevenar 20)', category: 'Vaccines' },
  { slug: 'hpv', title: 'HPV Vaccine', subtitle: 'Gardasil 9', category: 'Vaccines' },
  { slug: 'mmr', title: 'MMR Vaccine', subtitle: 'Measles, Mumps, Rubella', category: 'Vaccines' },
  { slug: 'meningitis-b', title: 'Meningitis B', subtitle: 'Bexsero', category: 'Vaccines' },
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
  { slug: 'paediatric-uti', title: 'Paediatric UTI', subtitle: 'Trimethoprim / Nitrofurantoin', category: 'Paediatrics' },
]

/**
 * PGD slugs where the ePGD tool is still "Coming Soon" (placeholder page only).
 */
export const COMING_SOON_SLUGS = new Set([
  'trt',
  'genital-warts',
  'herpes-management',
  'gonorrhoea-treatment',
  'saxenda',
  'mysimba',
  'glp1-monitoring',
])

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
