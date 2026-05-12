// Typhoid vaccination — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const typhoidModule: TrainingModule = {
  slug: "typhoid",
  title: "Typhoid Vaccination — PGD",
  description: "Pre-travel typhoid vaccination (Vi polysaccharide or oral Ty21a) under PGD.",
  pgdSlugs: ["typhoid"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 8,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Typhoid — Training", subtitle: "Vi polysaccharide injection or oral Ty21a", estimatedMinutes: 8, objectives: [
      "Choose between injectable Vi and oral Ty21a based on patient factors.",
      "Counsel on schedule, food/water precautions, and limited efficacy.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Typhoid fever caused by Salmonella enterica serovar Typhi. Acquired via contaminated food/water in endemic areas (Indian subcontinent especially, sub-Saharan Africa, parts of SE Asia and Latin America).",
      "Two UK options: Vi polysaccharide injectable (single dose, ~70% efficacy, ~3 years protection) or Ty21a live oral capsules (3 capsules over 5 days, ~70% efficacy, ~3 years protection).",
      "Food/water hygiene is at least as important as vaccination — neither is highly efficacious.",
    ], highlights: ["Two options: Vi injection (single dose, inactivated) or oral Ty21a (3 capsules over 5 days, live).", "Both ~70% efficacy — food and water hygiene essential alongside.", "Oral Ty21a contraindicated in immunocompromised and pregnancy (live)."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Travel to typhoid-endemic area", detail: "Check TravelHealthPro / Fit for Travel. Highest risk: Indian subcontinent. Long-stay or adventurous travel = stronger indication." },
      { label: "Adult (≥2 years for Vi injection, ≥6 years for oral)", detail: "Children — Vi injection from 2 years; oral Ty21a from 6 years." },
      { label: "Not pregnant — oral Ty21a contraindicated (live)", detail: "Vi injection acceptable in pregnancy if benefit justifies." },
      { label: "Not immunocompromised — for oral Ty21a", detail: "Live vaccine — Vi injection is acceptable in immunocompromised." },
      { label: "Not currently on antibiotics interacting with oral Ty21a", detail: "Antibiotics inactivate the live oral vaccine. Wait 3 days after antibiotic course." },
      { label: "Not had acute GI illness recently — for oral Ty21a", detail: "Affects absorption." },
    ]},
    { id: "comparison", type: "comparison", title: "Vi injection vs Ty21a oral", columns: [
      { label: "Vi polysaccharide (Typhim Vi, Typherix) — injectable", rows: [
        { heading: "Schedule", body: "Single 0.5 mL IM deltoid. Effective from day 7; booster every 3 years for continuing risk." },
        { heading: "Pros", body: "Single dose. Inactivated — safe in pregnancy and immunocompromise. No drug interactions." },
        { heading: "Cons", body: "Injection. ~70% efficacy." },
        { heading: "Best for", body: "Most adult travellers." },
      ]},
      { label: "Ty21a (Vivotif) — oral live", rows: [
        { heading: "Schedule", body: "3 capsules taken on days 1, 3, 5 (with cold water, on empty stomach, separate from antibiotics)." },
        { heading: "Pros", body: "No injection. Slightly broader (mucosal + systemic) immunity." },
        { heading: "Cons", body: "Live vaccine — contraindicated in pregnancy and immunocompromise. Antibiotics inactivate. Strict storage (refrigerated until use)." },
        { heading: "Best for", body: "Patients preferring oral; needs adherence." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", intro: "Critical because efficacy is only ~70%.", items: [
      { label: "Food and water hygiene", detail: "Bottled or boiled water; avoid ice, salads washed in tap water, undercooked food, unpasteurised dairy, street food unless from busy reputable stalls. 'Boil it, peel it, cook it, or forget it.'" },
      { label: "Hand hygiene", detail: "Before meals, after toilet. Alcohol-based sanitiser useful when soap not available." },
      { label: "Vaccine timing", detail: "Vi: from day 7. Oral: complete course before travel; protection from week 1 after last dose." },
      { label: "Symptoms", detail: "Fever, headache, abdominal pain, constipation more often than diarrhoea in classic typhoid. Persistent fever in returning traveller = urgent assessment for typhoid, malaria, others." },
      { label: "Booster timing", detail: "Vi: every 3 years for ongoing risk. Ty21a: full course every 3 years for ongoing risk." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Vi injection (single dose, inactivated) or Ty21a oral (3 capsules, live).",
      "Vi acceptable in pregnancy / immunocompromise. Ty21a contraindicated in these.",
      "Antibiotics inactivate Ty21a — separate by 3 days.",
      "~70% efficacy — food and water hygiene at least as important.",
      "Booster every 3 years for ongoing risk.",
      "Persistent fever in returning traveller — urgent assessment.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman travelling to India wants typhoid vaccine. Action?", options: [
      { id: "a", label: "Oral Ty21a." }, { id: "b", label: "Vi polysaccharide injection — inactivated, acceptable in pregnancy. Oral Ty21a is LIVE and contraindicated in pregnancy." }, { id: "c", label: "No vaccine." }, { id: "d", label: "Defer travel." }
    ], correctOptionIds: ["b"], explanation: "Vi injection (inactivated) is the pregnancy-safe option. Ty21a is live and contraindicated." },
    { id: "q-antibiotics", type: "single-choice", critical: true, question: "Patient on day 4 of clarithromycin course wants oral Ty21a. Action?", options: [
      { id: "a", label: "Start Ty21a today." }, { id: "b", label: "Wait until at least 3 days after completing the antibiotic — antibiotics inactivate the live oral vaccine. Alternative: use Vi injection now." }, { id: "c", label: "Half dose." }, { id: "d", label: "Take with antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Antibiotics inactivate Ty21a. Separate by ≥3 days post-antibiotic. Or switch to Vi injection." },
    { id: "q-immunocompromised", type: "single-choice", critical: true, question: "HIV-positive patient (CD4 250) travelling to Bangladesh. Action?", options: [
      { id: "a", label: "Oral Ty21a." }, { id: "b", label: "Vi injection (inactivated) — safe in immunocompromise. Ty21a is live and contraindicated." }, { id: "c", label: "No vaccine." }, { id: "d", label: "Defer travel." }
    ], correctOptionIds: ["b"], explanation: "Live vaccines contraindicated in significant immunocompromise. Vi injection is inactivated alternative." },
    { id: "q-food-water", type: "single-choice", critical: true, question: "Patient vaccinated against typhoid asks if she needs food hygiene precautions.", options: [
      { id: "a", label: "No — vaccinated." }, { id: "b", label: "Yes — vaccine is only ~70% effective. Food and water hygiene at least as important. Bottled/boiled water, avoid ice/salads/undercooked food/unpasteurised dairy." }, { id: "c", label: "Food only, water is fine." }, { id: "d", label: "Just avoid street food." }
    ], correctOptionIds: ["b"], explanation: "Vaccine alone is insufficient. Food and water hygiene is essential — also protects against other infections (cholera, hep A, parasites)." },
    { id: "q-children", type: "single-choice", question: "5-year-old child travelling to typhoid-endemic area. Action?", options: [
      { id: "a", label: "Oral Ty21a." }, { id: "b", label: "Vi injection (licensed from age 2). Oral Ty21a not licensed under age 6." }, { id: "c", label: "No vaccine." }, { id: "d", label: "Half adult dose." }
    ], correctOptionIds: ["b"], explanation: "Vi licensed from 2 years; oral Ty21a from 6 years." },
    { id: "q-schedule-oral", type: "single-choice", question: "Oral Ty21a schedule?", options: [
      { id: "a", label: "Single capsule." }, { id: "b", label: "3 capsules on days 1, 3, 5. Take with cold water, on empty stomach. Keep refrigerated until use." }, { id: "c", label: "Daily for 7 days." }, { id: "d", label: "Once a month." }
    ], correctOptionIds: ["b"], explanation: "Alternate-day schedule over 5 days. Critical to follow exactly — incomplete course = no protection." },
    { id: "q-protection", type: "single-choice", question: "When does Vi protection begin?", options: [
      { id: "a", label: "Immediately." }, { id: "b", label: "From day 7 post-vaccination." }, { id: "c", label: "Day 28." }, { id: "d", label: "Day 1." }
    ], correctOptionIds: ["b"], explanation: "Vi develops protective titre by day 7. Plan accordingly." },
    { id: "q-booster", type: "single-choice", question: "Vi booster interval?", options: [
      { id: "a", label: "Annually." }, { id: "b", label: "Every 3 years for continuing risk." }, { id: "c", label: "Lifetime." }, { id: "d", label: "10 years." }
    ], correctOptionIds: ["b"], explanation: "3-yearly booster for ongoing risk." },
    { id: "q-returning-fever", type: "single-choice", question: "Returning traveller from India has fever for 4 days, headache, abdominal discomfort. Took typhoid vaccine. Action?", options: [
      { id: "a", label: "Reassure." }, { id: "b", label: "Urgent medical assessment — vaccine ~70% efficacy. Returning-traveller fever needs workup for typhoid (blood cultures), malaria, dengue, others. A&E if unwell." }, { id: "c", label: "Repeat vaccine." }, { id: "d", label: "Antibiotic empirically." }
    ], correctOptionIds: ["b"], explanation: "Vaccine breakthrough is common given limited efficacy. Returning fever needs proper differential workup including blood cultures for typhoid." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Destination, agent chosen with rationale (especially live vs inactivated for pregnancy/immune status), batch, food/water counselling delivered — in the ePGD tool. NIMS upload." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates appropriate agent choice and critical food/water counselling." },
  ],
};
