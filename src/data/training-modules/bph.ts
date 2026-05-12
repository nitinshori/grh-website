// BPH (benign prostatic hyperplasia) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const bphModule: TrainingModule = {
  slug: "bph",
  title: "Benign Prostatic Hyperplasia (BPH) — PGD",
  description: "Supply of tamsulosin or finasteride for symptomatic BPH in adult men under PGD.",
  pgdSlugs: ["bph"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "BPH — Training", subtitle: "Tamsulosin / finasteride for lower urinary tract symptoms in BPH", estimatedMinutes: 12, objectives: [
      "Identify men eligible for BPH PGD treatment using IPSS and clinical criteria.",
      "Choose between alpha-blocker (tamsulosin) and 5-alpha-reductase inhibitor (finasteride) based on prostate size and symptom pattern.",
      "Recognise red flags requiring referral (retention, haematuria, raised PSA).",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Benign prostatic hyperplasia causes lower urinary tract symptoms (LUTS) — storage (frequency, urgency, nocturia) and voiding (hesitancy, weak stream, intermittency, terminal dribble). Affects most men by 70.",
      "First-line: lifestyle. Pharmacotherapy options: alpha-blocker (tamsulosin — symptomatic, fast) for moderate-severe symptoms; 5-alpha-reductase inhibitor (finasteride — shrinks prostate over months) for larger glands. Combination for both.",
      "Always exclude prostate cancer / chronic retention / infection before starting drug therapy.",
    ], highlights: ["Tamsulosin works in days; finasteride takes 3–6 months.", "Always check PSA before initiation.", "Acute urinary retention = A&E; not a PGD scenario."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult male, 50–80", detail: "Outside this range refer. <50 = unusual presentation; >80 = often complex." },
      { label: "Diagnosis of BPH or strong clinical suspicion", detail: "Symptoms consistent (LUTS), GP awareness, prior DRE." },
      { label: "IPSS ≥8 (moderate symptoms)", detail: "Mild symptoms (<8) typically lifestyle. Severe (≥20) may need specialist." },
      { label: "PSA within 6 months and acceptable", detail: "Age-adjusted normal. Anything elevated = urology referral before PGD treatment." },
      { label: "DRE done within 12 months", detail: "By GP. No nodules. Smoothly enlarged consistent with BPH." },
      { label: "No red flags (next slide)", detail: "Retention, haematuria, suprapubic mass — refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "These require referral, not PGD supply.", detail: [
      "Acute urinary retention — A&E.",
      "Visible haematuria — urgent urology (2-week-wait if 60+).",
      "Raised PSA — urology referral.",
      "Suspected prostate cancer (hard nodular DRE) — refer urgently.",
      "Recurrent UTI in male — urology workup.",
      "Significant orthostatic hypotension symptoms — caution with alpha-blocker.",
      "Severe hepatic impairment.",
      "Severe renal impairment (eGFR <30) — review.",
      "Concurrent strong CYP3A4 inhibitors with tamsulosin.",
      "Already on alpha-blocker for hypertension — refer for coordinated review.",
    ]},
    { id: "options", type: "comparison", title: "Treatment options", intro: "Match drug to symptom and prostate-size profile.", columns: [
      { label: "Tamsulosin 400 mcg MR once daily", rows: [
        { heading: "Mechanism", body: "Alpha-1A blocker — relaxes prostate smooth muscle. Fast symptom relief." },
        { heading: "Time to effect", body: "Days to weeks." },
        { heading: "Side effects", body: "Postural hypotension, dizziness, fatigue, abnormal ejaculation (retrograde), nasal congestion. Floppy iris syndrome — counsel any future cataract surgery." },
        { heading: "Useful for", body: "Symptomatic relief regardless of prostate size." },
      ]},
      { label: "Finasteride 5 mg once daily", rows: [
        { heading: "Mechanism", body: "5-alpha-reductase inhibitor — reduces DHT, shrinks prostate over months." },
        { heading: "Time to effect", body: "3–6 months for symptomatic improvement; up to 12 months for full effect." },
        { heading: "Side effects", body: "Reduced libido (~3%), ED (~3%), reduced ejaculate volume, gynaecomastia (rare). Halves PSA — counsel for any prostate screening." },
        { heading: "Useful for", body: "Larger prostates (>40 mL on imaging if known); long-term modification." },
      ]},
      { label: "Combination", rows: [
        { heading: "When", body: "Moderate-severe symptoms with enlarged prostate. Faster relief from alpha-blocker + long-term reduction from 5-ARI." },
        { heading: "Approach", body: "Initiate both simultaneously. Consider stepping down alpha-blocker after 6–12 months if symptoms controlled by finasteride alone." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Lifestyle", detail: "Limit fluid intake in evening to reduce nocturia. Reduce caffeine and alcohol (irritants). Bladder retraining (double void, scheduled toileting)." },
      { label: "First-dose effect (tamsulosin)", detail: "Postural hypotension risk — take first dose at home, in evening, while sitting/lying nearby. Get up slowly for the next few days." },
      { label: "Tamsulosin specific", detail: "Don't stop suddenly — gradual taper if discontinuing. Floppy iris syndrome: tell any eye surgeon you're on tamsulosin BEFORE cataract surgery." },
      { label: "Finasteride specific", detail: "PSA effect — halves measured PSA; inform any clinician doing PSA. Sexual side effects in ~3–5%, usually reversible. Pregnant women must not handle broken tablets." },
      { label: "Expected response timeline", detail: "Tamsulosin: improvement within 1–2 weeks. Finasteride: minimum 3 months, full effect 6–12 months." },
      { label: "Review", detail: "IPSS reassessment at 6–8 weeks (tamsulosin) or 3–6 months (finasteride). Adjust based on response." },
      { label: "When to seek urgent help", detail: "Inability to pass urine, severe pain, fever with urinary symptoms, visible blood — A&E." },
    ]},
    { id: "red-flags", type: "callout", title: "Red flags — refer", tone: "danger", message: "Refer urgently or to urology.", detail: [
      "Acute urinary retention — A&E.",
      "Chronic retention with palpable bladder — refer urology.",
      "Visible haematuria — 2-week-wait urology.",
      "Raised PSA on review — urology.",
      "Rising PSA on therapy (especially >1 ng/mL rise from finasteride-adjusted nadir) — urology.",
      "New severe LUTS or rapid progression — urology.",
      "Significant postural hypotension with falls.",
      "ED de novo on finasteride that doesn't resolve with reassurance.",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — combination candidate", scenario: "Robert, 68, IPSS 18 (moderate-severe). DRE 3 months ago by GP: smoothly enlarged, no nodules. PSA 2.8 (normal age-adjusted). Symptoms: nocturia x3, weak stream, hesitancy, frequency. BP 138/84.",
      question: "Treatment?", answer: "Combination: tamsulosin 400 mcg MR once daily PLUS finasteride 5 mg once daily. Counsel on first-dose effect of tamsulosin, finasteride PSA effect for future screening, sexual side effects, slow effect (3–6 months) of finasteride. Review at 8 weeks for symptom response.",
      rationale: "Moderate-severe IPSS + enlarged prostate = combination approach. Tamsulosin gives fast relief while finasteride works slowly." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Eligibility: 50–80 men with confirmed BPH, IPSS ≥8, PSA acceptable, DRE done.",
      "Tamsulosin = fast symptomatic relief. Finasteride = slow shrinkage, 3–6 months.",
      "Combination for moderate-severe + enlarged prostate.",
      "Refer: retention, haematuria, raised PSA, suspected cancer.",
      "Counsel: first-dose effect, floppy iris (tamsulosin); halved PSA, sexual side effects, teratogenicity (finasteride).",
    ]},
  ],
  quiz: [
    { id: "q-retention", type: "single-choice", critical: true, question: "Patient hasn't passed urine for 12 hours, has severe suprapubic pain. Action?", options: [
      { id: "a", label: "Supply tamsulosin." }, { id: "b", label: "999 / A&E — acute urinary retention is a urological emergency needing catheterisation." }, { id: "c", label: "Finasteride." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Acute retention is an emergency — bladder catheterisation needed urgently. Tamsulosin can be added after catheterisation but isn't the immediate management." },
    { id: "q-haematuria", type: "single-choice", critical: true, question: "Patient with BPH symptoms also reports visible blood in urine. Action?", options: [
      { id: "a", label: "Supply tamsulosin." }, { id: "b", label: "Refer to urology 2-week-wait — visible haematuria in older men requires urgent cancer assessment before treating LUTS." }, { id: "c", label: "Finasteride." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Visible haematuria requires urgent urology referral to exclude bladder/prostate cancer. Don't treat LUTS until that's done." },
    { id: "q-psa", type: "single-choice", critical: true, question: "Patient's PSA is 6.2 (age 65). Action?", options: [
      { id: "a", label: "Supply finasteride." }, { id: "b", label: "Refer urology before any drug initiation. Raised PSA requires malignancy workup; treating with finasteride would halve PSA and obscure interpretation." }, { id: "c", label: "Supply tamsulosin." }, { id: "d", label: "Repeat in 3 months." }
    ], correctOptionIds: ["b"], explanation: "Raised PSA = urology referral before any drug. Finasteride will halve PSA and mask cancer." },
    { id: "q-finasteride-women", type: "single-choice", critical: true, question: "Patient asks about household precautions for finasteride if his pregnant wife handles his medication.", options: [
      { id: "a", label: "Whole tablets are safe; broken tablets must not be handled by pregnant women due to teratogenic risk (male foetal genital malformation)." }, { id: "b", label: "No precautions needed." }, { id: "c", label: "She must avoid him entirely." }, { id: "d", label: "Switch to tamsulosin only." }
    ], correctOptionIds: ["a"], explanation: "Finasteride is teratogenic to male foetuses. Whole tablets have minimal absorption through skin; broken/crushed tablets are the risk." },
    { id: "q-floppy-iris", type: "single-choice", question: "Patient on tamsulosin has cataract surgery scheduled. Counselling?", options: [
      { id: "a", label: "Stop tamsulosin a week before." }, { id: "b", label: "Tell the eye surgeon BEFORE surgery that he's on tamsulosin. Risk of 'intraoperative floppy iris syndrome' — surgeon can plan technique. Stopping tamsulosin doesn't fully prevent it." }, { id: "c", label: "Stop tamsulosin 6 months before." }, { id: "d", label: "No action needed." }
    ], correctOptionIds: ["b"], explanation: "IFIS is a known complication that the eye surgeon must know about. Stopping the drug pre-op doesn't eliminate the risk; surgeon technique adjustment is what matters." },
    { id: "q-time-to-effect", type: "single-choice", question: "Patient on finasteride 4 weeks reports no symptom improvement. Action?", options: [
      { id: "a", label: "Stop." }, { id: "b", label: "Counsel persistence. Finasteride takes 3–6 months for noticeable improvement; full effect 6–12 months." }, { id: "c", label: "Double the dose." }, { id: "d", label: "Switch to tamsulosin." }
    ], correctOptionIds: ["b"], explanation: "Finasteride is slow-acting. Counsel pre-emptively to prevent premature discontinuation." },
    { id: "q-postural", type: "single-choice", question: "Patient on tamsulosin 2 weeks reports significant dizziness on standing, near-faint episode this morning. Action?", options: [
      { id: "a", label: "Continue and observe." }, { id: "b", label: "Hold dose, refer to GP. Severe orthostatic effect may need dose reduction, alternative agent, or BP review (e.g. if also on antihypertensives)." }, { id: "c", label: "Double dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Significant postural symptoms warrant review and possibly stopping. Fall risk in older men is meaningful." },
    { id: "q-psa-halved", type: "single-choice", question: "Patient has been on finasteride for 18 months. His GP requests a PSA. What should he tell the GP?", options: [
      { id: "a", label: "Nothing — PSA is unaffected by finasteride." }, { id: "b", label: "Tell the GP he's on finasteride — it halves measured PSA. The GP will interpret the result with this in mind (effectively doubling for comparison to age-adjusted normal)." }, { id: "c", label: "Stop finasteride before the test." }, { id: "d", label: "PSA is unreliable on finasteride." }
    ], correctOptionIds: ["b"], explanation: "Finasteride approximately halves PSA. Without this information, a 'normal' PSA may obscure significant cancer." },
    { id: "q-combination", type: "single-choice", question: "When is combination tamsulosin + finasteride preferred?", options: [
      { id: "a", label: "All BPH patients." }, { id: "b", label: "Moderate-to-severe IPSS with enlarged prostate. Provides fast symptomatic relief (tamsulosin) plus long-term prostate shrinkage (finasteride). Single-agent fine for milder presentations." }, { id: "c", label: "Mild symptoms only." }, { id: "d", label: "Only if PSA elevated." }
    ], correctOptionIds: ["b"], explanation: "Combination is for moderate-severe + enlarged. The MTOPS trial showed superior outcomes with combination in this group." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "IPSS, DRE status, PSA result with date, exclusion of red flags, agent chosen with rationale, counselling — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates IPSS, DRE, and PSA baseline screening were all done before treatment initiation." },
  ],
};
