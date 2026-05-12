// Sleep — melatonin PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const sleepMelatoninModule: TrainingModule = {
  slug: "sleep-melatonin",
  title: "Sleep (Melatonin) — PGD",
  description: "Short-course melatonin for short-term primary insomnia or jet lag in adults under PGD.",
  pgdSlugs: ["sleep-melatonin"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Sleep / Melatonin — Training", subtitle: "Short-course melatonin for short-term insomnia or jet lag", estimatedMinutes: 10, objectives: [
      "Identify appropriate candidates for short-course melatonin under the PGD.",
      "Differentiate primary insomnia / jet lag from secondary insomnia (depression, sleep apnoea, etc.).",
      "Counsel on sleep hygiene as the primary intervention, not a drug.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Melatonin is an endogenous hormone produced by the pineal gland in darkness; it signals sleep onset. Exogenous melatonin advances or delays the circadian rhythm and has mild hypnotic effects.",
      "Licensed in the UK for short-term insomnia in adults aged 55+ (Circadin, 2 mg modified-release) and for jet lag in adults of any age (off-label use of immediate-release in some contexts).",
      "Mainstay of insomnia treatment is sleep hygiene and CBT-I (cognitive behavioural therapy for insomnia). Pharmacotherapy is short-term adjunct only.",
    ], highlights: ["Sleep hygiene + CBT-I are the foundation.", "Melatonin is short-course adjunct.", "Chronic insomnia (>3 months) needs GP/specialist."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 55+ for licensed primary insomnia indication", detail: "Younger adults licensed only for jet lag. Off-label use for short-term insomnia in younger adults — refer GP if PGD doesn't cover." },
      { label: "Short-term insomnia (<4 weeks)", detail: "Chronic insomnia (>3 months) needs GP / sleep clinic." },
      { label: "OR jet lag with documented travel", detail: "Short course 2–5 days." },
      { label: "Sleep hygiene attempted", detail: "Document discussion of sleep hygiene measures." },
      { label: "No absolute contraindications (next slide)", detail: "Including significant comorbidity, certain medications." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Contraindications and refer", tone: "danger", message: "Refer for these.", detail: [
      "Chronic insomnia (>3 months) — needs full assessment (depression, OSA, restless legs, medication, alcohol).",
      "Suspected obstructive sleep apnoea (snoring, witnessed apnoea, daytime sleepiness, BMI >30, neck >43 cm) — needs sleep study, NOT a hypnotic.",
      "Suspected depression-related insomnia — refer GP.",
      "Pregnancy or breastfeeding.",
      "Significant hepatic impairment.",
      "Autoimmune disease (relative — discussed below).",
      "Concurrent fluvoxamine — major interaction (raises melatonin levels significantly).",
      "Concurrent CYP1A2 inhibitors (ciprofloxacin) — caution.",
      "Children under 18 (specialist territory, ADHD/autism).",
      "Driving / shift work — caution: residual morning sedation possible.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing", intro: "Short-course only.", items: [
      { label: "Primary insomnia (≥55)", detail: "Melatonin 2 mg modified-release (Circadin) once daily, 1–2 hours before bedtime, with or after food. 4-week course maximum under PGD." },
      { label: "Jet lag (any adult)", detail: "Melatonin immediate-release 3 mg taken at bedtime in the new timezone (around 22:00 local) for 2–5 days after arrival. Start the day of arrival." },
      { label: "Stop if no benefit", detail: "Review at 2 weeks for insomnia. If no benefit, discontinue rather than continue passively." },
      { label: "Don't combine with alcohol", detail: "Additive sedation." },
      { label: "Tapering", detail: "Not generally needed for short courses." },
    ]},
    { id: "sleep-hygiene", type: "checklist", title: "Sleep hygiene — counsel every patient", intro: "These often outperform pharmacotherapy.", items: [
      { label: "Consistent sleep/wake times", detail: "Same bedtime and rising time every day, including weekends." },
      { label: "No screens 30–60 min before bed", detail: "Phone, laptop, TV. Blue light suppresses melatonin." },
      { label: "Cool, dark, quiet bedroom", detail: "16–18°C ideal. Blackout curtains or eye mask. Earplugs if noisy." },
      { label: "Caffeine cut-off", detail: "No caffeine after midday. Including tea, coffee, cola, chocolate, energy drinks." },
      { label: "Alcohol", detail: "Although it makes you fall asleep faster, fragments sleep later in the night. Avoid in the 3–4 hours before bed." },
      { label: "Exercise", detail: "Regular daytime exercise improves sleep. Avoid intense exercise in the 2 hours before bed." },
      { label: "Don't lie awake worrying", detail: "If can't sleep within 20 minutes, get up and do something quiet in dim light. Return to bed when sleepy." },
      { label: "No daytime naps", detail: "Or short (<20 min) before mid-afternoon." },
      { label: "CBT-I (cognitive behavioural therapy for insomnia)", detail: "Apps (Sleepio), GP/online programmes. More effective than drugs for chronic insomnia." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Sleep hygiene + CBT-I are first-line. Melatonin is short-term adjunct.",
      "Primary insomnia: age 55+, 2 mg MR 1–2h before bed, max 4 weeks.",
      "Jet lag: 3 mg at bedtime in destination zone, 2–5 days.",
      "Refer: chronic insomnia, suspected OSA, depression, pregnancy, fluvoxamine.",
      "Counsel on caffeine, screens, alcohol, consistent timing.",
    ]},
  ],
  quiz: [
    { id: "q-osa", type: "single-choice", critical: true, question: "Patient asks for melatonin. He's a heavy snorer; partner says he stops breathing in his sleep. Daytime sleepiness common. BMI 33. Action?", options: [
      { id: "a", label: "Supply melatonin." }, { id: "b", label: "Refer for OSA assessment. Snoring + witnessed apnoea + daytime sleepiness + raised BMI strongly suggests obstructive sleep apnoea — needs sleep study, not melatonin." }, { id: "c", label: "Supply at low dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Untreated OSA is a major cardiovascular risk and the cause of daytime sleepiness; melatonin doesn't address it and may make patient less alert. Refer for sleep study." },
    { id: "q-chronic", type: "single-choice", critical: true, question: "Patient has had insomnia for 7 months. Wants melatonin. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer GP. Chronic insomnia (>3 months) needs full assessment — depression, OSA, restless legs, medication, substance use, sleep clinic referral. PGD is for short-term." }, { id: "c", label: "Supply 4-week course." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Chronic insomnia needs proper diagnostic workup. Short-course melatonin masks symptoms without addressing the underlying issue." },
    { id: "q-fluvoxamine", type: "single-choice", critical: true, question: "Patient on fluvoxamine for OCD wants melatonin. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Contraindicated. Fluvoxamine raises melatonin levels significantly. Refer GP." }, { id: "c", label: "Half dose." }, { id: "d", label: "Alternate days." }
    ], correctOptionIds: ["b"], explanation: "Fluvoxamine is a strong CYP1A2 inhibitor; co-administration significantly increases melatonin AUC. Avoid combination." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient wants melatonin for jet lag. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer GP/midwife. Melatonin is not recommended in pregnancy due to insufficient safety data and theoretical foetal effects." }, { id: "c", label: "Half dose." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Limited safety data in pregnancy. Sleep hygiene + GP/midwife consultation rather than PGD melatonin." },
    { id: "q-jet-lag", type: "single-choice", question: "Patient flying London → Sydney (8 hour time difference, eastward). Jet lag dosing?", options: [
      { id: "a", label: "5 mg every 3 hours throughout flight." }, { id: "b", label: "3 mg at bedtime in destination time zone (~22:00 Sydney local), for 2–5 days starting the day of arrival." }, { id: "c", label: "Start 2 weeks before travel." }, { id: "d", label: "1 mg at sunrise." }
    ], correctOptionIds: ["b"], explanation: "Jet lag dosing: 3 mg at destination bedtime, 2–5 days starting on arrival. Helps shift circadian rhythm." },
    { id: "q-age", type: "single-choice", question: "30-year-old patient asks for melatonin for general short-term insomnia. Action?", options: [
      { id: "a", label: "Supply 2 mg Circadin." }, { id: "b", label: "Refer to GP — primary indication for melatonin Circadin is age 55+. Younger adults need GP-led assessment; sleep hygiene + CBT-I are first-line." }, { id: "c", label: "Supply 5 mg immediate release." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Melatonin Circadin is licensed age 55+ for primary insomnia. Younger adults need GP assessment first." },
    { id: "q-timing", type: "single-choice", question: "When should the patient take Circadin 2 mg MR?", options: [
      { id: "a", label: "At bedtime exactly." }, { id: "b", label: "1–2 hours before intended sleep, with or after food." }, { id: "c", label: "Immediately on waking." }, { id: "d", label: "When the next dose is due." }
    ], correctOptionIds: ["b"], explanation: "Circadin is taken 1–2 hours before intended sleep, with or after food. Earlier than bedtime to allow time for absorption and effect." },
    { id: "q-hygiene", type: "single-choice", question: "Most important counselling alongside melatonin?", options: [
      { id: "a", label: "Avoid driving." }, { id: "b", label: "Sleep hygiene — consistent timing, no screens before bed, no caffeine after midday, cool/dark/quiet bedroom, no alcohol. CBT-I if persistent." }, { id: "c", label: "Take with high-fat meal." }, { id: "d", label: "Increase fluid intake." }
    ], correctOptionIds: ["b"], explanation: "Sleep hygiene is the foundation. Drug without hygiene measures = limited benefit. CBT-I superior for chronic insomnia." },
    { id: "q-no-benefit", type: "single-choice", question: "Patient has been on Circadin 2 mg for 2 weeks, says no benefit. Action?", options: [
      { id: "a", label: "Continue for 4 more weeks." }, { id: "b", label: "Discontinue and review sleep hygiene + consider refer for assessment of underlying cause. Don't extend ineffective treatment." }, { id: "c", label: "Double dose." }, { id: "d", label: "Switch to diazepam." }
    ], correctOptionIds: ["b"], explanation: "No benefit at 2 weeks = discontinue and reassess. Underlying issue (OSA, depression, anxiety, restless legs) may be masquerading as primary insomnia." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Duration of insomnia (or travel itinerary for jet lag), sleep hygiene discussed, contraindications excluded (OSA, depression, medication interactions), regimen — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates that the duration is short-term, OSA / depression have been considered, and sleep hygiene was offered." },
  ],
};
