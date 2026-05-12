// Hypertension management — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const hypertensionModule: TrainingModule = {
  slug: "hypertension",
  title: "Hypertension Treatment Initiation — PGD",
  description: "Initiation of antihypertensive therapy (ACE-i / ARB / CCB) for confirmed hypertension under PGD.",
  pgdSlugs: ["hypertension"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 15,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Hypertension — Training", subtitle: "Treatment initiation under PGD per NICE NG136 stepped care", estimatedMinutes: 15, objectives: [
      "Apply NICE NG136 stepped care to choose appropriate first-line antihypertensive.",
      "Recognise the absolute contraindications and red flags (severe / accelerated hypertension).",
      "Counsel on lifestyle, monitoring schedule, and adherence.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Hypertension is a leading modifiable cardiovascular risk factor. Diagnosis requires confirmation by ambulatory or home BP monitoring (ABPM/HBPM) after a screening clinic reading ≥140/90. Treatment threshold and target depend on age, comorbidities, and CV risk.",
      "NICE NG136 stepped care (2019, updated 2022): Step 1 = ACE-i/ARB (under 55 / type 2 diabetes) OR CCB (≥55 or African/Caribbean). Step 2 = add the other. Step 3 = add thiazide-like diuretic. Step 4 = specialist input.",
      "The PGD covers initiation at Step 1 for confirmed Stage 1 or 2 hypertension in eligible patients. Severe / accelerated, secondary causes, multiple comorbidities — refer.",
    ], highlights: ["Diagnosis = ABPM/HBPM, not single clinic reading.", "Step 1: ACE-i/ARB if <55 or T2DM. CCB if ≥55 or Afro-Caribbean.", "Severe/accelerated hypertension is a medical emergency — A&E."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 18–80", detail: ">80 — refer GP for individualised approach." },
      { label: "Confirmed hypertension on ABPM or HBPM", detail: "Mean daytime BP ≥135/85 (Stage 1) or ≥150/95 (Stage 2). Single clinic readings alone insufficient — confirm by ABPM/HBPM first." },
      { label: "No urgent referral criteria (next slide)", detail: "Severe hypertension or accelerated = emergency." },
      { label: "No secondary cause suspected", detail: "Sudden onset, severe, refractory, or features of phaeochromocytoma / Conn's / renal artery stenosis — refer." },
      { label: "Pregnancy excluded", detail: "Hypertension in pregnancy needs obstetric input." },
      { label: "QRISK ≥10% OR Stage 2 confirmed OR target-organ damage", detail: "Treatment indicated. Stage 1 without these — lifestyle first." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer urgently", tone: "danger", message: "These need same-day or urgent assessment.", detail: [
      "Clinic BP ≥180/120 with symptoms (chest pain, breathlessness, headache, visual changes, focal neurology) — A&E.",
      "Clinic BP ≥180/120 without symptoms — same-day GP review for accelerated hypertension assessment.",
      "Suspected secondary hypertension — refer GP.",
      "Pregnancy — refer to obstetric / GP.",
      "Chronic kidney disease stage 4–5 — refer.",
      "Existing complex hypertension or already on antihypertensives — refer GP for review.",
      "Suspected target-organ damage (renal impairment, LVH, retinopathy, proteinuria) — refer.",
      "Postural hypotension symptoms — older patients, refer.",
    ]},
    { id: "stepwise", type: "comparison", title: "Step 1 — first-line choice", intro: "Choose based on age and ethnicity per NICE.", columns: [
      { label: "Patient <55 (not Afro-Caribbean) OR Type 2 diabetes any age", rows: [
        { heading: "First-line", body: "ACE inhibitor — e.g. ramipril 2.5 mg OD, titrating up; or lisinopril 10 mg OD." },
        { heading: "Alternative if cough", body: "ARB — e.g. losartan 50 mg OD or candesartan 4 mg OD. Switch ACE-i to ARB if patient develops dry cough on ACE-i." },
        { heading: "Monitoring", body: "U&Es and eGFR before, at 1–2 weeks, and 4–6 weeks. Allow up to 30% creatinine rise; investigate if more." },
      ]},
      { label: "Patient ≥55 OR Afro-Caribbean any age (without T2DM)", rows: [
        { heading: "First-line", body: "Calcium channel blocker — amlodipine 5 mg OD." },
        { heading: "Alternative if oedema", body: "Thiazide-like diuretic — indapamide 2.5 mg OD." },
        { heading: "Monitoring", body: "BP review at 4–6 weeks. Check for ankle oedema (CCB), electrolytes if thiazide." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Lifestyle is foundational", detail: "Salt <6g/day, alcohol within limits, regular aerobic exercise, weight loss if overweight, DASH-style diet. Smoking cessation if applicable." },
      { label: "Adherence", detail: "BP medication is for life in most cases. Once-daily dosing helps. Encourage habit-stacking (same time as breakfast / teeth-brushing)." },
      { label: "Expected effect", detail: "Most BP drugs take 2–4 weeks to reach full effect. Don't expect overnight." },
      { label: "Common side effects", detail: "ACE-i: dry cough (~10%), dizziness, hyperkalaemia. ARB: similar without cough. CCB: ankle swelling, headache, flushing. Thiazide: dehydration, gout, electrolyte disturbance." },
      { label: "Home BP monitoring", detail: "Encourage HBPM with validated cuff. Twice daily morning and evening for 4–7 days for review readings." },
      { label: "Annual review", detail: "BP, bloods (U&E, lipids), CV risk reassessment. Coordinate with GP." },
      { label: "Don't stop abruptly", detail: "Especially in older patients — risk of rebound." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — refer urgently", tone: "danger", message: "These need medical assessment.", detail: [
      "BP ≥180/120 with symptoms — A&E.",
      "BP ≥180/120 without symptoms — same-day GP.",
      "Postural drop ≥20 mmHg with symptoms — falls risk, refer.",
      "New chest pain, breathlessness — exclude cardiac.",
      "ACE-i induced angioedema — stop immediately, A&E.",
      "Significant creatinine rise (>30%) after initiation — review and likely stop.",
      "Severe hyperkalaemia (K+ ≥6).",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Diagnose by ABPM/HBPM, not single clinic reading.",
      "Step 1: <55 / T2DM → ACE-i (or ARB). ≥55 / Afro-Caribbean → CCB.",
      "Bloods before and 1–2 weeks after starting ACE-i/ARB.",
      "BP ≥180/120 = urgent referral.",
      "Lifestyle alongside drug therapy.",
      "GP coordination mandatory — annual review.",
    ]},
  ],
  quiz: [
    { id: "q-emergency", type: "single-choice", critical: true, question: "Patient's clinic BP today is 196/118. He has a severe headache and blurred vision. Action?", options: [
      { id: "a", label: "Start amlodipine." }, { id: "b", label: "Call 999 / refer A&E urgently — accelerated hypertension with end-organ symptoms is an emergency." }, { id: "c", label: "Start ramipril." }, { id: "d", label: "Recheck tomorrow." }
    ], correctOptionIds: ["b"], explanation: "BP ≥180/120 with symptoms = accelerated/hypertensive emergency. Needs immediate hospital assessment." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "20-week pregnant woman with home BP 148/92. Action?", options: [
      { id: "a", label: "Start ramipril." }, { id: "b", label: "Refer to GP/midwife / obstetric urgent assessment. Pregnancy hypertension has specific management (labetalol, nifedipine, methyldopa) and pre-eclampsia must be excluded." }, { id: "c", label: "Start amlodipine." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Hypertension in pregnancy is obstetric territory. ACE-i / ARB are contraindicated. Refer urgently." },
    { id: "q-age-55", type: "single-choice", critical: true, question: "62-year-old Caucasian, no diabetes, confirmed Stage 1 hypertension on HBPM, QRISK 18%. First-line?", options: [
      { id: "a", label: "Ramipril 2.5 mg OD (ACE-i)." }, { id: "b", label: "Amlodipine 5 mg OD (CCB) — ≥55 without T2DM, NICE step 1 is CCB." }, { id: "c", label: "Losartan." }, { id: "d", label: "Bendroflumethiazide." }
    ], correctOptionIds: ["b"], explanation: "NICE NG136 step 1 for ≥55 (without T2DM) is CCB. ACE-i/ARB is first-line for <55 or with T2DM. Don't mix up the order." },
    { id: "q-diabetes", type: "single-choice", critical: true, question: "60-year-old with type 2 diabetes and confirmed hypertension. First-line?", options: [
      { id: "a", label: "Amlodipine." }, { id: "b", label: "ACE-i (e.g. ramipril) — T2DM at any age uses ACE-i/ARB first-line regardless of age." }, { id: "c", label: "Thiazide." }, { id: "d", label: "Beta-blocker." }
    ], correctOptionIds: ["b"], explanation: "T2DM is an override: ACE-i/ARB first-line at any age, because of renoprotective effect." },
    { id: "q-abpm", type: "single-choice", critical: true, question: "Patient has clinic BP 145/92 today, never had it before. He says it's a one-off, anxious about pharmacy visits. Action?", options: [
      { id: "a", label: "Start ramipril." }, { id: "b", label: "Confirm diagnosis with ABPM or HBPM before initiating treatment. Single clinic reading isn't sufficient — could be white-coat hypertension." }, { id: "c", label: "Repeat in pharmacy." }, { id: "d", label: "Refer immediately." }
    ], correctOptionIds: ["b"], explanation: "NICE NG136 mandates ABPM or HBPM to confirm before treatment, to avoid treating white-coat hypertension." },
    { id: "q-cough", type: "single-choice", question: "Patient on ramipril 5 mg has developed a persistent dry cough at week 6. Action?", options: [
      { id: "a", label: "Continue ramipril; cough will settle." }, { id: "b", label: "Switch to an ARB (e.g. losartan 50 mg OD) — ACE-i cough is bradykinin-mediated and persistent. ARBs don't cause this." }, { id: "c", label: "Add an antitussive." }, { id: "d", label: "Stop antihypertensive." }
    ], correctOptionIds: ["b"], explanation: "ACE-i cough is the commonest reason for switching to ARB. Doesn't settle with time. Same step on the NICE algorithm." },
    { id: "q-bloods", type: "single-choice", question: "When should bloods be checked after starting an ACE-i?", options: [
      { id: "a", label: "Once a year." }, { id: "b", label: "Before starting, then 1–2 weeks after starting / dose increase. Allow up to 30% creatinine rise; investigate larger rises." }, { id: "c", label: "Only if symptoms occur." }, { id: "d", label: "Every 3 months." }
    ], correctOptionIds: ["b"], explanation: "Bloods before and 1–2 weeks after ACE-i initiation/increase. Renal artery stenosis can manifest as significant creatinine rise — important to catch." },
    { id: "q-amlodipine", type: "single-choice", question: "Patient on amlodipine 5 mg complains of significant ankle swelling. Action?", options: [
      { id: "a", label: "Stop antihypertensive entirely." }, { id: "b", label: "Common side effect of CCBs. Counsel; if intolerable, switch to thiazide-like diuretic (indapamide) or ARB at next review. Don't add diuretic just to control oedema." }, { id: "c", label: "Add a diuretic." }, { id: "d", label: "Increase amlodipine to 10 mg." }
    ], correctOptionIds: ["b"], explanation: "Ankle oedema is a recognised CCB side effect (vasodilation, not fluid overload). Switch agent rather than add a diuretic for symptom control." },
    { id: "q-angioedema", type: "single-choice", question: "Patient on ramipril 2 weeks reports lip and tongue swelling. Action?", options: [
      { id: "a", label: "Reduce dose." }, { id: "b", label: "Stop ramipril immediately, refer to A&E. ACE-i angioedema can be life-threatening; switch to non-ACE/ARB after specialist review (ARBs less risky but not zero-risk in past ACE angioedema)." }, { id: "c", label: "Add antihistamine." }, { id: "d", label: "Continue and watch." }
    ], correctOptionIds: ["b"], explanation: "ACE-i angioedema is rare but emergency. Stop and A&E. Future ACE-i contraindicated; ARB with caution if needed." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "ABPM/HBPM confirmatory readings, QRISK score, comorbidities, agent chosen with rationale (per NICE step 1), baseline bloods, counselling — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Hypertension initiation requires the confirmatory diagnosis (ABPM/HBPM), QRISK, and NICE-stepped rationale documented. Audit-critical." },
  ],
};
