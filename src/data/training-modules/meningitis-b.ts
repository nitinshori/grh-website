// Meningitis B vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const meningitisBModule: TrainingModule = {
  slug: "meningitis-b",
  title: "Meningitis B Vaccination (Bexsero) — PGD",
  description: "Adult meningitis B vaccination for at-risk groups under PGD.",
  pgdSlugs: ["meningitis-b"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Meningitis B Vaccination — Training", subtitle: "Bexsero for at-risk adults", estimatedMinutes: 10, objectives: [
      "Identify adult cohorts eligible for MenB vaccination.",
      "Apply 2-dose schedule.",
      "Recognise reactogenicity and provide pre-emptive counselling.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Meningococcal B (Neisseria meningitidis serogroup B) causes invasive meningococcal disease — meningitis and septicaemia, with mortality and significant long-term morbidity in survivors. Most invasive meningococcal disease in the UK is serogroup B.",
      "Bexsero is the licensed UK MenB vaccine. Routine UK infant schedule includes MenB. Adult catch-up / risk-group vaccination uses 2-dose schedule.",
      "Adult cohorts: asplenia / hyposplenism, complement deficiency, university students in certain contexts, laboratory workers, healthcare workers, travel to outbreak areas.",
    ], highlights: ["MenB is the commonest serogroup of invasive disease in UK.", "Bexsero is highly reactogenic — pre-warn patient.", "2 doses ≥1 month apart for adults."] },
    { id: "eligibility", type: "checklist", title: "Eligibility (adult cohorts)", intro: "Per Green Book chapter 22.", items: [
      { label: "Asplenia / hyposplenism", detail: "Including post-splenectomy, sickle cell, coeliac with hyposplenism." },
      { label: "Complement deficiency", detail: "Especially terminal complement (C5–C9). Includes patients on eculizumab / ravulizumab — these block C5 and create functional complement deficiency." },
      { label: "Laboratory workers handling Neisseria", detail: "Occupational exposure." },
      { label: "Outbreak / cluster contact", detail: "Specific public-health response to confirmed outbreaks." },
      { label: "Pre-travel for specific destinations / risk", detail: "Less commonly travel-driven than MenACWY for the meningitis belt." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Do not vaccinate.", detail: [
      "Previous anaphylaxis to MenB vaccine or component.",
      "Severe acute febrile illness today.",
      "Pregnancy — defer unless at high outbreak risk where benefit clearly outweighs (specialist input).",
      "Significant immunosuppression — may reduce response but not contraindicated; specialist context for timing.",
    ]},
    { id: "schedule-administration", type: "checklist", title: "Schedule, administration, counselling", items: [
      { label: "Adult schedule", detail: "2 doses ≥1 month apart, then booster considered per long-term risk." },
      { label: "Site", detail: "Deltoid IM." },
      { label: "Needle", detail: "23G 25mm." },
      { label: "Reactogenicity", detail: "Bexsero is significantly reactogenic — local pain, redness, fever common. Counsel pre-emptively; paracetamol acceptable." },
      { label: "Co-administration", detail: "Acceptable with other inactivated vaccines, different deltoids." },
      { label: "Asplenia patients", detail: "Coordinate with MenACWY, pneumococcal, Hib, flu vaccinations — full asplenia vaccination package." },
      { label: "Document", detail: "Batch, dose number, NIMS upload." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Adult risk groups: asplenia, complement deficiency (incl. eculizumab patients), lab workers, outbreak contacts.",
      "2-dose schedule, ≥1 month apart.",
      "Highly reactogenic — pre-warn.",
      "Asplenia = part of full vaccination package (MenB + MenACWY + Hib + pneumococcal + flu).",
    ]},
  ],
  quiz: [
    { id: "q-asplenia", type: "single-choice", critical: true, question: "Post-splenectomy patient, splenectomised 2 weeks ago. Eligibility for MenB?", options: [
      { id: "a", label: "Not needed." }, { id: "b", label: "Yes — asplenia is an indication. Should also receive MenACWY, Hib, pneumococcal, and annual flu vaccinations. Coordinate the full asplenia package." }, { id: "c", label: "MenACWY only." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Asplenic patients need broader vaccination protection against encapsulated organisms. Don't vaccinate MenB in isolation — coordinate the whole panel." },
    { id: "q-eculizumab", type: "single-choice", critical: true, question: "Patient on eculizumab (for atypical haemolytic uraemic syndrome). MenB?", options: [
      { id: "a", label: "Not needed." }, { id: "b", label: "Yes — eculizumab blocks complement (C5), creating functional complement deficiency. Patients on eculizumab/ravulizumab are at very high risk of meningococcal disease and need MenB and MenACWY vaccination." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Eculizumab/ravulizumab blocks terminal complement and dramatically increases meningococcal disease risk. Mandatory MenB and MenACWY." },
    { id: "q-reactogenicity", type: "single-choice", critical: true, question: "Patient post-first MenB dose had high fever and severe arm pain for 48 hours. Hesitant about second dose. Action?", options: [
      { id: "a", label: "Don't give second dose." }, { id: "b", label: "Counsel that Bexsero reactogenicity is common and expected. Reassure on transient nature; emphasise need for second dose for protection. Paracetamol pre-emptively can help. Document her concern." }, { id: "c", label: "Half dose." }, { id: "d", label: "Switch vaccine." }
    ], correctOptionIds: ["b"], explanation: "Bexsero is one of the more reactogenic vaccines. Reassure and re-dose. Skipping second dose leaves the patient unprotected." },
    { id: "q-pregnancy", type: "single-choice", question: "Pregnant patient with asplenia eligible. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Defer until postpartum unless very high outbreak risk. Specialist input. Bexsero data in pregnancy limited." }, { id: "c", label: "Half dose." }, { id: "d", label: "Subcut." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy = defer unless overriding outbreak / acute risk and specialist agrees." },
    { id: "q-schedule", type: "single-choice", question: "Adult schedule?", options: [
      { id: "a", label: "Single dose." }, { id: "b", label: "2 doses ≥1 month apart, then consider booster per long-term risk." }, { id: "c", label: "3 doses + booster." }, { id: "d", label: "Annual." }
    ], correctOptionIds: ["b"], explanation: "2-dose adult schedule with consideration of booster for ongoing risk groups." },
    { id: "q-asplenia-package", type: "single-choice", question: "Asplenia patient needs which vaccines?", options: [
      { id: "a", label: "MenB only." }, { id: "b", label: "Full package: MenB, MenACWY, Hib, pneumococcal, plus annual flu. Reduced spleen function dramatically raises risk from encapsulated organisms." }, { id: "c", label: "MenACWY only." }, { id: "d", label: "Pneumococcal only." }
    ], correctOptionIds: ["b"], explanation: "Asplenia = high risk from encapsulated organisms. Full vaccination panel mandatory." },
    { id: "q-needle", type: "single-choice", question: "Site and needle?", options: [
      { id: "a", label: "Gluteal IM." }, { id: "b", label: "Deltoid IM, 23G 25mm (blue)." }, { id: "c", label: "Subcut." }, { id: "d", label: "Intradermal." }
    ], correctOptionIds: ["b"], explanation: "Standard adult IM deltoid. Same as most adult inactivated vaccines." },
    { id: "q-pre-emptive-paracetamol", type: "single-choice", question: "Patient asks about taking paracetamol around vaccination.", options: [
      { id: "a", label: "Never — interferes with vaccine response." }, { id: "b", label: "Acceptable for symptomatic relief if reactogenicity occurs. Routine prophylactic paracetamol pre-vaccination not generally recommended for adults — minimal evidence either way." }, { id: "c", label: "Required before injection." }, { id: "d", label: "Avoid for 48 hours either side." }
    ], correctOptionIds: ["b"], explanation: "Symptomatic paracetamol is fine. Routine prophylactic not strongly recommended for adults — doesn't significantly impair vaccine response for MenB but evidence small." },
    { id: "q-co-admin", type: "single-choice", question: "Can MenB be given with MenACWY same day?", options: [
      { id: "a", label: "No, space by 4 weeks." }, { id: "b", label: "Yes — co-administration in different deltoids acceptable. Often done in asplenia patients to complete the package efficiently." }, { id: "c", label: "MenB only on its own." }, { id: "d", label: "Only if same brand." }
    ], correctOptionIds: ["b"], explanation: "Co-administration acceptable. Efficient when delivering the asplenia package." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Eligibility category (asplenia, complement deficiency, etc.), dose number, batch, contraindications excluded, reactogenicity counselling — in the ePGD tool. NIMS upload. Asplenia register if relevant." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates the cohort justification. Asplenia register coordination is sometimes additional." },
  ],
};
