export type PGDCategory =
  | "Travel"
  | "Vaccines"
  | "Weight Management"
  | "Women's Health"
  | "Men's Health"
  | "Sexual Health"
  | "Mental Health"
  | "Skin"
  | "Respiratory"
  | "CVD"
  | "Occupational"
  | "Paediatrics"
  | "Minor Ailments"
;

export type PGDPriority = 1 | 2 | 3;

export interface PGD {
  id: string;
  title: string;
  category: PGDCategory;
  priority: PGDPriority;
  isNew: boolean;
  revenueEstimate: string;
  consultTime: string;
  description: string;
  pharmadoctor: string;
}

export const CATEGORY_COLORS: Record<PGDCategory, string> = {
  Travel: "bg-cat-travel",
  Vaccines: "bg-cat-vaccines",
  "Weight Management": "bg-cat-weight",
  "Women's Health": "bg-cat-womens",
  "Men's Health": "bg-cat-mens",
  "Sexual Health": "bg-cat-sexual",
  "Mental Health": "bg-cat-mental",
  Skin: "bg-cat-skin",
  Respiratory: "bg-cat-respiratory",
  CVD: "bg-cat-cvd",
  Occupational: "bg-cat-occupational",
  Paediatrics: "bg-cat-paediatrics",
  "Minor Ailments": "bg-cat-minor",
};

export const CATEGORY_TEXT_COLORS: Record<PGDCategory, string> = {
  Travel: "text-cat-travel",
  Vaccines: "text-cat-vaccines",
  "Weight Management": "text-cat-weight",
  "Women's Health": "text-cat-womens",
  "Men's Health": "text-cat-mens",
  "Sexual Health": "text-cat-sexual",
  "Mental Health": "text-cat-mental",
  Skin: "text-cat-skin",
  Respiratory: "text-cat-respiratory",
  CVD: "text-cat-cvd",
  Occupational: "text-cat-occupational",
  Paediatrics: "text-cat-paediatrics",
  "Minor Ailments": "text-cat-minor",
};

export const CATEGORY_BG_LIGHT: Record<PGDCategory, string> = {
  Travel: "bg-blue-50",
  Vaccines: "bg-green-50",
  "Weight Management": "bg-orange-50",
  "Women's Health": "bg-pink-50",
  "Men's Health": "bg-purple-50",
  "Sexual Health": "bg-indigo-50",
  "Mental Health": "bg-violet-50",
  Skin: "bg-amber-50",
  Respiratory: "bg-cyan-50",
  CVD: "bg-red-50",
  Occupational: "bg-sky-50",
  Paediatrics: "bg-rose-50",
  "Minor Ailments": "bg-emerald-50",
};

export const ALL_CATEGORIES: PGDCategory[] = [
  "Travel",
  "Vaccines",
  "Weight Management",
  "Women's Health",
  "Men's Health",
  "Sexual Health",
  "Mental Health",
  "Skin",
  "Respiratory",
  "CVD",
  "Occupational",
  "Paediatrics",
  "Minor Ailments",
];

