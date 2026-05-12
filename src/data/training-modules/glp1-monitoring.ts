// GLP-1 monitoring — ongoing-care PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const glp1MonitoringModule: TrainingModule = {
  slug: "glp1-monitoring",
  title: "GLP-1 Monitoring — PGD",
  description: "Ongoing-care reviews for patients already on GLP-1 weight-management agents: titration decisions, tolerability, monitoring, and red flags.",
  pgdSlugs: ["glp1-monitoring"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "GLP-1 Monitoring — Training", subtitle: "Ongoing-care reviews for established GLP-1 patients", estimatedMinutes: 12, objectives: [
      "Conduct a structured ongoing-care review for patients already on Wegovy, Mounjaro, or Saxenda.",
      "Apply discontinuation criteria correctly.",
      "Recognise when a patient must be referred (red flags, new contraindications, pregnancy intent).",
      "Document the review defensibly in the ePGD tool.",
    ]},
    { id: "background", type: "content", title: "Purpose of this PGD", body: [
      "Patients on GLP-1 weight-management agents (Wegovy, Mounjaro, Saxenda) require structured monitoring at each supply. This PGD covers that ongoing review process — not initiation, which is covered by the agent-specific PGDs.",
      "The monitoring review captures weight progress, tolerability, side effects, contraception, and any new contraindications, and produces a clear continuation/dose-change/discontinuation decision.",
    ], highlights: ["Each visit is a structured review, not a refill.", "Discontinuation criteria are non-negotiable — apply them.", "Document the decision and rationale every time."] },
    { id: "scope", type: "checklist", title: "Scope — when this PGD applies", intro: "Use this PGD when a patient is returning for ongoing supply of a GLP-1 they already started.", items: [
      { label: "Patient already initiated under a GLP-1 PGD (Wegovy, Mounjaro, Saxenda)", detail: "Initial assessment was already completed under the agent-specific PGD." },
      { label: "Not the first supply", detail: "If first supply, use the agent-specific initiation PGD." },
      { label: "No new absolute contraindication since last visit", detail: "Re-screen at every visit." },
      { label: "Patient is past the titration phase, or has tolerability questions during titration", detail: "Titration-phase questions also handled here." },
    ]},
    { id: "review-checklist", type: "checklist", title: "Structured review — every visit", intro: "Each ongoing review covers these items in the ePGD tool.", items: [
      { label: "Weight today and percentage change from baseline", detail: "Calculate % loss from pre-treatment baseline weight. This drives the continuation decision." },
      { label: "Current dose and step in titration", detail: "Confirm what step the patient is on and whether a step-up is due." },
      { label: "Tolerability and side effects", detail: "Nausea, vomiting, diarrhoea, constipation, dyspepsia, fatigue, injection-site reactions, hair shedding." },
      { label: "Hydration status", detail: "Particularly if vomiting/diarrhoea has been an issue." },
      { label: "Any treatment pauses since last visit", detail: "Pauses ≥2 weeks (Wegovy) or ≥4 weeks (Mounjaro) or ≥3 days (Saxenda) require re-titration from lowest dose." },
      { label: "Lifestyle review — diet and physical activity", detail: "GLP-1 without lifestyle change underperforms." },
      { label: "Contraception confirmation in women of childbearing age", detail: "Mandatory. Pregnancy is an absolute contraindication. For Mounjaro, confirm OCP-interaction backup method." },
      { label: "Mood and mental health", detail: "Watch for new low mood, suicidal ideation — rare but reported on GLP-1s." },
      { label: "Any new medications or medical conditions since last visit", detail: "May change the contraindication picture." },
      { label: "GP-informed status", detail: "Confirm GP knows the patient is on GLP-1. If not, encourage communication." },
    ]},
    { id: "decision-tree", type: "comparison", title: "Continuation decision tree", intro: "Apply at every visit. The discontinuation criteria differ by agent.", columns: [
      { label: "Wegovy", rows: [
        { heading: "Target dose", body: "2.4 mg weekly maintenance." },
        { heading: "Discontinue if", body: "<5% weight loss at 6 months on 2.4 mg maintenance." },
        { heading: "Continue if", body: "≥5% loss at 6 months or still in titration phase." },
      ]},
      { label: "Mounjaro", rows: [
        { heading: "Target dose", body: "15 mg weekly maintenance (or highest tolerated)." },
        { heading: "Discontinue if", body: "<5% weight loss at 6 months on the tolerated maintenance dose." },
        { heading: "Continue if", body: "≥5% loss at 6 months or still in titration." },
      ]},
      { label: "Saxenda", rows: [
        { heading: "Target dose", body: "3 mg daily maintenance." },
        { heading: "Discontinue if", body: "<5% weight loss at 12 weeks on 3 mg maintenance." },
        { heading: "Continue if", body: "≥5% loss at 12 weeks or still in titration." },
      ]},
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — stop and refer", tone: "danger", message: "Any of these at a monitoring visit warrants stopping the GLP-1 and referring.", detail: [
      "Severe persistent abdominal pain radiating to back — possible pancreatitis.",
      "Acute RUQ pain with fever / jaundice — possible cholecystitis.",
      "Severe persistent vomiting preventing fluid intake — AKI risk.",
      "Neck swelling, persistent hoarseness, dysphagia — possible thyroid pathology.",
      "Allergic reaction signs — A&E.",
      "New or worsening depression, suicidal ideation.",
      "Visual changes in diabetic patient — possible retinopathy worsening.",
      "Pregnancy confirmed or suspected — stop immediately.",
      "Newly diagnosed condition that is a contraindication (pancreatitis, MTC, severe GI disease, etc.).",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — discontinuation point", scenario: "Patient on Wegovy 2.4 mg maintenance for 6 months. Baseline weight 100 kg; today 96 kg (4% loss). She feels well and wants to continue.",
      question: "What's the correct action?", answer: "Discuss discontinuation. The Wegovy PGD criterion is <5% loss at 6 months on 2.4 mg maintenance — she is below this threshold. Continuation outside the PGD criterion is not authorised. Counsel on alternatives: switch to Mounjaro (after washout, with full re-titration), trial of more intensive lifestyle support, or GP referral for specialist obesity service. Document the decision and her choice.",
      rationale: "The discontinuation criterion is the hard rule of the PGD. Continuation despite inadequate response isn't authorised. Switching to a different agent under another PGD is acceptable; just continuing isn't." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Structured review at every visit — weight, dose, tolerability, contraception, lifestyle, mood, GP awareness.",
      "Apply discontinuation criteria honestly: Wegovy <5% at 6 mo, Mounjaro <5% at 6 mo, Saxenda <5% at 12 wks.",
      "Treatment pauses trigger re-titration — different cut-offs per agent.",
      "Contraception mandatory at every visit for women of childbearing age.",
      "Red flags = stop and refer. Pregnancy is absolute contraindication.",
      "Document every decision in the ePGD tool.",
    ]},
  ],
  quiz: [
    { id: "q-criterion-wegovy", type: "single-choice", critical: true, question: "Wegovy discontinuation criterion?", options: [
      { id: "a", label: "<5% weight loss at 12 weeks." }, { id: "b", label: "<5% weight loss at 6 months on 2.4 mg maintenance." }, { id: "c", label: "Always 12 months minimum." }, { id: "d", label: "At patient discretion." }
    ], correctOptionIds: ["b"], explanation: "Wegovy criterion is <5% loss at 6 months on the 2.4 mg maintenance dose. (Saxenda uses 12 weeks on its 3 mg maintenance.)" },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Patient on GLP-1 mentions she's trying to conceive within 2 months. Action?", options: [
      { id: "a", label: "Continue until pregnancy confirmed." }, { id: "b", label: "Stop the GLP-1 now — pregnancy and preconception are absolute contraindications. Refer for non-pharmacological weight support if needed." }, { id: "c", label: "Reduce dose." }, { id: "d", label: "Switch to Saxenda." }
    ], correctOptionIds: ["b"], explanation: "All GLP-1 RAs are contraindicated in preconception and pregnancy. Stop in advance (1 month for Saxenda, 2 months for semaglutide/tirzepatide)." },
    { id: "q-pause-wegovy", type: "single-choice", critical: true, question: "Patient paused Wegovy for 3 weeks. Restart approach?", options: [
      { id: "a", label: "Resume at last dose." }, { id: "b", label: "Re-titrate from 0.25 mg — pauses ≥2 weeks require full re-titration." }, { id: "c", label: "Start mid-titration." }, { id: "d", label: "Switch to Mounjaro." }
    ], correctOptionIds: ["b"], explanation: "Wegovy pauses ≥2 weeks need re-titration. Mounjaro: ≥4 weeks. Saxenda: ≥3 days. Different per agent." },
    { id: "q-pancreatitis", type: "single-choice", critical: true, question: "At a monitoring visit, patient reports severe epigastric pain radiating to back, vomiting. Action?", options: [
      { id: "a", label: "Continue and review next visit." }, { id: "b", label: "Stop GLP-1 immediately, refer to A&E — pancreatitis suspected." }, { id: "c", label: "Reduce dose." }, { id: "d", label: "Switch agent." }
    ], correctOptionIds: ["b"], explanation: "Pancreatitis is a medical emergency. Stop and refer. Future GLP-1 then contraindicated." },
    { id: "q-saxenda-criterion", type: "single-choice", question: "Saxenda discontinuation criterion?", options: [
      { id: "a", label: "<5% loss at 6 months on 3 mg." }, { id: "b", label: "<5% loss at 12 weeks on 3 mg maintenance." }, { id: "c", label: "<10% loss at 12 weeks." }, { id: "d", label: "Continue indefinitely." }
    ], correctOptionIds: ["b"], explanation: "Saxenda's criterion is 12 weeks on its 3 mg maintenance dose. Different from the weekly agents (6 months)." },
    { id: "q-mounjaro-ocp", type: "single-choice", question: "Patient on Mounjaro 10 mg returns for review. She's on the combined oral pill. Action?", options: [
      { id: "a", label: "Continue normally." }, { id: "b", label: "Reconfirm she's using non-oral or backup barrier contraception during/after each dose escalation. Document." }, { id: "c", label: "Stop the COCP." }, { id: "d", label: "Switch agent." }
    ], correctOptionIds: ["b"], explanation: "Mounjaro reduces OCP efficacy. Backup contraception is mandatory; reconfirm at every visit." },
    { id: "q-mood", type: "single-choice", question: "Patient on GLP-1 reports new low mood and occasional thoughts of self-harm. Action?", options: [
      { id: "a", label: "Continue and review next visit." }, { id: "b", label: "Stop GLP-1, refer to GP / crisis services. Mood changes are a recognised red flag." }, { id: "c", label: "Increase dose." }, { id: "d", label: "Switch to Mounjaro." }
    ], correctOptionIds: ["b"], explanation: "Mood changes are a recognised, rare adverse effect of GLP-1s. Stop and refer for proper mental health assessment." },
    { id: "q-lifestyle", type: "single-choice", question: "A patient has lost only 2% at 4 months on Wegovy 2.4 mg. She admits she has not changed her diet at all. Action?", options: [
      { id: "a", label: "Continue Wegovy; the drug will catch up." }, { id: "b", label: "Counsel that GLP-1 without lifestyle change underperforms. Refer to dietitian / lifestyle support. Plan a 6-month review with the discontinuation rule in mind." }, { id: "c", label: "Increase dose." }, { id: "d", label: "Switch immediately." }
    ], correctOptionIds: ["b"], explanation: "Lifestyle is non-negotiable. GLP-1 plus continued unchanged diet underperforms substantially. The decision at 6 months is real — if she still hasn't engaged, the PGD discontinuation criterion will apply." },
    { id: "q-gp", type: "single-choice", question: "Patient says her GP doesn't know she's on Wegovy. Action?", options: [
      { id: "a", label: "Continue without informing GP." }, { id: "b", label: "Encourage her to inform the GP. Offer a letter on her behalf. Document GP-informed status (or her decision to inform later)." }, { id: "c", label: "Stop Wegovy." }, { id: "d", label: "Inform the GP without her consent." }
    ], correctOptionIds: ["b"], explanation: "GP coordination is the expected standard. Patient consent is needed for direct communication; offer support and document her decision." },
    { id: "q-record", type: "single-choice", question: "Required documentation per monitoring visit?", options: [
      { id: "a", label: "Medicine label only." }, { id: "b", label: "Weight, % loss from baseline, dose, tolerability, contraception, lifestyle engagement, GP-status, any new conditions/meds, continuation/dose-change/discontinuation decision with rationale — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text note." }
    ], correctOptionIds: ["b"], explanation: "Structured record at every visit. The decision with rationale is the load-bearing audit item." },
  ],
};
