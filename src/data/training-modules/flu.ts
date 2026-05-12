// Flu (influenza) vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const fluModule: TrainingModule = {
  slug: "flu",
  title: "Influenza Vaccination — PGD",
  description: "Eligibility, vaccine selection and administration for seasonal influenza vaccination under PGD.",
  pgdSlugs: ["flu"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Influenza Vaccination — Training", subtitle: "Seasonal flu vaccine administration under PGD", estimatedMinutes: 12, objectives: [
      "Identify eligible adult patients for flu vaccination under the PGD.",
      "Select the correct vaccine based on age (aQIV / QIVc / QIVe).",
      "Apply correct injection technique and post-vaccination observation.",
      "Recognise anaphylaxis and act per UK Resuscitation Council guidelines.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Seasonal influenza vaccination is the most cost-effective preventive intervention in adult primary care. Effectiveness varies year to year based on antigen match (40–60% in matched years).",
      "Adult vaccines available: QIVe (egg-grown quadrivalent, most adults), QIVc (cell-grown quadrivalent, egg-allergic), aQIV (adjuvanted quadrivalent, age 65+).",
      "Season runs September–March in the UK. Eligible groups per Green Book and annual flu letter.",
    ], highlights: ["Age 65+ get aQIV (adjuvanted) — stronger response in older adults.", "Egg-allergic patients get QIVc (cell-grown).", "Anaphylaxis preparation is mandatory before vaccinating."] },
    { id: "eligibility", type: "checklist", title: "Eligibility — NHS-funded groups (typical season)", intro: "Check current annual flu letter; eligibility may change. Adult cohorts typically include:", items: [
      { label: "Aged 65+", detail: "Receive aQIV (adjuvanted). Most common cohort." },
      { label: "Aged 18–64 in a clinical at-risk group", detail: "Includes: chronic respiratory (asthma needing inhaled steroid, COPD), chronic cardiac, chronic renal, chronic liver, chronic neurological, immunosuppression, diabetes, asplenia, BMI ≥40, morbid obesity-related conditions." },
      { label: "Pregnant women (any trimester)", detail: "Strong indication. Protects mother and infant in first 6 months." },
      { label: "Carers", detail: "Main carer of a person whose welfare depends on them." },
      { label: "Household contacts of immunocompromised", detail: "To protect the vulnerable contact." },
      { label: "Frontline health/social care workers (occupational)", detail: "Usually via employer scheme but PGD can apply." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Absolute contraindications", tone: "danger", message: "Do not vaccinate; refer to GP for assessment.", detail: [
      "Previous anaphylaxis to a flu vaccine or any vaccine component.",
      "Severe acute febrile illness today — postpone until recovered.",
      "Confirmed severe egg allergy (anaphylaxis to egg) — must use QIVc (egg-free) only, or refer to specialist for assessment.",
      "Bleeding disorder or anticoagulated — vaccinate with caution: longer finer needle, pressure ≥10 mins; document.",
    ]},
    { id: "vaccine-selection", type: "comparison", title: "Vaccine selection by age", intro: "Use the correct vaccine for the patient's age and allergy profile.", columns: [
      { label: "Age 65+", rows: [
        { heading: "Vaccine", body: "aQIV (adjuvanted quadrivalent) — e.g. Fluad Tetra." },
        { heading: "Why", body: "Adjuvant improves response in older immune system." },
        { heading: "Alternative if egg-allergic", body: "Cell-grown QIVc (Flucelvax Tetra). Specialist for severe allergy." },
      ]},
      { label: "Age 18–64 (at-risk)", rows: [
        { heading: "Vaccine", body: "QIVe (egg-grown quadrivalent) — standard cohort." },
        { heading: "Egg-allergic", body: "QIVc (cell-grown). Severe anaphylaxis to egg — refer." },
        { heading: "Pregnant", body: "QIVe or QIVc — both safe in pregnancy. Standard adult dose." },
      ]},
    ]},
    { id: "administration", type: "checklist", title: "Administration", intro: "Vaccinate following standard technique.", items: [
      { label: "Pre-vaccination check", detail: "Confirm eligibility, screen for contraindications, confirm consent, check vaccine name/expiry/batch." },
      { label: "Site", detail: "Deltoid muscle, intramuscular." },
      { label: "Needle", detail: "23G 25mm (blue) for most adults. 23G 38mm (longer) if BMI >40 or thicker deltoid. Subcut acceptable in bleeding disorder." },
      { label: "Technique", detail: "Skin clean (alcohol wipe optional per local policy), pinch skin, 90° insertion, aspirate not required, inject slowly." },
      { label: "Post-vaccination", detail: "Apply pressure with cotton wool/plaster. Observe for at least 15 minutes. Document batch and site." },
      { label: "Anaphylaxis preparation", detail: "Adrenaline 1:1000 (0.5 mL for adult IM), trained staff, ALS-trained for back-up. Documented protocol on site." },
    ]},
    { id: "side-effects", type: "checklist", title: "Side effects — counsel routinely", items: [
      { label: "Common — local", detail: "Pain, redness, swelling at injection site. Usually mild, settle in 1–2 days." },
      { label: "Common — systemic", detail: "Low-grade fever, headache, muscle ache, fatigue. 24–48 hours typically." },
      { label: "Paracetamol", detail: "OK for relief if needed. Not routinely required." },
      { label: "Cannot cause flu", detail: "Inactivated vaccine — does not contain live virus. Counsel against this common misconception." },
      { label: "Rare — allergic reactions", detail: "Anaphylaxis ~1 in 1.5 million. Local clinic ready to manage." },
      { label: "Rare — Guillain-Barré syndrome", detail: "Very small association. Tell patient to seek urgent care for new weakness, balance issues after vaccination." },
    ]},
    { id: "red-flags", type: "callout", title: "Reactions — escalate", tone: "danger", message: "Anaphylaxis or other immediate serious reaction.", detail: [
      "Anaphylaxis: hypotension, breathing difficulty, generalised urticaria, throat swelling, collapse. ADRENALINE IM (1:1000, 0.5 mL adult), 999, ALS protocol.",
      "Severe local reaction: extensive swelling beyond joint — refer GP.",
      "Vasovagal (faint) immediately after injection — lay down, elevate legs, monitor. Distinguish from anaphylaxis (vasovagal: pale, bradycardic, recovers quickly; anaphylaxis: flushed/urticaria, tachycardic, breathing issues).",
      "Severe persistent headache, neurological symptoms days–weeks later — refer to GP.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Match vaccine to age and allergy: aQIV for 65+, QIVe for 18–64, QIVc for egg-allergic.",
      "Pregnancy: vaccinate any trimester.",
      "Deltoid IM, 23G 25mm needle, 15-minute observation.",
      "Anaphylaxis kit, protocol, and ALS back-up mandatory.",
      "Cannot cause flu — counsel pre-emptively.",
      "Document batch and site every vaccination.",
    ]},
  ],
  quiz: [
    { id: "q-anaphylaxis-prior", type: "single-choice", critical: true, question: "Patient had anaphylaxis to last year's flu vaccine. Action?", options: [
      { id: "a", label: "Vaccinate with cell-grown QIVc." }, { id: "b", label: "Do not vaccinate under PGD — refer to GP / allergy clinic for specialist assessment. Previous anaphylaxis to a vaccine is an absolute contraindication under this PGD." }, { id: "c", label: "Vaccinate at half dose." }, { id: "d", label: "Vaccinate after antihistamine." }
    ], correctOptionIds: ["b"], explanation: "Previous anaphylaxis to a vaccine is an absolute contraindication. Specialist allergy assessment determines if alternative formulation is safe — not pharmacy PGD." },
    { id: "q-age", type: "single-choice", critical: true, question: "70-year-old eligible patient. Which vaccine?", options: [
      { id: "a", label: "QIVe." }, { id: "b", label: "aQIV (adjuvanted, e.g. Fluad Tetra) — designed for age 65+." }, { id: "c", label: "Any QIV." }, { id: "d", label: "Live attenuated nasal flu." }
    ], correctOptionIds: ["b"], explanation: "Age 65+ should receive the adjuvanted vaccine for better immune response. Using QIVe in this cohort would be suboptimal." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "16-week pregnant woman wants flu vaccine. Action?", options: [
      { id: "a", label: "Postpone until after delivery." }, { id: "b", label: "Vaccinate — flu vaccine is recommended in pregnancy at any trimester. QIVe or QIVc are both safe." }, { id: "c", label: "Vaccinate only in third trimester." }, { id: "d", label: "Refer to GP." }
    ], correctOptionIds: ["b"], explanation: "Flu vaccine in pregnancy is actively recommended at any trimester. Protects mother (high complication risk) and confers passive immunity to neonate." },
    { id: "q-acute-illness", type: "single-choice", critical: true, question: "Patient has a temperature of 38.4°C today with sore throat and feels unwell. Action?", options: [
      { id: "a", label: "Vaccinate now." }, { id: "b", label: "Postpone until recovered. Acute moderate-severe illness with fever is a contraindication to immediate vaccination." }, { id: "c", label: "Vaccinate at reduced dose." }, { id: "d", label: "Vaccinate after paracetamol." }
    ], correctOptionIds: ["b"], explanation: "Acute febrile illness postpones vaccination — the immune response to the infection and the vaccine response can interact, and any post-vaccine reaction is hard to attribute. Reschedule when recovered." },
    { id: "q-egg", type: "single-choice", question: "Patient with mild egg allergy (rash with eggs, no anaphylaxis). Action?", options: [
      { id: "a", label: "Cannot have any flu vaccine." }, { id: "b", label: "QIVe (egg-grown) is acceptable in mild egg allergy. For confirmed anaphylaxis to egg, use cell-grown QIVc or refer." }, { id: "c", label: "Cell-grown only, always." }, { id: "d", label: "Vaccinate intranasal." }
    ], correctOptionIds: ["b"], explanation: "Mild egg allergy is not a contraindication to egg-grown flu vaccine — egg protein content is below threshold. Anaphylaxis to egg = use QIVc or refer." },
    { id: "q-needle", type: "single-choice", question: "Adult, BMI 28, eligible for flu vaccine. Needle?", options: [
      { id: "a", label: "21G 50mm green." }, { id: "b", label: "23G 25mm blue, deltoid IM." }, { id: "c", label: "25G 16mm orange, subcut." }, { id: "d", label: "Any size works." }
    ], correctOptionIds: ["b"], explanation: "Standard adult deltoid IM is 23G 25mm (blue). Longer (38mm) if BMI very high. Subcut not standard for inactivated vaccine." },
    { id: "q-fainting", type: "single-choice", question: "Patient feels faint within 30 seconds of injection, pale, bradycardic, recovers in 1 minute. What is this?", options: [
      { id: "a", label: "Anaphylaxis — give adrenaline." }, { id: "b", label: "Vasovagal syncope — common, benign. Lay patient down with legs elevated, reassure, monitor." }, { id: "c", label: "Allergic reaction — antihistamine." }, { id: "d", label: "Drug reaction." }
    ], correctOptionIds: ["b"], explanation: "Vasovagal: pale, slow pulse, quick recovery. Anaphylaxis: flushed/urticaria, fast pulse, breathing/airway issues. The distinction is critical — never give adrenaline for vasovagal but always for anaphylaxis." },
    { id: "q-cannot-cause", type: "single-choice", question: "Patient says she won't have flu vaccine because 'it gave me flu last year'. Correct response?", options: [
      { id: "a", label: "Agree and decline to vaccinate." }, { id: "b", label: "Counsel that inactivated flu vaccine cannot cause flu — it contains no live virus. Local soreness and mild systemic symptoms (low-grade fever, fatigue) for 24–48h are common and are immune response, not infection. Also, coincidental other URIs are common in winter." }, { id: "c", label: "Vaccinate without counselling." }, { id: "d", label: "Switch to nasal." }
    ], correctOptionIds: ["b"], explanation: "This misconception is very common. Counsel pre-emptively. Inactivated vaccine cannot cause infection. The reactogenicity is the immune system responding correctly." },
    { id: "q-anticoag", type: "single-choice", question: "Patient on warfarin (INR 2.5) wants flu vaccine. Action?", options: [
      { id: "a", label: "Cannot vaccinate." }, { id: "b", label: "Vaccinate using fine needle, deep IM, then apply firm pressure for 10 minutes. Document. Acceptable with INR in therapeutic range." }, { id: "c", label: "Stop warfarin first." }, { id: "d", label: "Subcut only." }
    ], correctOptionIds: ["b"], explanation: "Anticoagulants are not a contraindication. Use careful technique — fine needle, deep IM (or subcut if INR out of range), prolonged pressure." },
    { id: "q-record", type: "single-choice", question: "Documentation requirements?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Eligibility category, vaccine name/brand/batch/expiry, site, dose, contraindications excluded, consent confirmed, post-vaccination observation — in the ePGD tool. Also notify GP per usual flu vaccination protocol." }, { id: "c", label: "GP email only." }, { id: "d", label: "Verbal record." }
    ], correctOptionIds: ["b"], explanation: "Vaccination records must include batch number for cohort safety follow-up and GP notification per standard flu protocols." },
  ],
};
