// Anti-malarial prophylaxis — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const antiMalarialsModule: TrainingModule = {
  slug: "anti-malarials",
  title: "Anti-Malarial Prophylaxis — PGD",
  description: "Selection and supply of anti-malarial chemoprophylaxis for travel under PGD.",
  pgdSlugs: ["anti-malarials"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 15,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Anti-Malarials — Training", subtitle: "Chemoprophylaxis for malaria-risk travel", estimatedMinutes: 15, objectives: [
      "Apply ABCD framework to malaria risk discussion.",
      "Select appropriate chemoprophylaxis based on destination resistance and patient factors.",
      "Counsel on bite avoidance, adherence, and post-travel awareness.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Malaria is a potentially fatal parasitic infection caused by Plasmodium species (P. falciparum most dangerous). Transmitted by Anopheles mosquito bites, dawn to dusk and especially overnight.",
      "ABCD framework: A = Awareness of risk, B = Bite avoidance, C = Chemoprophylaxis, D = Diagnosis (early if symptoms after travel).",
      "Authoritative UK source: NaTHNaC TravelHealthPro (England, NI) and Fit for Travel (Scotland) — country-specific advice including current resistance patterns.",
      "Main UK options: atovaquone/proguanil (Malarone), doxycycline, mefloquine, chloroquine. Choice depends on destination resistance pattern, patient comorbidity, contraindications, cost, duration of trip.",
    ], highlights: ["No prophylaxis is 100% effective — bite avoidance is non-negotiable.", "Start before travel, continue during, continue after return.", "Falciparum malaria can be fatal — symptoms after travel = urgent assessment."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18+ for most options", detail: "Paediatric prophylaxis available but doses different — refer GP/specialist for children." },
      { label: "Travel to area with confirmed malaria risk", detail: "Check NaTHNaC / Fit for Travel for the specific country and region. Resistance patterns vary." },
      { label: "Not pregnant or breastfeeding", detail: "Specific agents allowed in pregnancy but specialist input preferred — refer." },
      { label: "Appropriate eGFR", detail: "Some agents need dose adjustment in renal impairment." },
      { label: "No psychiatric history if considering mefloquine", detail: "Mefloquine contraindicated in psychiatric history." },
      { label: "Compliant with adherence requirements", detail: "Some agents start days before travel, continue 1–4 weeks after return. Non-adherent patients have higher breakthrough infection risk." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Agent-specific contraindications", tone: "danger", message: "Refer or select different agent.", detail: [
      "Atovaquone/proguanil (Malarone): severe renal impairment (eGFR <30), hypersensitivity.",
      "Doxycycline: pregnancy, breastfeeding (some allow short-term), age <12, photosensitivity disorder, severe hepatic impairment.",
      "Mefloquine: history of psychiatric disorder (depression, anxiety, psychosis, suicidal ideation), seizure history, cardiac conduction abnormality. Significant neuropsychiatric side-effect rate — many travellers refuse it.",
      "Chloroquine: epilepsy, severe psoriasis, retinal disease. Now limited use — most areas are resistant.",
      "Pregnancy — refer specialist travel clinic. Some agents allowed but specialist preferred.",
      "Children — refer.",
      "Severe hepatic / renal impairment — specialist.",
      "Concurrent medications with interactions (warfarin with doxycycline, antiepileptics).",
    ]},
    { id: "agents", type: "comparison", title: "Agent comparison", intro: "Choose by destination resistance + patient factors.", columns: [
      { label: "Atovaquone/proguanil (Malarone)", rows: [
        { heading: "Schedule", body: "1 tab OD, starting 1–2 days before travel, continuing daily during, and for 7 days after return." },
        { heading: "Pros", body: "Short post-travel course. Generally well-tolerated. Once daily." },
        { heading: "Cons", body: "Expensive. Take with food / fatty meal for absorption." },
        { heading: "Best for", body: "Short trips. Patients wanting minimal post-travel course." },
      ]},
      { label: "Doxycycline", rows: [
        { heading: "Schedule", body: "100 mg OD, starting 1–2 days before travel, continuing daily during, and 4 weeks after return." },
        { heading: "Pros", body: "Cheap. Also covers travellers' diarrhoea partially, leptospirosis, rickettsial diseases." },
        { heading: "Cons", body: "4-week post-travel course (adherence challenge). Photosensitivity. Oesophageal irritation. GI side effects. Avoid antacids/milk within 2 hours." },
        { heading: "Best for", body: "Long trips, cost-sensitive, or where multiple antibiotic effects desired." },
      ]},
      { label: "Mefloquine (Lariam)", rows: [
        { heading: "Schedule", body: "250 mg once weekly, starting 2–3 weeks before travel, continuing weekly during, and 4 weeks after return." },
        { heading: "Pros", body: "Weekly dosing (adherence advantage). Cheap." },
        { heading: "Cons", body: "Significant neuropsychiatric side-effect rate (vivid dreams, anxiety, depression, psychosis). Trial dose 2–3 weeks before travel to assess tolerability — if poorly tolerated, switch." },
        { heading: "Best for", body: "Patients tolerating it well. Long trips. Now less commonly recommended due to alternatives." },
      ]},
    ]},
    { id: "bite-avoidance", type: "checklist", title: "Bite avoidance — non-negotiable", intro: "Chemoprophylaxis is not 100%. Bite avoidance is essential.", items: [
      { label: "DEET 30–50% on exposed skin", detail: "Reapply per product instructions. Safe in pregnancy and from 2 months age (lower concentrations for children)." },
      { label: "Permethrin-treated clothing", detail: "Long sleeves, trousers tucked into socks. Treat clothes / mosquito nets with permethrin." },
      { label: "Mosquito nets at night", detail: "Especially if not air-conditioned. Permethrin-treated for additional protection." },
      { label: "Air conditioning preferred", detail: "Reduces indoor mosquitoes." },
      { label: "Avoid being outside at dusk and dawn", detail: "Peak Anopheles biting times." },
      { label: "Cover up at dawn / dusk", detail: "Long-sleeved clothing, trousers." },
    ]},
    { id: "post-travel", type: "callout", title: "Post-travel symptoms — urgent", tone: "danger", message: "Counsel every patient.", detail: [
      "Any fever, flu-like illness, chills, headache, GI symptoms during or up to 1 YEAR after travel — possible malaria, especially in 4 weeks post-return.",
      "Falciparum malaria can be rapidly fatal — A&E same day with travel history.",
      "Even with full adherence, prophylaxis is not 100% effective.",
      "Some Plasmodium species (vivax, ovale) can cause late relapses — counsel on extended awareness window.",
      "Patient should mention travel history at any medical encounter for 12 months post-return.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Check NaTHNaC for destination-specific risk and resistance.",
      "Atovaquone/proguanil: 1–2 days before, daily during, 7 days after. Doxycycline: 1–2 days before, daily during, 28 days after. Mefloquine: 2–3 weeks before, weekly during, 4 weeks after.",
      "Bite avoidance essential — chemoprophylaxis is not 100%.",
      "Mefloquine: psychiatric history = contraindicated.",
      "Doxycycline: pregnancy, <12 years contraindicated.",
      "Post-travel fever up to 1 year = urgent assessment with travel history.",
    ]},
  ],
  quiz: [
    { id: "q-mefloquine-psych", type: "single-choice", critical: true, question: "Patient with history of depression wants malaria prophylaxis. Agent?", options: [
      { id: "a", label: "Mefloquine." }, { id: "b", label: "Mefloquine is contraindicated in psychiatric history. Choose atovaquone/proguanil or doxycycline instead." }, { id: "c", label: "Mefloquine at half dose." }, { id: "d", label: "Chloroquine." }
    ], correctOptionIds: ["b"], explanation: "Mefloquine has significant neuropsychiatric side effects and is contraindicated in psychiatric history. Multiple safer alternatives." },
    { id: "q-doxy-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman travelling to malaria-risk area. Doxycycline?", options: [
      { id: "a", label: "Acceptable." }, { id: "b", label: "Contraindicated. Refer to specialist travel clinic — pregnancy + malaria risk needs specialist input; some agents OK (atovaquone/proguanil with caution, possibly mefloquine after trimester 1)." }, { id: "c", label: "Half dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Doxycycline contraindicated in pregnancy (foetal bone/tooth effects). Pregnancy + malaria risk = specialist clinic." },
    { id: "q-post-travel-fever", type: "single-choice", critical: true, question: "Patient returned from Ghana 3 weeks ago. Now has fever 39°C, headache, chills. Took doxycycline as prescribed. Action?", options: [
      { id: "a", label: "Reassure — flu." }, { id: "b", label: "Urgent assessment / A&E with travel history — possible malaria despite prophylaxis. Even with adherence, prophylaxis is not 100% effective. Falciparum can kill rapidly." }, { id: "c", label: "Repeat course." }, { id: "d", label: "Wait 48 hours." }
    ], correctOptionIds: ["b"], explanation: "Fever within 4 weeks of returning from malaria area = urgent malaria assessment. Diagnosis by blood smear / RDT. Falciparum is a medical emergency." },
    { id: "q-children", type: "single-choice", critical: true, question: "Family travelling — adults and a 10-year-old. Action?", options: [
      { id: "a", label: "Same dose for everyone." }, { id: "b", label: "Refer paediatric travel clinic or GP for children's prescribing. Doses are weight/age-based. Doxycycline contraindicated <12." }, { id: "c", label: "Half dose for child." }, { id: "d", label: "Don't give child any." }
    ], correctOptionIds: ["b"], explanation: "Paediatric anti-malarial dosing is weight-based and specific. Refer for prescribing." },
    { id: "q-schedule-malarone", type: "single-choice", question: "Atovaquone/proguanil schedule?", options: [
      { id: "a", label: "Start 4 weeks before, continue 4 weeks after." }, { id: "b", label: "Start 1–2 days before travel, daily during, 7 days after return." }, { id: "c", label: "Start day of travel only." }, { id: "d", label: "Weekly." }
    ], correctOptionIds: ["b"], explanation: "Atovaquone/proguanil short pre- and post-travel courses — adherence advantage." },
    { id: "q-doxy-schedule", type: "single-choice", question: "Doxycycline schedule?", options: [
      { id: "a", label: "Start 4 weeks before, continue 4 weeks after." }, { id: "b", label: "100 mg OD, starting 1–2 days before travel, daily during, 4 weeks after return." }, { id: "c", label: "Weekly." }, { id: "d", label: "Single dose." }
    ], correctOptionIds: ["b"], explanation: "Doxycycline daily, with 4-week post-travel course. Longer post-travel course than atovaquone/proguanil." },
    { id: "q-bite-avoidance", type: "single-choice", question: "Patient on full prophylaxis asks if she needs bite avoidance.", options: [
      { id: "a", label: "No, prophylaxis is enough." }, { id: "b", label: "Yes — bite avoidance essential. Chemoprophylaxis is not 100% effective. DEET 30–50%, permethrin-treated clothing/nets, air conditioning, cover up dawn/dusk." }, { id: "c", label: "Bite avoidance only if no prophylaxis." }, { id: "d", label: "Wear long sleeves only." }
    ], correctOptionIds: ["b"], explanation: "Bite avoidance is non-negotiable. Chemoprophylaxis fails sometimes; bite avoidance reduces exposure independently." },
    { id: "q-source", type: "single-choice", question: "Authoritative UK source for destination-specific malaria advice?", options: [
      { id: "a", label: "Lonely Planet." }, { id: "b", label: "NaTHNaC TravelHealthPro (England, NI), or Fit for Travel (Scotland) — updated regularly with country-specific advice including resistance patterns." }, { id: "c", label: "BNF." }, { id: "d", label: "BBC travel." }
    ], correctOptionIds: ["b"], explanation: "TravelHealthPro and Fit for Travel are the authoritative UK sources. Country-specific because resistance patterns vary." },
    { id: "q-warfarin", type: "single-choice", question: "Patient on warfarin wants doxycycline. Action?", options: [
      { id: "a", label: "Standard dose, no monitoring change." }, { id: "b", label: "Doxycycline can raise INR. Either choose different agent (atovaquone/proguanil) or coordinate with anticoagulation clinic for more frequent INR monitoring during course." }, { id: "c", label: "Half dose." }, { id: "d", label: "Stop warfarin." }
    ], correctOptionIds: ["b"], explanation: "Doxycycline can potentiate warfarin. Either alternative agent or closer INR monitoring." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Destination(s), trip dates, agent chosen with rationale (resistance considerations), schedule, contraindications excluded, bite-avoidance counselling, post-travel awareness — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record captures destination, drug choice rationale, and the safety counselling. Important if patient returns with malaria — clinical decision and counselling can be reviewed." },
  ],
};
