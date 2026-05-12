// Ear infection (acute otitis media in adults) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const earInfectionModule: TrainingModule = {
  slug: "ear-infection",
  title: "Acute Otitis Media — PGD",
  description: "Eligibility and supply of amoxicillin for acute otitis media in adults under PGD.",
  pgdSlugs: ["ear-infection"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Ear Infection — Training", subtitle: "Acute otitis media in adults, otitis externa identification", estimatedMinutes: 10, objectives: [
      "Differentiate acute otitis media (AOM) from otitis externa, otitis media with effusion, and other ear pain causes.",
      "Identify patients eligible for amoxicillin under the PGD.",
      "Counsel on self-care, when antibiotic is appropriate, and red flags.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Acute otitis media (AOM) is acute infection of the middle ear. In adults less common than in children. Symptoms: ear pain, fever, hearing reduction, sometimes discharge if eardrum perforates.",
      "Otitis externa (outer ear canal infection) presents differently — pain on tragus pressure, canal redness/swelling, often with discharge. PGD supplies topical antibiotic/steroid drops separately.",
      "Most AOM is viral or resolves without antibiotic. NICE recommends self-care first; antibiotic for systemic features, prolonged symptoms, or specific risk groups.",
    ], highlights: ["Most adult AOM resolves without antibiotic.", "Otitis externa = pain on tragus pressure + canal redness/swelling.", "Discharge from ear = perforation likely; refer if persistent."] },
    { id: "eligibility", type: "checklist", title: "Eligibility (AOM in adults)", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18–65", detail: "Paediatric AOM — refer." },
      { label: "Symptoms consistent with AOM", detail: "Ear pain, hearing loss, fever; otoscopy showing red bulging eardrum (if pharmacy has otoscope and trained user)." },
      { label: "Symptoms ≥48 hours and not improving, OR systemic features", detail: "Most AOM improves with self-care. Antibiotic for worsening, severe, or systemic features." },
      { label: "Not pregnant or breastfeeding", detail: "Refer GP/midwife." },
      { label: "Not immunocompromised", detail: "Refer." },
      { label: "Not in setting of cholesteatoma / chronic ear disease", detail: "Refer ENT." },
      { label: "Eardrum perforation with discharge — refer", detail: "Topical antibiotic may be needed; ENT for persistent perforation." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer for any of these.", detail: [
      "Children.",
      "Pregnancy or breastfeeding.",
      "Immunocompromised.",
      "Severe pain unresponsive to analgesia.",
      "Signs of mastoiditis: tender/swollen behind ear, displaced ear, fever, systemic illness — urgent ENT/A&E.",
      "Facial nerve weakness — mastoiditis or other complication, urgent.",
      "Vertigo, severe disequilibrium — possible labyrinthitis or complication.",
      "Persistent discharge >2 weeks.",
      "Recurrent AOM (≥3 episodes in 6 months or ≥4 in 12 months).",
      "Penicillin allergy with AOM needing antibiotic — refer or use macrolide per local guidance.",
      "Cholesteatoma or known chronic suppurative otitis media.",
    ]},
    { id: "differential", type: "comparison", title: "AOM vs otitis externa", intro: "Common confusion. Different treatments.", columns: [
      { label: "Acute otitis media (AOM)", rows: [
        { heading: "Pain on tragus pressure", body: "Usually not." },
        { heading: "Pain on auricle pull", body: "Usually not." },
        { heading: "Hearing", body: "Reduced." },
        { heading: "Otoscopy", body: "Red, bulging tympanic membrane." },
        { heading: "Treatment", body: "Self-care first; oral amoxicillin if needed (this PGD)." },
      ]},
      { label: "Otitis externa", rows: [
        { heading: "Pain on tragus pressure", body: "Yes — diagnostic feature." },
        { heading: "Pain on auricle pull", body: "Yes." },
        { heading: "Canal", body: "Red, swollen, discharge." },
        { heading: "Otoscopy", body: "Inflamed canal; eardrum may be obscured." },
        { heading: "Treatment", body: "Topical antibiotic/steroid drops (separate PGD)." },
      ]},
    ]},
    { id: "treatment", type: "checklist", title: "Treatment", intro: "Step-wise approach.", items: [
      { label: "Self-care (most cases)", detail: "Paracetamol or ibuprofen for pain and fever. Warm compress. Most AOM resolves in 3–7 days." },
      { label: "Antibiotic if eligible", detail: "Amoxicillin 500 mg three times daily for 5 days. (Penicillin allergy: clarithromycin 250–500 mg BD for 5 days, or erythromycin in pregnancy.)" },
      { label: "Delayed prescribing approach acceptable", detail: "Consider giving the script with advice to start only if no improvement at 48 hours — reduces unnecessary antibiotic use." },
      { label: "Pain relief", detail: "Adequate analgesia is more important than antibiotic. Paracetamol/ibuprofen scheduled." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Most AOM resolves without antibiotic", detail: "Pain peaks at 24–48 hours then improves. Antibiotic shaves ~1 day off symptoms." },
      { label: "Adequate analgesia", detail: "Paracetamol 1g QDS + ibuprofen 400 mg TDS as scheduled, not just PRN." },
      { label: "Avoid water in ear", detail: "Until resolved. Cotton wool with vaseline for showering if needed." },
      { label: "Don't put anything in the ear", detail: "No cotton buds, oils, candles. Cause more harm." },
      { label: "Return if", detail: "Worsening, severe pain, fever ≥39°C unrelieved, dizziness, facial weakness, discharge persists >2 weeks." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — A&E / ENT", tone: "danger", message: "Refer urgently.", detail: [
      "Mastoid tenderness/swelling, ear pushed forward — mastoiditis.",
      "Facial nerve weakness.",
      "Severe vertigo, vomiting.",
      "Severe headache with neck stiffness — possible meningitis/intracranial complication.",
      "Persistent discharge >2 weeks.",
      "Recurrent AOM — ENT.",
      "Profound or sudden sensorineural hearing loss — urgent ENT (sudden SNHL is an emergency).",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Most adult AOM resolves with analgesia alone.",
      "Amoxicillin 500 mg TDS 5 days for those who need antibiotic.",
      "Differentiate from otitis externa (tragus pain, canal involvement).",
      "Refer: children, pregnant, immunocompromised, mastoiditis, facial weakness, persistent discharge.",
      "Counsel adequate analgesia as the primary measure.",
    ]},
  ],
  quiz: [
    { id: "q-mastoiditis", type: "single-choice", critical: true, question: "Patient with ear pain and now tender swelling behind ear, ear pushed forward. Action?", options: [
      { id: "a", label: "Amoxicillin." }, { id: "b", label: "A&E / urgent ENT — likely mastoiditis, potentially life-threatening." }, { id: "c", label: "Topical drops." }, { id: "d", label: "Wait." }
    ], correctOptionIds: ["b"], explanation: "Mastoiditis is a complication that needs IV antibiotics and possibly surgery. Urgent referral." },
    { id: "q-facial", type: "single-choice", critical: true, question: "Patient with ear infection now has facial droop on the same side. Action?", options: [
      { id: "a", label: "Amoxicillin." }, { id: "b", label: "Urgent ENT / A&E. Facial nerve weakness with ear infection signals serious complication (mastoiditis, intracranial extension)." }, { id: "c", label: "Steroid drops." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Facial nerve weakness is a red flag for serious complication. Urgent specialist input." },
    { id: "q-tragus", type: "single-choice", critical: true, question: "Patient has ear pain, tender on pressing the tragus, canal looks red and inflamed with discharge. What's the likely diagnosis?", options: [
      { id: "a", label: "AOM — supply amoxicillin." }, { id: "b", label: "Otitis externa — needs topical drops, not amoxicillin. Use otitis externa PGD or refer." }, { id: "c", label: "Mastoiditis." }, { id: "d", label: "Tinnitus." }
    ], correctOptionIds: ["b"], explanation: "Tragus pain + canal involvement = otitis externa. Treated topically, not with oral amoxicillin." },
    { id: "q-children", type: "single-choice", critical: true, question: "8-year-old with ear pain and fever. Action?", options: [
      { id: "a", label: "Supply amoxicillin." }, { id: "b", label: "Refer to GP — paediatric AOM is outside the PGD; dosing and assessment different." }, { id: "c", label: "Topical drops." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Paediatric AOM is outside PGD. Need proper paediatric assessment and weight-based dosing." },
    { id: "q-self-care", type: "single-choice", question: "Adult patient, ear pain 36 hours, no fever, no systemic features. FIRST step?", options: [
      { id: "a", label: "Immediate amoxicillin." }, { id: "b", label: "Self-care: paracetamol + ibuprofen scheduled, warm compress, avoid water in ear. Most AOM resolves in 3–7 days without antibiotic." }, { id: "c", label: "Topical drops." }, { id: "d", label: "Refer to ENT." }
    ], correctOptionIds: ["b"], explanation: "Most adult AOM resolves with adequate analgesia alone. Antibiotic stewardship — counsel self-care first." },
    { id: "q-pen-allergy", type: "single-choice", question: "Patient eligible for AOM antibiotic, allergic to penicillin (anaphylaxis). Alternative?", options: [
      { id: "a", label: "Amoxicillin." }, { id: "b", label: "Clarithromycin 250–500 mg BD for 5 days. Erythromycin in pregnancy." }, { id: "c", label: "Cefalexin." }, { id: "d", label: "Doxycycline." }
    ], correctOptionIds: ["b"], explanation: "Macrolide is the standard alternative for severe penicillin allergy. Cephalosporins risky in anaphylactic allergy." },
    { id: "q-perforation", type: "single-choice", question: "Patient with AOM had sudden relief of pain followed by ear discharge. What's likely happened?", options: [
      { id: "a", label: "Spontaneous resolution." }, { id: "b", label: "Tympanic membrane perforation. Usually heals on its own; refer if discharge persists >2 weeks or recurrent." }, { id: "c", label: "Meningitis." }, { id: "d", label: "Cholesteatoma." }
    ], correctOptionIds: ["b"], explanation: "Spontaneous TM perforation is common; pain relieved as pressure released. Usually heals; persistent discharge warrants ENT review." },
    { id: "q-pregnancy", type: "single-choice", question: "Pregnant patient with AOM. Action?", options: [
      { id: "a", label: "Amoxicillin." }, { id: "b", label: "Refer GP/midwife. Amoxicillin generally safe but pregnancy is outside the PGD scope." }, { id: "c", label: "Clarithromycin." }, { id: "d", label: "No treatment." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy is outside PGD. Amoxicillin OK but GP/midwife should handle." },
    { id: "q-vertigo", type: "single-choice", question: "Patient with ear pain and severe vertigo, vomiting. Action?", options: [
      { id: "a", label: "Amoxicillin." }, { id: "b", label: "Refer urgently — vertigo with ear symptoms suggests labyrinthitis or complication of AOM. Needs medical assessment." }, { id: "c", label: "Anti-emetic only." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Vertigo with ear infection suggests inner-ear involvement or complication. Refer for assessment." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Symptoms, duration, examination findings (or noted differential of AOM vs OE), exclusion of red flags, decision rationale, counselling — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates the AOM vs OE differentiation and red-flag exclusion." },
  ],
};
