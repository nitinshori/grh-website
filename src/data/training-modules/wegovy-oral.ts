// Wegovy (semaglutide) tablets for weight management — UK LICENSED
//
// Wegovy tablets (1.5 mg / 4 mg / 9 mg / 25 mg) hold UK marketing
// authorisation for chronic weight management (SmPC on emc, Novo Nordisk,
// updated Jun 2026). All previous Rybelsus/off-label pilot framing has been
// removed (Nitin, 10 Jul 2026). Content aligned to the UK SmPC posology:
// 1.5 mg → 4 mg → 9 mg → 25 mg once daily, minimum 1 month per step.

import type { TrainingModule } from "./types";

export const wegovyOralModule: TrainingModule = {
  slug: "wegovy-oral",
  title: "Wegovy (Semaglutide) Tablets — Weight Management",
  description:
    "Training for the UK-licensed use of Wegovy tablets (semaglutide 1.5/4/9/25 mg once daily) for chronic weight management. Same molecule as injectable Wegovy with strict empty-stomach administration for reliable absorption.",
  pgdSlugs: ["wegovy-oral"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "Dr Nitin Shori & Chris Pilkington (10 Jul 2026)",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-07-10",
  estimatedMinutes: 15,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Wegovy Tablets — UK-Licensed Weight Management", subtitle: "PGD training for oral semaglutide (Wegovy tablets)", estimatedMinutes: 15, objectives: [
      "Know the licensed indication and the four tablet strengths with the monthly titration ladder.",
      "Apply correct empty-stomach administration rules — the critical absorption requirement.",
      "Recognise drug interactions specific to oral semaglutide (gastric-emptying delay).",
      "Apply contraindications and PGD exclusions, and counsel on red flags including NAION.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Wegovy tablets (semaglutide 1.5 mg, 4 mg, 9 mg and 25 mg) are UK-licensed as an adjunct to a reduced-calorie diet and increased physical activity for weight management in adults with BMI ≥ 30 kg/m², or ≥ 27 to < 30 kg/m² with at least one weight-related comorbidity.",
      "Oral semaglutide is the same molecule as subcutaneous semaglutide (Wegovy injection). It is formulated with SNAC (sodium N-(8-[2-hydroxybenzoyl]amino) caprylate) which transiently raises gastric pH to allow absorption — but this absorption is fragile and highly dependent on dosing technique.",
      "This is a black-triangle medicine under additional monitoring — report all suspected adverse reactions via the MHRA Yellow Card scheme, and record the batch number for traceability.",
      "Patients switching from Wegovy 2.4 mg weekly injection can transition to 25 mg tablets once daily, starting one week after their last injection.",
    ], highlights: ["Take on an empty stomach (≥8 h fast).", "Up to 120 mL plain water only.", "Wait ≥30 minutes before food / drink / other oral meds.", "Maximum ONE tablet per day — never combine tablets."] },
    { id: "administration", type: "callout", title: "Administration — the critical step", tone: "danger", message: "Get this wrong and the drug doesn't work.", detail: [
      "Take on an empty stomach after a fasting period of at least 8 hours.",
      "Take with up to 120 mL of plain water — not coffee, tea, juice, soft drinks.",
      "Wait at least 30 minutes before any food, other drinks, or other oral medications.",
      "Do not split, crush, or chew the tablet.",
      "If a dose is missed, skip it — do not double up; resume the next day.",
      "Levothyroxine: take at least 4 hours apart from oral semaglutide, and recommend thyroid function monitoring.",
    ]},
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "All criteria must be met before supply.", items: [
      { label: "Adult aged 18 or over", detail: "Not established under 18. Limited experience over 85 — supply per PGD age criteria." },
      { label: "BMI ≥30, or BMI ≥27 to <30 with weight-related comorbidity", detail: "T2DM, HTN, dyslipidaemia, OSA, CVD." },
      { label: "Written informed consent to treatment on file", detail: "Documented in the ePGD tool." },
      { label: "Patient is willing/able to follow the strict empty-stomach administration", detail: "If they can't or won't, the drug will fail and they shouldn't start." },
      { label: "No contraindications or PGD exclusions", detail: "Hypersensitivity; pregnancy/breastfeeding; T1DM; pancreatitis history; severe gastroparesis; severe renal (eGFR <30) or hepatic impairment; active eating disorder; diabetic retinopathy; MTC/MEN 2." },
      { label: "No concurrent GLP-1 / GIP receptor agonist", detail: "Do not stack." },
    ]},
    { id: "dose", type: "comparison", title: "Dosing — UK SmPC titration ladder", intro: "Once daily, minimum one month at each step; hold at the previous step if needed for tolerance.", columns: [
      { label: "Titration", rows: [
        { heading: "Month 1", body: "1.5 mg once daily — starting dose." },
        { heading: "Month 2", body: "4 mg once daily." },
        { heading: "Month 3", body: "9 mg once daily." },
      ]},
      { label: "Maintenance", rows: [
        { heading: "Month 4 onward", body: "25 mg once daily — maintenance and maximum dose." },
        { heading: "One tablet rule", body: "Only ever ONE tablet per day; never combine tablets to approximate a higher dose." },
        { heading: "Switching from injection", body: "From Wegovy 2.4 mg weekly: 25 mg tablets once daily, starting one week after the last injection." },
      ]},
    ]},
    { id: "interactions", type: "callout", title: "Key drug interactions", tone: "info", message: "Oral semaglutide delays gastric emptying — affects absorption of co-administered drugs.", detail: [
      "Levothyroxine: thyroxine exposure increases ~33% — separate by ≥4 hours and monitor thyroid function.",
      "Warfarin/coumarins: frequent INR monitoring on initiation.",
      "Sulfonylurea or insulin (in T2DM patients): hypoglycaemia risk; refer prescribing clinician for dose review.",
      "Multiple tablets taken together reduce semaglutide absorption — take other oral medications at least 30 minutes after.",
      "Counsel on dizziness during titration (driving), dehydration with GI side effects, and sudden visual loss (NAION) — stop and refer urgently.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "UK-licensed for weight management: 1.5 → 4 → 9 → 25 mg once daily, one month per step.",
      "Take on an empty stomach (≥8 h fast), 120 mL water max, wait ≥30 minutes.",
      "Maximum 25 mg daily; only one tablet per day.",
      "Levothyroxine ≥4 h apart; INR monitoring with warfarin.",
      "Black-triangle medicine — Yellow Card any suspected reaction; record batch numbers.",
      "Red flags: persistent severe abdominal pain (pancreatitis), sudden visual loss (NAION), dehydration.",
    ]},
  ],
  quiz: [
    { id: "q-licence", type: "single-choice", critical: true, question: "Patient asks whether this tablet is 'actually approved for weight loss'. Best response?", options: [
      { id: "a", label: "It's only for diabetes." }, { id: "b", label: "Yes — Wegovy tablets are UK-licensed for weight management in adults meeting BMI criteria, as an adjunct to diet and physical activity." }, { id: "c", label: "Refuse to discuss." }, { id: "d", label: "Only the injection is licensed." }
    ], correctOptionIds: ["b"], explanation: "Wegovy tablets (1.5/4/9/25 mg) hold UK marketing authorisation for weight management." },
    { id: "q-empty-stomach", type: "single-choice", critical: true, question: "Patient takes the tablet with a cup of tea immediately on waking. Action?", options: [
      { id: "a", label: "No problem." }, { id: "b", label: "Significant problem — tea materially reduces absorption. Re-counsel: take with up to 120 mL plain water only, on an empty stomach after at least 8 hours fasting, then wait ≥30 minutes before anything else." }, { id: "c", label: "Switch product." }, { id: "d", label: "Double dose." }
    ], correctOptionIds: ["b"], explanation: "Liquid other than plain water dramatically reduces absorption." },
    { id: "q-levo", type: "single-choice", critical: true, question: "Patient on levothyroxine asks how to space the doses. Best advice?", options: [
      { id: "a", label: "Take together." }, { id: "b", label: "Take levothyroxine at least 4 hours apart from oral semaglutide, and expect thyroid function monitoring — oral semaglutide increases thyroxine exposure." }, { id: "c", label: "Stop levothyroxine." }, { id: "d", label: "30 min apart." }
    ], correctOptionIds: ["b"], explanation: "Thyroxine AUC increases ~33%; ≥4 h separation plus monitoring is the SmPC position." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient asks for oral semaglutide. Action?", options: [
      { id: "a", label: "Supply 1.5 mg." }, { id: "b", label: "Do not supply — semaglutide should not be used in pregnancy and should be discontinued at least 2 months before a planned pregnancy. Refer." }, { id: "c", label: "Supply with low dose." }, { id: "d", label: "Switch to injection." }
    ], correctOptionIds: ["b"], explanation: "No use in pregnancy; 2-month washout before planned conception due to the long half-life." },
    { id: "q-titration", type: "single-choice", question: "Standard titration for Wegovy tablets?", options: [
      { id: "a", label: "Straight to 25 mg." }, { id: "b", label: "1.5 mg × 1 month → 4 mg × 1 month → 9 mg × 1 month → 25 mg maintenance; hold at the previous step if needed." }, { id: "c", label: "Two 9 mg tablets to make 18 mg." }, { id: "d", label: "PRN dosing." }
    ], correctOptionIds: ["b"], explanation: "Monthly escalation to the 25 mg maintenance dose; never combine tablets." },
    { id: "q-record", type: "single-choice", question: "Documentation must include?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Eligibility check, BMI, written informed consent, contraindication screen, interaction screen, dose chosen with rationale, empty-stomach counselling, batch number, follow-up plan — in the ePGD tool." }, { id: "c", label: "GP letter only." }, { id: "d", label: "Free-text only." }
    ], correctOptionIds: ["b"], explanation: "The ePGD tool captures the complete auditable record, including batch traceability for this black-triangle medicine." },
  ],
};
