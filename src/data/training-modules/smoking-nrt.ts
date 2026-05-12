// Smoking cessation — NRT PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const smokingNrtModule: TrainingModule = {
  slug: "smoking-nrt",
  title: "Smoking Cessation (NRT) — PGD",
  description: "Selection and supply of nicotine replacement therapy for smoking cessation under PGD.",
  pgdSlugs: ["smoking-nrt"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "NRT — Training", subtitle: "Selecting and supplying nicotine replacement therapy", estimatedMinutes: 10, objectives: [
      "Choose appropriate NRT form(s) based on smoking pattern and patient preference.",
      "Apply combination therapy (patch + short-acting) for high-dependence smokers.",
      "Counsel on duration, side effects, and combining with behavioural support.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "NRT delivers nicotine without the carcinogens and CO of tobacco smoke. Doubles abstinence rates vs placebo when combined with behavioural support. Available OTC; this PGD covers structured supply alongside pharmacy-based smoking cessation service.",
      "Two main categories: long-acting (patches — steady background) and short-acting (gum, lozenges, inhalators, mouth spray, nasal spray — for breakthrough cravings).",
      "Combination NRT (patch + short-acting) is more effective than single product and is the modern standard for moderate-to-heavy smokers.",
    ], highlights: ["Combination NRT (patch + short-acting) > single product.", "Choose short-acting based on patient preference and lifestyle.", "12-week course minimum; can extend if needed."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Aged 12+", detail: "Under 12 — refer. 12–17 has dose adjustments and parental consent considerations." },
      { label: "Smoker motivated to quit", detail: "Has set a quit date; engaged with behavioural support." },
      { label: "Pregnant / breastfeeding — refer or supply with discussion", detail: "NRT is preferred over smoking in pregnancy. GP / specialist stop-smoking-in-pregnancy service usually leads — but PGD supply is acceptable in some protocols with proper counselling." },
      { label: "No absolute contraindications (next slide)", detail: "Recent cardiac event needs caution." },
      { label: "Engaged with behavioural support", detail: "Mandatory alongside." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "Cautions and refer-points", tone: "warning", message: "Refer or use with caution.", detail: [
      "Recent MI, stroke, or unstable angina (within 4 weeks) — refer, although NRT is still preferable to smoking.",
      "Severe cardiac arrhythmia — refer.",
      "Children under 12.",
      "Phaeochromocytoma — refer.",
      "Active duodenal ulcer — caution with oral NRT (gum, lozenge).",
      "Hypersensitivity to nicotine or excipients.",
      "Generalised dermatitis — patches problematic.",
    ]},
    { id: "selection", type: "comparison", title: "NRT selection", intro: "Match form to smoking pattern.", columns: [
      { label: "Patches (long-acting)", rows: [
        { heading: "Use", body: "Background steady nicotine. 24h or 16h patches. Apply to clean dry hairless skin; rotate sites." },
        { heading: "Dosing by intake", body: ">20 cigarettes/day: 21 mg/24h. 10–20/day: 14 mg/24h. <10/day: 7 mg/24h. Step down every 4–6 weeks." },
        { heading: "Counselling", body: "Skin irritation common — rotate sites; remove if vivid dreams from 24h patch (switch to 16h)." },
      ]},
      { label: "Short-acting (gum/lozenge/inhalator/spray)", rows: [
        { heading: "Use", body: "Breakthrough cravings, triggers, social situations. Patient preference often deciding factor." },
        { heading: "Strengths", body: "Gum: 2 mg (light smoker), 4 mg (heavy). Lozenge: 1.5 mg / 4 mg. Mouth spray: 1 mg/spray. Inhalator: 10 mg/cartridge. Nasal spray fastest delivery, less acceptable for most." },
        { heading: "Counselling", body: "Gum: park-and-chew technique. Lozenge: dissolve, no chewing. Spray: don't inhale; let absorb in mouth. Avoid acidic drinks (coffee, fruit juice, soft drinks) 15 min before/during." },
      ]},
      { label: "Combination (patch + short-acting)", rows: [
        { heading: "When", body: "Moderate-heavy smokers, history of failed single-product attempts, high dependence (smoke within 30 min of waking, ≥20/day)." },
        { heading: "How", body: "Standard patch + short-acting PRN for breakthrough cravings." },
        { heading: "Evidence", body: "Significantly more effective than single product. 2026 default recommendation for most adult smokers." },
      ]},
    ]},
    { id: "duration", type: "checklist", title: "Duration and step-down", intro: "Standard 12-week course; can extend.", items: [
      { label: "Quit day", detail: "Same day as starting patch. (Some protocols allow 'pre-quit' use 1–2 weeks before to reduce cigarettes.)" },
      { label: "Step down (patches)", detail: "Reduce patch strength every 4–6 weeks. e.g. 21 mg → 14 mg → 7 mg over ~12 weeks." },
      { label: "Continue short-acting", detail: "Available throughout 12 weeks for breakthrough cravings." },
      { label: "Extension beyond 12 weeks", detail: "Acceptable if patient still using and benefiting. Better than relapse." },
      { label: "Tapering off", detail: "Gradual reduction in patch strength and short-acting frequency. No abrupt cessation needed." },
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Quit day arrangement", detail: "Patient sets and commits to quit day. Patches and short-acting start that day." },
      { label: "Behavioural support is essential", detail: "Doubles success. Refer to stop-smoking service or provide pharmacy service." },
      { label: "Patch side effects", detail: "Mild skin irritation (rotate site). Vivid dreams with 24h patch (switch to 16h). Headache (usually settles)." },
      { label: "Short-acting side effects", detail: "Gum: jaw ache, hiccups. Lozenge: throat irritation. Inhalator: cough. Spray: throat/oral irritation." },
      { label: "Avoid acidic drinks with oral NRT", detail: "Coffee, fruit juice, soft drinks reduce nicotine absorption. Wait 15 min before/during oral NRT use." },
      { label: "Slip vs relapse", detail: "One cigarette = slip, not failure. Continue NRT, re-engage with quit plan. Counsel forgivingly." },
    ]},
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Combination NRT (patch + short-acting) is preferred for most adult smokers.",
      "Match patch strength to cigarettes/day; step down every 4–6 weeks.",
      "Short-acting form is patient preference — gum, lozenge, inhalator, spray.",
      "Behavioural support mandatory.",
      "NRT preferable to smoking in pregnancy with discussion; GP/specialist service usually leads.",
      "Standard 12 weeks; extension acceptable.",
    ]},
  ],
  quiz: [
    { id: "q-combination", type: "single-choice", critical: true, question: "Heavy smoker (25/day), failed single-product NRT before. Best approach?", options: [
      { id: "a", label: "Patch only." }, { id: "b", label: "Combination NRT — patch + short-acting (gum/lozenge/spray) for breakthrough. More effective than single product." }, { id: "c", label: "Short-acting only." }, { id: "d", label: "Refer." }
    ], correctOptionIds: ["b"], explanation: "Combination NRT is more effective and the modern default for moderate-heavy smokers. Single product is undertreatment." },
    { id: "q-recent-mi", type: "single-choice", critical: true, question: "Patient had MI 2 weeks ago, still wants to quit. Action?", options: [
      { id: "a", label: "Supply NRT." }, { id: "b", label: "Refer to cardiac rehab / GP. Recent MI (≤4 weeks) is a caution for NRT; specialist guidance preferred — though NRT is still safer than continued smoking." }, { id: "c", label: "Refuse all help." }, { id: "d", label: "Supply at half dose." }
    ], correctOptionIds: ["b"], explanation: "Recent cardiac event requires specialist input. NRT is safer than continued smoking, but the assessment of when and how to initiate is GP/cardiology." },
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman wants help to quit smoking. Action?", options: [
      { id: "a", label: "Supply patches." }, { id: "b", label: "Refer to GP / midwife / specialist stop-smoking-in-pregnancy service. NRT is preferred over continued smoking but pregnancy management has specific protocols (e.g. 16h patches, intermittent NRT)." }, { id: "c", label: "Refuse all help." }, { id: "d", label: "Combination NRT." }
    ], correctOptionIds: ["b"], explanation: "Pregnancy has specific stop-smoking pathways. NRT is supported (better than smoking) but specialist-led to balance dose, form, and behavioural support." },
    { id: "q-patch-strength", type: "single-choice", question: "Patient smokes 25/day. Patch strength?", options: [
      { id: "a", label: "7 mg/24h." }, { id: "b", label: "21 mg/24h (or 25 mg/16h equivalent). >20/day = highest strength." }, { id: "c", label: "14 mg/24h." }, { id: "d", label: "No patch needed." }
    ], correctOptionIds: ["b"], explanation: ">20/day cigarettes warrants the highest-strength patch. Step down every 4–6 weeks." },
    { id: "q-acidic", type: "single-choice", question: "Why should oral NRT (gum/lozenge) be separated from coffee or fruit juice?", options: [
      { id: "a", label: "Improves taste." }, { id: "b", label: "Acidic drinks lower oral pH and reduce buccal nicotine absorption. Wait 15 minutes before/during oral NRT." }, { id: "c", label: "No reason." }, { id: "d", label: "Avoid GI irritation." }
    ], correctOptionIds: ["b"], explanation: "Buccal absorption of nicotine is pH-dependent. Acidic drinks reduce absorption significantly." },
    { id: "q-gum-technique", type: "single-choice", question: "Correct nicotine gum technique?", options: [
      { id: "a", label: "Chew continuously throughout." }, { id: "b", label: "Park-and-chew: chew slowly until tingling, then park gum against cheek; resume when tingling fades. Avoid swallowing nicotine-rich saliva." }, { id: "c", label: "Swallow after chewing." }, { id: "d", label: "Chew like ordinary gum." }
    ], correctOptionIds: ["b"], explanation: "Standard nicotine gum technique: slow chew, park, resume. Continuous chewing causes too-fast absorption with side effects (nausea, hiccups) and swallowed nicotine that's wasted." },
    { id: "q-behavioural", type: "single-choice", question: "Patient declines behavioural support. Action?", options: [
      { id: "a", label: "Refuse to supply NRT." }, { id: "b", label: "Counsel firmly on behavioural-support benefit (doubles success) — then supply if she still insists, documenting her decision. Pharmacotherapy-only is better than nothing but suboptimal." }, { id: "c", label: "Supply double dose." }, { id: "d", label: "Refer to GP." }
    ], correctOptionIds: ["b"], explanation: "Behavioural support doubles success. Counsel firmly. If she still declines, NRT alone is acceptable — better than smoking — but document and continue to offer support at follow-ups." },
    { id: "q-step-down", type: "single-choice", question: "Patient has been on 21 mg patch for 6 weeks. Next step?", options: [
      { id: "a", label: "Stop patch entirely." }, { id: "b", label: "Step down to 14 mg patch (next strength down). Reassess in 4–6 weeks." }, { id: "c", label: "Increase to 25 mg patch." }, { id: "d", label: "Continue same dose indefinitely." }
    ], correctOptionIds: ["b"], explanation: "Standard step-down: every 4–6 weeks, drop one strength. Sudden cessation can trigger withdrawal and relapse." },
    { id: "q-vivid-dreams", type: "single-choice", question: "Patient reports vivid dreams on 21 mg/24h patch. Suggestion?", options: [
      { id: "a", label: "Stop NRT." }, { id: "b", label: "Switch to 25 mg/16h patch (worn during waking hours only) — eliminates the nicotine spike at sleep onset that causes vivid dreams." }, { id: "c", label: "Increase dose." }, { id: "d", label: "Use multiple patches." }
    ], correctOptionIds: ["b"], explanation: "16-hour patches are the standard solution for vivid dreams or sleep disturbance from 24-hour patches." },
    { id: "q-record", type: "single-choice", question: "Documentation?", options: [
      { id: "a", label: "Label." }, { id: "b", label: "Cigarettes per day, time-to-first-cigarette (dependence marker), products chosen and rationale, quit day, behavioural support arrangement — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text." }
    ], correctOptionIds: ["b"], explanation: "Structured record captures dependence level, chosen regimen, and behavioural support arrangement — the audit essentials." },
  ],
};
