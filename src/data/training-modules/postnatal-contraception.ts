// Postnatal contraception — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const postnatalContraceptionModule: TrainingModule = {
  slug: "postnatal-contraception",
  title: "Postnatal Contraception — PGD",
  description: "Supply of progestogen-only or combined oral contraceptives postpartum, considering breastfeeding and VTE risk, under PGD.",
  pgdSlugs: ["postnatal-contraception"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Postnatal Contraception — Training", subtitle: "Selecting contraception in the postpartum period", estimatedMinutes: 12, objectives: [
      "Apply FSRH UKMEC timing rules for combined vs progestogen-only postpartum.",
      "Counsel on lactation considerations and the breakthrough-bleeding pattern.",
      "Recognise patients better served by LARC or specialist services.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Fertility returns rapidly postpartum — sometimes within 3 weeks if not breastfeeding. Contraception planning is part of antenatal/postnatal care.",
      "FSRH UKMEC postpartum timing: Combined hormonal contraception (CHC) avoided until 6 weeks postpartum (VTE risk) in non-breastfeeding, and 6 months in breastfeeding women (effect on milk supply). Progestogen-only methods can start any time including immediately postpartum, including in breastfeeding women.",
      "PGD covers POP and CHC initiation. LARC (implant, IUD, IUS) requires fitting and is specialist service.",
    ], highlights: ["POP safe from day 1 postpartum, including breastfeeding.", "CHC: wait 6 weeks (non-breastfeeding), 6 months (breastfeeding).", "LARC fitting = specialist, not PGD."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Adult, 16+ postpartum patient", detail: "Under 16 — refer with safeguarding considerations." },
      { label: "Postpartum period ≥3 weeks (or starting POP at any time)", detail: "POP can start day 1 onwards. CHC has timing rules — see next slide." },
      { label: "BP within range", detail: "Pre-eclampsia or postpartum hypertension — refer." },
      { label: "No absolute contraindications to chosen method (per UKMEC category 4)", detail: "Especially for CHC: VTE history, migraine with aura, BMI extremes, smoking ≥35." },
      { label: "Has had postnatal review (or arranged)", detail: "GP / midwife / health visitor review covers wider postnatal health." },
      { label: "Considered LARC", detail: "Counsel on LARC as more effective. If LARC preferred, refer for fitting. Don't push CHC/POP if LARC fits patient need." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer", tone: "danger", message: "Refer for any of these.", detail: [
      "Combined contraception (CHC) in first 6 weeks postpartum in non-breastfeeding women — VTE risk.",
      "CHC in breastfeeding women in first 6 months.",
      "Past VTE, current VTE, thrombophilia — CHC contraindicated; POP usually OK; specialist input.",
      "Migraine with aura — CHC contraindicated.",
      "Smoker ≥35 — CHC contraindicated.",
      "BMI >35 with comorbidity — caution with CHC.",
      "Recent severe pre-eclampsia or postpartum hypertension — refer.",
      "Breast cancer — hormonal methods contraindicated; refer.",
      "Active hepatic disease.",
      "Diabetes with vascular complications — caution.",
      "Want LARC — refer for fitting (community sexual health or GP)." ,
      "Postpartum mood disturbance / mental-health concern — refer GP.",
    ]},
    { id: "options", type: "comparison", title: "Options under PGD", intro: "Match to timing and breastfeeding status.", columns: [
      { label: "Progestogen-only pill (POP)", rows: [
        { heading: "Start", body: "Any time postpartum, day 1 onward. Safe in breastfeeding (no effect on milk supply)." },
        { heading: "Choice", body: "Desogestrel 75 mcg OD (12-hour window) is first-line under most PGD. Older POPs (norethisterone, levonorgestrel) have 3-hour window — strict timing." },
        { heading: "Time to protection", body: "If started within 21 days postpartum, immediate. If later, use barrier for 2 days." },
        { heading: "Side effects", body: "Irregular bleeding common — counsel pre-emptively." },
      ]},
      { label: "Combined hormonal contraception (CHC)", rows: [
        { heading: "Start (non-breastfeeding)", body: "From 21 days postpartum if no additional VTE risk factors. From 6 weeks if BMI ≥30, smoker, or other VTE risk." },
        { heading: "Start (breastfeeding)", body: "From 6 months postpartum. Earlier may reduce milk supply." },
        { heading: "Choice", body: "Standard COCP per UKMEC — e.g. 30 mcg ethinylestradiol + levonorgestrel for low VTE risk; lower-dose / different progestogen options exist." },
        { heading: "Counsel", body: "Pill rules, missed-pill back-up, breakthrough bleeding in first 3 months, VTE awareness." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "LARC mention", detail: "Most effective methods (implant, IUD, IUS) per FSRH — always mention as the gold standard. Refer for fitting if preferred." },
      { label: "Breakthrough bleeding", detail: "Common with POP (especially first 3 months). Usually settles. Doesn't reduce efficacy if taken correctly." },
      { label: "Strict timing for POP", detail: "Desogestrel: 12-hour window. Older POPs: 3-hour window. If missed beyond window, take ASAP and use barrier for 2 days." },
      { label: "VTE awareness on CHC", detail: "Leg swelling, pain, breathlessness, chest pain — urgent assessment." },
      { label: "Breastfeeding milk supply", detail: "CHC may reduce milk supply. POP doesn't. Important for women still establishing feeding." },
      { label: "Return of fertility", detail: "Quick — sometimes within 3 weeks. Don't rely on lactational amenorrhoea unless strict LAM criteria met (exclusive breastfeeding, <6 months, no menses)." },
      { label: "Mood awareness", detail: "Postpartum depression risk — distinguish from hormonal mood effects. Encourage 6-week GP postnatal review." },
      { label: "Long-term plan", detail: "Encourage discussion of LARC at next GP/sexual health visit if not done." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "POP (desogestrel) — any time postpartum, safe in breastfeeding.",
      "CHC — 21 days postpartum if non-breastfeeding and low VTE risk; 6 weeks if VTE risk factors; 6 months if breastfeeding.",
      "LARC is more effective — counsel and refer if preferred.",
      "Postpartum hypertension, VTE history, migraine with aura, smoker ≥35 = CHC contraindicated.",
      "Counsel breakthrough bleeding on POP — common, settles.",
      "Quick return of fertility — don't rely on amenorrhoea or LAM unless strict criteria.",
    ]},
  ],
  quiz: [
    { id: "q-chc-non-bf", type: "single-choice", critical: true, question: "Non-breastfeeding woman, 14 days postpartum, no VTE risk factors. Wants COCP. Action?", options: [
      { id: "a", label: "Start COCP today." }, { id: "b", label: "Defer until day 21 postpartum minimum (or day 42 if VTE risk factors). Risk of VTE is elevated in the early postpartum period." }, { id: "c", label: "Start at half dose." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Day 21 is the minimum postpartum CHC start in non-breastfeeding women without VTE risk. VTE risk peaks early postpartum." },
    { id: "q-chc-bf", type: "single-choice", critical: true, question: "Breastfeeding woman 8 weeks postpartum wants COCP. Action?", options: [
      { id: "a", label: "Start COCP." }, { id: "b", label: "Defer or recommend POP. CHC during breastfeeding before 6 months may reduce milk supply. POP is the safer option in lactation." }, { id: "c", label: "Half dose COCP." }, { id: "d", label: "Refuse all contraception." }
    ], correctOptionIds: ["b"], explanation: "Breastfeeding + CHC before 6 months can reduce milk supply. POP is preferred. After 6 months, CHC is acceptable if other criteria met." },
    { id: "q-vte", type: "single-choice", critical: true, question: "Patient had postnatal DVT 3 months ago. Wants contraception. Action?", options: [
      { id: "a", label: "COCP." }, { id: "b", label: "POP is acceptable (UKMEC 2). CHC is contraindicated due to VTE history. Counsel on this and offer POP / discuss LARC." }, { id: "c", label: "Higher-dose COCP." }, { id: "d", label: "No contraception." }
    ], correctOptionIds: ["b"], explanation: "VTE history is absolute contraindication for CHC. POP is safe. LARC options (copper IUD, implant) also fine and often preferred." },
    { id: "q-migraine-aura", type: "single-choice", critical: true, question: "Patient with migraine with aura wants postpartum contraception. Action?", options: [
      { id: "a", label: "COCP at low dose." }, { id: "b", label: "POP or LARC. CHC is contraindicated in migraine with aura (stroke risk). Discuss POP, implant, IUD, IUS." }, { id: "c", label: "COCP with extra precautions." }, { id: "d", label: "Refuse." }
    ], correctOptionIds: ["b"], explanation: "Migraine with aura + CHC = elevated stroke risk. Absolute contraindication. Non-CHC options instead." },
    { id: "q-pop-bf", type: "single-choice", question: "Breastfeeding woman 5 days postpartum wants contraception. Earliest option?", options: [
      { id: "a", label: "COCP." }, { id: "b", label: "Progestogen-only pill (POP) — safe from day 1 onwards in breastfeeding. Doesn't affect milk supply." }, { id: "c", label: "Wait 6 weeks." }, { id: "d", label: "Wait 6 months." }
    ], correctOptionIds: ["b"], explanation: "POP can start immediately postpartum, safe in lactation. Earlier hormonal contraception option." },
    { id: "q-larc", type: "single-choice", question: "Patient asks about the most effective postpartum contraception.", options: [
      { id: "a", label: "COCP — easiest." }, { id: "b", label: "LARC (long-acting reversible contraception) — copper IUD, IUS, implant. >99% effective regardless of user adherence. Counsel and refer for fitting." }, { id: "c", label: "POP." }, { id: "d", label: "Condoms." }
    ], correctOptionIds: ["b"], explanation: "LARC is FSRH first-line recommendation due to efficacy independent of user adherence. Always discuss; refer if patient interested." },
    { id: "q-window", type: "single-choice", question: "Patient on desogestrel POP. How late can she take it after the usual time?", options: [
      { id: "a", label: "3-hour window." }, { id: "b", label: "12-hour window. Desogestrel-containing POPs have a longer 12-hour window than older POPs (norethisterone, levonorgestrel — 3 hours)." }, { id: "c", label: "1-hour window." }, { id: "d", label: "Any time." }
    ], correctOptionIds: ["b"], explanation: "Desogestrel = 12 hours. Older POPs = 3 hours. Critical distinction for missed-pill rules." },
    { id: "q-fertility-return", type: "single-choice", question: "Patient is 5 weeks postpartum, not breastfeeding, has no period yet. Can she be relying on this for contraception?", options: [
      { id: "a", label: "Yes." }, { id: "b", label: "No. Fertility returns rapidly postpartum — can occur before first period. Use contraception even before periods return. Lactational amenorrhoea is only contraceptive under strict LAM criteria (exclusive breastfeeding, <6 months, no menses)." }, { id: "c", label: "Yes for 6 months." }, { id: "d", label: "Yes until next period." }
    ], correctOptionIds: ["b"], explanation: "Postpartum amenorrhoea isn't contraceptive (except in strict LAM). Encourage early contraception initiation." },
    { id: "q-bleeding-pop", type: "single-choice", question: "Patient on POP for 6 weeks reports irregular spotting. Worried efficacy is lost.", options: [
      { id: "a", label: "Switch to COCP." }, { id: "b", label: "Reassure — irregular bleeding is common with POP, especially first 3 months. Doesn't indicate failure if she's taking correctly. Will usually settle." }, { id: "c", label: "Stop POP." }, { id: "d", label: "Add another contraceptive." }
    ], correctOptionIds: ["b"], explanation: "Breakthrough bleeding is common and not an efficacy concern if taken correctly. Pre-emptive counselling prevents premature discontinuation." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Postpartum interval, breastfeeding status, VTE risk factors, method chosen with UKMEC rationale, LARC discussed, counselling delivered — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record demonstrates UKMEC reasoning and LARC discussion. Important for audit." },
  ],
};
