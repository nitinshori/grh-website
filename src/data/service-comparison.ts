// Service-coverage comparison: GRH vs NHS Pharmacy First (England),
// NHS Pharmacy First Scotland, and NHS Wales Common Ailments / Choose
// Pharmacy / Independent Prescribing Service.
//
// Used by the public /services/comparison page and the downloadable PDF.
// Sources (all reviewed May 2026 — re-verify quarterly):
//   - Pharmacy First (England): NHS BSA / PSNC service spec, Jan 2024
//   - Pharmacy First Scotland & Pharmacy First Plus: NHS Scotland CMS
//   - Common Ailments / Choose Pharmacy / Welsh IPS: NHS Wales

export interface SchemeCoverage {
  /** True if the scheme covers the condition. */
  offered: boolean;
  /** Optional drug list or scope notes (e.g. "OTC only", "IP only"). */
  notes?: string;
}

export interface ServiceComparisonRow {
  /** GRH PGD slug, when applicable, for in-app linking. */
  pgdSlug?: string;
  /** Display name of the condition / service. */
  condition: string;
  /** Drugs / interventions GRH covers under this PGD. */
  grhDrugs?: string;
  /** True if GRH offers it. */
  grhOffered: boolean;
  /** GRH-specific notes (e.g. "private only — paid"). */
  grhNotes?: string;
  /** England Pharmacy First. */
  pfe: SchemeCoverage;
  /** Scotland Pharmacy First / Pharmacy First Plus. */
  pfs: SchemeCoverage;
  /** Welsh Common Ailment Service / Choose Pharmacy / IPS. */
  wales: SchemeCoverage;
}

export interface ServiceComparisonCategory {
  category: string;
  rows: ServiceComparisonRow[];
}

const NO: SchemeCoverage = { offered: false };
const YES = (notes?: string): SchemeCoverage => ({ offered: true, notes });

