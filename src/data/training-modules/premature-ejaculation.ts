// Premature ejaculation — dapoxetine PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const prematureEjaculationModule: TrainingModule = {
  slug: "premature-ejaculation",
  title: "Premature Ejaculation (Dapoxetine) — PGD",
  description: "Supply of dapoxetine for premature ejaculation in adult men under PGD.",
  pgdSlugs: ["premature-ejaculation"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Premature Ejaculation — Training", subtitle: "Dapoxetine (Priligy) for adult lifelong or acquired PE", estimatedMinutes: 12, objectives: [
      "Identify eligible patients for dapoxetine under the PGD.",
      "Recognise the cardiovascular and drug-interaction contraindications.",
      "Counsel on dosing, side effects (orthostatic hypotension), and the syncope warning.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Premature ejaculation (PE) is intravaginal ejaculatory latency time (IELT) consistently <2 minutes (lifelong) or marked reduction from baseline (acquired), causing distress.",
      "Dapoxetine is a short-acting SSRI taken on-demand 1–3 hours before sex. Increases IELT ~2.5–3x with adequate dosing.",
      "Behavioural strategies (start-stop, squeeze technique, condoms) and partner work are complementary. Pharmacotherapy alone often misses the relational context.",
    ], highlights: ["On-demand: take 1–3 hours before sex, not daily.", "Strict cardiovascular and drug-interaction screening.", "Behavioural strategies alongside drug — not drug alone."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult male, 18–64", detail: "Outside this range refer." },
      { label: "Clinical history consistent with PE", detail: "IELT consistently <2 min; distress; partner concerned or relationship impact. Lifelong or acquired pattern." },
      { label: "Not on contraindicated medication (next slide)", detail: "Long list — review carefully." },
      { label: "No significant cardiovascular disease", detail: "Recent MI, severe heart failure, valvular disease, significant arrhythmia — refer." },
      { label: "No history of psychiatric concern that's contraindicated", detail: "Mania, bipolar, severe depression with suicidal thoughts." },
      { label: "BP today within range", detail: "Acceptable: 100/60 to 160/95. Below 100/60 = postural risk; above = consider hypertensive workup." },
      { label: "Not on regular SSRI / other antidepressant", detail: "Refer GP." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Absolute contraindications", tone: "danger", message: "If any apply, do not supply.", detail: [
      "Significant cardiovascular disease: recent MI, unstable angina, severe HF, severe valvular disease, arrhythmias of clinical concern, severe hypotension.",
      "History of syncope.",
      "Mania, bipolar disorder, severe depression.",
      "Concurrent SSRI / SNRI / MAOI / TCA / lithium / linezolid (within 14 days).",
      "Concurrent strong CYP3A4 inhibitors (ketoconazole, itraconazole, ritonavir, clarithromycin).",
      "Concurrent serotonergic drugs (tramadol, tryptophan, St John's wort).",
      "Severe hepatic impairment.",
      "Severe renal impairment.",
      "Hereditary fructose intolerance, galactose intolerance, glucose-galactose malabsorption (tablet excipients).",
      "Known hypersensitivity.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing", intro: "On-demand only.", items: [
      { label: "Starting dose", detail: "Dapoxetine 30 mg, 1–3 hours before sexual activity." },
      { label: "Increase if needed", detail: "After 4 weeks of regular use, if 30 mg ineffective and tolerated, increase to 60 mg." },
      { label: "Maximum frequency", detail: "Once in any 24-hour period. Not for daily use." },
      { label: "Take with at least 240 mL water", detail: "Helps reduce dizziness/syncope risk." },
      { label: "Take with or without food", detail: "Food doesn't significantly affect efficacy." },
      { label: "Review at 4 weeks / 6 doses", detail: "Continued use only if patient experiences benefit. If no benefit after 6 doses at 60 mg, discontinue." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Orthostatic hypotension and syncope", detail: "Counsel: stay well hydrated, sit/lie if feeling dizzy or lightheaded. Don't take if dehydrated (e.g. after sport, alcohol)." },
      { label: "Side effects", detail: "Nausea (most common), dizziness, headache, diarrhoea, insomnia. Usually mild and dose-related." },
      { label: "Alcohol", detail: "Increases dizziness and CNS depression. Avoid or minimise — major counselling point." },
      { label: "Sexual activity safety", detail: "If dizziness occurs during/after, stop activity, sit or lie down. Don't drive or operate machinery if symptomatic." },
      { label: "Not a daily medication", detail: "Important — patients sometimes assume daily SSRI-like regimen." },
      { label: "Behavioural strategies", detail: "Start-stop technique, squeeze, condoms. Encourage partner involvement and consideration of psychosexual therapy if relational impact." },
      { label: "Mood awareness", detail: "Watch for new low mood, anxiety, suicidal thoughts — short-acting SSRI but class warning still applies." },
      { label: "Don't combine with PDE5 inhibitors without specialist input", detail: "Hypotension risk additive; specialist review." },
    ]},
    { id: "red-flags", type: "callout", title: "Stop and refer", tone: "danger", message: "Discontinue for any of these.", detail: [
      "Syncope or severe presyncope episode after dapoxetine.",
      "Persistent dizziness affecting daily life.",
      "Suicidal ideation, severe mood change.",
      "Significant cardiovascular event during therapy.",
      "Allergic reaction signs.",
      "Suspicion of psychiatric or other condition needing fuller assessment (acquired PE in older man with comorbidities — could be marker of underlying issue).",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — eligibility check", scenario: "James, 34, lifelong PE causing distress. BMI 26, BP 130/82 today. No medication. Drinks alcohol socially. Asks for dapoxetine.",
      question: "Action?", answer: "Eligible. Initiate dapoxetine 30 mg on-demand, 1–3 hours before sex. Counsel on orthostatic hypotension (hydration, sit/lie if dizzy), alcohol-avoidance, max one dose in 24 hours, and behavioural strategies (start-stop, squeeze). Review at 4 weeks; can up-titrate to 60 mg if 30 mg inadequate.",
      rationale: "Classic candidate. Behavioural advice alongside drug." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "On-demand only, 1–3 hours before sex, max once in 24 hours.",
      "30 mg start; 60 mg if needed after 4 weeks.",
      "CV history, SSRI/SNRI, MAOI, CYP3A4 inhibitors, severe hepatic/renal = contraindications.",
      "Orthostatic hypotension and syncope risk — hydration, alcohol avoidance.",
      "Behavioural strategies alongside.",
      "Stop if no benefit after 6 doses at 60 mg.",
    ]},
  ],
  quiz: [
    { id: "q-syncope", type: "single-choice", critical: true, question: "Patient with history of vasovagal syncope (episode 2 years ago). Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer. History of syncope is a contraindication — dapoxetine increases orthostatic hypotension and syncope risk." }, { id: "c", label: "Supply half dose." }, { id: "d", label: "Supply with antihypertensive caution." }
    ], correctOptionIds: ["b"], explanation: "Any syncope history is a contraindication to dapoxetine. Refer." },
    { id: "q-ssri", type: "single-choice", critical: true, question: "Patient on sertraline 50 mg daily for anxiety. Wants dapoxetine. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Contraindicated. Concurrent SSRI/SNRI is an absolute contraindication (serotonin syndrome risk). Refer GP." }, { id: "c", label: "Supply on non-sertraline days." }, { id: "d", label: "Half dapoxetine dose." }
    ], correctOptionIds: ["b"], explanation: "Concurrent SSRIs combined risk significant serotonin toxicity. Contraindicated combination." },
    { id: "q-mi", type: "single-choice", critical: true, question: "Patient had MI 6 months ago. Wants dapoxetine. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer. Recent MI / significant cardiovascular disease is a contraindication. Specialist input needed." }, { id: "c", label: "Half dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Cardiovascular disease is a contraindication. Refer for cardiology / GP input." },
    { id: "q-clarithromycin", type: "single-choice", critical: true, question: "Patient on clarithromycin for an LRTI wants dapoxetine. Action?", options: [
      { id: "a", label: "Supply normal dose." }, { id: "b", label: "Contraindicated — clarithromycin is a strong CYP3A4 inhibitor; significantly raises dapoxetine levels. Defer until clarithromycin course finished + clearance time." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Reduce dapoxetine to 30 mg." }
    ], correctOptionIds: ["b"], explanation: "Strong CYP3A4 inhibitors are contraindicated with dapoxetine. Macrolides especially. Defer." },
    { id: "q-on-demand", type: "single-choice", question: "Patient asks if he can take dapoxetine every day.", options: [
      { id: "a", label: "Yes, like other SSRIs." }, { id: "b", label: "No. Dapoxetine is on-demand only, max once in 24 hours, 1–3 hours before sex." }, { id: "c", label: "Yes for first month." }, { id: "d", label: "Yes at half dose." }
    ], correctOptionIds: ["b"], explanation: "Not a daily SSRI. On-demand only. This is a common patient misconception." },
    { id: "q-alcohol", type: "single-choice", question: "Patient asks if he can drink alcohol on the dose day.", options: [
      { id: "a", label: "Yes." }, { id: "b", label: "Avoid or minimise alcohol — significant CNS depression and orthostatic hypotension risk additive with dapoxetine." }, { id: "c", label: "Yes for first month." }, { id: "d", label: "Only red wine." }
    ], correctOptionIds: ["b"], explanation: "Alcohol + dapoxetine = additive CNS depression and orthostatic risk. Important counselling point." },
    { id: "q-stop-criterion", type: "single-choice", question: "When should dapoxetine be discontinued?", options: [
      { id: "a", label: "Continue indefinitely." }, { id: "b", label: "Review at 4 weeks; discontinue if no benefit after 6 doses at maximum 60 mg." }, { id: "c", label: "Only if side effects." }, { id: "d", label: "Always 12-month course." }
    ], correctOptionIds: ["b"], explanation: "On-demand short courses with structured review. No benefit after 6 adequate doses = discontinue." },
    { id: "q-pde5", type: "single-choice", question: "Patient on tadalafil for ED also wants dapoxetine. Action?", options: [
      { id: "a", label: "Supply both." }, { id: "b", label: "Refer GP. Combined PDE5 + dapoxetine increases orthostatic hypotension risk additively. Specialist consideration." }, { id: "c", label: "Half doses." }, { id: "d", label: "Alternate days." }
    ], correctOptionIds: ["b"], explanation: "Hypotension risks additive. Refer for specialist guidance on combination if clinically appropriate." },
    { id: "q-behaviour", type: "single-choice", question: "Patient declines behavioural strategies, just wants the tablets.", options: [
      { id: "a", label: "Refuse to supply." }, { id: "b", label: "Counsel on combined approach — pharmacotherapy + behavioural strategies (start-stop, squeeze, partner involvement) outperform either alone. Supply if he still chooses drug-only, document." }, { id: "c", label: "Double the dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Combined approach is best. Counsel, but respect patient autonomy if he chooses drug-only. Document the conversation." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "PE history (lifelong/acquired), BP, full medication list (especially serotonergic and CYP3A4), cardiovascular history, counselling delivered — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates the safety screening (CV, drug interactions) and the comprehensive counselling delivered." },
  ],
};
