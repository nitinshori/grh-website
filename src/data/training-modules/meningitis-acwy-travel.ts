// Meningitis ACWY travel vaccine — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const meningitisAcwyTravelModule: TrainingModule = {
  slug: "meningitis-acwy-travel",
  title: "Meningitis ACWY (Travel) — PGD",
  description: "Pre-travel quadrivalent ACWY meningococcal vaccination under PGD.",
  pgdSlugs: ["meningitis-acwy-travel"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 8,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "MenACWY Travel — Training", subtitle: "Pre-travel quadrivalent meningococcal vaccine", estimatedMinutes: 8, objectives: [
      "Identify travel scenarios requiring MenACWY (Hajj/Umrah, meningitis belt, outbreaks).",
      "Administer single-dose vaccine correctly.",
      "Coordinate with Saudi Arabia entry requirements for Hajj/Umrah.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Neisseria meningitidis serogroups A, C, W, Y cause invasive meningococcal disease. UK routine programme already covers MenACWY in adolescents and freshers.",
      "Travel indications: Hajj or Umrah pilgrimage (Saudi Arabia mandates ACWY entry requirement, certificate within 10 days–3 years of arrival), meningitis belt of Sub-Saharan Africa especially in dry season, outbreak response, certain other long-stay rural travel.",
      "Single dose for routine travel use (Menveo or Nimenrix). Effective within 10 days; protection ~5 years.",
    ], highlights: ["Hajj/Umrah pilgrims need ACWY certificate for KSA entry.", "Meningitis belt (Sub-Saharan Africa, dry season).", "Single dose, effective within 10 days, protection ~5 years."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Hajj or Umrah pilgrim", detail: "KSA requires ACWY certificate, valid 10 days–3 years before arrival." },
      { label: "Travel to meningitis belt in dry season", detail: "Sub-Saharan Africa from December to June, rural / pilgrimage scenarios. Check TravelHealthPro." },
      { label: "Outbreak / cluster response", detail: "Per public-health response." },
      { label: "Long-stay in close contact with local population in endemic area", detail: "E.g. NGO work, mission, healthcare." },
      { label: "Adult 16+ for standard PGD", detail: "Children — refer to GP / paediatric for current schedule." },
      { label: "Not pregnant — relative", detail: "Refer for risk-benefit if high exposure." },
    ]},
    { id: "schedule-administration", type: "checklist", title: "Schedule and administration", items: [
      { label: "Single dose Menveo or Nimenrix", detail: "0.5 mL IM deltoid. 23G 25mm." },
      { label: "Timing", detail: "Effective within 10 days; ideally complete ≥10 days before travel. KSA certificate must be ≥10 days but ≤3 years old at arrival." },
      { label: "Booster", detail: "5-yearly for ongoing risk (occupational, recurrent travel)." },
      { label: "Co-administration", detail: "Acceptable with other inactivated vaccines, different deltoids." },
      { label: "Already had MenACWY as teenager", detail: "If <5 years ago, no need to re-vaccinate. If ≥5 years or for Hajj/Umrah, single booster." },
      { label: "Document", detail: "Certificate / written record for KSA officials. Batch, expiry, NIMS upload." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Single dose Menveo or Nimenrix IM.",
      "Hajj/Umrah pilgrims: KSA entry requirement, certificate within 10 days–3 years of arrival.",
      "Effective from 10 days; protection ~5 years.",
      "Co-administer with other inactivated vaccines.",
      "Provide written certificate for travel — KSA officials inspect.",
    ]},
  ],
  quiz: [
    { id: "q-hajj", type: "single-choice", critical: true, question: "Patient flying to Hajj in 7 days. Has not had MenACWY. Action?", options: [
      { id: "a", label: "Vaccinate today — certificate immediately valid." }, { id: "b", label: "Vaccinate today, but counsel KSA entry requires certificate to be ≥10 days old at arrival. If trip is in 7 days, certificate won't be valid for entry — strongly consider delaying flight by a few days, OR check current KSA rules as they have varied." }, { id: "c", label: "No vaccine needed." }, { id: "d", label: "Single dose immediately." }
    ], correctOptionIds: ["b"], explanation: "KSA requires ACWY certificate ≥10 days old at arrival. Patient timing this tight risks entry refusal. Educate / time accordingly." },
    { id: "q-belt-season", type: "single-choice", critical: true, question: "Patient travelling to rural northern Nigeria in February. Action?", options: [
      { id: "a", label: "Not needed." }, { id: "b", label: "Vaccinate MenACWY — meningitis belt, dry season (Dec–Jun), rural exposure = clear indication." }, { id: "c", label: "Half dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Meningitis belt + dry season + rural = vaccinate. February is peak transmission." },
    { id: "q-recent-vaccine", type: "single-choice", question: "Patient had MenACWY at age 14 as part of UK schedule (now 18). Wants Hajj travel. Action?", options: [
      { id: "a", label: "Re-vaccinate immediately." }, { id: "b", label: "Previous dose <5 years ago — protection assumed adequate. Provide written record of previous vaccination as certificate. No booster needed yet." }, { id: "c", label: "Single dose." }, { id: "d", label: "2 doses." }
    ], correctOptionIds: ["b"], explanation: "Recent prior vaccine = protection adequate. Provide certificate documenting it. Booster at 5 years if continuing risk." },
    { id: "q-pregnancy", type: "single-choice", question: "Pregnant patient travelling to Hajj. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Refer specialist — vaccination generally given if Hajj attendance proceeding due to KSA mandatory requirement and meningitis risk in crowded settings. Specialist input." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy + mandatory travel requirement = specialist input for risk-benefit." },
    { id: "q-route", type: "single-choice", question: "Site and route?", options: [
      { id: "a", label: "Subcut." }, { id: "b", label: "Deltoid IM, 23G 25mm. 0.5 mL." }, { id: "c", label: "Gluteal." }, { id: "d", label: "Intradermal." }
    ], correctOptionIds: ["b"], explanation: "Standard adult IM deltoid." },
    { id: "q-time-protection", type: "single-choice", question: "When does protection begin?", options: [
      { id: "a", label: "Immediately." }, { id: "b", label: "Within 10 days of vaccination. KSA certificate timing aligns with this." }, { id: "c", label: "4 weeks." }, { id: "d", label: "Within hours." }
    ], correctOptionIds: ["b"], explanation: "10 days for protection and certificate validity at KSA entry." },
    { id: "q-duration", type: "single-choice", question: "Duration of protection?", options: [
      { id: "a", label: "1 year." }, { id: "b", label: "~5 years. Booster considered after 5 years for continuing risk." }, { id: "c", label: "Lifetime." }, { id: "d", label: "10 years." }
    ], correctOptionIds: ["b"], explanation: "5 years standard duration. Booster for ongoing risk." },
    { id: "q-co-admin", type: "single-choice", question: "Can co-administer with yellow fever?", options: [
      { id: "a", label: "Never." }, { id: "b", label: "MenACWY (inactivated) co-administered with yellow fever (live) acceptable — different deltoids. Inactivated vaccines have no spacing requirement; live vaccines either same day or ≥4 weeks." }, { id: "c", label: "Space by 4 weeks." }, { id: "d", label: "Only if same brand." }
    ], correctOptionIds: ["b"], explanation: "Same-day administration of inactivated + live vaccine is fine. The 4-week spacing rule only applies between two live vaccines if not given same day." },
    { id: "q-certificate", type: "single-choice", question: "Patient asks for written certificate for KSA officials.", options: [
      { id: "a", label: "Not required." }, { id: "b", label: "Mandatory for KSA entry. Provide written/digital certificate documenting MenACWY vaccination with date, batch, vaccine name, signed by clinician." }, { id: "c", label: "GP-only certificates." }, { id: "d", label: "Verbal." }
    ], correctOptionIds: ["b"], explanation: "KSA officials require documented certificate. Standard practice — patient needs it for boarding/entry." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Travel destination, indication (Hajj/Umrah/meningitis belt/other), batch, certificate issued, contraindications excluded — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record especially captures the certificate issuance for travel-mandate vaccination." },
  ],
};