export const SERVICE_COMPARISON: ServiceComparisonCategory[] = [
  // ── Sexual Health ──────────────────────────────────────────────
  {
    category: "Sexual Health & Men's Health",
    rows: [
      {
        pgdSlug: "ed",
        condition: "Erectile dysfunction",
        grhDrugs: "Sildenafil, tadalafil, vardenafil, avanafil, alprostadil cream (Vitaros)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "premature-ejaculation",
        condition: "Premature ejaculation",
        grhDrugs: "Dapoxetine (Priligy)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "trt",
        condition: "Testosterone replacement therapy",
        grhDrugs: "Testosterone undecanoate (Nebido)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "bph",
        condition: "Benign prostatic hyperplasia (BPH)",
        grhDrugs: "Tamsulosin, finasteride",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "sti-testing",
        condition: "STI screening / testing",
        grhDrugs: "Postal NAAT test kits + clinical assessment",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "gonorrhoea-treatment",
        condition: "Gonorrhoea treatment",
        grhDrugs: "Ceftriaxone IM (with sexual health pathway)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "herpes-management",
        condition: "Genital herpes",
        grhDrugs: "Aciclovir, valaciclovir",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "genital-warts",
        condition: "Genital warts",
        grhDrugs: "Podophyllotoxin, imiquimod",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "prep",
        condition: "HIV PrEP",
        grhDrugs: "Tenofovir / emtricitabine",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
    ],
  },

  // ── Women's Health ─────────────────────────────────────────────
  {
    category: "Women's Health",
    rows: [
      {
        pgdSlug: "uti",
        condition: "Uncomplicated UTI (women)",
        grhDrugs: "Nitrofurantoin, trimethoprim, fosfomycin",
        grhOffered: true,
        pfe: YES("Women aged 16–64; nitrofurantoin only"),
        pfs: YES("Women 12+; trimethoprim or nitrofurantoin"),
        wales: YES("Women aged 16+; nitrofurantoin"),
      },
      {
        pgdSlug: "recurrent-uti",
        condition: "Recurrent UTI prophylaxis",
        grhDrugs: "Low-dose nitrofurantoin / trimethoprim, methenamine, D-mannose pathway",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "thrush",
        condition: "Vaginal thrush — single-agent",
        grhDrugs: "Fluconazole 150mg OR clotrimazole pessary",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        pgdSlug: "thrush-combi",
        condition: "Vaginal thrush — combo (pessary + cream)",
        grhDrugs: "Generic clotrimazole 500mg pessary + clotrimazole 1% external cream",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "thrush-duo",
        condition: "Vaginal thrush — duo (oral + cream)",
        grhDrugs: "Generic fluconazole 150mg + clotrimazole 1% external cream",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "bv",
        condition: "Bacterial vaginosis",
        grhDrugs: "Metronidazole oral or vaginal gel",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "emergency-contraception",
        condition: "Emergency contraception",
        grhDrugs: "Levonorgestrel, ulipristal acetate",
        grhOffered: true,
        pfe: NO,
        pfs: YES("Free supply"),
        wales: NO,
      },
      {
        pgdSlug: "period-delay",
        condition: "Period delay (norethisterone)",
        grhDrugs: "Norethisterone 5mg",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "postnatal-contraception",
        condition: "Postnatal contraception",
        grhDrugs: "POP, COC supply with contraceptive consult",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "hrt",
        condition: "Menopause hormone replacement",
        grhDrugs: "Estradiol patches/gel, micronised progesterone, tibolone",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "testosterone-women",
        condition: "Testosterone for women (low libido)",
        grhDrugs: "Testosterone gel (off-label private)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
    ],
  },

  // ── Weight Management ──────────────────────────────────────────
  // wegovy-oral (Wegovy tablets, oral semaglutide 1.5–25 mg) became UK-licensed
  // in June 2026 and can now be advertised externally. The previous
  // restriction (off-label pilot framing) has been removed from the
  // catalogue entry and access registry.
  {
    category: "Weight Management",
    rows: [
      {
        pgdSlug: "wegovy",
        condition: "Wegovy (semaglutide)",
        grhDrugs: "Semaglutide 0.25–7.2 mg weekly (incl. 7.2 mg high-dose)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "mounjaro",
        condition: "Mounjaro (tirzepatide)",
        grhDrugs: "Tirzepatide 2.5–15 mg weekly",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "saxenda",
        condition: "Saxenda (liraglutide)",
        grhDrugs: "Liraglutide 0.6–3.0 mg daily",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "orlistat",
        condition: "Orlistat (Xenical / Alli)",
        grhDrugs: "Orlistat 60–120 mg with meals",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "mysimba",
        condition: "Mysimba (naltrexone/bupropion)",
        grhDrugs: "Naltrexone 8 mg / bupropion 90 mg titration",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "glp1-monitoring",
        condition: "GLP-1 / GIP monitoring & follow-up",
        grhDrugs: "Repeat supply, BP/weight/HbA1c review",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
    ],
  },

  // ── Skin / Dermatology ────────────────────────────────────────
  {
    category: "Skin & Dermatology",
    rows: [
      {
        pgdSlug: "acne",
        condition: "Acne vulgaris (mild–moderate)",
        grhDrugs: "Topical adapalene + benzoyl peroxide; clindamycin / adapalene combinations; oral lymecycline",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        pgdSlug: "rosacea",
        condition: "Rosacea (papulopustular)",
        grhDrugs: "Topical metronidazole or azelaic acid",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "eczema",
        condition: "Eczema / dermatitis (mild–moderate)",
        grhDrugs: "Emollients, topical hydrocortisone, clobetasone, betamethasone",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        pgdSlug: "cold-sores",
        condition: "Cold sores (HSV labialis)",
        grhDrugs: "Aciclovir 5% cream, oral aciclovir",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        pgdSlug: "impetigo",
        condition: "Impetigo (non-bullous)",
        grhDrugs: "Topical fusidic acid; hydrogen peroxide; oral flucloxacillin",
        grhOffered: true,
        pfe: YES("All ages 1+"),
        pfs: YES("All ages"),
        wales: YES("Independent Prescribing Service (IPS)"),
      },
      {
        pgdSlug: "wound-care",
        condition: "Wound infection (cellulitis, infected bite)",
        grhDrugs: "Flucloxacillin, clarithromycin, doxycycline",
        grhOffered: true,
        pfe: YES("Infected insect bites only"),
        pfs: YES("Skin infections via PFP"),
        wales: NO,
      },
      {
        pgdSlug: "alopecia-minoxidil",
        condition: "Alopecia — oral minoxidil (off-label)",
        grhDrugs: "Oral minoxidil 0.25–5 mg",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "hair-loss",
        condition: "Hair loss (androgenetic)",
        grhDrugs: "Finasteride 1 mg, topical minoxidil",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        // No GRH PGD currently — Welsh CAS only
        condition: "Athlete's foot",
        grhOffered: false,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Ringworm / fungal skin infection",
        grhOffered: false,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Scabies",
        grhOffered: false,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Verrucae / warts",
        grhOffered: false,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Head lice",
        grhOffered: false,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
    ],
  },

  // ── Acute & Infection ─────────────────────────────────────────
  {
    category: "Acute & Infection",
    rows: [
      {
        pgdSlug: "sore-throat",
        condition: "Acute sore throat / pharyngitis",
        grhDrugs: "Phenoxymethylpenicillin, clarithromycin",
        grhOffered: true,
        pfe: YES("Age 5+, FeverPAIN ≥4"),
        pfs: YES("Pharmacy First service"),
        wales: YES("Free OTC supply"),
      },
      {
        pgdSlug: "ear-infection",
        condition: "Acute otitis media (ear infection)",
        grhDrugs: "Amoxicillin, clarithromycin",
        grhOffered: true,
        pfe: YES("Age 1–17"),
        pfs: YES("Pharmacy First service"),
        wales: YES("Free OTC pain relief"),
      },
      {
        // No GRH PGD — PFE / PFS only
        condition: "Acute sinusitis",
        grhOffered: false,
        pfe: YES("Age 12+; phenoxymethylpenicillin"),
        pfs: NO,
        wales: NO,
      },
      {
        condition: "Shingles (herpes zoster)",
        grhDrugs: "Aciclovir, valaciclovir (would be added under future PGD)",
        grhOffered: false,
        grhNotes: "Roadmap",
        pfe: YES("Age 18+; aciclovir"),
        pfs: YES("Pharmacy First service"),
        wales: NO,
      },
      {
        pgdSlug: "hayfever",
        condition: "Hayfever / allergic rhinitis",
        grhDrugs: "Cetirizine, loratadine, fexofenadine, intranasal steroids, montelukast",
        grhOffered: true,
        pfe: NO,
        pfs: YES("Pharmacy First Plus pathway"),
        wales: YES("Free OTC supply"),
      },
      {
        pgdSlug: "threadworms",
        condition: "Threadworms",
        grhDrugs: "Mebendazole",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Conjunctivitis (bacterial)",
        grhOffered: false,
        pfe: NO,
        pfs: YES("Eye infections via PFP"),
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Constipation",
        grhOffered: false,
        pfe: NO,
        pfs: YES("Pharmacy First service"),
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Diarrhoea",
        grhOffered: false,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Dyspepsia / heartburn",
        grhOffered: false,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Mouth ulcers",
        grhOffered: false,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        condition: "Headache / migraine",
        grhOffered: false,
        pfe: NO,
        pfs: YES("Pharmacy First service"),
        wales: YES("Free OTC supply"),
      },
    ],
  },

  // ── Vaccines ──────────────────────────────────────────────────
  {
    category: "Vaccines",
    rows: [
      {
        pgdSlug: "flu",
        condition: "Seasonal influenza",
        grhDrugs: "QIV, aQIV (over-65)",
        grhOffered: true,
        pfe: YES("NHS scheme via separate service spec"),
        pfs: YES("NHS scheme"),
        wales: YES("NHS scheme"),
      },
      {
        pgdSlug: "covid-booster",
        condition: "COVID-19 booster",
        grhDrugs: "Pfizer/Moderna mRNA (eligible cohorts) + private",
        grhOffered: true,
        pfe: YES("NHS for eligible cohorts"),
        pfs: YES("NHS for eligible cohorts"),
        wales: YES("NHS for eligible cohorts"),
      },
      {
        pgdSlug: "shingles-vaccine",
        condition: "Shingrix (shingles vaccine)",
        grhDrugs: "Recombinant zoster vaccine — private",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "pneumococcal",
        condition: "Pneumococcal vaccine",
        grhDrugs: "PPV23 / PCV13 — private",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "rsv",
        condition: "RSV vaccine (older adults & pregnancy)",
        grhDrugs: "Abrysvo / Arexvy",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "hpv",
        condition: "HPV vaccine (private)",
        grhDrugs: "Gardasil 9",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "mmr",
        condition: "MMR (private catch-up)",
        grhDrugs: "MMR-VaxPro / Priorix",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "chickenpox",
        condition: "Varicella (chickenpox)",
        grhDrugs: "Varilrix",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "meningitis-b",
        condition: "Meningitis B",
        grhDrugs: "Bexsero",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "hep-b-occupational",
        condition: "Hepatitis B (occupational)",
        grhDrugs: "Engerix-B / Fendrix",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
    ],
  },

  // ── Travel Health ─────────────────────────────────────────────
  {
    category: "Travel Health",
    rows: [
      {
        pgdSlug: "travel-core",
        condition: "Travel core (consultation + risk assessment)",
        grhDrugs: "Multi-vaccine, anti-malarials per itinerary",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "anti-malarials",
        condition: "Anti-malarials",
        grhDrugs: "Atovaquone/proguanil, doxycycline, mefloquine",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "yellow-fever",
        condition: "Yellow fever (designated YFVC only)",
        grhDrugs: "Stamaril (live attenuated)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "rabies",
        condition: "Rabies pre-exposure",
        grhDrugs: "Rabipur",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "japanese-encephalitis",
        condition: "Japanese encephalitis",
        grhDrugs: "Ixiaro",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "meningitis-acwy-travel",
        condition: "Meningitis ACWY (travel / Hajj)",
        grhDrugs: "Nimenrix / Menveo / MenQuadfi",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "typhoid",
        condition: "Typhoid",
        grhDrugs: "Typhim Vi (injectable) / Vivotif (oral)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "dengue",
        condition: "Dengue vaccine",
        grhDrugs: "Qdenga (≥4 yo, prior infection or risk-stratified)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "altitude-sickness",
        condition: "Altitude sickness prophylaxis",
        grhDrugs: "Acetazolamide",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "travellers-diarrhoea",
        condition: "Travellers' diarrhoea",
        grhDrugs: "Standby azithromycin / ciprofloxacin",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
    ],
  },

  // ── Cardiovascular & Long-Term Conditions ────────────────────
  {
    category: "Cardiovascular & Long-Term Conditions",
    rows: [
      {
        pgdSlug: "hypertension",
        condition: "Hypertension treatment & monitoring",
        grhDrugs: "Amlodipine, ramipril, losartan, indapamide (private pathway)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "statins",
        condition: "Cholesterol / statin therapy",
        grhDrugs: "Atorvastatin, rosuvastatin",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "diabetes-monitoring",
        condition: "Type 2 diabetes monitoring (HbA1c)",
        grhDrugs: "Point-of-care testing + lifestyle / referral",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "asthma-rescue",
        condition: "Asthma rescue (salbutamol)",
        grhDrugs: "Salbutamol 100 mcg inhaler",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "copd",
        condition: "COPD inhaler initiation / monitoring",
        grhDrugs: "LAMA / LABA / ICS regimens",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
    ],
  },

  // ── Mental Health / Lifestyle ─────────────────────────────────
  {
    category: "Mental Health & Lifestyle",
    rows: [
      {
        pgdSlug: "anxiety-propranolol",
        condition: "Situational anxiety (propranolol)",
        grhDrugs: "Propranolol 10–40 mg PRN",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "sleep-melatonin",
        condition: "Short-term insomnia / jet lag",
        grhDrugs: "Melatonin 2 mg MR",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "smoking-varenicline",
        condition: "Smoking cessation — varenicline",
        grhDrugs: "Varenicline 0.5–1 mg",
        grhOffered: true,
        pfe: NO,
        pfs: YES("NHS smoking cessation"),
        wales: YES("NHS Help Me Quit"),
      },
      {
        pgdSlug: "smoking-nrt",
        condition: "Smoking cessation — NRT",
        grhDrugs: "Nicotine patches, gum, lozenges, inhalators",
        grhOffered: true,
        pfe: YES("NHS scheme"),
        pfs: YES("NHS Smoking Cessation"),
        wales: YES("NHS Help Me Quit"),
      },
      {
        pgdSlug: "alcohol-reduction",
        condition: "Alcohol reduction / dependence",
        grhDrugs: "Nalmefene (Selincro), thiamine support pathway",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
    ],
  },

  // ── Paediatrics & Other ───────────────────────────────────────
  {
    category: "Paediatrics & Specialist",
    rows: [
      {
        pgdSlug: "paediatric-uti",
        condition: "Paediatric UTI",
        grhDrugs: "Trimethoprim, nitrofurantoin (age-appropriate)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "dental-bridging",
        condition: "Dental pain (antibiotic bridging)",
        grhDrugs: "Amoxicillin, metronidazole",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "shingles-treatment",
        condition: "Shingles treatment",
        grhDrugs: "Aciclovir, valaciclovir, gabapentin for PHN",
        grhOffered: true,
        pfe: YES("Age 18+; aciclovir only"),
        pfs: YES("Pharmacy First service"),
        wales: NO,
      },
    ],
  },
];

/** Counts for the headline tile on the comparison page. */
export function getCoverageCounts() {
  let grh = 0,
    pfe = 0,
    pfs = 0,
    wales = 0,
    total = 0;
  for (const cat of SERVICE_COMPARISON) {
    for (const row of cat.rows) {
      total += 1;
      if (row.grhOffered) grh += 1;
      if (row.pfe.offered) pfe += 1;
      if (row.pfs.offered) pfs += 1;
      if (row.wales.offered) wales += 1;
    }
  }
  return { grh, pfe, pfs, wales, total };
}
