// HPV vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const hpvModule: TrainingModule = {
  slug: "hpv",
  title: "HPV Vaccination (Gardasil 9) — PGD",
  description: "Adult HPV vaccination with Gardasil 9 under PGD.",
  pgdSlugs: ["hpv"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "HPV Vaccination — Training", subtitle: "Gardasil 9 for adult HPV vaccination", estimatedMinutes: 10, objectives: [
      "Identify adult cohorts eligible for HPV vaccination per Green Book.",
      "Apply correct dose schedule (varies by age and immune status).",
      "Counsel on benefit, side effects, and timing.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "HPV (Human Papillomavirus) causes most cervical cancer, plus anal, oropharyngeal, vulval, vaginal, penile cancers, and genital warts. Vaccination prevents infection with the included strains.",
      "Gardasil 9 covers 9 HPV types (6, 11, 16, 18, 31, 33, 45, 52, 58). Highly effective if given before sexual debut; still beneficial later (covers strains not already acquired).",
      "UK programme: routine for girls and boys aged 12–13 in schools (single dose since 2024). Adult catch-up for those who missed school programme, plus MSM up to 45, plus HIV-positive adults, plus other risk groups.",
    ], highlights: ["Gardasil 9 covers 9 HPV types — broader than older Gardasil 4 or Cervarix.", "Single dose now standard for those ≤25; 2-dose for 26+.", "Still beneficial after sexual debut — protects against unacquired strains."] },
    { id: "eligibility", type: "checklist", title: "Eligibility (adult cohorts)", intro: "Check current Green Book chapter 18a.", items: [
      { label: "Adults missing the routine school programme", detail: "Catch-up varies — often available up to age 25 (or wider in some areas). Check local commissioning." },
      { label: "MSM up to age 45", detail: "NHS-funded eligibility for men who have sex with men, recognising HPV-related anal/oropharyngeal cancer risk." },
      { label: "HIV-positive adults", detail: "Up to age 45." },
      { label: "Sex workers", detail: "Eligible per Green Book." },
      { label: "Trans women aged ≤45", detail: "Eligible if at risk of HPV." },
      { label: "Private patients outside NHS eligibility", detail: "Can self-fund per local arrangement; PGD covers administration." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Do not vaccinate.", detail: [
      "Previous anaphylaxis to HPV vaccine or any component.",
      "Severe acute febrile illness today — postpone.",
      "Pregnancy — defer until postpartum. Not absolute contraindication if accidentally given but not initiated in pregnancy.",
      "Severe immunocompromise where vaccine response is expected to be very poor — consider deferring until immune recovery (specialist judgment).",
    ]},
    { id: "schedule", type: "comparison", title: "Dose schedule", intro: "By age at first dose.", columns: [
      { label: "Aged 9–25 immunocompetent", rows: [
        { heading: "Schedule", body: "Single dose now standard (per JCVI 2023+)." },
        { heading: "Why single dose", body: "Robust trial evidence for non-inferior protection. Programme simplification." },
      ]},
      { label: "Aged 26+ OR immunocompromised", rows: [
        { heading: "Schedule", body: "3-dose schedule: 0, 2 months, 6 months." },
        { heading: "Why", body: "Older or immunocompromised individuals get suboptimal response from single dose; multi-dose ensures protection." },
        { heading: "Minimum intervals", body: "First to second ≥1 month. Second to third ≥3 months from second, ≥6 months from first." },
      ]},
    ]},
    { id: "administration", type: "checklist", title: "Administration", items: [
      { label: "Site", detail: "Deltoid IM." },
      { label: "Needle", detail: "23G 25mm (blue) standard adult." },
      { label: "Dose", detail: "0.5 mL IM." },
      { label: "Co-administration", detail: "Acceptable with other inactivated vaccines (flu, COVID, MenACWY) — different deltoids." },
      { label: "Pre-check", detail: "Eligibility, contraindications, consent, vaccine name/batch/expiry." },
      { label: "Post-vaccination observation", detail: "15 minutes minimum, anaphylaxis preparedness." },
      { label: "Document", detail: "Dose number, batch, site, expiry. NIMS upload per current programme." },
    ]},
    { id: "side-effects", type: "checklist", title: "Side effects", items: [
      { label: "Common — local", detail: "Pain, redness, swelling at injection site." },
      { label: "Common — systemic", detail: "Headache, fatigue, low-grade fever. Usually 24–48h." },
      { label: "Vasovagal", detail: "Common after vaccination in young adults — sit/lie down on vaccination, observe 15 mins." },
      { label: "Rare — anaphylaxis", detail: "Standard protocol." },
      { label: "Counselling", detail: "Reassure — most common pre-vaccine question is 'does it hurt'. Acknowledge but reassure injection itself is brief." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Gardasil 9 covers 9 strains.",
      "Single dose aged 9–25 immunocompetent; 3-dose for 26+ or immunocompromised.",
      "Adult cohorts: school catch-up, MSM ≤45, HIV+, sex workers, trans women.",
      "Pregnancy: defer to postpartum.",
      "Anaphylaxis preparedness mandatory.",
      "Document batch and upload to NIMS.",
    ]},
  ],
  quiz: [
    { id: "q-anaphylaxis", type: "single-choice", critical: true, question: "Patient had anaphylaxis to first HPV dose. Action?", options: [
      { id: "a", label: "Give second dose." }, { id: "b", label: "Do not give further HPV under PGD. Refer to GP/allergy clinic for specialist assessment." }, { id: "c", label: "Half dose." }, { id: "d", label: "Pre-medicate." }
    ], correctOptionIds: ["b"], explanation: "Previous anaphylaxis is absolute contraindication. Specialist assessment." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient eligible by age wants HPV vaccination. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Defer until postpartum. HPV vaccine not routinely given in pregnancy (no firm safety data); not absolute contraindication but defer." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refer to obstetric." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy = defer to postpartum. Not absolute contraindication but precautionary." },
    { id: "q-single-vs-multi", type: "single-choice", critical: true, question: "30-year-old MSM eligible for HPV. Schedule?", options: [
      { id: "a", label: "Single dose." }, { id: "b", label: "3-dose schedule (0, 2, 6 months) — for age 26+ or immunocompromised. Single dose only for immunocompetent 9–25." }, { id: "c", label: "2 doses." }, { id: "d", label: "5 doses." }
    ], correctOptionIds: ["b"], explanation: "Single-dose age cutoff is 25 in immunocompetent. 26+ or immunocompromised = 3-dose schedule." },
    { id: "q-immunocompromised", type: "single-choice", question: "HIV-positive 28-year-old. Schedule?", options: [
      { id: "a", label: "Single dose." }, { id: "b", label: "3-dose (0, 2, 6 months). Immunocompromised get multi-dose regardless of age." }, { id: "c", label: "2 doses." }, { id: "d", label: "No vaccine." }
    ], correctOptionIds: ["b"], explanation: "Immunocompromise = 3-dose, irrespective of age." },
    { id: "q-existing-hpv", type: "single-choice", question: "29-year-old MSM with previous genital warts asks if vaccine is still worthwhile.", options: [
      { id: "a", label: "Useless once you have HPV." }, { id: "b", label: "Still beneficial — vaccinates against 9 HPV types; he probably has only 1–2 currently. Protects against the others, especially high-risk types causing cancer (16, 18)." }, { id: "c", label: "Useless." }, { id: "d", label: "Worsens existing warts." }
    ], correctOptionIds: ["b"], explanation: "Vaccination remains beneficial — protects against not-yet-acquired strains. Particularly anal cancer-causing types." },
    { id: "q-needle", type: "single-choice", question: "Adult HPV vaccine site and needle?", options: [
      { id: "a", label: "Gluteal IM." }, { id: "b", label: "Deltoid IM with 23G 25mm needle." }, { id: "c", label: "Subcut." }, { id: "d", label: "Intradermal." }
    ], correctOptionIds: ["b"], explanation: "Standard adult deltoid IM. Same as other adult inactivated vaccines." },
    { id: "q-co-admin", type: "single-choice", question: "Can HPV be given same day as MenACWY or flu vaccine?", options: [
      { id: "a", label: "No — separate by 4 weeks." }, { id: "b", label: "Yes — co-administration acceptable. Different deltoids. Both inactivated, no interference." }, { id: "c", label: "Yes only if same brand." }, { id: "d", label: "Only with specialist approval." }
    ], correctOptionIds: ["b"], explanation: "Inactivated vaccines can be co-administered. Common to give MenACWY + HPV in adolescent catch-up programmes." },
    { id: "q-vasovagal", type: "single-choice", question: "Young patient feels faint 1 minute after HPV injection, pale, recovers quickly. Action?", options: [
      { id: "a", label: "Anaphylaxis kit." }, { id: "b", label: "Vasovagal — common in young adults. Lay patient down with legs elevated; reassure; observe. Distinguish from anaphylaxis (vasovagal: pale, bradycardic, quick recovery; anaphylaxis: flushed/urticaria, tachycardic, breathing issue)." }, { id: "c", label: "Antibiotic." }, { id: "d", label: "Stop programme." }
    ], correctOptionIds: ["b"], explanation: "Vasovagal is the commonest reaction in young adults to injections. Don't confuse with anaphylaxis." },
    { id: "q-coverage", type: "single-choice", question: "Gardasil 9 protects against how many HPV types?", options: [
      { id: "a", label: "2 (16, 18)." }, { id: "b", label: "9 types: 6, 11, 16, 18, 31, 33, 45, 52, 58 — both low-risk (warts) and high-risk (cancer)." }, { id: "c", label: "4." }, { id: "d", label: "20." }
    ], correctOptionIds: ["b"], explanation: "Gardasil 9 covers 9 HPV types — broader than older 4-valent or bivalent vaccines." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Eligibility category, dose number, vaccine batch/expiry, site, age, immune status (determining single vs multi-dose), contraindications excluded, consent, post-vaccination observation — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Verbal." }
    ], correctOptionIds: ["b"], explanation: "Structured record especially captures the determinants of single-vs-multi-dose schedule (age, immune status)." },
  ],
};
