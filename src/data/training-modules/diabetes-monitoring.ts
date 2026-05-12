// Diabetes monitoring — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const diabetesMonitoringModule: TrainingModule = {
  slug: "diabetes-monitoring",
  title: "Diabetes Monitoring & HbA1c — PGD",
  description: "Annual HbA1c, BP, foot, and lifestyle review for known diabetic patients under PGD.",
  pgdSlugs: ["diabetes-monitoring"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Diabetes Monitoring — Training", subtitle: "Structured annual review for diabetic patients", estimatedMinutes: 10, objectives: [
      "Conduct a structured annual diabetic review covering biochemistry, BP, foot, eyes, mental health.",
      "Apply appropriate HbA1c targets and escalation pathways.",
      "Coordinate with GP / diabetic services for medication adjustments.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Diabetes management requires regular structured monitoring — HbA1c, BP, lipids, renal function, foot check, retinal screening, mental health. Poorly-controlled diabetes leads to micro- and macrovascular complications.",
      "Pharmacy-led monitoring under PGD supplements GP-led care, offering convenient access. PGD covers structured review, not medication changes — those remain GP-led, with pharmacy feeding findings back.",
      "HbA1c targets: typically ≤48 mmol/mol (6.5%) on lifestyle / metformin alone; ≤53 mmol/mol (7%) on agents causing hypoglycaemia; individualised for elderly / frail.",
    ], highlights: ["Pharmacy review supplements but doesn't replace GP-led care.", "Always feed findings back to GP.", "HbA1c targets individualised; older / frail patients have higher targets."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18+ with established type 2 diabetes", detail: "Type 1 diabetes is specialist territory; refer." },
      { label: "On stable regimen and engaged with GP / diabetic team", detail: "Newly diagnosed or recently changed treatment needs GP review, not pharmacy alone." },
      { label: "Not pregnant", detail: "Diabetes in pregnancy = specialist (gestational diabetes service)." },
      { label: "Patient consents to result sharing with GP", detail: "Findings must be shared back." },
      { label: "Not in acute hyperglycaemia or DKA", detail: "Symptoms of polyuria, polydipsia, weight loss, lethargy, abdominal pain, vomiting in known diabetic = urgent referral." },
    ]},
    { id: "review-components", type: "checklist", title: "Annual review components", intro: "Per NICE / Diabetes UK structured review.", items: [
      { label: "HbA1c", detail: "Capillary or venous. Compare to target and previous result. Trend matters." },
      { label: "Blood pressure", detail: "Target <140/80 generally; <130/80 if microvascular complications. Discuss any changes with GP." },
      { label: "Weight and BMI", detail: "Weight trend and lifestyle review." },
      { label: "Foot examination", detail: "Inspection for ulceration, callus, deformity. Test pulses (DP, PT). Monofilament sensation testing. Categorise risk (low/moderate/high). High risk = refer foot service." },
      { label: "Retinal screening confirmation", detail: "Annual NHS DESP service. Confirm patient is engaged; signpost if missed." },
      { label: "Smoking, alcohol, exercise, diet review", detail: "Lifestyle remains foundational." },
      { label: "Mood / depression screening (PHQ-2)", detail: "Diabetes-depression bidirectional. Refer for fuller assessment if positive." },
      { label: "Medication review", detail: "Adherence, side effects. Don't change meds in PGD; refer to GP if issues." },
      { label: "U&E / lipids", detail: "Check most recent results; arrange via GP if overdue." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer urgently", tone: "danger", message: "These need urgent attention.", detail: [
      "Symptoms of DKA (vomiting, abdominal pain, deep breathing, fruity breath) — A&E.",
      "Severe hyperglycaemia with symptoms.",
      "Foot ulcer or infection — urgent foot service.",
      "Acute visual change.",
      "Severe hypoglycaemia or recurrent hypos.",
      "Significant unintentional weight loss.",
      "Cardiovascular symptoms (chest pain, severe breathlessness).",
      "Symptoms of severe depression / suicidal ideation.",
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Self-monitoring", detail: "For insulin / sulphonylurea-treated, daily home glucose monitoring. For lifestyle / metformin only, structured testing not routinely required but HbA1c monitoring sufficient." },
      { label: "Hypoglycaemia awareness", detail: "Recognition (sweating, shaking, hunger, confusion). Carry fast-acting carbohydrate. Recurrent hypos = GP / specialist." },
      { label: "Sick-day rules", detail: "Insulin patients: don't stop insulin during illness; check blood glucose more often; ketone testing if T1DM or T2DM on insulin." },
      { label: "Foot care", detail: "Daily inspection (or carer). Don't walk barefoot. Properly-fitted shoes. Toenail care. Promptly seek help for blisters/ulcers." },
      { label: "Driving", detail: "Insulin and sulphonylurea users have DVLA reporting requirements. Counsel on hypoglycaemia and driving." },
      { label: "Annual flu, pneumococcal, COVID, RSV vaccinations", detail: "Per Green Book — diabetes is an at-risk group." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Structured annual review: HbA1c, BP, weight, feet, retinal screening confirmation, lifestyle, mood, medication adherence.",
      "Feed findings to GP. PGD does NOT change medications.",
      "Targets individualised — typically HbA1c ≤53 mmol/mol on agents causing hypos; ≤48 on lifestyle / metformin alone.",
      "Refer: DKA / severe hyper, severe hypo, foot ulcer, acute visual change, mood concerns.",
      "Counsel: vaccination, foot care, sick-day rules, driving.",
    ]},
  ],
  quiz: [
    { id: "q-dka", type: "single-choice", critical: true, question: "Known diabetic patient comes in feeling unwell — vomiting, abdominal pain, deep rapid breathing, fruity-smelling breath. Action?", options: [
      { id: "a", label: "Counsel and review next week." }, { id: "b", label: "999 / A&E urgently — features of diabetic ketoacidosis (DKA), life-threatening." }, { id: "c", label: "More metformin." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "DKA features — Kussmaul breathing, ketone breath, GI symptoms — is a medical emergency. 999." },
    { id: "q-type-1", type: "single-choice", critical: true, question: "Type 1 diabetic patient wants annual review. Action?", options: [
      { id: "a", label: "Standard PGD review." }, { id: "b", label: "Refer to specialist diabetic team. Type 1 management is specialist (insulin titration, hypoglycaemia management, possible pump therapy)." }, { id: "c", label: "Half components." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Type 1 diabetes is specialist territory. PGD covers stable T2DM." },
    { id: "q-foot-ulcer", type: "single-choice", critical: true, question: "Diabetic patient has small ulcer on foot. Action?", options: [
      { id: "a", label: "Dressing under wound-care PGD." }, { id: "b", label: "Urgent referral to diabetic foot service or GP same day. Diabetic foot ulcer needs urgent multidisciplinary care — risk of osteomyelitis, amputation if delayed." }, { id: "c", label: "Topical antibiotic." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Diabetic foot ulcer is an emergency. Urgent referral, not pharmacy wound care." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient with diabetes wants pharmacy review. Action?", options: [
      { id: "a", label: "Standard review." }, { id: "b", label: "Refer to specialist diabetic antenatal team. Pregnancy diabetes (pre-existing or gestational) has tight HbA1c targets and specialist monitoring needs." }, { id: "c", label: "Half components." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy diabetes = specialist antenatal care. Tighter HbA1c, monitoring of complications, foetal surveillance." },
    { id: "q-hypos", type: "single-choice", question: "Patient on gliclazide reports 2 episodes of severe hypoglycaemia requiring help in last month. Action?", options: [
      { id: "a", label: "Continue and review." }, { id: "b", label: "Refer GP urgently — severe / recurrent hypos require medication review (dose reduction, change of agent, consideration of insulin therapy)." }, { id: "c", label: "Increase metformin." }, { id: "d", label: "Glucose tablets only." }
    ], correctOptionIds: ["b"], explanation: "Recurrent severe hypos warrant GP-led medication review. Possibly switch from sulphonylurea." },
    { id: "q-target", type: "single-choice", question: "Patient on metformin and gliclazide. HbA1c target?", options: [
      { id: "a", label: "≤48 mmol/mol." }, { id: "b", label: "≤53 mmol/mol (7%) — agents causing hypoglycaemia have a higher target to balance risk. Individualised for elderly / frail (may be 64+)." }, { id: "c", label: "≤30 mmol/mol." }, { id: "d", label: "≤75 mmol/mol." }
    ], correctOptionIds: ["b"], explanation: "Sulphonylurea use shifts target up to 53 to balance hypoglycaemia risk." },
    { id: "q-mood", type: "single-choice", question: "Patient's PHQ-2 score is 4 (suggestive of depression). Action?", options: [
      { id: "a", label: "Ignore — not pharmacy issue." }, { id: "b", label: "Refer GP for full mental-health assessment. Diabetes and depression are bidirectional; treating one improves the other. Both pharmacological and psychological options exist." }, { id: "c", label: "St John's wort." }, { id: "d", label: "Encourage exercise only." }
    ], correctOptionIds: ["b"], explanation: "Positive depression screen = GP referral. Mental health is integral to diabetes care." },
    { id: "q-no-changes", type: "single-choice", question: "Patient's HbA1c is high (68 mmol/mol). Can you change his diabetes medication?", options: [
      { id: "a", label: "Yes, increase metformin." }, { id: "b", label: "No. PGD covers structured monitoring; medication changes are GP-led. Refer findings to GP for treatment intensification." }, { id: "c", label: "Yes, add gliclazide." }, { id: "d", label: "Yes, switch to insulin." }
    ], correctOptionIds: ["b"], explanation: "PGD is monitoring only. Treatment changes need GP. Pharmacy role is structured review and timely feedback." },
    { id: "q-vaccination", type: "single-choice", question: "Vaccinations recommended for diabetic patient?", options: [
      { id: "a", label: "None specifically." }, { id: "b", label: "Annual flu, pneumococcal (single PCV20 if not had), annual COVID per current programme, RSV if eligible. Diabetes is an at-risk group for several Green Book cohorts." }, { id: "c", label: "Flu only." }, { id: "d", label: "Travel vaccines only." }
    ], correctOptionIds: ["b"], explanation: "Diabetes is an at-risk cohort for multiple immunisation programmes. Coordinate vaccinations." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Full review (HbA1c, BP, weight, foot exam, eye screening status, lifestyle, mood, medication adherence) — in the ePGD tool. Forward to GP." }, { id: "c", label: "GP email only." }, { id: "d", label: "Verbal." }
    ], correctOptionIds: ["b"], explanation: "Structured record + GP communication. Critical that GP receives findings to coordinate treatment changes." },
  ],
};
