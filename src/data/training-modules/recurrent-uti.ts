// Recurrent UTI — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const recurrentUtiModule: TrainingModule = {
  slug: "recurrent-uti",
  title: "Recurrent UTI — PGD",
  description: "Supply of standby antibiotic for established recurrent UTI in non-pregnant women under PGD.",
  pgdSlugs: ["recurrent-uti"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Recurrent UTI — Training", subtitle: "Self-start standby antibiotics for established recurrent UTI", estimatedMinutes: 12, objectives: [
      "Differentiate recurrent UTI patients suitable for standby supply vs needing further workup.",
      "Apply self-start antibiotic supply protocols safely.",
      "Counsel on prevention measures and when to refer back to GP.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Recurrent UTI = ≥3 episodes in 12 months or ≥2 in 6 months. Affects ~20% of women with one UTI. Mechanism: ascending E. coli predominantly; risk factors include sexual activity, spermicide use, post-menopausal atrophic changes, anatomical abnormality, immune issues.",
      "Management options: behavioural / lifestyle measures, post-coital prophylaxis, low-dose daily prophylaxis, methenamine, vaginal oestrogen (post-menopausal), self-start standby antibiotics for breakthrough episodes.",
      "Standby supply (this PGD) is for established recurrent UTI patients with a known infection pattern, already discussed with GP and where typical symptoms can be self-recognised reliably.",
    ], highlights: ["≥3 UTIs in 12 months or ≥2 in 6 months = recurrent.", "Standby antibiotic = patient has a documented pattern and self-recognises.", "First-presentation UTI = standard UTI PGD, not this one."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult female, 16–65", detail: "Outside this range refer." },
      { label: "Established recurrent UTI on GP record", detail: "≥3 episodes/12 months or ≥2/6 months. GP-aware and concurrent with longer-term strategy (prevention measures, vaginal oestrogen if post-menopausal, methenamine, etc.)." },
      { label: "Documented agent susceptibility from previous urine cultures", detail: "Knowing E. coli sensitivities locally helps guide antibiotic choice — nitrofurantoin or trimethoprim per most-recent culture." },
      { label: "Current symptoms classic for cystitis", detail: "Dysuria, urgency, frequency, suprapubic discomfort. <7 days." },
      { label: "Not pregnant or breastfeeding", detail: "Refer GP/midwife." },
      { label: "No upper-tract or red-flag features", detail: "Fever, flank pain, vomiting, frank haematuria, severe pain — refer." },
      { label: "Not in middle of recurrent UTI workup", detail: "If imaging / urology workup ongoing, defer to GP-led management." },
      { label: "No catheter or known structural abnormality", detail: "Complicated UTI — refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer for these.", detail: [
      "Pregnancy.",
      "First-time UTI (use standard UTI PGD).",
      "Fever, flank pain, vomiting — upper-tract.",
      "Visible haematuria.",
      "Pelvic pain unrelated to UTI.",
      "Recent failure of antibiotic course — suggests resistance.",
      "≥4 episodes per year despite prophylaxis — needs urology workup.",
      "Suspected urological abnormality (recurrent in young woman, history of stones, sudden change in pattern).",
      "Severe renal impairment (specific drug considerations).",
      "Allergy to chosen antibiotic with no documented alternative.",
    ]},
    { id: "antibiotic-choice", type: "checklist", title: "Antibiotic choice", intro: "Based on most-recent urine culture sensitivities.", items: [
      { label: "Nitrofurantoin 100 mg MR BD for 3 days (first-line)", detail: "If eGFR ≥45 and E. coli historically sensitive." },
      { label: "Trimethoprim 200 mg BD for 3 days (alternative)", detail: "If nitrofurantoin contraindicated or historical sensitivity favours. Note rising resistance in many areas." },
      { label: "Fosfomycin 3 g sachet single dose (alternative)", detail: "Where available and indicated by culture. Useful for resistant E. coli." },
      { label: "Don't supply if recent failure of same antibiotic", detail: "Likely resistance; refer for culture-guided choice." },
      { label: "Cefalexin or co-amoxiclav", detail: "Not first-line for standard recurrent UTI; refer for these decisions." },
    ]},
    { id: "prevention", type: "checklist", title: "Prevention — counsel every patient", intro: "Reducing recurrence is more important than treating episodes.", items: [
      { label: "Hydration", detail: "2 litres of water daily reduces recurrence." },
      { label: "Void after intercourse", detail: "Within 15 minutes of sex." },
      { label: "Wipe front to back", detail: "Reduces faecal-perineal-urethral E. coli transfer." },
      { label: "Avoid spermicides if relevant", detail: "Spermicide diaphragms / condoms increase risk." },
      { label: "Avoid douching, scented hygiene products", detail: "Disturbs flora." },
      { label: "Vaginal oestrogen (post-menopausal)", detail: "Very effective in this group — discuss with GP." },
      { label: "Methenamine hippurate", detail: "Non-antibiotic prophylaxis — discuss with GP. Increasingly used to reduce antibiotic exposure." },
      { label: "Cranberry / D-mannose", detail: "Mixed evidence; reasonable adjunct but not a substitute." },
      { label: "Stress, fatigue", detail: "Recurrence often clusters around physical/emotional stress; awareness can help." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "PGD is for established recurrent UTI with a known pattern, GP-aware.",
      "First-time UTI → standard UTI PGD.",
      "Choose antibiotic based on recent culture sensitivities; nitrofurantoin first-line.",
      "Refer: pregnancy, upper-tract, failure of recent course, ≥4/year despite prophylaxis.",
      "Counsel on hydration, post-coital voiding, hygiene, and (post-menopausal) vaginal oestrogen.",
      "Encourage GP review and proper long-term prevention strategy.",
    ]},
  ],
  quiz: [
    { id: "q-first", type: "single-choice", critical: true, question: "Woman with first-ever UTI symptoms. Wants treatment. Action?", options: [
      { id: "a", label: "Supply under recurrent UTI PGD." }, { id: "b", label: "Use the standard UTI PGD, not recurrent UTI PGD. Recurrent PGD requires established pattern (≥3/year or ≥2/6 months)." }, { id: "c", label: "Refer." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "PGD scope: recurrent ≠ first-time. Standard UTI PGD handles initial presentations." },
    { id: "q-pyelo", type: "single-choice", critical: true, question: "Patient with recurrent UTI history, today has fever, loin pain, vomiting. Action?", options: [
      { id: "a", label: "Standby antibiotic." }, { id: "b", label: "Refer urgent care — upper-tract features (fever, loin pain, vomiting) suggest pyelonephritis, needs longer-course oral or possibly IV antibiotic, hospital review." }, { id: "c", label: "Double dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Pyelonephritis red flags override standby PGD. Refer urgently." },
    { id: "q-resistant", type: "single-choice", critical: true, question: "Patient took nitrofurantoin 1 month ago for UTI; symptoms returned. Action?", options: [
      { id: "a", label: "Supply nitrofurantoin again." }, { id: "b", label: "Refer to GP for urine culture — recent failure suggests resistance or persistent infection. Repeating the same antibiotic likely fails again." }, { id: "c", label: "Double dose nitrofurantoin." }, { id: "d", label: "Supply trimethoprim." }
    ], correctOptionIds: ["b"], explanation: "Recent treatment failure = likely resistance. Need culture-guided choice, not repeat empirical therapy." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient with recurrent UTI pattern. Action?", options: [
      { id: "a", label: "Supply nitrofurantoin." }, { id: "b", label: "Refer GP/midwife — pregnancy UTI has specific protocols and concerns (preterm labour risk). Out of PGD scope." }, { id: "c", label: "Supply trimethoprim." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy outside PGD scope, plus pregnancy UTI carries higher complication risk requiring proper care." },
    { id: "q-prevention", type: "single-choice", question: "Most evidence-based prevention measure for recurrent UTI in pre-menopausal sexually-active women?", options: [
      { id: "a", label: "Cranberry juice daily." }, { id: "b", label: "Post-coital voiding within 15 minutes, hydration 2L/day, avoid spermicide. Evidence-based behavioural measures." }, { id: "c", label: "Avoid all sexual activity." }, { id: "d", label: "Daily vitamin C." }
    ], correctOptionIds: ["b"], explanation: "Behavioural measures have the best evidence. Post-coital voiding, hydration, avoiding spermicides. Cranberry mixed evidence." },
    { id: "q-vaginal-oestrogen", type: "single-choice", question: "Post-menopausal woman with recurrent UTI. Best prophylaxis option to discuss with GP?", options: [
      { id: "a", label: "Daily nitrofurantoin." }, { id: "b", label: "Vaginal oestrogen — very effective in post-menopausal recurrent UTI; restores vaginal microbiome and urothelial integrity. Discuss with GP." }, { id: "c", label: "Daily probiotic." }, { id: "d", label: "Cranberry juice." }
    ], correctOptionIds: ["b"], explanation: "Vaginal oestrogen is highly effective in post-menopausal recurrent UTI and underused. Discuss with GP for initiation." },
    { id: "q-fosfomycin", type: "single-choice", question: "When might fosfomycin be appropriate?", options: [
      { id: "a", label: "First-line for all UTIs." }, { id: "b", label: "Where E. coli has resistance to nitrofurantoin and trimethoprim per recent culture. Single 3 g dose." }, { id: "c", label: "Pregnancy." }, { id: "d", label: "Children." }
    ], correctOptionIds: ["b"], explanation: "Fosfomycin is useful for resistant E. coli. Single-dose convenience is an advantage." },
    { id: "q-many-episodes", type: "single-choice", question: "Patient is on 4th episode this year despite prophylaxis. Action?", options: [
      { id: "a", label: "Supply standby antibiotic." }, { id: "b", label: "Refer to urology — failure of prophylaxis warrants imaging and assessment for structural abnormality, urolithiasis, retention, anatomical issues." }, { id: "c", label: "Higher-dose prophylaxis." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Failure of prophylaxis = urology referral. Needs structural assessment." },
    { id: "q-spermicide", type: "single-choice", question: "Young sexually-active woman uses condoms with spermicide. Frequent UTIs. Prevention?", options: [
      { id: "a", label: "Continue spermicide." }, { id: "b", label: "Switch to non-spermicidal condoms — spermicide disrupts normal flora and significantly increases UTI risk." }, { id: "c", label: "Increase spermicide." }, { id: "d", label: "Switch to diaphragm." }
    ], correctOptionIds: ["b"], explanation: "Spermicide is a well-documented UTI risk factor. Switching is a simple, effective preventive change." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Recurrent pattern documented, last culture sensitivities, symptoms, red flags excluded, antibiotic chosen with rationale, prevention measures discussed — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates the recurrent UTI was established, culture-guided, and prevention reinforced." },
  ],
};
