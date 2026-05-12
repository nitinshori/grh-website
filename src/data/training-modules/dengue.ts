// Dengue vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const dengueModule: TrainingModule = {
  slug: "dengue",
  title: "Dengue Vaccination (Qdenga) — PGD",
  description: "Dengue vaccination of seropositive travellers under PGD.",
  pgdSlugs: ["dengue"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Dengue Vaccination — Training", subtitle: "Qdenga for seropositive travellers", estimatedMinutes: 10, objectives: [
      "Identify travellers eligible for dengue vaccine — those with confirmed previous dengue infection.",
      "Understand antibody-dependent enhancement risk in seronegative individuals.",
      "Apply 2-dose schedule and counsel on bite avoidance.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Dengue is a mosquito-borne flavivirus endemic across tropics. Aedes mosquito vector — DAY-biting (distinguishes from malaria-vector Anopheles).",
      "Qdenga is the UK-licensed dengue vaccine (live attenuated, 2-dose). Crucially: previous dengue infection (seropositivity) is preferred BEFORE vaccination, because secondary dengue infection of a different serotype carries higher risk of severe disease (antibody-dependent enhancement).",
      "Qdenga is licensed for ages 4+ with previous dengue evidence. Seronegative vaccination is more nuanced — risk-benefit case-by-case, specialist territory.",
    ], highlights: ["Confirm previous dengue (seropositive) for routine vaccination.", "2 doses 3 months apart.", "Bite avoidance still essential — Aedes is day-biting."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Age 4+", detail: "Children require careful weight-based assessment; specialist for younger." },
      { label: "Confirmed previous dengue infection", detail: "Either documented clinical episode with positive serology / NAAT, or pre-vaccination serology positive for prior infection." },
      { label: "Travel to dengue-endemic area", detail: "Most tropical and sub-tropical regions. Check TravelHealthPro." },
      { label: "Not pregnant or breastfeeding", detail: "Live vaccine — contraindicated. Defer." },
      { label: "Not immunocompromised", detail: "Live vaccine — contraindicated." },
      { label: "No anaphylaxis to vaccine component", detail: "Refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Live vaccine + serostatus considerations.", detail: [
      "Pregnancy and breastfeeding.",
      "Significant immunosuppression.",
      "Previous anaphylaxis to Qdenga component.",
      "Seronegative individuals — routine vaccination is NOT recommended due to antibody-dependent enhancement risk for severe disease if subsequently infected. Specialist case-by-case for high-risk seronegative travellers.",
      "Severe acute febrile illness today.",
      "Recent live vaccine within 4 weeks.",
    ]},
    { id: "schedule-counselling", type: "checklist", title: "Schedule, administration, counselling", items: [
      { label: "Schedule", detail: "2 doses, 3 months apart. Subcutaneous." },
      { label: "Bite avoidance", detail: "Aedes mosquitoes are DAY-biting (peak dawn and dusk but active in daylight). DEET, permethrin-treated clothing, air-conditioning, screens." },
      { label: "Symptoms", detail: "Dengue fever: high fever, severe muscle/joint pain ('breakbone fever'), headache, eye pain, rash. Most resolve in 1 week." },
      { label: "Severe dengue", detail: "Plasma leakage, haemorrhage, organ involvement. Develops 3–7 days after onset. Warning signs: severe abdominal pain, persistent vomiting, bleeding, restlessness, hepatomegaly. URGENT medical care." },
      { label: "Post-travel fever", detail: "Fever in returning traveller from dengue area — urgent assessment including dengue NS1 antigen or NAAT." },
      { label: "Document", detail: "Pre-vaccination serology / clinical history of previous dengue, dose number, batch. NIMS upload." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Routine: only for confirmed seropositive individuals (previous dengue).",
      "2 doses 3 months apart, subcut.",
      "Live vaccine — pregnancy / immunosuppression contraindicated.",
      "Aedes is DAY-biting — bite avoidance applies all day.",
      "Severe dengue warning signs = urgent medical care.",
      "Seronegative routine vaccination not recommended (ADE risk).",
    ]},
  ],
  quiz: [
    { id: "q-seronegative", type: "single-choice", critical: true, question: "Patient with no prior dengue exposure wants vaccine before travel. Action?", options: [
      { id: "a", label: "Vaccinate routinely." }, { id: "b", label: "Refer specialist — seronegative routine vaccination is NOT recommended due to ADE risk (antibody-dependent enhancement increases severity of future infection). Case-by-case specialist judgment." }, { id: "c", label: "Half dose." }, { id: "d", label: "Single dose only." }
    ], correctOptionIds: ["b"], explanation: "Seronegative vaccination has historically been associated with worse outcomes if subsequently naturally infected. Specialist judgement only." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant seropositive traveller wants dengue vaccine. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Defer until postpartum — live vaccine contraindicated in pregnancy." }, { id: "c", label: "Half dose." }, { id: "d", label: "Single dose." }
    ], correctOptionIds: ["b"], explanation: "Live vaccine + pregnancy = contraindicated. Defer." },
    { id: "q-aedes", type: "single-choice", critical: true, question: "Patient asks when to use mosquito repellent in dengue area.", options: [
      { id: "a", label: "At night only." }, { id: "b", label: "All day — Aedes mosquitoes are day-biting (peaks dawn and dusk but throughout daylight). Different from malaria-vector Anopheles." }, { id: "c", label: "Only when outdoors." }, { id: "d", label: "At dusk only." }
    ], correctOptionIds: ["b"], explanation: "Critical distinction. Aedes is day-biting, unlike malaria-vector Anopheles. Day-long bite avoidance needed." },
    { id: "q-warning-signs", type: "single-choice", critical: true, question: "Returning traveller with dengue (confirmed) day 4 of illness — severe abdominal pain, vomiting. Action?", options: [
      { id: "a", label: "Reassure." }, { id: "b", label: "Urgent A&E — warning signs of severe dengue (plasma leakage, shock). Time-critical for fluid management and admission." }, { id: "c", label: "Antibiotic." }, { id: "d", label: "Antipyretic." }
    ], correctOptionIds: ["b"], explanation: "Warning signs at days 3–7 = severe dengue risk. Urgent hospital — fluid management is the lifesaver." },
    { id: "q-schedule", type: "single-choice", question: "Qdenga schedule?", options: [
      { id: "a", label: "Single dose." }, { id: "b", label: "2 doses 3 months apart, subcut." }, { id: "c", label: "3 doses." }, { id: "d", label: "Annual." }
    ], correctOptionIds: ["b"], explanation: "Standard 2-dose subcut schedule, 3 months apart." },
    { id: "q-immuno", type: "single-choice", question: "Immunocompromised seropositive patient wants vaccine. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Refer specialist — live vaccine contraindicated in significant immunosuppression." }, { id: "c", label: "Half dose." }, { id: "d", label: "Inactivated alternative." }
    ], correctOptionIds: ["b"], explanation: "Live vaccine contraindicated in immunosuppression. Specialist." },
    { id: "q-serology", type: "single-choice", question: "Patient unsure if they had dengue. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Confirm with pre-vaccination dengue IgG serology. Don't vaccinate seronegative routinely." }, { id: "c", label: "Refuse." }, { id: "d", label: "Half dose." }
    ], correctOptionIds: ["b"], explanation: "Pre-vaccination serology confirms eligibility. Don't assume seropositivity from history alone." },
    { id: "q-bite-avoid", type: "single-choice", question: "Vaccinated patient asks about bite avoidance.", options: [
      { id: "a", label: "Not needed." }, { id: "b", label: "Essential — vaccine is not 100% effective. Bite avoidance also protects against chikungunya, Zika, yellow fever (same Aedes vector)." }, { id: "c", label: "Only dusk." }, { id: "d", label: "Only outdoors." }
    ], correctOptionIds: ["b"], explanation: "Combined approach. Bite avoidance protects against multiple Aedes-borne diseases." },
    { id: "q-source", type: "single-choice", question: "Authoritative source for destination dengue risk?", options: [
      { id: "a", label: "BBC." }, { id: "b", label: "NaTHNaC TravelHealthPro / Fit for Travel." }, { id: "c", label: "BNF." }, { id: "d", label: "Lonely Planet." }
    ], correctOptionIds: ["b"], explanation: "TravelHealthPro for current country-specific advice." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Serostatus confirmation (clinical history + serology), destination, dose number, batch, bite-avoidance counselling, warning-signs counselling — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record especially captures serostatus confirmation — the load-bearing eligibility item." },
  ],
};
