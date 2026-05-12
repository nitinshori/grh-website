// Alcohol reduction — PGD training (nalmefene)
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const alcoholReductionModule: TrainingModule = {
  slug: "alcohol-reduction",
  title: "Alcohol Reduction (Nalmefene) — PGD",
  description: "Supply of nalmefene 18 mg PRN for alcohol-dependence patients aiming to reduce consumption under PGD.",
  pgdSlugs: ["alcohol-reduction"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Alcohol Reduction — Training", subtitle: "Nalmefene for as-needed reduction of alcohol consumption", estimatedMinutes: 12, objectives: [
      "Identify eligible patients per NICE TA325 (high-risk drinkers wanting to reduce, not abstain).",
      "Recognise contraindications including current opioid use.",
      "Counsel on psychosocial support requirements and the 'targeted use' mechanism.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Nalmefene is an opioid-system modulator licensed for reducing alcohol consumption (not for abstinence) in patients with alcohol dependence at high drinking risk levels. NICE TA325 supports use alongside continuous psychosocial support.",
      "Taken on-demand 1–2 hours before anticipated drinking (or as soon as possible after drinking starts). One tablet (18 mg) per day maximum. Not a daily medication.",
      "Patient should be drinking at high-risk levels (>60g alcohol/day for men, >40g/day for women), motivated to reduce, in psychosocial support, and not in immediate withdrawal.",
    ], highlights: ["For high-risk drinkers wanting REDUCTION, not abstinence.", "On-demand 1–2 hours before anticipated drinking.", "Mandatory psychosocial support alongside."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18–70", detail: "Outside this range refer." },
      { label: "Alcohol dependence with high drinking risk level", detail: "DRL: >60g/day (men) or >40g/day (women) without physical withdrawal at presentation." },
      { label: "Goal is REDUCTION, not abstinence", detail: "If aiming for abstinence — different pathway (acamprosate, naltrexone, disulfiram). Refer." },
      { label: "Engaged with continuous psychosocial support", detail: "Required by NICE — not just a script for tablets. Must have engagement with alcohol services or equivalent." },
      { label: "No need for immediate detoxification", detail: "Acute alcohol withdrawal needs medical detox first." },
      { label: "Not currently on opioids", detail: "Nalmefene blocks opioid effect — analgesic failure and withdrawal precipitation." },
      { label: "Not pregnant or breastfeeding", detail: "Refer to GP/midwife and alcohol services." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications", tone: "danger", message: "Do not supply.", detail: [
      "Current opioid use (prescribed or illicit, including codeine, tramadol, methadone, buprenorphine).",
      "Acute alcohol withdrawal symptoms (tremor, sweating, tachycardia, agitation) — needs medical detox.",
      "Recent or current alcohol detoxification.",
      "Severe hepatic impairment.",
      "Severe renal impairment.",
      "Goal is abstinence rather than reduction.",
      "Pregnancy or breastfeeding.",
      "Without engagement with psychosocial support.",
      "Known hypersensitivity to nalmefene.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing", intro: "On-demand only.", items: [
      { label: "Dose", detail: "Nalmefene 18 mg orally, ideally 1–2 hours before anticipated drinking. Or as soon as practicable after drinking has started." },
      { label: "Maximum", detail: "1 tablet per day. Not for daily prophylactic use." },
      { label: "Timing", detail: "Patient anticipates a high-risk drinking situation and pre-dose. If they didn't anticipate but find themselves drinking heavily, can take retrospectively." },
      { label: "Duration", detail: "Continue while drinking remains a risk and patient is engaged. Review every 6 months; consider continuing if benefit, discontinuing if not." },
      { label: "Treatment without psychosocial support", detail: "Not authorised under PGD or NICE — engagement is mandatory." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Not a 'permission' to drink", detail: "Nalmefene reduces craving and reward; it doesn't make heavy drinking safe. Drink remains harmful." },
      { label: "Anticipate drinking situations", detail: "Identify high-risk times (Friday night, social events) and pre-dose 1–2 hours before." },
      { label: "Side effects", detail: "Nausea (most common), dizziness, insomnia, headache, fatigue. Usually mild, settle." },
      { label: "Sleep disturbance", detail: "Common. Try morning use rather than evening." },
      { label: "Avoid opioids", detail: "Nalmefene blocks opioid effects. Avoid codeine, tramadol, etc. If emergency surgery needed, inform medical team." },
      { label: "Driving", detail: "Caution until tolerated — dizziness, fatigue can affect driving." },
      { label: "Psychosocial support", detail: "Mandatory. Alcohol services, AA, CBT, structured GP review — engagement must continue." },
      { label: "Withdrawal awareness", detail: "If suddenly stopping or reducing rapidly, patient may experience withdrawal (tremor, sweating, anxiety) — seek medical help." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "For high-risk drinkers wanting reduction, not abstinence.",
      "On-demand 1–2 hours before drinking, max once daily.",
      "Mandatory psychosocial support alongside.",
      "Contraindicated: current opioids, acute withdrawal, pregnancy, severe hepatic/renal.",
      "Not 'permission to drink' — drinking remains harmful.",
      "Engage with alcohol services; refer if abstinence is goal.",
    ]},
  ],
  quiz: [
    { id: "q-opioid", type: "single-choice", critical: true, question: "Patient takes occasional codeine for back pain. Wants nalmefene. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Contraindicated. Concurrent opioid use means nalmefene blocks analgesic effect and risks withdrawal in opioid-dependent. Refer GP for pain alternative first." }, { id: "c", label: "Half dose." }, { id: "d", label: "Time-separation." }
    ], correctOptionIds: ["b"], explanation: "Concurrent opioid use is an absolute contraindication. Nalmefene blocks opioid analgesia and can precipitate withdrawal." },
    { id: "q-abstinence-goal", type: "single-choice", critical: true, question: "Patient says she wants to stop drinking entirely. Action?", options: [
      { id: "a", label: "Supply nalmefene." }, { id: "b", label: "Refer to alcohol services / GP — abstinence goal uses different agents (acamprosate, naltrexone, disulfiram) and approach. Nalmefene is for reduction." }, { id: "c", label: "Supply daily nalmefene." }, { id: "d", label: "Refer A&E." }
    ], correctOptionIds: ["b"], explanation: "Nalmefene is reduction-oriented, not abstinence. Different pharmacotherapy for abstinence — refer." },
    { id: "q-withdrawal", type: "single-choice", critical: true, question: "Patient presents shaking, sweating, tachycardia, last drink 18 hours ago. Wants nalmefene to help cut down. Action?", options: [
      { id: "a", label: "Supply nalmefene." }, { id: "b", label: "Refer urgent care — this is acute alcohol withdrawal, needs medical detox (chlordiazepoxide-based), not nalmefene. Untreated severe withdrawal can be fatal." }, { id: "c", label: "Half dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Acute withdrawal needs medical detox. Untreated severe withdrawal can include seizures and delirium tremens — fatal in 5%." },
    { id: "q-psychosocial", type: "single-choice", critical: true, question: "Patient says he doesn't want to engage with alcohol services — just wants the tablets. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Decline under PGD — NICE requires continuous psychosocial support alongside nalmefene. Encourage engagement; offer referral. Without it, nalmefene is not authorised." }, { id: "c", label: "Supply with brief counselling." }, { id: "d", label: "Refer A&E." }
    ], correctOptionIds: ["b"], explanation: "NICE TA325 explicitly requires psychosocial support alongside nalmefene. Drug-only is not authorised." },
    { id: "q-pregnancy", type: "single-choice", question: "Pregnant patient with alcohol dependence. Action?", options: [
      { id: "a", label: "Supply nalmefene." }, { id: "b", label: "Refer urgently to specialist obstetric and alcohol services. Pregnancy + alcohol is a complex situation needing multidisciplinary care; nalmefene not used." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy + alcohol dependence needs specialist care, not PGD. Foetal alcohol risk; psychosocial complexity." },
    { id: "q-dosing", type: "single-choice", question: "When should nalmefene ideally be taken?", options: [
      { id: "a", label: "Daily at bedtime." }, { id: "b", label: "1–2 hours before anticipated drinking, max once daily. Or retrospectively after drinking has started." }, { id: "c", label: "Twice daily." }, { id: "d", label: "Only when withdrawal occurs." }
    ], correctOptionIds: ["b"], explanation: "On-demand, pre-emptive (ideal) or reactive (acceptable). Max once daily. Not daily prophylactic." },
    { id: "q-permission", type: "single-choice", question: "Patient says 'now I can drink as much as I want with the tablet'. Correct counselling?", options: [
      { id: "a", label: "Agree." }, { id: "b", label: "Counsel that nalmefene reduces craving but doesn't make drinking safe. Heavy drinking remains harmful (hepatic, cardiovascular, mental health, accident, relationship). The goal is reduction." }, { id: "c", label: "Increase dose." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Patient misconceptions are common. Nalmefene is a reduction aid, not a 'safe drinking' permit. Counsel clearly." },
    { id: "q-opioid-emergency", type: "single-choice", question: "Patient on nalmefene needs emergency analgesia after a fall. What's the issue?", options: [
      { id: "a", label: "No issue." }, { id: "b", label: "Standard opioid analgesics (morphine, fentanyl) may have markedly reduced effect for ~24–48 hours due to nalmefene blockade. Inform medical team. Non-opioid alternatives or higher opioid doses may be needed." }, { id: "c", label: "Stop nalmefene immediately." }, { id: "d", label: "No change." }
    ], correctOptionIds: ["b"], explanation: "Nalmefene blocks opioid receptors. In emergency, medical team must know — they can adjust strategy (non-opioids, regional anaesthesia, or higher opioid doses with careful titration)." },
    { id: "q-review", type: "single-choice", question: "How often should patients on nalmefene be reviewed?", options: [
      { id: "a", label: "Annually." }, { id: "b", label: "Every 6 months — check continued engagement, drinking reduction, side effects, psychosocial support. Consider continuation only if benefit." }, { id: "c", label: "Once after 1 year." }, { id: "d", label: "Never — open-ended." }
    ], correctOptionIds: ["b"], explanation: "6-monthly review per NICE — check progress, engagement, and that benefit justifies continuation." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Drinking pattern (units/day), high-risk-drinking-level confirmation, opioid history (none), pregnancy status, psychosocial-support engagement, GP-informed — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record captures all the safety-critical eligibility items including psychosocial-support engagement." },
  ],
};
