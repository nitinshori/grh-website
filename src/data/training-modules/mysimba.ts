// Mysimba (naltrexone/bupropion) — weight management PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const mysimbaModule: TrainingModule = {
  slug: "mysimba",
  title: "Mysimba (Naltrexone/Bupropion) — Weight Management PGD",
  description: "Eligibility, contraindications and counselling for naltrexone/bupropion under PGD.",
  pgdSlugs: ["mysimba"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 15,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Mysimba — Training", subtitle: "Naltrexone 8 mg / bupropion 90 mg modified-release combination", estimatedMinutes: 15, objectives: [
      "Identify eligible patients and exclude the long contraindication list (especially seizure history, eating disorders, MAOI use, alcohol/opioid dependence).",
      "Apply the 4-week titration schedule.",
      "Counsel on side effects (nausea, insomnia, mood change, BP rise), drug interactions, and review timing.",
      "Use the ePGD tool to capture the record.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Mysimba is a fixed-dose combination of naltrexone (opioid antagonist) and bupropion (NDRI antidepressant) at low doses, acting on the hypothalamic appetite-regulation pathways. Average weight loss is 5–8% at 1 year.",
      "It has the longest contraindication list of any UK weight-management drug. Strict screening is essential.",
    ], highlights: ["Combination of two psychoactive agents — heavier screening burden.", "BP and pulse rise on therapy — measure at every visit.", "Long list of absolute contraindications and drug interactions."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 18–75", detail: "Outside this range refer." },
      { label: "BMI ≥30, OR ≥27 with comorbidity", detail: "Comorbidity: T2DM (GP-managed), dyslipidaemia, hypertension (controlled)." },
      { label: "Engaged with hypocaloric diet", detail: "Mysimba is an adjunct." },
      { label: "BP today within range", detail: "<140/90 mmHg pre-existing controlled hypertension acceptable. >140/90 — refer." },
      { label: "Resident in England or Wales", detail: "CQC / HIW only." },
      { label: "No absolute contraindications (see next slide)", detail: "Long list — review carefully." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Absolute contraindications — NEVER supply", tone: "danger", message: "Long list. Walk through systematically.", detail: [
      "History of seizures, including febrile or alcohol withdrawal seizures — bupropion lowers seizure threshold.",
      "History of CNS tumour or recent severe head injury.",
      "Current or past eating disorder (anorexia nervosa, bulimia).",
      "Current or recent (within 14 days) MAOI use.",
      "Current opioid use (regular or PRN, including codeine, tramadol, methadone, illicit) — naltrexone precipitates withdrawal.",
      "Alcohol or opioid dependence; abrupt discontinuation of either.",
      "Bipolar disorder.",
      "Severe hepatic impairment.",
      "End-stage renal disease (eGFR <30).",
      "Uncontrolled hypertension or hypertensive crisis history.",
      "Pregnancy or breastfeeding.",
      "Concurrent bupropion-containing product (e.g. Zyban for smoking cessation).",
      "Hypersensitivity to naltrexone, bupropion, or excipients.",
    ]},
    { id: "interactions", type: "callout", title: "Significant drug interactions", tone: "warning", message: "Mysimba has many interactions. Always review medication list.", detail: [
      "MAOIs (including selegiline, linezolid) — within 14 days, contraindicated.",
      "Strong CYP2B6 inhibitors (e.g. ticlopidine, clopidogrel) — increased bupropion levels.",
      "Strong CYP2B6 inducers (carbamazepine, phenytoin, rifampicin) — reduced efficacy.",
      "Drugs that lower seizure threshold (tramadol, theophylline, quinolones, antipsychotics, antidepressants other than SSRIs typically) — increased seizure risk.",
      "Levodopa and amantadine — bupropion can increase side effects.",
      "Digoxin — bupropion may reduce digoxin levels.",
      "Other opioids — naltrexone blocks effect, including emergency pain relief. Counsel.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing — 4-week titration", intro: "Each tablet contains naltrexone 8 mg / bupropion 90 mg.", items: [
      { label: "Week 1", detail: "1 tablet in the morning." },
      { label: "Week 2", detail: "1 tablet morning + 1 tablet evening." },
      { label: "Week 3", detail: "2 tablets morning + 1 tablet evening." },
      { label: "Week 4 onwards", detail: "2 tablets morning + 2 tablets evening (maintenance, 4 tablets daily total)." },
      { label: "Take with food", detail: "Reduces nausea." },
      { label: "Do not crush, split or chew", detail: "Modified-release formulation." },
      { label: "Missed dose", detail: "Skip and take next as scheduled. Do not double up." },
      { label: "Treatment paused", detail: "If paused for any period, re-titrate from week 1." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Expected effect", detail: "5–8% weight loss at 1 year on average. Discontinue if <5% weight loss at 16 weeks." },
      { label: "Side effects", detail: "Nausea, constipation, headache, insomnia, dry mouth, dizziness, anxiety. Usually settle in first few weeks." },
      { label: "Mood awareness", detail: "Watch for low mood, suicidal thoughts — bupropion antidepressant component. Stop and seek help if concerning mood changes." },
      { label: "BP monitoring", detail: "Mysimba raises BP and pulse. Check at every visit. Stop if BP >160/100 sustained." },
      { label: "Alcohol", detail: "Avoid or minimise — increased seizure risk, increased CNS side effects." },
      { label: "Opioid emergency", detail: "If she needs emergency pain relief (e.g. trauma), opioid analgesics will be ineffective; warn medical staff she's on naltrexone." },
      { label: "Pregnancy avoidance", detail: "Use effective contraception. Stop before planned conception." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — STOP and refer", tone: "danger", message: "Stop Mysimba immediately for any of these.", detail: [
      "Any seizure activity.",
      "New significant mood change, suicidal ideation or behaviour.",
      "BP sustained >160/100 mmHg or hypertensive symptoms.",
      "Severe allergic reaction.",
      "Severe hepatic symptoms (jaundice, dark urine, RUQ pain).",
      "Pregnancy confirmed or suspected.",
      "New opioid prescription required — Mysimba blocks effect, withdrawal may be precipitated if patient is opioid-dependent.",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — the screening matters", scenario: "Tom, 38, BMI 32. Wants Mysimba. Background: ADHD on methylphenidate, takes occasional tramadol for back pain (~once a month), social drinker, BP today 132/85. Has had one alcohol-withdrawal seizure 4 years ago during a difficult period; sober since.",
      question: "Can he be supplied?", answer: "Do NOT supply. Two absolute contraindications: history of seizure (any cause, including alcohol withdrawal) AND occasional opioid use (tramadol). Either alone disqualifies him; the combination is clearly unsafe. Refer to GP for weight management discussion; he may be a candidate for GLP-1 agonist (if no other contraindications) or Saxenda.",
      rationale: "The seizure history is the most commonly missed Mysimba exclusion — alcohol-withdrawal seizures count. Tramadol use is incompatible with the naltrexone component. This case illustrates why Mysimba needs unusually thorough screening." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Long contraindication list: seizures, eating disorders, MAOI, opioids, bipolar, severe hepatic, pregnancy, etc.",
      "Many drug interactions — review meds carefully.",
      "4-week titration to 4 tablets daily maintenance.",
      "BP at every visit; stop if >160/100 sustained.",
      "Discontinue if <5% loss at 16 weeks.",
      "Pregnancy avoidance and effective contraception mandatory.",
    ]},
  ],
  quiz: [
    { id: "q-seizure", type: "single-choice", critical: true, question: "Patient had an alcohol-withdrawal seizure 5 years ago. Mysimba?", options: [
      { id: "a", label: "Supply — that was long ago." }, { id: "b", label: "Contraindicated. Any seizure history is an absolute contraindication." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Supply with anticonvulsant." }
    ], correctOptionIds: ["b"], explanation: "Bupropion lowers seizure threshold. Any history of seizures — alcohol-withdrawal, febrile, idiopathic — is an absolute contraindication." },
    { id: "q-opioid", type: "single-choice", critical: true, question: "Patient takes codeine PRN for back pain. Mysimba?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Contraindicated — current opioid use means naltrexone can precipitate withdrawal." }, { id: "c", label: "Supply if codeine spaced 4 hours away." }, { id: "d", label: "Supply only the naltrexone component." }
    ], correctOptionIds: ["b"], explanation: "Current opioid use (regular or PRN) is an absolute contraindication. Patient must be opioid-free for at least 7–10 days before initiating Mysimba." },
    { id: "q-eating-disorder", type: "single-choice", critical: true, question: "Patient discloses history of bulimia 6 years ago, now recovered. Mysimba?", options: [
      { id: "a", label: "Supply normally." }, { id: "b", label: "Contraindicated — current or past eating disorder is an absolute contraindication." }, { id: "c", label: "Supply with psychological support." }, { id: "d", label: "Supply at reduced dose." }
    ], correctOptionIds: ["b"], explanation: "Past eating disorder is a contraindication. Mysimba can disinhibit eating-disorder patterns and is not safe to initiate." },
    { id: "q-maoi", type: "single-choice", critical: true, question: "Patient stopped a MAOI 10 days ago. Mysimba?", options: [
      { id: "a", label: "Supply now." }, { id: "b", label: "Wait at least 14 days from last MAOI dose before initiating Mysimba." }, { id: "c", label: "Halve the Mysimba dose." }, { id: "d", label: "Contraindicated even after washout." }
    ], correctOptionIds: ["b"], explanation: "14-day washout required from last MAOI dose. 10 days is too short." },
    { id: "q-titration", type: "single-choice", question: "Week 4 of Mysimba — what's the dose?", options: [
      { id: "a", label: "1 tablet daily." }, { id: "b", label: "4 tablets daily — 2 morning + 2 evening." }, { id: "c", label: "2 tablets in the morning only." }, { id: "d", label: "6 tablets daily." }
    ], correctOptionIds: ["b"], explanation: "Week 4 onwards is maintenance: 2 + 2 = 4 tablets daily total." },
    { id: "q-bp", type: "single-choice", question: "Patient on Mysimba week 8, BP today 168/102, no symptoms. Action?", options: [
      { id: "a", label: "Continue." }, { id: "b", label: "Stop Mysimba and refer to GP — sustained BP >160/100 requires discontinuation." }, { id: "c", label: "Halve the dose." }, { id: "d", label: "Add an antihypertensive." }
    ], correctOptionIds: ["b"], explanation: "Mysimba can raise BP. Sustained >160/100 mandates stopping. Don't add antihypertensives just to enable continuation; refer." },
    { id: "q-suicidal", type: "single-choice", question: "Patient on Mysimba reports new low mood and thoughts of self-harm. Action?", options: [
      { id: "a", label: "Continue Mysimba; reassess in 2 weeks." }, { id: "b", label: "Stop Mysimba; refer to GP / crisis services same day." }, { id: "c", label: "Increase dose." }, { id: "d", label: "Switch to Wegovy." }
    ], correctOptionIds: ["b"], explanation: "Bupropion component carries antidepressant-class suicide-risk warnings. New mood concerns require immediate cessation and urgent mental-health review." },
    { id: "q-pregnancy", type: "single-choice", question: "Mysimba in pregnancy?", options: [
      { id: "a", label: "OK." }, { id: "b", label: "Contraindicated. Stop and arrange GP review on pregnancy confirmation." }, { id: "c", label: "First trimester OK." }, { id: "d", label: "Third trimester OK." }
    ], correctOptionIds: ["b"], explanation: "Mysimba is contraindicated in pregnancy and breastfeeding." },
    { id: "q-stop-criterion", type: "single-choice", question: "Discontinuation criterion?", options: [
      { id: "a", label: "Continue indefinitely." }, { id: "b", label: "<5% weight loss at 16 weeks on maintenance dose — discontinue." }, { id: "c", label: "Always 12-month course." }, { id: "d", label: "Stop at 6 weeks if no loss." }
    ], correctOptionIds: ["b"], explanation: "<5% loss at 16 weeks indicates inadequate response and Mysimba should be discontinued." },
    { id: "q-record", type: "single-choice", question: "Required documentation?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "BMI, BP, full medication list checked for interactions, screening for the long contraindication list, counselling, supply detail — all in the ePGD tool." }, { id: "c", label: "GP email only." }, { id: "d", label: "Free-text note." }
    ], correctOptionIds: ["b"], explanation: "Mysimba demands the most rigorous documentation because of the long contraindication and interaction list. ePGD tool captures the structured record." },
  ],
};