export const pgds: PGD[] = [
  // ═══ TRAVEL ═══
  {
    id: "travel-core",
    title: "Travel Health Core Package",
    category: "Travel",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a3150\u2013300 per patient",
    consultTime: "30\u201345 min",
    description:
      "Typhoid, hepatitis A, diphtheria, polio, tetanus, cholera, yellow fever, hepatitis B. Highest volume PGD service. Average pharmacy earns \u00a346k/yr from travel alone.",
    pharmadoctor: "Yes",
  },
  {
    id: "anti-malarials",
    title: "Anti-malarials",
    category: "Travel",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a340\u201380 per course",
    consultTime: "15\u201320 min",
    description:
      "Malarone, Doxycycline, Lariam. High margin. Prescribe under PGD with pre-travel consultation.",
    pharmadoctor: "Yes",
  },
  {
    id: "dengue",
    title: "Dengue Fever Vaccination (Qdenga)",
    category: "Travel",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a3200\u2013250 per course",
    consultTime: "20 min",
    description:
      "Fast-growing travel vaccine. Two-dose course. Position as standard in your launch portfolio.",
    pharmadoctor: "Yes (added late)",
  },
  {
    id: "rabies",
    title: "Rabies Pre-exposure Vaccination",
    category: "Travel",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a3150\u2013210 per course",
    consultTime: "15\u201320 min",
    description:
      "Three-dose pre-exposure course. Essential for travellers to Southeast Asia, India, Africa, and South America. High-value service with strong patient demand.",
    pharmadoctor: "Yes",
  },
  {
    id: "japanese-encephalitis",
    title: "Japanese Encephalitis Vaccination",
    category: "Travel",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a3100\u2013200 per course",
    consultTime: "15\u201320 min",
    description:
      "Two-dose course for travellers to rural areas of Southeast Asia and the Far East. Specialist vaccine that completes a full travel clinic offering.",
    pharmadoctor: "Yes",
  },
  {
    id: "meningitis-acwy-travel",
    title: "Meningitis ACWY (Travel)",
    category: "Travel",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a340\u201360 per dose",
    consultTime: "15 min",
    description:
      "Required for Hajj/Umrah pilgrimage and recommended for sub-Saharan Africa travel. Single dose. Also popular with university students.",
    pharmadoctor: "Yes",
  },
  {
    id: "altitude-sickness",
    title: "Altitude Sickness (Acetazolamide)",
    category: "Travel",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a330\u201350 per consultation",
    consultTime: "10\u201315 min",
    description:
      "Common travel request, often missed by other providers. Include in your travel package.",
    pharmadoctor: "Partial",
  },
  {
    id: "travellers-diarrhoea",
    title: "Travellers' Diarrhoea",
    category: "Travel",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a325\u201340 per consultation",
    consultTime: "10 min",
    description:
      "Ciprofloxacin and Azithromycin standby packs. High demand, simple consultation, strong margin.",
    pharmadoctor: "Partial",
  },

  // ═══ VACCINES ═══
  {
    id: "flu",
    title: "Private Flu Vaccination",
    category: "Vaccines",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a315\u201325 per dose",
    consultTime: "10 min",
    description:
      "Anchor seasonal service. Volume driver Oct\u2013Jan. Pharmadoctor built 4,000 pharmacist sign-ups on flu alone.",
    pharmadoctor: "Yes",
  },
  {
    id: "pneumococcal",
    title: "Pneumococcal (Prevenar 13/23)",
    category: "Vaccines",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a360\u201390 per dose",
    consultTime: "15 min",
    description:
      "Strong demand in over-65s and immunocompromised. High-value repeat service.",
    pharmadoctor: "Yes",
  },
  {
    id: "rsv",
    title: "RSV Vaccination (Abrysvo / mRESVIA)",
    category: "Vaccines",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a380\u2013120 per dose",
    consultTime: "15 min",
    description:
      "Major growth category. New JCVI recommendations driving demand.",
    pharmadoctor: "Yes",
  },
  {
    id: "shingles-vaccine",
    title: "Shingles (Shingrix)",
    category: "Vaccines",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a3150\u2013200 per course",
    consultTime: "15 min",
    description:
      "High uptake in 50+ private market. NHS only covers up to age 70 \u2014 private fills the gap above that.",
    pharmadoctor: "Yes",
  },
  {
    id: "chickenpox",
    title: "Chickenpox (Varivax / Varilrix)",
    category: "Vaccines",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a360\u201380 per dose",
    consultTime: "15 min",
    description:
      "High parental demand. NHS waiting lists are long \u2014 private fills the gap.",
    pharmadoctor: "Yes",
  },
  {
    id: "mmr",
    title: "MMR Top-up (Private)",
    category: "Vaccines",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a340\u201360 per dose",
    consultTime: "10 min",
    description:
      "Growing demand post-pandemic. Parents seeking private MMR for children.",
    pharmadoctor: "Partial",
  },
  {
    id: "meningitis-b",
    title: "Meningitis B (Bexsero)",
    category: "Vaccines",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a3100\u2013130 per dose",
    consultTime: "15 min",
    description:
      "NHS gives this to under-1s only. Large private demand for older children and adults.",
    pharmadoctor: "Yes",
  },
  {
    id: "hpv",
    title: "HPV (Gardasil 9 \u2014 Private for Adults)",
    category: "Vaccines",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a3150\u2013200 per course",
    consultTime: "15 min",
    description:
      "NHS covers 9\u201325 but adult market (25\u201345) is private and underserved.",
    pharmadoctor: "Partial",
  },
  {
    id: "covid-booster",
    title: "COVID-19 Booster (Private)",
    category: "Vaccines",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a330\u201350 per dose",
    consultTime: "10 min",
    description: "Seasonal demand will continue. Standard offering.",
    pharmadoctor: "Yes",
  },

  // ═══ WEIGHT MANAGEMENT ═══
  {
    id: "wegovy",
    title: "GLP-1 Weight Management (Wegovy / Semaglutide)",
    category: "Weight Management",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a3200\u2013350 per month",
    consultTime: "30 min initial, 15 min follow-up",
    description:
      "Fastest-growing category in UK private pharmacy. Huge patient demand.",
    pharmadoctor: "Yes",
  },
  {
    id: "mounjaro",
    title: "GLP-1 Weight Management (Mounjaro / Tirzepatide)",
    category: "Weight Management",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a3200\u2013350 per month",
    consultTime: "30 min initial, 15 min follow-up",
    description:
      "Must-have service. Do not launch without it.",
    pharmadoctor: "Yes",
  },
  {
    id: "orlistat",
    title: "Orlistat (Xenical)",
    category: "Weight Management",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a330\u201350 per month",
    consultTime: "20 min",
    description:
      "Standard oral weight management. Simple consultation, strong volume.",
    pharmadoctor: "Yes",
  },
  {
    id: "mysimba",
    title: "Naltrexone/Bupropion (Mysimba)",
    category: "Weight Management",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a370\u2013100 per month",
    consultTime: "20 min",
    description:
      "Combination therapy for eligible patients. Good second-line option.",
    pharmadoctor: "Yes",
  },
  {
    id: "saxenda",
    title: "Liraglutide (Saxenda)",
    category: "Weight Management",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a3150\u2013250 per month",
    consultTime: "20 min",
    description: "Older GLP-1 but still prescribed. Include for completeness.",
    pharmadoctor: "Yes",
  },
  {
    id: "glp1-monitoring",
    title: "Ongoing GLP-1 Monitoring & Dose Titration",
    category: "Weight Management",
    priority: 1,
    isNew: true,
    revenueEstimate: "\u00a350\u201380 per review",
    consultTime: "15\u201320 min",
    description:
      "DIFFERENTIATION: Pharmadoctor offers initiation but ongoing monitoring is poorly supported. Monthly review consultations built into the tool.",
    pharmadoctor: "Partial",
  },

  // ═══ WOMEN'S HEALTH ═══
  {
    id: "emergency-contraception",
    title: "Emergency Hormonal Contraception",
    category: "Women's Health",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a325\u201345 per consultation",
    consultTime: "10\u201315 min",
    description:
      "Levonelle and EllaOne. High volume, standard PGD for every pharmacy.",
    pharmadoctor: "Yes",
  },
  {
    id: "hrt",
    title: "HRT Initiation",
    category: "Women's Health",
    priority: 1,
    isNew: true,
    revenueEstimate: "\u00a380\u2013150 per consultation",
    consultTime: "30\u201345 min",
    description:
      "MAJOR GAP. 1 in 3 women in menopause receive no treatment. Pharmacy-based, clinically governed, massive unmet demand. First mover wins.",
    pharmadoctor: "No \u2014 not offered",
  },
  {
    id: "testosterone-women",
    title: "Testosterone for Women (Menopausal Libido)",
    category: "Women's Health",
    priority: 2,
    isNew: true,
    revenueEstimate: "\u00a360\u2013100 per consultation",
    consultTime: "20 min",
    description:
      "DIFFERENTIATION. Growing clinical recognition. NICE-backed. Completely unaddressed by competitors.",
    pharmadoctor: "No",
  },
  {
    id: "uti",
    title: "UTI Treatment",
    category: "Women's Health",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a320\u201340 per consultation",
    consultTime: "10\u201315 min",
    description:
      "Nitrofurantoin and trimethoprim. NHS Pharmacy First covers some \u2014 private version gives greater flexibility.",
    pharmadoctor: "Yes",
  },
  {
    id: "recurrent-uti",
    title: "Recurrent UTI Prevention",
    category: "Women's Health",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a330\u201350 per consultation",
    consultTime: "15 min",
    description:
      "Low-dose nitrofurantoin. Large underserved population cycling through GP appointments.",
    pharmadoctor: "Partial",
  },
  {
    id: "thrush",
    title: "Vaginal Thrush",
    category: "Women's Health",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a315\u201330 per consultation",
    consultTime: "10 min",
    description:
      "Fluconazole oral and clotrimazole. Very high demand, simple consultation.",
    pharmadoctor: "Yes",
  },
  {
    id: "bv",
    title: "Bacterial Vaginosis",
    category: "Women's Health",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a320\u201340 per consultation",
    consultTime: "10\u201315 min",
    description:
      "Metronidazole. Common, undertreated. Pharmacy-friendly diagnosis and treatment.",
    pharmadoctor: "Partial",
  },
  {
    id: "postnatal-contraception",
    title: "Postnatal Contraception Advice + Supply (POP)",
    category: "Women's Health",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a320\u201335 per consultation",
    consultTime: "15 min",
    description:
      "Gap in NHS capacity at 6-week checks. Pharmacy can fill this need.",
    pharmadoctor: "Partial",
  },

  // ═══ MEN'S HEALTH ═══
  {
    id: "ed",
    title: "Erectile Dysfunction",
    category: "Men's Health",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a330\u201360 per consultation",
    consultTime: "15 min",
    description:
      "Sildenafil and tadalafil. Huge demand. Simple PGD consultation, high margin.",
    pharmadoctor: "Yes",
  },
  {
    id: "hair-loss",
    title: "Hair Loss (Finasteride Oral)",
    category: "Men's Health",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a325\u201345 per month",
    consultTime: "15 min",
    description:
      "Growing market especially 25\u201345 demographic. Repeat prescriptions = sticky revenue.",
    pharmadoctor: "Yes",
  },
  {
    id: "premature-ejaculation",
    title: "Premature Ejaculation (Dapoxetine)",
    category: "Men's Health",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a335\u201360 per consultation",
    consultTime: "15 min",
    description:
      "Underserved. Limited GP willingness to discuss. Pharmacy is neutral ground.",
    pharmadoctor: "Partial",
  },
  {
    id: "trt",
    title: "Testosterone Replacement (TRT \u2014 Topical)",
    category: "Men's Health",
    priority: 2,
    isNew: true,
    revenueEstimate: "\u00a3100\u2013150 per month",
    consultTime: "30 min initial",
    description:
      "DIFFERENTIATION. Private TRT clinics are booming. A pharmacy-based TRT PGD with monitoring consultations is a major gap in the market.",
    pharmadoctor: "No",
  },
  {
    id: "bph",
    title: "Benign Prostatic Hyperplasia (Tamsulosin)",
    category: "Men's Health",
    priority: 3,
    isNew: true,
    revenueEstimate: "\u00a325\u201340 per consultation",
    consultTime: "15 min",
    description:
      "Emerging. NICE guidance supports pharmacist-led assessment. First mover opportunity.",
    pharmadoctor: "No",
  },

  // ═══ SEXUAL HEALTH ═══
  {
    id: "sti-testing",
    title: "STI Testing",
    category: "Sexual Health",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a340\u201380 per test panel",
    consultTime: "15\u201320 min",
    description:
      "Chlamydia, gonorrhoea, HIV point-of-care. High demand in under-30s. Test and treat model.",
    pharmadoctor: "Yes",
  },
  {
    id: "prep",
    title: "PrEP (HIV Pre-exposure Prophylaxis)",
    category: "Sexual Health",
    priority: 1,
    isNew: true,
    revenueEstimate: "\u00a350\u201380 per month",
    consultTime: "20\u201330 min",
    description:
      "MAJOR GAP. NHS PrEP only through sexual health clinics with long waits. Private pharmacy PrEP is completely unaddressed. Thousands paying \u00a350+/month at online clinics.",
    pharmadoctor: "No \u2014 not offered",
  },
  {
    id: "gonorrhoea-treatment",
    title: "Gonorrhoea Treatment (Ceftriaxone IM)",
    category: "Sexual Health",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a360\u201390 per consultation",
    consultTime: "20 min",
    description:
      "High antimicrobial stewardship focus. Needs clinical training but strong demand.",
    pharmadoctor: "Partial",
  },
  {
    id: "herpes-management",
    title: "Herpes Management",
    category: "Sexual Health",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a330\u201360 per consultation",
    consultTime: "15 min",
    description:
      "Aciclovir and valaciclovir. Repeat suppression therapy = loyal recurring revenue.",
    pharmadoctor: "Yes",
  },
  {
    id: "genital-warts",
    title: "Genital Warts (Podophyllotoxin)",
    category: "Sexual Health",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a325\u201345 per consultation",
    consultTime: "15 min",
    description:
      "Common, undertreated. Good pharmacy-led consultation pathway.",
    pharmadoctor: "Partial",
  },

  // ═══ MENTAL HEALTH ═══
  {
    id: "smoking-varenicline",
    title: "Smoking Cessation (Varenicline / Champix)",
    category: "Mental Health",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a380\u2013150 per course",
    consultTime: "20 min",
    description:
      "NHS PGD now introduced (2025/26 CPCF). Private version extends further. High demand.",
    pharmadoctor: "Partial",
  },
  {
    id: "smoking-nrt",
    title: "Smoking Cessation (NRT Combination)",
    category: "Mental Health",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a340\u201370 per programme",
    consultTime: "15 min",
    description:
      "Prescription-strength NRT. Complements varenicline. Strong outcomes.",
    pharmadoctor: "Partial",
  },
  {
    id: "alcohol-reduction",
    title: "Alcohol Reduction (Nalmefene \u2014 Selincro)",
    category: "Mental Health",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a335\u201350 per consultation",
    consultTime: "15 min",
    description:
      "Pharmadoctor offers this free as a foot-in-door service. Match it.",
    pharmadoctor: "Yes (free)",
  },
  {
    id: "anxiety-propranolol",
    title: "Anxiety \u2014 Short-term (Propranolol)",
    category: "Mental Health",
    priority: 2,
    isNew: true,
    revenueEstimate: "\u00a325\u201340 per consultation",
    consultTime: "15 min",
    description:
      "DIFFERENTIATION. Propranolol for situational anxiety (presentations, exams, events) is a huge unmet demand with no pharmacy PGD pathway. Well within pharmacist competence.",
    pharmadoctor: "No",
  },
  {
    id: "sleep-melatonin",
    title: "Sleep Support (Low-dose Melatonin \u2014 Private)",
    category: "Mental Health",
    priority: 2,
    isNew: true,
    revenueEstimate: "\u00a320\u201335 per consultation",
    consultTime: "10 min",
    description:
      "DIFFERENTIATION. Melatonin is OTC in most of Europe and USA. Private PGD route fills this UK gap. Large demand from shift workers, jet lag, insomnia.",
    pharmadoctor: "No",
  },
  {
    id: "adhd-monitoring",
    title: "ADHD Support Monitoring (Titration Consultations)",
    category: "Mental Health",
    priority: 3,
    isNew: true,
    revenueEstimate: "\u00a350\u201380 per review",
    consultTime: "20 min",
    description:
      "Emerging. Cannot initiate under PGD but monitoring/bridging for diagnosed patients is pharmacy-feasible and massively underserved.",
    pharmadoctor: "No",
  },

  // ═══ SKIN ═══
  {
    id: "acne",
    title: "Acne Treatment",
    category: "Skin",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a325\u201350 per consultation",
    consultTime: "15 min",
    description:
      "Topical retinoids, antibiotics, oral doxycycline. High demand 16\u201335.",
    pharmadoctor: "Yes",
  },
  {
    id: "rosacea",
    title: "Rosacea",
    category: "Skin",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a325\u201345 per consultation",
    consultTime: "15 min",
    description:
      "Topical metronidazole and ivermectin. Long NHS waits for dermatology.",
    pharmadoctor: "Yes",
  },
  {
    id: "cold-sores",
    title: "Cold Sores (Aciclovir Oral)",
    category: "Skin",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a315\u201330 per consultation",
    consultTime: "5\u201310 min",
    description:
      "Prescription strength. High demand, very short consultation. Repeat patients.",
    pharmadoctor: "Partial",
  },
  {
    id: "eczema",
    title: "Eczema Flare Management",
    category: "Skin",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a320\u201340 per consultation",
    consultTime: "10\u201315 min",
    description:
      "Short-term topical steroids. Very high demand, GP waits are long.",
    pharmadoctor: "Partial",
  },
  {
    id: "wound-care",
    title: "Minor Wound Care",
    category: "Skin",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a315\u201330 per consultation",
    consultTime: "10 min",
    description:
      "Mupirocin and fusidic acid. Natural extension of pharmacy role. High footfall.",
    pharmadoctor: "Partial",
  },
  {
    id: "alopecia-minoxidil",
    title: "Alopecia (Oral Minoxidil \u2014 Private)",
    category: "Skin",
    priority: 3,
    isNew: true,
    revenueEstimate: "\u00a330\u201360 per month",
    consultTime: "15 min",
    description:
      "DIFFERENTIATION. Oral minoxidil is off-label but increasingly prescribed privately. PGD pathway would be a first.",
    pharmadoctor: "No",
  },

  // ═══ RESPIRATORY ═══
  {
    id: "asthma-rescue",
    title: "Asthma Rescue Medication (Salbutamol Inhaler)",
    category: "Respiratory",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a315\u201325 per consultation",
    consultTime: "10 min",
    description:
      "High demand from patients without GP access. Simple consultation.",
    pharmadoctor: "Yes",
  },
  {
    id: "copd",
    title: "COPD Symptom Management",
    category: "Respiratory",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a325\u201345 per consultation",
    consultTime: "15 min",
    description:
      "Short-acting bronchodilator for diagnosed patients. High repeat value.",
    pharmadoctor: "Partial",
  },
  {
    id: "hayfever",
    title: "Hayfever (Prescription Strength)",
    category: "Respiratory",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a315\u201330 per consultation",
    consultTime: "10 min",
    description:
      "Prescription antihistamines and nasal steroids. Seasonal peak demand. Much better outcomes than OTC.",
    pharmadoctor: "Partial",
  },
  {
    id: "sore-throat",
    title: "Sore Throat Test & Treat",
    category: "Respiratory",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a320\u201340 per consultation",
    consultTime: "10\u201315 min",
    description:
      "FeverPAIN scoring + antibiotics. NHS PGD from 2024 \u2014 private version extends with no referral cap.",
    pharmadoctor: "Yes (Pharmacy First)",
  },

  // ═══ CVD ═══
  {
    id: "hypertension",
    title: "Hypertension Monitoring + Supply (Amlodipine)",
    category: "CVD",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a330\u201350 per consultation",
    consultTime: "15\u201320 min",
    description:
      "NHS Hypertension Case Finding service \u2014 private version extends reach.",
    pharmadoctor: "Partial",
  },
  {
    id: "statins",
    title: "Cholesterol (Statin Continuation)",
    category: "CVD",
    priority: 2,
    isNew: true,
    revenueEstimate: "\u00a320\u201335 per consultation",
    consultTime: "10\u201315 min",
    description:
      "DIFFERENTIATION. Huge gap. Thousands of patients struggling to get statin repeat prescriptions. Pharmacy-led continuation is clinically safe and commercially strong.",
    pharmadoctor: "No",
  },
  {
    id: "diabetes-monitoring",
    title: "Diabetes Type 2 Monitoring + Metformin Continuation",
    category: "CVD",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a325\u201345 per consultation",
    consultTime: "15 min",
    description:
      "Large patient population. Continuation supply for stable T2DM avoids unnecessary GP appointments.",
    pharmadoctor: "Partial",
  },

  // ═══ OCCUPATIONAL ═══
  {
    id: "hep-b-occupational",
    title: "Hepatitis B Vaccination (Occupational Health)",
    category: "Occupational",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a360\u2013120 per course",
    consultTime: "15 min",
    description:
      "Healthcare workers, first responders, care home staff. High volume B2B opportunity.",
    pharmadoctor: "Yes",
  },
  {
    id: "needlestick-pep",
    title: "Needle-stick Post-Exposure Prophylaxis (PEP)",
    category: "Occupational",
    priority: 2,
    isNew: true,
    revenueEstimate: "\u00a380\u2013150 per consultation",
    consultTime: "20\u201330 min",
    description:
      "DIFFERENTIATION. Occupational health PEP guidance and bridging supply. Not offered by any pharmacy PGD provider.",
    pharmadoctor: "No",
  },

  // ═══ PAEDIATRICS ═══
  {
    id: "paediatric-uti",
    title: "Paediatric UTI (Trimethoprim)",
    category: "Paediatrics",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a320\u201335 per consultation",
    consultTime: "10\u201315 min",
    description:
      "High demand in children under 12. Parents seeking fast treatment.",
    pharmadoctor: "Partial",
  },
  {
    id: "threadworms",
    title: "Threadworms (Mebendazole \u2014 Prescription Dose)",
    category: "Paediatrics",
    priority: 2,
    isNew: false,
    revenueEstimate: "\u00a315\u201325 per consultation",
    consultTime: "5\u201310 min",
    description:
      "Extremely common. Short consultation. Prescription-strength preferred over OTC.",
    pharmadoctor: "Partial",
  },
  {
    id: "impetigo",
    title: "Impetigo",
    category: "Paediatrics",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a320\u201335 per consultation",
    consultTime: "10 min",
    description:
      "Fusidic acid and mupirocin. Very high demand. Often first pharmacy contact for parents.",
    pharmadoctor: "Yes (Pharmacy First)",
  },

  // ═══ MINOR AILMENTS ═══
  {
    id: "ear-infection",
    title: "Ear Infection (Cetraxal)",
    category: "Minor Ailments",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a320\u201335 per consultation",
    consultTime: "10 min",
    description:
      "High volume, easy consultation. Pharmadoctor offers free \u2014 match and extend.",
    pharmadoctor: "Yes (free)",
  },
  {
    id: "eye-infections",
    title: "Eye Infections (Chloramphenicol \u2014 Prescription Strength)",
    category: "Minor Ailments",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a315\u201325 per consultation",
    consultTime: "5\u201310 min",
    description:
      "Very high demand. Prescription-strength significantly outperforms OTC.",
    pharmadoctor: "Partial",
  },
  {
    id: "dental-bridging",
    title: "Dental Pain (Amoxicillin Bridging)",
    category: "Minor Ailments",
    priority: 2,
    isNew: true,
    revenueEstimate: "\u00a325\u201340 per consultation",
    consultTime: "10\u201315 min",
    description:
      "DIFFERENTIATION. Dental access crisis means patients in pain with nowhere to go. Real unmet need.",
    pharmadoctor: "No",
  },
  {
    id: "shingles-treatment",
    title: "Shingles Acute Treatment (Valaciclovir)",
    category: "Minor Ailments",
    priority: 1,
    isNew: false,
    revenueEstimate: "\u00a340\u201370 per consultation",
    consultTime: "15 min",
    description:
      "Time-critical (must start within 72h). Pharmacy is ideally placed vs GP.",
    pharmadoctor: "Partial",
  },

];
