// Altitude sickness (acetazolamide prophylaxis) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const altitudeSicknessModule: TrainingModule = {
  slug: "altitude-sickness",
  title: "Altitude Sickness Prophylaxis (Acetazolamide) — PGD",
  description: "Acetazolamide prophylaxis for travellers to high altitude under PGD.",
  pgdSlugs: ["altitude-sickness"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Altitude Sickness — Training", subtitle: "Acetazolamide prophylaxis and AMS recognition", estimatedMinutes: 10, objectives: [
      "Identify high-altitude itineraries where acetazolamide prophylaxis is indicated.",
      "Apply standard dosing schedule.",
      "Counsel on AMS recognition and 'go down' principle.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Altitude sickness affects travellers ascending above ~2500 m, especially rapid ascent. Severity ranges from mild Acute Mountain Sickness (AMS) — headache, nausea, fatigue — to potentially fatal High Altitude Pulmonary Oedema (HAPE) or High Altitude Cerebral Oedema (HACE).",
      "Best prevention: gradual ascent (no more than ~500 m sleeping altitude gain per day above 3000 m, with rest days every 1000 m). Acetazolamide aids acclimatisation when rapid ascent unavoidable or AMS history.",
      "Common itineraries: Cusco/Machu Picchu (~3400–4200 m), La Paz (3600 m), Everest base camp (5380 m), Kilimanjaro (5895 m), Lhasa Tibet (3650 m).",
    ], highlights: ["Acetazolamide aids acclimatisation; doesn't replace gradual ascent.", "Severe AMS / HAPE / HACE = DESCEND immediately.", "Worsening symptoms despite acetazolamide = descend."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Travel involving rapid ascent to altitudes >2500 m, OR previous AMS history", detail: "Includes most trekking in Andes / Himalayas / Kilimanjaro." },
      { label: "Adult, 18+", detail: "Paediatric — refer." },
      { label: "Not pregnant or breastfeeding", detail: "Limited safety data; refer." },
      { label: "No sulfonamide allergy", detail: "Acetazolamide is a sulfa drug; cross-reactivity in sulfa-allergic patients." },
      { label: "No severe renal impairment", detail: "Avoid if eGFR <30." },
      { label: "No severe hepatic impairment", detail: "Avoid." },
      { label: "Not on contraindicated medication", detail: "High-dose aspirin, methenamine; caution with other drugs." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Refer for these.", detail: [
      "Sulfonamide allergy.",
      "Severe renal or hepatic impairment.",
      "Severe COPD / type 2 respiratory failure (acetazolamide can worsen acidosis).",
      "Marked electrolyte disturbance (hypokalaemia, hyponatraemia).",
      "Pregnancy / breastfeeding.",
      "Concurrent high-dose aspirin (salicylate toxicity risk).",
      "Already at altitude with severe symptoms — descend; medical care.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing", intro: "Standard prophylaxis regimen.", items: [
      { label: "Acetazolamide 125–250 mg twice daily", detail: "Lower dose (125 mg BD) is well-tolerated; 250 mg BD for more rapid ascent or AMS history." },
      { label: "Start", detail: "Start 24 hours before ascent above 2500 m." },
      { label: "Continue", detail: "Continue daily during ascent and for 48 hours at highest altitude. Can stop on descent." },
      { label: "Side effects", detail: "Tingling fingers/toes (paraesthesiae) — very common, harmless. Mild diuresis (drink more). Altered taste (especially carbonated drinks taste flat). Mild GI upset. Rare allergy in sulfa-allergic." },
      { label: "Trial dose", detail: "Recommend a trial dose at home a few weeks before travel — confirm tolerability of paraesthesiae and other effects." },
    ]},
    { id: "ams-recognition", type: "callout", title: "AMS recognition and management — counsel every patient", tone: "danger", message: "The 'go down' rule.", detail: [
      "AMS symptoms: headache (cardinal), nausea, fatigue, dizziness, insomnia, anorexia. Develops 6–24 hours after ascent.",
      "Mild AMS: stop ascending, rest, hydrate, paracetamol/ibuprofen for headache, anti-emetic if needed.",
      "Moderate/severe AMS (severe headache, vomiting, ataxia, breathlessness at rest, confusion) = DESCEND immediately. Don't wait. 500–1000 m descent usually adequate.",
      "HAPE (pulmonary): worsening breathlessness, cough, pink frothy sputum, cyanosis. EMERGENCY: descend + dexamethasone + nifedipine if available. Evacuation.",
      "HACE (cerebral): ataxia, confusion, drowsiness, coma. EMERGENCY: descend + dexamethasone. Evacuation.",
      "Never ascend with symptoms.",
      "Acetazolamide does NOT replace descent — symptoms = descend.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Gradual ascent is the foundation; acetazolamide aids when rapid ascent unavoidable.",
      "Acetazolamide 125–250 mg BD, starting 24h before ascent, continuing to 48h at peak.",
      "Sulfa allergy = contraindicated. Pregnancy = refer.",
      "AMS = stop ascending. Severe AMS / HAPE / HACE = DESCEND.",
      "Counsel pre-emptively on recognition and 'go down' rule.",
    ]},
  ],
  quiz: [
    { id: "q-sulfa", type: "single-choice", critical: true, question: "Patient says she had severe allergic reaction to sulfa antibiotic in childhood. Wants acetazolamide for trek. Action?", options: [
      { id: "a", label: "Supply with caution." }, { id: "b", label: "Refer GP — acetazolamide is a sulfonamide derivative with potential cross-reactivity. Risk-benefit specialist judgment." }, { id: "c", label: "Half dose." }, { id: "d", label: "Pre-medicate antihistamine." }
    ], correctOptionIds: ["b"], explanation: "Sulfa allergy + acetazolamide = potential cross-reactivity, especially anaphylaxis. Specialist judgment for benefit vs alternative strategies (gradual ascent emphasised)." },
    { id: "q-severe-ams", type: "single-choice", critical: true, question: "Patient at 4500 m has severe headache, vomiting, can't walk straight. Action?", options: [
      { id: "a", label: "Double acetazolamide." }, { id: "b", label: "Descend immediately — moderate/severe AMS with ataxia approaching HACE. Don't try to push through with medication. 500–1000 m descent. Evacuation if not improving rapidly." }, { id: "c", label: "Rest at altitude." }, { id: "d", label: "Antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Ataxia + severe headache + vomiting = pre-HACE. Descend is the only safe management. Drug is an adjunct, not a substitute." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman trekking in Peru wants acetazolamide. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer specialist. Limited pregnancy safety data. Encourage slow gradual ascent. Specialist input." }, { id: "c", label: "Half dose." }, { id: "d", label: "Single dose." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy + acetazolamide has limited safety data. Gradual ascent strategy may be safer. Specialist input." },
    { id: "q-respiratory-failure", type: "single-choice", critical: true, question: "Patient with severe COPD (FEV1 35%) wants acetazolamide for travel. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer respiratory specialist. Acetazolamide is a carbonic anhydrase inhibitor that promotes metabolic acidosis — risky in COPD with type 2 respiratory failure. May worsen hypercapnia." }, { id: "c", label: "Half dose." }, { id: "d", label: "Trial dose." }
    ], correctOptionIds: ["b"], explanation: "Severe COPD with potential T2RF is a contraindication. Refer for specialist alternative strategies (gradual ascent, possibly portable oxygen)." },
    { id: "q-dosing", type: "single-choice", question: "Acetazolamide prophylaxis dose?", options: [
      { id: "a", label: "1000 mg daily." }, { id: "b", label: "125–250 mg twice daily, starting 24h before ascent, continuing through peak altitude + 48h." }, { id: "c", label: "500 mg once daily." }, { id: "d", label: "50 mg daily." }
    ], correctOptionIds: ["b"], explanation: "125–250 mg BD is the standard prophylactic dose. Lower (125 mg) often well-tolerated; 250 mg for more rapid ascent." },
    { id: "q-paraesthesia", type: "single-choice", question: "Patient on acetazolamide reports tingling fingers and toes.", options: [
      { id: "a", label: "Stop immediately." }, { id: "b", label: "Reassure — paraesthesiae are very common, expected, harmless side effect of acetazolamide. Counsel pre-emptively before travel so patient isn't alarmed." }, { id: "c", label: "A&E." }, { id: "d", label: "Increase dose." }
    ], correctOptionIds: ["b"], explanation: "Paraesthesiae are the commonest side effect — benign and characteristic. Don't stop." },
    { id: "q-doesnt-replace", type: "single-choice", question: "Patient asks if acetazolamide replaces the need for gradual ascent.", options: [
      { id: "a", label: "Yes — climb fast with medication." }, { id: "b", label: "No — acetazolamide aids acclimatisation but does NOT replace gradual ascent. Slow ascent + acetazolamide together. Symptoms = stop ascending; severe = descend." }, { id: "c", label: "Yes for short trips." }, { id: "d", label: "Only for fit climbers." }
    ], correctOptionIds: ["b"], explanation: "Gradual ascent is the foundation. Drug is adjunct. Important counselling — patients can over-rely on medication." },
    { id: "q-hape", type: "single-choice", question: "Patient at 4200 m develops worsening breathlessness, cough with pink frothy sputum. Action?", options: [
      { id: "a", label: "Rest at altitude." }, { id: "b", label: "HAPE emergency — descend immediately. Dexamethasone + nifedipine if available. Evacuation. This is a medical emergency." }, { id: "c", label: "More acetazolamide." }, { id: "d", label: "Antibiotic." }
    ], correctOptionIds: ["b"], explanation: "HAPE is fatal if not descended. Pink frothy sputum is classic. Drug adjuncts help; descent is the cure." },
    { id: "q-when-stop", type: "single-choice", question: "When can acetazolamide be stopped?", options: [
      { id: "a", label: "On arrival at altitude." }, { id: "b", label: "After 48 hours at the highest altitude, OR on descent. No tapering needed." }, { id: "c", label: "Never — lifelong." }, { id: "d", label: "Day before descent." }
    ], correctOptionIds: ["b"], explanation: "48 hours at peak then can stop, or stop on descent. No tapering required." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Itinerary (altitudes, ascent profile), sulfa allergy excluded, renal status, AMS counselling delivered (especially descend rule), trial dose recommendation — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record captures the trip profile, contraindication exclusion, and critical AMS counselling." },
  ],
};
