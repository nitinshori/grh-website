// Vaginal thrush — Duo (oral fluconazole + clotrimazole cream) PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const thrushDuoModule: TrainingModule = {
  slug: "thrush-duo",
  title: "Vaginal Thrush — Duo (Oral + Cream) PGD",
  description: "Generic fluconazole 150mg single oral dose + clotrimazole 1% external cream — for patients who prefer the oral route.",
  pgdSlugs: ["thrush-duo"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-13",
  estimatedMinutes: 8,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Vaginal Thrush Duo — Training", subtitle: "Oral fluconazole + external cream for vaginal candidiasis", estimatedMinutes: 8, objectives: [
      "Confirm eligibility and screen contraindications to oral fluconazole.",
      "Avoid oral fluconazole in pregnancy (use combi pack instead).",
      "Counsel on missed dose, GI side effects, drug interactions.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Vaginal candidiasis ('thrush') affects ~75% of women at least once. Common organism: Candida albicans.",
      "The duo pack pairs a single oral dose of fluconazole 150mg (treats the systemic / vaginal infection) with an external cream (treats vulval skin). Many patients prefer the oral route over the pessary — easier to use, no internal application.",
      "BUT: oral fluconazole crosses the placenta and is teratogenic in high doses. NEVER supply oral fluconazole to a pregnant woman or one trying to conceive — use the pessary combi pack instead.",
      "Fluconazole is a CYP3A4/2C9 inhibitor — multiple clinically significant drug interactions need screening.",
    ], highlights: ["Oral fluconazole CONTRAINDICATED in pregnancy or trying to conceive.", "Watch for interactions: warfarin, statins (simvastatin/atorvastatin), midazolam, ergots.", "Single 150mg oral dose; cream BD until vulval symptoms resolve.", "If no improvement at 7 days, refer GP."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Female aged 16–60 years", detail: "Outside this range refer GP." },
      { label: "Symptoms consistent with vaginal thrush", detail: "Itching, white discharge, vulval soreness ± dysuria. Not bleeding, not unusual offensive odour." },
      { label: "First episode OR previously confirmed thrush", detail: "First episodes of unclear cause: refer GP for swab confirmation." },
      { label: "Not pregnant / not trying to conceive / not breastfeeding", detail: "Oral fluconazole is teratogenic — supply combi (pessary + cream) instead in pregnancy." },
      { label: "No clinically significant drug interactions", detail: "Especially warfarin, simvastatin, atorvastatin, midazolam, ergot alkaloids, terfenadine, cisapride. Check medication list carefully." },
      { label: "No significant hepatic or renal impairment", detail: "Refer GP if known liver/kidney disease — fluconazole hepatotoxicity risk." },
      { label: "Informed consent", detail: "Including counselling on choice between oral and pessary route." },
    ]},
    { id: "exclusions", type: "callout", title: "Exclusions / red flags — refer", tone: "danger", message: "Do not supply oral fluconazole; consider combi (pessary + cream) instead, or refer.", detail: [
      "Pregnancy, planning pregnancy, or breastfeeding (use combi/pessary pack).",
      "Recurrent thrush (≥4 episodes in 12 months).",
      "Immunocompromise: poorly controlled diabetes, HIV, chemotherapy, biologics, transplant.",
      "Postmenopausal first episode — atrophic vaginitis is a common mimic.",
      "Pre-pubertal patients.",
      "Significant abdominal/pelvic pain, fever, foul-smelling discharge, abnormal bleeding.",
      "Confirmed allergy to fluconazole, clotrimazole, or imidazoles.",
      "Concomitant warfarin, simvastatin, atorvastatin, midazolam, ergots, terfenadine, cisapride, quinidine.",
      "Hepatic or renal impairment.",
      "QT prolongation history or other QT-prolonging medications.",
    ]},
    { id: "interactions", type: "comparison", title: "Key drug interactions", intro: "Fluconazole is a CYP3A4/2C9 inhibitor — screen carefully.", columns: [
      { label: "Anticoagulants", rows: [
        { heading: "Warfarin", body: "Fluconazole increases INR significantly — DO NOT supply, refer GP." },
        { heading: "DOACs", body: "Apixaban / rivaroxaban interactions less clinically significant for single dose, but document." },
      ]},
      { label: "Statins", rows: [
        { heading: "Simvastatin / atorvastatin", body: "Significantly increased exposure — myopathy risk. DO NOT supply with these statins." },
        { heading: "Pravastatin / rosuvastatin", body: "Less affected; generally safer." },
      ]},
      { label: "Other high-risk", rows: [
        { heading: "Midazolam, triazolam", body: "Significantly increased sedation." },
        { heading: "Ergot alkaloids", body: "Ergot toxicity — contraindicated." },
        { heading: "Terfenadine, cisapride, quinidine", body: "QT prolongation — contraindicated." },
      ]},
    ]},
    { id: "administration", type: "checklist", title: "Administration & supply", items: [
      { label: "Supply", detail: "1× fluconazole 150mg capsule (single dose) + 1× clotrimazole 1% external cream (20g)." },
      { label: "Oral dose", detail: "Take the fluconazole 150mg capsule as a single oral dose with water. With or without food." },
      { label: "Cream application", detail: "Apply thin layer to vulval area twice a day until symptoms resolve, typically 3–7 days." },
      { label: "Second oral dose", detail: "If symptoms not resolved at 3 days, a second dose at 72h is sometimes used (off-PGD — refer for review or repeat consultation)." },
      { label: "Adverse effects", detail: "GI upset (nausea, diarrhoea), headache, taste disturbance — usually mild and self-limiting. Rare hepatotoxicity, severe skin reactions." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Why the cream too?", detail: "Oral fluconazole clears the vaginal infection but vulval skin symptoms (itch, soreness) clear faster with topical cream BD." },
      { label: "Sexual activity", detail: "Avoid until symptoms resolved. Partner usually doesn't need treatment unless symptomatic." },
      { label: "Hepatotoxicity", detail: "Rare but serious. Stop and seek urgent help if jaundice, dark urine, severe abdominal pain, or systemic illness develops." },
      { label: "Recurrence", detail: "If thrush returns within 8 weeks, refer GP." },
      { label: "When to seek urgent help", detail: "No improvement at 7 days, worsening, fever, abdominal pain, abnormal bleeding, signs of liver problems." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Generic fluconazole 150mg oral + clotrimazole 1% cream — patient-friendly alternative to pessary route.",
      "ABSOLUTELY contraindicated in pregnancy / planning pregnancy — supply combi (pessary) instead.",
      "Critical drug interactions: warfarin, simvastatin/atorvastatin, midazolam, ergots, QT-prolonging.",
      "Eligibility: 16–60, symptoms consistent, not recurrent or immunocompromised, not impaired liver/kidney.",
      "Single oral dose; cream BD; refer if no improvement at 7 days.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "20-week pregnant patient with vaginal thrush. Action?", options: [
      { id: "a", label: "Supply duo (oral fluconazole + cream)." }, { id: "b", label: "Oral fluconazole CONTRAINDICATED in pregnancy. Supply combi (pessary + cream) instead, with manual insertion." }, { id: "c", label: "Half dose oral." }, { id: "d", label: "Cream alone." }
    ], correctOptionIds: ["b"], explanation: "Oral fluconazole is teratogenic and crosses placenta. Use the combi pessary pack in pregnancy instead." },
    { id: "q-warfarin", type: "single-choice", critical: true, question: "Patient on warfarin requesting oral fluconazole for thrush. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Do not supply oral fluconazole — significantly increases INR. Refer GP, or supply combi (pessary + cream) which has no significant warfarin interaction." }, { id: "c", label: "Half dose." }, { id: "d", label: "Hold warfarin." }
    ], correctOptionIds: ["b"], explanation: "Warfarin + fluconazole interaction is significant. Pessary combi avoids this interaction entirely." },
    { id: "q-simvastatin", type: "single-choice", critical: true, question: "Patient on simvastatin 40mg requesting oral fluconazole. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Do not supply — fluconazole significantly increases simvastatin exposure with myopathy risk. Use combi pessary instead, OR refer GP." }, { id: "c", label: "Halve simvastatin." }, { id: "d", label: "Take statin night." }
    ], correctOptionIds: ["b"], explanation: "Simvastatin + fluconazole = high myopathy risk. Pessary combi is the safer route." },
    { id: "q-trying-conceive", type: "single-choice", critical: true, question: "30-year-old patient says 'we're actively trying for a baby'. Asks for oral fluconazole. Action?", options: [
      { id: "a", label: "Supply oral." }, { id: "b", label: "Do not supply oral fluconazole — contraindicated when trying to conceive due to teratogenic risk. Offer combi (pessary + cream) instead." }, { id: "c", label: "Just supply cream." }, { id: "d", label: "Defer until next month." }
    ], correctOptionIds: ["b"], explanation: "Trying to conceive = treat as pregnancy contraindication. Pessary combi is the appropriate alternative." },
    { id: "q-recurrent", type: "single-choice", critical: true, question: "Patient with 5 episodes of thrush in 12 months. Action?", options: [
      { id: "a", label: "Supply duo." }, { id: "b", label: "Recurrent thrush (≥4/year) is excluded — refer GP for swab confirmation and longer-course / maintenance regimen." }, { id: "c", label: "Double dose." }, { id: "d", label: "Both routes." }
    ], correctOptionIds: ["b"], explanation: "Recurrent thrush is outside this PGD — needs specialist assessment." },
    { id: "q-eligible", type: "single-choice", question: "32-year-old, classic thrush symptoms, on no medications, not pregnant, no medical issues. Action?", options: [
      { id: "a", label: "Refuse." }, { id: "b", label: "Supply duo (oral fluconazole 150mg single dose + clotrimazole cream BD); counsel on side effects, hepatotoxicity warning, return if no improvement at 7 days." }, { id: "c", label: "Cream only." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Standard PGD supply path. Single oral dose + cream is the appropriate combination." },
    { id: "q-cream", type: "single-choice", question: "Patient asks why she needs the cream if she's taking the tablet. Best answer?", options: [
      { id: "a", label: "It's optional." }, { id: "b", label: "The oral tablet clears the vaginal infection but vulval skin symptoms (itch, soreness) clear faster with topical cream BD until skin recovers." }, { id: "c", label: "Just use cream." }, { id: "d", label: "Same drug." }
    ], correctOptionIds: ["b"], explanation: "Cream addresses external skin symptoms that the oral dose alone resolves more slowly." },
    { id: "q-hepatotoxicity", type: "single-choice", question: "Three days after taking the fluconazole, patient calls reporting yellowing of eyes and dark urine. Action?", options: [
      { id: "a", label: "Reassure, common." }, { id: "b", label: "Possible hepatotoxicity — rare but serious. Advise urgent GP / A&E review immediately." }, { id: "c", label: "Repeat dose." }, { id: "d", label: "Switch to cream." }
    ], correctOptionIds: ["b"], explanation: "Jaundice + dark urine after fluconazole = possible hepatotoxicity. Urgent referral needed." },
    { id: "q-record", type: "single-choice", question: "Documentation requirements?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Eligibility check, exclusion screen (pregnancy + drug interactions explicitly), products supplied (batch + expiry), counselling given (hepatotoxicity, follow-up) — in the ePGD tool." }, { id: "c", label: "Free-text only." }, { id: "d", label: "GP letter." }
    ], correctOptionIds: ["b"], explanation: "Standard PGD record requirements with explicit pregnancy + interaction screening documented. Audit-critical." },
  ],
};
