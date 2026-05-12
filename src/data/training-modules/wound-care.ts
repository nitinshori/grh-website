// Wound care — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const woundCareModule: TrainingModule = {
  slug: "wound-care",
  title: "Wound Care — PGD",
  description: "Assessment and supply of antibiotics / wound dressings for minor wounds and minor infected wounds under PGD.",
  pgdSlugs: ["wound-care"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Wound Care — Training", subtitle: "Minor wounds and minor infected wounds in adults", estimatedMinutes: 12, objectives: [
      "Recognise minor wounds suitable for PGD treatment vs those needing referral.",
      "Differentiate uninfected vs infected wounds; apply step-wise treatment.",
      "Counsel on cleaning, dressing, tetanus status, and red flags.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Minor wounds include abrasions, lacerations <2 cm and not gaping, superficial puncture wounds, and small infected wounds (minor cellulitis) without systemic features.",
      "Most need cleaning, appropriate dressing, and tetanus assessment. Antibiotic only indicated for clearly infected wounds (erythema beyond margin, warmth, swelling, pus) or specific high-risk wound types.",
    ], highlights: ["Most minor wounds need cleaning + dressing, not antibiotics.", "Antibiotic for clearly infected wounds: oral flucloxacillin.", "Always check tetanus status."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 16+", detail: "Children — refer (paediatric assessment, safeguarding considerations)." },
      { label: "Wound is minor", detail: "Not gaping, not deep, not on face/joint, not requiring stitches, not penetrating, not crush injury." },
      { label: "If infected, minor cellulitis only", detail: "Localised erythema, warmth, pus. No systemic features, no spreading lymphangitis." },
      { label: "Tetanus status known or up to date", detail: "Last dose <10 years for low-risk; <5 years for tetanus-prone wound. Uncertain status with tetanus-prone wound — refer urgent care." },
      { label: "Wound clean and dry (or cleanable in pharmacy)", detail: "Heavily contaminated, foreign body, or unable to clean — refer." },
      { label: "Not bite wound", detail: "Animal/human bites need different antibiotic (co-amoxiclav) and proper assessment — refer." },
      { label: "Not pregnant or breastfeeding for oral antibiotic", detail: "Topical / dressing supply OK; oral antibiotic refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer for any of these.", detail: [
      "Deep wound, gaping wound, wound requiring stitches.",
      "Wound on face, joint, neck, palm, sole, genitals.",
      "Penetrating injury (nail through foot, stab wound).",
      "Animal or human bite (co-amoxiclav, possible rabies considerations).",
      "Crush injury — risk of compartment syndrome.",
      "Heavily contaminated wound (soil, faeces) without cleaning.",
      "Suspected foreign body in wound.",
      "Wound with reduced sensation (e.g. diabetic foot).",
      "Systemic features: fever, malaise, spreading erythema, lymphangitis — refer.",
      "Suspected necrotising fasciitis (severe pain out of proportion, rapid spread, systemic illness, skin discoloration) — 999.",
      "Patient on immunosuppression, poor circulation, diabetes — lower threshold for refer.",
      "Tetanus-prone wound + uncertain immunisation — urgent care for tetanus immunoglobulin / vaccination.",
    ]},
    { id: "approach", type: "checklist", title: "Step-wise approach", intro: "Most minor wounds: clean + dress + tetanus check.", items: [
      { label: "Step 1 — Clean", detail: "Irrigate with sterile saline or clean running water. Remove visible debris. Don't use antiseptic on open wound (can delay healing); use plain water/saline." },
      { label: "Step 2 — Assess", detail: "Depth, length, contamination, signs of infection, neurovascular function. Decide treat-vs-refer." },
      { label: "Step 3 — Dress", detail: "Choose dressing by wound type: hydrocolloid for shallow; alginate for exuding; foam for moderate exudate; film for superficial." },
      { label: "Step 4 — Tetanus", detail: "Last dose <10 years for low-risk: no action. <5 years for tetanus-prone: no action. Otherwise refer for booster ± immunoglobulin." },
      { label: "Step 5 — Antibiotic only if infected", detail: "Flucloxacillin 500 mg QDS 5–7 days. Clarithromycin if penicillin-allergic. Mark wound margin so progression can be assessed." },
      { label: "Step 6 — Safety-net", detail: "Return if no improvement at 48 hours, worsening, fever, spreading redness." },
    ]},
    { id: "tetanus", type: "callout", title: "Tetanus assessment", tone: "warning", message: "Always assess at every wound encounter.", detail: [
      "Tetanus-prone wound: heavily contaminated (soil, manure), devitalised tissue, puncture wound, animal contact, delayed presentation >6 hours.",
      "High-risk tetanus-prone: heavy contamination + extensive devitalisation.",
      "Last tetanus booster within 10 years AND non-tetanus-prone wound = no action.",
      "Last booster within 5 years AND tetanus-prone = no action.",
      "Last booster within 10 years but tetanus-prone = consider booster; immunoglobulin not needed.",
      "Unknown / >10 years / incomplete primary = refer for full course / booster ± immunoglobulin per status.",
      "Always refer if uncertain — tetanus is preventable but devastating.",
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Keep wound clean and dry", detail: "Change dressing per type (usually every 2–3 days for moderate-exudate dressings)." },
      { label: "Signs of infection to watch for", detail: "Increasing redness extending beyond wound margin, warmth, swelling, pus, fever, red streaks (lymphangitis)." },
      { label: "Complete antibiotic course if supplied", detail: "Even if better." },
      { label: "Pain relief", detail: "Paracetamol / ibuprofen as needed." },
      { label: "Don't pick at scabs", detail: "Allow natural healing. Scarring worse if disturbed." },
      { label: "Return advice", detail: "Worsening, no improvement at 48 hours, fever, spreading redness, severe pain." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — A&E / urgent care", tone: "danger", message: "These warrant urgent assessment.", detail: [
      "Necrotising fasciitis features — severe pain out of proportion, rapid spread, dark/dusky skin, crepitus, systemic illness. 999.",
      "Significant fever or systemic upset.",
      "Spreading cellulitis / lymphangitis.",
      "Loss of distal pulse or sensation.",
      "Wound on hand/foot in a diabetic.",
      "Animal or human bite anywhere.",
      "Suspected fracture beneath the wound.",
      "Suspected non-accidental injury — safeguarding referral.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Most minor wounds = clean + dress + tetanus check. Antibiotic only for clearly infected.",
      "Flucloxacillin 500 mg QDS 5–7 days for minor wound infection; clarithromycin if penicillin allergic.",
      "Refer: deep / face / joint / palm-sole / bite / crush / contaminated / penetrating / diabetic-foot / immunosuppressed.",
      "Tetanus status check at every wound encounter.",
      "Red flags: necrotising fasciitis, systemic features, spreading cellulitis.",
    ]},
  ],
  quiz: [
    { id: "q-necrotising", type: "single-choice", critical: true, question: "Patient has rapidly spreading wound erythema, severe pain out of proportion, dusky skin discoloration, feels systemically unwell. Action?", options: [
      { id: "a", label: "Topical antibiotic." }, { id: "b", label: "999 / A&E urgently — clinical features suggest necrotising fasciitis, a surgical emergency." }, { id: "c", label: "Oral flucloxacillin." }, { id: "d", label: "Wound dressing." }
    ], correctOptionIds: ["b"], explanation: "Necrotising fasciitis kills fast and needs urgent surgical debridement. Pain out of proportion + dusky skin + systemic illness = 999." },
    { id: "q-bite", type: "single-choice", critical: true, question: "Patient with dog bite to hand 3 hours ago, mild redness around bite. Action?", options: [
      { id: "a", label: "Flucloxacillin." }, { id: "b", label: "Refer to urgent care — bites need different antibiotic (co-amoxiclav) for mixed flora including anaerobes; hand bites are high-risk for deep-tissue infection; rabies risk if abroad." }, { id: "c", label: "Topical antibiotic." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Bites (especially hand bites) need co-amoxiclav and proper assessment. Outside this PGD's scope." },
    { id: "q-tetanus", type: "single-choice", critical: true, question: "Patient stepped on a rusty nail in the garden, last tetanus 'maybe 15 years ago, not sure'. Wound puncture, contaminated. Action?", options: [
      { id: "a", label: "Flucloxacillin and dressing." }, { id: "b", label: "Refer urgent care for tetanus assessment — likely needs full booster and possibly tetanus immunoglobulin for this tetanus-prone wound." }, { id: "c", label: "Tetanus vaccine alone." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Tetanus-prone (puncture, soil contamination) + uncertain immunisation = urgent assessment. Tetanus is preventable but lethal." },
    { id: "q-diabetic-foot", type: "single-choice", critical: true, question: "Diabetic patient with a small wound on the sole of his foot. Action?", options: [
      { id: "a", label: "Standard wound dressing." }, { id: "b", label: "Refer urgently — diabetic foot wounds have high risk of severe infection, osteomyelitis, ulceration. Need urgent diabetic foot service / GP review." }, { id: "c", label: "Topical antibiotic." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Diabetic foot wounds are an entirely different risk category. Refer for urgent multidisciplinary care." },
    { id: "q-antibiotic-when", type: "single-choice", question: "Wound has redness extending 1 cm beyond the margin, warmth, no fever. Action?", options: [
      { id: "a", label: "Topical antibiotic only." }, { id: "b", label: "Oral flucloxacillin 500 mg QDS for 5–7 days for minor wound infection. Mark wound margin to track progression. Safety-net for spreading or systemic features." }, { id: "c", label: "Dressing only." }, { id: "d", label: "IV antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Localised minor cellulitis = oral flucloxacillin per NICE. Marking the wound margin is the standard documentation to assess progression at follow-up." },
    { id: "q-pen-allergy", type: "single-choice", question: "Patient with infected minor wound is severely allergic to penicillin. Alternative?", options: [
      { id: "a", label: "Amoxicillin." }, { id: "b", label: "Clarithromycin 250–500 mg BD for 5–7 days. Erythromycin if pregnant." }, { id: "c", label: "Cefalexin." }, { id: "d", label: "Doxycycline." }
    ], correctOptionIds: ["b"], explanation: "Macrolide is the standard alternative for severe penicillin allergy. Cephalosporins have cross-reactivity risk." },
    { id: "q-cleaning", type: "single-choice", question: "How should a minor wound be cleaned?", options: [
      { id: "a", label: "Strong antiseptic and scrub vigorously." }, { id: "b", label: "Irrigate with sterile saline or clean running water; remove visible debris. Avoid antiseptics on open wound (delay healing)." }, { id: "c", label: "Hydrogen peroxide foam." }, { id: "d", label: "Alcohol wipe." }
    ], correctOptionIds: ["b"], explanation: "Saline or running water is gold standard. Antiseptics impair healing; not used on open wounds." },
    { id: "q-deep", type: "single-choice", question: "Patient has a 4 cm laceration on his forearm, gaping, edges separated. Action?", options: [
      { id: "a", label: "Topical antibiotic and steri-strips." }, { id: "b", label: "Refer to urgent care or A&E for primary closure (sutures, glue, or staples)." }, { id: "c", label: "Adhesive dressing." }, { id: "d", label: "Honey dressing." }
    ], correctOptionIds: ["b"], explanation: "Gaping wounds need primary closure within ~6 hours for best cosmesis and healing. This is outside PGD scope." },
    { id: "q-no-improvement", type: "single-choice", question: "Patient on flucloxacillin 48 hours for wound infection. Redness is spreading further. Action?", options: [
      { id: "a", label: "Continue and review." }, { id: "b", label: "Refer for medical review — spreading cellulitis despite oral antibiotic may need IV antibiotics, alternative agent (MRSA, anaerobes), or hospital admission." }, { id: "c", label: "Double dose." }, { id: "d", label: "Add topical." }
    ], correctOptionIds: ["b"], explanation: "Failure to improve / progression on oral antibiotic warrants medical review urgently." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Wound description (location, size, depth, contamination), infection signs assessed, tetanus status, treatment chosen, safety-net advice — in the ePGD tool. Photo if available." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record including tetanus status is essential. Photographic documentation helpful for monitoring infection progression." },
  ],
};
