// Hepatitis B vaccination — occupational PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const hepBOccupationalModule: TrainingModule = {
  slug: "hep-b-occupational",
  title: "Hepatitis B Vaccination (Occupational) — PGD",
  description: "Hep B primary course and boosters for occupationally-at-risk adults under PGD.",
  pgdSlugs: ["hep-b-occupational"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Hep B (Occupational) — Training", subtitle: "Hep B vaccination for at-risk workers and post-exposure", estimatedMinutes: 10, objectives: [
      "Identify occupational and clinical at-risk groups for Hep B.",
      "Apply standard and accelerated schedules.",
      "Coordinate post-vaccination antibody testing where required.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Hepatitis B is bloodborne; vaccination is highly effective. Routine paediatric Hep B vaccination introduced 2017 (combined vaccine), so younger adults are increasingly vaccinated; older adults are typically not.",
      "Adult vaccination indications: occupational risk (healthcare workers, laboratory, prison, emergency services), lifestyle risk (MSM, sex workers, IDU), clinical risk (CKD, chronic liver disease, recipients of blood/blood products), travel to high-prevalence areas, partners/family of HBsAg-positive individuals.",
      "Standard schedule 0, 1, 6 months. Accelerated 0, 1, 2 months + 12 months booster (or 0, 7, 21 days for rapid pre-travel). Combined Hep A+B (Twinrix) is convenient for travel.",
    ], highlights: ["Routine paediatric Hep B since 2017 — younger adults often already vaccinated.", "Adult schedules: standard (0,1,6m), accelerated (0,1,2m+booster), or very rapid (0,7,21d+booster).", "Post-vaccination antibody check required for HCWs and similar high-risk groups."] },
    { id: "eligibility", type: "checklist", title: "Eligibility (adult cohorts)", intro: "Per Green Book chapter 18.", items: [
      { label: "Healthcare workers", detail: "Direct patient contact, EPP staff (exposure-prone procedures), laboratory staff with blood exposure." },
      { label: "Emergency services / prison / care workers", detail: "Police, ambulance, prison officers, social workers — needlestick / bloodborne exposure risk." },
      { label: "Lifestyle risk", detail: "MSM, sex workers, multiple sexual partners, IDU." },
      { label: "Clinical risk", detail: "Chronic kidney disease (often on haemodialysis), chronic liver disease, recipients of pooled blood products." },
      { label: "Household / sexual contacts of HBsAg-positive person", detail: "Indication for vaccination." },
      { label: "Travel to high-prevalence areas with risk activities", detail: "Long stay, healthcare work abroad, adventure sports with injury risk, sexual exposure." },
      { label: "Post-exposure (needlestick, sexual exposure)", detail: "Rapid accelerated schedule + immunoglobulin in some scenarios. Refer occupational health / urgent care." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Refer for these.", detail: [
      "Previous anaphylaxis to Hep B vaccine or component.",
      "Severe acute febrile illness — postpone.",
      "Pregnancy is NOT a contraindication for Hep B vaccine — inactivated, safe.",
      "Bleeding disorder / anticoagulation — vaccinate with caution (fine needle, IM, pressure).",
    ]},
    { id: "schedules", type: "comparison", title: "Vaccination schedules", intro: "Choose by clinical urgency.", columns: [
      { label: "Standard (0, 1, 6 months)", rows: [
        { heading: "Use", body: "Most adult immunisation. Best long-term antibody response." },
        { heading: "Time to seroconversion", body: "After 3rd dose. Check anti-HBs antibody 1–4 months later for HCWs / at-risk groups." },
      ]},
      { label: "Accelerated (0, 1, 2 months) + booster at 12 months", rows: [
        { heading: "Use", body: "When earlier protection needed (occupational, travel imminent)." },
        { heading: "Time to seroconversion", body: "After 3rd dose (by month 2). Booster at 12 months for durable protection." },
      ]},
      { label: "Very rapid (0, 7, 21 days) + booster at 12 months", rows: [
        { heading: "Use", body: "Imminent travel or urgent occupational need. Twinrix or Engerix B." },
        { heading: "Time to seroconversion", body: "After 3rd dose (by ~day 28). Lower long-term titres without 12-month booster — booster is mandatory." },
      ]},
    ]},
    { id: "post-vacc-test", type: "callout", title: "Post-vaccination antibody testing", tone: "info", message: "Required for some cohorts.", detail: [
      "Healthcare workers, laboratory staff, EPP staff: anti-HBs titre 1–4 months after completing course.",
      "Anti-HBs ≥100 mIU/mL: adequate response, long-term protection assumed.",
      "Anti-HBs 10–99 mIU/mL: suboptimal — additional booster recommended.",
      "Anti-HBs <10 mIU/mL: non-responder. Repeat 3-dose course. Test again; if still <10 = persistent non-responder (~5% of vaccinees), needs occupational health management.",
      "Most well adult responders don't require regular boosters beyond initial course.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Standard 0, 1, 6 months; accelerated 0, 1, 2 + booster; very rapid 0, 7, 21d + booster.",
      "Pregnancy NOT a contraindication.",
      "Post-vaccination antibody test for HCWs and similar.",
      "Combined Hep A+B (Twinrix) convenient for travel.",
      "Non-responder = repeat course; persistent non-responder needs occupational health.",
      "Post-exposure scenario = refer urgent occupational health / A&E.",
    ]},
  ],
  quiz: [
    { id: "q-needlestick", type: "single-choice", critical: true, question: "HCW had needlestick injury 4 hours ago, donor's Hep B status unknown. Action?", options: [
      { id: "a", label: "Start standard schedule." }, { id: "b", label: "Refer urgent occupational health / A&E — needlestick has specific post-exposure protocol: rapid Hep B vaccination + sometimes immunoglobulin + HIV PEP consideration + source testing. Time-critical." }, { id: "c", label: "Standard counsel." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Needlestick injury triggers urgent occupational health protocol — bloodborne virus risk assessment, multiple potential interventions. Not pharmacy PGD scope." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman (HCW) wants Hep B vaccine. Action?", options: [
      { id: "a", label: "Defer until postpartum." }, { id: "b", label: "Vaccinate — Hep B is inactivated, NOT contraindicated in pregnancy. Particularly important for HCWs who may be exposed." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Hep B is inactivated and safe in pregnancy. Particularly relevant for occupational risk groups." },
    { id: "q-anaphylaxis", type: "single-choice", critical: true, question: "Previous anaphylaxis to Hep B vaccine. Action?", options: [
      { id: "a", label: "Repeat dose." }, { id: "b", label: "Refer allergy clinic — anaphylaxis is absolute contraindication. Alternative formulations may exist via specialist." }, { id: "c", label: "Half dose." }, { id: "d", label: "Pre-medicate." }
    ], correctOptionIds: ["b"], explanation: "Anaphylaxis to vaccine is contraindication. Specialist assessment for alternatives." },
    { id: "q-anti-hbs", type: "single-choice", critical: true, question: "HCW completed 3-dose Hep B course. Anti-HBs titre at 2 months: 5 mIU/mL. Action?", options: [
      { id: "a", label: "Adequately protected." }, { id: "b", label: "Non-responder (anti-HBs <10). Repeat the 3-dose course. Re-test after second course; if still <10 = persistent non-responder needing occupational health management." }, { id: "c", label: "Boost annually." }, { id: "d", label: "Switch to different vaccine." }
    ], correctOptionIds: ["b"], explanation: "Anti-HBs <10 = non-responder. Standard practice is to repeat the course. ~5% remain non-responders. Important for HCW occupational health." },
    { id: "q-mid-range", type: "single-choice", question: "HCW anti-HBs at 3 months = 50 mIU/mL. Action?", options: [
      { id: "a", label: "Adequate protection." }, { id: "b", label: "Suboptimal response — single booster dose typically given, then re-test. Aiming for ≥100 mIU/mL." }, { id: "c", label: "Repeat 3-dose course." }, { id: "d", label: "Stop programme." }
    ], correctOptionIds: ["b"], explanation: "10–99 mIU/mL = suboptimal. Single booster usually brings titre above 100. Re-test after booster." },
    { id: "q-rapid", type: "single-choice", question: "Patient flies in 3 weeks; needs urgent Hep B. Schedule?", options: [
      { id: "a", label: "Standard 0, 1, 6 months." }, { id: "b", label: "Very rapid 0, 7, 21 days + booster at 12 months. Twinrix or Engerix B. Reasonable protection by day 28; 12-month booster mandatory for durable response." }, { id: "c", label: "Single dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Very rapid schedule fits the imminent travel timeline. 12-month booster non-negotiable due to lower seroconversion at this rapid schedule." },
    { id: "q-twinrix", type: "single-choice", question: "Patient travelling needs both Hep A and Hep B. What's convenient?", options: [
      { id: "a", label: "Separate vaccines, separate visits." }, { id: "b", label: "Twinrix (combined Hep A + Hep B) — single product, fewer injections. Same dose schedule." }, { id: "c", label: "Twinrix at half dose." }, { id: "d", label: "Hep A only." }
    ], correctOptionIds: ["b"], explanation: "Twinrix is the combined product. Convenient for travel; same schedule options." },
    { id: "q-route", type: "single-choice", question: "Site and route?", options: [
      { id: "a", label: "Gluteal subcut." }, { id: "b", label: "Deltoid IM with 23G 25mm. Gluteal IM is NOT acceptable (reduced response). Buttock fat thicker, vaccine doesn't reach muscle reliably." }, { id: "c", label: "Subcut." }, { id: "d", label: "Intradermal." }
    ], correctOptionIds: ["b"], explanation: "Hep B must go into muscle, not fat. Deltoid IM. Gluteal injection has lower immunogenicity and is not recommended." },
    { id: "q-bleeding-disorder", type: "single-choice", question: "Patient on warfarin (INR 2.5) needs Hep B. Action?", options: [
      { id: "a", label: "Cannot vaccinate." }, { id: "b", label: "Vaccinate IM with fine needle, deep deltoid IM, prolonged pressure ≥10 minutes. Document. Not contraindicated." }, { id: "c", label: "Subcut." }, { id: "d", label: "Stop warfarin." }
    ], correctOptionIds: ["b"], explanation: "Anticoagulation is not contraindication. Careful IM technique with prolonged pressure." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Cohort (occupational, lifestyle, clinical), dose number, schedule chosen, batch, post-vaccination antibody test plan if applicable — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record especially captures the cohort and the antibody-test plan (mandatory for HCWs)." },
  ],
};
