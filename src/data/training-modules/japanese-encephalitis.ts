// Japanese encephalitis vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const japaneseEncephalitisModule: TrainingModule = {
  slug: "japanese-encephalitis",
  title: "Japanese Encephalitis Vaccination (Ixiaro) — PGD",
  description: "Pre-travel Japanese encephalitis vaccination under PGD.",
  pgdSlugs: ["japanese-encephalitis"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 8,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Japanese Encephalitis — Training", subtitle: "Ixiaro for at-risk travellers", estimatedMinutes: 8, objectives: [
      "Identify destinations and traveller profiles needing JE vaccine.",
      "Apply 2-dose schedule.",
      "Counsel on bite avoidance and the rationale for vaccination.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Japanese encephalitis (JEV) is a mosquito-borne flavivirus endemic in rural Asia (parts of India, Bangladesh, Nepal, Myanmar, Thailand, Vietnam, China, Korea, Japan, Indonesia, Philippines). Transmitted by Culex mosquitoes, breeding in rice paddies.",
      "Most infections asymptomatic. Clinical disease has 30% mortality and severe neurological sequelae in survivors. Children at higher risk.",
      "Ixiaro is inactivated 2-dose vaccine. Indication: rural travel of ≥1 month in transmission season, or shorter trips with paddy/animal/rural exposure.",
    ], highlights: ["Endemic to rural Asia, Culex mosquito vector.", "2 doses 28 days apart (accelerated 7-day option for adults 18–65).", "Long-stay rural travellers or short-trip rice-paddy exposure."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Travel to JE-endemic area", detail: "Check TravelHealthPro / Fit for Travel for current country-specific advice." },
      { label: "Itinerary involves rural exposure / rice paddies / animal contact OR long-stay (≥1 month)", detail: "Urban short-stay generally low risk." },
      { label: "Adult, 18+ for standard PGD", detail: "Children 2 months+ licensed but specialist territory under most PGD." },
      { label: "Not pregnant — relative contraindication", detail: "Limited safety data; consider only if very high exposure risk. Refer for specialist." },
      { label: "No anaphylaxis to vaccine component", detail: "Refer." },
      { label: "No acute febrile illness today", detail: "Postpone." },
    ]},
    { id: "schedule-counselling", type: "checklist", title: "Schedule, administration, counselling", items: [
      { label: "Standard schedule", detail: "2 doses (0.5 mL) IM deltoid, 28 days apart. Complete ≥7 days before travel." },
      { label: "Accelerated schedule (adults 18–65)", detail: "0 and 7 days. Useful if standard schedule can't complete before travel. Same product." },
      { label: "Site", detail: "Deltoid IM, 23G 25mm." },
      { label: "Bite avoidance", detail: "DEET, permethrin-treated clothing, mosquito nets — essential alongside vaccine." },
      { label: "Booster", detail: "Single booster at 12–24 months for continued exposure." },
      { label: "Side effects", detail: "Local pain, headache, myalgia, fatigue. Usually mild." },
      { label: "Counsel", detail: "JE rare in travellers but high case-fatality. Vaccination + bite avoidance complementary." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Rural Asia endemic. Vaccinate for long-stay or rural/paddy exposure.",
      "2 doses 28 days apart (standard) or 0/7 days (accelerated for adults).",
      "Pregnancy = refer specialist (limited data).",
      "Bite avoidance mandatory alongside.",
      "Booster at 12–24 months for ongoing exposure.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman travelling to rural Vietnam. Action?", options: [
      { id: "a", label: "Vaccinate." }, { id: "b", label: "Refer specialist travel clinic — limited pregnancy safety data; specialist context for risk-benefit." }, { id: "c", label: "Half dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Limited data. Specialist input for high-exposure pregnancy scenarios." },
    { id: "q-rural", type: "single-choice", critical: true, question: "Short urban-only trip to Tokyo in winter. JE vaccine?", options: [
      { id: "a", label: "Mandatory." }, { id: "b", label: "Not needed. JE is rural Culex-borne; urban trips, especially out of transmission season, are very low risk." }, { id: "c", label: "Single dose." }, { id: "d", label: "Half dose." }
    ], correctOptionIds: ["b"], explanation: "Urban, short-stay, out-of-season trips don't need JE vaccine. Counsel on lack of need based on TravelHealthPro." },
    { id: "q-rice", type: "single-choice", critical: true, question: "2-week farm-stay in rural Cambodia, rice paddy area, in monsoon season. Action?", options: [
      { id: "a", label: "Not needed." }, { id: "b", label: "Vaccinate — rural rice-paddy exposure in transmission season is the classic JE-risk scenario. 2-dose course before travel." }, { id: "c", label: "Bite avoidance alone." }, { id: "d", label: "Single dose." }
    ], correctOptionIds: ["b"], explanation: "Rice-paddy + transmission season + rural = classic JE risk. Vaccinate." },
    { id: "q-schedule-accelerated", type: "single-choice", question: "Adult patient travelling in 10 days needs JE vaccine. Schedule?", options: [
      { id: "a", label: "Standard 28-day course." }, { id: "b", label: "Accelerated 0/7-day schedule for adults 18–65 — complete ≥7 days before travel." }, { id: "c", label: "Single dose." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Accelerated 0/7 schedule allows completion within travel timeline for adults." },
    { id: "q-route", type: "single-choice", question: "Site and route?", options: [
      { id: "a", label: "Subcut." }, { id: "b", label: "Deltoid IM, 23G 25mm." }, { id: "c", label: "Gluteal." }, { id: "d", label: "Intradermal." }
    ], correctOptionIds: ["b"], explanation: "Standard adult IM deltoid." },
    { id: "q-bite-avoidance", type: "single-choice", question: "Patient asks if vaccine alone is enough.", options: [
      { id: "a", label: "Yes." }, { id: "b", label: "No — bite avoidance is essential alongside. JE is rare but vaccine isn't 100%; mosquito avoidance also reduces other infections (dengue, chikungunya)." }, { id: "c", label: "Bite avoidance enough alone." }, { id: "d", label: "Antiviral alongside." }
    ], correctOptionIds: ["b"], explanation: "Combined approach. Bite avoidance addresses many infections, not just JE." },
    { id: "q-booster", type: "single-choice", question: "Booster timing?", options: [
      { id: "a", label: "Lifetime cover." }, { id: "b", label: "Single booster at 12–24 months for ongoing exposure. Not generally needed for one-off travel." }, { id: "c", label: "Annual." }, { id: "d", label: "5-yearly." }
    ], correctOptionIds: ["b"], explanation: "Booster at 12–24 months if continued exposure. Not for one-off trip." },
    { id: "q-anaphylaxis", type: "single-choice", question: "Previous anaphylaxis to JE vaccine. Action?", options: [
      { id: "a", label: "Re-vaccinate." }, { id: "b", label: "Refer allergy. Anaphylaxis = absolute contraindication." }, { id: "c", label: "Half dose." }, { id: "d", label: "Pre-medicate." }
    ], correctOptionIds: ["b"], explanation: "Anaphylaxis = absolute contraindication." },
    { id: "q-source", type: "single-choice", question: "Source for country-specific JE risk?", options: [
      { id: "a", label: "Patient memory." }, { id: "b", label: "NaTHNaC TravelHealthPro / Fit for Travel." }, { id: "c", label: "BNF." }, { id: "d", label: "Lonely Planet." }
    ], correctOptionIds: ["b"], explanation: "Country-specific advice from TravelHealthPro / Fit for Travel." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Destination, exposure profile (rural/season), dose number, batch, bite-avoidance counselling, schedule (standard vs accelerated) — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates the indication-justification (rural / season / activity) and the schedule chosen." },
  ],
};
