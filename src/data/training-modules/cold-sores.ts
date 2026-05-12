// Cold sores (herpes labialis) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const coldSoresModule: TrainingModule = {
  slug: "cold-sores",
  title: "Cold Sores (Herpes Labialis) — PGD",
  description: "Eligibility and supply of oral aciclovir for severe or recurrent cold sores under PGD.",
  pgdSlugs: ["cold-sores"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Cold Sores — Training", subtitle: "Oral aciclovir for severe or recurrent herpes labialis", estimatedMinutes: 10, objectives: [
      "Identify candidates for oral aciclovir under the PGD (severe, recurrent, or immune-relevant cases).",
      "Differentiate cold sores from impetigo and other lesions.",
      "Counsel on early initiation, hygiene, and recurrence triggers.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Herpes labialis is caused by HSV-1 (occasionally HSV-2) reactivation. Classic course: prodrome (tingling, itching) → vesicles → ulcers → crusting → resolution, typically 7–10 days.",
      "Most episodes resolve without treatment. OTC topical aciclovir 5% cream is widely used but evidence of clinical benefit is limited. Oral aciclovir, started in the prodrome, can shorten an episode by ~1–2 days.",
      "The PGD covers oral aciclovir for severe episodes or frequent recurrences in otherwise healthy adults. It does NOT cover suppressive long-term therapy (that's GP-led).",
    ], highlights: ["Start within 24 hours (ideally in prodrome) for benefit.", "Topical OTC is the first option for mild self-limiting episodes.", "Frequent (≥6/year) recurrence may warrant suppressive therapy — refer to GP."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18–65", detail: "Outside this range refer." },
      { label: "Recognises typical cold sore in early stage (prodrome or vesicles)", detail: "Started <72 hours ago. After 72 hours, treatment benefit is minimal." },
      { label: "Recurrent pattern (not first-ever episode in adulthood)", detail: "First-ever HSV may need broader workup — refer." },
      { label: "Not pregnant or breastfeeding", detail: "Oral aciclovir is generally safe in pregnancy but should be GP-managed in this context." },
      { label: "Not immunocompromised", detail: "Immunocompromised patients (HIV, chemo, transplant, biologics) need GP/specialist input." },
      { label: "No severe renal impairment", detail: "Aciclovir is renally excreted; dose adjustment in CKD." },
      { label: "Not extensive or atypical lesion", detail: "Widespread, inside mouth, or facial distribution beyond lips — refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "When NOT to supply.", detail: [
      "First-ever herpetic episode in adulthood — needs GP workup.",
      "Eczema herpeticum (vesicles spreading on eczematous skin) — A&E / dermatology emergency.",
      "Herpetic whitlow (finger) or genital lesions — refer.",
      "Lesions inside the mouth (gingivostomatitis) — refer if severe.",
      "Pregnancy or breastfeeding — refer to GP.",
      "Immunocompromised patient.",
      "Frequent recurrence (≥6/year) — suppressive therapy via GP.",
      "Atypical lesions or diagnostic uncertainty.",
      "Concurrent severe renal impairment.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing — oral aciclovir", intro: "Standard 5-day episodic regimen.", items: [
      { label: "Aciclovir 200 mg orally 5 times daily for 5 days", detail: "Spread evenly across waking hours." },
      { label: "Start as early as possible", detail: "Ideally during prodromal tingle. Reduced benefit after 72 hours from lesion onset." },
      { label: "Take with adequate fluid", detail: "Aciclovir is renally excreted; maintain hydration." },
      { label: "Course duration is fixed at 5 days", detail: "Do not extend." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Hygiene", detail: "Don't pick or squeeze lesions. Wash hands after touching. Avoid sharing towels, lip balms, drinks." },
      { label: "Avoid contact transmission", detail: "Avoid kissing children/infants while lesions present. Avoid oral sex (transmits to partner's genital area)." },
      { label: "Sun protection", detail: "UV exposure is a common trigger. Lip-balm SPF for prevention." },
      { label: "Triggers", detail: "Stress, illness, fatigue, hormonal changes, dental procedures. Awareness allows early antiviral start." },
      { label: "Recurrence pattern", detail: "Most patients have a typical recurrence pattern and personal warning signs. Encourage prompt PGD return if appropriate." },
      { label: "OTC adjuncts", detail: "Topical aciclovir cream is acceptable alongside oral. Cold compresses, paracetamol for discomfort." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer urgently", tone: "danger", message: "Any of these warrant urgent referral.", detail: [
      "Eczema herpeticum (HSV in atopic skin — spreading vesicles, fever, unwell).",
      "Eye involvement (HSV keratitis — eye pain, photophobia, red eye, blurred vision).",
      "Severe trigeminal nerve distribution lesions.",
      "Immunocompromised with active lesions.",
      "Lesions failing to heal after 14 days.",
      "Suspected bacterial superinfection (golden crusts, increasing pain, fever).",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — straightforward", scenario: "James, 35, recurrent cold sores (~4 per year). Today feels tingling on his upper lip starting 6 hours ago. Has had similar pattern for years. No medication, no medical issues.",
      question: "Supply?", answer: "Aciclovir 200 mg orally 5 times daily for 5 days. Counsel on early start being key (he's caught it in prodrome — good), hygiene, sun protection, recognising next prodrome early.",
      rationale: "Classic prodromal presentation in a known recurrent patient. Early treatment maximises benefit." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Start as early as possible, ideally prodrome. Benefit minimal after 72 hours.",
      "Aciclovir 200 mg 5x/day for 5 days.",
      "Refer: first-ever, immunocompromised, pregnant, frequent (≥6/yr), eye involvement, eczema, atypical.",
      "Counsel: hygiene, avoid kissing/sharing, sun protection, trigger awareness.",
      "Red flags: eye, eczema herpeticum, failure to heal.",
    ]},
  ],
  quiz: [
    { id: "q-eczema-herpeticum", type: "single-choice", critical: true, question: "Patient with eczema presents with spreading vesicles on the face, feels unwell, low-grade fever. Action?", options: [
      { id: "a", label: "Supply aciclovir tablets." }, { id: "b", label: "Refer to A&E / dermatology immediately — eczema herpeticum is a medical emergency." }, { id: "c", label: "Supply topical aciclovir." }, { id: "d", label: "Supply antibiotics." }
    ], correctOptionIds: ["b"], explanation: "Eczema herpeticum (HSV spreading on atopic skin) is a dermatological emergency requiring IV antivirals and urgent specialist care. Do NOT supply under PGD." },
    { id: "q-eye", type: "single-choice", critical: true, question: "Patient describes red painful eye with blurred vision alongside cold sore. Action?", options: [
      { id: "a", label: "Supply oral aciclovir." }, { id: "b", label: "Urgent ophthalmology referral — possible HSV keratitis, can cause permanent visual loss." }, { id: "c", label: "Supply chloramphenicol drops." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Eye involvement with HSV needs urgent ophthalmology — keratitis can scar the cornea." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman with recurrent cold sore. Action?", options: [
      { id: "a", label: "Supply aciclovir." }, { id: "b", label: "Refer to midwife/GP. Oral aciclovir is generally safe in pregnancy but should be GP-managed for proper counselling on neonatal HSV risk at delivery." }, { id: "c", label: "Refuse all treatment." }, { id: "d", label: "Topical only." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy is outside the PGD scope. Aciclovir is generally safe but pregnancy management of HSV (especially around delivery) needs midwife input." },
    { id: "q-frequent", type: "single-choice", critical: true, question: "Patient has 8 cold sore episodes per year. Action?", options: [
      { id: "a", label: "Supply episodic aciclovir as needed." }, { id: "b", label: "Refer to GP for consideration of suppressive aciclovir (daily continuous therapy) — frequent recurrence (≥6/yr) is the threshold." }, { id: "c", label: "Supply double dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Frequent recurrence warrants consideration of suppressive therapy, which is GP-led, not PGD. Episodic supply for frequent recurrence wastes medication and doesn't address the underlying problem." },
    { id: "q-timing", type: "single-choice", question: "Patient calls 5 days after the cold sore appeared — it's now crusted. Wants aciclovir.", options: [
      { id: "a", label: "Supply oral aciclovir." }, { id: "b", label: "Aciclovir benefit is minimal after 72 hours. Counsel on hygiene, healing, sun protection, and earlier start at next prodrome. Topical OTC reasonable for comfort." }, { id: "c", label: "Supply double dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Aciclovir benefit is highly time-dependent. 5 days in = past the useful window. Counsel for next time." },
    { id: "q-first-ever", type: "single-choice", question: "30-year-old reports first-ever cold sore symptoms. Action?", options: [
      { id: "a", label: "Supply standard 5-day course." }, { id: "b", label: "Refer to GP. First-ever HSV episodes can be severe and may warrant broader assessment. Plus consider whether the lesion is actually HSV." }, { id: "c", label: "Supply topical aciclovir." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "PGD is for recurrent disease in a patient who knows their pattern. First-ever HSV warrants GP review for assessment." },
    { id: "q-dosing", type: "single-choice", question: "Correct dose of oral aciclovir for episodic cold sore?", options: [
      { id: "a", label: "200 mg once daily for 7 days." }, { id: "b", label: "200 mg 5 times daily for 5 days." }, { id: "c", label: "400 mg twice daily for 10 days." }, { id: "d", label: "800 mg once daily." }
    ], correctOptionIds: ["b"], explanation: "Standard episodic dose: 200 mg five times daily for 5 days." },
    { id: "q-hygiene", type: "single-choice", question: "Key counselling for transmission?", options: [
      { id: "a", label: "Cold sores are not contagious." }, { id: "b", label: "Avoid kissing infants/young children, sharing towels/utensils, oral sex with partner (genital herpes transmission), and touching the lesion." }, { id: "c", label: "Wear a mask all day." }, { id: "d", label: "Stay home until healed." }
    ], correctOptionIds: ["b"], explanation: "HSV is highly transmissible during active lesions. The key risks: neonatal herpes (kissing infants), shared utensils, oral-genital transmission." },
    { id: "q-immunocompromised", type: "single-choice", question: "Patient on rituximab for lymphoma has a cold sore. Action?", options: [
      { id: "a", label: "Supply normally." }, { id: "b", label: "Refer to GP / haematology. Immunocompromised patients with HSV need closer monitoring and possibly higher-dose or longer therapy; specialist input." }, { id: "c", label: "Supply double dose." }, { id: "d", label: "Topical only." }
    ], correctOptionIds: ["b"], explanation: "Immunocompromised patients can have severe HSV (disseminated, neurological). Specialist input mandatory." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Pattern (recurrent/first), time from onset, exclusion of red flags, counselling delivered — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text note." }
    ], correctOptionIds: ["b"], explanation: "ePGD tool captures the structured record including key safety items (timing, ruling out red flags)." },
  ],
};
