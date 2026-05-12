// Travellers' diarrhoea — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const travellersDiarrhoeaModule: TrainingModule = {
  slug: "travellers-diarrhoea",
  title: "Travellers' Diarrhoea — PGD",
  description: "Standby antibiotic supply for moderate-severe travellers' diarrhoea, plus oral rehydration and prevention counselling.",
  pgdSlugs: ["travellers-diarrhoea"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 8,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Travellers' Diarrhoea — Training", subtitle: "Self-treat standby antibiotic + ORS pre-travel package", estimatedMinutes: 8, objectives: [
      "Identify travellers who would benefit from standby antibiotic supply.",
      "Choose between azithromycin and ciprofloxacin based on destination.",
      "Counsel on hydration, food/water precautions, and red flags.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Travellers' diarrhoea affects up to 50% of travellers to high-risk areas. Mostly self-limiting bacterial infection (E. coli most common; Campylobacter, Salmonella, Shigella also).",
      "Standby antibiotic supply allows self-treatment of moderate-severe episodes without delays. Combined with oral rehydration salts (ORS) and loperamide for symptom control.",
      "Most episodes resolve in 3–5 days. Antibiotics shorten to 24–36 hours when started in moderate-severe diarrhoea (>4 stools/day, fever, blood/mucus).",
    ], highlights: ["Standby antibiotic for moderate-severe (>4 stools, fever, blood).", "Azithromycin first-line for SE Asia (quinolone resistance high); ciprofloxacin for most others.", "Hydration is the foundation."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Travel to area with high TD risk", detail: "South Asia, Africa, Latin America. Check TravelHealthPro." },
      { label: "Adult, 18+", detail: "Children — different dosing, refer." },
      { label: "Not pregnant or breastfeeding", detail: "Refer for safer alternative agents (azithromycin generally OK in pregnancy)." },
      { label: "No allergy to chosen agent", detail: "Quinolone allergy — use azithromycin. Macrolide allergy — refer." },
      { label: "Understands self-treat criteria", detail: "Only use for moderate-severe (>4 stools, blood/mucus, fever, severe abdominal pain). Don't routinely treat every loose stool." },
    ]},
    { id: "agents", type: "comparison", title: "Standby antibiotic choice", intro: "Match to destination resistance patterns.", columns: [
      { label: "Azithromycin 500 mg OD x 3 days", rows: [
        { heading: "Best for", body: "South Asia, SE Asia — high fluoroquinolone resistance in Campylobacter and other enteric pathogens. Pregnancy-acceptable." },
        { heading: "Alternative regimen", body: "1 g single dose (more emetogenic but adherence advantage)." },
        { heading: "Counsel", body: "Take with food if nausea." },
      ]},
      { label: "Ciprofloxacin 500 mg BD x 3 days", rows: [
        { heading: "Best for", body: "Africa, Latin America, Middle East — where Campylobacter quinolone resistance is lower." },
        { heading: "Avoid", body: "South / SE Asia. Pregnancy. Children. Concurrent tizanidine or theophylline. Tendinopathy history." },
        { heading: "Counsel", body: "Avoid antacids/iron/dairy within 2 hours. Photosensitivity. Rare tendinopathy / aortic events." },
      ]},
    ]},
    { id: "supportive", type: "checklist", title: "Supportive management — primary intervention", intro: "Hydration is more important than antibiotics for most cases.", items: [
      { label: "Oral rehydration salts (ORS)", detail: "Provide WHO-formulation sachets in travel kit. Replace fluid and electrolytes. Drink 1–2 L during episode." },
      { label: "Loperamide", detail: "Acceptable for symptom control in adult non-dysenteric diarrhoea (no blood, no fever). Up to 16 mg/day. AVOID if bloody diarrhoea or high fever — may worsen invasive infection." },
      { label: "Food", detail: "Continue eating bland food (rice, bananas, toast) as tolerated. Avoid dairy, caffeine, alcohol, spicy/fatty food." },
      { label: "When to start antibiotic", detail: "Moderate-severe symptoms: >4 watery stools/day, fever, bloody/mucoid stools, severe abdominal pain, or symptoms preventing activities. Single-day mild diarrhoea = ORS + loperamide alone." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — seek medical care", tone: "danger", message: "Don't self-treat these.", detail: [
      "Blood in stool with fever and abdominal pain.",
      "High fever (>39°C) persisting beyond 48 hours of antibiotic.",
      "Signs of dehydration despite ORS (dry mucous membranes, low urine output, dizziness, confusion).",
      "Symptoms persisting beyond 5–7 days with no improvement.",
      "Returning traveller with persistent diarrhoea — possible giardiasis, amoebiasis, post-infectious IBS, IBD.",
      "Persistent fever post-travel — exclude malaria.",
      "Pregnancy with severe symptoms.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Standby antibiotic for moderate-severe TD (>4 stools, blood, fever).",
      "Azithromycin first-line for South / SE Asia. Ciprofloxacin for most other destinations.",
      "Hydration with ORS is foundational. Loperamide OK for non-dysenteric symptom control.",
      "Pre-travel food/water hygiene: bottled/boiled water, avoid ice/salads/undercooked food.",
      "Refer: bloody diarrhoea + fever, prolonged symptoms, returning traveller with persistent illness.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant traveller wants TD standby. Action?", options: [
      { id: "a", label: "Ciprofloxacin." }, { id: "b", label: "Azithromycin (acceptable in pregnancy) — 500 mg OD x 3 days. Ciprofloxacin avoided in pregnancy." }, { id: "c", label: "Loperamide only." }, { id: "d", label: "No treatment." }
    ], correctOptionIds: ["b"], explanation: "Quinolones contraindicated in pregnancy. Azithromycin is pregnancy-acceptable and has good enteric coverage." },
    { id: "q-asia", type: "single-choice", critical: true, question: "Patient travelling to Thailand. Standby antibiotic?", options: [
      { id: "a", label: "Ciprofloxacin." }, { id: "b", label: "Azithromycin — fluoroquinolone resistance high in Campylobacter in South/SE Asia. Azithromycin first-line for this region." }, { id: "c", label: "Doxycycline." }, { id: "d", label: "Cefalexin." }
    ], correctOptionIds: ["b"], explanation: "SE Asia has high Campylobacter quinolone resistance. Azithromycin is first-line." },
    { id: "q-blood-fever", type: "single-choice", critical: true, question: "Traveller has bloody diarrhoea with fever 39.5°C. Use loperamide?", options: [
      { id: "a", label: "Yes." }, { id: "b", label: "No — loperamide is contraindicated in dysenteric diarrhoea (blood + fever). Can prolong invasive infection. Start antibiotic + ORS + medical assessment." }, { id: "c", label: "Half dose loperamide." }, { id: "d", label: "Loperamide + antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Loperamide contraindicated in dysentery. Slows clearance of invasive organisms. Antibiotic and assessment instead." },
    { id: "q-when-to-treat", type: "single-choice", critical: true, question: "Traveller has 2 loose stools today, no fever, no blood, no other symptoms. Action?", options: [
      { id: "a", label: "Antibiotic." }, { id: "b", label: "ORS + loperamide if needed. Mild diarrhoea typically self-limits in 1–2 days. Save standby antibiotic for moderate-severe (>4 stools, fever, blood)." }, { id: "c", label: "Loperamide alone." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Mild diarrhoea = supportive care only. Standby antibiotic is for moderate-severe symptoms. Antibiotic stewardship matters." },
    { id: "q-returning-traveller", type: "single-choice", critical: true, question: "Returned from Egypt 4 weeks ago. Has persistent intermittent diarrhoea and bloating. Action?", options: [
      { id: "a", label: "Antibiotic course." }, { id: "b", label: "Refer GP — persistent diarrhoea in returning traveller needs stool tests for parasites (Giardia, amoebiasis), post-infectious IBS, IBD. Antibiotic empirically not appropriate." }, { id: "c", label: "Loperamide." }, { id: "d", label: "ORS." }
    ], correctOptionIds: ["b"], explanation: "Returning-traveller persistent diarrhoea has different differential. Stool tests for parasites essential. GP-led workup." },
    { id: "q-cipro-interaction", type: "single-choice", question: "Patient on tizanidine wants ciprofloxacin standby. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Contraindicated — ciprofloxacin significantly raises tizanidine levels (severe hypotension, sedation). Use azithromycin instead." }, { id: "c", label: "Halve doses." }, { id: "d", label: "Stop tizanidine for trip." }
    ], correctOptionIds: ["b"], explanation: "Tizanidine + ciprofloxacin = significant interaction. Azithromycin alternative." },
    { id: "q-dose", type: "single-choice", question: "Azithromycin TD regimen?", options: [
      { id: "a", label: "500 mg OD x 7 days." }, { id: "b", label: "500 mg OD x 3 days (or single 1 g dose)." }, { id: "c", label: "250 mg BD x 5 days." }, { id: "d", label: "100 mg daily." }
    ], correctOptionIds: ["b"], explanation: "3-day course or single 1 g. Short and effective." },
    { id: "q-hydration", type: "single-choice", question: "Most important intervention for TD?", options: [
      { id: "a", label: "Antibiotic." }, { id: "b", label: "Hydration with ORS — replaces fluid and electrolytes. Most TD self-limits with hydration alone." }, { id: "c", label: "Loperamide." }, { id: "d", label: "Antimotility + antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Hydration is the cornerstone. Antibiotics shorten illness but most resolve with ORS alone." },
    { id: "q-prevention", type: "single-choice", question: "Single best prevention strategy?", options: [
      { id: "a", label: "Prophylactic antibiotic for whole trip." }, { id: "b", label: "Food and water hygiene: bottled/boiled water, avoid ice, peel/cook food yourself, wash hands. Prophylactic antibiotics generally not recommended due to resistance and side effects." }, { id: "c", label: "Daily probiotic." }, { id: "d", label: "Bismuth subsalicylate." }
    ], correctOptionIds: ["b"], explanation: "Food and water hygiene is the foundation. Prophylactic antibiotic not routinely recommended." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Destination, agent chosen with rationale (destination resistance), contraindications excluded, self-treat criteria counselled (when to start, when to refer), ORS + loperamide provided — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record captures the regional rationale (azithromycin Asia vs cipro elsewhere) and the comprehensive supply." },
  ],
};
