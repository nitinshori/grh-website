// PrEP (HIV pre-exposure prophylaxis) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const prepModule: TrainingModule = {
  slug: "prep",
  title: "HIV PrEP — PGD",
  description: "Supply of tenofovir-emtricitabine (TDF-FTC) for HIV pre-exposure prophylaxis under PGD.",
  pgdSlugs: ["prep"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 15,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "PrEP — Training", subtitle: "HIV pre-exposure prophylaxis with TDF-FTC", estimatedMinutes: 15, objectives: [
      "Identify eligible patients per BHIVA / BASHH criteria.",
      "Apply daily and on-demand (event-based) dosing regimens.",
      "Coordinate baseline and ongoing monitoring (HIV, renal, STI, hepatitis B).",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "PrEP = pre-exposure prophylaxis. Daily or event-based tenofovir disoproxil fumarate + emtricitabine (TDF-FTC, Truvada) prevents HIV acquisition with high efficacy (>99% with consistent adherence).",
      "Now NHS-commissioned in England via sexual health services. PGD-led PrEP from pharmacy is emerging where local commissioning supports it — confirm local commissioning before initiating supply.",
      "Eligibility per BHIVA: MSM with partner of unknown HIV status, condomless anal sex, recent bacterial STI, or PEP history; trans women; heterosexual men/women with partner of unknown HIV status from high-prevalence area or with known HIV-positive partner not on suppressive ART; sex workers.",
    ], highlights: ["TDF-FTC = Truvada. Daily or event-based dosing.", "Event-based: '2-1-1' regimen for MSM only (not heterosexual or trans women).", "Baseline HIV test mandatory before initiation."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 16+", detail: "Under 16 — specialist HIV/GUM with safeguarding pathway." },
      { label: "HIV-negative (confirmed within 4 weeks of initiation)", detail: "4th-generation antigen-antibody assay. Mandatory before starting. PrEP doesn't treat HIV; starting PrEP in undiagnosed HIV risks resistance." },
      { label: "Meets BHIVA risk criteria", detail: "MSM with relevant exposures, trans women, heterosexual with known-positive non-virally-suppressed partner, sex workers, others per criteria." },
      { label: "Renal function acceptable", detail: "eGFR ≥60 mL/min/1.73 m². TDF can cause renal toxicity; lower eGFR needs specialist." },
      { label: "Hepatitis B status known and managed", detail: "PrEP also treats Hep B; if undiagnosed Hep B, stopping PrEP causes flare. Test and counsel before starting." },
      { label: "Engaged with sexual-health service for ongoing monitoring", detail: "3-monthly HIV testing, STI screening, renal monitoring is mandatory." },
      { label: "Patient understands the regimen and adherence requirements", detail: "Particularly for event-based dosing — strict timing." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer specialist", tone: "danger", message: "These need specialist HIV/GUM input.", detail: [
      "HIV-positive or seroconversion suspected (fever, rash, lymphadenopathy in recent weeks).",
      "eGFR <60 — TDF-FTC not appropriate; specialist may use TAF-FTC (Descovy) but specialist-led.",
      "Untreated Hep B without specialist plan — PrEP may treat Hep B but stopping triggers severe flare; specialist coordination essential.",
      "Pregnancy or breastfeeding — discuss with specialist; not absolute contraindication but specialist input needed.",
      "Active opportunistic infection or significant comorbidity.",
      "Concurrent nephrotoxic drugs.",
      "Patient unable to attend 3-monthly monitoring.",
      "Significant osteoporosis — TDF associated with mild BMD reduction; consider TAF in specialist context.",
    ]},
    { id: "regimens", type: "comparison", title: "Dosing regimens", intro: "Daily for everyone; event-based only for MSM with specific patterns.", columns: [
      { label: "Daily (everyone)", rows: [
        { heading: "Dose", body: "TDF-FTC (245 mg / 200 mg) one tablet once daily, same time daily." },
        { heading: "Time to protection", body: "MSM (anal sex): 7 days of daily dosing. Vaginal sex: 21 days. Use other protection during ramp-up." },
        { heading: "Stopping", body: "Continue 28 days after last exposure before stopping completely." },
      ]},
      { label: "Event-based '2-1-1' (MSM only)", rows: [
        { heading: "Pre-load", body: "2 tablets, 2–24 hours before anticipated sex." },
        { heading: "Continuation", body: "1 tablet 24 hours after pre-load, 1 tablet 24 hours after that. Continue 1 daily until 48h after last sex." },
        { heading: "Not for", body: "Heterosexual men or women, trans women, anyone with frequent or unpredictable sex (daily simpler in that case)." },
        { heading: "Counselling", body: "Strict timing — late pre-load reduces efficacy. Requires anticipation of sex 2–24 hours ahead." },
      ]},
    ]},
    { id: "monitoring", type: "checklist", title: "Monitoring", intro: "Non-negotiable per BHIVA.", items: [
      { label: "Baseline (before starting)", detail: "HIV test (4th-gen), syphilis serology, chlamydia/gonorrhoea NAAT, Hep B (HBsAg, anti-HBs, anti-HBc), Hep C antibody, renal function (creatinine, eGFR), pregnancy test if appropriate." },
      { label: "1-month follow-up", detail: "HIV test (catches very recent infection), creatinine, adherence review." },
      { label: "3-monthly thereafter", detail: "HIV test, creatinine, STI screen (chlamydia/gonorrhoea, syphilis annually or more often per risk), adherence review." },
      { label: "Annual", detail: "Hep C screen, full bone health review if indicated." },
      { label: "Discontinuation", detail: "When patient no longer at risk. Tail off with 28 days additional dosing after last exposure." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "PrEP is for HIV prevention only", detail: "Doesn't protect against other STIs. Condom use still important for STI prevention." },
      { label: "Adherence is critical", detail: "Daily: take same time daily. Event-based MSM: strict 2-1-1 timing. Missed doses reduce efficacy significantly." },
      { label: "Time to protection", detail: "Use additional protection (condoms) until protection established (7 days for MSM, 21 days for vaginal sex)." },
      { label: "STI testing alongside", detail: "Mandatory 3-monthly. PrEP often increases sexual activity / partner change, so STI surveillance becomes more important." },
      { label: "Side effects", detail: "Mild GI upset, headache, fatigue early on, usually settles. Rare: renal toxicity, mild BMD reduction. Monitor renal function." },
      { label: "Drug interactions", detail: "Nephrotoxic drugs (NSAIDs chronic, certain antibiotics) need caution. Some HIV-positive partners' antivirals interact." },
      { label: "Seroconversion symptoms", detail: "Fever, sore throat, rash, lymphadenopathy in early weeks — STOP PrEP, test for HIV urgently. Continuing PrEP through seroconversion risks resistance." },
      { label: "PEP if exposure while not on PrEP", detail: "If patient pauses PrEP and has high-risk exposure, PEP within 72 hours." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "TDF-FTC daily OR event-based 2-1-1 (MSM only).",
      "Baseline HIV test mandatory; 3-monthly thereafter.",
      "Renal function check baseline and 3-monthly.",
      "Hep B status known and coordinated.",
      "Time to protection: 7 days (anal) or 21 days (vaginal).",
      "PrEP for HIV only — condoms for other STIs.",
      "Specialist input for pregnancy, low eGFR, Hep B.",
    ]},
  ],
  quiz: [
    { id: "q-hiv-test", type: "single-choice", critical: true, question: "Patient wants to start PrEP. Last HIV test 8 weeks ago, negative. Action?", options: [
      { id: "a", label: "Start PrEP." }, { id: "b", label: "Repeat HIV test before initiation — test within 4 weeks of starting is required. Starting PrEP in undiagnosed HIV risks resistance." }, { id: "c", label: "Half dose." }, { id: "d", label: "Skip baseline." }
    ], correctOptionIds: ["b"], explanation: "Must have current HIV-negative status (within 4 weeks). Starting PrEP during seroconversion creates antiretroviral resistance." },
    { id: "q-event-based-heterosexual", type: "single-choice", critical: true, question: "Heterosexual woman wants event-based PrEP. Action?", options: [
      { id: "a", label: "Initiate 2-1-1 event-based." }, { id: "b", label: "Event-based 2-1-1 is licensed/recommended for MSM only — pharmacokinetic differences mean vaginal tissue needs longer drug exposure. Initiate DAILY PrEP for her instead." }, { id: "c", label: "Half doses." }, { id: "d", label: "Refuse all PrEP." }
    ], correctOptionIds: ["b"], explanation: "Event-based 2-1-1 only for MSM. Vaginal tissue achieves protective drug levels more slowly. Daily PrEP for heterosexual women, trans women." },
    { id: "q-renal", type: "single-choice", critical: true, question: "Patient eligible for PrEP, eGFR 52. Action?", options: [
      { id: "a", label: "Start TDF-FTC." }, { id: "b", label: "Refer specialist — eGFR <60 may need TAF-FTC (Descovy) or close monitoring. TDF is renally cleared and can worsen renal function." }, { id: "c", label: "Half dose." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "eGFR <60 = specialist review. TAF-FTC is gentler on kidneys, available via specialist." },
    { id: "q-hep-b", type: "single-choice", critical: true, question: "Patient has chronic Hep B (HBsAg positive). Wants PrEP. Action?", options: [
      { id: "a", label: "Start as normal." }, { id: "b", label: "Refer to specialist (HIV / hepatology). PrEP TDF-FTC is also active against Hep B. If PrEP is stopped or doses missed, severe Hep B flare can occur. Needs specialist coordination." }, { id: "c", label: "Half dose." }, { id: "d", label: "Avoid PrEP." }
    ], correctOptionIds: ["b"], explanation: "Active Hep B + PrEP needs specialist coordination — stopping PrEP can trigger severe hepatitis flare." },
    { id: "q-time-to-protection", type: "single-choice", question: "MSM patient starts daily PrEP today, planning condomless anal sex this weekend. Action?", options: [
      { id: "a", label: "Protection immediate." }, { id: "b", label: "Counsel: 7 days of daily dosing before protection established for anal sex. Use condoms or delay sex until day 7. Alternative: 2-1-1 event-based with proper pre-loading 2–24 hours before." }, { id: "c", label: "3 days enough." }, { id: "d", label: "Immediate at higher dose." }
    ], correctOptionIds: ["b"], explanation: "Ramp-up to protection: 7 days for anal, 21 days for vaginal. Condoms or delay until then. Or use event-based pre-loading for MSM." },
    { id: "q-seroconversion", type: "single-choice", question: "Patient on PrEP 3 weeks has fever, sore throat, generalised rash. Action?", options: [
      { id: "a", label: "Continue PrEP — common viral illness." }, { id: "b", label: "Suspect acute HIV seroconversion. Stop PrEP and test for HIV urgently (4th-generation antigen test plus consider HIV viral load). Continuing PrEP through seroconversion creates resistance." }, { id: "c", label: "Double PrEP dose." }, { id: "d", label: "Antibiotic." }
    ], correctOptionIds: ["b"], explanation: "Seroconversion symptoms in someone recently HIV-exposed and on PrEP must be ruled out with urgent testing. Continuing PrEP in active infection creates resistance to first-line agents." },
    { id: "q-monitoring", type: "single-choice", question: "How often should monitoring occur on PrEP?", options: [
      { id: "a", label: "Annually." }, { id: "b", label: "3-monthly: HIV, creatinine, STI screen, adherence review. Plus 1-month early review after starting. Plus annual Hep C and review of any specific factors." }, { id: "c", label: "Once at 6 months." }, { id: "d", label: "Only if symptoms." }
    ], correctOptionIds: ["b"], explanation: "BHIVA standards: 3-monthly monitoring is non-negotiable. Plus 1-month early check." },
    { id: "q-stop-tail", type: "single-choice", question: "Patient on PrEP wants to stop — no longer at risk. Action?", options: [
      { id: "a", label: "Stop immediately." }, { id: "b", label: "Continue PrEP for 28 days after last potential exposure (tail dose). Then stop. Final HIV test at 3 months after stopping." }, { id: "c", label: "Stop after one more dose." }, { id: "d", label: "Stop and tail with lower dose." }
    ], correctOptionIds: ["b"], explanation: "28-day tail prevents undetected seeded infection. Final HIV test at 3 months catches very late seroconversion." },
    { id: "q-condom", type: "single-choice", question: "Patient asks if she can stop using condoms now she's on PrEP.", options: [
      { id: "a", label: "Yes, fully protected." }, { id: "b", label: "PrEP protects against HIV only. Condom use is still recommended for other STIs (chlamydia, gonorrhoea, syphilis, Hep B, HPV) and pregnancy prevention. Counsel honestly." }, { id: "c", label: "Yes, plus another contraceptive." }, { id: "d", label: "Yes for genital sex only." }
    ], correctOptionIds: ["b"], explanation: "PrEP is HIV-specific. STI rates often rise on PrEP without condom counselling. Be honest about scope of protection." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Eligibility category (BHIVA criteria), baseline tests done (HIV, Hep B/C, renal, STI), regimen chosen (daily or 2-1-1), monitoring plan, counselling delivered — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "PrEP is one of the most data-rich PGDs — full structured record with baseline tests and monitoring schedule." },
  ],
};
