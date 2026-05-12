// Genital warts — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const genitalWartsModule: TrainingModule = {
  slug: "genital-warts",
  title: "Genital Warts — PGD",
  description: "Supply of topical podophyllotoxin or imiquimod for external anogenital warts under PGD.",
  pgdSlugs: ["genital-warts"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Genital Warts — Training", subtitle: "Topical treatments under PGD; cryotherapy referrals", estimatedMinutes: 10, objectives: [
      "Identify candidates for self-applied topical treatment.",
      "Differentiate uncomplicated anogenital warts from atypical lesions needing referral.",
      "Counsel on application technique, HPV vaccination, and partner considerations.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Anogenital warts are caused by HPV (most commonly types 6 and 11 — low-risk for cancer). Skin-coloured / pink papules or cauliflower-like clusters around genitals / anus.",
      "Self-applied topical options: podophyllotoxin (Warticon) 0.15% cream or 0.5% solution; imiquimod (Aldara) 5% cream. GUM clinics also offer cryotherapy or electrosurgery for larger / resistant lesions.",
      "Most warts clear within 3 months but recurrence is common (~30%). HPV vaccination doesn't treat existing warts but prevents new infections.",
    ], highlights: ["Topical for external warts; refer GUM for cryotherapy / internal lesions.", "Podophyllotoxin: cycle of 3 days application, 4 days rest, up to 4 weeks.", "HPV vaccination still beneficial — prevents new strains."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 18+", detail: "Under 18 — refer GUM with safeguarding considerations." },
      { label: "External anogenital warts confirmed clinically", detail: "Typical appearance; not atypical lesion. Internal cervical / vaginal / urethral / intra-anal warts — refer GUM." },
      { label: "Not pregnant or breastfeeding", detail: "Podophyllotoxin and imiquimod avoided in pregnancy — refer." },
      { label: "Not immunocompromised", detail: "Severe warts in HIV / transplant patients — refer specialist." },
      { label: "Lesion area suitable for self-application", detail: "Small number of accessible warts. Large area, perianal, internal — refer GUM." },
      { label: "Patient comfortable with self-application", detail: "If they prefer treatment in a clinic, refer GUM for cryotherapy." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer GUM", tone: "danger", message: "Refer for these.", detail: [
      "Pregnancy or breastfeeding (avoid both agents).",
      "Suspected atypical lesion (irregular borders, bleeding, pigmentation, rapid growth, ulceration — possible malignancy).",
      "Internal lesions (cervix, vagina, urethra, intra-anal).",
      "Extensive disease — large area, hard to self-apply.",
      "Immunocompromised — HIV with low CD4, transplant, biologics, severe immunodeficiency.",
      "Children under 18.",
      "Failure of previous topical therapy.",
      "Concomitant other STI or no recent STI screen — refer for full GUM workup.",
      "Severely inflamed or infected lesions.",
    ]},
    { id: "treatment", type: "comparison", title: "Self-applied topical options", intro: "Different mechanisms — choose by patient preference and skin tolerability.", columns: [
      { label: "Podophyllotoxin 0.15% cream / 0.5% solution", rows: [
        { heading: "Schedule", body: "Apply BD for 3 consecutive days, then 4-day rest. Repeat weekly for up to 4 weeks." },
        { heading: "Mechanism", body: "Antimitotic — destroys wart tissue." },
        { heading: "Side effects", body: "Local irritation, burning, ulceration if over-applied." },
        { heading: "Counsel", body: "Apply to wart only with cotton bud; avoid surrounding skin. Air-dry. Wash hands." },
      ]},
      { label: "Imiquimod 5% cream", rows: [
        { heading: "Schedule", body: "Apply thin layer 3 times per week (e.g. Mon/Wed/Fri) at bedtime; wash off after 6–10 hours. Continue up to 16 weeks." },
        { heading: "Mechanism", body: "Topical immune modulator — local cytokine response clears HPV-infected cells." },
        { heading: "Side effects", body: "Skin irritation, erythema, erosion, flu-like symptoms occasionally." },
        { heading: "Counsel", body: "Slower onset but often better tolerated. May weaken latex condoms — use non-latex during treatment days." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Apply only to warts", detail: "Both agents irritate normal skin. Use cotton bud or fingertip; protect surrounding skin with vaseline if helpful." },
      { label: "Patience", detail: "Both agents take weeks to clear lesions. Don't over-apply if not working — irritation worsens, efficacy doesn't." },
      { label: "Partner considerations", detail: "HPV is often already present in partners by time of diagnosis; treating one doesn't protect the other. Partners benefit from STI screen and HPV vaccination if eligible." },
      { label: "HPV vaccination", detail: "Patient and partner eligible per current Green Book may still benefit (different HPV strains). Refer for HPV vaccination if relevant." },
      { label: "Condom use", detail: "Reduces but doesn't eliminate transmission (warts can be on non-covered areas). Imiquimod weakens latex — non-latex during treatment." },
      { label: "Mental-health support", detail: "Genital warts diagnosis distressing; offer GUM counselling pathway." },
      { label: "Recurrence", detail: "~30% recurrence within 3 months. Counsel pre-emptively — recurrence ≠ treatment failure." },
      { label: "Return if", detail: "No improvement after 4 weeks (podophyllotoxin) or 16 weeks (imiquimod), worsening, atypical features, severe irritation." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "External warts — self-applied podophyllotoxin or imiquimod.",
      "Internal lesions, atypical features, large area, pregnancy, immunocompromised = refer GUM.",
      "Recurrence ~30% — counsel pre-emptively.",
      "HPV vaccination remains beneficial.",
      "Imiquimod weakens latex condoms — use non-latex during treatment days.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant patient with genital warts. Action?", options: [
      { id: "a", label: "Podophyllotoxin." }, { id: "b", label: "Refer GUM / obstetric care. Podophyllotoxin and imiquimod both avoided in pregnancy. GUM has cryotherapy or trichloroacetic acid options." }, { id: "c", label: "Imiquimod." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Both PGD topical agents avoided in pregnancy. Cryotherapy or TCA at GUM are the pregnancy-safe options." },
    { id: "q-atypical", type: "single-choice", critical: true, question: "Patient has a wart-like lesion that is pigmented, has irregular borders and has been bleeding. Action?", options: [
      { id: "a", label: "Podophyllotoxin." }, { id: "b", label: "Refer urgently — atypical features (pigmentation, irregular border, bleeding) raise concern for vulval/penile / anal intraepithelial neoplasia or malignancy. Biopsy needed." }, { id: "c", label: "Imiquimod." }, { id: "d", label: "Cryotherapy DIY." }
    ], correctOptionIds: ["b"], explanation: "Atypical features suggest possible malignancy. Refer urgently for biopsy. Treating empirically risks delaying cancer diagnosis." },
    { id: "q-internal", type: "single-choice", critical: true, question: "Patient describes warts inside the anus and reports rectal bleeding. Action?", options: [
      { id: "a", label: "Topical for external lesions only." }, { id: "b", label: "Refer GUM — internal anal warts need direct visualisation (proctoscopy), and rectal bleeding warrants assessment for other pathology including anal HPV-related neoplasia." }, { id: "c", label: "Topical applied internally." }, { id: "d", label: "Reassure." }
    ], correctOptionIds: ["b"], explanation: "Internal anal warts need GUM/proctology. Rectal bleeding is also a red flag in its own right." },
    { id: "q-immuno", type: "single-choice", critical: true, question: "HIV-positive patient with CD4 <200 has multiple genital warts. Action?", options: [
      { id: "a", label: "Standard topical." }, { id: "b", label: "Refer GUM / HIV team. Immunocompromised patients have widespread / resistant warts and higher risk of HPV-related malignancy. Need specialist management." }, { id: "c", label: "Higher topical dose." }, { id: "d", label: "Defer treatment." }
    ], correctOptionIds: ["b"], explanation: "Advanced immunosuppression = specialist territory. Higher HPV-malignancy risk justifies closer monitoring." },
    { id: "q-application", type: "single-choice", question: "Patient asks how to apply podophyllotoxin 0.5% solution.", options: [
      { id: "a", label: "Apply liberally across the whole genital area daily." }, { id: "b", label: "Apply to wart only with cotton bud (avoid surrounding skin). BD for 3 days, then 4-day rest. Repeat weekly for up to 4 weeks. Air-dry. Wash hands after." }, { id: "c", label: "Wash off after 1 minute." }, { id: "d", label: "Daily continuously." }
    ], correctOptionIds: ["b"], explanation: "Targeted application to wart only. The 3-on/4-off cycle, max 4 weeks, is the standard regimen." },
    { id: "q-condoms-imiquimod", type: "single-choice", question: "Patient on imiquimod asks about condom use.", options: [
      { id: "a", label: "Latex condoms fine." }, { id: "b", label: "Imiquimod cream weakens latex condoms — use non-latex (polyurethane) or abstain during treatment days." }, { id: "c", label: "Avoid all condoms." }, { id: "d", label: "Use two condoms." }
    ], correctOptionIds: ["b"], explanation: "Topical immune modulator with oily base weakens latex. Non-latex barrier or abstain on treatment days." },
    { id: "q-recurrence", type: "single-choice", question: "Patient counselling on recurrence?", options: [
      { id: "a", label: "Once treated, never recurs." }, { id: "b", label: "Recurrence in ~30% within 3 months — common, not a treatment failure. Re-treatment is appropriate; some patients use intermittent topical when recurrences happen." }, { id: "c", label: "Once recurring, untreatable." }, { id: "d", label: "Cryotherapy is mandatory." }
    ], correctOptionIds: ["b"], explanation: "Recurrence is common. Counsel pre-emptively so patient understands the natural history." },
    { id: "q-vaccine", type: "single-choice", question: "29-year-old man with genital warts asks about HPV vaccination.", options: [
      { id: "a", label: "Vaccination useless once you have HPV." }, { id: "b", label: "Still beneficial — Gardasil-9 covers 9 HPV types; he likely has only 1–2 currently. Vaccination protects against the others. Refer for vaccination per current eligibility." }, { id: "c", label: "Vaccination is too late." }, { id: "d", label: "Worsens current warts." }
    ], correctOptionIds: ["b"], explanation: "HPV vaccination is still beneficial post-exposure — protects against strains not already acquired. Eligibility varies; refer." },
    { id: "q-no-improvement", type: "single-choice", question: "Patient on podophyllotoxin 4 weeks — no improvement. Action?", options: [
      { id: "a", label: "Continue another 4 weeks." }, { id: "b", label: "Switch to imiquimod OR refer GUM for cryotherapy / electrosurgery. Don't extend podophyllotoxin beyond licensed 4-week course." }, { id: "c", label: "Double the application frequency." }, { id: "d", label: "Reassure and wait." }
    ], correctOptionIds: ["b"], explanation: "After 4 weeks of podophyllotoxin without effect, switch agent or refer GUM. Continued use causes irritation without benefit." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Lesion description and distribution, atypical features excluded, internal vs external, agent chosen, application counselling, partner / HPV vaccination discussion, STI screen status — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record captures the clinical assessment and the holistic STI/HPV-vaccination counselling." },
  ],
};
