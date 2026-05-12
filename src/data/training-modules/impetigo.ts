// Impetigo — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const impetigoModule: TrainingModule = {
  slug: "impetigo",
  title: "Impetigo — PGD",
  description: "Eligibility and supply of topical hydrogen peroxide, fusidic acid, or oral flucloxacillin for impetigo under PGD.",
  pgdSlugs: ["impetigo"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Impetigo — Training", subtitle: "Localised vs widespread impetigo: step-wise treatment", estimatedMinutes: 10, objectives: [
      "Recognise impetigo and differentiate from eczema, herpes, and other lesions.",
      "Apply NICE-recommended step-wise treatment (hydrogen peroxide → topical antibiotic → oral antibiotic).",
      "Counsel on hygiene, return to school/work, and contagion control.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Impetigo is a contagious superficial bacterial skin infection, usually Staph aureus (occasionally Strep pyogenes). Two forms: non-bullous (most common; honey-coloured crusts on face, hands, limbs) and bullous (large blisters that rupture, often in younger children).",
      "Self-limiting in most cases but treated to reduce spread, shorten course, and prevent complications.",
      "Modern NICE guidance: hydrogen peroxide 1% cream first-line for localised non-bullous (antibiotic stewardship); topical antibiotic if hydrogen peroxide unsuitable or fails; oral antibiotic for widespread, bullous, systemic features, or treatment failure.",
    ], highlights: ["Honey-coloured crusts = classic impetigo.", "Step-wise: hydrogen peroxide → topical antibiotic → oral.", "Highly contagious — hygiene counselling is central."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 1+", detail: "Babies under 1 year — refer." },
      { label: "Localised non-bullous impetigo OR widespread", detail: "Bullous impetigo (large blisters) usually needs oral antibiotic." },
      { label: "Patient otherwise well", detail: "Fever, malaise, lymphadenopathy → refer for oral antibiotic and consideration of broader infection." },
      { label: "Not in setting of broken skin disease", detail: "Eczema herpeticum mimics; severe eczema with secondary infection needs broader approach." },
      { label: "Diagnosis confident", detail: "If uncertain — refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "When NOT to use the PGD.", detail: [
      "Babies under 1 year.",
      "Pregnancy — refer (most agents OK but appropriate review by GP/midwife).",
      "Recurrent impetigo — investigate carriage and decolonisation; needs GP.",
      "Suspected eczema herpeticum (vesicular) — A&E.",
      "Systemic features — fever, malaise, lymphangitis, cellulitis — refer.",
      "Underlying severe skin disease (eczema flare, psoriasis).",
      "MRSA known or suspected.",
      "Hypersensitivity to chosen agent.",
    ]},
    { id: "treatment", type: "comparison", title: "Step-wise treatment", intro: "Match treatment to extent and severity.", columns: [
      { label: "Step 1 — Localised non-bullous", rows: [
        { heading: "First-line", body: "Hydrogen peroxide 1% cream (Crystacide) applied 2–3 times daily for 5 days." },
        { heading: "When to step up", body: "If hydrogen peroxide unsuitable (e.g. lesions near eyes) or no improvement at 5 days." },
      ]},
      { label: "Step 2 — Localised, hydrogen peroxide failed/unsuitable", rows: [
        { heading: "Topical antibiotic", body: "Fusidic acid 2% cream 3 times daily for 5 days." },
        { heading: "Alternative", body: "Mupirocin 2% cream 3 times daily for 5 days (especially if MRSA risk)." },
        { heading: "Why second-line", body: "Antibiotic stewardship — increasing fusidic acid resistance." },
      ]},
      { label: "Step 3 — Widespread or bullous", rows: [
        { heading: "Oral", body: "Flucloxacillin 500 mg four times daily for 5 days." },
        { heading: "Penicillin-allergic", body: "Clarithromycin 250 mg twice daily for 5 days, OR erythromycin if pregnant." },
        { heading: "Reserved for", body: "Widespread, bullous, systemic features, treatment failure." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling — every patient", items: [
      { label: "Highly contagious", detail: "Direct skin contact and contaminated surfaces. Avoid touching lesions; wash hands frequently." },
      { label: "Return to school/work", detail: "Stay away until lesions are crusted/dried, OR 48 hours after starting antibiotic treatment." },
      { label: "Don't share towels, clothing, bedding", detail: "Hot wash daily for the duration." },
      { label: "Cover lesions where possible", detail: "Loose dressing or clothing." },
      { label: "Wash hands after touching", detail: "And after applying treatment." },
      { label: "Complete the course", detail: "Even if better." },
      { label: "Expected timeline", detail: "Improvement within 3 days; resolution by 7–10 days. Return if worse, fever develops, or no improvement at 5 days." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer", tone: "danger", message: "Refer for any of these.", detail: [
      "Fever, lymphangitis, malaise — systemic infection.",
      "Spreading cellulitis around lesions.",
      "Eczema herpeticum mimicry (vesicular spread, unwell).",
      "Recurrent impetigo (more than 2 episodes/year) — needs decolonisation.",
      "Treatment failure at 7 days.",
      "Babies under 1 year.",
      "Suspected MRSA (treatment-resistant, occupational exposure).",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Honey-coloured crusts = classic impetigo.",
      "Step 1: hydrogen peroxide 1% for localised. Step 2: topical fusidic acid. Step 3: oral flucloxacillin.",
      "Bullous, widespread, systemic features → oral antibiotic.",
      "School/work exclusion until crusted or 48h on antibiotic.",
      "Recurrent or systemic → refer.",
    ]},
  ],
  quiz: [
    { id: "q-first-line", type: "single-choice", critical: true, question: "Localised single-area impetigo on a 25-year-old's arm. First-line PGD?", options: [
      { id: "a", label: "Oral flucloxacillin." }, { id: "b", label: "Hydrogen peroxide 1% cream 2–3 times daily for 5 days." }, { id: "c", label: "Fusidic acid cream." }, { id: "d", label: "Topical hydrocortisone." }
    ], correctOptionIds: ["b"], explanation: "NICE 2020+ recommends hydrogen peroxide first-line for localised impetigo, to reduce antibiotic resistance. Topical antibiotic only if hydrogen peroxide fails or unsuitable." },
    { id: "q-widespread", type: "single-choice", critical: true, question: "Widespread impetigo on face, arms, and legs in an otherwise well adult. PGD treatment?", options: [
      { id: "a", label: "Hydrogen peroxide cream." }, { id: "b", label: "Oral flucloxacillin 500 mg QDS for 5 days." }, { id: "c", label: "Topical fusidic acid alone." }, { id: "d", label: "Refer urgently." }
    ], correctOptionIds: ["b"], explanation: "Widespread impetigo needs oral antibiotic. Flucloxacillin first-line (clarithromycin if penicillin-allergic)." },
    { id: "q-baby", type: "single-choice", critical: true, question: "A 4-month-old baby has impetigo. Action?", options: [
      { id: "a", label: "Hydrogen peroxide." }, { id: "b", label: "Refer to GP. Babies under 1 year are outside the PGD." }, { id: "c", label: "Oral flucloxacillin." }, { id: "d", label: "Topical antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Under 1 year is outside PGD. Refer for medical assessment." },
    { id: "q-systemic", type: "single-choice", critical: true, question: "Patient with impetigo, fever 38.5°C, spreading redness. Action?", options: [
      { id: "a", label: "Hydrogen peroxide cream." }, { id: "b", label: "Refer — systemic features and spreading redness suggest cellulitis or deeper infection; needs urgent medical review." }, { id: "c", label: "Flucloxacillin orally per PGD." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Fever + spreading redness suggests beyond simple impetigo. Refer for proper assessment and possibly higher-dose / IV antibiotic." },
    { id: "q-contagion", type: "single-choice", question: "When can a child return to school?", options: [
      { id: "a", label: "Immediately." }, { id: "b", label: "When lesions are crusted/dried, OR 48 hours after starting antibiotic treatment." }, { id: "c", label: "After 2 weeks." }, { id: "d", label: "When all lesions have completely cleared." }
    ], correctOptionIds: ["b"], explanation: "Standard exclusion rule for impetigo. Either crusted lesions OR 48 hours of antibiotic." },
    { id: "q-fusidic", type: "single-choice", question: "Why is fusidic acid not first-line per current NICE guidance?", options: [
      { id: "a", label: "Side effects." }, { id: "b", label: "Antibiotic stewardship — increasing fusidic acid resistance. Hydrogen peroxide is first-line for localised impetigo." }, { id: "c", label: "It's ineffective." }, { id: "d", label: "Too expensive." }
    ], correctOptionIds: ["b"], explanation: "Fusidic acid resistance has risen significantly. Modern guidance reserves it for cases where hydrogen peroxide is unsuitable or has failed." },
    { id: "q-pen-allergy", type: "single-choice", question: "Patient with widespread impetigo is allergic to penicillin (anaphylaxis in past). Alternative oral?", options: [
      { id: "a", label: "Flucloxacillin." }, { id: "b", label: "Clarithromycin 250 mg BD for 5 days. (Erythromycin if pregnant.)" }, { id: "c", label: "Doxycycline." }, { id: "d", label: "Cefalexin." }
    ], correctOptionIds: ["b"], explanation: "Macrolide is the standard alternative for penicillin allergy. Cephalosporins have cross-reactivity risk in severe penicillin allergy." },
    { id: "q-recurrent", type: "single-choice", question: "Patient has had 3 episodes of impetigo in the past year. Action?", options: [
      { id: "a", label: "Treat each episode under PGD." }, { id: "b", label: "Refer to GP — recurrent impetigo needs investigation for Staph carriage and possible nasal decolonisation (mupirocin, chlorhexidine washes)." }, { id: "c", label: "Prophylactic antibiotic." }, { id: "d", label: "Topical steroid." }
    ], correctOptionIds: ["b"], explanation: "Recurrent impetigo often reflects Staph carriage (nasal or perianal). Decolonisation regimens are GP-led." },
    { id: "q-eczema-mimic", type: "single-choice", question: "Patient with eczema has new cluster of small vesicles spreading over the eczematous skin, feels unwell. Could this be impetigo?", options: [
      { id: "a", label: "Yes — treat with PGD." }, { id: "b", label: "Possibly, but this also fits eczema herpeticum. Refer to A&E given systemic symptoms — eczema herpeticum is an emergency." }, { id: "c", label: "Definitely impetigo." }, { id: "d", label: "Definitely eczema flare." }
    ], correctOptionIds: ["b"], explanation: "Vesicular spreading lesion in atopic patient with systemic symptoms could be eczema herpeticum (HSV) — must be ruled out at A&E rather than treated as bacterial impetigo." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Distribution (localised vs widespread), bullous vs non-bullous, systemic features assessed and excluded, step chosen, contagion counselling — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates that step-wise approach was followed and systemic features assessed." },
  ],
};
