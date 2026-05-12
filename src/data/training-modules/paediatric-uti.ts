// Paediatric UTI — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const paediatricUtiModule: TrainingModule = {
  slug: "paediatric-uti",
  title: "Paediatric UTI — PGD",
  description: "Treatment of uncomplicated lower UTI in children aged 3 months to 16 years under PGD.",
  pgdSlugs: ["paediatric-uti"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Paediatric UTI — Training", subtitle: "Uncomplicated lower UTI in children", estimatedMinutes: 12, objectives: [
      "Recognise classic paediatric UTI vs upper-tract / atypical presentations needing referral.",
      "Apply correct weight-based dosing.",
      "Coordinate urine culture and follow-up.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "UTI in children carries higher complication risk than in adults — possible renal scarring, vesicoureteric reflux underlying. NICE NG224 guides paediatric UTI management.",
      "Symptoms vary by age. Infants: non-specific (fever, irritability, poor feeding, vomiting). Young children: fever, dysuria, frequency, abdominal pain, secondary enuresis. Older children: adult-pattern symptoms.",
      "PGD covers uncomplicated lower UTI in 3 months – 16 years. Under 3 months: always refer. Atypical features: always refer.",
    ], highlights: ["Under 3 months: always refer urgently.", "Atypical UTI (poor stream, mass, sepsis features) = refer.", "Always send urine for culture to confirm and check sensitivities."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 3 months to 16 years", detail: "Under 3 months — urgent referral for sepsis workup." },
      { label: "Symptoms consistent with uncomplicated lower UTI", detail: "Dysuria, frequency, abdominal pain, secondary enuresis. Fever without other clear cause in younger child." },
      { label: "No features of atypical UTI (next slide)", detail: "Atypical = refer." },
      { label: "First or second UTI (not recurrent)", detail: "Recurrent paediatric UTI = referral for imaging workup." },
      { label: "Urine dipstick suggestive (or culture-confirmed)", detail: "Positive nitrites or leukocyte esterase support diagnosis. Always send for culture regardless of dipstick." },
      { label: "Carer / parent able to manage", detail: "Compliance with course, follow-up, and to bring back if not improving." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer (always)", tone: "danger", message: "Outside PGD scope.", detail: [
      "Under 3 months — urgent paediatric assessment (sepsis risk).",
      "Atypical UTI: severely unwell, poor urine flow, abdominal mass, raised creatinine, septicaemia, failure to respond to antibiotic at 48 hours, infection with non-E. coli organism (per culture).",
      "Suspected pyelonephritis (high fever, flank pain, vomiting, systemic illness).",
      "Recurrent UTI (≥2 confirmed UTIs) — needs imaging (ultrasound, possibly DMSA scan).",
      "Known urinary tract abnormality.",
      "Immunocompromised child.",
      "Diagnostic uncertainty.",
      "Penicillin allergy in severe form — refer for alternative regimen.",
    ]},
    { id: "treatment", type: "checklist", title: "Treatment", intro: "Per NICE NG224 weight-based dosing.", items: [
      { label: "First-line (3 months – 16 years)", detail: "Trimethoprim or nitrofurantoin for 3 days (lower UTI). Nitrofurantoin OD/BD per age and weight. Trimethoprim BD per weight." },
      { label: "Nitrofurantoin dosing", detail: "3 months–17 years: 750 mcg/kg four times daily (oral suspension) for 3 days. Maximum 100 mg per dose. Use the modified-release adult preparation only in adolescents (≥12 years and ≥40 kg)." },
      { label: "Trimethoprim dosing", detail: "6 weeks–6 months: 4 mg/kg BD. 6 months–6 years: 50 mg BD. 6–12 years: 100 mg BD. 12–18 years: 200 mg BD. All for 3 days." },
      { label: "Penicillin-allergic", detail: "Above are non-penicillin already. If allergic to nitrofurantoin or trimethoprim, refer." },
      { label: "Always send urine culture", detail: "Even if dipstick positive, culture confirms organism and sensitivities. Adjust if resistant per culture result." },
      { label: "Review at 48 hours", detail: "If no improvement, refer for upper-tract workup. Switch antibiotic per culture sensitivities if available." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Complete the course", detail: "Even if symptoms resolve early." },
      { label: "Hydration", detail: "Encourage fluids during the illness." },
      { label: "Return if", detail: "Fever ≥38°C develops, vomiting, flank pain, no improvement at 48 hours, child unwell." },
      { label: "Hygiene", detail: "Wipe front to back (girls). Avoid bubble baths. Loose underwear. Address constipation if relevant." },
      { label: "Follow-up", detail: "All children with confirmed UTI should be reviewed by GP for considering imaging and follow-up per NICE." },
      { label: "Recurrent prevention", detail: "If second confirmed UTI, GP for ultrasound; possibly prophylactic antibiotic." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "PGD: 3 months–16 years with uncomplicated lower UTI.",
      "Under 3 months OR atypical features = urgent refer.",
      "Weight-based trimethoprim or nitrofurantoin for 3 days.",
      "Always send urine culture; review at 48 hours.",
      "All confirmed paediatric UTIs need GP follow-up for imaging considerations.",
      "Recurrent = imaging workup.",
    ]},
  ],
  quiz: [
    { id: "q-under-3-months", type: "single-choice", critical: true, question: "2-month-old infant with fever and irritability. Action?", options: [
      { id: "a", label: "Treat as paediatric UTI." }, { id: "b", label: "Urgent paediatric assessment — under 3 months always refers; sepsis workup including blood cultures, possible LP, and IV antibiotics." }, { id: "c", label: "Trimethoprim." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Under 3 months is always a paediatric emergency referral — sepsis workup." },
    { id: "q-atypical", type: "single-choice", critical: true, question: "5-year-old with fever, flank pain, vomiting. Action?", options: [
      { id: "a", label: "Trimethoprim." }, { id: "b", label: "Refer urgent paediatric care — pyelonephritis features. Needs longer course, possible admission, ultrasound." }, { id: "c", label: "Nitrofurantoin." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Upper-tract / pyelonephritis features warrant urgent paediatric care, not PGD." },
    { id: "q-recurrent", type: "single-choice", critical: true, question: "6-year-old has had this is her 3rd UTI this year. Action?", options: [
      { id: "a", label: "Treat under PGD." }, { id: "b", label: "Refer — recurrent paediatric UTI needs imaging (ultrasound minimum, possibly DMSA, MCUG) and structural assessment. Possibly prophylactic antibiotic." }, { id: "c", label: "Higher dose." }, { id: "d", label: "Topical." }
    ], correctOptionIds: ["b"], explanation: "Recurrent paediatric UTI = imaging workup. Outside PGD." },
    { id: "q-culture", type: "single-choice", critical: true, question: "Why send urine culture even if dipstick positive?", options: [
      { id: "a", label: "Not necessary." }, { id: "b", label: "Confirms organism and provides antibiotic sensitivities — important for paediatric UTI given resistance variability and the need for imaging in confirmed cases. NICE NG224 requirement." }, { id: "c", label: "Only if symptoms severe." }, { id: "d", label: "Only in girls." }
    ], correctOptionIds: ["b"], explanation: "Culture confirms diagnosis (important for imaging triggers) and provides sensitivity data. NICE mandates this." },
    { id: "q-no-improvement", type: "single-choice", question: "Child on antibiotic 48 hours, no improvement. Action?", options: [
      { id: "a", label: "Continue and review." }, { id: "b", label: "Refer for review — possible atypical UTI, resistant organism, upper-tract involvement. Switch per culture sensitivities if available, send for imaging." }, { id: "c", label: "Double dose." }, { id: "d", label: "Add antiviral." }
    ], correctOptionIds: ["b"], explanation: "Failure at 48 hours = atypical UTI by NICE definition. Refer for imaging and culture-guided switch." },
    { id: "q-trimethoprim-dose", type: "single-choice", question: "5-year-old needs trimethoprim for UTI. Dose?", options: [
      { id: "a", label: "200 mg BD." }, { id: "b", label: "50 mg BD for 3 days (6 months–6 years)." }, { id: "c", label: "100 mg BD." }, { id: "d", label: "Adult dose 200 mg BD." }
    ], correctOptionIds: ["b"], explanation: "Weight/age-based dosing per BNF for children." },
    { id: "q-bubble-bath", type: "single-choice", question: "Counselling for parents of girls with UTI?", options: [
      { id: "a", label: "Limit fluid intake." }, { id: "b", label: "Wipe front to back, avoid bubble baths (irritate urethra), address constipation, loose cotton underwear, encourage fluids and regular voiding." }, { id: "c", label: "Daily antiseptic wash." }, { id: "d", label: "No specific advice." }
    ], correctOptionIds: ["b"], explanation: "Standard preventive measures for girls. Bubble baths are a real cause of urethral irritation mimicking UTI." },
    { id: "q-follow-up", type: "single-choice", question: "Confirmed first UTI in 3-year-old. Follow-up?", options: [
      { id: "a", label: "None needed." }, { id: "b", label: "GP follow-up for consideration of renal tract ultrasound per NICE — typically not for first uncomplicated UTI in older children, but assess on case-by-case basis. Recurrent UTI triggers more imaging." }, { id: "c", label: "MRI." }, { id: "d", label: "DMSA all children." }
    ], correctOptionIds: ["b"], explanation: "NICE NG224 guides imaging — case-by-case. First uncomplicated UTI in older child may not need imaging; younger / atypical / recurrent does." },
    { id: "q-pregnancy-adolescent", type: "single-choice", question: "15-year-old pregnant girl with UTI symptoms. Action?", options: [
      { id: "a", label: "PGD treatment." }, { id: "b", label: "Refer GP / midwife / antenatal team. Pregnancy + adolescent + UTI = specialist context including safeguarding considerations and pregnancy-appropriate antibiotic." }, { id: "c", label: "Topical." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy + adolescent UTI is outside PGD scope. Specialist antenatal care plus safeguarding pathway." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Age, weight, symptoms, dipstick result, culture sent confirmation, weight-based dose, parental counselling, GP follow-up plan — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured paediatric record especially captures the culture-sent confirmation and follow-up plan — NICE mandates." },
  ],
};
