// Sore throat (acute pharyngitis / tonsillitis) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const soreThroatModule: TrainingModule = {
  slug: "sore-throat",
  title: "Sore Throat — PGD",
  description: "FeverPAIN / Centor assessment and antibiotic supply (phenoxymethylpenicillin) for adults with bacterial pharyngitis under PGD.",
  pgdSlugs: ["sore-throat"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Sore Throat — Training", subtitle: "Bacterial pharyngitis — FeverPAIN-led antibiotic supply", estimatedMinutes: 10, objectives: [
      "Apply the FeverPAIN score to triage sore throat presentations.",
      "Identify when antibiotic supply is appropriate vs self-care vs urgent referral.",
      "Counsel on viral self-resolution, OTC symptomatic measures, and red flags.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Most sore throats are viral and self-limiting (3–7 days). Antibiotics offer modest benefit only in bacterial (mostly Strep pyogenes) cases and risk side effects, resistance, and unnecessary medicalisation.",
      "The FeverPAIN score (NICE NG84) stratifies risk: 0–1 = unlikely bacterial; 2–3 = consider delayed/no antibiotic; 4–5 = consider immediate antibiotic.",
      "FeverPAIN: Fever in past 24h (1), Purulence on tonsils (1), Attended pharmacy/GP within 3 days of onset (1), Inflamed tonsils severely (1), No cough or coryza (1).",
    ], highlights: ["Most sore throats are viral — antibiotic stewardship matters.", "FeverPAIN 4–5 = consider immediate antibiotic.", "Drooling, stridor, unable to swallow = emergency — A&E."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 16–65", detail: "Children — refer (paediatric assessment, Centor not validated in young children)." },
      { label: "Acute sore throat ≤7 days duration", detail: "Longer = consider alternative diagnoses (glandular fever, abscess)." },
      { label: "FeverPAIN 4–5", detail: "Or Centor 3–4 (Centor also valid). 0–3 = self-care, not antibiotic." },
      { label: "No red flags", detail: "See red-flag slide. Drooling, stridor, unable to swallow saliva = 999/A&E." },
      { label: "Not pregnant or breastfeeding", detail: "Phenoxymethylpenicillin generally safe in pregnancy but defer for proper GP/midwife review." },
      { label: "Not immunocompromised", detail: "Refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer for any of these.", detail: [
      "Drooling, stridor, unable to swallow saliva, hot-potato voice — possible epiglottitis or peritonsillar abscess. A&E.",
      "Unilateral severe pain with trismus, voice change, deviated uvula — peritonsillar abscess (quinsy). A&E.",
      "Severe lethargy, jaundice, hepatosplenomegaly — possible glandular fever — refer GP for assessment.",
      "Symptoms >7 days without improvement.",
      "Immunocompromised.",
      "Recurrent tonsillitis (≥7 episodes in 1 year, ≥5/yr for 2 years, ≥3/yr for 3 years) — ENT referral.",
      "Penicillin allergy with bacterial pharyngitis — refer or use macrolide per local guidance.",
      "Children under 16.",
      "Pregnancy.",
    ]},
    { id: "treatment", type: "comparison", title: "Treatment options", intro: "FeverPAIN guides decision.", columns: [
      { label: "FeverPAIN 0–3", rows: [
        { heading: "Action", body: "No antibiotic. Self-care advice." },
        { heading: "Counselling", body: "Most resolve in 7 days. Paracetamol/ibuprofen for pain/fever, fluids, rest. OTC throat sprays/lozenges optional." },
        { heading: "Return if", body: "Worsening, new red flags, no improvement at 5–7 days." },
      ]},
      { label: "FeverPAIN 4–5", rows: [
        { heading: "Antibiotic", body: "Phenoxymethylpenicillin 500 mg four times daily for 5–10 days." },
        { heading: "Penicillin-allergic", body: "Clarithromycin 250–500 mg BD for 5 days (refer if severe allergy). Erythromycin in pregnancy." },
        { heading: "Counselling", body: "Complete the course. Symptoms still take a few days to resolve. Pain relief and fluids alongside." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Most sore throats are viral and self-limiting", detail: "7-day natural course is normal." },
      { label: "Symptom relief", detail: "Paracetamol 1g QDS or ibuprofen 400 mg TDS for pain and fever. Difflam (benzydamine) spray for topical pain relief. Lozenges, warm fluids, salt-water gargle." },
      { label: "Hydration", detail: "Cool fluids, ice lollies. Important especially with fever." },
      { label: "Return advice", detail: "Worsening, unable to swallow saliva, voice change, drooling, breathing difficulty — urgent care." },
      { label: "Antibiotic counselling (if supplied)", detail: "Complete the course. Take with water. Mild GI side effects common. Allergy: rash, swelling, breathing difficulty — stop and seek urgent care." },
      { label: "Smoking and alcohol", detail: "Avoid both during illness — exacerbate throat irritation." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — A&E", tone: "danger", message: "These suggest serious airway or deep-space infection.", detail: [
      "Drooling, unable to swallow saliva.",
      "Stridor or breathing difficulty.",
      "Trismus (can't open mouth fully).",
      "Hot-potato / muffled voice.",
      "Unilateral severe pain or visible peritonsillar swelling, deviated uvula — quinsy.",
      "Severe neck swelling or stiffness.",
      "Severe systemic illness, signs of sepsis.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "FeverPAIN 4–5 = antibiotic; 0–3 = no antibiotic + self-care.",
      "Phenoxymethylpenicillin 500 mg QDS 5–10 days. Clarithromycin if penicillin-allergic.",
      "Red flags: airway compromise (drooling, stridor, can't swallow), quinsy (unilateral, trismus).",
      "Children, pregnancy, immunocompromised, recurrent — refer.",
      "Most sore throats are viral; counsel pre-emptively to reduce antibiotic-seeking.",
    ]},
  ],
  quiz: [
    { id: "q-airway", type: "single-choice", critical: true, question: "Patient drooling, unable to swallow saliva, hot-potato voice. Action?", options: [
      { id: "a", label: "Phenoxymethylpenicillin." }, { id: "b", label: "999 / A&E immediately — possible epiglottitis or peritonsillar abscess, airway emergency." }, { id: "c", label: "Lozenges." }, { id: "d", label: "Wait and review." }
    ], correctOptionIds: ["b"], explanation: "Drooling and inability to swallow saliva are airway-compromise red flags. Time-critical referral." },
    { id: "q-quinsy", type: "single-choice", critical: true, question: "Patient with severe one-sided throat pain, can't open mouth fully, voice sounds different. Action?", options: [
      { id: "a", label: "Antibiotic." }, { id: "b", label: "Refer to A&E / ENT — likely peritonsillar abscess (quinsy) requiring drainage." }, { id: "c", label: "Stronger antibiotic." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Unilateral severe pain + trismus + voice change = peritonsillar abscess. Needs surgical drainage, not just antibiotics." },
    { id: "q-feverpain", type: "single-choice", critical: true, question: "What FeverPAIN score generally warrants antibiotic supply?", options: [
      { id: "a", label: "0–1." }, { id: "b", label: "4–5." }, { id: "c", label: "Always with any positive score." }, { id: "d", label: "Never." }
    ], correctOptionIds: ["b"], explanation: "FeverPAIN 4–5 indicates higher bacterial probability and warrants antibiotic consideration. 0–3 = self-care; 2–3 = optional delayed antibiotic." },
    { id: "q-pen-allergy", type: "single-choice", critical: true, question: "Patient with FeverPAIN 4 and severe penicillin allergy (anaphylaxis previously). Action?", options: [
      { id: "a", label: "Phenoxymethylpenicillin at half dose." }, { id: "b", label: "Clarithromycin 250–500 mg BD for 5 days (or refer if severe). Erythromycin if pregnant." }, { id: "c", label: "Amoxicillin." }, { id: "d", label: "Cefalexin." }
    ], correctOptionIds: ["b"], explanation: "Macrolide is the standard alternative for penicillin allergy. Avoid all beta-lactams in severe allergy due to cross-reactivity risk." },
    { id: "q-children", type: "single-choice", critical: true, question: "Parent brings 8-year-old with sore throat and fever. Action?", options: [
      { id: "a", label: "Supply phenoxymethylpenicillin at child dose." }, { id: "b", label: "Refer to GP / urgent care. Children under 16 are out of scope; FeverPAIN less validated; risk of complications (Strep, rheumatic fever) needs medical assessment." }, { id: "c", label: "Reassure." }, { id: "d", label: "Throat spray." }
    ], correctOptionIds: ["b"], explanation: "Paediatric sore throat is out of PGD scope. GP/urgent care assesses for Strep, complications, and dosing." },
    { id: "q-viral", type: "single-choice", question: "Patient with sore throat, cough, runny nose, FeverPAIN 1. Action?", options: [
      { id: "a", label: "Antibiotic." }, { id: "b", label: "Self-care advice: paracetamol/ibuprofen, fluids, throat lozenges. Most viral sore throats resolve in 7 days. Return if worse." }, { id: "c", label: "Refer GP." }, { id: "d", label: "Stronger antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Cough and coryza make viral aetiology likely (FeverPAIN low). Antibiotic is unhelpful and contributes to resistance. Self-care advice." },
    { id: "q-glandular", type: "single-choice", question: "23-year-old with sore throat for 10 days, severe lethargy, mild jaundice. FeverPAIN 3. Action?", options: [
      { id: "a", label: "Phenoxymethylpenicillin." }, { id: "b", label: "Refer to GP — clinical picture suggests infectious mononucleosis (glandular fever); penicillin contraindicated (causes rash in mono); needs blood tests." }, { id: "c", label: "Amoxicillin." }, { id: "d", label: "Topical analgesic only." }
    ], correctOptionIds: ["b"], explanation: "Duration, lethargy, jaundice point to glandular fever. Amoxicillin/penicillin cause classic rash in mono. Refer for monospot and proper diagnosis." },
    { id: "q-pregnancy", type: "single-choice", question: "Pregnant patient with FeverPAIN 5. Action?", options: [
      { id: "a", label: "Phenoxymethylpenicillin." }, { id: "b", label: "Refer to GP/midwife. Penicillin is generally safe in pregnancy but should be initiated by GP/midwife in pregnancy." }, { id: "c", label: "Clarithromycin." }, { id: "d", label: "No treatment." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy is outside the PGD. Pen V is generally OK but GP/midwife should handle." },
    { id: "q-duration", type: "single-choice", question: "Patient has had sore throat for 12 days. FeverPAIN 4. Action?", options: [
      { id: "a", label: "Supply antibiotic." }, { id: "b", label: "Refer GP. Symptoms beyond 7 days warrant proper assessment — abscess, mono, atypical infection, malignancy in older patients." }, { id: "c", label: "Stronger antibiotic." }, { id: "d", label: "Lozenges only." }
    ], correctOptionIds: ["b"], explanation: "PGD is for acute sore throat ≤7 days. Prolonged symptoms need GP assessment." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "FeverPAIN score with components, duration, red flags assessed and excluded, decision (antibiotic or not) with rationale, counselling — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Recording the FeverPAIN score is the load-bearing audit item — demonstrates that antibiotic stewardship was applied." },
  ],
};
