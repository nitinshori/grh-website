// Smoking cessation — varenicline PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const smokingVareniclineModule: TrainingModule = {
  slug: "smoking-varenicline",
  title: "Smoking Cessation (Varenicline) — PGD",
  description: "Supply of varenicline for smoking cessation under PGD.",
  pgdSlugs: ["smoking-varenicline"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Varenicline — Training", subtitle: "Nicotinic partial agonist for smoking cessation", estimatedMinutes: 12, objectives: [
      "Identify candidates eligible for varenicline under the PGD.",
      "Apply the 12-week titration regimen and the quit-day model.",
      "Counsel on the neuropsychiatric warning, side effects, and behavioural support.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Varenicline is a partial agonist at α4β2 nicotinic acetylcholine receptors. It reduces craving and withdrawal symptoms while blunting the rewarding effect of smoking. The most effective single pharmacotherapy for smoking cessation in head-to-head trials (more effective than NRT or bupropion).",
      "Standard regimen: titrate over 7 days, quit on day 8, continue for 12 weeks total. Can extend to 24 weeks if effective and tolerated.",
      "Note: varenicline (Champix) was reintroduced after a temporary withdrawal over nitrosamine concerns. Verify current supply availability.",
    ], highlights: ["Most effective single pharmacotherapy for smoking cessation.", "12-week course with quit-day on day 8.", "Behavioural support doubles efficacy — never supply without."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 18+", detail: "Under 18 — refer." },
      { label: "Smoker motivated to quit", detail: "Has set a quit date; agrees to behavioural support concurrently." },
      { label: "Not pregnant or breastfeeding", detail: "Refer to GP/midwife — NRT is generally preferred in pregnancy." },
      { label: "No significant psychiatric history that's a contraindication", detail: "Active major depression, current suicidal ideation, recent psychiatric admission — refer." },
      { label: "No history of seizure (caution)", detail: "Varenicline can lower seizure threshold slightly." },
      { label: "Engaged with behavioural support", detail: "GP, stop-smoking service, or pharmacy stop-smoking service. Pharmacotherapy without behavioural support has lower success rates." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "When NOT to supply", tone: "danger", message: "Refer for any of these.", detail: [
      "Pregnancy or breastfeeding.",
      "Active major depression or recent psychiatric admission.",
      "Current suicidal ideation or self-harm.",
      "History of seizure disorder.",
      "Severe renal impairment (eGFR <30) — dose adjustment, refer.",
      "End-stage renal disease.",
      "Concurrent bupropion (Zyban) — overlapping mechanism, contraindicated combination.",
      "Hypersensitivity to varenicline.",
      "Under 18.",
    ]},
    { id: "regimen", type: "checklist", title: "Standard regimen", intro: "12-week titration and quit-day model.", items: [
      { label: "Days 1–3", detail: "0.5 mg once daily." },
      { label: "Days 4–7", detail: "0.5 mg twice daily." },
      { label: "Day 8 onwards (until end of week 12)", detail: "1 mg twice daily. Quit smoking on day 8." },
      { label: "Take with food and water", detail: "Reduces nausea." },
      { label: "If 1 mg BD not tolerated", detail: "Reduce to 0.5 mg BD permanently. May be less effective." },
      { label: "Extension to 24 weeks", detail: "Acceptable if effective and tolerated — improves abstinence at 1 year." },
      { label: "Renal dose adjustment", detail: "eGFR <30: 0.5 mg OD maximum after titration. eGFR <15: refer specialist." },
    ]},
    { id: "neuropsychiatric", type: "callout", title: "Neuropsychiatric warning", tone: "warning", message: "Historical concerns about mood and behaviour changes.", detail: [
      "Initial post-marketing reports raised concerns about depression, suicidal ideation, agitation, and behavioural changes. Subsequent large trials (EAGLES) showed no significant excess vs NRT, but the warning persists.",
      "Counsel: ask the patient and household contacts to watch for any new mood changes, increased anxiety, aggression, sleep disturbance, unusual thoughts.",
      "Stop and refer if any concerning psychiatric symptoms emerge.",
      "Take a careful psychiatric history before initiating; existing well-controlled depression on stable treatment is OK with GP awareness.",
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Behavioural support is essential", detail: "Refer to or provide concurrent stop-smoking service. Doubles chance of success vs pharmacotherapy alone." },
      { label: "Quit day", detail: "Day 8 is quit day. Smoking after this point can continue while drug is started but should stop completely by quit day." },
      { label: "Nausea", detail: "Most common side effect (~30%). Usually mild, improves over time. Take with food and water." },
      { label: "Vivid dreams / sleep disturbance", detail: "Common. Often described as detailed/strange but not necessarily distressing. Take morning dose if PM dose disturbing sleep." },
      { label: "Mood changes", detail: "Stop and seek help for any new low mood, anxiety, agitation, unusual thoughts." },
      { label: "Alcohol", detail: "Reduce alcohol — case reports of altered intoxication / behavioural effects." },
      { label: "Driving", detail: "Caution until you know how you respond — small risk of dizziness, drowsiness." },
      { label: "Re-attempt if lapse", detail: "Lapses are common. Don't abandon — re-engage with the plan. Brief slip ≠ failure." },
    ]},
    { id: "red-flags", type: "callout", title: "Stop and refer", tone: "danger", message: "Reasons to discontinue.", detail: [
      "Suicidal ideation, severe mood change, new psychotic symptoms.",
      "Seizure.",
      "Severe persistent nausea preventing oral intake.",
      "Cardiovascular event during therapy (rare association with MI/stroke).",
      "Hypersensitivity reaction.",
      "Aggression or sudden behavioural change reported by family.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Most effective single pharmacotherapy for smoking cessation.",
      "Titration over 7 days, quit on day 8, total 12 weeks.",
      "Mandatory behavioural support alongside.",
      "Refer: pregnancy, active major depression, seizure history, severe renal impairment.",
      "Neuropsychiatric warning — watch for mood changes.",
      "Nausea, vivid dreams common; usually mild.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant smoker, 12 weeks gestation, motivated to quit. Action?", options: [
      { id: "a", label: "Supply varenicline." }, { id: "b", label: "Refer to GP / specialist stop-smoking-in-pregnancy service. Varenicline is not recommended in pregnancy. NRT (with discussion of risk-benefit) or behavioural support are the usual options." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Varenicline is not used in pregnancy. NRT and intensive behavioural support are the mainstays. Specialist stop-smoking services have pregnancy pathways." },
    { id: "q-depression", type: "single-choice", critical: true, question: "Patient describes ongoing severe low mood and occasional thoughts of self-harm. Wants varenicline. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Do not supply. Active major depression and suicidal ideation are contraindications. Refer to GP / mental health." }, { id: "c", label: "Supply with antidepressant." }, { id: "d", label: "Half dose." }
    ], correctOptionIds: ["b"], explanation: "Active major depression and suicidal ideation are absolute contraindications under this PGD. Mental health takes priority; smoking cessation can be revisited when mood is stable." },
    { id: "q-seizure", type: "single-choice", critical: true, question: "Patient had a seizure 3 years ago (alcohol withdrawal). Action?", options: [
      { id: "a", label: "Supply varenicline." }, { id: "b", label: "Refer. History of seizures is a contraindication — varenicline can lower seizure threshold." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Supply with anticonvulsant." }
    ], correctOptionIds: ["b"], explanation: "Seizure history is a contraindication. NRT or behavioural support are safer alternatives." },
    { id: "q-quit-day", type: "single-choice", critical: true, question: "When is the recommended quit day?", options: [
      { id: "a", label: "Day 1 — same day as starting tablets." }, { id: "b", label: "Day 8 — after 7 days of titration." }, { id: "c", label: "Day 14." }, { id: "d", label: "When ready." }
    ], correctOptionIds: ["b"], explanation: "Quit day is day 8, after 7 days of titration. This allows the drug to reach effective levels and the patient to settle on the regimen before facing nicotine withdrawal." },
    { id: "q-behavioural", type: "single-choice", question: "Patient says she doesn't want behavioural support — just the tablets. Action?", options: [
      { id: "a", label: "Supply regardless." }, { id: "b", label: "Strongly counsel on importance — behavioural support doubles success. Pharmacotherapy alone has much lower abstinence rates. If she refuses, document and proceed (or refer if not willing to engage at all)." }, { id: "c", label: "Refuse outright." }, { id: "d", label: "Supply double dose." }
    ], correctOptionIds: ["b"], explanation: "Behavioural support is critical. Counsel firmly. If she still declines, document and supply — but pharmacotherapy-only has substantially lower quit rates." },
    { id: "q-nausea", type: "single-choice", question: "Patient on varenicline 1 mg BD has moderate nausea. What's the advice?", options: [
      { id: "a", label: "Stop varenicline." }, { id: "b", label: "Take with food and water; nausea usually settles over time. If severe, consider reducing to 0.5 mg BD (may be less effective)." }, { id: "c", label: "Switch to bupropion." }, { id: "d", label: "Add anti-emetic." }
    ], correctOptionIds: ["b"], explanation: "Nausea is the commonest side effect, usually mild and improving. With food, fluids, and time. Dose reduction is acceptable if needed." },
    { id: "q-renal", type: "single-choice", question: "Patient with eGFR 25 wants varenicline. Action?", options: [
      { id: "a", label: "Standard dose." }, { id: "b", label: "Refer to GP — eGFR <30 requires dose adjustment (0.5 mg OD max). Likely GP-managed." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Renal impairment requires dose adjustment. eGFR <30: 0.5 mg OD max. <15: specialist. Refer for proper assessment." },
    { id: "q-mood-change", type: "single-choice", question: "Patient 5 weeks into varenicline reports new low mood, snappy with family, sleep disturbance. Action?", options: [
      { id: "a", label: "Continue and review." }, { id: "b", label: "Stop varenicline. Refer for mental-health assessment. Mood changes on varenicline can be drug-related; safer to stop." }, { id: "c", label: "Add antidepressant." }, { id: "d", label: "Increase dose." }
    ], correctOptionIds: ["b"], explanation: "New mood/behaviour change on varenicline warrants stopping and reassessment. Risk vs benefit favours stopping until clarified." },
    { id: "q-bupropion", type: "single-choice", question: "Patient is currently taking bupropion (Zyban). Wants to add varenicline. Action?", options: [
      { id: "a", label: "Combine for stronger effect." }, { id: "b", label: "Contraindicated. Either varenicline OR bupropion, not both. Refer to GP if she wants to switch." }, { id: "c", label: "Halve both doses." }, { id: "d", label: "Alternate days." }
    ], correctOptionIds: ["b"], explanation: "Stacking pharmacotherapies isn't recommended and bupropion + varenicline isn't a licensed combination." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Psychiatric screening, current medication, behavioural support arrangement, regimen, GP-informed status — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Documentation specifically demonstrates that mental health was screened and behavioural support arranged — the two highest-impact safety items." },
  ],
};
