// Pneumococcal vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const pneumococcalModule: TrainingModule = {
  slug: "pneumococcal",
  title: "Pneumococcal Vaccination (Prevenar 20) — PGD",
  description: "Adult pneumococcal vaccination with PCV20 (Prevenar 20) under PGD.",
  pgdSlugs: ["pneumococcal"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Pneumococcal Vaccination — Training", subtitle: "PCV20 (Prevenar 20) in adult cohorts", estimatedMinutes: 10, objectives: [
      "Identify eligible adult cohorts for pneumococcal vaccination per current Green Book.",
      "Apply correct schedule (typically single dose, with consideration of previous vaccination history).",
      "Recognise contraindications and administer safely.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Streptococcus pneumoniae causes invasive pneumococcal disease (pneumonia, meningitis, sepsis) particularly in older adults and clinical at-risk groups. Vaccination significantly reduces incidence and mortality.",
      "UK programme has shifted toward PCV20 (Prevenar 20) for most adult cohorts as of recent JCVI advice. PCV20 is a conjugate vaccine covering 20 serotypes — replaces older PCV13 + PPV23 sequential schedules in many cohorts.",
      "Always check current Green Book chapter 25 — pneumococcal vaccine recommendations and products have shifted in recent years (Prevenar 13 → PCV20). Eligibility criteria and specific products can change.",
    ], highlights: ["Single dose of PCV20 replaces older sequential schedule in many cohorts.", "Routine offer at age 65.", "At-risk groups: different age thresholds — check Green Book."] },
    { id: "eligibility", type: "checklist", title: "Eligibility — adult cohorts", intro: "Check current Green Book; eligibility evolves. Typical cohorts:", items: [
      { label: "Age 65+", detail: "Routine single PCV20 dose." },
      { label: "Adults 18+ in clinical risk groups", detail: "Asplenia / hyposplenism, chronic respiratory disease, chronic heart disease, chronic kidney disease, chronic liver disease, diabetes, immunosuppression, cochlear implant, CSF leak, complement disorders." },
      { label: "Occupational risk (welders, metal-fume exposure)", detail: "Defined group with elevated pneumococcal pneumonia risk." },
      { label: "Patient previously had PPV23 alone", detail: "Per current guidance, single PCV20 dose may be offered for broader serotype coverage. Check current Green Book for specific timing." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Do not vaccinate.", detail: [
      "Previous anaphylaxis to a pneumococcal vaccine or any component.",
      "Severe acute febrile illness today — postpone.",
      "Pregnancy — generally avoided routinely but not absolute contraindication if high-risk. Refer.",
      "Severe bleeding disorder or anticoagulation with INR out of range — vaccinate with caution: longer/finer needle, deep IM, prolonged pressure.",
    ]},
    { id: "administration", type: "checklist", title: "Administration", items: [
      { label: "Pre-check", detail: "Eligibility, previous pneumococcal history (PCV13/PPV23 dates), contraindications, consent, vaccine name/batch/expiry." },
      { label: "Site", detail: "Deltoid IM." },
      { label: "Needle", detail: "23G 25mm (blue) standard adult." },
      { label: "Dose", detail: "0.5 mL IM." },
      { label: "Co-administration", detail: "Can be given with flu, COVID, shingles, RSV vaccines on same day in different deltoids. No spacing required from other vaccines." },
      { label: "Post-vaccination observation", detail: "15 minutes minimum; anaphylaxis preparedness." },
    ]},
    { id: "side-effects", type: "checklist", title: "Side effects", intro: "Generally well-tolerated.", items: [
      { label: "Common — local", detail: "Pain, redness, swelling at injection site." },
      { label: "Common — systemic", detail: "Fatigue, headache, low-grade fever, myalgia. 24–48 hours." },
      { label: "Rare", detail: "Anaphylaxis (very rare). Severe local reaction (extensive swelling)." },
      { label: "Counselling", detail: "Paracetamol acceptable for symptom relief. Most settle within 2 days." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Single PCV20 dose for most adult cohorts (65+ or at-risk 18+).",
      "Check Green Book — eligibility and product recommendations evolving.",
      "Co-administer with flu, COVID, shingles, RSV as needed.",
      "Anaphylaxis preparedness as standard.",
      "Document batch and dose.",
    ]},
  ],
  quiz: [
    { id: "q-anaphylaxis", type: "single-choice", critical: true, question: "Patient had anaphylaxis to previous PPV23. Wants PCV20 now. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Refer to allergy clinic / GP — anaphylaxis to a pneumococcal vaccine component is an absolute contraindication under PGD." }, { id: "c", label: "Half dose." }, { id: "d", label: "Pre-medicate antihistamine." }
    ], correctOptionIds: ["b"], explanation: "Anaphylaxis to a pneumococcal vaccine is absolute contraindication. Specialist allergy assessment to identify component and decide alternative." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient at high risk (severe immunosuppression). Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Refer GP / specialist. Pneumococcal vaccine not routinely contraindicated in pregnancy but pregnancy management of high-risk patients warrants proper review." }, { id: "c", label: "Defer until postpartum." }, { id: "d", label: "Half dose." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy + high-risk = specialist input. Vaccine isn't contraindicated absolutely but appropriate context for proper review." },
    { id: "q-acute-illness", type: "single-choice", critical: true, question: "Patient eligible by age, has fever 38.5°C today. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Postpone — acute moderate-severe febrile illness defers vaccination." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Acute febrile illness = postpone. Reschedule when recovered." },
    { id: "q-co-admin", type: "single-choice", question: "Patient eligible for pneumococcal, flu and shingles vaccines. Co-administration?", options: [
      { id: "a", label: "Space by 4 weeks each." }, { id: "b", label: "Co-administration acceptable — different deltoids; single observation period. No interaction; antibodies form independently to each." }, { id: "c", label: "Pneumococcal first, others next month." }, { id: "d", label: "Only one per visit ever." }
    ], correctOptionIds: ["b"], explanation: "Inactivated vaccines can be co-administered. Different deltoids; observe 15 minutes after." },
    { id: "q-cohorts", type: "single-choice", question: "Adult at-risk cohorts typically eligible for pneumococcal include:", options: [
      { id: "a", label: "Only people over 65." }, { id: "b", label: "Asplenia / hyposplenism, chronic respiratory / cardiac / renal / liver disease, diabetes, immunosuppression, CSF leak, cochlear implant, plus age 65+ routine." }, { id: "c", label: "Only HIV-positive." }, { id: "d", label: "Pregnant women only." }
    ], correctOptionIds: ["b"], explanation: "Multiple clinical at-risk groups regardless of age, plus 65+ routine. Check current Green Book." },
    { id: "q-history", type: "single-choice", question: "Patient had PPV23 8 years ago, now 70. Action?", options: [
      { id: "a", label: "Doesn't need another." }, { id: "b", label: "May be eligible for PCV20 per current guidance to broaden serotype coverage. Check current Green Book for specific timing rules." }, { id: "c", label: "Re-vaccinate with PPV23." }, { id: "d", label: "Lifetime cover already." }
    ], correctOptionIds: ["b"], explanation: "Current guidance increasingly favours PCV20 even in those previously vaccinated. Check Green Book for transition rules." },
    { id: "q-immunocompromised", type: "single-choice", question: "Patient on rituximab, age 45. Action?", options: [
      { id: "a", label: "Don't vaccinate — immunocompromised." }, { id: "b", label: "Vaccinate — immunocompromised adults are an at-risk cohort. Pneumococcal disease is severe in this group. Antibody response may be reduced but vaccination still beneficial. Refer for timing optimisation (e.g. before next rituximab cycle) if uncertain." }, { id: "c", label: "Half dose." }, { id: "d", label: "Defer indefinitely." }
    ], correctOptionIds: ["b"], explanation: "Immunocompromised are explicitly an at-risk cohort. Even reduced response is better than none. Specialist guidance for timing around immunosuppressive cycles." },
    { id: "q-needle", type: "single-choice", question: "Standard adult IM needle for pneumococcal?", options: [
      { id: "a", label: "21G 50mm." }, { id: "b", label: "23G 25mm (blue), deltoid IM." }, { id: "c", label: "25G 16mm subcut." }, { id: "d", label: "27G insulin." }
    ], correctOptionIds: ["b"], explanation: "Standard adult IM deltoid. Same as flu, COVID, shingles." },
    { id: "q-pcv20-vs-ppv23", type: "single-choice", question: "Why is PCV20 increasingly preferred over the older PCV13+PPV23 schedule?", options: [
      { id: "a", label: "Cheaper." }, { id: "b", label: "Single-dose schedule, conjugate vaccine producing better memory response, covers 20 serotypes (vs 13 in PCV13, 23 in PPV23 but PPV23 less effective in elderly). Simpler programme delivery." }, { id: "c", label: "More serotypes than PPV23." }, { id: "d", label: "PPV23 is now unsafe." }
    ], correctOptionIds: ["b"], explanation: "PCV20 simplifies the schedule (single dose), provides robust conjugate-vaccine response, and covers more serotypes than PCV13 with the immunological advantage of conjugation that PPV23 lacks." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Cohort eligibility, previous pneumococcal vaccination history (with dates if known), vaccine batch / expiry, site, contraindications excluded, consent, observation — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Verbal record." }
    ], correctOptionIds: ["b"], explanation: "Vaccination records require batch and date — particularly important here given the changing pneumococcal product landscape (records need to capture which vaccine was given)." },
  ],
};
