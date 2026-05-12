// COPD emergency rescue pack supply — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const copdModule: TrainingModule = {
  slug: "copd",
  title: "COPD Rescue Pack — PGD",
  description: "Supply of an emergency 'rescue pack' (oral antibiotic ± prednisolone) for known COPD patients with exacerbations under PGD.",
  pgdSlugs: ["copd"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "COPD Rescue Pack — Training", subtitle: "Emergency antibiotic ± prednisolone supply for COPD exacerbation", estimatedMinutes: 12, objectives: [
      "Identify known COPD patients eligible for rescue pack supply.",
      "Distinguish mild-moderate exacerbation (PGD-treatable) from severe (urgent referral / 999).",
      "Apply Anthonisen criteria for antibiotic indication.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "COPD exacerbations are sustained worsening of respiratory symptoms beyond normal day-to-day variation. Drivers: viral (most common), bacterial, environmental. Standard management for moderate exacerbation: short course of oral steroid (prednisolone 30 mg OD for 5 days) AND/OR oral antibiotic (amoxicillin 500 mg TDS or doxycycline 100 mg OD; clarithromycin if penicillin allergic) for 5 days.",
      "Antibiotic indicated by Anthonisen criteria: increased dyspnoea + increased sputum volume + increased sputum purulence (need 2 of 3, with purulence being the most predictive). Antibiotic + steroid for type 1 exacerbations. Steroid alone may suffice for steroid-responsive without purulent sputum.",
      "Rescue pack = pre-supplied medication for the patient to start at home when they recognise their typical exacerbation. Avoids delays from GP appointment.",
    ], highlights: ["Anthonisen criteria: increased dyspnoea + sputum volume + purulence.", "Purulent sputum + worsening symptoms = antibiotic + steroid.", "Severe exacerbation (talking in single words, tachypnoea, hypoxia) = 999."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 40+ with established COPD", detail: "Confirmed COPD diagnosis (spirometry FEV1/FVC <0.7 with smoking history typically). PGD doesn't cover first-presentation breathlessness." },
      { label: "Currently in early exacerbation", detail: "Recognises typical pattern; sputum change, increased breathlessness compared to usual. Not severely unwell now." },
      { label: "Not had >2 exacerbations in last 6 months", detail: "Frequent exacerbators need GP / respiratory review for optimisation." },
      { label: "Not in 'red flag' presentation (see next slide)", detail: "Severe exacerbation = ambulance." },
      { label: "Has a written self-management plan or GP awareness", detail: "Ideally pre-agreed rescue-pack plan with GP." },
      { label: "Knows when to escalate", detail: "Has clear understanding of when to call GP or 999." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Red flags — 999 or urgent care", tone: "danger", message: "Severe exacerbation features.", detail: [
      "Talking in single words or short phrases (severe breathlessness).",
      "Respiratory rate >25 at rest.",
      "Oxygen saturation <90% on room air (if measurable).",
      "Heart rate >120 sustained.",
      "Confusion, drowsiness, cyanosis.",
      "Significant chest pain (exclude PE, ACS).",
      "Haemoptysis.",
      "Hypotension.",
      "Failure of previous rescue pack — needs medical review, not repeat supply.",
      "Patient on home oxygen with deterioration.",
      "Severe COPD on previous spirometry (FEV1 <30% predicted).",
    ]},
    { id: "anthonisen", type: "checklist", title: "Anthonisen criteria — when to give antibiotic", intro: "Three cardinal symptoms.", items: [
      { label: "Increased dyspnoea", detail: "Worse than usual day-to-day variation." },
      { label: "Increased sputum volume", detail: "More than usual." },
      { label: "Increased sputum purulence", detail: "Yellow / green / brown rather than usual colour. Most predictive of bacterial infection." },
      { label: "All 3 = Type 1 (severe exacerbation)", detail: "Antibiotic + steroid both indicated." },
      { label: "2 of 3, including purulence = Type 2", detail: "Antibiotic + steroid considered." },
      { label: "1 of 3 OR no purulence = Type 3", detail: "Steroid alone may suffice. Avoid unnecessary antibiotic." },
    ]},
    { id: "treatment", type: "checklist", title: "Rescue pack composition", intro: "Per Anthonisen typing and patient's documented preference.", items: [
      { label: "Oral prednisolone 30 mg once daily for 5 days", detail: "For most moderate exacerbations. No tapering needed for ≤14 days course." },
      { label: "Oral antibiotic when indicated (≥2 Anthonisen criteria with purulence)", detail: "Amoxicillin 500 mg TDS for 5 days. Doxycycline 100 mg OD for 5 days (alternative). Clarithromycin 250–500 mg BD for 5 days (penicillin-allergic)." },
      { label: "Single dose", detail: "5-day courses — don't extend." },
      { label: "Steroid side effects", detail: "Mood changes, sleep disturbance, glucose effects (caution in diabetes — monitor BG more closely). GI irritation — take with food. Take in the morning." },
      { label: "Antibiotic side effects", detail: "GI upset, diarrhoea. Photosensitivity (doxycycline). Watch for severe allergic reaction." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Start at first signs of typical exacerbation", detail: "Increased breathlessness, sputum change. Earlier intervention = less severe." },
      { label: "Continue usual inhaler regimen", detail: "Don't stop maintenance ICS/LABA or LAMA. Use SABA more frequently as needed." },
      { label: "Steroid timing", detail: "Take in the morning with food. Mood disturbance common — alert family/carers." },
      { label: "Return if no improvement at 48–72 hours", detail: "GP review needed if not improving." },
      { label: "Escalate if breathless even at rest, single-word speech, cyanosis, confusion", detail: "999. Don't delay." },
      { label: "Inform GP of rescue pack use", detail: "Document use; review at next GP appointment for pattern." },
      { label: "Vaccination", detail: "Annual flu, COVID, pneumococcal vaccinations are essential for COPD — encourage." },
      { label: "Smoking cessation if relevant", detail: "Single most important intervention." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Known COPD patient, recognises typical exacerbation pattern, early presentation.",
      "Prednisolone 30 mg OD 5 days. Antibiotic if 2+ Anthonisen criteria with purulence.",
      "Severe exacerbation features (single-word speech, cyanosis, confusion) = 999.",
      "Continue usual inhaler regimen.",
      "Document use, GP-informed, encourage vaccination and smoking cessation.",
    ]},
  ],
  quiz: [
    { id: "q-severe", type: "single-choice", critical: true, question: "Patient with COPD presents speaking in single words, can't complete a sentence, blue around the lips. Action?", options: [
      { id: "a", label: "Supply rescue pack." }, { id: "b", label: "999 immediately — severe exacerbation with possible respiratory failure. Hospital admission needed." }, { id: "c", label: "Topical." }, { id: "d", label: "Inhaler only." }
    ], correctOptionIds: ["b"], explanation: "Single-word speech and cyanosis = severe exacerbation, possibly type II respiratory failure. Hospital not pharmacy." },
    { id: "q-anthonisen", type: "single-choice", critical: true, question: "Patient describes worse breathlessness today, no change in sputum (clear, usual volume). Action?", options: [
      { id: "a", label: "Antibiotic and prednisolone." }, { id: "b", label: "Prednisolone 30 mg OD 5 days. Antibiotic not indicated (no purulent sputum, only 1 of 3 Anthonisen criteria)." }, { id: "c", label: "Antibiotic alone." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Anthonisen criteria: antibiotic only when purulent sputum is one of the features. Single symptom = steroid alone reasonable." },
    { id: "q-first-presentation", type: "single-choice", critical: true, question: "Patient describes new-onset breathlessness, never been diagnosed with COPD. Action?", options: [
      { id: "a", label: "Supply rescue pack." }, { id: "b", label: "Refer to GP — first-presentation breathlessness is outside PGD; needs spirometry and diagnosis (asthma, COPD, heart failure, etc.)." }, { id: "c", label: "Prednisolone alone." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Rescue PGD is for established COPD. First-presentation breathlessness needs proper diagnosis." },
    { id: "q-frequent", type: "single-choice", critical: true, question: "Patient has had 4 exacerbations in past 6 months. Today another. Action?", options: [
      { id: "a", label: "Supply rescue pack." }, { id: "b", label: "Refer to GP / respiratory — frequent exacerbator (>2/6 months) needs treatment optimisation (LAMA/LABA/ICS combination, possibly other agents), pulmonary rehab, vaccination check." }, { id: "c", label: "Higher-dose pack." }, { id: "d", label: "Antibiotic only." }
    ], correctOptionIds: ["b"], explanation: "Frequent exacerbations indicate undermanaged disease — needs proper review, not just more rescue packs." },
    { id: "q-prednisolone-duration", type: "single-choice", question: "Standard prednisolone course for COPD exacerbation?", options: [
      { id: "a", label: "1 day pulse." }, { id: "b", label: "30 mg once daily for 5 days. No tapering needed for ≤14-day course." }, { id: "c", label: "60 mg for 14 days with taper." }, { id: "d", label: "10 mg for 30 days." }
    ], correctOptionIds: ["b"], explanation: "30 mg OD x 5 days is standard. Short courses don't need tapering. Longer courses (>14 days) require taper." },
    { id: "q-amoxicillin-allergy", type: "single-choice", question: "Patient eligible for antibiotic in rescue pack but penicillin-allergic. Alternative?", options: [
      { id: "a", label: "Amoxicillin." }, { id: "b", label: "Clarithromycin 250–500 mg BD x 5 days, OR doxycycline 100 mg OD x 5 days." }, { id: "c", label: "Cefalexin." }, { id: "d", label: "Avoid antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Macrolide or doxycycline are standard alternatives. Cephalosporin avoided in severe penicillin allergy." },
    { id: "q-steroid-diabetes", type: "single-choice", question: "COPD patient with type 2 diabetes uses rescue pack. Counselling?", options: [
      { id: "a", label: "No change to diabetes regimen." }, { id: "b", label: "Counsel on monitoring blood glucose more closely during the steroid course — prednisolone raises blood glucose. Inform GP. Insulin / oral agent adjustments may be needed if BG significantly elevated." }, { id: "c", label: "Stop diabetes medication." }, { id: "d", label: "Halve diabetes dose." }
    ], correctOptionIds: ["b"], explanation: "Steroids raise BG. Counsel for closer monitoring and GP awareness; some patients need diabetes treatment adjustment during steroid course." },
    { id: "q-failure", type: "single-choice", question: "Patient using rescue pack 48 hours, no improvement. Action?", options: [
      { id: "a", label: "Continue another 5 days." }, { id: "b", label: "Refer for medical review — failure of standard rescue pack at 48–72 hours warrants GP / urgent care assessment for alternative diagnosis (PE, heart failure, pneumonia) or escalation." }, { id: "c", label: "Double dose." }, { id: "d", label: "Add bronchodilator." }
    ], correctOptionIds: ["b"], explanation: "Failure to improve raises differential diagnosis (PE, heart failure, severe pneumonia, malignancy). Needs medical review." },
    { id: "q-inhaler-continue", type: "single-choice", question: "Should the patient continue her usual long-acting inhalers during the exacerbation?", options: [
      { id: "a", label: "Stop until exacerbation resolves." }, { id: "b", label: "Continue usual maintenance therapy. Add SABA more frequently as needed for symptom relief." }, { id: "c", label: "Double maintenance dose." }, { id: "d", label: "Switch to SABA only." }
    ], correctOptionIds: ["b"], explanation: "Maintenance therapy continues throughout. SABA used more for symptom relief. Stopping maintenance inhalers worsens the exacerbation." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "COPD severity history, exacerbation features (Anthonisen criteria), red flags excluded, rescue pack components dispensed, counselling delivered, GP-informed — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates that Anthonisen criteria were applied and severe features excluded." },
  ],
};
