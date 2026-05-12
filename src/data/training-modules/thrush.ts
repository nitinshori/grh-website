// Thrush (vulvovaginal candidiasis) — PGD training
//
// DRAFT — pending clinical sign-off by Dr Nitin Shori.

import type { TrainingModule } from "./types";

export const thrushModule: TrainingModule = {
  slug: "thrush",
  title: "Thrush (Vulvovaginal Candidiasis) — PGD",
  description: "Eligibility and agent choice for fluconazole or topical clotrimazole for VVC under PGD.",
  pgdSlugs: ["thrush"],
  authoredBy: "Get Real Health Clinical Team",
  reviewedBy: "DRAFT — pending clinical sign-off",
  version: "1.0.0",
  materialClinicalChange: true,
  publishedAt: "2026-05-12",
  estimatedMinutes: 10,
  passMark: 0.8,
  slides: [
    { id: "intro", type: "intro", title: "Thrush — Training", subtitle: "Vulvovaginal candidiasis in adult non-pregnant women", estimatedMinutes: 10, objectives: [
      "Recognise classic thrush and differentiate from BV, trichomoniasis, and dermatitis.",
      "Identify women eligible for fluconazole or topical clotrimazole supply.",
      "Counsel on recurrence, partner treatment, and when to refer.",
    ]},
    { id: "background", type: "content", title: "Clinical background", body: [
      "Vulvovaginal candidiasis (thrush) is typically caused by Candida albicans. Classic features: thick white curdy ('cottage cheese') discharge, vulval itch, irritation, dysuria (external/superficial), redness, dyspareunia.",
      "Risk factors: recent antibiotics, diabetes, pregnancy, immunosuppression, OCP, tight synthetic clothing.",
      "Not an STI but can be transmitted sexually; partner treatment generally not required.",
    ], highlights: ["Thick curdy discharge + itch + redness = classic thrush.", "Thin grey discharge + fishy odour = BV, not thrush.", "Recurrent thrush (≥4/year) needs GP workup, not repeat PGD supply."] },
    { id: "eligibility", type: "checklist", title: "Eligibility", intro: "Supply only if ALL apply:", items: [
      { label: "Female, aged 16–60", detail: "Outside this range refer." },
      { label: "Symptoms typical of thrush", detail: "Itch, curdy discharge, vulval redness. Symptoms <7 days." },
      { label: "Not pregnant, not breastfeeding", detail: "Fluconazole contraindicated. Topical clotrimazole acceptable in pregnancy but refer to midwife/GP." },
      { label: "Not had ≥4 episodes in past 12 months", detail: "Recurrent thrush needs GP workup (diabetes, Candida glabrata, etc.)." },
      { label: "No pelvic pain, fever, or bleeding", detail: "Refer." },
      { label: "Not pre-pubescent or post-menopausal with first thrush", detail: "Atrophic vaginitis presents similarly in post-menopausal women — refer." },
    ]},
    { id: "absolute-contraindications", type: "callout", title: "When NOT to supply", tone: "danger", message: "Refer to GP if any apply.", detail: [
      "Pregnancy (fluconazole) or breastfeeding without specialist advice.",
      "Recurrent (≥4 episodes/12 months) — needs workup.",
      "Pelvic pain, fever, abnormal bleeding.",
      "First episode in post-menopausal woman not on HRT.",
      "Concurrent use of drugs interacting with fluconazole (statins — esp. simvastatin, warfarin, sulphonylureas, ciclosporin, tacrolimus, sirolimus, certain antipsychotics) — caution or refer.",
      "Severe hepatic impairment (fluconazole).",
      "Known hypersensitivity.",
    ]},
    { id: "agents", type: "comparison", title: "Treatment options", intro: "Oral or topical, similar efficacy. Patient preference.", columns: [
      { label: "Fluconazole 150 mg oral single dose", rows: [
        { heading: "Pros", body: "Single oral dose, convenient, well-tolerated." },
        { heading: "Cons", body: "Drug interactions; not in pregnancy." },
        { heading: "Counselling", body: "Symptoms improve in 24–48 hours. May cause mild headache, nausea, dizziness. Single dose only." },
      ]},
      { label: "Clotrimazole 500 mg pessary single dose (or 200 mg x3 nights)", rows: [
        { heading: "Pros", body: "Topical, suitable in pregnancy (with GP/midwife approval), avoids drug interactions." },
        { heading: "Cons", body: "Pessary insertion required." },
        { heading: "Counselling", body: "Insert at bedtime. Symptoms improve in 1–3 days. May weaken latex condoms — use non-latex for 5 days." },
      ]},
      { label: "Combination — oral + topical cream", rows: [
        { heading: "When", body: "Severe external irritation needing topical relief." },
        { heading: "Use", body: "Fluconazole 150 mg single dose + clotrimazole 1% cream BD to vulva for 7 days." },
        { heading: "Counselling", body: "Cream weakens latex condoms; use non-latex." },
      ]},
    ]},
    { id: "counselling", type: "checklist", title: "Counselling", items: [
      { label: "Expected timeline", detail: "Symptoms typically improve in 24–48 hours; full resolution by 3–7 days." },
      { label: "Recurrence prevention", detail: "Cotton underwear, avoid tight synthetic clothing, plain water externally, avoid douching and scented products. After antibiotics, prophylactic probiotic acceptable (limited evidence)." },
      { label: "Partner treatment", detail: "Not required unless partner symptomatic. If male partner has balanitis, OTC clotrimazole cream BD x7 days." },
      { label: "Condom interaction", detail: "Clotrimazole cream weakens latex condoms — non-latex or abstain during and 5 days after." },
      { label: "Refer if", detail: "No improvement at 7 days, recurrent (≥4/year), pregnancy, persistent symptoms, or new symptoms (pelvic pain, bleeding)." },
      { label: "Diabetes", detail: "Recurrent thrush can be a marker of undiagnosed/poorly controlled diabetes; consider HbA1c via GP if recurrent." },
    ]},
    { id: "red-flags", type: "callout", title: "Refer", tone: "danger", message: "These warrant GP / GUM clinic referral, not thrush supply.", detail: [
      "Recurrent (≥4 in 12 months).",
      "First-presentation post-menopausal.",
      "Pelvic pain, fever, abnormal bleeding.",
      "Failure to improve after a full treatment course.",
      "Suspicion of STI (recent UPSI, new partner, partner with symptoms, urethritis).",
      "Pregnancy — refer to midwife/GP.",
    ]},
    { id: "case-1", type: "case", title: "Case 1 — straightforward", scenario: "Lucy, 26, completed a 5-day antibiotic course for cellulitis 3 days ago. Now has vulval itch and thick white discharge for 2 days. Not pregnant (IUS). No relevant medication.",
      question: "Supply?", answer: "Fluconazole 150 mg single dose. Counsel on expected resolution in 24–48 hours, hygiene measures, and to return if no improvement at 7 days. Acknowledge antibiotic-induced thrush is common.",
      rationale: "Post-antibiotic thrush is the classic presentation. Single-dose fluconazole is convenient and effective." },
    { id: "summary", type: "summary", title: "Key points", keyPoints: [
      "Itch + curdy discharge + redness = thrush.",
      "Refer if recurrent (≥4/yr), pregnant, post-menopausal first episode, pelvic pain, no improvement at 7 days.",
      "Fluconazole 150 mg single dose OR clotrimazole pessary, similar efficacy.",
      "Pregnancy — topical clotrimazole only, refer.",
      "Check drug interactions for fluconazole (statins, warfarin, etc.).",
      "Clotrimazole cream weakens latex condoms.",
    ]},
  ],
  quiz: [
    { id: "q-pregnancy", type: "single-choice", critical: true, question: "Pregnant woman with thrush. Action?", options: [
      { id: "a", label: "Fluconazole 150 mg single dose." }, { id: "b", label: "Refer to midwife/GP. Topical clotrimazole pessary may be appropriate but should be initiated by midwife/GP in pregnancy." }, { id: "c", label: "Clotrimazole 500 mg pessary." }, { id: "d", label: "Reassure — pregnancy resolves thrush." }
    ], correctOptionIds: ["b"], explanation: "Fluconazole is contraindicated in pregnancy (especially first trimester). Topical clotrimazole is the pregnancy-safe option but should be managed by midwife/GP." },
    { id: "q-recurrent", type: "single-choice", critical: true, question: "Patient says this is her 5th thrush episode this year. Action?", options: [
      { id: "a", label: "Supply fluconazole." }, { id: "b", label: "Refer to GP — recurrent thrush (≥4/year) needs workup for underlying cause (diabetes, immune issues, atypical Candida species)." }, { id: "c", label: "Supply double dose." }, { id: "d", label: "Supply both oral and topical." }
    ], correctOptionIds: ["b"], explanation: "Recurrent thrush requires GP workup. May be diabetes, Candida glabrata (azole-resistant), or other factor." },
    { id: "q-interaction-warfarin", type: "single-choice", critical: true, question: "Patient on warfarin wants fluconazole for thrush. Action?", options: [
      { id: "a", label: "Supply normally." }, { id: "b", label: "Use topical clotrimazole instead. Fluconazole significantly raises INR via warfarin interaction; refer to GP if topical alternative not acceptable." }, { id: "c", label: "Supply at half dose." }, { id: "d", label: "Supply with extra warfarin monitoring." }
    ], correctOptionIds: ["b"], explanation: "Fluconazole significantly increases warfarin levels (INR rise). Topical clotrimazole avoids the interaction. If oral is essential, GP must be informed and INR monitored." },
    { id: "q-post-meno", type: "single-choice", critical: true, question: "60-year-old post-menopausal woman, first thrush-like episode. Vaginal soreness, thin discharge, dysuria. Action?", options: [
      { id: "a", label: "Supply fluconazole." }, { id: "b", label: "Refer to GP — first-presentation thrush-like symptoms in post-menopausal women may be atrophic vaginitis, urinary infection, or other pathology." }, { id: "c", label: "Supply clotrimazole pessary." }, { id: "d", label: "Supply oestrogen cream." }
    ], correctOptionIds: ["b"], explanation: "Atrophic vaginitis mimics thrush in post-menopausal women. GP can distinguish and treat appropriately (often with vaginal oestrogen). Don't presumptively treat as thrush." },
    { id: "q-differential", type: "single-choice", question: "Patient describes thin grey discharge with fishy odour, minimal itch. Action?", options: [
      { id: "a", label: "Supply fluconazole — thrush is most common." }, { id: "b", label: "Likely BV, not thrush. Supply BV treatment if eligible under BV PGD, not thrush." }, { id: "c", label: "Supply both treatments." }, { id: "d", label: "Refer immediately." }
    ], correctOptionIds: ["b"], explanation: "Grey discharge + odour without itch is classic BV, not thrush. Switch to BV PGD." },
    { id: "q-condoms", type: "single-choice", question: "Patient supplied clotrimazole cream. What condom advice?", options: [
      { id: "a", label: "Latex condoms unaffected." }, { id: "b", label: "Clotrimazole cream weakens latex condoms. Non-latex (polyurethane) or abstain during use and 5 days after." }, { id: "c", label: "Use 2 latex condoms." }, { id: "d", label: "Add spermicide." }
    ], correctOptionIds: ["b"], explanation: "Topical antifungal creams have an oil base that weakens latex. Non-latex barrier or abstinence during and 5 days post-course." },
    { id: "q-no-improvement", type: "single-choice", question: "Patient took fluconazole 7 days ago, no improvement. Action?", options: [
      { id: "a", label: "Take another fluconazole." }, { id: "b", label: "Refer to GP — failure of single-dose fluconazole suggests alternative diagnosis (BV, atypical Candida, dermatitis) or resistance." }, { id: "c", label: "Add clotrimazole cream." }, { id: "d", label: "Reassure and wait." }
    ], correctOptionIds: ["b"], explanation: "Failure to improve needs GP review. Possible azole-resistant Candida glabrata, BV mistaken for thrush, or dermatitis." },
    { id: "q-partner", type: "single-choice", question: "Patient asks if her male partner needs treating.", options: [
      { id: "a", label: "Yes, always." }, { id: "b", label: "No — male partner only if symptomatic (balanitis can be treated with OTC clotrimazole cream)." }, { id: "c", label: "Yes, oral fluconazole for both." }, { id: "d", label: "Only with consent." }
    ], correctOptionIds: ["b"], explanation: "Asymptomatic partners don't need treating. Symptomatic male partners with balanitis: clotrimazole cream BD x7." },
    { id: "q-after-abx", type: "single-choice", question: "Patient often gets thrush after antibiotics. Any prevention?", options: [
      { id: "a", label: "Take daily fluconazole prophylactically." }, { id: "b", label: "Cotton underwear, plain external water, avoid scented products. Probiotic during/after antibiotic course has limited evidence but is reasonable. Recurrent post-antibiotic thrush may warrant prophylactic single fluconazole at the time of next antibiotic course — discuss with GP." }, { id: "c", label: "Take prophylactic antibiotics." }, { id: "d", label: "Avoid antibiotics in future." }
    ], correctOptionIds: ["b"], explanation: "Antibiotic-associated thrush is common. Lifestyle measures and considered prophylactic fluconazole at next antibiotic course can be useful — discuss with GP if patient wants to plan." },
    { id: "q-record", type: "single-choice", question: "Documentation requirements?", options: [
      { id: "a", label: "Label only." }, { id: "b", label: "Symptoms, differential exclusion, drug interactions checked, agent chosen, counselling — in the ePGD tool." }, { id: "c", label: "GP email." }, { id: "d", label: "Free-text note." }
    ], correctOptionIds: ["b"], explanation: "Full structured record. Drug interactions (warfarin, statins especially) and the differential exclusion are the key audit items." },
  ],
};
