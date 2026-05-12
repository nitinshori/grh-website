// Genital herpes management — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const herpesManagementModule: TrainingModule = {
  slug: "herpes-management",
  title: "Genital Herpes Management — PGD",
  description: "Episodic and suppressive oral antiviral therapy for genital HSV under PGD.",
  pgdSlugs: ["herpes-management"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Genital Herpes — Training", subtitle: "Episodic and suppressive aciclovir/valaciclovir for genital HSV", estimatedMinutes: 12, objectives: [
      "Identify candidates for episodic vs suppressive therapy.",
      "Apply correct dosing regimens per BASHH guidance.",
      "Counsel on transmission, partner disclosure, pregnancy implications.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Genital herpes is caused by HSV-1 (increasingly common cause) or HSV-2. Primary episode often severe (painful ulcers, dysuria, systemic symptoms). Recurrences typically milder and shorter.",
      "Treatment: episodic therapy (shorten individual outbreaks) OR suppressive therapy (continuous, reduces recurrence frequency and transmission risk). Suppressive is for ≥6 recurrences/year OR significant psychosocial impact.",
      "The PGD covers recurrent episodes in known HSV-positive patients and suppressive therapy where indicated. Primary episodes need GP/GUM assessment for proper baseline workup.",
    ], highlights: ["Primary episode = refer GUM for proper workup.", "Episodic for recurrences. Suppressive for ≥6/year.", "Pregnancy considerations are different — refer."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18+", detail: "Under 18 — refer GUM." },
      { label: "Established genital HSV diagnosis", detail: "Confirmed by NAAT or previous GUM diagnosis. First-presentation suspected HSV — refer GUM for swab confirmation." },
      { label: "Recurrent episode (episodic) OR ≥6 recurrences/year (suppressive)", detail: "Clear indication based on pattern." },
      { label: "Not pregnant", detail: "Refer to GUM / obstetric care. Late-pregnancy HSV has neonatal implications." },
      { label: "Not immunocompromised", detail: "Severe HSV in immunocompromised needs specialist input." },
      { label: "No severe renal impairment", detail: "Dose adjustment in CKD; refer if severe." },
      { label: "Not in primary episode", detail: "Primary episodes are different (more severe, longer treatment, GUM workup, partner notification context)." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer for these.", detail: [
      "Primary / first episode — needs GUM swab confirmation, baseline serology, full STI screen.",
      "Pregnancy or planning pregnancy.",
      "Immunocompromised patients.",
      "Severe renal impairment (eGFR <30).",
      "Suspected complications: severe systemic illness, urinary retention from sacral nerve involvement, severe disseminated infection.",
      "Eye involvement — ophthalmology emergency.",
      "Recurrent failure of standard antivirals.",
      "Children.",
      "Hypersensitivity to chosen agent.",
    ]},
    { id: "treatment", type: "comparison", title: "Treatment regimens", intro: "Match to scenario.", columns: [
      { label: "Episodic (recurrent episode)", rows: [
        { heading: "Aciclovir 800 mg TDS for 2 days (or 200 mg 5x/day for 5 days)", body: "Short course; start in prodrome / first 24h." },
        { heading: "Valaciclovir 500 mg BD for 3 days", body: "Alternative; better adherence due to BD dosing." },
        { heading: "When", body: "Recurrent episodes when started early (prodrome). Limited benefit if started >72 hours after onset." },
      ]},
      { label: "Suppressive therapy", rows: [
        { heading: "Aciclovir 400 mg BD continuous", body: "Standard suppressive regimen." },
        { heading: "Valaciclovir 500 mg OD continuous", body: "OD dosing for adherence." },
        { heading: "When", body: "≥6 recurrences/year, significant psychosocial impact, or high transmission risk to partner (e.g. serodiscordant couple where partner is HSV-negative)." },
        { heading: "Review", body: "Annual review to consider trial off therapy. Suppression doesn't 'cure' — relapse on stopping is common." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Transmission", detail: "HSV transmitted via skin-to-skin contact during shedding, including asymptomatic shedding. Most transmission is between known partners over time." },
      { label: "Partner disclosure", detail: "Important conversation. GUM clinics offer counselling support. Disclosure plus condom use during recurrences reduces transmission but doesn't eliminate it." },
      { label: "Condom use", detail: "Reduces transmission but not 100% effective (HSV can shed beyond condom-covered areas)." },
      { label: "Suppressive therapy reduces transmission", detail: "Daily aciclovir/valaciclovir reduces transmission by ~50% in serodiscordant couples — discuss if relevant." },
      { label: "Pregnancy plans", detail: "If patient or partner planning pregnancy, refer to GUM for proper preconception advice (late-pregnancy outbreaks have neonatal HSV risk)." },
      { label: "Triggers", detail: "Stress, illness, sun exposure, hormonal changes. Awareness allows early antiviral start." },
      { label: "Mental health", detail: "Diagnosis can cause significant distress. Offer GUM counselling pathway. Reassure on prognosis (recurrences usually decrease over years)." },
      { label: "Hygiene during outbreaks", detail: "Wash hands after touching lesions. Don't share towels. No oral-genital contact during oral or genital outbreaks." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Episodic: aciclovir 800 mg TDS x 2 days OR valaciclovir 500 mg BD x 3 days, started in prodrome.",
      "Suppressive: aciclovir 400 mg BD or valaciclovir 500 mg OD continuous; for ≥6 recurrences/year.",
      "Primary episode = refer GUM.",
      "Pregnancy = refer (neonatal HSV considerations).",
      "Annual review on suppressive therapy.",
      "Partner disclosure + condom use + suppressive therapy reduces transmission.",
    ]},
  ],
  quiz: [
    { id: "q-primary", type: "single-choice", critical: true, question: "First-time presentation of genital ulcers, severe pain, dysuria. Action?", options: [
      { id: "a", label: "Aciclovir 800 mg TDS x 2 days." }, { id: "b", label: "Refer GUM. Primary episode needs longer treatment course (e.g. aciclovir 400 mg TDS x 5–10 days), HSV typing (NAAT), full STI screen, partner notification context." }, { id: "c", label: "Topical aciclovir." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Primary episode is outside PGD scope. Needs full GUM workup including typing for prognostic info." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient (32 weeks) with recurrent genital HSV outbreak. Action?", options: [
      { id: "a", label: "Standard episodic aciclovir." }, { id: "b", label: "Refer to GUM / obstetric care urgently. Late pregnancy HSV may indicate need for suppressive therapy from week 36 to prevent neonatal HSV at delivery. Specialist management." }, { id: "c", label: "Topical aciclovir only." }, { id: "d", label: "Defer treatment." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy HSV has neonatal implications. Late pregnancy especially — suppressive aciclovir from week 36 reduces shedding at delivery; potential C-section consideration if active lesions." },
    { id: "q-immunocompromised", type: "single-choice", critical: true, question: "Patient with HIV (CD4 <200) has genital HSV recurrence. Action?", options: [
      { id: "a", label: "Standard episodic regimen." }, { id: "b", label: "Refer GUM / HIV team. Immunocompromised patients have prolonged and severe outbreaks; need higher-dose / longer courses and specialist oversight." }, { id: "c", label: "Half dose." }, { id: "d", label: "Topical only." }
    ], correctOptionIds: ["b"], explanation: "Severe / advanced immunosuppression requires specialist regimens. Outside PGD scope." },
    { id: "q-suppressive", type: "single-choice", critical: true, question: "Patient with 8 recurrences last year wants suppressive therapy. Action?", options: [
      { id: "a", label: "Episodic only." }, { id: "b", label: "Initiate suppressive: aciclovir 400 mg BD continuous OR valaciclovir 500 mg OD. Review at 12 months — consider trial off therapy to see if frequency has reduced." }, { id: "c", label: "Higher episodic dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "≥6/year is the standard threshold for suppressive therapy. Counsel that it doesn't cure — annual review with trial off therapy." },
    { id: "q-early-start", type: "single-choice", question: "Patient with HSV recurrence pattern reports tingling on inner thigh, no visible lesions yet. Action?", options: [
      { id: "a", label: "Wait for lesions." }, { id: "b", label: "Start episodic aciclovir/valaciclovir now in prodrome — best efficacy if started before lesions appear or within 24 hours of onset." }, { id: "c", label: "Topical." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Early start in prodrome is when antivirals work best. Patient awareness of personal prodrome saves antiviral wasted on lesion-stage when efficacy is reduced." },
    { id: "q-transmission", type: "single-choice", question: "Patient asks how to reduce HSV transmission to her negative partner.", options: [
      { id: "a", label: "Avoid all contact." }, { id: "b", label: "Combination: condom use + avoiding contact during outbreaks/prodrome + suppressive antivirals (reduce shedding ~50%) + partner disclosure. None individually 100% effective." }, { id: "c", label: "Antivirals alone are enough." }, { id: "d", label: "No reduction possible." }
    ], correctOptionIds: ["b"], explanation: "Multi-layered approach. Suppressive antivirals + condoms + disclosure + avoidance during outbreaks substantially reduces transmission." },
    { id: "q-eye", type: "single-choice", question: "Patient with HSV outbreak now reports red painful eye and blurred vision. Action?", options: [
      { id: "a", label: "Oral aciclovir." }, { id: "b", label: "Urgent ophthalmology — possible HSV keratitis. Sight-threatening; needs topical/systemic antivirals and slit-lamp assessment." }, { id: "c", label: "Eye drops." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "HSV keratitis can scar the cornea and cause permanent visual loss. Urgent ophthalmology." },
    { id: "q-dose-renal", type: "single-choice", question: "Patient with eGFR 35 needs episodic aciclovir. Action?", options: [
      { id: "a", label: "Standard 800 mg TDS." }, { id: "b", label: "Refer GP — aciclovir is renally excreted; dose adjustment needed in moderate renal impairment. Standard dose may cause toxicity (confusion, AKI worsening)." }, { id: "c", label: "Half dose without monitoring." }, { id: "d", label: "Topical only." }
    ], correctOptionIds: ["b"], explanation: "Renal impairment requires dose adjustment. Refer for proper dosing." },
    { id: "q-mental-health", type: "single-choice", question: "Patient newly suppressed on aciclovir reports persistent low mood since diagnosis. Action?", options: [
      { id: "a", label: "Reassure." }, { id: "b", label: "Refer to GP / mental health support. HSV diagnosis has significant psychological impact; counselling and proper mental health support important alongside antiviral therapy." }, { id: "c", label: "Stop antivirals." }, { id: "d", label: "Increase antiviral dose." }
    ], correctOptionIds: ["b"], explanation: "Psychological impact of HSV diagnosis is significant and often underestimated. Encourage proper mental health support." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Episode pattern (recurrent vs primary), frequency, treatment regimen, transmission counselling, partner-disclosure context, pregnancy status, GP-informed — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record captures the clinical reasoning and the holistic counselling delivered." },
  ],
};
