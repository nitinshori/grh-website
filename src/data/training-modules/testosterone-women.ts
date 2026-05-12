// Testosterone for women (HSDD adjunct to HRT) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const testosteroneWomenModule: TrainingModule = {
  slug: "testosterone-women",
  title: "Testosterone for Women — PGD",
  description: "Supply of low-dose testosterone gel for menopausal women with HSDD as adjunct to HRT, under PGD.",
  pgdSlugs: ["testosterone-women"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 12,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Testosterone for Women — Training", subtitle: "Low-dose testosterone gel as adjunct to HRT for HSDD", estimatedMinutes: 12, objectives: [
      "Identify menopausal women eligible for adjunctive testosterone therapy per BMS / NICE guidance.",
      "Apply correct off-label dosing using male preparations split to female dose.",
      "Counsel on side effects (virilisation), monitoring, and realistic expectations.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Testosterone in women is supplementary to oestrogen replacement (HRT) for hypoactive sexual desire disorder (HSDD) in menopausal women, when other contributors (relationship, mood, vaginal symptoms, medication) have been addressed and HRT alone hasn't restored libido.",
      "There is no licensed UK female testosterone preparation. Off-label use of male transdermal preparations (e.g. Testogel sachet, Tostran 2% gel) at much lower female doses is standard practice per BMS / NICE menopause guidance.",
      "Target serum testosterone: female physiological range, NOT male range. Excess causes virilisation.",
    ], highlights: ["Adjunct to HRT, not replacement.", "Off-label use — counsel patient.", "Aim female physiological range; avoid virilisation."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Female, 40–65, menopausal or perimenopausal", detail: "Outside this range — refer specialist menopause clinic." },
      { label: "Established on appropriate HRT for ≥3 months", detail: "Testosterone is adjunctive. HRT alone should be tried first — many cases of HSDD improve with oestrogen alone." },
      { label: "Persistent HSDD despite HRT", detail: "Loss of libido causing distress, not explained by relationship factors, mood, vaginal symptoms (vaginal oestrogen tried), or medication." },
      { label: "Baseline blood tests within 6 months", detail: "Free testosterone, SHBG, FSH (to confirm menopausal status), FBC, LFTs." },
      { label: "Free testosterone in the lowest part of the female range or below", detail: "Levels at upper end of female range are unlikely to benefit." },
      { label: "Not pregnant or possibility of pregnancy", detail: "Foetal virilisation risk. Postmenopausal patients only typically." },
      { label: "GP-aware", detail: "Mandatory — coordinate with GP and ideally menopause specialist." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Refer specialist menopause clinic", tone: "danger", message: "Refer for any of these.", detail: [
      "Premenopausal woman with HSDD — testosterone not typically used; multifactorial assessment needed.",
      "Current or past hormone-sensitive cancer (breast, endometrial, ovarian).",
      "Significant cardiovascular disease.",
      "Severe hepatic impairment.",
      "Polycystic ovarian syndrome / pre-existing hyperandrogenism — refer endocrinology.",
      "Pregnancy or any possibility of pregnancy.",
      "Active hirsutism or acne — risk of worsening; specialist input." ,
      "Concurrent androgenic steroids or DHEA — risk of additive effects.",
      "Children or adolescents — never.",
      "Patient has not tried HRT alone for ≥3 months.",
      "Significant relationship / psychosocial factors that should be addressed first.",
      "Specialist menopause clinic input appropriate for complex cases.",
    ]},
    { id: "dosing", type: "checklist", title: "Dosing — off-label", intro: "Standard practice based on BMS guidance.", items: [
      { label: "Testogel 50 mg/5g sachet", detail: "Apply ~one-tenth of a sachet daily (i.e. 0.5 g providing approximately 5 mg testosterone). Apply to lower abdomen or upper thigh." },
      { label: "Tostran 2% (60 mg/3g cannister)", detail: "Apply ~0.5 measure (approximately 5 mg testosterone) daily. Some patients use 0.25 measure." },
      { label: "Female AndroFeme 1% (NHS not routinely available, private import)", detail: "Licensed in Australia for women — 5 mg daily. Some UK patients import via private prescription." },
      { label: "Apply to clean dry skin", detail: "Rotate sites. Avoid breast area to prevent direct breast tissue exposure." },
      { label: "Wait for benefit", detail: "Allow 3–6 months at adequate level before deciding effectiveness. Stop if no benefit at 6 months." },
      { label: "Monitor", detail: "Serum testosterone and SHBG at 3 months — confirm within female range, not above." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Off-label use", detail: "Honest disclosure that this is off-label (no UK female preparation licensed). Standard practice per BMS / NICE NG23 menopause guidance." },
      { label: "Adjunct to HRT", detail: "Doesn't replace HRT. Continue oestrogen (+ progestogen if uterus) as before." },
      { label: "Expectations", detail: "Modest benefit in some women; not all respond. 3–6 months to assess. Stop if no clear benefit." },
      { label: "Side effects to watch", detail: "Acne, increased oily skin, hirsutism (facial/body hair), voice change (rare — discontinue immediately if heard), clitoromegaly (rare). All usually reversible if dose reduced or stopped early." },
      { label: "Skin transfer", detail: "Application site contact can transfer to partner / family — wash hands, cover with clothing, avoid bare skin contact for several hours after application." },
      { label: "Pregnancy avoidance", detail: "Mostly postmenopausal patients but for perimenopausal women, contraception is mandatory due to virilisation risk to a female foetus." },
      { label: "Long-term monitoring", detail: "Annual blood test (testosterone, SHBG, lipids, LFTs). Review benefit annually; stop if no benefit." },
    ]},
    { id: "red-flags", type: "callout", title: "Stop and refer", tone: "danger", message: "Reasons to discontinue.", detail: [
      "Virilisation: voice deepening (urgent), clitoromegaly, significant hirsutism.",
      "Acne flare causing distress.",
      "Suspected pregnancy.",
      "Hepatic dysfunction on LFTs.",
      "New cardiovascular event.",
      "Mood disturbance attributed to testosterone.",
      "No benefit at 6 months — discontinue.",
      "Patient request to stop.",
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Adjunctive to HRT for menopausal HSDD; HRT alone tried for ≥3 months first.",
      "Off-label use of male transdermal preparations at much lower female doses (~5 mg/day).",
      "Aim female physiological range — measure testosterone and SHBG at 3 months.",
      "Side effects: virilisation features — reversible if caught early.",
      "Stop if no benefit at 6 months.",
      "GP coordination and ideally specialist menopause input.",
      "Refer: premenopausal, hormone-sensitive cancer history, severe CVD, significant comorbidity.",
    ]},
  ],
  quiz: [
    { id: "q-licensed", type: "single-choice", critical: true, question: "Is there a UK-licensed testosterone preparation for women?", options: [
      { id: "a", label: "Yes — Tostran is female-licensed." }, { id: "b", label: "No. UK use is off-label, splitting male transdermal preparations to female doses. This must be disclosed to the patient as off-label." }, { id: "c", label: "Yes — Testogel patches." }, { id: "d", label: "Yes — oral tablets." }
    ], correctOptionIds: ["b"], explanation: "No UK-licensed female testosterone product. Off-label use per BMS/NICE guidance. Must disclose to patient." },
    { id: "q-cancer", type: "single-choice", critical: true, question: "Patient with past breast cancer (5 years remission) requests testosterone for HSDD. Action?", options: [
      { id: "a", label: "Supply." }, { id: "b", label: "Refer to oncology / specialist menopause clinic. Past hormone-sensitive cancer is an absolute contraindication under PGD; specialist may consider individual case." }, { id: "c", label: "Half dose." }, { id: "d", label: "Supply with monitoring." }
    ], correctOptionIds: ["b"], explanation: "Hormone-sensitive cancer history is an absolute contraindication. Specialist oncology / menopause clinic decides on case-by-case." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Perimenopausal patient (still occasional periods) wants testosterone. Action?", options: [
      { id: "a", label: "Supply with no contraception discussion." }, { id: "b", label: "Refer specialist OR ensure effective contraception throughout. Testosterone can cause virilisation of female foetus; pregnancy must be excluded and prevented during use." }, { id: "c", label: "Half dose." }, { id: "d", label: "Supply only if married." }
    ], correctOptionIds: ["b"], explanation: "Perimenopausal women can still conceive. Contraception is mandatory due to foetal virilisation risk. Most PGD use is postmenopausal only — specialist input prudent for perimenopausal." },
    { id: "q-hrt-first", type: "single-choice", critical: true, question: "Patient with menopausal symptoms including reduced libido. Not on HRT. Wants testosterone. Action?", options: [
      { id: "a", label: "Supply testosterone." }, { id: "b", label: "Initiate HRT first (per HRT PGD if eligible, or refer GP). Testosterone is ADJUNCTIVE to HRT — HRT alone resolves HSDD in many cases. ≥3 months trial of HRT before adding testosterone." }, { id: "c", label: "Supply both simultaneously." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "HRT alone often resolves HSDD. Testosterone is added only when HRT for ≥3 months has been insufficient." },
    { id: "q-voice", type: "single-choice", critical: true, question: "Patient on testosterone for 4 months reports voice has become deeper. Action?", options: [
      { id: "a", label: "Reassure and continue." }, { id: "b", label: "Stop testosterone immediately. Voice deepening is a serious virilisation effect, often irreversible. Refer GP. Other reversible features (acne, hair) settle with cessation; voice may not." }, { id: "c", label: "Halve dose." }, { id: "d", label: "Continue but monitor." }
    ], correctOptionIds: ["b"], explanation: "Voice change is the virilisation effect most likely to be irreversible. Discontinue immediately and refer. Don't try to reduce — stop." },
    { id: "q-dose", type: "single-choice", question: "Approximate daily testosterone dose for female HSDD?", options: [
      { id: "a", label: "50 mg." }, { id: "b", label: "Approximately 5 mg — one-tenth of a male sachet (Testogel), or 0.5 measure of Tostran 2%." }, { id: "c", label: "25 mg." }, { id: "d", label: "100 mg." }
    ], correctOptionIds: ["b"], explanation: "Female dose is approximately one-tenth of male physiological replacement. Aim female range; male doses cause virilisation." },
    { id: "q-skin-transfer", type: "single-choice", question: "Patient asks about skin transfer to her husband.", options: [
      { id: "a", label: "No risk." }, { id: "b", label: "Wash hands after applying, cover application site with clothing for several hours, avoid skin-to-skin contact at the site for at least 4 hours. Husband won't have significant effect at the low female doses but precautions still apply." }, { id: "c", label: "Apply when no one is home." }, { id: "d", label: "Switch to oral." }
    ], correctOptionIds: ["b"], explanation: "Standard skin-transfer precautions even at low doses — wash hands, cover site, avoid contact. Same as Testogel for men but lower exposure." },
    { id: "q-monitoring", type: "single-choice", question: "How should testosterone level be monitored?", options: [
      { id: "a", label: "Annually only." }, { id: "b", label: "Baseline before starting, 3 months after starting (free T and SHBG), then annually if stable. Aim female physiological range." }, { id: "c", label: "Only if side effects." }, { id: "d", label: "Monthly." }
    ], correctOptionIds: ["b"], explanation: "3-month check confirms levels are in female range, not supra-physiological. Then annual review." },
    { id: "q-no-benefit", type: "single-choice", question: "Patient on testosterone for 6 months, no improvement in HSDD. Action?", options: [
      { id: "a", label: "Increase dose." }, { id: "b", label: "Discontinue. If no benefit at 6 months on adequate dose with confirmed levels in female range, continuation is not justified. Consider other contributors (mood, relationship, vaginal symptoms) and refer GP if HSDD persists." }, { id: "c", label: "Continue indefinitely." }, { id: "d", label: "Switch to oral." }
    ], correctOptionIds: ["b"], explanation: "No benefit at 6 months = discontinue. Don't escalate dose into supra-physiological range. Multifactorial assessment for persistent HSDD." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Menopausal status, HRT regimen confirmed ≥3 months, contributors to HSDD assessed, baseline testosterone, off-label disclosure given, GP-informed status, monitoring plan — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record especially captures that other HSDD contributors were assessed and HRT was tried first. Important because off-label use needs documented justification." },
  ],
};
