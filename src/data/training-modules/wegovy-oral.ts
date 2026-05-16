// Oral semaglutide for weight management — OFF-LABEL pilot training
//
// RESTRICTED: this module backs a restricted-access PGD. The training
// page and module pages must hide it from users not on the allowlist.
// See pgds.ts → wegovy-oral.restrictedToEmails.

import type { TrainingModule } from "./types";

export const wegovyOralModule: TrainingModule = {
  slug: "wegovy-oral",
  title: "Oral Semaglutide for Weight Management (Off-label PILOT)",
  description: "Restricted-access pilot training for the off-label use of oral semaglutide (Rybelsus 14 mg, or Wegovy oral 25/50 mg) for weight management.",
  pgdSlugs: ["wegovy-oral"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — clinical-lead pilot, not yet released",
  version: "0.1.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-13",
  estimatedMinutes: 15,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Oral Semaglutide — Off-label Pilot", subtitle: "Restricted-access PGD training for clinical-lead pilot use", estimatedMinutes: 15, objectives: [
      "Understand the off-label status of oral semaglutide for weight management and document informed consent.",
      "Apply correct empty-stomach administration rules — the critical absorption requirement.",
      "Recognise drug interactions specific to oral semaglutide (gastric-emptying delay).",
      "Apply contraindications consistent with subcutaneous semaglutide plus oral-route-specific cautions.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Oral semaglutide (Rybelsus) is licensed in the UK for type 2 diabetes mellitus only — 3 mg, 7 mg, and 14 mg once daily strengths. Higher doses (25 mg, 50 mg) marketed as Wegovy oral are licensed for weight management in some jurisdictions (e.g. US 2024) but UK MHRA status should be re-checked at the point of supply.",
      "Where the higher-dose Wegovy oral product is not licensed in the UK, off-label use of Rybelsus 14 mg for weight management can be considered with explicit written informed consent.",
      "Oral semaglutide is the same molecule as subcutaneous semaglutide (Ozempic/Wegovy). It is formulated with SNAC (sodium N-(8-[2-hydroxybenzoyl]amino) caprylate) which transiently raises gastric pH to allow absorption — but this absorption is fragile and highly dependent on dosing technique.",
      "This is a pilot PGD restricted to allowlisted clinical leads. Do not roll out to partner pharmacies without explicit clinical-governance sign-off.",
    ], highlights: ["Take empty-stomach in the morning.", "Up to 120 mL plain water only.", "Wait ≥30 minutes before food / drink / other oral meds.", "OFF-LABEL — written informed consent essential."] },
    { id: "administration", type: "callout", title: "Administration — the critical step", tone: "danger", message: "Get this wrong and the drug doesn't work.", detail: [
      "Take in the morning, fasted (i.e. no food or drink for the preceding period).",
      "Take with up to 120 mL of plain water — not coffee, tea, juice, soft drinks.",
      "Wait at least 30 minutes before any food, other drinks, or other oral medications.",
      "Do not split, crush, or chew the tablet.",
      "If a dose is missed, skip it — do not double up; resume the next day.",
      "Levothyroxine: take at least 4 hours apart from oral semaglutide — significant absorption interaction.",
    ]},
    { id: "eligibility", type: "checklist", title: "Eligibility (pilot)", intro: "All criteria must be met. Pilot restricted to selected patients of allowlisted clinical leads.", items: [
      { label: "Adult aged 18–75", detail: "Outside range: refer specialist." },
      { label: "BMI ≥30, or BMI ≥27 with weight-related comorbidity", detail: "T2DM, HTN, dyslipidaemia, OSA, CVD." },
      { label: "Patient understands and consents in writing to off-label use", detail: "Documented written consent on file — non-negotiable." },
      { label: "Patient is willing/able to follow the strict empty-stomach administration", detail: "If they can't or won't, the drug will fail and they shouldn't start." },
      { label: "No contraindications to GLP-1 receptor agonists", detail: "MTC/MEN 2, pancreatitis history, severe gastroparesis, type 1 diabetes, etc." },
      { label: "No concurrent GLP-1 / GIP receptor agonist", detail: "Do not stack." },
    ]},
    { id: "dose", type: "comparison", title: "Dose options", intro: "Choose the appropriate strength based on titration stage or product availability.", columns: [
      { label: "Rybelsus titration", rows: [
        { heading: "Weeks 1–4", body: "3 mg once daily — tolerance step (does not give therapeutic effect)." },
        { heading: "Weeks 5–8", body: "7 mg once daily — titration to therapeutic dose." },
        { heading: "Week 9+", body: "14 mg once daily — maintenance (off-label for weight management)." },
      ]},
      { label: "Wegovy oral (where licensed)", rows: [
        { heading: "Starting", body: "Begin at lowest available step, titrate per SmPC." },
        { heading: "Maintenance", body: "25 mg or 50 mg once daily as appropriate." },
        { heading: "UK status", body: "Re-verify MHRA approval at point of supply; treat as off-label unless explicitly licensed." },
      ]},
    ]},
    { id: "interactions", type: "callout", title: "Key drug interactions", tone: "info", message: "Oral semaglutide delays gastric emptying — affects absorption of co-administered drugs.", detail: [
      "Levothyroxine: significant absorption reduction — separate by ≥4 hours.",
      "Warfarin: INR monitoring needed.",
      "Sulfonylurea or insulin (in T2DM patients): hypoglycaemia risk; refer prescribing clinician.",
      "Oral contraception: GI symptoms may reduce absorption — counsel barrier method for 7 days after vomiting/severe diarrhoea.",
      "Other oral medications: in general, take at least 30 minutes after the oral semaglutide.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Off-label for weight management — written informed consent mandatory.",
      "Take empty-stomach AM, 120 mL water max, wait ≥30 minutes.",
      "Rybelsus titration: 3 mg → 7 mg → 14 mg (4 weeks each).",
      "Levothyroxine ≥4 h apart.",
      "Contraindications and red flags as per subcutaneous semaglutide.",
      "Pilot restricted to allowlisted clinical leads — do not roll out.",
    ]},
  ],
  quiz: [
    { id: "q-offlabel", type: "single-choice", critical: true, question: "Patient asks why this product 'isn't on the leaflet for weight loss'. Best response?", options: [
      { id: "a", label: "It is licensed for that." }, { id: "b", label: "Explain off-label status — Rybelsus is licensed for type 2 diabetes; its use for weight management is off-label and supported by evidence. Document informed written consent." }, { id: "c", label: "Refuse to discuss." }, { id: "d", label: "Switch to injection." }
    ], correctOptionIds: ["b"], explanation: "Off-label disclosure and written consent are non-negotiable." },
    { id: "q-empty-stomach", type: "single-choice", critical: true, question: "Patient takes the tablet with a cup of tea immediately on waking. Action?", options: [
      { id: "a", label: "No problem." }, { id: "b", label: "Significant problem — tea materially reduces absorption. Re-counsel: take with up to 120 mL plain water only, on an empty stomach, then wait ≥30 minutes before anything else." }, { id: "c", label: "Switch product." }, { id: "d", label: "Double dose." }
    ], correctOptionIds: ["b"], explanation: "Liquid other than plain water dramatically reduces absorption." },
    { id: "q-levo", type: "single-choice", critical: true, question: "Patient on levothyroxine asks how to space the doses. Best advice?", options: [
      { id: "a", label: "Take together." }, { id: "b", label: "Take levothyroxine at least 4 hours apart from oral semaglutide — oral semaglutide significantly delays levothyroxine absorption." }, { id: "c", label: "Stop levothyroxine." }, { id: "d", label: "30 min apart." }
    ], correctOptionIds: ["b"], explanation: "Oral semaglutide significantly delays levothyroxine absorption — ≥4 h separation is the standard SmPC advice." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient asks for oral semaglutide. Action?", options: [
      { id: "a", label: "Supply 3 mg." }, { id: "b", label: "Contraindicated — discontinue ≥2 months before planned conception. Refer specialist for postpartum review." }, { id: "c", label: "Supply with low dose." }, { id: "d", label: "Switch to injection." }
    ], correctOptionIds: ["b"], explanation: "Semaglutide is contraindicated in pregnancy and 2-month washout pre-conception is standard." },
    { id: "q-titration", type: "single-choice", question: "Standard Rybelsus titration to therapeutic dose for weight management?", options: [
      { id: "a", label: "Straight to 14 mg." }, { id: "b", label: "3 mg × 4 weeks → 7 mg × 4 weeks → 14 mg maintenance." }, { id: "c", label: "1 mg increments weekly." }, { id: "d", label: "PRN dosing." }
    ], correctOptionIds: ["b"], explanation: "Per Rybelsus SmPC titration schedule — applied off-label for weight management." },
    { id: "q-record", type: "single-choice", question: "Documentation must include?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Eligibility check, BMI, off-label informed written consent, contraindication screen, interaction screen, dose chosen with rationale, counselling on empty-stomach administration, follow-up plan — in the ePGD tool." }, { id: "c", label: "GP letter only." }, { id: "d", label: "Free-text only." }
    ], correctOptionIds: ["b"], explanation: "Off-label pilot demands robust documentation; ePGD tool captures all of it." },
  ],
};
