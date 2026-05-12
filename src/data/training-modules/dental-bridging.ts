// Dental pain — bridging analgesia and antibiotic — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const dentalBridgingModule: TrainingModule = {
  slug: "dental-bridging",
  title: "Dental Pain — Bridging — PGD",
  description: "Bridging analgesia and antibiotic supply for dental infection while patient awaits dental care under PGD.",
  pgdSlugs: ["dental-bridging"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 8,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Dental Bridging — Training", subtitle: "Antibiotic + analgesia while awaiting definitive dental care", estimatedMinutes: 8, objectives: [
      "Recognise dental infections needing antibiotic bridging vs needing emergency dental.",
      "Apply correct antibiotic choice and signpost urgent dental services.",
      "Recognise red flags requiring A&E (Ludwig's angina, severe spreading infection).",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Dental infections (pulpitis, dental abscess, periodontal abscess) usually need definitive dental treatment (drainage, root canal, extraction). Antibiotics are bridging — manage pain and prevent spread until dental care available.",
      "Inappropriate dental antibiotic prescribing drives resistance. Use ONLY when there's evidence of spreading infection (cellulitis, lymphadenopathy, systemic symptoms) — not for uncomplicated pulpitis (which needs dental care, not antibiotic).",
      "Always signpost to urgent NHS dental access. The patient needs definitive dental treatment, not just antibiotics.",
    ], highlights: ["Antibiotics bridge — they don't replace dental treatment.", "Uncomplicated pulpitis = analgesia + urgent dental, NOT antibiotic.", "Severe spreading infection = A&E (Ludwig's angina is airway emergency)."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18+", detail: "Children — refer dental." },
      { label: "Evidence of spreading dental infection", detail: "Facial swelling, cellulitis, regional lymphadenopathy, fever, systemic symptoms. Without these, antibiotic is not indicated." },
      { label: "Dental appointment confirmed within 5 days", detail: "Antibiotic bridges to dental care, not a substitute. Confirm appointment booked." },
      { label: "Not allergic to chosen agent", detail: "Penicillin allergy — use clarithromycin or metronidazole." },
      { label: "Not pregnant — refer for safer agent", detail: "Amoxicillin and metronidazole used in pregnancy if needed; refer." },
      { label: "Adequate analgesia plan", detail: "Paracetamol + ibuprofen first-line. Counsel on dosing." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer for these.", detail: [
      "Severe facial swelling extending to neck or floor of mouth — possible Ludwig's angina, airway emergency. 999.",
      "Difficulty swallowing, drooling, breathing difficulty — A&E.",
      "Trismus (unable to open mouth) with fever — possible deep neck space infection.",
      "Significant systemic illness, sepsis features.",
      "Pulpitis without spreading infection — analgesia + urgent dental, NO antibiotic.",
      "Pregnancy — refer for safe regimen choice.",
      "Children — refer paediatric dental / GP.",
      "Failure of previous antibiotic course — refer.",
      "Patient unable to access dental care — signpost NHS 111 or NHS urgent dental.",
    ]},
    { id: "treatment", type: "checklist", title: "Treatment options", intro: "Per BNF / SDCEP dental guidance.", items: [
      { label: "First-line: Amoxicillin 500 mg TDS for 5 days", detail: "Most dental infections respond. Take with food if GI side effects." },
      { label: "Anaerobic involvement: add Metronidazole 400 mg TDS for 5 days", detail: "Particularly for periodontal abscess or anaerobic-predominant. Counsel alcohol-avoidance (disulfiram reaction) during course + 48h after." },
      { label: "Penicillin allergy: Clarithromycin 500 mg BD for 5 days", detail: "OR metronidazole alone for anaerobic infection." },
      { label: "Analgesia", detail: "Paracetamol 1 g QDS + ibuprofen 400 mg TDS, scheduled (not just PRN). Adequate analgesia is more important than antibiotic for uncomplicated pulpitis. Codeine for breakthrough pain." },
      { label: "Signpost urgent dental", detail: "NHS 111 for out-of-hours dental. NHS dental access services. Private dental if needed. Confirm appointment booked." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Antibiotic bridge ONLY when spreading infection signs (swelling, lymphadenopathy, fever).",
      "Uncomplicated pulpitis = analgesia + urgent dental, not antibiotic.",
      "Amoxicillin 500 mg TDS first-line. + Metronidazole if anaerobic. Clarithromycin if penicillin-allergic.",
      "Refer A&E: Ludwig's angina, airway compromise, severe systemic illness.",
      "Signpost urgent dental — antibiotic doesn't substitute for definitive treatment.",
    ]},
  ],
  quiz: [
    { id: "q-ludwigs", type: "single-choice", critical: true, question: "Patient has severe swelling under the chin and floor of mouth, drooling, can't swallow. Action?", options: [
      { id: "a", label: "Amoxicillin." }, { id: "b", label: "999 / A&E urgently — Ludwig's angina (bilateral submandibular abscess), airway emergency. Time-critical." }, { id: "c", label: "Metronidazole." }, { id: "d", label: "Analgesia." }
    ], correctOptionIds: ["b"], explanation: "Ludwig's angina has fast airway compromise. Don't delay with pharmacy treatment; 999." },
    { id: "q-pulpitis", type: "single-choice", critical: true, question: "Patient has severe toothache, no swelling, no fever, no lymphadenopathy. Action?", options: [
      { id: "a", label: "Amoxicillin." }, { id: "b", label: "Analgesia (paracetamol + ibuprofen scheduled) + urgent dental signposting. Uncomplicated pulpitis is NOT an antibiotic indication." }, { id: "c", label: "Metronidazole." }, { id: "d", label: "Codeine alone." }
    ], correctOptionIds: ["b"], explanation: "Uncomplicated pulpitis = analgesia + dental, not antibiotic. Antibiotic prescribing for pulpitis is a major antimicrobial stewardship target." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient with dental abscess and facial cellulitis. Action?", options: [
      { id: "a", label: "Standard amoxicillin." }, { id: "b", label: "Refer urgent dental + GP. Pregnancy dental antibiotic considerations and urgent dental access." }, { id: "c", label: "Topical." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy outside PGD. Refer urgently — pregnancy dental infections need timely management." },
    { id: "q-spreading", type: "single-choice", critical: true, question: "Patient has tooth pain plus visible facial swelling and submandibular lymphadenopathy. Action?", options: [
      { id: "a", label: "Analgesia only." }, { id: "b", label: "Amoxicillin 500 mg TDS for 5 days + analgesia + urgent dental signposting." }, { id: "c", label: "Refer A&E unnecessarily." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Spreading infection signs (swelling, lymphadenopathy) = antibiotic indication + dental. Refer A&E if airway compromise or systemic illness." },
    { id: "q-metronidazole-alcohol", type: "single-choice", question: "Patient on metronidazole for dental — important counselling?", options: [
      { id: "a", label: "Take with milk." }, { id: "b", label: "Strict alcohol avoidance during course AND 48 hours after. Disulfiram-like reaction (nausea, vomiting, flushing, tachycardia)." }, { id: "c", label: "Avoid sunlight." }, { id: "d", label: "Take in evening only." }
    ], correctOptionIds: ["b"], explanation: "Metronidazole-alcohol interaction — disulfiram-like reaction. Critical counselling." },
    { id: "q-pen-allergy", type: "single-choice", question: "Patient with severe penicillin allergy has dental infection with cellulitis. Alternative?", options: [
      { id: "a", label: "Amoxicillin at half dose." }, { id: "b", label: "Clarithromycin 500 mg BD for 5 days (or metronidazole 400 mg TDS for anaerobic predominance)." }, { id: "c", label: "Cefalexin." }, { id: "d", label: "Doxycycline." }
    ], correctOptionIds: ["b"], explanation: "Macrolide for penicillin allergy. Metronidazole for anaerobic-predominant infections." },
    { id: "q-dental-appointment", type: "single-choice", question: "Patient says he can't get dental appointment for 2 weeks. Action?", options: [
      { id: "a", label: "Supply antibiotic." }, { id: "b", label: "Signpost NHS 111 / urgent dental access — emergency dental services should be accessible within days. Without timely definitive care, antibiotics alone won't resolve. Help him find urgent appointment first." }, { id: "c", label: "Higher-dose antibiotic." }, { id: "d", label: "Repeat course in 1 week." }
    ], correctOptionIds: ["b"], explanation: "Signpost urgent dental access. Antibiotics without definitive care = recurrence and resistance. NHS 111 has urgent dental pathway." },
    { id: "q-airway", type: "single-choice", question: "Concerning features for urgent A&E vs pharmacy management?", options: [
      { id: "a", label: "All dental infections to A&E." }, { id: "b", label: "Airway compromise (drooling, difficulty swallowing, voice change), Ludwig's angina (bilateral floor-of-mouth swelling), trismus with fever, systemic sepsis features." }, { id: "c", label: "Only severe pain." }, { id: "d", label: "Only fever." }
    ], correctOptionIds: ["b"], explanation: "Airway-related features are A&E. Spreading cellulitis with systemic illness too." },
    { id: "q-analgesia-priority", type: "single-choice", question: "Patient with uncomplicated pulpitis. Most useful intervention?", options: [
      { id: "a", label: "Antibiotic." }, { id: "b", label: "Scheduled paracetamol + ibuprofen (alternating or together at peak intervals) — adequate analgesia bridges to dental. Often more effective than antibiotic." }, { id: "c", label: "Codeine alone." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Scheduled paracetamol + ibuprofen is highly effective for dental pain. Often underused. Antibiotics don't fix pulpitis." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Symptoms, evidence of spreading infection (or noted absence), dental appointment confirmed within 5 days, agent and analgesia plan, signposting given — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates antibiotic stewardship rationale and confirms onward dental care plan." },
  ],
};
