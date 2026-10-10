// Service-coverage comparison: GRH vs NHS Pharmacy First (England),
// NHS Pharmacy First Scotland, and NHS Wales Common Ailments / Choose
// Pharmacy / Independent Prescribing Service.
//
// Used by the public /services/comparison page and the downloadable PDF.
// Sources (all reviewed October 2026; re-verify quarterly):
//   - Pharmacy First (England): NHS BSA / Community Pharmacy England (formerly PSNC) service spec, Jan 2024
// GRH drug lists are aligned with the medicines named in the current signed
// master PGD documents (src/lib/pgd-document-manifest.ts).
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
        grhDrugs: "Sildenafil, tadalafil",
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
        pgdSlug: "bph",
        condition: "Benign prostatic hyperplasia (BPH)",
        grhDrugs: "Tamsulosin 400 mcg MR",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "sti-testing",
        condition: "STI testing and chlamydia treatment",
        grhDrugs: "NAAT testing; doxycycline or azithromycin for chlamydia",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "gonorrhoea-treatment",
        condition: "Gonorrhoea treatment (GRH: coming soon)",
        grhOffered: false,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "herpes-management",
        condition: "Genital herpes (GRH: coming soon)",
        grhOffered: false,
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
    ],
  },

  // ── Women's Health ─────────────────────────────────────────────
  {
    category: "Women's Health",
    rows: [
      {
        pgdSlug: "uti",
        condition: "Uncomplicated UTI (women)",
        grhDrugs: "Nitrofurantoin, trimethoprim",
        grhOffered: true,
        pfe: YES("Women aged 16–64; nitrofurantoin only"),
        pfs: YES("Women 12+; trimethoprim or nitrofurantoin"),
        wales: YES("Women aged 16+; nitrofurantoin"),
      },
      {
        pgdSlug: "thrush",
        condition: "Vaginal thrush — single-agent",
        grhDrugs: "Fluconazole 150 mg or clotrimazole 500 mg pessary",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      // thrush-combi and thrush-duo rows removed 11 Sep 2026: the signed PGD has no cream.
      {
        pgdSlug: "bv",
        condition: "Bacterial vaginosis",
        grhDrugs: "Metronidazole oral or 0.75% vaginal gel",
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
        pgdSlug: "period-pain",
        condition: "Period pain (primary dysmenorrhoea)",
        grhDrugs: "Naproxen, mefenamic acid",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "postnatal-contraception",
        condition: "Postnatal contraception",
        grhDrugs: "Desogestrel (POP), medroxyprogesterone acetate injection",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
    ],
  },

  // ── Weight Management ──────────────────────────────────────────
  // wegovy-oral (Wegovy tablets, oral semaglutide 1.5 to 25 mg) became
  // UK-licensed in June 2026.
  {
    category: "Weight Management",
    rows: [
      {
        pgdSlug: "wegovy",
        condition: "Wegovy (semaglutide)",
        grhDrugs: "Semaglutide 0.25 to 2.4 mg weekly; 7.2 mg where the starting BMI was 30 or above",
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
        pgdSlug: "wegovy-oral",
        condition: "Wegovy tablets (oral semaglutide)",
        grhDrugs: "Semaglutide 1.5, 4, 9 and 25 mg tablets once daily",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "foundayo",
        condition: "Foundayo (orforglipron)",
        grhDrugs: "Orforglipron tablets once daily",
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
        grhDrugs: "Orlistat 120 mg with meals",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "mysimba",
        condition: "Mysimba (naltrexone/bupropion)",
        grhDrugs: "Naltrexone 8 mg / bupropion 90 mg prolonged-release, titrated",
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
        grhDrugs: "Adapalene with benzoyl peroxide gel; clindamycin with benzoyl peroxide gel (Duac)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        pgdSlug: "rosacea",
        condition: "Rosacea (papulopustular)",
        grhDrugs: "Metronidazole 0.75% gel or azelaic acid 15% gel",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "eczema",
        condition: "Eczema / dermatitis (mild–moderate)",
        grhDrugs: "Clobetasone butyrate 0.05%, betamethasone valerate 0.1%",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        pgdSlug: "cold-sores",
        condition: "Cold sores (HSV labialis)",
        grhDrugs: "Aciclovir 5% cream, aciclovir 200 mg tablets",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: YES("Free OTC supply"),
      },
      {
        pgdSlug: "impetigo",
        condition: "Impetigo (non-bullous)",
        grhDrugs: "Fusidic acid 2% cream; oral flucloxacillin; clarithromycin (erythromycin in pregnancy) if penicillin-allergic",
        grhOffered: true,
        pfe: YES("All ages 1+"),
        pfs: YES("All ages"),
        wales: YES("Independent Prescribing Service (IPS)"),
      },
      {
        pgdSlug: "wound-care",
        condition: "Infected wounds and bites",
        grhDrugs: "Co-amoxiclav (bites, heavily contaminated wounds), flucloxacillin (non-bite wounds)",
        grhOffered: true,
        pfe: YES("Infected insect bites only"),
        pfs: YES("Skin infections via PFP"),
        wales: NO,
      },
      {
        pgdSlug: "cellulitis",
        condition: "Cellulitis (adults)",
        grhDrugs: "Flucloxacillin; clarithromycin or doxycycline if flucloxacillin is unsuitable",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "skin-infection",
        condition: "Bacterial skin infection (impetigo, folliculitis, infected eczema)",
        grhDrugs: "Flucloxacillin; clarithromycin or doxycycline if flucloxacillin is unsuitable",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "psoriasis",
        condition: "Stable plaque psoriasis",
        grhDrugs: "Calcipotriol with betamethasone (Dovobet, Enstilar)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      // alopecia-minoxidil row removed 11 Sep 2026: no minoxidil PGD exists.
      // Topical minoxidil removed from the hair-loss row 10 Oct 2026: the
      // hair-loss PGD authorises finasteride only.
      {
        pgdSlug: "hair-loss",
        condition: "Male pattern hair loss",
        grhDrugs: "Finasteride 1 mg",
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
        pgdSlug: "fungal-infection",
        condition: "Ringworm / fungal skin infection",
        grhDrugs: "Miconazole 2% cream; Trimovate cream for inflamed intertrigo or infected eczema",
        grhOffered: true,
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
        // Not offered by GRH: no valid signed ear PGD (10 Oct 2026).
        condition: "Acute otitis media (ear infection)",
        grhOffered: false,
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
        pgdSlug: "hayfever",
        condition: "Hayfever / allergic rhinitis",
        grhDrugs: "Fexofenadine 120 mg; Dymista nasal spray (azelastine with fluticasone)",
        grhOffered: true,
        pfe: NO,
        pfs: YES("Pharmacy First Plus pathway"),
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
        grhDrugs: "2026/27 trivalent inactivated vaccines (IIVe, IIVc, aIIV, IIVr), private",
        grhOffered: true,
        pfe: YES("NHS scheme via separate service spec"),
        pfs: YES("NHS scheme"),
        wales: YES("NHS scheme"),
      },
      {
        pgdSlug: "covid-booster",
        condition: "COVID-19 booster",
        grhDrugs: "Comirnaty or Spikevax (mRNA), Nuvaxovid (protein), private",
        grhOffered: true,
        pfe: YES("NHS for eligible cohorts"),
        pfs: YES("NHS for eligible cohorts"),
        wales: YES("NHS for eligible cohorts"),
      },
      {
        pgdSlug: "shingles-vaccine",
        condition: "Shingrix (shingles vaccine)",
        grhDrugs: "Shingrix (recombinant zoster vaccine), private",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "pneumococcal",
        condition: "Pneumococcal vaccine",
        grhDrugs: "Prevenar 20 (PCV20) / Pneumovax 23, private",
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
        grhDrugs: "MMRVaxPRO / Priorix",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "chickenpox",
        condition: "Varicella (chickenpox)",
        grhDrugs: "Varivax / Varilrix",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "meningitis-b",
        condition: "Meningitis B",
        grhDrugs: "Bexsero / Trumenba",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "hep-b-occupational",
        condition: "Hepatitis B (occupational)",
        grhDrugs: "Engerix B",
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
        condition: "Travel health core (hepatitis A, typhoid, cholera)",
        grhDrugs: "Havrix / Avaxim, Typhim Vi, Dukoral (oral cholera)",
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
        grhDrugs: "Rabipur / Verorab",
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
        grhDrugs: "Typhim Vi (Vi polysaccharide, injectable)",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "dengue",
        condition: "Dengue vaccine",
        grhDrugs: "Qdenga, adults 18 and over",
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
        grhDrugs: "Standby azithromycin",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "hep-ab-travel",
        condition: "Hepatitis A and B (travel and lifestyle)",
        grhDrugs: "Havrix, Avaxim, Engerix B, Twinrix",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "tetanus",
        condition: "Tetanus, diphtheria and polio booster",
        grhDrugs: "Revaxis (Td/IPV), 10 years and over",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "junior-travel",
        condition: "Junior travel vaccines (12 months to 17 years)",
        grhDrugs: "Paediatric hepatitis A, hepatitis A and B, typhoid, MenACWY, rabies, Japanese encephalitis and cholera vaccines",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
    ],
  },

  // ── Respiratory ───────────────────────────────────────────────
  {
    category: "Respiratory",
    rows: [
      {
        pgdSlug: "asthma-rescue",
        condition: "Asthma rescue (salbutamol)",
        grhDrugs: "Salbutamol 100 mcg inhaler; prednisolone 5 mg tablets for an acute exacerbation",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "copd",
        condition: "COPD rescue inhaler supply",
        grhDrugs: "Salbutamol 100 mcg rescue inhaler; amoxicillin 500 mg for an infective exacerbation",
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
        grhDrugs: "Propranolol 10 mg tablets, 10 to 40 mg before the event",
        grhOffered: true,
        pfe: NO,
        pfs: NO,
        wales: NO,
      },
      {
        pgdSlug: "sleep-melatonin",
        condition: "Primary insomnia, adults 55 and over",
        grhDrugs: "Circadin 2 mg prolonged-release (melatonin)",
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
        grhDrugs: "Nicotine patches, gum, lozenges",
        grhOffered: true,
        pfe: YES("NHS scheme"),
        pfs: YES("NHS Smoking Cessation"),
        wales: YES("NHS Help Me Quit"),
      },
      {
        // Withdrawn 21 Aug 2026. The service had a naltrexone document behind
        // a nalmefene tool and no pharmacy was using it. Kept in the
        // comparison table as not offered, because the table's purpose is to
        // show honestly what we do and do not cover.
        condition: "Alcohol reduction / dependence",
        grhDrugs: "Not offered",
        grhOffered: false,
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
        // Withdrawn 26 Aug 2026. Assigned to six pharmacies and never used
        // once: zero consultation records against the slug. Kept in the
        // comparison table as not offered, on the same reasoning as
        // alcohol-reduction above.
        condition: "Paediatric UTI",
        grhDrugs: "Not offered",
        grhOffered: false,
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
        grhDrugs: "Aciclovir, valaciclovir, famciclovir",
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
